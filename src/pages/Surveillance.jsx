import { diseaseData } from '../data/healthData';

const trendConfig = {
  rising: { label: 'Rising ↑', cls: 'bg-red-100 text-red-700' },
  stable: { label: 'Stable →', cls: 'bg-yellow-100 text-yellow-700' },
  declining: { label: 'Declining ↓', cls: 'bg-green-100 text-green-700' },
};

const alertLevels = [
  { level: 'High Alert', color: 'bg-red-500', regions: ['Sub-Saharan Africa', 'South Sudan', 'DRC'], description: 'Active outbreaks requiring immediate international support.' },
  { level: 'Elevated', color: 'bg-orange-400', regions: ['South Asia', 'Southeast Asia', 'Sahel'], description: 'Heightened disease transmission; enhanced surveillance in place.' },
  { level: 'Moderate', color: 'bg-yellow-400', regions: ['Latin America', 'Caribbean', 'Pacific Islands'], description: 'Ongoing transmission with containment measures active.' },
  { level: 'Low', color: 'bg-green-400', regions: ['Europe', 'North America', 'East Asia'], description: 'Sporadic cases; standard prevention protocols in effect.' },
];

export default function Surveillance() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Disease Surveillance</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Real-time monitoring of infectious disease trends across the globe. Data empowers faster response and saves lives.
          </p>
          <p className="mt-4 text-xs text-blue-300">
            Data sourced from WHO, IHME, and partner surveillance networks. Updated periodically.
          </p>
        </div>
      </section>

      {/* Disease Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Key Infectious Diseases – Global Overview</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Disease', 'Annual Cases', 'Annual Deaths', 'Primary Region', 'Trend'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {diseaseData.map((disease) => {
                const trend = trendConfig[disease.trend];
                return (
                  <tr key={disease.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: disease.color }}
                        />
                        <span className="font-semibold text-gray-900">{disease.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{disease.cases}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{disease.deaths}</td>
                    <td className="px-6 py-4 text-gray-500">{disease.region}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trend.cls}`}>
                        {trend.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Alert Levels */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Current Global Alert Levels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {alertLevels.map((alert) => (
              <div key={alert.level} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-4 h-4 rounded-full ${alert.color}`} />
                  <span className="font-bold text-gray-900">{alert.level}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{alert.description}</p>
                <div className="flex flex-wrap gap-1">
                  {alert.regions.map((r) => (
                    <span key={r} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Surveillance Methodology</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-blue-900 leading-relaxed">
          <p className="mb-3">
            Our surveillance data aggregates reports from WHO regional offices, GOARN (Global Outbreak Alert and Response Network), national
            public health agencies, and partner research institutions. Alert levels are determined using a composite score of case growth
            rate, healthcare system capacity, and international spread potential.
          </p>
          <p>
            All figures represent the best available estimates based on reported data. Actual numbers may differ due to underreporting,
            limited laboratory capacity, or data lag in certain regions.
          </p>
        </div>
      </section>
    </div>
  );
}
