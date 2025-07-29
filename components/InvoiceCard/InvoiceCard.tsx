import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';

export default function InvoiceCard() {
  return (
    <View className="bg-white p-4 rounded-2xl mx-4 mt-4 shadow-lg">
      
      {/* Encabezado */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-black text-base font-[Poppins-Regular] tracking-[-0.3px]">Griverson Trust</Text>
        <Text className="text-xs text-orange-500 border border-orange-500 px-2 py-0.5 rounded-full font-[Poppins-Regular] tracking-[-0.3px]">Pendiente</Text>
      </View>

      {/* Monto */}
      <Text className="text-black text-xl font-bold mb-2 font-[Poppins-Regular] tracking-[-0.3px]">USD 7,650.00</Text>

      {/* Fechas */}
      <View className="flex-row justify-between mb-4">
        <View>
          <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">Emitido:</Text>
          <Text className="text-sm text-black font-[Poppins-Regular] tracking-[-0.3px]">07/10/24</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">Vence:</Text>
          <Text className="text-sm text-black font-[Poppins-Regular] tracking-[-0.3px]">21/10/24</Text>
        </View>
      </View>

      {/* Switch */}
      <View className="flex-row justify-between items-center border-t border-gray-200 pt-3 mb-3">
        <Text className="text-sm text-black font-[Poppins-Regular] tracking-[-0.3px]">Marcar como pagado</Text>
        <Switch />
      </View>

      {/* Botones */}
      <View className="flex-row justify-between mb-3">
        <View className="items-center">
          <TouchableOpacity className="bg-gray-200 rounded-full p-3 h-[60px] w-[60px] items-center justify-center" onPress={() => {}}>
            <Feather name="edit-3" size={20} color="black" />
          </TouchableOpacity>
          <Text className="text-xs text-black mt-1 font-[Poppins-Regular] tracking-[-0.3px]">Editar</Text>
        </View>

        <View className="items-center">
          <TouchableOpacity className="bg-gray-200 rounded-full p-3 h-[60px] w-[60px] items-center justify-center" onPress={() => {}}>
            <Feather name="send" size={20} color="black" />
          </TouchableOpacity>
          <Text className="text-xs text-black mt-1 font-[Poppins-Regular] tracking-[-0.3px]">Enviar</Text>
        </View>

        <View className="items-center">
          <TouchableOpacity className="bg-gray-200 rounded-full p-3 h-[60px] w-[60px] items-center justify-center" onPress={() => {}}>
            <MaterialIcons name="content-copy" size={20} color="black" />
          </TouchableOpacity>
          <Text className="text-xs text-black mt-1 font-[Poppins-Regular] tracking-[-0.3px]">Duplicar</Text>
        </View>

        <View className="items-center">
          <TouchableOpacity className="bg-gray-200 rounded-full p-3 h-[60px] w-[60px] items-center justify-center" onPress={() => {}}>
            <AntDesign name="printer" size={20} color="black" />
          </TouchableOpacity>
          <Text className="text-xs text-black mt-1 font-[Poppins-Regular] tracking-[-0.3px]">Imprimir</Text>
        </View>
      </View>

      {/* Botón eliminar */}
      <TouchableOpacity className="bg-red-100 py-2 rounded-xl items-center">
        <View className="flex-row items-center">
          <FontAwesome name="trash-o" size={16} color="red" />
          <Text className="text-red-500 font-semibold ml-2 font-[Poppins-Regular] tracking-[-0.3px]">Eliminar</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
