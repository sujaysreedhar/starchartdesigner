import { posterThemes } from '../data/posterOptions.js';

export function ThemeSelector({ value, onChange }) {
  return (
    <section className="selectorBlock">
      <div className="selectorHeader">
        <span>Theme</span>
      </div>
      <div className="themeSelectorGrid" aria-label="Poster theme">
        {Object.entries(posterThemes).map(([key, theme]) => (
          <button
            key={key}
            type="button"
            className={value === key ? 'themeOption active' : 'themeOption'}
            onClick={() => onChange(key)}
            title={theme.label}
          >
            <span className="themePreview" style={{ background: theme.background }}>
              <span style={{ background: theme.sky.mid }} />
              <span style={{ background: theme.starColor, color: theme.starColor }} />
              <span style={{ background: theme.accentColor }} />
            </span>
            <span>{theme.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
