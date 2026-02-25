import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerTitleAlign: 'center' }}>
        {/*<Stack.Screen name="index" options={{ title: 'Einbuergerungstest Deutschland' }} />*/}
        <Stack.Screen name="learn" options={{ title: 'Learn' }} />
        <Stack.Screen name="exam" options={{ title: 'Exam' }} />
        <Stack.Screen name="results" options={{ title: 'Results' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

