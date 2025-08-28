import PlusIcon from '@/assets/icons/PlusIcon';
import BottomSheetClientDetails from '@/components/BottomSheetClientDetails/page';
import BottomSheetSearchClients, { BottomSheetSearchClientsHandle } from '@/components/BottomSheetSearchClients/page';
import { useAppStore } from '@/state';
import { CustomerAddress } from '@/types/types';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const LocationsScreen = () => {
  const { updateCustomerLocation, setUpdateCustomerLocation } = useAppStore();
  const bottomSheetRef = useRef<BottomSheetSearchClientsHandle>(null);
  const mapRef = useRef<MapView | null>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lon: number; display_name: string } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 15.469768175349492,
    longitude: -88.02536107599735,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleOpenModal = () => bottomSheetRef.current?.present();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  // Busca usando Nominatim (OpenStreetMap). Devuelve sugerencias.
  const fetchPlaces = async (q: string) => {
    if (!q) {
      setSuggestions([]);
      return;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'alfaOmegaExpoRouter/1.0 (lopezkeller65@gmail.com)',
        },
      });
      const data = await res.json();
      setSuggestions(data || []);
    } catch (error) {
      console.warn('Error buscando lugar:', error);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query) {
      setSuggestions([]);
      return;
    }
    searchTimeout.current = setTimeout(() => {
      fetchPlaces(query);
    }, 250);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query]);

  const handleSelectPlace = (place: any) => {
    if (!place) return;
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const newRegion: Region = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setSelectedPlace({ lat, lon, display_name: place.display_name });
    setRegion(newRegion);
    if (mapRef.current && (mapRef.current as any).animateToRegion) {
      (mapRef.current as any).animateToRegion(newRegion, 500);
    }
    setSuggestions([]);
  };

  // 👉 Manejo del toque en el mapa para capturar lat/lng
  const handleMapPress = (event: MapPressEvent) => {
    if (updateCustomerLocation.updateLocation) {
      const { latitude, longitude } = event.nativeEvent.coordinate;

      // Limpiar el lugar seleccionado por búsqueda
      setSelectedPlace(null);

      // Guardar en zustand
      setUpdateCustomerLocation({
        latitude,
        longitude,
      });

      // Mostrar en consola
      console.log("Nueva ubicación seleccionada:", { latitude, longitude });
    }
  };

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View className="flex-1 bg-white relative">
      <View className="z-20">
        <View className="bg-white px-4 pb-4 gap-2">
          <View className="flex-row gap-2">
            <TextInput
              placeholder="Buscar ciudad, país..."
              className="bg-gray-200 rounded-2xl flex-1 py-3 px-4 text-black font-[Poppins-Medium] tracking-[-0.3px]"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => {
                if (suggestions.length > 0) handleSelectPlace(suggestions[0]);
              }}
            />

            <TouchableOpacity
              className="h-[46px] w-[46px] items-center justify-center rounded-2xl bg-yellow-300"
              onPress={handleOpenModal}
            >
              <PlusIcon color="black" />
            </TouchableOpacity>
          </View>

          {updateCustomerLocation.updateLocation && (
            <View className='flex-row items-center gap-2'>
              <View className='relative items-center justify-center'>
                <Animated.View
                  entering={FadeIn}
                  style={[
                    {
                      height: 16,
                      width: 16,
                      borderRadius: 10,
                      backgroundColor: '#86efac', // green-400
                      position: 'absolute',
                    },
                    animatedStyle,
                  ]}
                />
                <Animated.View
                  style={[
                    {
                      height: 10,
                      width: 10,
                      borderRadius: 5,
                      backgroundColor: '#4ade80',
                    },
                  ]}
                />
              </View>
              <Text className="text-green-500 text-xs font-[Poppins-SemiBold] tracking-[-0.3px]">
                Busca, o Tocá en el mapa para actualizar la ubicación
              </Text>
            </View>
          )}
        </View>

        {suggestions.length > 0 && (
          <View className="bg-white shadow-lg max-h-56">
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id?.toString() || item.osm_id?.toString() || item.lat}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="px-3 py-2 border-b border-gray-100"
                  onPress={() => handleSelectPlace(item)}
                >
                  <Text className="text-sm font-[Poppins-Medium] tracking-[-0.3px] text-gray-800">
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      <MapView
        ref={(r) => {
          mapRef.current = r;
        }}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        region={region}
        style={styles.map}
        zoomControlEnabled={true}
        onPress={handleMapPress}
      >
        {/* Lugar seleccionado por búsqueda */}
        {selectedPlace && (
          <Marker
            coordinate={{ latitude: selectedPlace.lat, longitude: selectedPlace.lon }}
            title={selectedPlace.display_name}
          />
        )}

        {/* Marker de actualización de ubicación */}
        {updateCustomerLocation.latitude && updateCustomerLocation.longitude && (
          <Marker
            coordinate={{
              latitude: updateCustomerLocation.latitude,
              longitude: updateCustomerLocation.longitude,
            }}
            title="Nueva ubicación"
            description="Ubicación seleccionada para el cliente"
            pinColor="red"
          />
        )}

        {/* Marcadores de direcciones del cliente */}
        {addresses.map((a, idx) => {
          const lat = parseFloat(a.u_Latitud || '0');
          const lon = parseFloat(a.u_Longitud || '0');
          if (!lat || !lon) return null;
          return (
            <Marker
              key={`addr-${idx}`}
              coordinate={{ latitude: lat, longitude: lon }}
              title={a.addressName}
              description={`${a.street} - ${a.ciudadName}`}
            />
          );
        })}
      </MapView>

      <BottomSheetClientDetails mapRef={mapRef} />
      <BottomSheetSearchClients ref={bottomSheetRef} />
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