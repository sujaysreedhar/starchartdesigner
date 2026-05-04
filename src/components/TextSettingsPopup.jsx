import React, { useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, Settings2, X, Sparkles, Type } from 'lucide-react';
import { typographyThemes } from '../data/posterOptions.js';

export function TextSettingsPopup({ poster, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('title');

  const updateTextSetting = (field, key, value) => {
    const newSettings = {
      ...poster.textSettings,
      [field]: { ...poster.textSettings[field], [key]: value },
    };
    onUpdate('textSettings', newSettings);
  };

  if (!isOpen) {
    return (
      <button className="settingsToggleButton" onClick={() => setIsOpen(true)}>
        <Settings2 size={18} />
        <span>Text Styles</span>
      </button>
    );
  }

  const sections = [
    { id: 'title', label: 'Title' },
    { id: 'subtitle', label: 'Subtitle' },
    { id: 'meta', label: 'Meta Text' },
  ];

  const current = poster.textSettings[activeTab];

  return (
    <div className="textSettingsPopup">
      <div className="popupHeader">
        <h3>Typography</h3>
        <button onClick={() => setIsOpen(false)} className="closeButton"><X size={18} /></button>
      </div>

      <div className="popupTabs">
        {sections.map((s) => (
          <button
            key={s.id}
            className={activeTab === s.id ? 'active' : ''}
            onClick={() => setActiveTab(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="popupContent">
        <div className="settingGroup">
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> Style Presets
          </label>
          <div className="themeGrid">
            {typographyThemes.map((theme) => (
              <button
                key={theme.id}
                className="themeItem"
                onClick={() => onUpdate('textSettings', { ...poster.textSettings, ...theme.settings })}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />
        <div className="settingGroup">
          <label>Font Family</label>
          <select 
            value={current.font || ''} 
            onChange={(e) => updateTextSetting(activeTab, 'font', e.target.value)}
          >
            <option value="">Theme Default</option>
            <option value="'Brittany Signature', cursive">Brittany Signature</option>
            <option value="'Playfair Display', serif">Playfair Display (Elegant Serif)</option>
            <option value="'Montserrat', sans-serif">Montserrat (Geometric)</option>
            <option value="'Dancing Script', cursive">Dancing Script (Casual Script)</option>
            <option value="'Outfit', sans-serif">Outfit (Clean Sans)</option>
            <option value="'Cinzel', serif">Cinzel (Roman Classic)</option>
            <option value="Inter, sans-serif">Inter (Modern)</option>
            <option value="Georgia, serif">Georgia (Standard Serif)</option>
          </select>
        </div>

        <div className="settingGroup">
          <label>Size ({current.size}px)</label>
          <input
            type="range"
            min="8"
            max="120"
            value={current.size}
            onChange={(e) => updateTextSetting(activeTab, 'size', parseInt(e.target.value))}
          />
        </div>

        <div className="settingGroup">
          <label>Vertical Position ({current.yOffset || 0}px)</label>
          <input
            type="range"
            min="-200"
            max="200"
            value={current.yOffset || 0}
            onChange={(e) => updateTextSetting(activeTab, 'yOffset', parseInt(e.target.value))}
          />
        </div>

        <div className="settingGroup">
          <label>Horizontal Position ({current.xOffset || 0}px)</label>
          <input
            type="range"
            min="-300"
            max="300"
            value={current.xOffset || 0}
            onChange={(e) => updateTextSetting(activeTab, 'xOffset', parseInt(e.target.value))}
          />
        </div>

        <div className="settingGroup">
          <label>Color</label>
          <div className="colorRow">
            <input
              type="color"
              value={current.color || '#000000'}
              onChange={(e) => updateTextSetting(activeTab, 'color', e.target.value)}
            />
            <button 
              className="resetButton" 
              onClick={() => updateTextSetting(activeTab, 'color', '')}
            >
              Reset to Theme
            </button>
          </div>
        </div>

        <div className="settingGroup">
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Type size={12} /> Font Case
          </label>
          <div className="caseButtons">
            <button
              className={current.transform === 'none' ? 'active' : ''}
              onClick={() => updateTextSetting(activeTab, 'transform', 'none')}
              title="Normal Case"
            >
              Ab
            </button>
            <button
              className={current.transform === 'uppercase' ? 'active' : ''}
              onClick={() => updateTextSetting(activeTab, 'transform', 'uppercase')}
              title="UPPERCASE"
            >
              AB
            </button>
            <button
              className={current.transform === 'lowercase' ? 'active' : ''}
              onClick={() => updateTextSetting(activeTab, 'transform', 'lowercase')}
              title="lowercase"
            >
              ab
            </button>
            <button
              className={current.transform === 'capitalize' ? 'active' : ''}
              onClick={() => updateTextSetting(activeTab, 'transform', 'capitalize')}
              title="Capitalize Each Word"
            >
              Abc
            </button>
          </div>
        </div>

        <div className="settingGroup">
          <label>Alignment</label>
          <div className="alignButtons">
            <button
              className={current.align === 'start' ? 'active' : ''}
              onClick={() => updateTextSetting(activeTab, 'align', 'start')}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              className={current.align === 'middle' ? 'active' : ''}
              onClick={() => updateTextSetting(activeTab, 'align', 'middle')}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              className={current.align === 'end' ? 'active' : ''}
              onClick={() => updateTextSetting(activeTab, 'align', 'end')}
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
          </div>
        </div>

        <div className="divider" />
        
        <button 
          className="resetFullSectionButton"
          onClick={() => {
            const defaults = {
              title: { size: 82, color: '', font: 'Brittany Signature', align: 'middle', yOffset: 0, transform: 'none', xOffset: 0 },
              subtitle: { size: 13, color: '', font: '', align: 'middle', yOffset: 0, transform: 'uppercase', xOffset: 0 },
              meta: { size: 10.5, color: '', font: '', align: 'middle', yOffset: 0, transform: 'uppercase', xOffset: 0 },
            };
            onUpdate('textSettings', {
              ...poster.textSettings,
              [activeTab]: defaults[activeTab]
            });
          }}
        >
          Reset {activeTab} to Default
        </button>
      </div>
    </div>
  );
}
