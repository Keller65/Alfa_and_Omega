import { useAuth } from '@/context/auth';
import api from '@/lib/api';
import { useAppStore } from '@/state';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Picker } from '@react-native-picker/picker';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, FadeOutUp } from 'react-native-reanimated';
import '../../global.css';

interface ProductScreenProps {
  code: string | number,
  name: string
}

const ProductScreen = () => {
  const [categories, setCategories] = useState<ProductScreenProps[]>([]);
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('0000');
  const [products, setProducts] = useState<ProductScreenProps[]>([]);

  async function fetchCategories() {
    try {
      const response = await api.get('/sap/items/categories', {
        baseURL: fetchUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        cache: {
          ttl: 1000 * 60 * 60 * 24,
        }
      });
      setCategories(response.data);
      console.info('Categorías cargadas:', response.data);
      console.info(response.cached ? 'Categorías cargadas desde cache' : 'Categorías cargadas desde red');
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    bottomSheetRef.current?.present();
  }, []);

  useEffect(() => {
    setCategories((prevCategories) => [
      { code: '0000', name: 'Todas' },
      ...prevCategories,
    ]);
  }, []);

  const handleGenerateCatalog = async (categoryCode: string) => {
    let currentPage = 1;
    let hasMore = true;

    try {
      while (hasMore) {
        const response = await api.get(
          `/sap/items/active?page=${currentPage}&pageSize=20&priceList=1&groupCode=${categoryCode}`,
          {
            baseURL: fetchUrl,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        console.log(`Respuesta de la API para la página ${currentPage}:`, response.data);

        if (response.data && response.data.length > 0) {
          setProducts((prevProducts) => [...prevProducts, ...response.data]);
          currentPage++;
        } else {
          hasMore = false; // Detener el bucle si no hay más datos
        }
      }
    } catch (error) {
      console.error(`Error al cargar los productos para la categoría ${categoryCode}:`, error);
    }
  };

  return (
    <View className="bg-gray-50 flex-1">
      {/* Header Animation */}
      <View className="items-center bg-gray-50 h-16">
        <Animated.View
          entering={FadeOutUp.duration(400).delay(500)}
          exiting={FadeOutUp.duration(400)}
          key="precios"
          className="absolute"
        >
          <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.6px] text-gray-900">
            Exportar Lista de precios
          </Text>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.duration(400).delay(800)}
          exiting={FadeOutDown.duration(400)}
          key="catalogo"
        >
          <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.6px] text-gray-900">
            Exportar Catálogo
          </Text>
        </Animated.View>
      </View>

      <View className="flex-1 bg-white rounded-t-[30px] p-4 z-1 shadow-xl">
        <Text className='text-md text-gray-400 font-[Poppins-SemiBold] tracking-[-0.4px] mb-2'>Exportar Catalogo</Text>
        <View className='w-full flex flex-row gap-4 items-center mb-10'>
          <View className='h-[120px] w-[120px] bg-gray-100 rounded-3xl items-center justify-center'>
            <ExpoImage
              source={require('@/assets/images/catalog.png')}
              style={{ height: '90%', width: '90%' }}
            />
          </View>

          <View className='flex-1 flex-col py-6 h-[120px] justify-between'>
            <Text className='text-xl leading-6 text-black font-[Poppins-SemiBold] tracking-[-0.6px] mb-2'>Catálogo de Productos</Text>

            <TouchableOpacity className='bg-yellow-300 py-2 px-4 rounded-full w-[110px] h-fit items-center justify-center'>
              <Text className='text-sm text-black font-[Poppins-SemiBold] tracking-[-0.4px]'>Exportar PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className='text-md text-gray-400 font-[Poppins-SemiBold] tracking-[-0.4px] mb-2'>Exportar Lista de Precios</Text>
        <View className='w-full flex flex-row justify-between items-center'>
          <View className='h-[120px] w-[120px] bg-gray-100 rounded-3xl items-center justify-center'>
            <ExpoImage
              source={require('@/assets/images/catalog.png')}
              style={{ height: '90%', width: '90%' }}
            />
          </View>

          <TouchableOpacity className='bg-yellow-300 py-2 px-4 rounded-full'>
            <Text className='text-sm text-black font-[Poppins-SemiBold] tracking-[-0.4px]'>Exportar PDF</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className='mt-4 bg-yellow-300 py-3 px-4 rounded-full'
          onPress={() => bottomSheetRef.current?.present()}
        >
          <Text className='text-sm text-black font-[Poppins-SemiBold] tracking-[-0.4px] text-center'>
            Ver Categorías
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        ref={bottomSheetRef}
        backgroundStyle={{ borderRadius: 30 }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetView className="flex-1 px-5 pb-6">
          <Text className="text-lg font-[Poppins-SemiBold] mb-3 text-black">Opciones de Catálogo</Text>

          {/* Seleccionar Categoría */}
          <Text className="text-base font-[Poppins-SemiBold] mb-2 text-gray-700">Selecciona una categoría:</Text>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={{ height: 50, width: '100%' }}
          >
            <Picker.Item style={{ fontFamily: 'Poppins-SemiBold' }} label="Todas" value="0000" />
            {categories.map((category) => (
              <Picker.Item
                style={{ fontFamily: 'Poppins-SemiBold' }}
                key={category.code}
                label={category.name}
                value={category.code}
              />
            ))}
          </Picker>

          {/* Opciones de Exportación */}
          <Text className="text-base font-[Poppins-SemiBold] mb-2 text-gray-700">Exportar como:</Text>
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity className="bg-yellow-300 py-2 px-4 rounded-full items-center justify-center">
              <Text className="text-sm text-black font-[Poppins-SemiBold]">PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-yellow-300 py-2 px-4 rounded-full items-center justify-center">
              <Text className="text-sm text-black font-[Poppins-SemiBold]">Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-yellow-300 py-2 px-4 rounded-full items-center justify-center">
              <Text className="text-sm text-black font-[Poppins-SemiBold]">CSV</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="bg-yellow-300 py-3 h-[50px] px-4 rounded-full mt-4 items-center justify-center" onPress={() => handleGenerateCatalog(selectedCategory)}>
            <Text className="text-black text-md font-[Poppins-SemiBold]">Generar Catálogo</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>

    </View>
  )
}

export default ProductScreen