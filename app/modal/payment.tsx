import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants'

const payment = () => {
  return (
    <SafeAreaView style={{ paddingTop: -Constants.statusBarHeight, flex: 1, backgroundColor: '#fff' }}>
      <Text>Pantalla de Pagos</Text>
    </SafeAreaView>
  )
}

export default payment