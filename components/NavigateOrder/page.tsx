import { View, Text, TouchableOpacity } from 'react-native';
import CartIcon from '@/assets/icons/CartIcon';
import { useRouter } from 'expo-router';

const NavigateOrder = () => {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={()=> router.push('/(tabs)/explore')} className='bg-black h-[50px] w-full items-center justify-center flex-row gap-4 fixed bottom-0'>
      <CartIcon color="white" />
      <Text className='text-white font-[Poppins-Regular]'>Ver carrito</Text>
    </TouchableOpacity>
  )
}

export default NavigateOrder