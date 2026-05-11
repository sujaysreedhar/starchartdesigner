import opentype from 'opentype.js';

/**
 * Mapping of font-family names used in CSS to their actual TTF font file URLs.
 */
const FONT_MAP = {
  'Brittany Signature': '/fonts/BrittanySignature.ttf',
  'Montserrat': 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf',
  'Outfit': 'https://fonts.gstatic.com/s/outfit/v11/QGYsz_ueSjtS_Dk-JpX9.ttf',
  'Cinzel': 'https://fonts.gstatic.com/s/cinzel/v22/8vIJ7ww6m9mY7vUu3vVz.ttf',
  'Playfair Display': 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD7K_RW7gIAbgs6Z_54SZA1U.ttf',
  'Inter': 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZg.ttf',
  'Dancing Script': 'https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6fe34-4Bc0n229GF0L87YxA.ttf',
};

const fontCache = {};

/**
 * Loads a font and caches it.
 */
async function loadFont(fontFamily) {
  const url = FONT_MAP[fontFamily];
  if (!url) {
    console.warn(`Font family "${fontFamily}" not found in FONT_MAP. Falling back to default.`);
    return null;
  }

  if (fontCache[url]) {
    return fontCache[url];
  }

  try {
    const font = await opentype.load(url);
    fontCache[url] = font;
    return font;
  } catch (err) {
    console.error(`Failed to load font from ${url}:`, err);
    return null;
  }
}

/**
 * Converts all <text> elements in an SVG to <path> elements.
 */
export async function outlineAllText(svgElement) {
  const textElements = Array.from(svgElement.querySelectorAll('text'));
  
  // Group elements by font to load fonts in parallel once
  const fontsNeeded = new Set();
  textElements.forEach(el => {
    const family = getFontFamily(el);
    if (family) fontsNeeded.add(family);
  });

  await Promise.all(Array.from(fontsNeeded).map(loadFont));

  // Process each text element
  for (const textEl of textElements) {
    await convertTextToPath(textEl);
  }
}

function getFontFamily(el) {
  let family = el.getAttribute('font-family') || window.getComputedStyle(el).fontFamily;
  if (!family) return null;
  
  // Clean up the family name (take the first one if it's a list)
  const firstFamily = family.split(',')[0].trim();
  return firstFamily.replace(/['"]/g, '');
}

async function convertTextToPath(textEl) {
  const family = getFontFamily(textEl);
  const font = await loadFont(family);
  if (!font) return; // Fallback to leaving it as text if font can't be loaded

  const style = window.getComputedStyle(textEl);
  const fontSize = parseFloat(textEl.getAttribute('font-size') || style.fontSize) || 16;
  const x = parseFloat(textEl.getAttribute('x')) || 0;
  const y = parseFloat(textEl.getAttribute('y')) || 0;
  const textAnchor = textEl.getAttribute('text-anchor') || style.textAnchor || 'start';
  const fill = textEl.getAttribute('fill') || style.fill || 'black';
  const opacity = textEl.getAttribute('opacity') || style.opacity || '1';
  const transform = textEl.getAttribute('transform') || '';
  const letterSpacing = parseFloat(textEl.getAttribute('letter-spacing') || style.letterSpacing) || 0;

  // Handle text-transform (uppercase, lowercase)
  let content = textEl.textContent;
  const textTransform = textEl.getAttribute('text-transform') || style.textTransform;
  if (textTransform === 'uppercase') content = content.toUpperCase();
  if (textTransform === 'lowercase') content = content.toLowerCase();

  // Create paths for each character to handle letter-spacing and alignment properly
  const paths = [];
  let currentX = 0;

  // Calculate total width for alignment
  const kerning = true;
  let totalWidth = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const glyph = font.charToGlyph(char);
    totalWidth += glyph.advanceWidth * (fontSize / font.unitsPerEm);
    if (i < content.length - 1 && kerning) {
      const nextChar = content[i + 1];
      totalWidth += font.getKerningValue(glyph, font.charToGlyph(nextChar)) * (fontSize / font.unitsPerEm);
    }
    if (i < content.length - 1) {
      totalWidth += letterSpacing;
    }
  }

  // Offset based on anchor
  let anchorOffset = 0;
  if (textAnchor === 'middle') anchorOffset = -totalWidth / 2;
  else if (textAnchor === 'end') anchorOffset = -totalWidth;

  currentX = x + anchorOffset;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const glyph = font.charToGlyph(char);
    const path = font.getPath(char, currentX, y, fontSize, { kerning });
    
    // Convert opentype.js Path to SVG path data
    const pathData = path.toPathData();
    if (pathData) {
      paths.push(pathData);
    }

    currentX += glyph.advanceWidth * (fontSize / font.unitsPerEm);
    if (i < content.length - 1 && kerning) {
      const nextChar = content[i + 1];
      currentX += font.getKerningValue(glyph, font.charToGlyph(nextChar)) * (fontSize / font.unitsPerEm);
    }
    currentX += letterSpacing;
  }

  // Create a single <path> element or a <g> of paths
  const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  newPath.setAttribute('d', paths.join(' '));
  newPath.setAttribute('fill', fill);
  if (opacity !== '1') newPath.setAttribute('opacity', opacity);
  if (transform) newPath.setAttribute('transform', transform);
  
  // Copy over common attributes
  if (textEl.id) newPath.id = textEl.id;
  if (textEl.getAttribute('class')) newPath.setAttribute('class', textEl.getAttribute('class'));

  // Replace text element with path
  textEl.parentNode.replaceChild(newPath, textEl);
}
