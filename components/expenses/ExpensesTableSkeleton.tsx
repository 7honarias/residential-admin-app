'use client';

export default function ExpensesTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-100 h-12">
            <tr>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <th key={i} className="px-6 py-3"><div className="h-4 bg-slate-200 rounded w-20"></div></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, idx) => (
              <tr key={idx} className="border-b border-slate-50 h-16">
                <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24 mb-2"></div><div className="h-3 bg-slate-100 rounded w-16"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded-full w-20"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded-lg w-24"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
