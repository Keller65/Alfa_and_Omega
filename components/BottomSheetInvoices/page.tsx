import { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Invoice } from '@/types/types';
import { useAppStore } from '@/state';
import TrashIcon from '@/assets/icons/TrashIcon';
import InvoicesIcon from '@/assets/icons/InvoicesIcon';

const BottomSheetInvoices = () => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { selectedInvoices, removeInvoice } = useAppStore();

  const snapPoints = ['50%', '75%'];

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} />,
    []
  );

  const renderItem = ({ item }: { item: Invoice }) => (
    <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
      <View>
        <Text className="font-[Poppins-SemiBold] text-lg">Factura Nº: {item.numAtCard}</Text>
        <Text className="text-gray-600 font-[Poppins-Regular]">Saldo Pendiente: L. {item.balanceDue.toLocaleString()}</Text>
      </View>

      <TouchableOpacity onPress={() => removeInvoice(item.numAtCard)}>
        <TrashIcon size={20} color="red" />
      </TouchableOpacity>

    </View >
  );

  return (
    <View className='flex-1'>
      {selectedInvoices.length > 0 && (
        <TouchableOpacity
          onPress={handlePresentModalPress}
          className="bg-yellow-300 items-center justify-center h-[50px] w-screen flex-row gap-4"
        >
          <InvoicesIcon />
          <Text className='font-[Poppins-SemiBold]'>Ver facturas seleccionadas</Text>
        </TouchableOpacity>
      )}

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
      >
        <View className="flex-1 p-4">
          <Text className="text-xl font-bold mb-4">Facturas Seleccionadas</Text>
          {selectedInvoices.length > 0 ? (
            <BottomSheetFlatList
              data={selectedInvoices}
              renderItem={renderItem}
              keyExtractor={item => item.numAtCard}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500">No hay facturas seleccionadas.</Text>
            </View>
          )}
        </View>
      </BottomSheetModal>
    </View>
  );
};

export default BottomSheetInvoices;