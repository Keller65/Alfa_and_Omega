import ClientIcon from '@/assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';
import api from '@/lib/api';
import { useAppStore } from '@/state';
import { CustomerAddress } from '@/types/types';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

const BottomSheetClientDetails = () => {
  const { selectedCustomerLocation, setUpdateCustomerLocation, updateCustomerLocation } = useAppStore();
  const clearSelectedCustomerLocation = useAppStore((s) => s.clearSelectedCustomerLocation);
  const { fetchUrl } = useAppStore();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[] | null>(null);
  const { user } = useAuth();

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
          const response = await api.get<CustomerAddress[]>(
            `/api/Customers/${selectedCustomerLocation.cardCode}/addresses`,
            {
              baseURL: fetchUrl,
              headers: {
                Authorization: `Bearer ${user?.token}`,
                'Content-Type': 'application/json',
              },
              cache: {
                ttl: 3600 * 24,
                override: true,
              }
            }
          );
          setCustomerAddresses(response.data);
        } catch (error) {
          console.error('Error fetching customer addresses:', error);
        }
      }
    };

    fetchCustomerAddresses();
  }, [selectedCustomerLocation?.cardCode]);

  const handleUpdateLocation = (rowNum: number) => {
    if (customerAddresses && customerAddresses[rowNum]) {
      setUpdateCustomerLocation({
        ...updateCustomerLocation,
        updateLocation: true,
        addressName: customerAddresses[rowNum].addressName,
        rowNum: customerAddresses[rowNum].rowNum,
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
    if (!selectedCustomerLocation?.cardCode || !updateCustomerLocation.addressName) {
      Alert.alert('Error', 'Faltan datos para actualizar la ubicación.');
      return;
    }

    if (!updateCustomerLocation.latitude || !updateCustomerLocation.longitude) {
      Alert.alert('Error', 'Latitud y longitud no están definidas.');
      return;
    }

    const URL = `http://200.115.188.54:4325/api/Customers/${selectedCustomerLocation.cardCode}/addresses/${updateCustomerLocation.rowNum}/geo`;

    try {
      const response = await axios.patch(
        `http://200.115.188.54:4325/api/Customers/${selectedCustomerLocation.cardCode}/addresses/${updateCustomerLocation.rowNum}/geo`,
        {
          latitud: `${updateCustomerLocation.latitude}`,
          longitud: `${updateCustomerLocation.longitude}`
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      Alert.alert('Éxito', 'Ubicación actualizada correctamente.');
      console.log('Respuesta del servidor:', response);
    } catch (error) {
      console.error('Error al actualizar la ubicación:', error);
      console.log('URL de la solicitud:', URL);
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
                    <View key={index} className="mt-2 bg-gray-200 p-4 rounded-xl relative">
                      <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px]">{address.street}</Text>
                      <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px]">{address.ciudadName} - {address.stateName}</Text>
                      <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px]">{address.addressName}</Text>

                      <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px]">Longuitud: {address.u_Longitud}</Text>
                      <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px]">Latitud: {address.u_Latitud}</Text>

                      <TouchableOpacity onPress={() => handleUpdateLocation(address.rowNum)} className='h-[28px] w-[28px] rounded-full bg-yellow-300 items-center justify-center absolute top-3 right-3'>
                        <MaterialCommunityIcons name="pencil" size={18} color="black" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-600">Cargando direcciones...</Text>
                )}
              </View>

              <TouchableOpacity
                className='flex-1 h-[50px] bg-yellow-300 items-center justify-center rounded-full flex-row gap-2'
              // onPress={handleUpdateLocation}
              >
                <MaterialCommunityIcons name="map-marker-radius" size={24} color="black" />
                <Text className="text-center text-lg font-[Poppins-SemiBold] text-black tracking-[-0.3px]">
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
