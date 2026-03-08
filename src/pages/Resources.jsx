import { useState } from 'react';
import { resources } from '../data/healthData';

const categories = ['All', 'Report', 'Guide', 'Data', 'Toolkit'];

const categoryColors = {
  Report: 'bg-blue-100 text-blue-700',
  Guide: 'bg-emerald-100 text-emerald-700',
  Data: 'bg-purple-100 text-purple-700',
  Toolkit: 'bg-amber-100 text-amber-700',
};

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? resources
    : resources.filter((r) => r.category === activeCategory);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 to-indigo-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Health Resources</h1>
          <p className="text-purple-100 text-lg max-w-2xl mx-auto">
            Curated reports, guides, datasets, and toolkits from leading global health authorities to inform decisions and drive action.
          </p>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="sticky top-16 bg-white border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No resources found for this category.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${categoryColors[resource.category]}`}>
                    {resource.category}
                  </span>
                  <span className="text-xs text-gray-400">{resource.date}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-purple-700 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{resource.description}</p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{resource.source}</span>
                  <span className="text-purple-600 text-xs font-semibold group-hover:underline">
                    View →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Contribute */}
      <section className="bg-purple-50 border-t border-purple-100 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Know a Resource We Should Include?</h2>
          <p className="text-gray-500 mb-6">
            Help us build a comprehensive library of global health resources. Submit your recommendations and we'll review them for inclusion.
          </p>
          <a
            href="mailto:resources@omanye.health"
            className="inline-block px-6 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
          >
            Submit a Resource
          </a>
        </div>
      </section>
    </div>
  );
}
