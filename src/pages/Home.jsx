import { Link } from 'react-router-dom';
import { globalStats, healthInitiatives, partners } from '../data/healthData';

function StatCard({ stat }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <div className={`rounded-xl border p-6 flex flex-col gap-2 ${colorMap[stat.color]}`}>
      <div className="text-3xl">{stat.icon}</div>
      <div className="text-3xl font-extrabold">{stat.value}</div>
      <div className="font-semibold text-sm">{stat.label}</div>
      <p className="text-xs opacity-75 leading-relaxed">{stat.description}</p>
    </div>
  );
}

function InitiativeCard({ initiative }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="text-3xl">{initiative.icon}</div>
      <h3 className="font-bold text-gray-900 text-lg">{initiative.title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed flex-1">{initiative.description}</p>
      <Link
        to="/initiatives"
        className="text-emerald-600 text-sm font-semibold hover:underline self-start"
      >
        Learn more →
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <circle cx="200" cy="100" r="300" fill="white" />
            <circle cx="700" cy="350" r="200" fill="white" />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <span className="inline-block mb-4 px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
              🌍 Global Health Platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Health for Every<br />
              <span className="text-emerald-200">Person. Every Nation.</span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 mb-8 leading-relaxed max-w-2xl">
              Omanye is a global platform connecting health advocates, researchers, policymakers, and communities to
              drive equitable health outcomes across the world.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/initiatives"
                className="px-6 py-3 rounded-lg bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors shadow"
              >
                Explore Initiatives
              </Link>
              <Link
                to="/resources"
                className="px-6 py-3 rounded-lg bg-emerald-800/50 border border-white/30 text-white font-semibold hover:bg-emerald-800/70 transition-colors"
              >
                Health Resources
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">The Global Health Challenge</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Understanding the scale of global health disparities is the first step toward building solutions.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {globalStats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </section>

      {/* Initiatives */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Our Key Initiatives</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              From disease control to climate health, our programs tackle the most pressing health challenges.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthInitiatives.map((initiative) => (
              <InitiativeCard key={initiative.id} initiative={initiative} />
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Our Partners</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            We work alongside leading global health organizations to amplify impact.
          </p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-6">
          {partners.map((partner) => (
            <a
              key={partner.abbr}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 font-semibold text-sm transition-colors"
              title={partner.name}
            >
              {partner.abbr}
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-700 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Join the Movement for Global Health Equity</h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Whether you are a researcher, policymaker, healthcare worker, or advocate — there's a place for you on Omanye.
          </p>
          <a
            href="mailto:contact@omanye.health"
            className="inline-block px-8 py-3 rounded-lg bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors shadow"
          >
            Get Involved Today
          </a>
        </div>
      </section>
    </div>
  );
}
