import BottomSheetCart from '@/components/BottomSheetCart/page';
import BottomSheetWelcome from '@/components/BottomSheetWelcome/page';
import GoalDonut from '@/components/Dashboard/GoalDonut';
import KPICard from '@/components/Dashboard/KPICard';
import UpdateBanner from '@/components/UpdateBanner';
import { useAuth } from '@/context/auth';
import { useOtaUpdates } from "@/hooks/useOtaUpdates";
import { useAppStore } from '@/state';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View, FlatList, Pressable } from 'react-native';
import "../../global.css";

export default function App() {
  const kpis = {
    totalVentas: 52340,
    tickets: 312,
    promedioTicket: 168,
    margen: 34.5,
    deltaVentas: 8.3,
    deltaTickets: -2.1,
  };

  // Estado de métricas (donut)
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();
  const [goalData, setGoalData] = useState<{
    current: number;
    target: number;
    progressPct?: number;
    currency?: string;
    centerLabelPrimary?: string;
    centerLabelSecondary?: string;
    lastUpdated?: string;
  } | null>(null);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  async function fetchGoal() {
    if (!user?.token) return;
    const slpCode = user.salesPersonCode;
    setLoadingGoal(true);
    setGoalError(null);
    try {
      const url = `${fetchUrl}/api/Metrics/sales-progress/${slpCode}?mode=net`;
      const res = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
          'Content-Encoding': 'gzip'
        }
      });
      const d = res.data;
      setGoalData({
        current: d.actual ?? 0,
        target: d.target ?? 0,
        progressPct: d.progressPct,
        currency: d.currency,
        centerLabelPrimary: d.centerLabel?.primary,
        centerLabelSecondary: d.centerLabel?.secondary,
        lastUpdated: d.lastUpdated
      });
    } catch (e) {
      console.error('Error fetch goal', e);
      setGoalError('No se pudieron cargar los datos');
    } finally {
      setLoadingGoal(false);
    }
  }

  useEffect(() => {
    fetchGoal();
  }, [user?.token]);

  const goal = { current: goalData?.current || 0, target: goalData?.target || 0 };
  const products = useAppStore((s) => s.products);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGoal().finally(() => {
      setRefreshKey((k) => k + 1);
      setRefreshing(false);
    });
  }, []);

  const { isUpdating, error, isUpdateAvailable, checkAndUpdate } = useOtaUpdates();


  if (isUpdating) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", gap: 10 }}>
        <ActivityIndicator size="large" color="#000" />
        <Text className='font-[Poppins-SemiBold] tracking-[-0.3px]'>Actualizando...</Text>
      </View>
    );
  }

  if (error) {
    console.warn("Error al buscar OTA:", error);
  }

  const ventas = [
    { fecha: "2024-06-01", cliente: "Cliente A", monto: 12000 },
    { fecha: "2024-06-02", cliente: "Cliente B", monto: 8500 },
    { fecha: "2024-06-03", cliente: "Cliente C", monto: 15700 },
    { fecha: "2024-06-04", cliente: "Cliente D", monto: 9400 },
    { fecha: "2024-06-04", cliente: "Cliente E", monto: 9600 },
    { fecha: "2024-06-04", cliente: "Cliente F", monto: 6800 },
    { fecha: "2024-06-04", cliente: "Cliente G", monto: 9000 },
    { fecha: "2024-06-04", cliente: "Cliente H", monto: 3400 },
    { fecha: "2024-06-04", cliente: "Cliente I", monto: 5600 },
    { fecha: "2024-06-04", cliente: "Cliente J", monto: 1285 },
    { fecha: "2024-06-04", cliente: "Cliente K", monto: 2068 },
  ];

  return (
    <View className='flex-1 bg-white relative'>
      <View className="absolute bottom-4 right-8 gap-3 items-end">
        {products.length > 0 && (<BottomSheetCart />)}
      </View>

      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="gap-4 pb-24"
        scrollEnabled
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <UpdateBanner
          visible={isUpdateAvailable}
          onReload={checkAndUpdate}
          message="Actualización disponible"
        />

        <View className='px-4 gap-4'>
          <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-900">Dashboard</Text>

          <View className="flex-row flex-wrap justify-between gap-4">
            <View className='flex-row gap-4 w-full'>
              <KPICard title="Ventas" value={`$${kpis.totalVentas.toLocaleString()}`} delta={kpis.deltaVentas} subtitle="vs. semana ant." />
              <KPICard title="Tickets" value={kpis.tickets} delta={kpis.deltaTickets} subtitle="vs. semana ant." />
            </View>
            <View className='flex-row gap-4 w-full'>
              <KPICard title="Promedio ticket" value={`$${kpis.promedioTicket.toLocaleString()}`} />
              <KPICard title="Margen" value={`${kpis.margen}%`} />
            </View>
          </View>

          <GoalDonut
            current={goal.current}
            target={goal.target}
            progressPct={goalData?.progressPct}
            currency={goalData?.currency}
            centerLabelPrimary={goalData?.centerLabelPrimary}
            centerLabelSecondary={goalData?.centerLabelSecondary}
            lastUpdated={goalData?.lastUpdated}
          />

          <BottomSheetWelcome />
        </View>

        <View className="px-4 mt-4">
          <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-900 mb-3">
            Ventas recientes
          </Text>

          <View className="overflow-hidden">
            {/* Header */}
            <View className="flex-row bg-black py-3 px-5 w-full justify-between flex-1 rounded-full">
              <Text className="text-white font-[Poppins-SemiBold] text-sm">
                Fecha
              </Text>
              <Text className="text-white font-[Poppins-SemiBold] text-sm">
                Cliente
              </Text>
              <Text className="text-white font-[Poppins-SemiBold] text-sm">
                Monto
              </Text>
            </View>

            {/* Rows */}
            <FlatList
              data={ventas}
              keyExtractor={(item, idx) => item.fecha + item.cliente + idx}
              renderItem={({ item, index }) => (
                <Pressable
                  className="flex-row justify-between items-center bg-white px-5 py-3"
                  style={{
                    borderBottomWidth: index === ventas.length - 1 ? 0 : 1,
                    borderBottomColor: "#f0f0f0",
                  }}
                >
                  <Text className="text-start text-gray-500 text-xs tracking-[-0.3px] font-[Poppins-Regular]">
                    {item.fecha}
                  </Text>
                  <Text className="text-start text-gray-800 text-sm tracking-[-0.3px] font-[Poppins-Medium]">
                    {item.cliente}
                  </Text>
                  <Text className="text-right text-gray-900 text-sm tracking-[-0.3px] font-[Poppins-SemiBold]">
                    L. {item.monto.toLocaleString()}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}