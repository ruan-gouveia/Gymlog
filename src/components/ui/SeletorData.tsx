import { Feather } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { dataBrParaDate, dateParaDataBr } from '@/utils/datas';
import { mascararData } from '@/utils/mascaras';

type SeletorDataProps = {
  label: string;
  /** "DD/MM/AAAA" ou "" quando não há data escolhida. */
  valor: string;
  onChange: (valor: string) => void;
  /** Data mínima aceita ("DD/MM/AAAA"). */
  minimo?: string;
  /** Data máxima aceita ("DD/MM/AAAA"). */
  maximo?: string;
};

function limitar(data: Date, minimo?: Date, maximo?: Date): Date {
  if (minimo && data.getTime() < minimo.getTime()) return minimo;
  if (maximo && data.getTime() > maximo.getTime()) return maximo;
  return data;
}

export function SeletorData({ label, valor, onChange, minimo, maximo }: SeletorDataProps) {
  const [iosAberto, setIosAberto] = useState(false);
  const [dataIOS, setDataIOS] = useState(new Date());

  const dataMinima = minimo ? dataBrParaDate(minimo) ?? undefined : undefined;
  const dataMaxima = maximo ? dataBrParaDate(maximo) ?? undefined : undefined;

  function abrir() {
    const dataInicial = limitar(dataBrParaDate(valor) ?? new Date(), dataMinima, dataMaxima);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dataInicial,
        mode: 'date',
        minimumDate: dataMinima,
        maximumDate: dataMaxima,
        onValueChange: (_evento: DateTimePickerChangeEvent, selecionada: Date) => {
          onChange(dateParaDataBr(selecionada));
        },
      });
      return;
    }

    setDataIOS(dataInicial);
    setIosAberto(true);
  }

  return (
    <View className="flex-1">
      <Text className="text-slate-600 dark:text-slate-300 text-sm mb-1.5 font-medium">{label}</Text>

      <View className="flex-row items-center bg-white dark:bg-[#1C1E3A] border border-slate-300 dark:border-[#282B54] rounded-2xl px-4 py-3">
        {Platform.OS === 'web' ? (
          <TextInput
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            maxLength={10}
            value={valor}
            onChangeText={(texto) => onChange(mascararData(texto))}
            className="flex-1 text-base text-slate-900 dark:text-white"
          />
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Selecionar ${label.toLowerCase()}`}
            onPress={abrir}
            activeOpacity={0.7}
            className="flex-1"
          >
            <Text
              className={`text-base ${
                valor ? 'text-slate-900 dark:text-white' : 'text-slate-400'
              }`}
            >
              {valor || 'Selecionar'}
            </Text>
          </TouchableOpacity>
        )}

        {valor ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Limpar ${label.toLowerCase()}`}
            onPress={() => onChange('')}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Feather name="x" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : (
          <Feather name="calendar" size={18} color="#94a3b8" />
        )}
      </View>

      {iosAberto && (
        <Modal transparent animationType="fade" visible={iosAberto}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white dark:bg-[#1C1E3A] p-4 rounded-t-3xl">
              <View className="flex-row justify-between items-center mb-3">
                <TouchableOpacity onPress={() => setIosAberto(false)}>
                  <Text className="text-slate-500 font-bold">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    onChange(dateParaDataBr(dataIOS));
                    setIosAberto(false);
                  }}
                >
                  <Text className="text-[#4F67ED] font-bold">Definir</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dataIOS}
                mode="date"
                display="spinner"
                minimumDate={dataMinima}
                maximumDate={dataMaxima}
                onValueChange={(_, d) => {
                  if (d) setDataIOS(d);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}