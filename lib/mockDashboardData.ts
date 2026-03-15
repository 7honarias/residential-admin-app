import { DashboardData } from "@/services/dashboard.service";

export const mockDashboardData: DashboardData = {
  summary: {
    apartments: {
      value: 124,
      trend: 2,
      isPositive: true,
    },
    residents: {
      value: 312,
      trend: 5,
      isPositive: true,
    },
    monthlyRevenue: {
      value: 45200.5,
      trend: 12,
      isPositive: true,
    },
    pendingCases: {
      value: 8,
      trend: 3,
      isPositive: false,
    },
  },
  alerts: [
    {
      id: "1",
      type: "warning",
      title: "Pagos Pendientes",
      desc: "8 residentes tienen pagos pendientes por más de 30 días",
    },
    {
      id: "2",
      type: "critical",
      title: "Mantenimiento Urgente",
      desc: "Sistema de agua requiere revisión en bloque C",
    },
  ],
  charts: {
    financialBalance: [
      { mes: "Enero", ingresos: 42000, gastos: 15000 },
      { mes: "Febrero", ingresos: 45200.5, gastos: 18500 },
      { mes: "Marzo", ingresos: 48900, gastos: 17200 },
      { mes: "Abril", ingresos: 46500, gastos: 19800 },
      { mes: "Mayo", ingresos: 50200, gastos: 16400 },
      { mes: "Junio", ingresos: 52100, gastos: 20100 },
    ],
    paymentStatus: [
      { name: "Pagado", value: 284, fill: "#10b981" },
      { name: "Pendiente", value: 24, fill: "#f59e0b" },
      { name: "Vencido", value: 4, fill: "#ef4444" },
    ],
    blockOccupation: [
      { b: "Bloque A", o: 32, d: 3 },
      { b: "Bloque B", o: 30, d: 5 },
      { b: "Bloque C", o: 28, d: 2 },
      { b: "Bloque D", o: 34, d: 1 },
    ],
  },
  lastUpdate: new Date().toISOString(),
};
