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
  };
  lastUpdate: string;
}

export const getDashboardData = async (
  complexId: string,
  token: string
): Promise<DashboardData> => {
  try {
    const url = `${API_URL}/getDashboardData?complexId=${complexId}`;
    console.log("Fetching dashboard data from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", {
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
    });

    // Obtener el texto primero para debugging
    const text = await response.text();
    console.log("Response text:", text.substring(0, 500)); // Primeros 500 chars

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
    console.log("Dashboard data parsed successfully:", data);
    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("Error fetching dashboard data:", errorMessage);
    console.error("Full error:", error);
    throw new Error(`Failed to load dashboard: ${errorMessage}`);
  }
};
