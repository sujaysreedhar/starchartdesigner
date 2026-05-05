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
  title: 'The day when',
  subtitle: 'Earth Got the Second Moon',
  date: '2001-05-18',
  time: '10:30',
  locationName: 'Bengaluru',
  locationDisplayName: 'Bengaluru, Karnataka, India',
  locationState: 'Karnataka',
  locationCountry: 'India',
  latitude: '12.9716',
  longitude: '77.5946',

  // Map 2 (for Double Layout)
  date2: '2026-06-15',
  time2: '20:00',
  locationName2: 'Paris, France',
  latitude2: '48.8566',
  longitude2: '2.3522',

  layout: 'single', // 'single' or 'double'
  theme: 'space-blueprint',
  starMapShape: 'circle',
  showConstellations: true,
  showMilkyWay: true,
  showMoon: true,
  showMoonLabel: true,
  showPlanets: true,
  showPlanetLabels: true,
  showConstellationLabels: true,
  showStarLabels: false,
  showCompass: true,
  showCompassText: true,
  showGrid: false,
  gridOpacity: 0.2,
  gridColor: '',
  posterSize: '18 x 24 in',
  backgroundImage: null,
  chartBackgroundImage: null,
  showSkyGradient: true,
  textSettings: {
    title: { size: 82, color: '', font: 'Brittany Signature', align: 'middle', yOffset: 0, transform: 'none' },
    subtitle: { size: 13, color: '', font: '', align: 'middle', yOffset: 0, transform: 'uppercase' },
    meta: { size: 10.5, color: '', font: '', align: 'middle', yOffset: 0, transform: 'uppercase' },
  },
};

function App() {
  const [poster, setPoster] = useState(defaultPoster);
  const [currentDesignId, setCurrentDesignId] = useState(null);
  const [currentDesignName, setCurrentDesignName] = useState('');
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
          <Route 
            path="/" 
            element={
              <Home 
                poster={poster} 
                setPoster={setPoster} 
                setCurrentDesignId={setCurrentDesignId}
                setCurrentDesignName={setCurrentDesignName}
              />
            } 
          />
          <Route 
            path="/designer" 
            element={
              <LivePosterDesigner 
                poster={poster} 
                setPoster={setPoster} 
                currentDesignId={currentDesignId}
                setCurrentDesignId={setCurrentDesignId}
                currentDesignName={currentDesignName}
                setCurrentDesignName={setCurrentDesignName}
              />
            } 
          />
          <Route path="/preview" element={<Preview poster={poster} />} />
        </Routes>
      </main>
    </div>
  );
}

function Home({ poster, setPoster, setCurrentDesignId, setCurrentDesignName }) {
  const [savedDesigns, setSavedDesigns] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/designs');
        const data = await res.json();
        setSavedDesigns(data);
      } catch (err) {
        console.error('Failed to fetch designs', err);
      }
    };
    fetchDesigns();
  }, []);

  const loadDesign = (design) => {
    setPoster(design.poster_data);
    setCurrentDesignId(design.id);
    setCurrentDesignName(design.name);
    navigate('/designer');
  };

  return (
    <section className="homePage">
      <div className="homeMain">
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
      </div>

      {savedDesigns.length > 0 && (
        <div className="homeSavedSection">
          <div className="sectionHeader">
            <h2>Your saved collections</h2>
            <p>Click to open and edit your previous designs.</p>
          </div>
          <div className="homeSavedGrid">
            {savedDesigns.map((d) => (
              <div key={d.id} className="homeSavedCard" onClick={() => loadDesign(d.poster_data)}>
                <div className="cardPreview">
                  <PosterSvg poster={d.poster_data} compact />
                </div>
                <div className="cardInfo">
                  <h3>{d.name}</h3>
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
