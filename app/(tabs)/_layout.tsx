import { createDrawerNavigator } from '@react-navigation/drawer';
import ProtectedLayout from '../ProtectedLayout';
import { Platform } from 'react-native';

import HomeIcon from '@/assets/icons/HomeIcon';
import InvoicesIcon from '@/assets/icons/InvoicesIcon';
import SettingsIcon from '@/assets/icons/SettingsIcon';
import OrderIcon from '@/assets/icons/OrdeIcon';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import IndexScreen from './index';
import ExploreScreen from './explore';
import InvoicesScreen from './invoices';
import SettingsScreen from './settings';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const Drawer = createDrawerNavigator();

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ProtectedLayout>
          <Drawer.Navigator
            screenOptions={{
              headerShown: true,
              drawerActiveTintColor: '#000',
              drawerStyle: Platform.select({
                ios: {
                  backgroundColor: '#fff',
                },
                android: {},
              }),
              headerStyle: {
                shadowColor: 'transparent',
                elevation: 0,
                borderBottomWidth: 0,
              },
              headerTitleStyle: {
                fontFamily: 'Poppins-SemiBold',
                letterSpacing: -0.6
              },
              drawerLabelStyle: {
                fontFamily: 'Poppins-Medium',
                fontSize: 16,
                letterSpacing: -0.6
              },
            }}
          >
            <Drawer.Screen
              name="index"
              component={IndexScreen}
              options={{
                title: 'Inicio',
                drawerIcon: ({ color }) => <HomeIcon size={26} color={color} />,
              }}
            />
            <Drawer.Screen
              name="explore"
              component={ExploreScreen}
              options={{
                title: 'Pedidos',
                drawerIcon: ({ color }) => <OrderIcon size={26} color={color} />,
              }}
            />
            <Drawer.Screen
              name="invoices"
              component={InvoicesScreen}
              options={{
                title: 'Cobros',
                drawerIcon: ({ color }) => <InvoicesIcon size={26} color={color} />,
              }}
            />
            <Drawer.Screen
              name="settings"
              component={SettingsScreen}
              options={{
                title: 'Ajustes',
                drawerIcon: ({ color }) => <SettingsIcon size={26} color={color} />,
              }}
            />
          </Drawer.Navigator>
        </ProtectedLayout>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}