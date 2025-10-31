import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const theme = {
  colors: {
    primary: '#0066CC',
    secondary: '#03A9F4',
    accent: '#FFC107',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    error: '#F44336',
    text: '#212121',
    onSurface: '#000000',
    disabled: '#9E9E9E',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
