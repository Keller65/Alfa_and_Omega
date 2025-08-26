import BottomSheetSearchClients, { BottomSheetSearchClientsHandle, Client as ClientType } from '@/components/BottomSheetSearchClients/page';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

const LocationsScreen = () => {
  const bottomSheetRef = useRef<BottomSheetSearchClientsHandle>(null);
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);

  const handleOpenModal = () => bottomSheetRef.current?.present();

  const handleSelectClient = (client: ClientType) => {
    console.log('Cliente seleccionado:', client);
    setSelectedClient(client);
    bottomSheetRef.current?.close();
  };


  return (
    <View className="flex-1 bg-white relative">
      <TouchableOpacity className='h-[50px] w-[50px] rounded-full bg-yellow-300 absolute top-4 right-4 z-50' onPress={handleOpenModal}>
      </TouchableOpacity>

      <MapView
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        style={styles.map}

      />

      <BottomSheetSearchClients ref={bottomSheetRef} onSelect={handleSelectClient} />
    </View>
  );
};

export default LocationsScreen;

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
});