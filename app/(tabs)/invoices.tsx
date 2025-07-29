import { View } from 'react-native'
import Constants from 'expo-constants'
import { Skeleton } from '@/components/ui/Skeleton'

const Invoices = () => {
  return (
    <View className='mt-2' style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}>

      <View className='flex-1 gap-y-3'>
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </View>
    </View>
  )
}

export default Invoices
