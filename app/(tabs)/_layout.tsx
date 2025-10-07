import ConnectivityBanner from '@/components/ConnectivityBanner';
import { useAuth } from '@/context/auth';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

import ProtectedLayout from '../ProtectedLayout';

import CatalogIcon from '@/assets/icons/CatalogIcon';
import ClientIcon from '@/assets/icons/ClientIcon';
import HomeIcon from '@/assets/icons/HomeIcon';
import InvoicesIcon from '@/assets/icons/InvoicesIcon';
import LocationIcon from '@/assets/icons/Locations';
import OrderIcon from '@/assets/icons/OrdeIcon';
import SettingsIcon from '@/assets/icons/SettingsIcon';

import { BottomSheetBackdrop, BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import ProductScreen from './catalog';
import ExploreScreen from './explore';
import IndexScreen from './index';
import InvoicesScreen from './invoices';
import LocationScreen from './locations';
import SettingsScreen from './setting';

const Drawer = createDrawerNavigator();

export default function Layout() {
  const ActiveColor = '#000';
  const InActiveColor = '#c9c9c9';
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo presentamos el modal automáticamente si no hay usuario (sesión expirada)
    bottomSheetModalRef.current?.present();
  }, [user]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <BottomSheetModal
          index={0}
          ref={bottomSheetModalRef}
          style={{ paddingHorizontal: 20 }}
          backgroundStyle={{ borderRadius: 30 }}
          enableDynamicSizing={true}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              appearsOnIndex={0}
              disappearsOnIndex={-1}
              opacity={0.5}
              pressBehavior="none"
            />
          )}
        >
          <BottomSheetView>
            <View className="items-center gap-4">
              <Text className="font-[Poppins-SemiBold] text-xl mb-2 text-red-600 tracking-[-0.3px]">
                Sesión expirada
              </Text>

              <Text className="font-[Poppins-Regular] text-base text-gray-700 text-center mb-5 tracking-[-0.3px]">
                Vuelve a iniciar sesión para continuar usando la aplicación.
              </Text>

              <TouchableOpacity
                onPress={() => { bottomSheetModalRef.current?.dismiss(); router.push('/login'); }}
                className="bg-red-500 items-center justify-center h-[50px] rounded-full w-full mb-2"
              >
                <Text className="text-white tracking-[-0.3px] font-[Poppins-Medium] text-lg">Iniciar sesión nuevamente</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        <ProtectedLayout>
          <ConnectivityBanner />
          <Drawer.Navigator
            screenOptions={{
              headerShown: true,
              drawerActiveTintColor: ActiveColor,
              drawerInactiveTintColor: InActiveColor,
              drawerStyle: Platform.select({
                ios: { backgroundColor: '#fff' },
                android: {},
              }),
              headerStyle: {
                shadowColor: 'transparent',
                elevation: 0,
                borderBottomWidth: 0,
              },
              headerTitleStyle: {
                fontFamily: 'Poppins-SemiBold',
                letterSpacing: -0.6,
                color: "#000",
              },
              drawerLabelStyle: {
                fontFamily: 'Poppins-Medium',
                fontSize: 16,
                letterSpacing: -0.6,
              },
            }}
            drawerContent={(props) => <CustomDrawerContent {...props} ActiveColor={ActiveColor} InActiveColor={InActiveColor} />}
          >
            <Drawer.Screen
              name="index"
              component={IndexScreen}
              options={{
                title: 'Dashboard',
                drawerIcon: ({ focused }) => (
                  <HomeIcon size={26} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="explore"
              component={ExploreScreen}
              options={{
                title: 'Pedidos',
                drawerIcon: ({ focused }) => (
                  <OrderIcon size={26} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="invoices"
              component={InvoicesScreen}
              options={{
                title: 'Cobros',
                drawerIcon: ({ focused }) => (
                  <InvoicesIcon size={26} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="catalog"
              component={ProductScreen}
              options={{
                title: 'Catalogo',
                headerTitle: '',
                headerStyle: { backgroundColor: '#f9fafb', elevation: 0, borderBottomWidth: 0 },
                drawerIcon: ({ focused }) => (
                  <CatalogIcon size={24} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="location"
              component={LocationScreen}
              options={{
                title: 'Ubicaciones',
                drawerIcon: ({ focused }) => (
                  <LocationIcon size={24} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="settings"
              component={SettingsScreen}
              options={{
                title: 'Ajustes',
                drawerIcon: ({ focused }) => (
                  <SettingsIcon size={26} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
          </Drawer.Navigator>
        </ProtectedLayout>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function CustomDrawerContent(props: any) {
  const { user } = useAuth();

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View className="bg-[#fcde41] w-[50px] h-[50px] items-center justify-center rounded-full">
          <ClientIcon size={30} color="#000" />
        </View>

        <View>
          <Text className="font-[Poppins-SemiBold] text-lg">
            {user?.fullName ?? 'Usuario'}
          </Text>
          <Text className="font-[Poppins-Regular] text-sm text-neutral-500">
            Codigo: {user?.employeeCode ?? 'codigo no disponible'}
          </Text>
        </View>
      </View>

      {/* Lista de rutas */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}
