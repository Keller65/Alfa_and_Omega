import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { useAuth } from '@/context/auth';
import FingerSprint from '@/components/FingerSprint';
import NotificationsToggle from '@/components/Notifications';

const Settings = () => {
  const { logout } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [syncTime, setSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const bioEnabled = await AsyncStorage.getItem('biometricEnabled');
      const lastSync = await AsyncStorage.getItem('lastSyncTime');
      if (bioEnabled) setBiometricEnabled(bioEnabled === 'true');
      if (lastSync) setSyncTime(lastSync);
    };
    loadData();
  }, []);

  const handleClearData = async () => {
    Alert.alert('Confirmar', '¿Deseas borrar toda la data local?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, borrar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          Alert.alert('Éxito', 'Los datos han sido eliminados');
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      style={{ paddingTop: Constants.statusBarHeight }}
    >
      {/* Configuraciones de Seguridad */}
      <View className="border-b border-gray-200 px-4 py-3">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Seguridad</Text>
        <FingerSprint />
        <NotificationsToggle />
      </View>

      {/* Información del sistema */}
      <View className="border-b border-gray-200 px-4 py-3">
        <Text className="text-lg font-semibold text-gray-700 mb-1">Información del Sistema</Text>
        <Text className="text-gray-600">Versión: {Constants.manifest?.version || 'Desconocida'}</Text>
        <Text className="text-gray-600">Dispositivo: {Device.deviceName || 'No detectado'}</Text>
        <Text className="text-gray-600">Plataforma: {Device.osName}</Text>
      </View>

      {/* Soporte y opciones avanzadas */}
      <View className="border-b border-gray-200 px-4 py-3">
        <Text className="text-lg font-semibold text-gray-700 mb-1">Avanzado</Text>
        <TouchableOpacity onPress={handleClearData} className="my-2">
          <Text className="text-center text-red-500">Borrar Data Local</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout}>
          <Text className="text-center text-red-500">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="px-4 py-5">
        <Text className="text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Grupo Alfa & Omega S. de R. L. de C. V. - Todos los derechos reservados
        </Text>
      </View>
    </ScrollView>
  );
};

export default Settings;
