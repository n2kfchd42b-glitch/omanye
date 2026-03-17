export default function DonorReportsLoading() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      <div className="h-7 w-32 bg-gray-200 rounded" />

      {/* Report cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-60 bg-gray-200 rounded" />
                <div className="h-3 w-44 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <div className="h-8 w-20 bg-gray-100 rounded-lg" />
                <div className="h-8 w-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
