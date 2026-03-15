export default function PaymentsTableSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="h-5 bg-slate-200 rounded animate-pulse flex-1"
           />
        ))}
      </div>

      {/* Rows */}
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="border-b border-slate-100 px-6 py-4 flex gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((col) => (
            <div
              key={col}
              className="h-4 bg-slate-200 rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
