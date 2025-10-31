import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, Snackbar } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'error' });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setSnackbar({ visible: true, message: 'Lütfen tüm alanları doldurun', type: 'error' });
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.replace('/home');
    } else {
      setSnackbar({ visible: true, message: result.message, type: 'error' });
    }
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
            Hoş Geldiniz! 👋
          </Text>
          <Text style={styles.subtitle} variant="bodyMedium">
            OPEVA Su Sipariş Sistemi
          </Text>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Şifre"
              value={password}
              onChangeText={setPassword}
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

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Giriş Yap
            </Button>

            <View style={styles.registerContainer}>
              <Text variant="bodyMedium">Hesabınız yok mu? </Text>
              <Button
                mode="text"
                onPress={() => router.push('/register')}
                compact
              >
                Kayıt Ol
              </Button>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Demo Hesaplar</Text>
              <View style={styles.dividerLine} />
            </View>

            <Surface style={styles.demoBox} elevation={1}>
              <Text variant="bodySmall" style={styles.demoTitle}>
                Admin: admin@opeva.com / admin123
              </Text>
            </Surface>
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
    marginBottom: 32,
    color: '#757575',
  },
  form: {
    gap: 12,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#757575',
    fontSize: 12,
  },
  demoBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  demoTitle: {
    color: '#757575',
    textAlign: 'center',
  },
});
