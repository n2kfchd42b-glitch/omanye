import { healthInitiatives } from '../data/healthData';

const colorSchemes = [
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
];

const detailedContent = [
  {
    id: 1,
    goals: ['Expand primary healthcare access', 'Reduce catastrophic health expenditure', 'Strengthen national health systems'],
    impact: '1 billion more people benefiting from UHC by 2030 — a WHO target we actively support.',
  },
  {
    id: 2,
    goals: ['Real-time outbreak detection', 'Cross-border disease reporting', 'Rapid response capacity building'],
    impact: 'Early detection reduced malaria mortality by 44% in program countries over 5 years.',
  },
  {
    id: 3,
    goals: ['Skilled birth attendance for all mothers', 'Newborn and under-5 immunization programs', 'Community health worker training'],
    impact: 'Under-5 mortality has fallen by 59% since 1990, but millions of deaths remain preventable.',
  },
  {
    id: 4,
    goals: ['Community-based mental health care', 'Reducing stigma through education', 'Integrating mental health into primary care'],
    impact: 'Only 1 in 8 people with mental disorders receives treatment — we aim to close this gap.',
  },
  {
    id: 5,
    goals: ['Eliminate childhood stunting and wasting', 'Fortify food supplies in vulnerable regions', 'Promote healthy diets globally'],
    impact: '2.3 billion people face food insecurity; our nutrition programs reach the most vulnerable.',
  },
  {
    id: 6,
    goals: ['Air quality monitoring & health alerts', 'Climate-resilient health infrastructure', 'Vector-borne disease early warning'],
    impact: '7 million premature deaths linked to air pollution annually — action on climate is health action.',
  },
];

export default function Initiatives() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 to-teal-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Global Health Initiatives</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
            Our programs address the root causes of preventable illness and health inequality through evidence-based, community-led action.
          </p>
        </div>
      </section>

      {/* Initiatives Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {healthInitiatives.map((initiative, idx) => {
            const scheme = colorSchemes[idx % colorSchemes.length];
            const detail = detailedContent.find((d) => d.id === initiative.id);
            return (
              <div
                key={initiative.id}
                id={initiative.link.slice(1)}
                className={`rounded-2xl border p-8 ${scheme.bg} ${scheme.border}`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{initiative.icon}</span>
                  <div className="flex-1">
                    <h2 className={`text-xl font-bold mb-2 ${scheme.text}`}>{initiative.title}</h2>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">{initiative.description}</p>

                    {detail && (
                      <>
                        <h3 className="font-semibold text-gray-800 text-sm mb-2">Key Goals</h3>
                        <ul className="space-y-1 mb-4">
                          {detail.goals.map((goal) => (
                            <li key={goal} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className={`mt-0.5 text-xs font-bold ${scheme.text}`}>✓</span>
                              {goal}
                            </li>
                          ))}
                        </ul>
                        <div className={`rounded-lg px-4 py-3 text-xs font-medium ${scheme.badge}`}>
                          📊 {detail.impact}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Partner with Us</h2>
          <p className="text-gray-500 mb-6">
            We collaborate with governments, NGOs, research institutions, and private sector organizations to scale our impact.
          </p>
          <a
            href="mailto:contact@omanye.health"
            className="inline-block px-6 py-3 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
          >
            Start a Conversation
          </a>
        </div>
      </section>
    </div>
  );
}
