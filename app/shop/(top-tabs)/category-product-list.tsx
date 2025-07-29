import { useAppStore } from '@/state/index';
import { BottomSheetBackdrop, BottomSheetFooter, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';
import { Image as ExpoImage } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MinusIcon from '@/assets/icons/MinusIcon';
import PlusIcon from '@/assets/icons/PlusIcon';
import { useAuth } from '@/context/auth';
import { ProductDiscount } from '@/types/types';

const PAGE_SIZE = 20;

const DEFAULT_PRODUCT_IMAGE = 'https://pub-978b0420802d40dca0561ef586d321f7.r2.dev/bote%20de%20chile%20tabasco%201%20galon.png';

const ProductItem = memo(({ item, onPress }: { item: ProductDiscount, onPress: (item: ProductDiscount) => void }) => {
  const itemInCart = useAppStore(state =>
    state.products.find(p => p.itemCode === item.itemCode)
  );

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="mb-4 bg-white w-[190px] gap-3 p-2"
    >
      <View className="rounded-2xl bg-gray-100 items-center justify-center h-[180px] relative">
        {itemInCart && (
          <View className="absolute top-2 right-2 bg-black rounded-full w-6 h-6 items-center justify-center z-10">
            <Text className="text-white text-xs font-[Poppins-Bold]">{itemInCart.quantity}</Text>
          </View>
        )}
        <ExpoImage
          source={{ uri: item.imageUrl || DEFAULT_PRODUCT_IMAGE }}
          className="w-[150px] h-[150px]"
          contentFit="contain"
          transition={500}
        />
      </View>

      <View>
        <Text className="font-medium text-sm text-black">L. {item.price.toFixed(2)}</Text>
        <Text
          className="font-medium text-sm leading-4"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.itemName.toLowerCase()}
        </Text>
        <Text className="text-[10px] text-gray-400">{item.barCode}</Text>
        <Text className="text-[10px] text-gray-400">Stock: {item.inStock}</Text>
      </View>
    </TouchableOpacity>
  );
});

const CategoryProductScreen = memo(() => {
  const { user } = useAuth();
  const route = useRoute();
  const { groupCode, priceListNum } = route.params as { groupCode?: string, priceListNum?: string };

  const addProduct = useAppStore(state => state.addProduct);
  const updateQuantity = useAppStore(state => state.updateQuantity);
  const productsInCart = useAppStore(state => state.products);
  const debouncedSearchText = useAppStore(state => state.debouncedSearchText);

  const pagesCacheRef = useRef<Map<number, ProductDiscount[]>>(new Map());

  const [items, setItems] = useState<ProductDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProductDiscount | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [editablePrice, setEditablePrice] = useState<number>(0);
  const [isPriceValid, setIsPriceValid] = useState<boolean>(true);
  const [editablePriceText, setEditablePriceText] = useState<string>('0.00');

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const FETCH_URL = process.env.EXPO_PUBLIC_API_URL + "/sap/items/";

  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ['70%', '100%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setSelectedItem(null);
  }, []);

  const fetchProducts = useCallback(async ({ forceRefresh = false, loadMore = false } = {}) => {
    if (!user?.token) {
      setLoading(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }

    const currentPage = loadMore ? page : 1;

    if (!forceRefresh && !loadMore && pagesCacheRef.current.has(currentPage)) {
      setItems(Array.from(pagesCacheRef.current.values()).flat());
      setLoading(false);
      return;
    }

    loadMore ? setLoadingMore(true) : setLoading(true);
    setError(null);

    try {
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      };

      let url = `${FETCH_URL}active?page=${currentPage}&pageSize=${PAGE_SIZE}`;

      if (priceListNum) {
        url += `&priceList=${priceListNum}`;
      }

      if (groupCode) {
        url += `&groupCode=${groupCode}`;
      }

      const itemsResponse = await axios.get(url, { headers });

      const newItems = itemsResponse.data.items;

      if (forceRefresh) {
        pagesCacheRef.current = new Map();
      }
      pagesCacheRef.current.set(currentPage, newItems);

      setItems(prevItems =>
        loadMore ? [...prevItems, ...newItems] : Array.from(pagesCacheRef.current.values()).flat()
      );

      setPage(currentPage);
      setTotalItems(itemsResponse.data.total);

    } catch (err: any) {
      setError(err?.message || 'Error inesperado');
      if (!loadMore) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user?.token, groupCode, priceListNum, page]);

  useEffect(() => {
    pagesCacheRef.current = new Map();
    setItems([]);
    setPage(1);
    setLoading(true);
    fetchProducts();
  }, [groupCode, priceListNum]);

  useEffect(() => {
    if (!selectedItem) {
      setTotal(0);
      setUnitPrice(0);
      setEditablePrice(0);
      setEditablePriceText('0.00');
      setIsPriceValid(true);
      return;
    }

    let calculatedUnitPrice = selectedItem.price;
    const applicable = selectedItem.tiers?.filter(t => quantity >= t.qty).sort((a, b) => b.qty - a.qty)[0];
    if (applicable) {
      calculatedUnitPrice = applicable.price;
    }

    setUnitPrice(calculatedUnitPrice);
    setEditablePrice(calculatedUnitPrice);
    setEditablePriceText(calculatedUnitPrice.toFixed(2));
    setTotal(calculatedUnitPrice * quantity);
    setIsPriceValid(true);
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem && editablePrice > 0 && quantity > 0) {
      setTotal(editablePrice * quantity);
      if (editablePrice < selectedItem.price) {
        setIsPriceValid(false);
      } else {
        setIsPriceValid(true);
      }
    } else {
      setTotal(0);
    }
  }, [editablePrice, quantity, selectedItem]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    pagesCacheRef.current = new Map();
    setPage(1);
    fetchProducts({ forceRefresh: true });
  }, [fetchProducts]);

  const loadMoreItems = useCallback(() => {
    if (!loadingMore && items.length < totalItems) {
      setPage(prev => prev + 1);
    }
    if (!loadingMore && items.length >= totalItems && items.length % PAGE_SIZE === 0) {
      setPage(prev => prev + 1);
    }
  }, [loadingMore, items.length, totalItems]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts({ loadMore: true });
    }
  }, [page, fetchProducts]);

  const handleProductPress = useCallback((item: ProductDiscount) => {
    setSelectedItem(item);
    setQuantity(1);
    bottomSheetModalRef.current?.present();
    console.log('Producto seleccionado:', item);
  }, []);

  const handleAddToCart = useCallback(() => {
    const finalPrice = editablePrice;

    if (!selectedItem || quantity <= 0 || !isPriceValid || finalPrice <= 0) {
      return;
    }

    const itemInCart = productsInCart.find(p => p.itemCode === selectedItem.itemCode);
    const productData = { ...selectedItem, quantity, unitPrice: finalPrice };

    console.log("Producto agregado al carrito:", productData);

    if (itemInCart) {
      Alert.alert(
        'Producto ya en carrito',
        `${selectedItem.itemName} ya está en tu carrito. ¿Actualizar cantidad y precio?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Actualizar',
            onPress: () => {
              updateQuantity(selectedItem.itemCode, quantity, finalPrice);
              bottomSheetModalRef.current?.dismiss();
            },
          },
        ]
      );
    } else {
      addProduct(productData);
      bottomSheetModalRef.current?.dismiss();
    }
  }, [addProduct, productsInCart, quantity, selectedItem, editablePrice, isPriceValid, updateQuantity]);

  const filteredItems = useMemo(() => {
    const text = debouncedSearchText?.toLowerCase() || '';
    return items.filter(item =>
      item.barCode?.toLowerCase().includes(text) ||
      item.itemName?.toLowerCase().includes(text) ||
      item.groupName?.toLowerCase().includes(text)
    );
  }, [items, debouncedSearchText]);

  const renderItem = useCallback(({ item }: { item: ProductDiscount }) => (
    <ProductItem item={item} onPress={handleProductPress} />
  ), [handleProductPress]);

  const renderFooter = useCallback((props: any) => (
    selectedItem ? (
      <BottomSheetFooter {...props}>
        <View
          className='w-full px-4 pt-4 bg-white border-t border-gray-200'
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <TouchableOpacity className="bg-gray-200 rounded-full p-2" onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                <MinusIcon size={20} />
              </TouchableOpacity>
              <TextInput
                value={quantity.toString()}
                onChangeText={(text) => setQuantity(Math.max(1, parseInt(text.replace(/[^0-9]/g, '')) || 1))}
                keyboardType="numeric"
                className="mx-4 text-center text-lg text-black w-12"
              />
              <TouchableOpacity className="bg-gray-200 rounded-full p-2" onPress={() => setQuantity(q => q + 1)}>
                <PlusIcon size={20} />
              </TouchableOpacity>
            </View>
            <View className="w-[130px]">
              <Text className="font-[Poppins-Bold] text-gray-500 tracking-[-0.3px] leading-3">Total</Text>
              <Text className="text-2xl font-[Poppins-Bold] tracking-[-0.3px]">
                {new Intl.NumberFormat('es-HN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  useGrouping: true
                }).format(total)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className={`mt-4 rounded-full py-3 items-center justify-center h-[50px] ${!selectedItem || quantity <= 0 || !isPriceValid || editablePrice <= 0
              ? 'bg-gray-400'
              : 'bg-black'
              }`}
            onPress={handleAddToCart}
            disabled={!selectedItem || quantity <= 0 || !isPriceValid || editablePrice <= 0}
          >
            <Text className="text-white font-[Poppins-Bold]">Agregar al carrito</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ) : null
  ), [selectedItem, quantity, total, editablePrice, isPriceValid, handleAddToCart, insets.bottom, setQuantity]);

  if (loading && !loadingMore) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-4 text-gray-600">Cargando productos...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text className="text-blue-500">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlashList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.itemCode}
        estimatedItemSize={200}
        numColumns={2}
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          loadingMore !== false ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#000" />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingBottom: 20,
        }}
        drawDistance={500}
        overrideItemLayout={(layout) => {
          layout.size = 100;
        }}
      />

      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />
        )}
        footerComponent={renderFooter}
      >
        <BottomSheetView style={{ flex: 1 }}>
          {selectedItem && (
            <View>
              <View className="w-full h-[230px] items-center justify-center bg-gray-200 mb-4 shadow-sm shadow-gray-400">
                <ExpoImage
                  source={{ uri: selectedItem.imageUrl || DEFAULT_PRODUCT_IMAGE }}
                  className="w-[230px] h-[230px]"
                  contentFit="contain"
                  transition={500}
                />
              </View>

              <View className='px-[16px]'>
                <Text className="text-[24px] font-[Poppins-Bold] tracking-[-0.3px] leading-8 text-gray-900">
                  {selectedItem.itemName}
                </Text>

                <View className="bg-white py-4 rounded-lg">
                  <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px] text-gray-800 leading-3">Precio de Venta:</Text>
                  <View className="flex-row items-center">
                    <Text className="font-[Poppins-Bold] text-lg tracking-[-0.3px] text-black mr-2">L.</Text>
                    <TextInput
                      className={`p-2 text-lg font-[Poppins-Bold] text-black w-[100px] ${!isPriceValid ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      value={editablePriceText}
                      onChangeText={(text) => {
                        const cleanedText = text.replace(/[^0-9.]/g, '');
                        const parts = cleanedText.split('.');
                        if (parts.length > 2) {
                          setEditablePriceText(parts[0] + '.' + parts.slice(1).join(''));
                        } else {
                          setEditablePriceText(cleanedText);
                        }

                        let parsedValue = parseFloat(cleanedText);
                        setEditablePrice(isNaN(parsedValue) ? 0 : parsedValue);
                      }}
                      keyboardType="numeric"
                      onBlur={() => {
                        let finalValue = parseFloat(editablePriceText);

                        if (isNaN(finalValue) || finalValue <= 0) {
                          finalValue = selectedItem.price;
                        } else if (selectedItem && finalValue < selectedItem.price) {
                          finalValue = selectedItem.price;
                        }

                        setEditablePrice(finalValue);
                        setEditablePriceText(finalValue.toFixed(2));
                        setIsPriceValid(finalValue >= selectedItem.price);
                      }}
                    />
                  </View>
                  {!isPriceValid && (
                    <Text className="text-red-600 text-xs mt-1 font-[Poppins-Regular] tracking-[-0.3px]">El precio no puede ser menor al precio base.</Text>
                  )}
                  <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">Precio base original: L.{selectedItem.price.toFixed(2)}</Text>

                  <View className="flex-1 mt-2">
                    <View className="bg-gray-100 p-3 rounded-lg">
                      <Text className="font-[Poppins-SemiBold] text-xs tracking-[-0.3px] text-gray-700 mb-1">Inventario:</Text>
                      <View className='flex-row gap-2 items-center justify-between'>
                        <Text className="font-[Poppins-Bold] text-base text-gray-900">Disponible: {selectedItem.inStock}</Text>
                        <Text className="font-[Poppins-Regular] text-sm text-gray-600">En Pedido: {selectedItem.ordered}</Text>
                        <Text className="font-[Poppins-Regular] text-sm text-gray-600">Comprometido: {selectedItem.committed}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {selectedItem.tiers?.length > 0 && (
                  <View className="bg-gray-100 p-4 rounded-lg mb-4">
                    <Text className="font-[Poppins-Bold] text-base tracking-[-0.3px] mb-3 text-gray-800">Precios por Cantidad:</Text>
                    {selectedItem.tiers.map((tier, index) => (
                      <View key={index} className="mb-2">
                        <Text className="font-[Poppins-SemiBold] text-sm tracking-[-0.3px] text-gray-700">
                          Desde {tier.qty} unidades: <Text className="font-[Poppins-Bold] text-base">L. {tier.price.toFixed(2)}</Text>
                          {tier.percent > 0 && <Text className="text-green-600"> ({tier.percent}% desc)</Text>}
                        </Text>
                        {tier.expiry && (
                          <Text className="font-[Poppins-Regular] text-xs text-gray-500">
                            Válido hasta: {tier.expiry}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                <View className="flex-1 flex-row w-full h-fit justify-between gap-4">
                  <View className="bg-gray-100 p-3 flex-1 rounded-lg h-[60px]">
                    <Text className="font-[Poppins-SemiBold] text-xs tracking-[-0.3px] text-gray-700 mb-1">Código de Barras:</Text>
                    <Text className="font-[Poppins-Bold] text-base text-gray-900">{selectedItem.barCode}</Text>
                  </View>
                  <View className="bg-gray-100 p-3 flex-1 rounded-lg h-[60px]">
                    <Text className="font-[Poppins-SemiBold] text-xs tracking-[-0.3px] text-gray-700 mb-1">Unidad de Venta:</Text>
                    <Text className="font-[Poppins-Bold] text-base text-gray-900">{selectedItem.salesUnit} x {selectedItem.salesItemsPerUnit}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
});

export default CategoryProductScreen;