import { useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import CartIcon from '@/assets/icons/CartIcon';

const NavigateOrder = () => {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} className='bg-yellow-300 h-[50px] w-full items-center justify-center flex-row gap-4 fixed bottom-0'>
      <CartIcon color="black" />
      <Text className='text-black font-[Poppins-SemiBold] tracking-[-0.3px]'>Ver carrito</Text>
    </TouchableOpacity>
  )
}

export default NavigateOrder