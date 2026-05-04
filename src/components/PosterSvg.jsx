import { forwardRef, useId, useMemo } from 'react';
import { getPosterHeight, posterThemes, starMapShapes } from '../data/posterOptions.js';
import { StarMap } from './StarMap.jsx';

export const PosterSvg = forwardRef(function PosterSvg({ poster, compact = false }, ref) {
  const gradientId = useId().replaceAll(':', '');
  const theme = posterThemes[poster.theme] ?? posterThemes['classic-black-gold'];
  const shape = starMapShapes[poster.starMapShape] ?? starMapShapes.circle;
  const formattedDate = useMemo(() => formatDate(poster.date), [poster.date]);
  const formattedTime = useMemo(() => formatTime(poster.time), [poster.time]);
  const coordinates = useMemo(
    () => `${formatCoordinate(poster.latitude, 'N', 'S')} / ${formatCoordinate(poster.longitude, 'E', 'W')}`,
    [poster.latitude, poster.longitude],
  );

  const ts = poster.textSettings || {
    title: { size: 82, color: '', font: '', align: 'middle' },
    subtitle: { size: 13, color: '', font: '', align: 'middle' },
    meta: { size: 10.5, color: '', font: '', align: 'middle' },
  };

  const getX = (align) => {
    if (align === 'start') return 80;
    if (align === 'end') return 820;
    return 450;
  };

  const height = getPosterHeight(poster.posterSize);
  const extraHeight = Math.max(0, height - 1200);
  const cyOffset = extraHeight / 2;

  const mapDesigns = useMemo(() => {
    const common = {
      showConstellations: poster.showConstellations ?? true,
      showMilkyWay: poster.showMilkyWay ?? true,
      showMoon: poster.showMoon ?? true,
      showPlanets: poster.showPlanets ?? true,
      showGrid: poster.showGrid ?? false,
      gridOpacity: poster.gridOpacity ?? 0.2,
      gridColor: poster.gridColor,
    };

    if (poster.layout === 'double') {
      return [
        {
          ...common,
          id: 'map-a',
          date: poster.date,
          time: poster.time,
          latitude: poster.latitude,
          longitude: poster.longitude,
          location: poster.locationName,
          x: 450 - 210,
          y: 450,
          radius: 200,
        },
        {
          ...common,
          id: 'map-b',
          date: poster.date2,
          time: poster.time2,
          latitude: poster.latitude2,
          longitude: poster.longitude2,
          location: poster.locationName2,
          x: 450 + 210,
          y: 450,
          radius: 200,
        },
      ];
    }

    return [
      {
        ...common,
        id: 'map-single',
        date: poster.date,
        time: poster.time,
        latitude: poster.latitude,
        longitude: poster.longitude,
        location: poster.locationName,
        x: shape.cx,
        y: shape.cy,
        radius: shape.radius,
      },
    ];
  }, [poster, shape]);

  return (
    <article className={compact ? 'poster compact' : 'poster'}>
      <svg
        ref={ref}
        className="posterSvg"
        viewBox={`0 0 900 ${height}`}
        role="img"
        aria-labelledby={`${gradientId}-title ${gradientId}-desc`}
      >
        <title id={`${gradientId}-title`}>{poster.title} star map poster</title>
        <desc id={`${gradientId}-desc`}>
          Personalized star map for {poster.locationName} on {formattedDate} at {formattedTime}.
        </desc>
        <defs>
          <radialGradient id={`${gradientId}-sky`} cx="50%" cy="36%" r="68%">
            <stop offset="0%" stopColor={theme.sky.center} />
            <stop offset="64%" stopColor={theme.sky.mid} />
            <stop offset="100%" stopColor={theme.sky.edge} />
          </radialGradient>
          <radialGradient id={`${gradientId}-galaxy`} cx="50%" cy="45%" r="58%">
            <stop offset="0%" stopColor={theme.sky.galaxyCore ?? theme.starColor} stopOpacity="0.84" />
            <stop offset="45%" stopColor={theme.sky.galaxyMist ?? theme.accentColor} stopOpacity="0.34" />
            <stop offset="100%" stopColor={theme.sky.galaxyMist ?? theme.accentColor} stopOpacity="0" />
          </radialGradient>
          <pattern id={`${gradientId}-marble`} width="220" height="220" patternUnits="userSpaceOnUse">
            <rect width="220" height="220" fill="transparent" />
            <path d="M-20 52 C42 18 92 20 150 48 C184 64 214 62 244 42" fill="none" stroke="#d8d0c4" strokeWidth="4" opacity="0.42" />
            <path d="M-12 152 C52 116 110 126 164 154 C196 170 224 166 246 144" fill="none" stroke="#c8c0b4" strokeWidth="3" opacity="0.35" />
          </pattern>
          <filter id={`${gradientId}-chartGlow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.15" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${gradientId}-starGlow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="0.85" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`${gradientId}-shape`} clipPathUnits="userSpaceOnUse">
            <ShapeClip shape={shape} />
          </clipPath>
          <radialGradient id={`${gradientId}-horizon`} cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor={theme.background} stopOpacity="0" />
            <stop offset="100%" stopColor={theme.background} stopOpacity="0.6" />
          </radialGradient>
        </defs>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Dancing+Script:wght@400;700&family=Montserrat:wght@300;400;700&family=Outfit:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

          .posterTitleSvg {
            font-family: ${ts.title.font || "'Brittany Signature', 'Great Vibes', cursive"};
            font-size: ${ts.title.size}px;
            font-weight: 400;
            letter-spacing: -0.02em;
            text-transform: ${ts.title.transform || 'none'};
          }
          .posterSubtitleSvg {
            font-family: ${ts.subtitle.font || theme.fontPairing.body};
            font-size: ${ts.subtitle.size}px;
            font-weight: 300;
            letter-spacing: 0.15em;
            text-transform: ${ts.subtitle.transform || 'uppercase'};
          }
          .posterMetaSvg {
            font-family: ${ts.meta.font || theme.fontPairing.body};
            font-size: ${ts.meta.size}px;
            font-weight: 300;
            letter-spacing: 0.08em;
            text-transform: ${ts.meta.transform || 'uppercase'};
          }
        `}} />

        <rect x="0" y="0" width="900" height={height} fill={theme.background} />
        {poster.backgroundImage && (
          <image 
            href={poster.backgroundImage} 
            x="0" 
            y="0" 
            width="900" 
            height={height} 
            preserveAspectRatio="xMidYMid slice" 
          />
        )}
        {theme.texture === 'marble' && <rect x="0" y="0" width="900" height={height} fill={`url(#${gradientId}-marble)`} />}

        <g transform={`translate(0, ${cyOffset})`}>
          {mapDesigns.map((d) => (
            <g key={d.id}>
              <g clipPath={poster.layout === 'double' ? `url(#${gradientId}-shape-${d.id})` : `url(#${gradientId}-shape)`}>
                {poster.layout === 'double' ? (
                  <defs>
                    <clipPath id={`${gradientId}-shape-${d.id}`} clipPathUnits="userSpaceOnUse">
                      <circle cx={d.x} cy={d.y} r={d.radius} />
                    </clipPath>
                  </defs>
                ) : null}
                <rect
                  x={poster.layout === 'double' ? d.x - d.radius : (shape.bounds?.x ?? d.x - d.radius)}
                  y={poster.layout === 'double' ? d.y - d.radius : (shape.bounds?.y ?? d.y - d.radius)}
                  width={poster.layout === 'double' ? d.radius * 2 : (shape.bounds?.width ?? d.radius * 2)}
                  height={poster.layout === 'double' ? d.radius * 2 : (shape.bounds?.height ?? d.radius * 2)}
                  fill={`url(#${gradientId}-sky)`}
                />
                {poster.chartBackgroundImage && (
                  <image
                    href={poster.chartBackgroundImage}
                    x={d.x - d.radius}
                    y={d.y - d.radius}
                    width={d.radius * 2}
                    height={d.radius * 2}
                    preserveAspectRatio="xMidYMid slice"
                    opacity="0.8"
                  />
                )}
                <StarMap
                  centerX={d.x}
                  centerY={d.y}
                  radius={d.radius}
                  date={d.date}
                  time={d.time}
                  latitude={d.latitude}
                  longitude={d.longitude}
                  showConstellations={d.showConstellations}
                  showMilkyWay={d.showMilkyWay}
                  showMoon={d.showMoon}
                  showMoonLabel={poster.showMoonLabel ?? true}
                  showPlanets={d.showPlanets}
                  showPlanetLabels={poster.showPlanetLabels ?? true}
                  showConstellationLabels={poster.showConstellationLabels ?? true}
                  showStarLabels={poster.showStarLabels ?? false}
                  showGrid={d.showGrid}
                  gridOpacity={d.gridOpacity}
                  gridColor={d.gridColor}
                  chartGlowId={`${gradientId}-chartGlow`}
                  starGlowId={`${gradientId}-starGlow`}
                  theme={theme}
                />
                <circle cx={d.x} cy={d.y} r={d.radius} fill={`url(#${gradientId}-horizon)`} pointerEvents="none" />
              </g>
              {poster.layout === 'double' ? (
                <>
                  <circle cx={d.x} cy={d.y} r={d.radius} fill="none" stroke={theme.borderColor} strokeWidth="2" />
                  <g transform={`translate(${d.x}, ${d.y + d.radius + 30})`} className="posterMetaSvg" fill={theme.primaryText}>
                    <text textAnchor="middle" fontWeight="bold">{d.location}</text>
                    <text y="18" textAnchor="middle" fontSize="9">{formatDate(d.date)} | {formatTime(d.time)}</text>
                  </g>
                </>
              ) : (
                <>
                  <ShapeOutline shape={shape} theme={theme} />
                  {(poster.showCompass ?? true) && (
                    <TechnicalChartFrame shape={shape} theme={theme} chartGlowId={`${gradientId}-chartGlow`} />
                  )}
                </>
              )}
            </g>
          ))}
        </g>

        <rect x="36" y="36" width="828" height={height - 72} fill="none" stroke={theme.borderColor} strokeWidth="2" />

        <text 
          x={getX(ts.title.align) + (ts.title.xOffset || 0)} 
          y={height - 330 + (ts.title.yOffset || 0)} 
          textAnchor={ts.title.align} 
          fill={ts.title.color || theme.primaryText} 
          className="posterTitleSvg"
        >
          {poster.title || 'YOUR TEXT HERE'}
        </text>
        <text 
          x={getX(ts.subtitle.align) + (ts.subtitle.xOffset || 0)} 
          y={height - 290 + (ts.subtitle.yOffset || 0)} 
          textAnchor={ts.subtitle.align} 
          fill={ts.subtitle.color || theme.secondaryText} 
          className="posterSubtitleSvg"
        >
          {poster.subtitle || 'SUBTITLE'}
        </text>

        <g className="posterMetaSvg" fill={theme.primaryText}>
          <text 
            x={getX(ts.meta.align) + (ts.meta.xOffset || 0)} 
            y={height - 160 + (ts.meta.yOffset || 0)} 
            textAnchor={ts.meta.align}
            fill={ts.meta.color || theme.primaryText}
          >
            {poster.locationName ? `Stars Over ${poster.locationName}` : 'Stars Over Bombay'}
          </text>
          <text 
            x={getX(ts.meta.align) + (ts.meta.xOffset || 0)} 
            y={height - 135 + (ts.meta.yOffset || 0)} 
            textAnchor={ts.meta.align}
            fill={ts.meta.color || theme.primaryText}
          >
            {formattedDate} at {formattedTime}  |  {coordinates}
          </text>
        </g>
      </svg>
    </article>
  );
});

function TechnicalChartFrame({ shape, theme, chartGlowId }) {
  if (shape.kind === 'full-poster-background' || shape.radius > 360) {
    return null;
  }

  const isCircular = ['circle', 'double-circle', 'planet-ring-frame', 'telescope-view'].includes(shape.kind);

  if (isCircular) {
    const outerRadius = Math.min(shape.radius + 28, 330);
    const innerRadius = outerRadius - 10;
    const ticks = Array.from({ length: 360 }, (_, index) => index);

    return (
      <g filter={`url(#${chartGlowId})`} opacity="0.95">
        <circle cx={shape.cx} cy={shape.cy} r={outerRadius} fill="none" stroke={theme.constellationLineColor} strokeWidth="1" />
        <circle cx={shape.cx} cy={shape.cy} r={innerRadius} fill="none" stroke={theme.constellationLineColor} strokeWidth="0.5" opacity="0.8" />
        <circle cx={shape.cx} cy={shape.cy} r={outerRadius + 3} fill="none" stroke={theme.constellationLineColor} strokeWidth="2.5" />
        {ticks.map((angle) => {
          const radians = degreesToRadians(angle - 90);
          const isMajor = angle % 10 === 0;
          const isMedium = angle % 5 === 0 && !isMajor;
          
          const tickLength = isMajor ? 8 : isMedium ? 6 : 4;
          const startRadius = outerRadius - tickLength;
          
          const x1 = shape.cx + Math.cos(radians) * startRadius;
          const y1 = shape.cy + Math.sin(radians) * startRadius;
          const x2 = shape.cx + Math.cos(radians) * outerRadius;
          const y2 = shape.cy + Math.sin(radians) * outerRadius;

          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={theme.constellationLineColor}
              strokeWidth={isMajor ? 1 : isMedium ? 0.8 : 0.4}
              opacity={isMajor ? 1 : isMedium ? 0.8 : 0.6}
            />
          );
        })}
        <CompassLabel x={shape.cx} y={shape.cy - outerRadius - 18} label="N" theme={theme} />
        <CompassLabel x={shape.cx - outerRadius - 24} y={shape.cy + 5} label="E" theme={theme} />
        <CompassLabel x={shape.cx + outerRadius + 24} y={shape.cy + 5} label="W" theme={theme} />
        <CompassLabel x={shape.cx} y={shape.cy + outerRadius + 26} label="S" theme={theme} />
      </g>
    );
  }

  // Adaptive technical frame for non-circular shapes (Heart, Square, Arch, etc.)
  const stroke = theme.constellationLineColor;
  const cx = shape.bounds.x + shape.bounds.width / 2;
  const cy = shape.bounds.y + shape.bounds.height / 2;

  const paddingX = shape.bounds.width * 0.04;
  const paddingY = shape.bounds.height * 0.04;
  const N_y = shape.bounds.y - paddingY - 16;
  const S_y = shape.bounds.y + shape.bounds.height + paddingY + 24;
  const W_x = shape.bounds.x + shape.bounds.width + paddingX + 22;
  const E_x = shape.bounds.x - paddingX - 22;

  return (
    <g filter={`url(#${chartGlowId})`} opacity="0.95">
      {/* Outer framing line */}
      <g fill="none" stroke={stroke} strokeWidth="1" opacity="0.8" transform={`translate(${cx} ${cy}) scale(1.08) translate(-${cx} -${cy})`}>
        <ShapeClip shape={shape} />
      </g>
      {/* Dashed ticks contour line */}
      <g fill="none" stroke={stroke} strokeWidth="5" opacity="0.9" strokeDasharray="1 7" transform={`translate(${cx} ${cy}) scale(1.05) translate(-${cx} -${cy})`}>
        <ShapeClip shape={shape} />
      </g>
      {/* Inner thin framing line */}
      <g fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.8" transform={`translate(${cx} ${cy}) scale(1.02) translate(-${cx} -${cy})`}>
        <ShapeClip shape={shape} />
      </g>
      
      {/* Compass markers positioned around the shape's bounding box */}
      <CompassLabel x={cx} y={N_y} label="N" theme={theme} />
      <CompassLabel x={E_x} y={cy + 4} label="E" theme={theme} />
      <CompassLabel x={W_x} y={cy + 4} label="W" theme={theme} />
      <CompassLabel x={cx} y={S_y} label="S" theme={theme} />
    </g>
  );
}

function CompassLabel({ x, y, label, theme }) {
  return (
    <text
      x={x}
      y={y}
      fill={theme.constellationLineColor}
      fontFamily={theme.fontPairing.body}
      fontSize="12"
      fontWeight="400"
      textAnchor="middle"
      letterSpacing="1"
    >
      {label}
    </text>
  );
}

function SkyGuides({ shape, theme }) {
  const radius = shape.radius;

  return (
    <g>
      <circle cx={shape.cx} cy={shape.cy} r={radius * 0.78} fill="none" stroke={theme.sky.grid} strokeWidth="2" />
      <circle cx={shape.cx} cy={shape.cy} r={radius * 0.52} fill="none" stroke={theme.sky.grid} strokeWidth="1.5" />
      <circle cx={shape.cx} cy={shape.cy} r={radius * 0.26} fill="none" stroke={theme.sky.grid} strokeWidth="1" />
      <line x1={shape.cx - radius} y1={shape.cy} x2={shape.cx + radius} y2={shape.cy} stroke={theme.sky.grid} strokeWidth="1.5" />
      <line x1={shape.cx} y1={shape.cy - radius} x2={shape.cx} y2={shape.cy + radius} stroke={theme.sky.grid} strokeWidth="1.5" />
    </g>
  );
}

function ShapeClip({ shape }) {
  switch (shape.kind) {
    case 'heart':
      return <path d="M450 704 C214 554 168 362 284 248 C351 182 426 218 450 282 C474 218 549 182 616 248 C732 362 686 554 450 704Z" />;
    case 'arch':
    case 'window-frame':
      return <path d="M180 724 L180 384 C180 230 300 124 450 124 C600 124 720 230 720 384 L720 724Z" />;
    case 'square':
      return <rect x="165" y="139" width="570" height="570" />;
    case 'rounded-square':
      return <rect x="165" y="139" width="570" height="570" rx="58" />;
    case 'hexagon':
      return <polygon points="450,124 704,274 704,574 450,724 196,574 196,274" />;
    case 'crescent-moon':
      return <path d="M430 124 A300 300 0 1 0 430 724 C560 638 622 528 622 424 C622 320 560 210 430 124Z" />;
    case 'diamond':
      return <polygon points="450,124 750,424 450,724 150,424" />;
    case 'full-poster-background':
      return <rect x="0" y="0" width="900" height="1200" />;
    case 'oval':
      return <ellipse cx="450" cy="424" rx="320" ry="250" />;
    case 'double-circle':
    case 'planet-ring-frame':
      return <circle cx="450" cy="424" r="300" />;
    case 'polaroid-frame':
      return <rect x="210" y="150" width="480" height="480" />;
    case 'badge-seal':
      return <polygon points="450,110 496,156 558,132 582,194 646,210 630,274 682,314 642,368 674,424 642,480 682,534 630,574 646,638 582,654 558,716 496,692 450,738 404,692 342,716 318,654 254,638 270,574 218,534 258,480 226,424 258,368 218,314 270,274 254,210 318,194 342,132 404,156" />;
    case 'telescope-view':
      return <circle cx="450" cy="424" r="288" />;
    case 'circle':
    default:
      return <circle cx="450" cy="424" r="300" />;
  }
}

function ShapeOutline({ shape, theme }) {
  const stroke = theme.sky.ring ?? theme.borderColor;
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 4,
  };

  switch (shape.kind) {
    case 'heart':
      return <path {...common} d="M450 704 C214 554 168 362 284 248 C351 182 426 218 450 282 C474 218 549 182 616 248 C732 362 686 554 450 704Z" />;
    case 'arch':
      return <path {...common} d="M180 724 L180 384 C180 230 300 124 450 124 C600 124 720 230 720 384 L720 724Z" />;
    case 'window-frame':
      return (
        <g {...common}>
          <path d="M180 724 L180 384 C180 230 300 124 450 124 C600 124 720 230 720 384 L720 724Z" />
          <line x1="450" y1="126" x2="450" y2="724" />
          <line x1="180" y1="424" x2="720" y2="424" />
        </g>
      );
    case 'square':
      return <rect {...common} x="165" y="139" width="570" height="570" />;
    case 'rounded-square':
      return <rect {...common} x="165" y="139" width="570" height="570" rx="58" />;
    case 'hexagon':
      return <polygon {...common} points="450,124 704,274 704,574 450,724 196,574 196,274" />;
    case 'crescent-moon':
      return <path {...common} d="M430 124 A300 300 0 1 0 430 724 C560 638 622 528 622 424 C622 320 560 210 430 124Z" />;
    case 'diamond':
      return <polygon {...common} points="450,124 750,424 450,724 150,424" />;
    case 'full-poster-background':
      return null;
    case 'oval':
      return <ellipse {...common} cx="450" cy="424" rx="320" ry="250" />;
    case 'double-circle':
      return (
        <g {...common}>
          <circle cx="450" cy="424" r="300" />
          <circle cx="450" cy="424" r="260" strokeWidth="2.5" opacity="0.72" />
        </g>
      );
    case 'polaroid-frame':
      return (
        <g {...common}>
          <rect x="170" y="118" width="560" height="660" />
          <rect x="210" y="150" width="480" height="480" />
        </g>
      );
    case 'planet-ring-frame':
      return (
        <g {...common}>
          <ellipse cx="450" cy="424" rx="374" ry="82" transform="rotate(-16 450 424)" strokeWidth="3" opacity="0.82" />
          <circle cx="450" cy="424" r="300" />
        </g>
      );
    case 'badge-seal':
      return <polygon {...common} points="450,110 496,156 558,132 582,194 646,210 630,274 682,314 642,368 674,424 642,480 682,534 630,574 646,638 582,654 558,716 496,692 450,738 404,692 342,716 318,654 254,638 270,574 218,534 258,480 226,424 258,368 218,314 270,274 254,210 318,194 342,132 404,156" />;
    case 'telescope-view':
      return (
        <g {...common}>
          <circle cx="450" cy="424" r="288" strokeWidth="8" />
          <line x1="450" y1="158" x2="450" y2="690" strokeWidth="2" opacity="0.52" />
          <line x1="184" y1="424" x2="716" y2="424" strokeWidth="2" opacity="0.52" />
        </g>
      );
    case 'circle':
    default:
      return <circle {...common} cx="450" cy="424" r="300" />;
  }
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value || 'Select a date';
  }

  return date.toLocaleDateString('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) {
    return 'Select a time';
  }

  const [hours, minutes] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString('en', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCoordinate(value, positiveSuffix, negativeSuffix) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return `0.0000 ${positiveSuffix}`;
  }

  const suffix = number >= 0 ? positiveSuffix : negativeSuffix;
  return `${Math.abs(number).toFixed(4)} ${suffix}`;
}
