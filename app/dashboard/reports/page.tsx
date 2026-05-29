"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "@/store/hooks";
import {
  fetchReports,
  IAiReport,
  ReportType,
} from "@/services/reports.service";
import { formatDate } from "@/lib/utils";
import {
  Search,
  DollarSign,
  Users,
  BarChart3,
  Building2,
  FileText,
  X,
  Loader2,
  AlertCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Bot,
} from "lucide-react";

// ==========================================
// CONFIGURACIÓN DE TIPOS
// ==========================================

const TYPE_CONFIG: Record<
  ReportType,
  { label: string; icon: React.ElementType; bg: string; text: string; border: string }
> = {
  FINANCIAL: {
    label: "Financiero",
    icon: DollarSign,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  ASSEMBLY: {
    label: "Asamblea",
    icon: Users,
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  GENERAL: {
    label: "General",
    icon: BarChart3,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  MANAGEMENT: {
    label: "Gestión",
    icon: Building2,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

const FILTER_OPTIONS: { label: string; value: ReportType | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Financieros", value: "FINANCIAL" },
  { label: "Asambleas", value: "ASSEMBLY" },
  { label: "Generales", value: "GENERAL" },
  { label: "Gestión", value: "MANAGEMENT" },
];

const PAGE_SIZE = 12;

// ==========================================
// COMPONENTE: Render de Markdown simple
// ==========================================

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");

  const renderLine = (line: string, idx: number) => {
    if (/^### (.+)/.test(line)) {
      return (
        <h3 key={idx} className="text-base font-semibold text-slate-800 mt-5 mb-1">
          {line.replace(/^### /, "")}
        </h3>
      );
    }
    if (/^## (.+)/.test(line)) {
      return (
        <h2 key={idx} className="text-lg font-bold text-slate-900 mt-6 mb-2 border-b border-slate-200 pb-1">
          {line.replace(/^## /, "")}
        </h2>
      );
    }
    if (/^# (.+)/.test(line)) {
      return (
        <h1 key={idx} className="text-xl font-bold text-slate-900 mt-4 mb-3">
          {line.replace(/^# /, "")}
        </h1>
      );
    }
    if (/^- (.+)/.test(line)) {
      const text = line.replace(/^- /, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return (
        <li
          key={idx}
          className="ml-4 text-slate-600 text-sm list-disc"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }
    if (/^\*\*(.+?)\*\*/.test(line)) {
      const text = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return (
        <p
          key={idx}
          className="text-sm text-slate-700 my-1"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }
    if (line.trim() === "") {
      return <div key={idx} className="h-2" />;
    }
    const text = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return (
      <p
        key={idx}
        className="text-sm text-slate-600 my-0.5 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  };

  return <div className="space-y-0.5">{lines.map((line, idx) => renderLine(line, idx))}</div>;
}

// ==========================================
// COMPONENTE: ReportCard
// ==========================================

interface ReportCardProps {
  report: IAiReport;
  onClick: () => void;
}

function ReportCard({ report, onClick }: ReportCardProps) {
  const config = TYPE_CONFIG[report.type] ?? TYPE_CONFIG.GENERAL;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
          <Icon size={20} className={config.text} />
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
        >
          {config.label}
        </span>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
          {report.title}
        </h3>
        {report.period_label && (
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <Calendar size={11} />
            {report.period_label}
          </div>
        )}
      </div>

      {/* Summary */}
      {report.summary && (
        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
          {report.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Bot size={11} />
          <span>{report.created_by}</span>
        </div>
        <span className="text-xs text-slate-400">{formatDate(report.created_at)}</span>
      </div>
    </button>
  );
}

// ==========================================
// COMPONENTE: ReportDetailPanel
// ==========================================

interface ReportDetailPanelProps {
  report: IAiReport | null;
  onClose: () => void;
}

function ReportDetailPanel({ report, onClose }: ReportDetailPanelProps) {
  useEffect(() => {
    if (report) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [report]);

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!report) return null;

  const config = TYPE_CONFIG[report.type] ?? TYPE_CONFIG.GENERAL;
  const Icon = config.icon;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
        {/* Panel Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
              <Icon size={20} className={config.text} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 leading-snug">
                {report.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
                >
                  {config.label}
                </span>
                {report.period_label && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar size={11} />
                    {report.period_label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              title="Descargar como .md"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Bot size={12} />
            Generado por: <strong className="ml-0.5 text-slate-700">{report.created_by}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(report.created_at)}
          </span>
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-800 leading-relaxed">{report.summary}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <MarkdownContent content={report.content} />
        </div>
      </div>
    </div>,
    document.body
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function ReportsPage() {
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const complexId = activeComplex?.id;

  const [reports, setReports] = useState<IAiReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<IAiReport | null>(null);
  const [filterType, setFilterType] = useState<ReportType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [filterType]);

  const loadReports = useCallback(async () => {
    if (!complexId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReports({
        complexId,
        type: filterType === "ALL" ? undefined : filterType,
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setReports(res.reports);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando informes");
    } finally {
      setLoading(false);
    }
  }, [complexId, filterType, debouncedSearch, page]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={22} className="text-slate-600" />
            Informes IA
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reportes generados automáticamente por el agente inteligente
          </p>
        </div>
        {total > 0 && (
          <span className="text-sm text-slate-500">
            {total} informe{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value as ReportType | "ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filterType === opt.value
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Inbox size={48} className="mb-3 opacity-40" />
          <p className="text-sm font-medium">No hay informes disponibles</p>
          <p className="text-xs mt-1">
            Los informes generados por el agente IA aparecerán aquí
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && reports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => setSelectedReport(report)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-600 px-2">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Detail Panel */}
      <ReportDetailPanel
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}
