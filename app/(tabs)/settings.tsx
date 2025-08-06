import { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { useAuth } from '@/context/auth';
import FingerSprint from '@/components/FingerSprint';
import NotificationsToggle from '@/components/Notifications';
import { Feather } from '@expo/vector-icons';

const Settings = () => {
  const { logout } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [syncTime, setSyncTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const bioEnabled = await AsyncStorage.getItem('biometricEnabled');
      const lastSync = await AsyncStorage.getItem('lastSyncTime');
      if (bioEnabled) setBiometricEnabled(bioEnabled === 'true');
      if (lastSync) setSyncTime(lastSync);

      checkLocationServicesStatus();
    };
    loadData();
  }, []);

  const checkLocationServicesStatus = async () => {
    let enabled = await Location.hasServicesEnabledAsync();
    setLocationServicesEnabled(enabled);
    if (!enabled) {
      Alert.alert(
        'Ubicación Desactivada',
        'Por favor, activa los servicios de ubicación de tu dispositivo para usar todas las funciones.'
      );
    }
  };

  const handleClearData = async () => {
    Alert.alert('Confirmar', '¿Deseas borrar toda la data local?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, borrar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await AsyncStorage.clear();
          setLoading(false);
          Alert.alert('Éxito', 'Los datos han sido eliminados');
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Confirmar', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await logout();
          setLoading(false);
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {loading && (
        <View className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      <View className="p-4">
        <Text className="text-xl font-bold text-gray-800 mb-3">Seguridad</Text>
        <FingerSprint />
        <NotificationsToggle />
      </View>
      
      <View className="h-px bg-gray-200 mx-4" />

      <View className="p-4">
        <Text className="text-xl font-bold text-gray-800 mb-3">Información del Sistema</Text>
        <Text className="text-gray-600 text-base mb-1">Versión: {Constants.manifest?.version || 'Desconocida'}</Text>
        <Text className="text-gray-600 text-base mb-1">Dispositivo: {Device.deviceName || 'No detectado'}</Text>
        <Text className="text-gray-600 text-base mb-1">Plataforma: {Device.osName}</Text>
        <Text className="text-gray-600 text-base">Ubicación: {locationServicesEnabled ? 'Activa' : 'Desactivada'}</Text>
      </View>
      <View className="h-px bg-gray-200 mx-4" />

      <View className="p-4">
        <View className="flex-row items-center space-x-2 mb-3">
          <Feather name="settings" size={20} color="#4B5563" />
          <Text className="text-xl font-bold text-gray-800">Avanzado</Text>
        </View>

        <TouchableOpacity
          onPress={handleClearData}
          className="bg-red-50 border border-red-200 rounded-lg py-3 my-2"
        >
          <View className="flex-row items-center justify-center gap-2">
            <Feather name="trash-2" size={16} color="#dc2626" />
            <Text className="text-red-600 font-semibold">Borrar Data Local</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 border border-red-200 rounded-lg py-3 my-2"
        >
          <View className="flex-row items-center justify-center gap-2">
            <Feather name="log-out" size={16} color="#dc2626" />
            <Text className="text-red-600 font-semibold">Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="h-px bg-gray-200 mx-4" />

      <View className="px-4 py-6">
        <Text className="text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Grupo Alfa & Omega S. de R. L. de C. V. - Todos los derechos reservados
        </Text>
      </View>
    </ScrollView>
  );
};

export default Settings;