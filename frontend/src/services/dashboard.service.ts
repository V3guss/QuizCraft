import api from "./api";
import type { DashboardStats, HistoryItem } from "@/lib/types";

const dashboardService = {
  getStats: () => api.get<{ data: DashboardStats }>("/dashboard/stats").then((r) => r.data.data),
  getActivity: () => api.get<{ data: HistoryItem[] }>("/dashboard/recent-activity").then((r) => r.data.data),
};

export default dashboardService;
