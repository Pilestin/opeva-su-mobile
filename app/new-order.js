import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, TextInput, Surface, Snackbar, ActivityIndicator, RadioButton, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';

export default function NewOrderScreen() {
  const { user, token, API_URL } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [readyTime, setReadyTime] = useState('09:00');
  const [dueTime, setDueTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'error' });

  useEffect(() => {
    if (!user?.is_active) {
      setSnackbar({ 
        visible: true, 
        message: 'Sipariş verebilmek için hesabınızın onaylanması gerekiyor', 
        type: 'error' 
      });
      setTimeout(() => router.back(), 2000);
      return;
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
      if (response.data.length > 0) {
        setSelectedProduct(response.data[0].product_id);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      setSnackbar({ visible: true, message: 'Ürünler yüklenemedi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct || !quantity || !orderDate || !readyTime || !dueTime) {
      setSnackbar({ visible: true, message: 'Lütfen tüm alanları doldurun', type: 'error' });
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      setSnackbar({ visible: true, message: 'Geçerli bir miktar girin', type: 'error' });
      return;
    }

    const product = products.find(p => p.product_id === selectedProduct);
    if (quantityNum > product.stock) {
      setSnackbar({ visible: true, message: `Stokta sadece ${product.stock} adet var`, type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/api/orders`,
        {
          product_id: selectedProduct,
          quantity: quantityNum,
          order_date: new Date(orderDate).toISOString(),
          ready_time: readyTime,
          due_time: dueTime,
          notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSnackbar({ visible: true, message: 'Sipariş başarıyla oluşturuldu! 🎉', type: 'success' });
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Create order error:', error);
      setSnackbar({ 
        visible: true, 
        message: error.response?.data?.error || 'Sipariş oluşturulamadı', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  const selectedProductData = products.find(p => p.product_id === selectedProduct);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <Surface style={styles.header} elevation={4}>
        <View style={styles.headerContent}>
          <Button 
            icon="arrow-left" 
            mode="text" 
            onPress={() => router.back()}
            textColor="#FFFFFF"
          >
            Geri
          </Button>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Yeni Sipariş
          </Text>
          <View style={{ width: 60 }} />
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        {/* Product Selection */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Ürün Seçimi
          </Text>

          <RadioButton.Group onValueChange={value => setSelectedProduct(value)} value={selectedProduct}>
            {products.map((product) => (
              <Card key={product.product_id} style={styles.productCard}>
                <Card.Content style={styles.productContent}>
                  <View style={styles.productInfo}>
                    <RadioButton value={product.product_id} />
                    <Image 
                      source={{ uri: product.image_url }} 
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                    <View style={styles.productDetails}>
                      <Text variant="bodyLarge" style={styles.productName}>
                        {product.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.productDescription}>
                        {product.description}
                      </Text>
                      <View style={styles.productMeta}>
                        <Chip icon="package-variant" compact>
                          Stok: {product.stock}
                        </Chip>
                        <Text variant="titleMedium" style={styles.productPrice}>
                          ₺{product.price}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </RadioButton.Group>
        </View>

        {/* Order Details */}
        {selectedProduct && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Sipariş Detayları
            </Text>

            <Surface style={styles.formCard} elevation={2}>
              <TextInput
                label="Miktar"
                value={quantity}
                onChangeText={setQuantity}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                left={<TextInput.Icon icon="counter" />}
                right={<TextInput.Affix text="adet" />}
              />

              <TextInput
                label="Sipariş Tarihi"
                value={orderDate}
                onChangeText={setOrderDate}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="calendar" />}
                placeholder="YYYY-MM-DD"
              />

              <View style={styles.timeRow}>
                <TextInput
                  label="Başlangıç Saati"
                  value={readyTime}
                  onChangeText={setReadyTime}
                  mode="outlined"
                  style={[styles.input, styles.timeInput]}
                  left={<TextInput.Icon icon="clock-start" />}
                  placeholder="09:00"
                />

                <TextInput
                  label="Bitiş Saati"
                  value={dueTime}
                  onChangeText={setDueTime}
                  mode="outlined"
                  style={[styles.input, styles.timeInput]}
                  left={<TextInput.Icon icon="clock-end" />}
                  placeholder="18:00"
                />
              </View>

              <TextInput
                label="Notlar (Opsiyonel)"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                left={<TextInput.Icon icon="note-text" />}
                placeholder="Özel taleplerinizi buraya yazabilirsiniz"
              />
            </Surface>
          </View>
        )}

        {/* Order Summary */}
        {selectedProduct && selectedProductData && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Sipariş Özeti
            </Text>

            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Ürün:</Text>
                <Text variant="bodyMedium" style={styles.summaryValue}>
                  {selectedProductData.name}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Miktar:</Text>
                <Text variant="bodyMedium" style={styles.summaryValue}>
                  {quantity} adet
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Birim Fiyat:</Text>
                <Text variant="bodyMedium" style={styles.summaryValue}>
                  ₺{selectedProductData.price}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Teslimat Tarihi:</Text>
                <Text variant="bodyMedium" style={styles.summaryValue}>
                  {new Date(orderDate).toLocaleDateString('tr-TR')}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Teslimat Saati:</Text>
                <Text variant="bodyMedium" style={styles.summaryValue}>
                  {readyTime} - {dueTime}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text variant="titleMedium" style={styles.totalLabel}>
                  Toplam Tutar:
                </Text>
                <Text variant="headlineSmall" style={styles.totalValue}>
                  ₺{selectedProductData.price * parseInt(quantity || 0)}
                </Text>
              </View>
            </Surface>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.section}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || !selectedProduct}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            icon="check"
          >
            Siparişi Onayla
          </Button>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        action={{
          label: 'Kapat',
          onPress: () => setSnackbar({ ...snackbar, visible: false }),
        }}
      >
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#0066CC',
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  productContent: {
    padding: 8,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productDescription: {
    color: '#757575',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontWeight: 'bold',
    color: '#0066CC',
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryValue: {
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#0066CC',
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
