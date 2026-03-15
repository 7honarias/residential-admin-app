'use client';

interface Props {
  rows?: number;
}

export default function InvoicesTableSkeleton({ rows = 5 }: Props) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Apartamento
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Concepto
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Vencimiento
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                Monto Original
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                Saldo Pendiente
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Estado
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {/* Apartamento */}
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-200 rounded w-16" />
                </td>

                {/* Concepto */}
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-200 rounded w-32" />
                </td>

                {/* Vencimiento */}
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                </td>

                {/* Monto Original */}
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-200 rounded w-28 ml-auto" />
                </td>

                {/* Saldo Pendiente */}
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-200 rounded w-28 ml-auto" />
                </td>

                {/* Estado */}
                <td className="px-6 py-4">
                  <div className="h-6 bg-slate-200 rounded-full w-24" />
                </td>

                {/* Acciones */}
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-200 rounded w-20 mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
