import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: "Poppins-SemiBold",
        }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: true, headerTitle: 'Configuraciones' }} />
      <Stack.Screen name="success" options={{ headerShown: false, }} />
      <Stack.Screen name="error" options={{ headerShown: false, }} />
    </Stack>
  );
}