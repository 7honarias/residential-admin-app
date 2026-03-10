"use client";

import { IPqrsTicket } from "@/app/dashboard/pqrs/pqrs.types";
import { formatDate } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface Props {
  ticket: IPqrsTicket;
  onClick: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  PETICION: "Petición",
  QUEJA: "Queja",
  RECLAMO: "Reclamo",
  SUGERENCIA: "Sugerencia",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  RESOLVED: "Resuelto",
  REJECTED: "Rechazado",
};

const TYPE_COLORS: Record<string, { bg: string; text: string; ring: string }> =
  {
    RECLAMO: {
      bg: "bg-red-50",
      text: "text-red-700",
      ring: "ring-red-200",
    },
    QUEJA: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-200",
    },
    PETICION: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      ring: "ring-blue-200",
    },
    SUGERENCIA: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      ring: "ring-teal-200",
    },
  };

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> =
  {
    PENDING: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      dot: "bg-yellow-400",
    },
    IN_PROGRESS: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-400",
    },
    RESOLVED: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-400",
    },
    REJECTED: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      dot: "bg-gray-400",
    },
  };

// Truncate description to 2 lines
const truncateDescription = (text: string, lines: number = 2): string => {
  const lineArray = text.split("\n");
  return lineArray
    .slice(0, lines)
    .join("\n")
    .substring(0, 150);
};

export default function PqrsCard({ ticket, onClick }: Props) {
  const typeColor = TYPE_COLORS[ticket.type] || TYPE_COLORS.PETICION;
  const statusColor = STATUS_COLORS[ticket.status];
  const description = truncateDescription(ticket.description);
  const isDescriptionTruncated =
    ticket.description.length > 150 ||
    ticket.description.split("\n").length > 2;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-200 hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Type & Status Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded text-xs font-semibold ring-1 ring-inset ${typeColor.bg} ${typeColor.text} ${typeColor.ring}`}
            >
              {TYPE_LABELS[ticket.type]}
            </span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
              {STATUS_LABELS[ticket.status]}
            </div>
          </div>

          {/* Subject */}
          <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-1">
            {ticket.subject}
          </h3>

          {/* Description Preview */}
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {description}
            {isDescriptionTruncated && "..."}
          </p>

          {/* Apartment & Date */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{ticket.apartment_info}</span>
            <span>{formatDate(ticket.created_at)}</span>
          </div>
        </div>

        {/* Chevron Icon */}
        <div className="flex-shrink-0 mt-1">
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
        </div>
      </div>
    </button>
  );
}
