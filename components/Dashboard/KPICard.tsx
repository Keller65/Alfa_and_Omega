import { FC } from 'react';
import { View, Text } from 'react-native';

interface VentasData {
  title: string;
  Ventas: number;
  currency: string;
  Cobros: number;
  delta: number;
  deltaType: 'up' | 'down';
  deltaLabel: string;
  mesVentas: string;
  mesCobros: string;
}

interface KpiApiResponse {
  ventas: VentasData;
}

interface KPICardApiProps {
  data: KpiApiResponse | null;
  userName: string | undefined;
}

const KPICardApi: FC<KPICardApiProps> = ({ data, userName }) => {
  if (!data || !data.ventas) {
    return null;
  }

  const { ventas } = data;
  const isDeltaUp = ventas.deltaType === 'up';
  const deltaColor = isDeltaUp ? 'text-green-500' : 'text-[#ff7b72]';
  const arrowDirection = isDeltaUp ? '▲' : '▼';

  return (
    <View className="bg-white p-3 rounded-2xl w-full gap-3 border border-gray-100 relative">
      <Text className={`text-2xl font-[Poppins-SemiBold] tracking-[-0.3px] absolute top-2 right-3 ${deltaColor}`}>{arrowDirection}</Text>
      <View className="flex-row justify-between items-center mb-1">
        <View className='flex flex-col'>
          <Text className={`text-sm font-[Poppins-SemiBold] tracking-[-0.3px] ${deltaColor}`}>{ventas.Ventas.toLocaleString()} {ventas.currency}</Text>
          <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-800">{userName}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-end gap-4">
        <View>
          <Text className="text-xs text-gray-500 font-[Poppins-SemiBold] tracking-[-0.3px]">{ventas.mesVentas} - {ventas.mesCobros}</Text>
          <Text className="text-xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-800">
            {ventas.Ventas.toLocaleString()} {ventas.currency}
          </Text>
        </View>

        <View className="items-end">
          <Text className={`text-base font-[Poppins-SemiBold] tracking-[-0.3px] ${deltaColor}`}>
            {ventas.delta}%
          </Text>
          <Text className={`text-xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-500 ${deltaColor}`}>
            {ventas.Cobros.toLocaleString()} {ventas.currency}
          </Text>
        </View>
      </View>

    </View>
  );
};

export default KPICardApi;