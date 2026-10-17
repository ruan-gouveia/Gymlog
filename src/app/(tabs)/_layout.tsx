import { Tabs } from 'expo-router';

import { BarraAbas } from '@/components/navegacao/barra-abas';

export default function LayoutAbas() {
  return (
    <Tabs
      tabBar={(props) => <BarraAbas {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#12132A', borderTopWidth: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="historico" options={{ title: 'Histórico' }} />
      <Tabs.Screen name="novo-treino" options={{ title: 'Novo treino', href: null }} />
      <Tabs.Screen name="estatisticas" options={{ title: 'Estatísticas' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
