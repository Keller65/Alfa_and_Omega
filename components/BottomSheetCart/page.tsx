import CartIcon from '@/assets/icons/CartIcon';
import MinusIcon from '@/assets/icons/MinusIcon';
import PlusIcon from '@/assets/icons/PlusIcon';
import TrashIcon from '@/assets/icons/TrashIcon';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state/index';
import { OrderDataType } from '@/types/types';
import { Feather, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetFlatList, BottomSheetFooter, BottomSheetFooterProps, BottomSheetModal, } from '@gorhom/bottom-sheet';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import '../../global.css';

const CartComponent = () => {
  

  return (
    <View>
      <Text>CartComponent</Text>
    </View>
  )
}

export default CartComponent