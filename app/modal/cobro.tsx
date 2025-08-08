import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants'

const cobro = () => {
  return (
    <SafeAreaView style={{ paddingTop: -Constants.statusBarHeight, flex: 1, backgroundColor: '#fff' }}>
      <Text>Pantalla de cobros</Text>
    </SafeAreaView>
  )
}

export default cobro