import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, Snackbar } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'error' });
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!formData.full_name || !formData.email || !formData.password || 
        !formData.phone_number || !formData.address) {
      setSnackbar({ visible: true, message: 'Lütfen tüm alanları doldurun', type: 'error' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSnackbar({ visible: true, message: 'Şifreler eşleşmiyor', type: 'error' });
      return;
    }

    if (formData.password.length < 6) {
      setSnackbar({ visible: true, message: 'Şifre en az 6 karakter olmalıdır', type: 'error' });
      return;
    }

    setLoading(true);
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    setLoading(false);

    if (result.success) {
      setSnackbar({ visible: true, message: result.message, type: 'success' });
      setTimeout(() => {
        router.replace('/home');
      }, 2000);
    } else {
      setSnackbar({ visible: true, message: result.message, type: 'error' });
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Surface style={styles.surface} elevation={2}>
          <Text style={styles.title} variant="headlineMedium">
            Kayıt Ol 📝
          </Text>
          <Text style={styles.subtitle} variant="bodyMedium">
            Yeni hesap oluşturun
          </Text>

          <View style={styles.form}>
            <TextInput
              label="Ad Soyad *"
              value={formData.full_name}
              onChangeText={(value) => updateFormData('full_name', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Telefon *"
              value={formData.phone_number}
              onChangeText={(value) => updateFormData('phone_number', value)}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
              placeholder="+90 5XX XXX XX XX"
            />

            <TextInput
              label="Adres *"
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
              left={<TextInput.Icon icon="map-marker" />}
            />

            <TextInput
              label="Şifre *"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label="Şifre Tekrar *"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
            />

            <Surface style={styles.infoBox} elevation={1}>
              <Text variant="bodySmall" style={styles.infoText}>
                ℹ️ Hesabınız oluşturulduktan sonra admin onayı beklemelisiniz. 
                Onaylandıktan sonra sipariş verebilirsiniz.
              </Text>
            </Surface>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Kayıt Ol
            </Button>

            <View style={styles.loginContainer}>
              <Text variant="bodyMedium">Zaten hesabınız var mı? </Text>
              <Button
                mode="text"
                onPress={() => router.back()}
                compact
              >
                Giriş Yap
              </Button>
            </View>
          </View>
        </Surface>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    paddingVertical: 32,
  },
  surface: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#0066CC',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#757575',
  },
  form: {
    gap: 12,
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    marginTop: 8,
  },
  infoText: {
    color: '#1976D2',
    textAlign: 'center',
    lineHeight: 20,
  },
});
