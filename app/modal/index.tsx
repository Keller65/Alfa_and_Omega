import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, Pressable, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Invoice } from '@/types/types';
import { useAppStore } from '@/state';
import { useAuth } from '@/context/auth';
import { FlashList } from '@shopify/flash-list';
import ClientIcon from '@/assets/icons/ClientIcon';
import axios from 'axios';
import BottomSheetInvoices from '@/components/BottomSheetInvoices/page';

const IndexScreen = () => {
  const params = useLocalSearchParams();
  const { cardCode, cardName } = params as { cardCode: string, cardName: string };
  const { fetchUrl, addInvoice, selectedInvoices } = useAppStore();
  const { user } = useAuth();
  const FETCH_URL = `${fetchUrl}/sap/customers`;
  const [openInvoices, setOpenInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchInvoices = async () => {
    if (!user?.token || !cardCode) return;
    setLoading(true);

    try {
      const res = await axios.get(`${FETCH_URL}/${cardCode}/open-invoices`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      });
      setOpenInvoices(res.data || []);
    } catch (e: unknown) {
      console.error('Error al solicitar recibos pendientes:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, [cardCode, user?.token]);

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setAmount(invoice.balanceDue.toString());
    setError('');
    setModalVisible(true);
  };

  const handleAccept = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ingrese un monto válido.');
      return;
    }
    if (numAmount > (selectedInvoice?.balanceDue || 0)) {
      setError('El monto no puede ser mayor al saldo pendiente.');
      return;
    }
    if (selectedInvoice) {
      addInvoice(selectedInvoice);
      setModalVisible(false);
      console.log('Factura Guardada en Zustand: ', selectedInvoice)
    }
  };

  const renderItem = ({ item }: { item: Invoice }) => {
    const isSelected = selectedInvoices.some(inv => inv.numAtCard === item.numAtCard);

    return (
      <Pressable
        onPress={() => handleSelectInvoice(item)}
        className={`border border-black/10 p-4 mb-4 rounded-3xl ${isSelected ? 'bg-blue-100' : 'bg-white'}`}
      >
        <View className="flex-row justify-between mb-2 border border-b-black/10 border-t-transparent border-x-transparent pb-1">
          <Text className="text-lg font-[Poppins-SemiBold] tracking-[-0.3px] text-black">
            Nº {item.numAtCard}
          </Text>
        </View>
        <View className='w-full flex-row'>
          <View className="mb-2 flex-1 w-full px-4">
            <Text className="text-gray-600 text-sm font-[Poppins-Regular]">Total factura:</Text>
            <Text className="text-base font-[Poppins-SemiBold] text-black">
              L. {item.docTotal.toLocaleString()}
            </Text>
          </View>
          <View className="mb-2 flex-1 w-full px-4">
            <Text className="text-gray-600 text-sm font-[Poppins-Regular]">Saldo pendiente:</Text>
            <Text className="text-base font-[Poppins-SemiBold] text-red-600">
              L. {item.balanceDue.toLocaleString()}
            </Text>
          </View>
        </View>
        <View className="flex-row justify-between mt-2 gap-2">
          <View className='flex-1 w-full bg-gray-100 p-4 rounded-xl'>
            <Text className="text-xs text-gray-500">Fecha emisión</Text>
            <Text className="text-sm text-black">{formatDate(item.docDate)}</Text>
          </View>
          <View className='flex-1 w-full bg-gray-100 p-4 rounded-xl'>
            <Text className="text-xs text-gray-500">Fecha vencimiento</Text>
            <Text className="text-sm text-black">{formatDate(item.docDueDate)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white p-4 relative">
      <View className='z-10 absolute bottom-0'>
        <BottomSheetInvoices />
      </View>

      <View className='mt-2 gap-4 flex-row mb-4 py-2'>
        <View className="bg-[#fcde41] w-[50px] h-[50px] items-center justify-center rounded-full">
          <ClientIcon size={24} color="#000" />
        </View>
        <View className='flex justify-center'>
          <Text className='text-black font-[Poppins-Bold]'>{cardName}</Text>
          <Text className='text-black font-[Poppins-Medium]'>{cardCode}</Text>
        </View>
      </View>
      {loading && openInvoices.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="text-gray-500 mt-2">Cargando facturas...</Text>
        </View>
      ) : (
        <FlashList
          data={openInvoices}
          renderItem={renderItem}
          estimatedItemSize={140}
          keyExtractor={(item, index) => item.numAtCard + index}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className='flex-1 bg-white items-center justify-center'>
              <Text className="text-center text-gray-500 mt-10">
                No hay facturas pendientes.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40 px-6">
          <View className="bg-white rounded-2xl w-full p-6">
            <Text className="text-lg font-[Poppins-Bold] mb-4">Indica el monto a pagar</Text>
            {selectedInvoice && (
              <>
                <Text className="text-sm text-gray-600">Total: L. {selectedInvoice.docTotal.toLocaleString()}</Text>
                <Text className="text-sm text-gray-600">Pendiente: L. {selectedInvoice.balanceDue.toLocaleString()}</Text>
                <Text className="text-sm text-gray-600 mb-2">Fecha: {formatDate(selectedInvoice.docDate)}</Text>
                <Text className="text-sm text-gray-600 mb-2">Serie OP - Folio: {selectedInvoice.numAtCard}</Text>
                <TextInput
                  placeholder="Monto a pagar"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(val) => {
                    setAmount(val);
                    setError('');
                  }}
                  className="border border-gray-300 rounded-xl p-3"
                />
                {error ? <Text className="text-red-500 text-sm mt-1">{error}</Text> : null}
                <View className="flex-row justify-end mt-4 gap-10">
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text className="text-gray-500">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAccept}>
                    <Text className="text-blue-600 font-semibold">Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default IndexScreen;