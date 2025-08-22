import { useLicense } from "@/auth/useLicense";
import BottomSheetCart from '@/components/BottomSheetCart/page';
import BottomSheetWelcome from '@/components/BottomSheetWelcome/page';
import GoalDonut from '@/components/Dashboard/GoalDonut';
import KPICard from '@/components/Dashboard/KPICard';
import SalesCard from "@/components/Dashboard/SalesCard";
import UpdateBanner from '@/components/UpdateBanner';
import { useAuth } from '@/context/auth';
import { useOtaUpdates } from "@/hooks/useOtaUpdates";
import { useAppStore } from '@/state';
import { GoalDonutType, SalesDataType } from "@/types/DasboardType";
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import "../../global.css";

export default function App() {
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();
  const [goalData, setGoalData] = useState<GoalDonutType | null>(null);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [sales, setSales] = useState<SalesDataType | null>(null);
  const { uuid, valid, loading } = useLicense();
  const { isUpdating, error, isUpdateAvailable, checkAndUpdate } = useOtaUpdates();
  const [kpiData, setKpiData] = useState(null);

  const fetchData = async () => {
    if (!user?.token) return;
    const slpCode = user.salesPersonCode;

    try {
      const [goalRes, kpiRes, salesRes] = await Promise.all([
        axios.get(`${fetchUrl}/api/Metrics/sales-progress/${slpCode}?mode=net`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
            'Content-Encoding': 'gzip'
          }
        }),
        fetch(`${fetchUrl}/api/Kpi/sales-vs-collections/${slpCode}`).then(res => res.json()),
        fetch(`${fetchUrl}/api/Kpi/monthly/${slpCode}`).then(res => res.json())
      ]);

      const goalData = goalRes.data;
      setGoalData({
        current: goalData.actual ?? 0,
        target: goalData.target ?? 0,
        progressPct: goalData.progressPct,
        currency: goalData.currency,
        centerLabelPrimary: goalData.centerLabel?.primary,
        centerLabelSecondary: goalData.centerLabel?.secondary,
        lastUpdated: goalData.lastUpdated
      });

      setKpiData(kpiRes);
      setSales(salesRes);
    } catch (e) {
      console.error('Error fetching data:', e);
      setGoalError('No se pudieron cargar los datos');
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.token]);

  const goal = { current: goalData?.current || 0, target: goalData?.target || 0 };
  const products = useAppStore((s) => s.products);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => {
      setRefreshKey((k) => k + 1);
      setRefreshing(false);
    });
  }, []);

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

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center gap-2">
        <ActivityIndicator size="large" color="#000" />
        <Text className='font-[Poppins-SemiBold] tracking-[-0.3px]'>Validando Licencia...</Text>
      </View>
    );
  }

  if (!valid) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-black text-xl mt-2 font-[Poppins-SemiBold] tracking-[-0.3px]">
          Licencia Expirada
        </Text>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-white relative'>
      <View className="absolute bottom-4 right-8 gap-3 items-end">
        {products.length > 0 && (<BottomSheetCart />)}
      </View>

      <FlatList
        data={ventas}
        keyExtractor={(item, idx) => item.fecha + item.cliente + idx}
        ListHeaderComponent={
          <>
            <UpdateBanner
              visible={isUpdateAvailable}
              onReload={checkAndUpdate}
              message="Actualización disponible"
            />

            <View className='px-4 gap-4'>
              <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-900">Dashboard</Text>

              <View className="flex-row flex-wrap justify-between gap-4">
                <View className='flex gap-4 w-full'>
                  <KPICard data={kpiData} userName={user?.fullName} />
                  <SalesCard data={sales} />
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
              </View>
            </View>
          </>
        }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: products.length > 0 ? 24 : 0 }}
      />
      <Text className="text-xs text-center font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-500">{uuid}</Text>
    </View>
  );
}