import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  Eye,
  Home as HomeIcon,
  MoonStar,
  Palette,
} from 'lucide-react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { LivePosterDesigner } from './components/LivePosterDesigner.jsx';
import { ExportButtons } from './components/ExportButtons.jsx';
import { PosterSvg } from './components/PosterSvg.jsx';
import './styles.css';

const defaultPoster = {
  title: 'The Night We Met',
  subtitle: 'A sky written just for us',
  date: '2026-05-03',
  time: '21:30',
  locationName: 'Jaipur, India',
  locationDisplayName: 'Jaipur, Rajasthan, India',
  locationState: 'Rajasthan',
  locationCountry: 'India',
  latitude: '26.9124',
  longitude: '75.7873',

  // Map 2 (for Double Layout)
  date2: '2026-06-15',
  time2: '20:00',
  locationName2: 'Paris, France',
  latitude2: '48.8566',
  longitude2: '2.3522',

  layout: 'single', // 'single' or 'double'
  theme: 'space-blueprint',
  starMapShape: 'circle',
  showMilkyWay: true,
  showMoon: true,
  showPlanets: true,
  showGrid: false,
  gridOpacity: 0.2,
  gridColor: '',
  posterSize: '18 x 24 in',
  backgroundImage: null,
  chartBackgroundImage: null,
  textSettings: {
    title: { size: 82, color: '', font: 'Brittany Signature', align: 'middle', yOffset: 0 },
    subtitle: { size: 13, color: '', font: '', align: 'middle', yOffset: 0 },
    meta: { size: 10.5, color: '', font: '', align: 'middle', yOffset: 0 },
  },
};

function App() {
  const [poster, setPoster] = useState(defaultPoster);
  const location = useLocation();
  const navigate = useNavigate();

  const nav = [
    { id: '/', path: '/', label: 'Home', icon: HomeIcon },
    { id: '/designer', path: '/designer', label: 'Designer', icon: Palette },
    { id: '/preview', path: '/preview', label: 'Preview', icon: Eye },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Open home">
          <MoonStar size={24} />
          <span>Celeste Studio</span>
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={isActive ? 'navButton active' : 'navButton'}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home poster={poster} />} />
          <Route path="/designer" element={<LivePosterDesigner poster={poster} setPoster={setPoster} />} />
          <Route path="/preview" element={<Preview poster={poster} />} />
        </Routes>
      </main>
    </div>
  );
}

function Home({ poster }) {
  return (
    <section className="homePage">
      <div className="homeCopy">
        <h1>Design a keepsake sky for the moment that changed everything.</h1>
        <p>
          Compose a personalized star map poster with date, time, place,
          coordinates, theme, and print size in one live designer.
        </p>
        <div className="homeActions">
          <Link className="primaryButton" to="/designer">
            Start designing <ArrowRight size={18} />
          </Link>
          <Link className="secondaryButton" to="/preview">
            View preview <Eye size={18} />
          </Link>
        </div>
      </div>
      <div className="homePoster">
        <PosterSvg poster={poster} compact />
      </div>
    </section>
  );
}

function Preview({ poster }) {
  const posterSvgRef = useRef(null);

  return (
    <section className="previewPage">
      <div className="previewIntro">
        <h1>Final poster preview</h1>
        <p>Review the SVG poster composition before export, checkout, or backend ordering are added.</p>
        <Link className="secondaryButton" to="/designer">
          Edit design <Palette size={18} />
        </Link>
        <ExportButtons poster={poster} svgRef={posterSvgRef} />
      </div>
      <PosterSvg ref={posterSvgRef} poster={poster} />
    </section>
  );
}

createRoot(document.getElementById('root')).render(
  <Router>
    <App />
  </Router>
);
