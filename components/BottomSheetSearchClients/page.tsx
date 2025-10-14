import ClientIcon from '@/assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';
import axios from 'axios';
import { useAppStore } from '@/state';
import { Customer } from '@/types/types';
import Feather from '@expo/vector-icons/Feather';
import { BottomSheetBackdrop, BottomSheetFlashList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

export interface Client {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  priceListNum: number;
}

export type BottomSheetSearchClientsHandle = {
  present: () => void;
  close: () => void;
};

interface Props {
  onSelect?: (client: Client) => void;
}

const BottomSheetSearchClients = forwardRef<BottomSheetSearchClientsHandle, Props>(function BottomSheetSearchClients({ onSelect }, ref) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<BottomSheetModal>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      const { data } = await axios.get(
        `${fetchUrl}/api/Customers/by-sales-emp?slpCode=${user?.salesPersonCode}&page=1&pageSize=1000`,
        {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const items = data && Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      setClients(items);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.message === 'canceled') {
        return;
      }
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
      fetchControllerRef.current = null;
    }
  }, [fetchUrl, user?.salesPersonCode, user?.token]);

  useImperativeHandle(ref, () => ({
    present: () => {
      modalRef.current?.present();
      fetchClients();
    },
    close: () => {
      fetchControllerRef.current?.abort();
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      modalRef.current?.close();
    },
  }), [fetchClients]);

  // Eliminar duplicados basándose en cardCode antes de filtrar
  const uniqueClients = clients.filter((client, index, self) =>
    index === self.findIndex(c => c.cardCode === client.cardCode)
  );

  const filteredClients = uniqueClients.filter(client =>
    client.cardName.toLowerCase().includes(searchText.toLowerCase())
  );

  const setSelectedCustomerLocation = useAppStore((s) => s.setSelectedCustomerLocation);

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={['90%']}
      // backgroundStyle={{ borderRadius: 30 }}
      enableDynamicSizing={false}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          pressBehavior="close"
        />
      )}
    >
      <View className="flex-1 px-4">

        <View className='mb-2'>
          <View className="bg-gray-200 rounded-2xl px-4 text-base font-[Poppins-Regular] text-black flex-row items-center gap-2">
            <Feather name="search" size={20} color="#9ca3af" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por nombre, código o RTN"
              className="w-[86%] font-[Poppins-Medium] tracking-[-0.3px]"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9ca3af"
            />
            {loading && clients.length > 0 && (
              <ActivityIndicator size="small" color="#9ca3af" />
            )}
          </View>
        </View>

        {loading && clients.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4b5563" />
            <Text className="mt-4 font-[Poppins-Medium] text-gray-600 tracking-[-0.3px]">
              Cargando clientes...
            </Text>
          </View>
        ) : (
          <BottomSheetFlashList
            data={filteredClients}
            keyExtractor={(item) => item.cardCode}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row flex-1 items-center gap-3 my-2"
                onPress={() => {
                  modalRef.current?.close();
                  if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
                  settleTimerRef.current = setTimeout(() => {
                    setSelectedCustomerLocation(item as unknown as Customer);
                    onSelect?.(item);
                    settleTimerRef.current = null;
                  }, 120);
                }}
              >
                <View className="bg-primary w-[50px] h-[50px] items-center justify-center rounded-full">
                  <ClientIcon size={24} color="white" />
                </View>

                <View className="flex-1 justify-center">
                  <Text className="font-[Poppins-SemiBold] text-lg text-black tracking-[-0.3px]">
                    {item.cardName}
                  </Text>

                  <View className="flex-row gap-2">
                    <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">
                      Código: <Text className="font-[Poppins-Regular]">{item.cardCode}</Text>
                    </Text>
                    <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">
                      RTN: {' '}
                      <Text className="font-[Poppins-Regular] tracking-[-0.3px]">
                        {item.federalTaxID
                          ? item.federalTaxID.replace(/^(\d{4})(\d{4})(\d{6})$/, '$1-$2-$3')
                          : ''}
                      </Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            nestedScrollEnabled={true}
            estimatedItemSize={64}
          />
        )}
      </View>
    </BottomSheetModal>
  );
});

export default BottomSheetSearchClients;
