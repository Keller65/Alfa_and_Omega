import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { ProductDiscount } from '@/types/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import axios from 'axios';
import Checkbox from 'expo-checkbox';
import { Image as ExpoImage } from 'expo-image';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, FadeOutUp } from 'react-native-reanimated';
import '../../global.css';
import { ScrollView } from 'react-native-gesture-handler';

// Definimos los tipos para los parámetros y las estructuras
type Category = {
  code: string;
  name: string;
};

type GroupedProducts = {
  [key: string]: {
    name: string;
    products: ProductDiscount[];
  };
};

// Genera un HTML simple para un producto con foto, nombre y código
function generateProductHtml(product: ProductDiscount) {
  return `
    <div style="display:flex;align-items:center;border:1px solid #eee;border-radius:12px;padding:16px;margin-bottom:12px;">
      <img src="https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/${product.itemCode ?? '100000'}.jpg"
           alt="Producto" 
           style="width:170px;height:170px;object-fit:cover;border-radius:8px;margin-right:16px;">
      <div>
        <div style="font-size:22px;font-weight:600;margin-bottom:4px;font-family:'Poppins-Medium',Arial,sans-serif;">${product.itemName}</div>
        ${product.barCode ? `<div style="font-size:16px;color:#888;font-family:'Poppins-Medium',Arial,sans-serif;">Código: ${product.barCode}</div>` : ''}
        <div style="font-size:16px;margin-bottom:4px;font-family:'Poppins-Medium',Arial,sans-serif;">${product.salesUnit} x ${product.salesItemsPerUnit}</div>
      </div>
    </div>
  `;
}

// Nueva función para agrupar productos por categoría
function groupProductsByCategory(products: ProductDiscount[], categories: Category[]): GroupedProducts {
  const grouped: GroupedProducts = {};

  categories.forEach((category) => {
    grouped[category.code] = {
      name: category.name,
      products: [],
    };
  });

  // Asegurarse de que los productos tengan la propiedad `categoryCode` asignada correctamente
  products.forEach((product) => {
    if (product.groupCode && grouped[product.groupCode]) {
      grouped[product.groupCode].products.push(product);
    } else {
      console.warn(`Producto sin categoría asignada: ${product.itemName}`);
    }
  });

  return grouped;
}

const ProductScreen = () => {
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductDiscount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Estado de carga
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);

  // Fetch de categorías al cargar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://200.115.188.54:4325/sap/items/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('❌ Error al cargar las categorías', error);
      }
    };

    fetchCategories();
  }, []);

  // Genera y comparte PDF
  const handleGeneratePdf = async (htmlContent: string) => {
    try {
      const { uri } = await Print.printToFileAsync({
        html: `
          <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body { font-family: Arial, sans-serif; padding: 16px; }
              </style>
            </head>
            <body>
              <h2 style="text-align:center;">Catálogo de Productos</h2>
              ${htmlContent}
            </body>
          </html>
        `,
      });

      console.log('✅ PDF generado en:', uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
    }
  };

  const handleCategorySelection = (categoryCode: string) => {
    setSelectedCategories((prev) => {
      if (categoryCode === 'all') {
        return prev.includes('all') ? [] : ['all'];
      }

      const updated = prev.includes(categoryCode)
        ? prev.filter((code) => code !== categoryCode)
        : [...prev.filter((code) => code !== 'all'), categoryCode];

      return updated;
    });
  };

  const filteredCategories = categories.filter((category) =>
    selectedCategories.includes('all') || selectedCategories.includes(category.code)
  );

  const handleGenerateCatalog = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<ProductDiscount[]>(
        `/api/Catalog/products/all?priceList=1&pageSize=1000`,
        {
          baseURL: fetchUrl,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      setProducts(response.data);

      // Agrupar productos por categorías seleccionadas
      const groupedProducts = groupProductsByCategory(response.data, filteredCategories);

      // Generar contenido HTML agrupado por categoría
      const pdfContent = Object.keys(groupedProducts)
        .map((categoryCode) => {
          const category = groupedProducts[categoryCode];
          const productsHtml = category.products
            .map((product) =>
              generateProductHtml({
                ...product,
                itemCode: product?.itemCode !== undefined ? String(product.itemCode) : 'SIN-CÓDIGO',
                itemName: product?.itemName ?? 'Sin nombre',
              })
            )
            .join('');

          return `
            <h3 style="font-family:'Poppins-SemiBold',Arial,sans-serif;">${category.name}</h3>
            ${productsHtml}
          `;
        })
        .join('');

      await handleGeneratePdf(pdfContent);

      bottomSheetRef.current?.close();
    } catch (error) {
      console.error('❌ Error al cargar los productos', error);
    } finally {
      setIsLoading(false);
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
            Facil, y Rapido
          </Text>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.duration(400).delay(800)}
          exiting={FadeOutDown.duration(400)}
          key="catalogo"
        >
          <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.6px] text-gray-900">
            Generar Catálogo
          </Text>
        </Animated.View>
      </View>

      <View className="flex-1 bg-white rounded-t-[30px] p-4 z-1 shadow-xl">
        <Text className="text-md text-gray-400 font-[Poppins-SemiBold] tracking-[-0.4px] mb-2">
          Exportar Catálogo
        </Text>
        <View className="w-full flex flex-row gap-4 items-center mb-10">
          <View className="h-[120px] w-[120px] bg-gray-100 rounded-3xl items-center justify-center">
            <ExpoImage
              source={require('@/assets/images/catalog.png')}
              style={{ height: '90%', width: '90%' }}
            />
          </View>

          <View className="flex-1 flex-col py-6 h-[120px] justify-between">
            <Text className="text-xl leading-6 text-black font-[Poppins-SemiBold] tracking-[-0.6px] mb-2">
              Catálogo de Productos
            </Text>

            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.present()}
              className="bg-yellow-300 py-2 px-4 rounded-full w-[110px] h-fit items-center justify-center"
            >
              <Text className="text-sm text-black font-[Poppins-SemiBold] tracking-[-0.4px]">
                Exportar PDF
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
        <BottomSheetView className="flex-1 px-4 pb-6">
          <Text className="text-lg font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-900 mt-2 mb-3 text-center">
            ¿Deseas exportar el catálogo de productos en PDF?
          </Text>
          <Text className="text-sm text-gray-500 mb-5 text-center font-[Poppins-Regular] tracking-[-0.3px]">
            Se generará un archivo PDF con la lista de productos, incluyendo nombre, código, imagen y precio.
          </Text>

          {/* <Text className="text-md font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-900 mt-4 mb-2">
            Selecciona las categorías para el catálogo:
          </Text> */}
{/* 
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 200, marginBottom: 16, flex: 1 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
          >
            <View
              className="h-[40px] w-[46%] px-3"
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
            >
              <Checkbox
                style={{ borderRadius: 6, borderColor: '#000' }}
                value={selectedCategories.includes('all')}
                onValueChange={() => handleCategorySelection('all')}
                color={selectedCategories.includes('all') ? '#FFD700' : undefined}
              />
              <Text className="ml-2 leading-5 text-black tracking-[-0.3px] font-[Poppins-Regular]">Todas</Text>
            </View>

            {categories.map((category) => (
              <View
                className="h-[40px] w-[46%] px-3"
                key={category.code}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
              >
                <Checkbox
                  style={{ borderRadius: 6, borderColor: '#000' }}
                  value={selectedCategories.includes(category.code)}
                  onValueChange={() => handleCategorySelection(category.code)}
                  color={selectedCategories.includes(category.code) ? '#FFD700' : undefined}
                />
                <Text className="ml-2 leading-5 text-black tracking-[-0.3px] font-[Poppins-Regular]">{category.name}</Text>
              </View>
            ))}
          </ScrollView> */}

          <TouchableOpacity
            className="bg-yellow-300 py-3 h-[50px] flex-1 px-4 rounded-full items-center justify-center"
            onPress={handleGenerateCatalog}
            disabled={isLoading}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#000" />
                <Text className="text-black text-md font-[Poppins-SemiBold] ml-2">
                  Generando Catálogo...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-3">
                <FontAwesome name="file-text" size={20} color="black" />
                <Text className="text-black text-md font-[Poppins-SemiBold]">
                  Generar Catálogo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-400 text-center mt-5 font-[Poppins-Regular] tracking-[-0.3px]">
            Este proceso puede tardar unos segundos dependiendo de la cantidad de productos y calidad de conexión a internet.
          </Text>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
};

export default ProductScreen;