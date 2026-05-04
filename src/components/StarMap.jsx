import { useMemo } from 'react';
import { Body, Equator, Horizon, Illumination, Observer } from 'astronomy-engine';
import allConstellations from '../data/allConstellations.json';
import expandedStars from '../data/expandedStarCatalog.json';
import sampleStars from '../data/sampleStarCatalog.json';
import milkyWayData from '../data/milkyway.json';

const combinedCatalog = [...sampleStars, ...expandedStars.map((s, i) => ({ ...s, id: `exp-${i}` }))];

const DEFAULT_CENTER = 450;
const DEFAULT_RADIUS = 300;
const DEFAULT_THEME = {
  accentColor: '#c99b5f',
  constellationLineColor: '#c99b5f',
  starColor: '#fff8e6',
};

export function StarMap({
  centerX = DEFAULT_CENTER,
  centerY = DEFAULT_CENTER,
  radius = DEFAULT_RADIUS,
  date,
  time,
  latitude,
  longitude,
  projection = 'stereographic',
  starCatalog = combinedCatalog,
  constellations = allConstellations,
  showConstellations = true,
  showMilkyWay = true,
  showMoon = true,
  showMoonLabel = true,
  showPlanets = true,
  showPlanetLabels = true,
  showConstellationLabels = true,
  showStarLabels = false,
  showGrid = false,
  gridOpacity = 0.2,
  gridColor = '',
  chartGlowId = 'chartGlow',
  starGlowId = 'starGlow',
  theme = DEFAULT_THEME,
}) {
  const visibleStars = useMemo(
    () =>
      getVisibleStars({
        centerX,
        centerY,
        date,
        latitude,
        longitude,
        projection,
        radius,
        starCatalog,
        time,
      }),
    [centerX, centerY, date, latitude, longitude, projection, radius, starCatalog, time],
  );

  const { segments: constellationSegments, labels: constellationLabels } = useMemo(
    () => getVisibleConstellations({
      constellations,
      date,
      time,
      latitude,
      longitude,
      centerX,
      centerY,
      radius,
      projection,
    }),
    [constellations, date, time, latitude, longitude, centerX, centerY, radius, projection],
  );

  const milkyWayPaths = useMemo(() => {
    if (!showMilkyWay) return [];
    
    const observer = new Observer(
      clampCoordinate(latitude, -90, 90),
      clampCoordinate(longitude, -180, 180),
      0,
    );
    const observationDate = buildObservationDate(date, time);
    
    const paths = [];
    
    for (const feature of milkyWayData.features) {
      if (feature.geometry.type === 'MultiPolygon') {
        for (const polygon of feature.geometry.coordinates) {
          for (const ring of polygon) {
            if (ring.length === 0) continue;
            
            const points = [];
            for (const coord of ring) {
              const ra = normalizeRaToHours(coord[0] / 15);
              const dec = clampCoordinate(coord[1], -90, 90);
              const horiz = Horizon(observationDate, observer, ra, dec, 'normal');
              
              // We project all points, even those well below horizon, to allow the polygon to close naturally.
              // The stereographic projection caps tanHalf, so points will bunch up along the boundary circle.
              const pos = projectHorizontal(horiz, centerX, centerY, radius, projection);
              points.push(`${pos.x},${pos.y}`);
            }
            if (points.length > 2) {
              paths.push(`M ${points[0]} L ${points.slice(1).join(' L ')} Z`);
            }
          }
        }
      }
    }
    return paths;
  }, [showMilkyWay, date, time, latitude, longitude, centerX, centerY, radius, projection]);

  const moonData = useMemo(() => {
    if (!showMoon) return null;
    
    const observationDate = buildObservationDate(date, time);
    const observer = new Observer(
      clampCoordinate(latitude, -90, 90),
      clampCoordinate(longitude, -180, 180),
      0,
    );

    const equ = Equator(Body.Moon, observationDate, observer, false, false);
    const horiz = Horizon(observationDate, observer, equ.ra, equ.dec, 'normal');
    const pos = projectHorizontal(horiz, centerX, centerY, radius, projection);
    
    const illum = Illumination(Body.Moon, observationDate);
    
    return { pos, phase: illum.phase_angle, fraction: illum.phase_fraction, altitude: horiz.altitude };
  }, [showMoon, date, time, latitude, longitude, centerX, centerY, radius, projection]);

  const planetsData = useMemo(() => {
    if (!showPlanets) return [];
    
    const observationDate = buildObservationDate(date, time);
    const observer = new Observer(
      clampCoordinate(latitude, -90, 90),
      clampCoordinate(longitude, -180, 180),
      0,
    );

    const planets = [
      { name: 'Mercury', body: Body.Mercury },
      { name: 'Venus', body: Body.Venus },
      { name: 'Mars', body: Body.Mars },
      { name: 'Jupiter', body: Body.Jupiter },
      { name: 'Saturn', body: Body.Saturn },
    ];

    return planets.map(p => {
      const equ = Equator(p.body, observationDate, observer, false, false);
      const horiz = Horizon(observationDate, observer, equ.ra, equ.dec, 'normal');
      const pos = projectHorizontal(horiz, centerX, centerY, radius, projection);
      return { ...p, pos, altitude: horiz.altitude };
    });
  }, [showPlanets, date, time, latitude, longitude, centerX, centerY, radius, projection]);

  const gridSegments = useMemo(() => {
    if (!showGrid) return [];
    
    const observationDate = buildObservationDate(date, time);
    const observer = new Observer(
      clampCoordinate(latitude, -90, 90),
      clampCoordinate(longitude, -180, 180),
      0,
    );

    const segments = [];
    
    // Meridians (RA lines) - every 2 hours (30 deg)
    for (let ra = 0; ra < 24; ra += 2) {
      const points = [];
      for (let dec = -80; dec <= 80; dec += 10) {
        const horiz = Horizon(observationDate, observer, ra, dec, 'normal');
        const pos = projectHorizontal(horiz, centerX, centerY, radius, projection);
        points.push(pos);
      }
      segments.push(points);
    }
    
    // Parallels (Dec lines) - every 20 degrees
    for (let dec = -60; dec <= 60; dec += 20) {
      const points = [];
      for (let ra = 0; ra <= 24; ra += 0.5) {
        const horiz = Horizon(observationDate, observer, ra, dec, 'normal');
        const pos = projectHorizontal(horiz, centerX, centerY, radius, projection);
        points.push(pos);
      }
      segments.push(points);
    }
    
    return segments;
  }, [showGrid, date, time, latitude, longitude, centerX, centerY, radius, projection]);

  return (
    <g>
      {showMilkyWay && milkyWayPaths.length > 0 && (
        <g filter={`url(#${chartGlowId})`}>
          <path
            d={milkyWayPaths.join(' ')}
            fill={theme.sky.galaxyMist ?? theme.accentColor}
            fillRule="evenodd"
            opacity="0.10"
            stroke="none"
          />
        </g>
      )}

      {showPlanets && planetsData.map(p => (
        p.altitude > -15 && (
          <g key={p.name} transform={`translate(${p.pos.x}, ${p.pos.y})`}>
            <circle r="4.5" fill={theme.starColor} opacity="0.9" filter={`url(#${starGlowId})`} />
            <circle r="2.5" fill={theme.accentColor} />
            {showPlanetLabels && (
              <text 
                y="-10" 
                textAnchor="middle" 
                fill={theme.starColor} 
                fontSize="9" 
                fontWeight="bold" 
                opacity="0.8"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {p.name.toUpperCase()}
              </text>
            )}
          </g>
        )
      ))}

      {showMoon && moonData && moonData.altitude > -15 && (
        <g transform={`translate(${moonData.pos.x}, ${moonData.pos.y})`}>
          {/* Simple Moon Visualization */}
          <circle r="9" fill={theme.starColor} opacity="0.3" filter={`url(#${starGlowId})`} />
          <circle r="7" fill={theme.starColor} />
          {/* Shadow to simulate phase */}
          {moonData.fraction < 0.95 && (
             <ellipse 
               cx={moonData.phase > 180 ? 2 : -2} 
               ry="7" 
               rx={7 * (1 - moonData.fraction)} 
               fill="black" 
               opacity="0.6" 
             />
          )}
          {showMoonLabel && (
            <text 
              y="-14" 
              textAnchor="middle" 
              fill={theme.starColor} 
              fontSize="10" 
              fontWeight="bold"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              MOON
            </text>
          )}
        </g>
      )}

      {showConstellations && (
        <g filter={`url(#${chartGlowId})`}>
          {showGrid && gridSegments.map((segment, idx) => (
            <path
              key={`grid-${idx}`}
              d={`M ${segment.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke={gridColor || theme.constellationLineColor || theme.accentColor}
              strokeWidth="0.5"
              strokeDasharray="4 4"
              opacity={gridOpacity}
            />
          ))}
          {constellationSegments.map((segment) => (
            <line
              key={segment.key}
              x1={segment.from.x}
              y1={segment.from.y}
              x2={segment.to.x}
              y2={segment.to.y}
              stroke={theme.constellationLineColor ?? theme.accentColor}
              strokeWidth="0.4"
              strokeLinecap="round"
              opacity="0.4"
            />
          ))}
          {showConstellationLabels && constellationLabels.map((label) => (
            <text
              key={label.key}
              x={label.x}
              y={label.y}
              fill={theme.constellationLineColor ?? theme.accentColor}
              fontFamily={theme.fontPairing?.body ?? 'Inter, Arial, sans-serif'}
              fontSize="6"
              letterSpacing="0.05em"
              textAnchor="middle"
              opacity="0.8"
            >
              {label.name}
            </text>
          ))}
        </g>
      )}

      <g filter={`url(#${starGlowId})`}>
        {visibleStars.map((star, i) => (
          <circle
            key={star.id || star.name || i}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill={theme.starColor}
            opacity={star.opacity}
          >
            <title>{`${star.name}, magnitude ${star.mag}, altitude ${star.altitude.toFixed(1)}°`}</title>
          </circle>
        ))}
        {showStarLabels && visibleStars.filter(s => s.mag < 2.5 && s.name).map((star) => (
          <text
            key={`${star.id || star.name}-name`}
            x={star.x}
            y={star.y + star.size + 8}
            fill={theme.starColor}
            fontSize="7"
            textAnchor="middle"
            opacity="0.6"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {star.name}
          </text>
        ))}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Visible named stars
// ---------------------------------------------------------------------------

function getVisibleStars({
  centerX,
  centerY,
  date,
  latitude,
  longitude,
  projection,
  radius,
  starCatalog,
  time,
}) {
  const observer = new Observer(
    clampCoordinate(latitude, -90, 90),
    clampCoordinate(longitude, -180, 180),
    0,
  );
  const observationDate = buildObservationDate(date, time);

  return starCatalog
    .map((star) => {
      const horizontal = Horizon(
        observationDate,
        observer,
        normalizeRaToHours(star.ra),
        clampCoordinate(star.dec, -90, 90),
        'normal',
      );

      // Include stars below the mathematical horizon (down to -35°)
      // to fill the corners of rectangular/decorative shapes.
      if (horizontal.altitude < -35) {
        return null;
      }

      const extinctionOpacity = altitudeExtinction(horizontal.altitude);

      return {
        ...star,
        ...projectHorizontal(horizontal, centerX, centerY, radius, projection),
        altitude: horizontal.altitude,
        azimuth: horizontal.azimuth,
        ...magnitudeToBrightness(star.mag, extinctionOpacity),
      };
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Seeded background star field
// ---------------------------------------------------------------------------

/**
 * Deterministic seeded PRNG (xoshiro-inspired, simple mulberry32 variant).
 * Produces reproducible star fields for the same date/lat/lon combination.
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff;
  };
}

function buildSeed(date, time, latitude, longitude) {
  const str = `${date ?? 'x'}|${time ?? 'y'}|${latitude ?? 0}|${longitude ?? 0}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

function generateBackgroundStars({
  centerX,
  centerY,
  radius,
  date,
  time,
  latitude,
  longitude,
  projection,
  count,
}) {
  const rand = mulberry32(buildSeed(date, time, latitude, longitude));
  const stars = [];

  for (let i = 0; i < count; i++) {
    // Random altitude (5–90°) and azimuth (0–360°)
    // Bias toward the zenith slightly using sqrt to get a more natural density
    const altFraction = rand();
    const altitude = 5 + altFraction * 85; // 5° to 90°
    const azimuth = rand() * 360;

    const horizontal = { altitude, azimuth };
    const { x, y } = projectHorizontal(horizontal, centerX, centerY, radius, projection);

    // Discard if projected outside the chart circle (can happen near the
    // horizon with stereographic projection)
    const dx = x - centerX;
    const dy = y - centerY;
    if (dx * dx + dy * dy > radius * radius * 1.02) {
      continue;
    }

    // Random size: mostly tiny pinpoints, occasional slightly larger ones
    const sizeSeed = rand();
    const size = sizeSeed < 0.80
      ? round(0.35 + rand() * 0.55)   // 80% tiny (0.35–0.9)
      : round(0.9 + rand() * 0.7);    // 20% slightly larger (0.9–1.6)

    // Opacity: dim-biased to keep the feel subtle
    const opacity = round(0.18 + rand() * 0.42);

    stars.push({ id: `bg-${i}`, x, y, size, opacity });
  }

  return stars;
}

// ---------------------------------------------------------------------------
// Constellation helpers
// ---------------------------------------------------------------------------

function getVisibleConstellations({ constellations, date, time, latitude, longitude, centerX, centerY, radius, projection }) {
  const observer = new Observer(
    clampCoordinate(latitude, -90, 90),
    clampCoordinate(longitude, -180, 180),
    0,
  );
  const observationDate = buildObservationDate(date, time);

  const segments = [];
  const labels = [];

  for (const constellation of constellations) {
    let visiblePoints = 0;

    // Process lines defined as coordinate pairs
    for (const [fromCoord, toCoord] of constellation.lines) {
      const fromHoriz = Horizon(observationDate, observer, normalizeRaToHours(fromCoord.ra), clampCoordinate(fromCoord.dec, -90, 90), 'normal');
      const toHoriz = Horizon(observationDate, observer, normalizeRaToHours(toCoord.ra), clampCoordinate(toCoord.dec, -90, 90), 'normal');

      // Include if at least one point is above horizon or slightly below to fill corners
      if (fromHoriz.altitude > -35 || toHoriz.altitude > -35) {
        const fromPos = projectHorizontal(fromHoriz, centerX, centerY, radius, projection);
        const toPos = projectHorizontal(toHoriz, centerX, centerY, radius, projection);

        segments.push({
          key: `${constellation.id}-${segments.length}`,
          from: fromPos,
          to: toPos,
        });
        visiblePoints++;
      }
    }

    // Process labels
    if (visiblePoints > 0 && constellation.labelPosition) {
       const labelHoriz = Horizon(observationDate, observer, normalizeRaToHours(constellation.labelPosition.ra), clampCoordinate(constellation.labelPosition.dec, -90, 90), 'normal');
       // Only render label if it's reasonably high up or filling a corner
       if (labelHoriz.altitude > -20) {
          const labelPos = projectHorizontal(labelHoriz, centerX, centerY, radius, projection);
          labels.push({
            key: `${constellation.id}-label`,
            name: constellation.name,
            x: labelPos.x,
            y: labelPos.y,
          });
       }
    }
  }

  return { segments, labels };
}

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

function projectHorizontal(horizontal, centerX, centerY, radius, projection) {
  const altitude = horizontal.altitude;
  const azimuth = degreesToRadians(horizontal.azimuth);
  const zenithAngle = degreesToRadians(90 - altitude);

  let projectedRadius;
  if (projection === 'azimuthal') {
    projectedRadius = radius * ((90 - altitude) / 90);
  } else {
    // Stereographic — cap at a wide angle (e.g. tan(125/2) ~ 1.9) to fill corners
    // without stretching to infinity.
    const tanHalf = Math.tan(zenithAngle / 2);
    projectedRadius = radius * Math.min(tanHalf, 2.0);
  }

  return {
    // North is up; East is to the LEFT in standard sky chart convention
    x: round(centerX - Math.sin(azimuth) * projectedRadius),
    y: round(centerY - Math.cos(azimuth) * projectedRadius),
  };
}

// ---------------------------------------------------------------------------
// Magnitude / brightness helpers
// ---------------------------------------------------------------------------

/**
 * Maps visual magnitude to a pixel radius using an exponential scale
 * that mimics stellar flux ratios (each 5 magnitudes = 100× in brightness).
 */
function magnitudeToBrightness(value, extinctionFactor = 1) {
  const mag = Number(value);
  const safeMag = Number.isNaN(mag) ? 6 : mag;

  // Flux-based size: brighter stars much larger than dim ones
  const flux = Math.pow(10, (6.5 - safeMag) / 5); // range ~0.001–10000
  const normalizedFlux = clamp(flux / 10, 0.02, 1);

  // Size: 0.4px (mag 6.5) → 3px (mag −1.5)
  const size = round(0.4 + normalizedFlux * 2.6);

  // Opacity: bright stars approach 1.0, faint ones 0.28, dimmed by extinction
  const opacityBase = round(clamp(0.28 + normalizedFlux * 0.72, 0.28, 1));
  const opacity = round(opacityBase * extinctionFactor);

  return { size, opacity };
}

/**
 * Returns an opacity multiplier (0.2–1.0) that fades stars near the horizon
 * to simulate atmospheric extinction.
 */
function altitudeExtinction(altitude) {
  if (altitude >= 10) return 1;
  // Fade slightly towards the edges, but keep them visible enough for poster corners
  return Math.max(0.4, 1 + (altitude - 10) / 60);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function buildObservationDate(date, time) {
  if (!date) {
    return new Date();
  }

  const timeValue = time || '00:00';
  const parsedDate = new Date(`${date}T${timeValue}:00`);

  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

function normalizeRaToHours(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0;
  }

  const hours = number <= 24 ? number : number / 15;
  return ((hours % 24) + 24) % 24;
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function clampCoordinate(value, min, max) {
  const number = Number(value);
  return Number.isNaN(number) ? 0 : clamp(number, min, max);
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value) {
  return Math.round(value * 100) / 100;
}
