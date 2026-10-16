import { useToastStore } from '@/stores/toastStore';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Toast() {
 const {mensagem, tipo, esconder} = useToastStore();
 const {top} = useSafeAreaInsets();   

 useEffect(() => {
    if(!mensagem) return;
    const t = setTimeout(esconder, 2500);
    return () => clearTimeout(t);
 }, [mensagem, esconder]);

 if (!mensagem) return null;

 return (
    <View pointerEvents="none" style={{ top: top + 8 }} className="absolute left-4 right-4 z-50">
      <View
        className={`rounded-xl px-4 py-3 ${tipo === 'sucesso' ? 'bg-primaria' : 'bg-perigo'}`}
      >
        <Text className="text-center font-semibold text-white">{mensagem}</Text>
      </View>
    </View>
 )
}

