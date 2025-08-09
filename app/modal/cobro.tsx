import ClientIcon from '@/assets/icons/ClientIcon';
import ReceiptIcon from '@/assets/icons/InvoicesIcon';
import { useAuth } from '@/context/auth';
import { SelectedInvoice, useAppStore } from '@/state';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const InvoiceItem = memo(({ item, formatDate, formatCurrency }: { item: SelectedInvoice, formatDate: (date: string) => string, formatCurrency: (amount: number) => string }) => (
  <View key={item.numAtCard} className="flex-row items-start gap-4 bg-gray-100 p-4 rounded-xl mb-3">
    <View className="bg-yellow-300 p-2 rounded-xl">
      <ReceiptIcon />
    </View>
    <View className="flex-1">
      <View className='flex-row justify-between items-center mb-1'>
        <View>
          <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px]">Total: L.{formatCurrency(item.docTotal)}</Text>
          <Text className="font-[Poppins-Regular] text-red-600 tracking-[-0.3px]">Abono: L.{formatCurrency(item.paidAmount)}</Text>
          <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">Factura Nº: {item.numAtCard}</Text>
          <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">Fecha: {formatDate(item.docDate)}</Text>
        </View>
      </View>
    </View>
  </View>
));

const Cobro = () => {
  const [loading, setLoading] = useState(false);
  const { Name, Code } = useLocalSearchParams();
  const { selectedInvoices, paymentForm, fetchUrl } = useAppStore();
  const route = useRouter();
  const totalAbonado = selectedInvoices.reduce((sum, item) => sum + item.paidAmount, 0);
  const { user } = useAuth();

  const buildBody = (lat: string, long: string) => {
    const base = {
      CardCode: Code,
      U_SlpCode: user?.salesPersonCode?.toString() || '',
      u_Latitud: lat,
      u_Longitud: long,
      DocDate: new Date().toISOString(),
      CheckAccount: '',
      TransferAccount: '',
      TransferReference: '',
      PaymentChecks: [],
      PaymentInvoices: selectedInvoices.map(inv => ({
        DocEntry: inv.docEntry,
        SumApplied: inv.paidAmount,
        BalanceDue: inv.balanceDue
      })),
      paymentCreditCards: []
    };
    switch (paymentForm.method) {
      case 'Efectivo':
        return {
          ...base,
          CashAccount: paymentForm.bank,
          CashSum: Number(paymentForm.amount)
        };
      case 'Transferencia':
        return {
          ...base,
          TransferAccount: paymentForm.bank || '',
          TransferSum: Number(paymentForm.amount) || 0,
          TransferDate: paymentForm.date,
          TransferReference: paymentForm.reference || ''
        };
      case 'Cheque':
        return {
          ...base,
          PaymentChecks: [
            {
              dueDate: paymentForm.date,
              checkNumber: paymentForm.reference,
              CountryCode: "HN",
              bankCode: paymentForm.bank,
              checkSum: paymentForm.amount
            }
          ]
        };
      case 'Tarjeta':
        return {
          ...base,
          paymentCreditCards: [
            {
              creditCard: paymentForm.bank,
              voucherNum: paymentForm.reference,
              firstPaymentDue: new Date().toISOString(),
              creditSum: Number(paymentForm.amount) || 0
            }
          ]
        };
      default:
        return base;
    }
  };

  const handleCobro = async () => {
    setLoading(true);
    // Solicitar permisos y obtener ubicación
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Debes activar la ubicación para realizar el cobro.');
      setLoading(false);
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    if (!location || !location.coords) {
      alert('No se pudo obtener la ubicación.');
      setLoading(false);
      return;
    }
    const lat = location.coords.latitude.toString();
    const long = location.coords.longitude.toString();
    const body = buildBody(lat, long);
    try {
      const response = await axios.post(`${fetchUrl}/api/Payments/IncomingPayment`, body, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Respuesta del servidor:', response.data);
      route.push({
        pathname: '/modal/successCobro',
        params: {
          docEntry: response.data.docEntry
        }
      });
    } catch (error) {
      console.error('Error al realizar cobro:', error);
    }
    console.log('Cuerpo del Post', body);
    setLoading(false);
  };
  const formatDate = useCallback((isoDate: string): string => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const formatCurrency = useCallback((amount: number): string => {
    return amount.toLocaleString('es-HN', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: -Constants.statusBarHeight }}>
      <ScrollView className="flex-1 px-4">
        <View className="mb-6">
          <Text className="text-xl font-[Poppins-Bold] mb-4 tracking-[-0.3px]">Cliente</Text>
          <View className="flex-row items-center gap-4">
            <View className="bg-yellow-300 w-[50px] h-[50px] items-center justify-center rounded-full">
              <ClientIcon size={28} color="#000" />
            </View>
            <View>
              <Text className="font-[Poppins-Bold] text-lg tracking-[-0.3px]">{Name}</Text>
              <Text className="font-[Poppins-Regular] text-gray-500 tracking-[-0.3px]">Código: {Code}</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <View className='flex-row justify-between items-center'>
            <Text className="text-xl font-[Poppins-Bold] tracking-[-0.3px]">Información de pago</Text>
            <TouchableOpacity onPress={() => route.push({
              pathname: '/modal/payment',
              params: {
                totalAbonado: totalAbonado
              }
            })}
              className="p-2"
            >
              <Ionicons name="arrow-forward" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity onPress={() => { }} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <Text className="font-[Poppins-Regular] text-lg tracking-[-0.3px]">Efectivo:</Text>
              <Text className="font-[Poppins-SemiBold] text-lg text-gray-600 tracking-[-0.3px]">
                L. {formatCurrency(paymentForm.method === 'Efectivo' ? Number(paymentForm.amount) || 0 : 0)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { }} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <Text className="font-[Poppins-Regular] text-lg tracking-[-0.3px]">Transferencia:</Text>
              <Text className="font-[Poppins-SemiBold] text-lg text-gray-600 tracking-[-0.3px]">
                L. {formatCurrency(paymentForm.method === 'Transferencia' ? Number(paymentForm.amount) || 0 : 0)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { }} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <Text className="font-[Poppins-Regular] text-lg tracking-[-0.3px]">Cheque(s):</Text>
              <Text className="font-[Poppins-SemiBold] text-lg text-gray-600 tracking-[-0.3px]">
                L. {formatCurrency(paymentForm.method === 'Cheque' ? Number(paymentForm.amount) || 0 : 0)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { }} className="flex-row justify-between items-center py-3">
              <Text className="font-[Poppins-Regular] text-lg tracking-[-0.3px]">Tarjeta:</Text>
              <Text className="font-[Poppins-SemiBold] text-lg text-gray-600 tracking-[-0.3px]">
                L. {formatCurrency(paymentForm.method === 'Tarjeta' ? Number(paymentForm.amount) || 0 : 0)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-xl font-[Poppins-Bold] mb-4 tracking-[-0.3px]">Facturas abonadas</Text>
        {selectedInvoices.map((item: SelectedInvoice) => (
          <InvoiceItem
            key={item.numAtCard}
            item={item}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        ))}
      </ScrollView>

      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-[Poppins-Bold] tracking-[-0.3px]">Total</Text>
          <Text className="text-xl font-[Poppins-Bold] tracking-[-0.3px]">
            L.{
              formatCurrency(
                paymentForm.amount && paymentForm.amount !== '' && paymentForm.amount !== null
                  ? Number(paymentForm.amount)
                  : totalAbonado
              )
            }
          </Text>
        </View>
        <TouchableOpacity
          className={`bg-yellow-300 h-[50px] items-center justify-center rounded-full ${(!paymentForm.method || loading) ? 'opacity-50' : ''}`}
          onPress={handleCobro}
          disabled={!paymentForm.method || loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black font-[Poppins-SemiBold] text-lg tracking-[-0.3px]">Realizar cobro</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Cobro;