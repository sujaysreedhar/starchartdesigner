import { useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { posterSizes } from '../data/posterOptions.js';
import { ExportButtons } from './ExportButtons.jsx';
import { LocationSearch } from './LocationSearch.jsx';
import { PosterSvg } from './PosterSvg.jsx';
import { ShapeSelector } from './ShapeSelector.jsx';
import { ThemeSelector } from './ThemeSelector.jsx';
import { TextSettingsPopup } from './TextSettingsPopup.jsx';

export function LivePosterDesigner({ poster, setPoster }) {
  const posterSvgRef = useRef(null);

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
      </aside>

      <div className="livePreview">
        <div className="previewHeader">
          <div>
            <h2>Live poster preview</h2>
            <p>{poster.posterSize} SVG art print</p>
          </div>
          <Sparkles size={22} />
        </div>
        <PosterSvg ref={posterSvgRef} poster={poster} />
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
