import ClientIcon from '@/assets/icons/ClientIcon';
import { BottomSheetBackdrop, BottomSheetFlashList, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import axios from 'axios';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
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

const BottomSheetSearchClients = forwardRef<BottomSheetSearchClientsHandle, Props>(({ onSelect }, ref) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const modalRef = useRef<BottomSheetModal>(null);

  const fetchClients = async () => {
    try {
      setError(null);
      setLoading(true);
      const { data } = await axios.get(
        'http://200.115.188.54:4325/api/Customers/by-sales-emp?slpCode=3&page=1&pageSize=1000'
      );

      if (data && Array.isArray(data.items)) {
        setClients(data.items);
      } else if (Array.isArray(data)) {
        setClients(data);
      } else {
        setClients([]);
        console.warn('Formato inesperado de la respuesta:', data);
      }
    } catch (err) {
      setError('Error al cargar clientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    present: () => {
      modalRef.current?.present();
      // iniciar fetch cuando el modal se presenta
      fetchClients();
    },
    close: () => modalRef.current?.close(),
  }), []);

  const filteredClients = clients.filter(client =>
    client.cardName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={['90%']}
      backgroundStyle={{ borderRadius: 30 }}
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
      <BottomSheetScrollView className="flex-1 px-4">
        <TextInput
          placeholder="Buscar cliente..."
          value={searchText}
          onChangeText={setSearchText}
          className="bg-gray-200 rounded-2xl py-3 px-4 mb-2 text-black"
        />

        {error ? (
          <View className="flex-1 items-center justify-center py-6">
            <Text className="text-red-500">{error}</Text>
          </View>
        ) : loading ? (
          <View className="py-6 items-center justify-center">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-2">Cargando clientes...</Text>
          </View>
        ) : (
          <BottomSheetFlashList
            data={filteredClients}
            keyExtractor={(item) => item.cardCode}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row flex-1 items-center gap-3 my-2"
                onPress={() => onSelect?.(item)}
              >
                <View className="bg-[#fcde41] w-[50px] h-[50px] items-center justify-center rounded-full">
                  <ClientIcon size={24} color="#000" />
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
            estimatedItemSize={100}
            nestedScrollEnabled={true}
          />
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default BottomSheetSearchClients;
