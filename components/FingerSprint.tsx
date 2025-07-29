import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const BiometricToggle = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      const bio = await AsyncStorage.getItem('biometricEnabled');
      setEnabled(bio === 'true');
    };
    load();
  }, []);

  const toggleSwitch = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometría no disponible',
          'Tu dispositivo no soporta biometría o no tienes huella/Face ID configurada.'
        );
        return;
      }
    }
    setEnabled(value);
    await AsyncStorage.setItem('biometricEnabled', value ? 'true' : 'false');
  };

  return (
    <View className="bg-white rounded-xl p-5 flex-row items-center justify-between">
      <View className="flex-row items-center space-x-4 gap-3">
        <MaterialIcons name="fingerprint" size={36} color="#000" />
        <View>
          <Text className="text-lg font-semibold text-gray-900">
            Autenticación biométrica
          </Text>
          <Text className="text-gray-500 text-sm">
            Usa huella o Face ID para iniciar sesión
          </Text>
        </View>
      </View>

      <Switch
        trackColor={{ false: '#9ca3af', true: '#2563EB' }}
        thumbColor={enabled ? '#1D4ED8' : '#f4f3f4'}
        ios_backgroundColor="#9ca3af"
        onValueChange={toggleSwitch}
        value={enabled}
      />
    </View>
  );
};

export default BiometricToggle;