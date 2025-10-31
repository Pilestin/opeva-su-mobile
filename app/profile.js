import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Surface, Avatar, Divider, List } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

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
            Profilim
          </Text>
          <View style={{ width: 60 }} />
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Icon size={80} icon="account" style={styles.avatar} />
            <Text variant="headlineSmall" style={styles.userName}>
              {user?.full_name}
            </Text>
            <Text variant="bodyMedium" style={styles.userEmail}>
              {user?.email}
            </Text>
            
            {user?.is_active ? (
              <Surface style={styles.statusBadge} elevation={1}>
                <Text style={styles.statusText}>✅ Hesap Aktif</Text>
              </Surface>
            ) : (
              <Surface style={[styles.statusBadge, styles.statusBadgePending]} elevation={1}>
                <Text style={styles.statusTextPending}>⏳ Onay Bekliyor</Text>
              </Surface>
            )}
          </Card.Content>
        </Card>

        {/* Account Information */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Hesap Bilgileri
          </Text>

          <Card style={styles.infoCard}>
            <List.Item
              title="Kullanıcı ID"
              description={user?.user_id}
              left={props => <List.Icon {...props} icon="identifier" />}
            />
            <Divider />
            <List.Item
              title="Ad Soyad"
              description={user?.full_name}
              left={props => <List.Icon {...props} icon="account" />}
            />
            <Divider />
            <List.Item
              title="Email"
              description={user?.email}
              left={props => <List.Icon {...props} icon="email" />}
            />
            <Divider />
            <List.Item
              title="Telefon"
              description={user?.phone_number}
              left={props => <List.Icon {...props} icon="phone" />}
            />
            <Divider />
            <List.Item
              title="Adres"
              description={user?.address}
              left={props => <List.Icon {...props} icon="map-marker" />}
              descriptionNumberOfLines={3}
            />
            <Divider />
            <List.Item
              title="Rol"
              description={user?.role === 'admin' ? 'Yönetici' : 'Müşteri'}
              left={props => <List.Icon {...props} icon="shield-account" />}
            />
            <Divider />
            <List.Item
              title="Üyelik Tarihi"
              description={new Date(user?.created_at).toLocaleDateString('tr-TR')}
              left={props => <List.Icon {...props} icon="calendar-clock" />}
            />
            <Divider />
            <List.Item
              title="Son Giriş"
              description={new Date(user?.last_login).toLocaleString('tr-TR')}
              left={props => <List.Icon {...props} icon="login" />}
            />
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            İşlemler
          </Text>

          <Card style={styles.actionsCard}>
            <List.Item
              title="Siparişlerim"
              description="Geçmiş siparişlerinizi görüntüleyin"
              left={props => <List.Icon {...props} icon="clipboard-list" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/orders')}
            />
            <Divider />
            <List.Item
              title="Yeni Sipariş"
              description="Hemen sipariş oluşturun"
              left={props => <List.Icon {...props} icon="plus-circle" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/new-order')}
              disabled={!user?.is_active}
            />
          </Card>
        </View>

        {/* Account Status Info */}
        {!user?.is_active && (
          <View style={styles.section}>
            <Surface style={styles.warningCard} elevation={2}>
              <Text variant="titleSmall" style={styles.warningTitle}>
                ⚠️ Hesap Onayı Bekliyor
              </Text>
              <Text variant="bodySmall" style={styles.warningText}>
                Hesabınız henüz yönetici tarafından onaylanmamıştır. Sipariş verebilmek için 
                hesabınızın onaylanmasını beklemeniz gerekmektedir. Lütfen daha sonra tekrar 
                kontrol edin.
              </Text>
            </Surface>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <Button
            mode="contained"
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
            contentStyle={styles.logoutButtonContent}
            buttonColor="#F44336"
          >
            Çıkış Yap
          </Button>
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
  profileCard: {
    margin: 16,
    borderRadius: 16,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    backgroundColor: '#0066CC',
    marginBottom: 16,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#757575',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusTextPending: {
    color: '#E65100',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 12,
  },
  actionsCard: {
    borderRadius: 12,
  },
  warningCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
  },
  warningTitle: {
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  warningText: {
    color: '#E65100',
    lineHeight: 20,
  },
  logoutButton: {
    borderRadius: 8,
  },
  logoutButtonContent: {
    paddingVertical: 8,
  },
});
