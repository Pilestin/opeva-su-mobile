const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function connectToDatabase() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB_NAME);
    console.log('✅ Connected to MongoDB successfully');
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
    await db.collection('products').createIndex({ product_id: 1 }, { unique: true });
    await db.collection('orders').createIndex({ order_id: 1 }, { unique: true });
    await db.collection('orders').createIndex({ customer_id: 1 });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
}

// Admin Middleware
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için admin yetkisi gereklidir' });
  }
  next();
}

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, email, password, phone_number, address, latitude, longitude } = req.body;

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu email ile kayıtlı kullanıcı zaten var' });
    }

    // Generate user_id
    const userCount = await db.collection('users').countDocuments();
    const user_id = String(userCount + 1);

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      user_id,
      full_name,
      email,
      password_hash,
      phone_number,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      created_at: new Date(),
      last_login: new Date(),
      is_active: false, // Will be approved by admin
      profile_picture: null,
      role: 'customer',
      updated_at: new Date()
    };

    await db.collection('users').insertOne(newUser);

    // Create token
    const token = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Kayıt başarılı! Hesabınız admin onayı bekliyor.',
      token,
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        is_active: newUser.is_active,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }

    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { last_login: new Date() } }
    );

    // Create token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        is_active: user.is_active,
        role: user.role,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { user_id: req.user.user_id },
      { projection: { password_hash: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Kullanıcı bilgileri alınırken hata oluştu' });
  }
});

// ============================================
// PRODUCT ROUTES
// ============================================

// Get all products
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await db.collection('products').find({}).toArray();
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Ürünler alınırken hata oluştu' });
  }
});

// Get product by id
app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await db.collection('products').findOne({ product_id: req.params.id });
    
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Ürün alınırken hata oluştu' });
  }
});

// ============================================
// ORDER ROUTES
// ============================================

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ user_id: req.user.user_id });

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Hesabınız henüz onaylanmamış. Sipariş verebilmek için admin onayı beklemelisiniz.' 
      });
    }

    const { product_id, quantity, ready_time, due_time, order_date, notes } = req.body;

    // Get product
    const product = await db.collection('products').findOne({ product_id });
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Yetersiz stok' });
    }

    // Generate IDs
    const orderCount = await db.collection('orders').countDocuments();
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 5);
    const order_id = `order_${dateStr}_${randomStr}`;
    const task_id = `task_${dateStr}_${randomStr}`;

    // Calculate total price
    const total_price = product.price * quantity;

    // Create order
    const newOrder = {
      customer_id: user.user_id,
      order_id,
      task_id,
      location: {
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude
      },
      ready_time,
      due_time,
      order_date: order_date ? new Date(order_date) : new Date(),
      service_time: 120,
      request: {
        product_id: product.product_id,
        product_name: product.name,
        notes: notes || '',
        quantity,
        demand: product.weight.value * quantity
      },
      assigned_vehicle: 'default_vehicle',
      assigned_route_id: 'default_route',
      created_at: new Date(),
      updated_at: new Date(),
      total_price,
      priority_level: 0,
      change_log: [],
      status: 'planned'
    };

    await db.collection('orders').insertOne(newOrder);

    // Update product stock
    await db.collection('products').updateOne(
      { product_id },
      { $inc: { stock: -quantity } }
    );

    res.status(201).json({
      message: 'Sipariş başarıyla oluşturuldu',
      order: newOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Sipariş oluşturulurken hata oluştu' });
  }
});

// Get user orders
app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await db.collection('orders')
      .find({ customer_id: req.user.user_id })
      .sort({ created_at: -1 })
      .toArray();

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Siparişler alınırken hata oluştu' });
  }
});

// Get all orders (Admin only)
app.get('/api/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const orders = await db.collection('orders')
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Siparişler alınırken hata oluştu' });
  }
});

// Update order status
app.patch('/api/orders/:order_id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { order_id } = req.params;

    const order = await db.collection('orders').findOne({ order_id });
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && order.customer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Bu siparişi güncelleyemezsiniz' });
    }

    // Update order
    await db.collection('orders').updateOne(
      { order_id },
      {
        $set: { status, updated_at: new Date() },
        $push: {
          change_log: {
            field: 'status',
            old_value: order.status,
            new_value: status,
            changed_at: new Date(),
            changed_by: req.user.user_id
          }
        }
      }
    );

    res.json({ message: 'Sipariş durumu güncellendi' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Sipariş durumu güncellenirken hata oluştu' });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Get all users (Admin only)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await db.collection('users')
      .find({}, { projection: { password_hash: 0 } })
      .toArray();

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Kullanıcılar alınırken hata oluştu' });
  }
});

// Approve/reject user (Admin only)
app.patch('/api/admin/users/:user_id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;
    const { user_id } = req.params;

    await db.collection('users').updateOne(
      { user_id },
      { $set: { is_active, updated_at: new Date() } }
    );

    res.json({ message: 'Kullanıcı durumu güncellendi' });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Kullanıcı onaylanırken hata oluştu' });
  }
});

// ============================================
// SEED DATA (Development only)
// ============================================

app.post('/api/seed', async (req, res) => {
  try {
    // Check if data already exists
    const productCount = await db.collection('products').countDocuments();
    if (productCount > 0) {
      return res.json({ message: 'Veriler zaten mevcut' });
    }

    // Seed products
    const products = [
      {
        product_id: 'SU_0',
        name: 'OPEVA Doğal Kaynak Suyu',
        description: '19L Damacana',
        price: 100,
        image_url: 'https://raw.githubusercontent.com/Pilestin/OpevaGetir/refs/heads/master/assets/images/OpevaSuPNG.png',
        category: 'Damacana',
        stock: 120,
        weight: { value: 19, unit: 'kg' },
        dimensions: {
          length: { value: 20, unit: 'cm' },
          width: { value: 6, unit: 'cm' },
          height: { value: 6, unit: 'cm' }
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
        product_type: 'OPEVA'
      },
      {
        product_id: 'SU_1',
        name: 'OPEVA Pet Şişe Su',
        description: '0.5L Pet Şişe',
        price: 5,
        image_url: 'https://raw.githubusercontent.com/Pilestin/OpevaGetir/refs/heads/master/assets/images/OpevaSuPNG.png',
        category: 'Pet Şişe',
        stock: 500,
        weight: { value: 0.5, unit: 'kg' },
        dimensions: {
          length: { value: 20, unit: 'cm' },
          width: { value: 6, unit: 'cm' },
          height: { value: 6, unit: 'cm' }
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
        product_type: 'OPEVA'
      },
      {
        product_id: 'SU_2',
        name: 'OPEVA Pet Şişe Su',
        description: '1.5L Pet Şişe',
        price: 10,
        image_url: 'https://raw.githubusercontent.com/Pilestin/OpevaGetir/refs/heads/master/assets/images/OpevaSuPNG.png',
        category: 'Pet Şişe',
        stock: 300,
        weight: { value: 1.5, unit: 'kg' },
        dimensions: {
          length: { value: 30, unit: 'cm' },
          width: { value: 8, unit: 'cm' },
          height: { value: 8, unit: 'cm' }
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
        product_type: 'OPEVA'
      }
    ];

    await db.collection('products').insertMany(products);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = {
      user_id: '0',
      full_name: 'Admin User',
      email: 'admin@opeva.com',
      password_hash: adminPassword,
      phone_number: '+90 555 000 00 00',
      address: 'Admin Adresi',
      latitude: 39.75250570103818,
      longitude: 30.490999148931902,
      created_at: new Date(),
      last_login: new Date(),
      is_active: true,
      profile_picture: null,
      role: 'admin',
      updated_at: new Date()
    };

    await db.collection('users').insertOne(adminUser);

    res.json({ message: 'Seed data başarıyla oluşturuldu' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seed data oluşturulurken hata oluştu' });
  }
});

// ============================================
// START SERVER
// ============================================

app.get('/', (req, res) => {
  res.json({ message: 'Opeva Su API - Çalışıyor ✅' });
});

connectToDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    const networkIP = process.env.NETWORK_IP || 'localhost';
    console.log(`🚀 Server is running on:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${networkIP}:${PORT}`);
    console.log(`📱 Mobil cihazlardan erişilebilir!`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoClient.close();
  process.exit(0);
});
