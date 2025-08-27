import ClientIcon from '@/assets/icons/ClientIcon';
import { useAppStore } from '@/state';
import { CustomerAddress } from '@/types/types';
import Feather from '@expo/vector-icons/Feather';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const BottomSheetClientDetails = () => {
  const { selectedCustomerLocation, setUpdateCustomerLocation, updateCustomerLocation } = useAppStore();
  const clearSelectedCustomerLocation = useAppStore((s) => s.clearSelectedCustomerLocation);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[] | null>(null);

  function clearSelected() {
    clearSelectedCustomerLocation();
    setUpdateCustomerLocation({
      ...updateCustomerLocation,
      updateLocation: false,
    });
  }

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  useEffect(() => {
    const fetchCustomerAddresses = async () => {
      if (selectedCustomerLocation?.cardCode) {
        try {
          const response = await axios.get<CustomerAddress[]>(
            `http://200.115.188.54:4325/api/Customers/${selectedCustomerLocation.cardCode}/addresses`
          );
          setCustomerAddresses(response.data);
        } catch (error) {
          console.error('Error fetching customer addresses:', error);
        }
      }
    };

    fetchCustomerAddresses();
  }, [selectedCustomerLocation?.cardCode]);

  const handleUpdateLocation = () => {
    if (customerAddresses && customerAddresses[0]) {
      setUpdateCustomerLocation({
        ...updateCustomerLocation,
        updateLocation: true,
        addressName: customerAddresses[0].addressName,
      });
    } else {
      setUpdateCustomerLocation({
        ...updateCustomerLocation,
        updateLocation: true,
      });
    }
    console.log('Location updated', {
      ...updateCustomerLocation,
      addressName: customerAddresses?.[0]?.addressName,
    });
    bottomSheetModalRef.current?.dismiss();
  };

  const updateCustomerGeoLocation = async () => {
    if (!selectedCustomerLocation?.cardCode || !updateCustomerLocation.addressName || !updateCustomerLocation.latitude || !updateCustomerLocation.longitude) {
      Alert.alert('Error', 'Faltan datos para actualizar la ubicación.');
      return;
    }

    try {
      const patchBody = {
        headers: {
          latitud: updateCustomerLocation.latitude.toString(),
          longitud: updateCustomerLocation.longitude.toString(),
        },
      };
      console.log('Cuerpo del PATCH:', patchBody);

      const response = await axios.patch(
        `http://200.115.188.54:4325/api/Customers/${selectedCustomerLocation.cardCode}/addresses/${updateCustomerLocation.addressName}/geo`,
        patchBody
      );

      Alert.alert('Éxito', 'Ubicación actualizada correctamente.', [{ text: 'OK' }]);
      console.log('Respuesta del servidor:', response.data);
    } catch (error) {
      console.error('Error al actualizar la ubicación:', error);
      Alert.alert('Error', 'No se pudo actualizar la ubicación.');
    }
  };

  // renders
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <View>
      {selectedCustomerLocation && (
        <View className='p-4 gap-4'>
          <View className="flex-row gap-4 items-center">
            <View className="bg-[#fcde41] w-[38px] h-[38px] items-center justify-center rounded-full">
              <ClientIcon size={24} color="#000" />
            </View>

            <View>
              <Text className="font-[Poppins-SemiBold] tracking-[-0.3px] text-md text-black leading-5">
                {selectedCustomerLocation?.cardName ?? 'Sin nombre'}
              </Text>
              <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px] text-sm">
                Código: {selectedCustomerLocation?.cardCode ?? 'N/A'}
              </Text>
            </View>

            <View className="flex-row justify-end absolute top-0 right-0">
              <TouchableOpacity className="h-[34px] w-[34px] bg-red-100 rounded-full items-center justify-center" onPress={clearSelected}>
                <MaterialCommunityIcons name="delete-empty" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View className='flex-row gap-4'>
            <TouchableOpacity
              onPress={handlePresentModalPress}
              className='flex-1 bg-yellow-300 h-[50px] items-center justify-center rounded-full'
            >
              <Text className='text-black text-center font-[Poppins-SemiBold] tracking-[0.3px]'>
                Ver Detalles
              </Text>
            </TouchableOpacity>

            {updateCustomerLocation.updateLocation && (
              <TouchableOpacity
                onPress={updateCustomerGeoLocation}
                className='flex-1 bg-yellow-300 h-[50px] flex-row gap-2 items-center justify-center rounded-full'
              >
                <Feather name="save" size={22} color="black" />
                <Text className='text-black text-center font-[Poppins-SemiBold] tracking-[0.3px]'>
                  Guardar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <BottomSheetModal
        ref={bottomSheetModalRef}
        // snapPoints={['50%']}
        backgroundStyle={{ borderRadius: 30 }}
        backdropComponent={renderBackdrop}
      // enableDynamicSizing={false}
      >
        <BottomSheetView className='px-4'>
          {selectedCustomerLocation ? (
            <View className='gap-4 pb-4'>
              <View className="flex-row gap-4 items-center">
                <View className="bg-[#fcde41] w-[50px] h-[50px] items-center justify-center rounded-full">
                  <ClientIcon size={28} color="#000" />
                </View>

                <View>
                  <Text className="font-[Poppins-SemiBold] tracking-[-0.3px] text-md text-black leading-5">
                    {selectedCustomerLocation?.cardName ?? 'Sin nombre'}
                  </Text>
                  <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px] text-sm">
                    Código: {selectedCustomerLocation?.cardCode ?? 'N/A'}
                  </Text>
                </View>
              </View>

              <View className="mt-4">
                <Text className="font-[Poppins-SemiBold] text-lg text-black tracking-[-0.3px]">Direcciones:</Text>
                {customerAddresses ? (
                  customerAddresses.map((address, index) => (
                    <View key={index} className="mt-2">
                      <Text className="text-black font-[Poppins-Medium] tracking-[-0.3px]">{address.street}</Text>
                      <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px]">{address.ciudadName}, {address.stateName}</Text>
                      <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px]">{address.addressName}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-600">Cargando direcciones...</Text>
                )}
              </View>

              <TouchableOpacity
                className='flex-1 h-[50px] bg-yellow-300 items-center justify-center rounded-full'
                onPress={handleUpdateLocation}
              >
                <Text className="text-center text-md font-[Poppins-SemiBold] text-black tracking-[-0.3px]">
                  Editar Ubicación
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text>No hay cliente seleccionado</Text>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
};

export default BottomSheetClientDetails;
