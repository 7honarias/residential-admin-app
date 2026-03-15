"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import {
  Users,
  Home,
  DollarSign,
  AlertCircle,
  Calendar,
  Package,
  Droplets,
  ParkingCircle,
  MessageSquare,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Activity,
  Download,
  Plus,
  MapPin,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getDashboardData, DashboardData } from "@/services/dashboard.service";

// --- Interfaces para Tipado Estricto ---
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean } | null;
  color: string;
  loading?: boolean;
}

interface ChartContainerProps {
  title: string;
  icon: React.ReactNode;
  children: (width: number) => React.ReactNode;
  loading?: boolean;
}

// --- Formateadores ---
const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// --- Sub-componentes ---

const StatCard = ({
  label,
  value,
  icon,
  trend,
  color,
  loading,
}: StatCardProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
        <div className="flex justify-between mb-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl" />
          <div className="w-10 h-5 bg-slate-100 rounded-full" />
        </div>
        <div className="w-24 h-4 bg-slate-100 rounded mb-2" />
        <div className="w-16 h-8 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`bg-gradient-to-br ${color} p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
              trend.isPositive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  );
};

const ChartContainer = ({
  title,
  icon,
  children,
  loading,
}: ChartContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col min-w-0 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          {icon} {title}
        </h3>
        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
          <Filter size={18} />
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[320px] relative">
        {loading ? (
          <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl border border-slate-100 flex flex-col p-4 space-y-4 text-center justify-center text-slate-400 text-sm italic">
            Cargando métricas...
          </div>
        ) : (
          width > 0 && children(width)
        )}
      </div>
    </div>
  );
};

// --- Componente Principal ---

export default function Dashboard() {
  const router = useRouter();
  const { activeComplex } = useAppSelector((state) => state.complex);
  const { token } = useAppSelector((state) => state.auth);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchDashboardData = async () => {
      if (!activeComplex?.id || !token) {
        setLoading(false);
        return;
      }
      try {
        const data = await getDashboardData(activeComplex.id, token);
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [activeComplex?.id, token]);

  const chartData = useMemo(
    () => ({
      ingresos: dashboardData?.charts.financialBalance || [],
      estadoPagos: dashboardData?.charts.paymentStatus || [],
      ocupacionBloque: dashboardData?.charts.blockOccupation || [],
    }),
    [dashboardData],
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-red-50">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2 text-sans">
            Error Crítico
          </h2>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Reintentar sincronización
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className={loading ? "animate-pulse" : ""}>
            {loading ? (
              <div className="h-8 w-48 bg-slate-200 rounded mb-2" />
            ) : (
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeComplex?.name || "Dashboard"}
              </h1>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium leading-none">
              <MapPin size={14} className="text-blue-600" />{" "}
              {activeComplex?.address}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl font-bold text-sm">
              <Download size={18} /> Exportar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Apartamentos"
            loading={loading}
            value={dashboardData?.summary.apartments.value || 0}
            icon={<Home />}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            label="Residentes"
            loading={loading}
            value={dashboardData?.summary.residents.value || 0}
            icon={<Users />}
            color="from-indigo-500 to-indigo-600"
          />
          <StatCard
            label="Ingresos Mes"
            loading={loading}
            value={currencyFormatter.format(
              dashboardData?.summary.monthlyRevenue.value || 0,
            )}
            icon={<DollarSign />}
            color="from-emerald-500 to-emerald-600"
          />
          <StatCard
            label="Casos Pendientes"
            loading={loading}
            value={dashboardData?.summary.pendingCases.value || 0}
            icon={<AlertCircle />}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Balance Financiero */}
        <div className="grid grid-cols-1 gap-8">
          <ChartContainer
            title="Balance Financiero (Ingresos vs Gastos)"
            icon={<TrendingUp className="text-blue-600" />}
            loading={loading || !isClient}
          >
            {(width) => {
              const isMobile = width < 480;
              const chartHeight = isMobile ? 280 : 320;
              const leftMargin = isMobile ? -10 : -15;
              const yAxisFontSize = isMobile ? 10 : 11;
              const xAxisFontSize = isMobile ? 10 : 12;

              const formatYAxis = (value: number) => {
                if (value >= 1000000) {
                  const millions = (value / 1000000).toFixed(1);
                  return `$ ${millions}M`;
                }
                if (value >= 1000) {
                  const thousands = (value / 1000).toFixed(0);
                  return `$ ${thousands}K`;
                }
                return `$ ${value.toLocaleString('es-CO')}`;
              };

              return (
                <AreaChart
                  width={width}
                  height={chartHeight}
                  data={chartData.ingresos}
                  margin={{ left: leftMargin, right: 10, top: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorIngresos"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="mes"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: xAxisFontSize }}
                    height={isMobile ? 24 : 30}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: yAxisFontSize }}
                    tickFormatter={formatYAxis}
                    width={isMobile ? 40 : 50}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      fontSize: isMobile ? "11px" : "12px",
                    }}
                    formatter={(value: any) => [`${currencyFormatter.format(value)}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#3b82f6"
                    strokeWidth={isMobile ? 2 : 3}
                    fill="url(#colorIngresos)"
                    name="Ingresos"
                  />
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    stroke="#ef4444"
                    strokeWidth={isMobile ? 1.5 : 2}
                    fill="transparent"
                    strokeDasharray="5 5"
                    name="Gastos"
                  />
                </AreaChart>
              );
            }}
          </ChartContainer>
        </div>

        {/* Estado de Pagos y Ocupación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChartContainer
            title="Recaudo de Cartera"
            icon={<Activity className="text-emerald-500" />}
            loading={loading || !isClient}
          >
            {(width) => {
              const isMobile = width < 480;
              const isSmallMobile = width < 350;
              // En móvil: más pequeño, en tablet+: más grande
              const chartSize = isSmallMobile 
                ? Math.min(width - 40, 160) 
                : isMobile 
                  ? Math.min(width - 60, 180)
                  : Math.min(width / 2 - 40, 260);
              const innerRadius = isSmallMobile ? 40 : isMobile ? 50 : 65;
              const outerRadius = isSmallMobile ? 60 : isMobile ? 75 : 90;

              return (
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'gap-3' : 'gap-6'} h-full ${isMobile ? 'items-start' : 'items-center'} overflow-hidden`}>
                  {/* Gráfico Pie - Responsivo */}
                  <div className={`flex justify-center flex-shrink-0 ${isMobile ? 'w-full' : ''}`}>
                    <PieChart width={chartSize} height={chartSize}>
                      <Pie
                        data={chartData.estadoPagos}
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="white"
                        strokeWidth={2}
                      >
                        {chartData.estadoPagos.map(
                          (entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.fill ||
                                ["#10b981", "#f59e0b", "#ef4444"][index % 3]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          backgroundColor: "#ffffff",
                          fontSize: isSmallMobile ? "10px" : isMobile ? "11px" : "12px",
                          padding: "6px 8px",
                        }}
                        formatter={(value: any) => `${value}`}
                      />
                    </PieChart>
                  </div>

                  {/* Leyenda Vertical - Optimizada para móvil */}
                  <div className={`flex flex-col ${isMobile ? 'gap-1' : 'gap-2'} ${isMobile ? 'w-full' : 'flex-1'}`}>
                    {chartData.estadoPagos.map((item: any, i: number) => {
                      const total = chartData.estadoPagos.reduce(
                        (a: any, b: any) => a + b.value,
                        0,
                      );
                      const percentage = ((item.value / total) * 100).toFixed(0);
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 p-1 rounded transition-colors hover:bg-slate-50 ${isMobile ? 'text-[10px]' : 'text-xs'}`}
                        >
                          <div
                            className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full flex-shrink-0`}
                            style={{ backgroundColor: item.fill }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`${isMobile ? 'text-[9px]' : 'text-xs'} font-semibold text-slate-700 truncate leading-tight`}>
                              {item.name}
                            </p>
                            <p className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-slate-500 truncate leading-tight`}>
                              {item.value} ({percentage}%)
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          </ChartContainer>

          <ChartContainer
            title="Ocupación por Bloque"
            icon={<Home className="text-purple-600" />}
            loading={loading || !isClient}
          >
            {(width) => (
              <BarChart
                width={width}
                height={320}
                data={chartData.ocupacionBloque}
                margin={{ left: -15, right: 10, top: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="b"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "8px", border: "none" }}
                />
                <Bar
                  dataKey="o"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  barSize={Math.max(20, width / 20)}
                  name="Ocupados"
                />
                <Bar
                  dataKey="d"
                  fill="#e2e8f0"
                  radius={[4, 4, 0, 0]}
                  barSize={Math.max(20, width / 20)}
                  name="Disponibles"
                />
              </BarChart>
            )}
          </ChartContainer>
        </div>
      </main>
    </div>
  );
}
