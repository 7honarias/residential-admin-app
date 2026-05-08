const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface SummaryMetric {
  value: number;
  trend: number;
  isPositive: boolean;
}

export interface Alert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  desc: string;
}

export interface FinancialData {
  mes: string;
  ingresos: number;
  gastos: number;
}

export interface PaymentStatus {
  name: string;
  value: number;
  fill: string;
}

export interface BlockOccupation {
  b: string;
  o: number;
  d: number;
}

export interface DelinquencyAgingBucket {
  range: string;
  amount: number;
  apartments: number;
  fill: string;
}

export interface DashboardData {
  summary: {
    apartments: SummaryMetric;
    residents: SummaryMetric;
    monthlyRevenue: SummaryMetric;
    pendingCases: SummaryMetric;
  };
  alerts: Alert[];
  charts: {
    financialBalance: FinancialData[];
    paymentStatus: PaymentStatus[];
    blockOccupation: BlockOccupation[];
    delinquencyAging: DelinquencyAgingBucket[];
  };
  council?: {
    canView: boolean;
    summary: {
      membersCount: number;
      ownerCount: number;
      overdueOwners: number;
    };
  };
  lastUpdate: string;
}

export const getDashboardData = async (
  complexId: string,
  token: string
): Promise<DashboardData> => {
  try {
    const url = `${API_URL}/getDashboardData?complexId=${complexId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    

    // Obtener el texto primero para debugging
    const text = await response.text();

    if (!response.ok) {
      let errorMessage = "Error al cargar datos del dashboard";
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Intentar parsear JSON
    if (!text) {
      throw new Error("Response vacío del servidor");
    }

    const data: DashboardData = JSON.parse(text);
    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("Error fetching dashboard data:", errorMessage);
    console.error("Full error:", error);
    throw new Error(`Failed to load dashboard: ${errorMessage}`);
  }
};
