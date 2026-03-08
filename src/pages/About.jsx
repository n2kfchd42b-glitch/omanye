const team = [
  {
    name: 'Dr. Amara Diallo',
    role: 'Executive Director',
    bio: 'Epidemiologist with 20+ years in global health policy, formerly of WHO Africa Regional Office.',
    emoji: '👩🏾‍⚕️',
  },
  {
    name: 'Prof. Kwame Mensah',
    role: 'Head of Research',
    bio: 'Leading researcher in infectious disease dynamics and health systems strengthening across 30 countries.',
    emoji: '🔬',
  },
  {
    name: 'Sofia Martínez',
    role: 'Director of Partnerships',
    bio: 'Built health coalitions across Latin America and Southeast Asia, connecting NGOs, governments, and donors.',
    emoji: '🤝',
  },
  {
    name: 'Dr. Linh Nguyen',
    role: 'Data & Technology Lead',
    bio: 'Pioneered open-source disease surveillance tools used in 40+ low-income countries.',
    emoji: '💻',
  },
];

const values = [
  {
    title: 'Equity',
    description: 'We believe health is a human right. Our work centers communities that are most marginalized.',
    icon: '⚖️',
  },
  {
    title: 'Evidence',
    description: 'All our programs and advocacy are grounded in the best available data and scientific research.',
    icon: '📊',
  },
  {
    title: 'Collaboration',
    description: 'No single organization can solve global health challenges. We build bridges across sectors and borders.',
    icon: '🌐',
  },
  {
    title: 'Accountability',
    description: 'We hold ourselves and our partners to the highest standards of transparency and impact measurement.',
    icon: '✅',
  },
];

const milestones = [
  { year: '2018', event: 'Omanye Health Platform founded with seed funding from global health donors.' },
  { year: '2019', event: 'Launched Universal Health Coverage advocacy program in 12 countries.' },
  { year: '2020', event: 'Pivoted COVID-19 response support — provided PPE and training to 500+ facilities.' },
  { year: '2021', event: 'Disease Surveillance Network expanded to 60 partner countries.' },
  { year: '2022', event: 'Mental Health Initiative launched, reaching 2 million people across 15 nations.' },
  { year: '2023', event: 'Climate & Health program established; first global climate-health summit hosted.' },
  { year: '2024', event: 'Platform reached 100 million users; Resource Library surpassed 1,000 curated items.' },
];

export default function About() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-700 to-emerald-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">🌍</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">About Omanye</h1>
          <p className="text-teal-100 text-lg max-w-2xl mx-auto leading-relaxed">
            "Omanye" — meaning <em>unity</em> in the Akan language of West Africa — reflects our core belief: that improving global health
            requires the whole of humanity working together.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-8">
            <h2 className="text-2xl font-extrabold text-emerald-800 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To accelerate progress toward equitable global health by connecting data, people, and resources — enabling communities,
              researchers, and policymakers to collaborate for a healthier world.
            </p>
          </div>
          <div className="bg-teal-50 rounded-2xl border border-teal-200 p-8">
            <h2 className="text-2xl font-extrabold text-teal-800 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              A world where every person — regardless of where they are born — has access to the healthcare, information, and support they
              need to live a healthy and dignified life.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="text-4xl mb-3">{value.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">Leadership Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member) => (
            <div key={member.name} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
              <div className="text-5xl mb-3">{member.emoji}</div>
              <h3 className="font-bold text-gray-900">{member.name}</h3>
              <p className="text-sm text-emerald-700 font-medium mb-2">{member.role}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-emerald-200" />
            <div className="space-y-6">
              {milestones.map((m) => (
                <div key={m.year} className="flex items-start gap-4 relative">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm z-10">
                    {m.year}
                  </div>
                  <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <p className="text-sm text-gray-700">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
