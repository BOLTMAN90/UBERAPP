import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: Colors.secondary,
      }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 }}>
        Something went wrong
      </Text>
      <Text style={{ color: Colors.textSecondary, marginBottom: 16 }}>
        If you only see this on Expo Go, check the Metro terminal on your PC for logs. Common causes:
        wrong dev-server URL, firewall blocking the port, or Firebase/emulator misconfiguration.
      </Text>
      <ScrollView
        style={{
          maxHeight: 220,
          marginBottom: 16,
          padding: 12,
          backgroundColor: Colors.white,
          borderRadius: 8,
        }}>
        <Text selectable style={{ fontFamily: 'monospace', fontSize: 12, color: Colors.error }}>
          {error.message}
        </Text>
      </ScrollView>
      <Pressable
        onPress={() => void retry()}
        style={{
          alignSelf: 'flex-start',
          backgroundColor: Colors.primary,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
        }}>
        <Text style={{ color: Colors.white, fontWeight: '700' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export const unstable_settings = {
  initialRouteName: 'index',
};

void SplashScreen.preventAutoHideAsync().catch(() => null);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error && __DEV__) {
      console.warn('[RootLayout] Font load failed, using system fonts:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync().catch(() => null);
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(rider)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
