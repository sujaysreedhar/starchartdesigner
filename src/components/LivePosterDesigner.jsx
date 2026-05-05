import { useEffect, useRef, useState } from 'react';
import { Save, Sparkles, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { posterSizes } from '../data/posterOptions.js';
import { ExportButtons } from './ExportButtons.jsx';
import { LocationSearch } from './LocationSearch.jsx';
import { PosterSvg } from './PosterSvg.jsx';
import { ShapeSelector } from './ShapeSelector.jsx';
import { ThemeSelector } from './ThemeSelector.jsx';
import { TextSettingsPopup } from './TextSettingsPopup.jsx';

export function LivePosterDesigner({ 
  poster, 
  setPoster, 
  currentDesignId, 
  setCurrentDesignId, 
  currentDesignName, 
  setCurrentDesignName 
}) {
  const posterSvgRef = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [saveName, setSaveName] = useState(currentDesignName || '');

  useEffect(() => {
    setSaveName(currentDesignName || '');
  }, [currentDesignName]);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/designs');
      const data = await res.json();
      setSavedDesigns(data);
    } catch (err) {
      console.error('Could not connect to the save server. Make sure node server.js is running.');
    }
  };

  const handleSave = async () => {
    const name = saveName.trim() || `Design ${new Date().toLocaleTimeString()}`;
    try {
      const res = await fetch('http://localhost:3001/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, poster_data: poster }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentDesignId(data.id);
        setCurrentDesignName(name);
        fetchDesigns();
      }
    } catch (err) {
      alert('Failed to save design. Is the server running?');
    }
  };

  const handleUpdate = async () => {
    const name = saveName.trim() || currentDesignName;
    try {
      const res = await fetch(`http://localhost:3001/api/designs/${currentDesignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, poster_data: poster }),
      });
      if (res.ok) {
        setCurrentDesignName(name);
        fetchDesigns();
      }
    } catch (err) {
      alert('Failed to update design.');
    }
  };

  const handleLoad = (design) => {
    setPoster(design.poster_data);
    setCurrentDesignId(design.id);
    setCurrentDesignName(design.name);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this saved design?')) return;
    try {
      await fetch(`http://localhost:3001/api/designs/${id}`, { method: 'DELETE' });
      fetchDesigns();
    } catch (err) {
      alert('Failed to delete design.');
    }
  };

  const updatePoster = (key, value) => {
    setPoster((current) => ({ ...current, [key]: value }));
  };

  const updateLocation = (location) => {
    setPoster((current) => ({
      ...current,
      locationName: location.locationName,
      locationDisplayName: location.displayName,
      locationState: location.locationState,
      locationCountry: location.locationCountry,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  return (
    <section className="designerPage">
      <aside className="settingsPanel">
        <div className="panelHeader">
          <h2>Poster settings</h2>
          <p>Every field is connected to the SVG preview.</p>
        </div>

        <Field label="Title">
          <input
            value={poster.title}
            onChange={(event) => updatePoster('title', event.target.value)}
            placeholder="The Night We Met"
          />
        </Field>

        <Field label="Subtitle">
          <input
            value={poster.subtitle}
            onChange={(event) => updatePoster('subtitle', event.target.value)}
            placeholder="A sky written just for us"
          />
        </Field>

        <div className="twoColumn">
          <Field label="Date">
            <input
              type="date"
              value={poster.date}
              onChange={(event) => updatePoster('date', event.target.value)}
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              value={poster.time}
              onChange={(event) => updatePoster('time', event.target.value)}
            />
          </Field>
        </div>

        <LocationSearch poster={poster} onSelectLocation={updateLocation} />

        <details className="advancedLocation">
          <summary>Advanced coordinates</summary>
          <Field label="Location name">
            <input
              value={poster.locationName}
              onChange={(event) => updatePoster('locationName', event.target.value)}
              placeholder="Jaipur, India"
            />
          </Field>
          <div className="twoColumn">
            <Field label="Latitude">
              <input
                type="number"
                step="0.0001"
                value={poster.latitude}
                onChange={(event) => updatePoster('latitude', event.target.value)}
                placeholder="26.9124"
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="0.0001"
                value={poster.longitude}
                onChange={(event) => updatePoster('longitude', event.target.value)}
                placeholder="75.7873"
              />
            </Field>
          </div>
          <div className="twoColumn">
            <Field label="State / region">
              <input
                value={poster.locationState}
                onChange={(event) => updatePoster('locationState', event.target.value)}
                placeholder="Rajasthan"
              />
            </Field>
            <Field label="Country">
              <input
                value={poster.locationCountry}
                onChange={(event) => updatePoster('locationCountry', event.target.value)}
                placeholder="India"
              />
            </Field>
          </div>
        </details>

        <div className="checkboxField">
          <label>
            <input
              type="checkbox"
              checked={poster.showConstellations}
              onChange={(event) => updatePoster('showConstellations', event.target.checked)}
            />
            Show constellation lines
          </label>
        </div>
        {poster.showConstellations && (
          <div className="checkboxField nestedCheckbox">
            <label>
              <input
                type="checkbox"
                checked={poster.showConstellationLabels}
                onChange={(event) => updatePoster('showConstellationLabels', event.target.checked)}
              />
              Show constellation names
            </label>
          </div>
        )}
        <div className="checkboxField">
          <label>
            <input
              type="checkbox"
              checked={poster.showMilkyWay ?? true}
              onChange={(event) => updatePoster('showMilkyWay', event.target.checked)}
            />
            Show Milky Way
          </label>
        </div>
        <div className="checkboxField">
          <label>
            <input
              type="checkbox"
              checked={poster.showMoon ?? true}
              onChange={(event) => updatePoster('showMoon', event.target.checked)}
            />
            Show Moon
          </label>
        </div>
        {poster.showMoon && (
          <div className="checkboxField nestedCheckbox">
            <label>
              <input
                type="checkbox"
                checked={poster.showMoonLabel}
                onChange={(event) => updatePoster('showMoonLabel', event.target.checked)}
              />
              Show moon label
            </label>
          </div>
        )}
        <div className="checkboxField">
          <label>
            <input
              type="checkbox"
              checked={poster.showPlanets ?? true}
              onChange={(event) => updatePoster('showPlanets', event.target.checked)}
            />
            Show Planets
          </label>
        </div>
        {poster.showPlanets && (
          <div className="checkboxField nestedCheckbox">
            <label>
              <input
                type="checkbox"
                checked={poster.showPlanetLabels}
                onChange={(event) => updatePoster('showPlanetLabels', event.target.checked)}
              />
              Show planet names
            </label>
          </div>
        )}

        <div className="checkboxField">
          <label>
            <input
              type="checkbox"
              checked={poster.showStarLabels}
              onChange={(event) => updatePoster('showStarLabels', event.target.checked)}
            />
            Show star names
          </label>
        </div>

        <div className="checkboxField">
          <label>
            <input
              type="checkbox"
              checked={poster.showCompass ?? true}
              onChange={(event) => updatePoster('showCompass', event.target.checked)}
            />
            Show compass outline
          </label>
        </div>

        <div className="checkboxField">
          <label>
            <input
              type="checkbox"
              checked={poster.showCompassText ?? true}
              onChange={(event) => updatePoster('showCompassText', event.target.checked)}
            />
            Show direction text (N, E, S, W)
          </label>
        </div>

        <div className="checkboxField">
          <label>
            <input
              type="checkbox"
              checked={poster.showGrid ?? false}
              onChange={(event) => updatePoster('showGrid', event.target.checked)}
            />
            Show grid lines (Graticule)
          </label>
        </div>

        {poster.showGrid && (
          <div className="nestedSettings">
            <Field label={`Grid Opacity (${(poster.gridOpacity * 100).toFixed(0)}%)`}>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={poster.gridOpacity || 0.2}
                onChange={(e) => updatePoster('gridOpacity', parseFloat(e.target.value))}
              />
            </Field>
          </div>
        )}

        <div className="checkboxField">
          <label>
            <input
              type="checkbox"
              checked={poster.layout === 'double'}
              onChange={(event) => updatePoster('layout', event.target.checked ? 'double' : 'single')}
            />
            Double Map Layout (Diptych)
          </label>
        </div>

        {poster.layout === 'double' && (
          <details className="nestedSettings">
            <summary>Edit Second Map (Map B)</summary>
            <Field label="Location name (Map B)">
              <input
                value={poster.locationName2}
                onChange={(event) => updatePoster('locationName2', event.target.value)}
              />
            </Field>
            <div className="twoColumn">
              <Field label="Date (Map B)">
                <input
                  type="date"
                  value={poster.date2}
                  onChange={(event) => updatePoster('date2', event.target.value)}
                />
              </Field>
              <Field label="Time (Map B)">
                <input
                  type="time"
                  value={poster.time2}
                  onChange={(event) => updatePoster('time2', event.target.value)}
                />
              </Field>
            </div>
            <div className="twoColumn">
              <Field label="Lat (Map B)">
                <input
                  type="number"
                  value={poster.latitude2}
                  onChange={(event) => updatePoster('latitude2', event.target.value)}
                />
              </Field>
              <Field label="Lng (Map B)">
                <input
                  type="number"
                  value={poster.longitude2}
                  onChange={(event) => updatePoster('longitude2', event.target.value)}
                />
              </Field>
            </div>
          </details>
        )}

        <ThemeSelector value={poster.theme} onChange={(theme) => updatePoster('theme', theme)} />

        <div className="field">
          <span>Poster Background</span>
          <div className="uploadRow">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => updatePoster('backgroundImage', ev.target.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
            {poster.backgroundImage && (
              <button className="resetButton" onClick={() => updatePoster('backgroundImage', null)}>Remove</button>
            )}
          </div>
          {poster.backgroundImage && (
            <div className="checkboxField nestedCheckbox" style={{ marginTop: '8px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={poster.showSkyGradient ?? true}
                  onChange={(event) => updatePoster('showSkyGradient', event.target.checked)}
                />
                Show default sky gradient
              </label>
              <p style={{ fontSize: '0.7rem', color: '#8a847a', margin: '4px 0 0 24px' }}>
                Uncheck to see the background image through the star chart.
              </p>
            </div>
          )}
        </div>

        <div className="field">
          <span>Star Chart Background</span>
          <div className="uploadRow">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => updatePoster('chartBackgroundImage', ev.target.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
            {poster.chartBackgroundImage && (
              <button className="resetButton" onClick={() => updatePoster('chartBackgroundImage', null)}>Remove</button>
            )}
          </div>
        </div>

        <ShapeSelector value={poster.starMapShape} onChange={(shape) => updatePoster('starMapShape', shape)} />

        <Field label="Poster size">
          <select
            value={poster.posterSize}
            onChange={(event) => updatePoster('posterSize', event.target.value)}
          >
            {posterSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </Field>

        <ExportButtons poster={poster} svgRef={posterSvgRef} />

        <div className="saveSection">
          <h3>{currentDesignId ? 'Manage design' : 'Save design'}</h3>
          <div className="saveInputRow">
            <input 
              placeholder="Design name..." 
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
          </div>
          <div className="saveActionButtons">
            {currentDesignId ? (
              <>
                <button className="primaryButton" onClick={handleUpdate}>
                  <Save size={16} />
                  <span>Update</span>
                </button>
                <button className="secondaryButton" onClick={handleSave}>
                  <span>Save as New</span>
                </button>
              </>
            ) : (
              <button className="primaryButton wide" onClick={handleSave}>
                <Save size={16} />
                <span>Save Design</span>
              </button>
            )}
          </div>
          
          {savedDesigns.length > 0 && (
            <div className="savedList">
              <h4>Saved designs</h4>
              {savedDesigns.map((d) => (
                <div 
                  key={d.id} 
                  className={`savedItem ${currentDesignId === d.id ? 'active' : ''}`} 
                  onClick={() => handleLoad(d)}
                >
                  <div className="savedInfo">
                    <span className="savedName">{d.name}</span>
                    <span className="savedDate">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  <button className="deleteBtn" onClick={(e) => handleDelete(e, d.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="livePreview">
        <div className="previewHeader">
          <div>
            <h2>Live poster preview</h2>
            <p>{poster.posterSize} SVG art print</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="zoomToggleButton" 
              onClick={() => setIsZoomed(!isZoomed)}
              title={isZoomed ? "Actual Size" : "Zoom In"}
            >
              {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
              <span>{isZoomed ? 'Reset Zoom' : 'Zoom In'}</span>
            </button>
            <Sparkles size={22} />
          </div>
        </div>
        <div className={`posterContainer ${isZoomed ? 'zoomed' : ''}`}>
          <PosterSvg ref={posterSvgRef} poster={poster} />
        </div>
        <TextSettingsPopup poster={poster} onUpdate={updatePoster} />
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
