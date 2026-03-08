import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <span className="text-2xl">🌍</span>
              <span>Omanye Health</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              A global platform dedicated to improving health outcomes for every person, in every nation.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/initiatives" className="hover:text-emerald-400 transition-colors">Initiatives</Link></li>
              <li><Link to="/surveillance" className="hover:text-emerald-400 transition-colors">Disease Surveillance</Link></li>
              <li><Link to="/resources" className="hover:text-emerald-400 transition-colors">Resources</Link></li>
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Partners</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://www.who.int" className="hover:text-emerald-400 transition-colors" target="_blank" rel="noopener noreferrer">WHO</a></li>
              <li><a href="https://www.unicef.org" className="hover:text-emerald-400 transition-colors" target="_blank" rel="noopener noreferrer">UNICEF</a></li>
              <li><a href="https://www.theglobalfund.org" className="hover:text-emerald-400 transition-colors" target="_blank" rel="noopener noreferrer">Global Fund</a></li>
              <li><a href="https://www.gavi.org" className="hover:text-emerald-400 transition-colors" target="_blank" rel="noopener noreferrer">GAVI</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Get Involved</h4>
            <p className="text-sm text-gray-400 mb-3">
              Join our network of health advocates, researchers, and practitioners.
            </p>
            <a
              href="mailto:contact@omanye.health"
              className="inline-block px-4 py-2 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Omanye Health Platform. All rights reserved.</p>
          <p>Data sourced from WHO, UNICEF, IHME, and Our World in Data.</p>
        </div>
      </div>
    </footer>
  );
}
