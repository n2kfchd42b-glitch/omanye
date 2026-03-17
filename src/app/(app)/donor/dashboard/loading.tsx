export default function DonorDashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Greeting */}
      <div className="h-8 w-56 bg-gray-200 rounded" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-8 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Program list */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-52 bg-gray-200 rounded" />
              <div className="h-2.5 w-full bg-gray-100 rounded-full" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
