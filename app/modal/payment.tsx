import { useAuth } from '@/context/auth';
import api from '@/lib/api';
import { useAppStore } from '@/state';
import { AccountPayCheque, AccountPayCreditCards, AccountPayEfectivo, AccountPayTransderencia } from '@/types/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreditCardIcon = ({ color }: { color: string }) => (
  <Ionicons name="card-outline" size={32} color={color} />
);
const MoneyIcon = ({ color }: { color: string }) => (
  <Ionicons name="cash-outline" size={32} color={color} />
);
const BankIcon = ({ color }: { color: string }) => (
  <Ionicons name="business-outline" size={32} color={color} />
);
const CheckIcon = ({ color }: { color: string }) => (
  <Ionicons name="document-text-outline" size={32} color={color} />
);

type PaymentMethod = 'Tarjeta' | 'Efectivo' | 'Transferencia' | 'Cheque';

const paymentOptions = [
  { name: 'Tarjeta', icon: CreditCardIcon },
  { name: 'Efectivo', icon: MoneyIcon },
  { name: 'Transferencia', icon: BankIcon },
  { name: 'Cheque', icon: CheckIcon },
];


const PaymentScreen = () => {
  const paymentForm = useAppStore(state => state.paymentForm);
  const totalAbonado = useAppStore(state => state.selectedInvoices.reduce((sum, item) => sum + item.paidAmount, 0));
  const setPaymentForm = useAppStore(state => state.setPaymentForm);
  const savePaymentForm = useAppStore(state => state.savePaymentForm);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(paymentForm.method as PaymentMethod || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>(paymentForm.amount || '');
  const [referenceNumber, setReferenceNumber] = useState<string>(paymentForm.reference || '');
  const [paymentDate, setPaymentDate] = useState<Date>(paymentForm.date ? new Date(paymentForm.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedBank, setSelectedBank] = useState<string>(paymentForm.bank || '');
  const [amountError, setAmountError] = useState<string>('');

  const [chequeAccounts, setChequeAccounts] = useState<AccountPayCheque[]>([]);
  const [efectivoAccounts, setEfectivoAccounts] = useState<AccountPayEfectivo[]>([]);
  const [transfAccounts, setTransfAccounts] = useState<AccountPayTransderencia[]>([]);
  const [creditCardAccounts, setCreditCardAccounts] = useState<AccountPayCreditCards[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const { fetchUrl } = useAppStore();
  const API_BASE_URL = `${fetchUrl}/api/BankAccounts`;
  const router = useRouter();

  const fetchPaymentAccounts = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setError(null);
    try {
      const urls = [
        `${API_BASE_URL}/PayCheque`,
        `${API_BASE_URL}/PayEfectivo`,
        `${API_BASE_URL}/PayTranferencia`,
        `${API_BASE_URL}/PayCreditCards`
      ];
      const results = await Promise.allSettled(urls.map(url => api.get(url, {
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        cache: {
          ttl: 1000 * 60 * 60 * 8, // 8 horas de cache
        },
      })));

      console.log(results[0].status === 'fulfilled' ? 'Respuesta desde CACHE' : 'Respuesta desde RED');

      const chequeRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const efectivoRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const transfRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const creditCardRes = results[3].status === 'fulfilled' ? results[3].value : null;

      if (!chequeRes || !efectivoRes || !transfRes || !creditCardRes) {
        throw new Error('No se pudieron obtener los datos de una o más cuentas.');
      }

      setChequeAccounts(chequeRes.data);
      setEfectivoAccounts(efectivoRes.data);
      setTransfAccounts(transfRes.data);
      setCreditCardAccounts(creditCardRes.data);
    } catch (err) {
      console.error('Error al cargar datos de cuentas:', err);
      setError('No se pudieron cargar las opciones de pago. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentAccounts();
  }, [fetchPaymentAccounts]);

  const handleSelectMethod = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentAmount(paymentForm.amount || '');
    setReferenceNumber(paymentForm.reference || '');
    setSelectedBank(paymentForm.bank || '');
  }, [paymentForm]);

  const getBankOptions = () => {
    switch (selectedMethod) {
      case 'Efectivo': {
        // Filtrar por slpCode del usuario
        const slpCode = Number(user?.salesPersonCode);
        const filtered = efectivoAccounts.filter(account => account.slpCode === slpCode);
        return filtered.map(account => ({
          label: account.CashAccount,
          value: account.CashAccount,
        }));
      }
      case 'Transferencia':
        return transfAccounts.map(account => ({
          label: account.name,
          value: account.code,
        }));
      case 'Cheque':
        return chequeAccounts.map(account => ({
          label: account.bankName,
          value: account.bankCode,
        }));
      case 'Tarjeta':
        return creditCardAccounts.map(account => ({
          label: account.creditCardName,
          value: account.creditCardCode,
        }));
      default:
        return [];
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || paymentDate;
    setShowDatePicker(Platform.OS === 'ios');
    setPaymentDate(currentDate);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-4 text-gray-500 tracking-[-0.3px]">
          Cargando opciones de pago...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-4">
        <Text className="text-red-500 font-[Poppins-Bold] text-center tracking-[-0.3px]">
          {error}
        </Text>
        <Text className="mt-2 text-gray-500 text-center tracking-[-0.3px]">
          Verifica tu conexión y el estado del servidor.
        </Text>
      </View>
    );
  }

  const bankOptions = getBankOptions();

  // Validar que todos los campos estén completos y sin error
  const isFormComplete = selectedMethod && paymentAmount && referenceNumber && paymentDate && selectedBank && !amountError;

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchPaymentAccounts}
            colors={["#FFD600"]}
            tintColor="#FFD600"
          />
        }
      >
        {/* Opciones de pago */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="h-[120px] px-2"
          contentContainerStyle={{ alignItems: 'center', paddingRight: 16 }}
        >
          {paymentOptions.map(option => {
            const isSelected = selectedMethod === option.name;
            const Icon = option.icon;

            return (
              <TouchableOpacity
                key={option.name}
                className={`bg-white w-[180px] h-[100px] rounded-xl p-6 items-center justify-center m-2 shadow-sm border-2 ${isSelected
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-100'
                  }`}
                onPress={() => {
                  handleSelectMethod(option.name as PaymentMethod);
                  setPaymentForm({ method: option.name });
                }}
              >
                <View className="mb-3">
                  <Icon color={isSelected ? '#facc15' : '#888'} />
                </View>
                <Text
                  className={`font-[Poppins-SemiBold] text-base tracking-[-0.3px] ${isSelected ? 'text-yellow-400' : 'text-gray-500'
                    }`}
                >
                  {option.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Formulario */}
        {selectedMethod && (
          <View className="p-4 mt-4">
            <Text className="text-lg font-[Poppins-Bold] mb-4 tracking-[-0.3px]">
              Detalles de {selectedMethod}
            </Text>

            {/* Monto */}
            <View className="mb-4 bg-white rounded-xl shadow-sm p-2 border border-gray-200">
              <Text className="text-sm font-[Poppins-Medium] mb-1 text-gray-600">
                Monto a pagar
              </Text>
              <TextInput
                className="text-base tracking-[-0.3px] text-gray-800 p-1"
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#A0AEC0"
                value={paymentAmount}
                onChangeText={value => {
                  setPaymentAmount(value);
                  setPaymentForm({ amount: value });
                  const numValue = Number(value);
                  if (numValue < totalAbonado) {
                    setAmountError(`El monto no puede ser menor al abono total: L. ${totalAbonado}`);
                  } else {
                    setAmountError('');
                  }
                }}
              />
              {amountError ? (
                <Text className="text-red-500 text-xs mt-1">{amountError}</Text>
              ) : null}
            </View>

            {/* Referencia */}
            <View className="mb-4 bg-white rounded-xl shadow-sm p-2 border border-gray-200">
              <Text className="text-sm font-[Poppins-Medium] mb-1 text-gray-600">
                Número de Referencia
              </Text>
              <TextInput
                className="text-base tracking-[-0.3px] text-gray-800 p-1"
                placeholder="Ej: 123456789"
                placeholderTextColor="#A0AEC0"
                value={referenceNumber}
                onChangeText={value => {
                  setReferenceNumber(value);
                  setPaymentForm({ reference: value });
                }}
              />
            </View>

            {/* Fecha */}
            <View className="mb-4 bg-white rounded-xl shadow-sm p-2 border border-gray-200">
              <Text className="text-sm font-[Poppins-Medium] mb-1 text-gray-600">
                Fecha de Pago
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row justify-between items-center p-1"
              >
                <Text className="text-base tracking-[-0.3px] text-gray-800">
                  {paymentDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={22} color="#A0AEC0" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={paymentDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    handleDateChange(event, selectedDate);
                    if (selectedDate) setPaymentForm({ date: selectedDate });
                  }}
                />
              )}
            </View>

            {/* Banco */}
            <View className="mb-4 bg-white rounded-xl shadow-sm p-3 border border-gray-100 w-full">
              <Text className="text-sm font-[Poppins-Medium] text-gray-600">
                Banco
              </Text>

              <Picker
                selectedValue={selectedBank}
                onValueChange={itemValue => {
                  setSelectedBank(itemValue);
                  setPaymentForm({ bank: itemValue });
                }}
              >
                <Picker.Item label="Selecciona un banco..." value="" />
                {bankOptions.map(option => (
                  <Picker.Item
                    fontFamily='Poppins-SemiBold'
                    style={{
                      letterSpacing: -0.3
                    }}
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botón continuar */}
      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          className={`py-4 rounded-full items-center ${isFormComplete ? 'bg-yellow-300' : 'bg-gray-300'}`}
          disabled={!isFormComplete}
          onPress={() => {
            setPaymentForm({
              method: selectedMethod,
              amount: paymentAmount,
              reference: referenceNumber,
              date: paymentDate,
              bank: selectedBank,
            });
            savePaymentForm();
            router.back();
          }}
        >
          <Text
            className={`font-[Poppins-Bold] text-lg tracking-[-0.3px] ${isFormComplete ? 'text-black' : 'text-gray-500'}`}
          >
            Continuar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaymentScreen;