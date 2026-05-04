import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { starMapShapes } from '../data/posterOptions.js';

// Group shapes so the selector is easier to scan
const SHAPE_GROUPS = [
  {
    label: 'Classic',
    keys: ['circle', 'square', 'rounded-square', 'hexagon', 'oval', 'diamond', 'arch'],
  },
  {
    label: 'Decorative',
    keys: [
      'heart',
      'crescent-moon',
      'double-circle',
      'telescope-view',
      'window-frame',
      'planet-ring-frame',
      'badge-seal',
      'polaroid-frame',
      'full-poster-background',
    ],
  },
];

export function ShapeSelector({ value, onChange }) {
  const [openGroup, setOpenGroup] = useState('Classic');

  const toggleGroup = (label) => {
    setOpenGroup(openGroup === label ? null : label);
  };

  return (
    <section className="selectorBlock">
      <div className="selectorHeader">
        <span>Star-map shape</span>
      </div>
      {SHAPE_GROUPS.map((group) => {
        const isOpen = openGroup === group.label;
        return (
          <div key={group.label} className="shapeGroup">
            <button 
              type="button" 
              className="shapeGroupLabel"
              onClick={() => toggleGroup(group.label)}
            >
              {group.label}
              <ChevronDown 
                size={14} 
                className="groupChevron" 
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>
            {isOpen && (
              <div className="shapeSelectorGrid" aria-label={`${group.label} shapes`}>
                {group.keys.map((key) => {
                  const shape = starMapShapes[key];
                  if (!shape) return null;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={value === key ? 'shapeOption active' : 'shapeOption'}
                      onClick={() => onChange(key)}
                      title={shape.label}
                      aria-pressed={value === key}
                    >
                      <ShapeIcon kind={shape.kind} isActive={value === key} />
                      <span>{shape.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

/**
 * Mini poster preview icon — dark sky with tiny star dots inside the shape,
 * so each button instantly communicates what the chart area will look like.
 */
function ShapeIcon({ kind, isActive }) {
  const starDots = getMiniStarDots(kind);

  return (
    <svg className="shapeIcon" viewBox="0 0 56 56" aria-hidden="true">
      {/* Sky fill clipped to shape */}
      <defs>
        <clipPath id={`clip-${kind}`}>
          <ShapeClipSmall kind={kind} />
        </clipPath>
      </defs>

      {/* Sky background */}
      <g clipPath={`url(#clip-${kind})`}>
        <rect x="0" y="0" width="56" height="56" fill="#0d1a2e" />
        {/* Subtle radial glow center */}
        <circle cx="28" cy="28" r="20" fill="url(#skyGlow)" opacity="0.6" />
        {/* Mini star dots */}
        {starDots.map((dot, i) => (
          <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill="#ffffff" opacity={dot.o} />
        ))}
      </g>

      {/* Shape outline */}
      <ShapeOutlineSmall kind={kind} isActive={isActive} />
    </svg>
  );
}

function ShapeClipSmall({ kind }) {
  switch (kind) {
    case 'heart':
      return <path d="M28 46 C12 35 9 21 18 14 C22 11 27 13 28 18 C29 13 34 11 38 14 C47 21 44 35 28 46Z" />;
    case 'arch':
      return <path d="M14 46 L14 26 C14 14 20 8 28 8 C36 8 42 14 42 26 L42 46Z" />;
    case 'square':
      return <rect x="10" y="10" width="36" height="36" />;
    case 'rounded-square':
      return <rect x="10" y="10" width="36" height="36" rx="6" />;
    case 'hexagon':
      return <polygon points="28,7 47,18 47,38 28,49 9,38 9,18" />;
    case 'crescent-moon':
      return <path d="M26 7 A21 21 0 1 0 26 49 C35 43 40 36 40 28 C40 20 35 13 26 7Z" />;
    case 'diamond':
      return <polygon points="28,7 50,28 28,49 6,28" />;
    case 'full-poster-background':
      return <rect x="4" y="4" width="48" height="48" />;
    case 'oval':
      return <ellipse cx="28" cy="28" rx="22" ry="16" />;
    case 'double-circle':
      return <circle cx="28" cy="28" r="20" />;
    case 'polaroid-frame':
      return <rect x="10" y="8" width="36" height="40" />;
    case 'planet-ring-frame':
      return <circle cx="28" cy="28" r="18" />;
    case 'badge-seal':
      return (
        <polygon points="28,6 32,11 38,9 40,15 46,17 44,23 49,27 44,31 46,37 40,39 38,45 32,43 28,48 24,43 18,45 16,39 10,37 12,31 7,27 12,23 10,17 16,15 18,9 24,11" />
      );
    case 'telescope-view':
      return <circle cx="28" cy="28" r="19" />;
    case 'window-frame':
      return <path d="M14 46 L14 26 C14 14 20 8 28 8 C36 8 42 14 42 26 L42 46Z" />;
    case 'circle':
    default:
      return <circle cx="28" cy="28" r="20" />;
  }
}

function ShapeOutlineSmall({ kind, isActive }) {
  const strokeColor = isActive ? '#c99b5f' : 'rgba(255,255,255,0.55)';
  const common = { fill: 'none', stroke: strokeColor, strokeWidth: 1.5 };

  switch (kind) {
    case 'heart':
      return <path {...common} d="M28 46 C12 35 9 21 18 14 C22 11 27 13 28 18 C29 13 34 11 38 14 C47 21 44 35 28 46Z" />;
    case 'arch':
      return <path {...common} d="M14 46 L14 26 C14 14 20 8 28 8 C36 8 42 14 42 26 L42 46Z" />;
    case 'square':
      return <rect {...common} x="10" y="10" width="36" height="36" />;
    case 'rounded-square':
      return <rect {...common} x="10" y="10" width="36" height="36" rx="6" />;
    case 'hexagon':
      return <polygon {...common} points="28,7 47,18 47,38 28,49 9,38 9,18" />;
    case 'crescent-moon':
      return <path {...common} d="M26 7 A21 21 0 1 0 26 49 C35 43 40 36 40 28 C40 20 35 13 26 7Z" />;
    case 'diamond':
      return <polygon {...common} points="28,7 50,28 28,49 6,28" />;
    case 'full-poster-background':
      return <rect {...common} x="4" y="4" width="48" height="48" />;
    case 'oval':
      return <ellipse {...common} cx="28" cy="28" rx="22" ry="16" />;
    case 'double-circle':
      return (
        <g {...common}>
          <circle cx="28" cy="28" r="20" />
          <circle cx="28" cy="28" r="15" strokeWidth="1" opacity="0.6" />
        </g>
      );
    case 'polaroid-frame':
      return (
        <g {...common}>
          <rect x="10" y="8" width="36" height="40" />
          <rect x="13" y="11" width="30" height="30" strokeWidth="1" opacity="0.65" />
        </g>
      );
    case 'planet-ring-frame':
      return (
        <g {...common}>
          <circle cx="28" cy="28" r="18" />
          <ellipse cx="28" cy="28" rx="26" ry="6" transform="rotate(-18 28 28)" strokeWidth="1.2" opacity="0.72" />
        </g>
      );
    case 'badge-seal':
      return (
        <polygon {...common} points="28,6 32,11 38,9 40,15 46,17 44,23 49,27 44,31 46,37 40,39 38,45 32,43 28,48 24,43 18,45 16,39 10,37 12,31 7,27 12,23 10,17 16,15 18,9 24,11" />
      );
    case 'telescope-view':
      return (
        <g {...common}>
          <circle cx="28" cy="28" r="19" strokeWidth="2.5" />
          <line x1="28" y1="11" x2="28" y2="45" strokeWidth="1" opacity="0.45" />
          <line x1="11" y1="28" x2="45" y2="28" strokeWidth="1" opacity="0.45" />
        </g>
      );
    case 'window-frame':
      return (
        <g {...common}>
          <path d="M14 46 L14 26 C14 14 20 8 28 8 C36 8 42 14 42 26 L42 46Z" />
          <line x1="28" y1="9" x2="28" y2="46" strokeWidth="1" opacity="0.55" />
          <line x1="14" y1="28" x2="42" y2="28" strokeWidth="1" opacity="0.55" />
        </g>
      );
    case 'circle':
    default:
      return <circle {...common} cx="28" cy="28" r="20" />;
  }
}

/**
 * Returns a small array of {cx, cy, r, o} star dot positions for each shape.
 * Carefully chosen so the dots sit inside the clipped shape area.
 */
function getMiniStarDots(kind) {
  // Common scatter patterns — offsets from center (28, 28)
  const base = [
    { dx: -8, dy: -9, r: 1.4, o: 0.95 },
    { dx: 6, dy: -12, r: 1.0, o: 0.85 },
    { dx: 11, dy: 3, r: 0.7, o: 0.65 },
    { dx: -4, dy: 7, r: 1.1, o: 0.75 },
    { dx: 3, dy: -5, r: 0.5, o: 0.55 },
    { dx: -12, dy: 2, r: 0.8, o: 0.70 },
    { dx: 8, dy: 9, r: 0.6, o: 0.50 },
    { dx: -6, dy: -3, r: 0.5, o: 0.45 },
    { dx: 0, dy: -14, r: 0.7, o: 0.60 },
    { dx: 14, dy: -6, r: 0.6, o: 0.58 },
    { dx: -10, dy: 12, r: 0.5, o: 0.42 },
    { dx: 5, dy: 14, r: 0.5, o: 0.40 },
  ];

  // For shapes that are taller (arch, window), shift stars up slightly
  const shiftUp = ['arch', 'window-frame', 'polaroid-frame'];
  const yShift = shiftUp.includes(kind) ? -4 : 0;

  // For crescent, shift left so dots land on the filled area
  const xShift = kind === 'crescent-moon' ? -5 : 0;

  return base.map(({ dx, dy, r, o }) => ({
    cx: 28 + dx + xShift,
    cy: 28 + dy + yShift,
    r,
    o,
  }));
}
