import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetFlatList, BottomSheetModal, } from '@gorhom/bottom-sheet';
import { memo, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, TextInput, } from 'react-native';
import { AccountTransderencia } from '@/types/types';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import '../../global.css';
import Feather from '@expo/vector-icons/Feather';

const snapPoints = ['65%'];

const BankItem = memo(({ item }: { item: AccountTransderencia }) => {
  return (
    <View className="mb-3 border-b pb-3 border-gray-200 px-4">
      <View className="flex-row gap-4 items-center">
        <View className="flex-1">
          <Text
            className="font-[Poppins-SemiBold] tracking-[-0.3px]"
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default function BottomSheetBanks() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [banks, setBanks] = useState<AccountTransderencia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get<AccountTransderencia[]>(
        'http://200.115.188.54:4325/api/BankAccounts/PayTranferencia',
      );
      setBanks(data);
    } catch (err) {
      console.error('Error fetching banks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBanks = useMemo(() => {
    if (!searchTerm) {
      return banks;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return banks.filter(
      (bank) =>
        bank.code.toLowerCase().includes(lowercasedSearchTerm) ||
        bank.name.toLowerCase().includes(lowercasedSearchTerm),
    );
  }, [banks, searchTerm]);

  const openBankList = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetRef.current?.present();
  }, []);

  const closeBankList = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) closeBankList();
    },
    [closeBankList],
  );

  const renderItem = useCallback(
    ({ item }: { item: AccountTransderencia }) => <BankItem item={item} />,
    [],
  );

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-black shadow-lg shadow-[#09f]/30"
        onPress={openBankList}
      >
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
      >
        <View className="px-4">
          <Text className="text-lg text-start font-[Poppins-Bold] tracking-[-0.3px]">
            Cuentas Bancarias
          </Text>
          <View className="flex-row items-center justify-center space-x-2 bg-gray-100 rounded-2xl mt-4 px-2">
            <Feather name="search" size={20} color="gray" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Buscar banco..."
              placeholderTextColor="gray"
              className="flex-1 p-2 text-base font-[Poppins-Regular]"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')} className='p-1'>
                <Feather name="x-circle" size={20} color="gray" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className='flex-1'>
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#000" />
            </View>
          ) : (
            <BottomSheetFlatList<AccountTransderencia>
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              renderItem={renderItem}
              ListHeaderComponent={<View className="pt-2" />}
            />
          )}
        </View>
      </BottomSheetModal>
    </View>
  );
}