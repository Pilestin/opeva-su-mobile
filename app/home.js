import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, FAB, Chip, Avatar, Surface, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  const { user, logout, token, API_URL, updateUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    updateUser();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    updateUser();
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: '#2196F3',
      in_progress: '#FF9800',
      completed: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#757575';
  };

  const getStatusText = (status) => {
    const texts = {
      planned: 'Planlandı',
      in_progress: 'Yolda',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    };
    return texts[status] || status;
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <Surface style={styles.header} elevation={4}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Merhaba! 👋
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              {user?.full_name}
            </Text>
          </View>
          <Avatar.Icon size={48} icon="account" style={styles.avatar} />
        </View>
        
        {!user?.is_active && (
          <Surface style={styles.warningBanner} elevation={1}>
            <Text variant="bodySmall" style={styles.warningText}>
              ⚠️ Hesabınız henüz onaylanmadı. Sipariş verebilmek için admin onayı beklemelisiniz.
            </Text>
          </Surface>
        )}
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Hızlı İşlemler
          </Text>
          
          <View style={styles.quickActions}>
            <Card style={styles.actionCard} onPress={() => router.push('/new-order')}>
              <Card.Content style={styles.actionCardContent}>
                <Avatar.Icon size={48} icon="water" style={styles.actionIcon} />
                <Text variant="bodyMedium" style={styles.actionText}>
                  Yeni Sipariş
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={() => router.push('/orders')}>
              <Card.Content style={styles.actionCardContent}>
                <Avatar.Icon size={48} icon="clipboard-list" style={styles.actionIcon} />
                <Text variant="bodyMedium" style={styles.actionText}>
                  Siparişlerim
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={() => router.push('/profile')}>
              <Card.Content style={styles.actionCardContent}>
                <Avatar.Icon size={48} icon="account-circle" style={styles.actionIcon} />
                <Text variant="bodyMedium" style={styles.actionText}>
                  Profilim
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Son Siparişler
            </Text>
            {orders.length > 0 && (
              <Button mode="text" onPress={() => router.push('/orders')} compact>
                Tümünü Gör
              </Button>
            )}
          </View>

          {orders.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text variant="bodyLarge" style={styles.emptyIcon}>📦</Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Henüz sipariş vermediniz
                </Text>
                {user?.is_active && (
                  <Button 
                    mode="contained" 
                    onPress={() => router.push('/new-order')}
                    style={styles.emptyButton}
                  >
                    İlk Siparişi Ver
                  </Button>
                )}
              </Card.Content>
            </Card>
          ) : (
            orders.slice(0, 3).map((order) => (
              <Card key={order._id} style={styles.orderCard}>
                <Card.Content>
                  <View style={styles.orderHeader}>
                    <Text variant="titleMedium" style={styles.orderProduct}>
                      {order.request.product_name}
                    </Text>
                    <Chip 
                      mode="flat" 
                      style={{ backgroundColor: getStatusColor(order.status) }}
                      textStyle={{ color: '#FFFFFF' }}
                    >
                      {getStatusText(order.status)}
                    </Chip>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailRow}>
                      <Text variant="bodySmall" style={styles.orderLabel}>
                        Miktar:
                      </Text>
                      <Text variant="bodyMedium" style={styles.orderValue}>
                        {order.request.quantity} adet
                      </Text>
                    </View>

                    <View style={styles.orderDetailRow}>
                      <Text variant="bodySmall" style={styles.orderLabel}>
                        Tutar:
                      </Text>
                      <Text variant="bodyMedium" style={styles.orderValue}>
                        ₺{order.total_price}
                      </Text>
                    </View>

                    <View style={styles.orderDetailRow}>
                      <Text variant="bodySmall" style={styles.orderLabel}>
                        Tarih:
                      </Text>
                      <Text variant="bodyMedium" style={styles.orderValue}>
                        {new Date(order.order_date).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>

                    <View style={styles.orderDetailRow}>
                      <Text variant="bodySmall" style={styles.orderLabel}>
                        Saat:
                      </Text>
                      <Text variant="bodyMedium" style={styles.orderValue}>
                        {order.ready_time} - {order.due_time}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        {/* Logout Button */}
        <Button 
          mode="outlined" 
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
        >
          Çıkış Yap
        </Button>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {user?.is_active && (
        <FAB
          icon="plus"
          label="Yeni Sipariş"
          style={styles.fab}
          onPress={() => router.push('/new-order')}
        />
      )}
    </View>
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
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#E3F2FD',
    marginTop: 4,
  },
  avatar: {
    backgroundColor: '#1976D2',
  },
  warningBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    color: '#E65100',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
  },
  actionCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionIcon: {
    backgroundColor: '#0066CC',
    marginBottom: 8,
  },
  actionText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyCard: {
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#757575',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  orderCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderProduct: {
    flex: 1,
    fontWeight: 'bold',
    marginRight: 8,
  },
  orderDetails: {
    gap: 8,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderLabel: {
    color: '#757575',
  },
  orderValue: {
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#0066CC',
  },
});
