import ReceiptIcon from '@/assets/icons/InvoicesIcon';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { PaymentData } from '@/types/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const InvoicesDetails = () => {
  const { docEntry } = useLocalSearchParams();
  const [invoiceDetails, setInvoiceDetails] = useState<PaymentData | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();

  // Helper: Formatear dinero siempre con 2 decimales
  const formatMoney = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? Number(value) : value ?? 0;
    const safe = isNaN(Number(num)) ? 0 : Number(num);
    return safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ✅ Cargar logo como base64
  useEffect(() => {
    const loadLogo = async () => {
      const asset = Asset.fromModule(require('@/assets/images/LogoAlfayOmega.png'));
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setLogoBase64(`data:image/png;base64,${base64}`);
    };

    loadLogo();
  }, []);

  // ✅ Obtener detalles del pago
  useEffect(() => {
    const fetchDetails = async () => {
      if (!docEntry) return;

      try {
        const response = await axios.get<PaymentData>(`${fetchUrl}/api/Payments/${docEntry}`);
        setInvoiceDetails(response.data);
      } catch (error) {
        console.error('Error al obtener el recibo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [docEntry]);

  const buildTicketHTML = (invoice: PaymentData, logo: string) => {
    const facturasHTML = invoice.invoices
      .map((inv, i) => {
        const total = formatMoney(inv.docTotal);
        const abono = formatMoney(inv.appliedAmount);
        const saldoAnt = formatMoney(inv.saldoAnterior);
        const saldoPend = formatMoney(inv.pendiente);

        return `
        <div>${i + 1} - ${inv.invoiceDocNum}</div>
        <div>Total: L. ${total}</div>
        <div>Abono: L. ${abono}</div>
        <div>Saldo Ant.: L. ${saldoAnt}</div>
        <div>Saldo Pend.: L. ${saldoPend}</div>
        <hr />
      `;
      })
      .join('');

    return `
      <html>
        <head>
          <style>
            body {
              font-family: monospace;
              width: 80mm;
              font-size: 12px;
              background-color: white;
            }
            img {
              max-width: 60%;
              margin: 16px auto 20px auto;
              display: block;
            }
            .center { text-align: center; }
            .start {
              text-align: start;
              width: 100%;
              justify-content: start;
              margin-top: 20px;
            }
            .bold { font-weight: bold; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <img src="${logo}" />
            <div class="bold">Grupo Alfa & Omega</div>
          </div>
          <div class="start">
            <div class="bold">Folio: </div>
            <div class="bold">Cliente: ${invoice.cardCode} - ${invoice.cardName}</div>
            <div class="bold">Vendedor: ${user?.fullName}</div>
            <div class="bold">Fecha: ${invoice.docDate}</div>
          </div>
          <hr />
          <div><div class="center">RECIBO DE COBROS</div>
          <hr />
          <div><div class="bold">Facturas:</div>${facturasHTML}</div>
          <div>Método: ${invoice.paymentMeans}</div>
          <div>Total pagado: L. ${formatMoney(invoice.total)}</div>
          <hr />
          <div class="center">¡Gracias por su pago!<br/>
            Dudas o reclamo por inconsistencias con su saldo, llamar al 9458-7168
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (!invoiceDetails || !logoBase64) return;
    const html = buildTicketHTML(invoiceDetails, logoBase64);
    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error al imprimir:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (!invoiceDetails) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>No se encontró el recibo.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-white flex-1 relative" style={{ paddingTop: -Constants.statusBarHeight }}>
      <TouchableOpacity onPress={handlePrint} className="absolute top-0 right-4 z-50">
        <Feather name="printer" size={28} color="black" />
      </TouchableOpacity>

      <ScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {/* Cliente */}
        <Text className="text-xl font-[Poppins-SemiBold] mt-4 mb-2">Cliente</Text>
        <View className="flex-row gap-4 mb-4 items-center">
          <View className="bg-yellow-300 rounded-full items-center justify-center h-[50px] w-[50px]">
            <MaterialCommunityIcons name="account-circle" size={30} color="#000" />
          </View>
          <View>
            <Text className="font-[Poppins-SemiBold] tracking-[-0.3px] leading-5">{invoiceDetails.cardName}</Text>
            <Text className="font-[Poppins-Medium] tracking-[-0.3px] leading-5">{invoiceDetails.cardCode}</Text>
          </View>
        </View>

        {/* Facturas Abonadas */}
        <Text className="text-xl font-[Poppins-SemiBold] mb-2">Facturas Abonadas</Text>
        {invoiceDetails.invoices.map((inv) => (
          <View
            key={inv.numAtCard ?? inv.invoiceDocNum}
            className="flex-row items-start gap-4 bg-gray-100 p-4 rounded-xl mb-3"
          >
            <View className="bg-yellow-300 p-2 rounded-xl">
              <ReceiptIcon />
            </View>

            <View className="flex-1">
              <View className="flex-row justify-between items-center mb-1">
                <View>
                  <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px]">
                    Factura Nº: {inv.numAtCard ?? inv.invoiceDocNum}
                  </Text>
                  <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">
                    Total: L. {formatMoney(inv.docTotal)}
                  </Text>
                  <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">
                    Saldo Anterior: L. {formatMoney(inv.saldoAnterior)}
                  </Text>
                  <Text className="font-[Poppins-Regular] text-red-500 text-xs tracking-[-0.3px]">
                    Abono: L. {formatMoney(inv.appliedAmount ?? 0)}
                  </Text>
                  <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">
                    Saldo Pendiente: L. {formatMoney(inv.pendiente)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Información de Pago */}
        <Text className="text-xl font-[Poppins-SemiBold] mt-4 mb-2">Información de Pago</Text>
        <View className="bg-white rounded-2xl h-fit overflow-hidden border border-gray-200 shadow-sm">
          <View className="bg-yellow-300 p-2">
            <Text className="text-xl font-[Poppins-Bold] text-gray-800 text-center">Detalles del Pago</Text>
          </View>

          <View className="p-4">
            <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
              <Text className="text-base font-[Poppins-Regular] text-gray-700">Medio de Pago</Text>
              <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.paymentMeans}</Text>
            </View>

            {invoiceDetails.paymentMeans === "Tarjeta" && (
              <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-[Poppins-Regular] text-gray-700">Referencia</Text>
                </View>
                <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.payment[0].cardVoucherNum}</Text>
              </View>
            )}

            {invoiceDetails.paymentMeans === "Cheque" && (
              <View className="items-center gap-2 mb-2">
                <View className='w-full gap-2 h-fit flex-row'>
                  <View className="flex-1 items-start gap-2 p-3 rounded-lg bg-gray-100">
                    <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Banco</Text>
                    <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].bankCode}</Text>
                  </View>

                  <View className="flex-1 items-start gap-2 p-3 rounded-lg bg-gray-100">
                    <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Numero de Cheque</Text>
                    <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].checkNumber}</Text>
                  </View>
                </View>

                <View className="flex-1 w-full items-start gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Fecha del Cheque</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].dueDate}</Text>
                </View>
              </View>
            )}

            {invoiceDetails.paymentMeans === "Transferencia" && (
              <View className="items-center gap-2 mb-2">
                <View className="flex-1 w-full items-start justify-center gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Fecha de la Transferencia</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].transferDate}</Text>
                </View>

                <View className="flex-1 w-full items-start justify-center gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Referencia</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].transferReference}</Text>
                </View>

                <View className="flex-1 w-full items-start justify-center p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] text-gray-700">Cuenta</Text>
                  <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.payment[0].transferAccountName || "No disponible"}</Text>
                </View>
              </View>
            )}

            <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
              <Text className="text-base font-[Poppins-Regular] text-gray-700">Total</Text>
              <Text className="text-base font-[Poppins-SemiBold] text-gray-800">L. {formatMoney(invoiceDetails.total)}</Text>
            </View>

            <View className="flex-row justify-between items-center p-3 bg-gray-100 rounded-lg">
              <Text className="text-base font-[Poppins-Regular] text-gray-700">Fecha</Text>
              <Text className="text-base font-[Poppins-SemiBold] text-gray-800">
                {new Date(invoiceDetails.docDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between border-b border-b-gray-300 border-dashed mt-10">
          <Text className="font-[Poppins-SemiBold] text-xl tracking-[-0.4px]">Total</Text>
          <Text className="font-[Poppins-SemiBold] text-xl tracking-[-0.4px]">L. {formatMoney(invoiceDetails.total)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InvoicesDetails;