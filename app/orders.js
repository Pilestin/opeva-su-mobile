import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Surface, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';

export default function OrdersScreen() {
  const { token, API_URL } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

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
          <Button 
            icon="arrow-left" 
            mode="text" 
            onPress={() => router.back()}
            textColor="#FFFFFF"
          >
            Geri
          </Button>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Siparişlerim
          </Text>
          <View style={{ width: 60 }} />
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filter */}
        <View style={styles.filterSection}>
          <SegmentedButtons
            value={filter}
            onValueChange={setFilter}
            buttons={[
              { value: 'all', label: 'Tümü' },
              { value: 'planned', label: 'Planlandı' },
              { value: 'completed', label: 'Tamamlandı' },
            ]}
          />
        </View>

        {/* Orders List */}
        <View style={styles.section}>
          {filteredOrders.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text variant="bodyLarge" style={styles.emptyIcon}>📦</Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  {filter === 'all' 
                    ? 'Henüz sipariş vermediniz' 
                    : 'Bu kategoride sipariş bulunamadı'}
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => router.push('/new-order')}
                  style={styles.emptyButton}
                >
                  Yeni Sipariş Ver
                </Button>
              </Card.Content>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order._id} style={styles.orderCard}>
                <Card.Content>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                      <Text variant="labelSmall" style={styles.orderIdLabel}>
                        #{order.order_id}
                      </Text>
                      <Text variant="titleMedium" style={styles.orderProduct}>
                        {order.request.product_name}
                      </Text>
                    </View>
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
                        📦 Miktar:
                      </Text>
                      <Text variant="bodyMedium" style={styles.orderValue}>
                        {order.request.quantity} adet
                      </Text>
                    </View>

                    <View style={styles.orderDetailRow}>
                      <Text variant="bodySmall" style={styles.orderLabel}>
                        💰 Tutar:
                      </Text>
                      <Text variant="bodyMedium" style={styles.orderValue}>
                        ₺{order.total_price}
                      </Text>
                    </View>

                    <View style={styles.orderDetailRow}>
                      <Text variant="bodySmall" style={styles.orderLabel}>
                        📅 Tarih:
                      </Text>
                      <Text variant="bodyMedium" style={styles.orderValue}>
                        {new Date(order.order_date).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>

                    <View style={styles.orderDetailRow}>
                      <Text variant="bodySmall" style={styles.orderLabel}>
                        🕐 Saat Aralığı:
                      </Text>
                      <Text variant="bodyMedium" style={styles.orderValue}>
                        {order.ready_time} - {order.due_time}
                      </Text>
                    </View>

                    <View style={styles.orderDetailRow}>
                      <Text variant="bodySmall" style={styles.orderLabel}>
                        📍 Adres:
                      </Text>
                      <Text variant="bodyMedium" style={styles.orderValue} numberOfLines={2}>
                        {order.location.address}
                      </Text>
                    </View>

                    {order.request.notes && (
                      <View style={styles.orderDetailRow}>
                        <Text variant="bodySmall" style={styles.orderLabel}>
                          📝 Not:
                        </Text>
                        <Text variant="bodyMedium" style={styles.orderValue} numberOfLines={2}>
                          {order.request.notes}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.orderFooter}>
                    <Text variant="bodySmall" style={styles.orderDate}>
                      Oluşturulma: {new Date(order.created_at).toLocaleString('tr-TR')}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  filterSection: {
    padding: 16,
    paddingBottom: 8,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  emptyCard: {
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#757575',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  orderIdLabel: {
    color: '#757575',
    marginBottom: 4,
  },
  orderProduct: {
    fontWeight: 'bold',
  },
  orderDetails: {
    gap: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderLabel: {
    color: '#757575',
    flex: 1,
  },
  orderValue: {
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  orderFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  orderDate: {
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
