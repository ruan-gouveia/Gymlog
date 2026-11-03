import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function LayoutHistorico() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/editar" />
    </Stack>
  );
}
