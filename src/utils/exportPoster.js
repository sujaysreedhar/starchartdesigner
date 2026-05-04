import { getPosterHeight } from '../data/posterOptions.js';

const PDF_SIZES = {
  '12 x 18 in': { label: '12x18', width: 864, height: 1296 },
  '18 x 24 in': { label: '18x24', width: 1296, height: 1728 },
  '24 x 36 in': { label: '24x36', width: 1728, height: 2592 },
  'A2 poster': { label: 'A2', width: 1190.55, height: 1683.78 },
};

// ---------------------------------------------------------------------------
// Standard exports
// ---------------------------------------------------------------------------

export function downloadSvg(svgElement, poster) {
  const svgMarkup = serializeSvg(svgElement);
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${getBaseFileName(poster)}.svg`);
}

export async function downloadPng(svgElement, poster) {
  const exportWidth = 5400;
  const exportHeight = getPosterHeight(poster.posterSize) * 6;
  
  const svgMarkup = serializeSvg(svgElement, exportWidth, exportHeight);
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const imageUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;

    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, exportWidth, exportHeight);

    const pngBlob = await canvasToBlob(canvas);
    downloadBlob(pngBlob, `${getBaseFileName(poster)}-${poster.posterSize.replace(/ /g, '')}.png`);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export async function downloadPrintPdf(svgElement, poster) {
  const { jsPDF } = await import('jspdf');
  await import('svg2pdf.js');

  const page = PDF_SIZES[poster.posterSize] ?? PDF_SIZES['18 x 24 in'];
  const doc = new jsPDF('p', 'pt', [page.width, page.height]);
  const exportSvg = makeExportSvg(svgElement);
  const posterBox = getCenteredPosterBox(exportSvg, page);

  await doc.svg(exportSvg, {
    x: posterBox.x,
    y: posterBox.y,
    width: posterBox.width,
    height: posterBox.height,
  });

  doc.save(`${getBaseFileName(poster)}-${page.label.toLowerCase()}.pdf`);
}

// ---------------------------------------------------------------------------
// Laser cut SVG export
// ---------------------------------------------------------------------------

/**
 * Exports a laser-cut-ready SVG with:
 *  - All fills removed (set to "none") except text elements
 *  - All gradient and filter <defs> stripped
 *  - All strokes normalised to #000000 at a uniform 0.4px width
 *  - Opacity attributes removed (laser cutters work in binary)
 *  - Text preserved for engraving reference
 *  - White background added for preview clarity
 */
export function downloadLaserCutSvg(svgElement, poster) {
  const laserSvg = buildLaserCutSvg(svgElement);
  const markup = new XMLSerializer().serializeToString(laserSvg);
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${getBaseFileName(poster)}-laser-cut.svg`);
}

function buildLaserCutSvg(svgElement) {
  // ── Step 0: Capture computed styles from the LIVE DOM ────────────────────
  // The live SVG has CSS applied via the <style> block, so getComputedStyle
  // returns the actual rendered font-family, font-size, etc.
  const liveTextEls = svgElement.querySelectorAll('text, tspan');
  const computedStyles = [];
  for (const el of liveTextEls) {
    const cs = window.getComputedStyle(el);
    computedStyles.push({
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
      textAnchor: el.getAttribute('text-anchor') || '',
    });
  }

  // ── Step 1: Clone ────────────────────────────────────────────────────────
  const clone = svgElement.cloneNode(true);
  const { viewBox } = getSvgMetrics(svgElement);

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('viewBox', viewBox);
  clone.setAttribute('width', '900');
  clone.setAttribute('height', '1200');
  clone.removeAttribute('class');
  clone.removeAttribute('style');

  // ── Step 2: Inline computed font styles onto cloned text elements ────────
  const clonedTextEls = clone.querySelectorAll('text, tspan');
  for (let i = 0; i < clonedTextEls.length && i < computedStyles.length; i++) {
    const el = clonedTextEls[i];
    const s = computedStyles[i];

    el.setAttribute('font-family', s.fontFamily);
    el.setAttribute('font-size', s.fontSize);
    el.setAttribute('font-weight', s.fontWeight);
    if (s.fontStyle && s.fontStyle !== 'normal') {
      el.setAttribute('font-style', s.fontStyle);
    }
    if (s.letterSpacing && s.letterSpacing !== 'normal' && s.letterSpacing !== '0px') {
      el.setAttribute('letter-spacing', s.letterSpacing);
    }
    if (s.textAnchor) {
      el.setAttribute('text-anchor', s.textAnchor);
    }

    // SVG standalone viewers don't support CSS text-transform,
    // so apply it directly to the text content.
    if (s.textTransform && s.textTransform !== 'none') {
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          if (s.textTransform === 'uppercase') {
            node.textContent = node.textContent.toUpperCase();
          } else if (s.textTransform === 'lowercase') {
            node.textContent = node.textContent.toLowerCase();
          } else if (s.textTransform === 'capitalize') {
            node.textContent = node.textContent.replace(/\b\w/g, (c) => c.toUpperCase());
          }
        }
      }
    }
  }

  // ── Step 3: Strip gradient / filter / pattern defs ───────────────────────
  for (const el of clone.querySelectorAll(
    'defs > radialGradient, defs > linearGradient, defs > filter, defs > pattern',
  )) {
    el.remove();
  }

  // ── Step 4: Blank the <style> block (styles are now inlined) ─────────────
  const styleEl = clone.querySelector('style');
  if (styleEl) {
    styleEl.textContent = '/* laser cut — styles inlined */';
  }

  // ── Step 5: Apply laser-cut visual treatment ─────────────────────────────
  applyLaserStyles(clone);

  // ── Step 6: White background rect for preview ────────────────────────────
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', '900');
  bg.setAttribute('height', '1200');
  bg.setAttribute('fill', '#ffffff');
  bg.setAttribute('stroke', 'none');
  const defsEl = clone.querySelector('defs');
  const anchor = defsEl ? defsEl.nextSibling : clone.firstChild;
  clone.insertBefore(bg, anchor);

  return clone;
}

/**
 * Convert every visual element to stroke-only black using a flat
 * querySelectorAll pass. Text elements keep their inlined font attributes.
 */
function applyLaserStyles(svgRoot) {
  const GEOMETRY = new Set(['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path']);
  const SKIP     = new Set(['defs', 'style', 'title', 'desc', 'clippath']);

  for (const el of svgRoot.querySelectorAll('*')) {
    const tag = el.tagName?.toLowerCase() ?? '';
    if (SKIP.has(tag)) continue;

    // Text → black fill, preserve inlined font attributes
    if (tag === 'text' || tag === 'tspan') {
      el.setAttribute('fill', '#000000');
      el.removeAttribute('stroke');
      el.removeAttribute('stroke-width');
      el.removeAttribute('filter');
      el.removeAttribute('opacity');
      el.removeAttribute('fill-opacity');
      el.removeAttribute('class');
      el.removeAttribute('style');
      continue;
    }

    // Group → strip visual attrs, keep structural (id, clip-path, transform)
    if (tag === 'g') {
      el.removeAttribute('fill');
      el.removeAttribute('stroke');
      el.removeAttribute('stroke-width');
      el.removeAttribute('filter');
      el.removeAttribute('opacity');
      el.removeAttribute('fill-opacity');
      el.removeAttribute('stroke-opacity');
      el.removeAttribute('class');
      el.removeAttribute('style');
      continue;
    }

    // Geometry → fill=none, uniform black stroke 0.5pt
    if (GEOMETRY.has(tag)) {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', '#000000');
      el.setAttribute('stroke-width', '0.5');
      el.removeAttribute('filter');
      el.removeAttribute('opacity');
      el.removeAttribute('fill-opacity');
      el.removeAttribute('stroke-opacity');
      el.removeAttribute('stroke-dasharray');
      el.removeAttribute('class');
      el.removeAttribute('style');
    }
  }
}


// ---------------------------------------------------------------------------
// Shared SVG helpers
// ---------------------------------------------------------------------------

function serializeSvg(svgElement, width, height) {
  const exportSvg = makeExportSvg(svgElement, width, height);
  return new XMLSerializer().serializeToString(exportSvg);
}

function makeExportSvg(svgElement, width, height) {
  // Capture computed text styles from the live DOM before cloning
  const liveTextEls = svgElement.querySelectorAll('text, tspan');
  const computedStyles = [];
  for (const el of liveTextEls) {
    const cs = window.getComputedStyle(el);
    computedStyles.push({
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
    });
  }

  const exportSvg = svgElement.cloneNode(true);
  const { viewBox } = getSvgMetrics(svgElement);

  exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  exportSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  exportSvg.setAttribute('viewBox', viewBox);
  exportSvg.setAttribute('width', String(width ?? 900));
  exportSvg.setAttribute('height', String(height ?? 1200));
  exportSvg.removeAttribute('class');
  exportSvg.removeAttribute('style');

  // Inline computed font styles as SVG attributes for standalone rendering
  const clonedTextEls = exportSvg.querySelectorAll('text, tspan');
  for (let i = 0; i < clonedTextEls.length && i < computedStyles.length; i++) {
    const el = clonedTextEls[i];
    const s = computedStyles[i];
    el.setAttribute('font-family', s.fontFamily);
    el.setAttribute('font-size', s.fontSize);
    el.setAttribute('font-weight', s.fontWeight);
    if (s.fontStyle && s.fontStyle !== 'normal') {
      el.setAttribute('font-style', s.fontStyle);
    }
    if (s.letterSpacing && s.letterSpacing !== 'normal' && s.letterSpacing !== '0px') {
      el.setAttribute('letter-spacing', s.letterSpacing);
    }
    // Apply text-transform to content for standalone SVG viewers
    if (s.textTransform && s.textTransform !== 'none') {
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          if (s.textTransform === 'uppercase') {
            node.textContent = node.textContent.toUpperCase();
          } else if (s.textTransform === 'lowercase') {
            node.textContent = node.textContent.toLowerCase();
          } else if (s.textTransform === 'capitalize') {
            node.textContent = node.textContent.replace(/\b\w/g, (c) => c.toUpperCase());
          }
        }
      }
    }
  }

  return exportSvg;
}

function getCenteredPosterBox(svgElement, page) {
  const { width: svgWidth, height: svgHeight } = getSvgMetrics(svgElement);
  const margin = 18;
  const maxWidth = page.width - margin * 2;
  const maxHeight = page.height - margin * 2;
  const scale = Math.min(maxWidth / svgWidth, maxHeight / svgHeight);
  const width = svgWidth * scale;
  const height = svgHeight * scale;

  return {
    x: (page.width - width) / 2,
    y: (page.height - height) / 2,
    width,
    height,
  };
}

function getSvgMetrics(svgElement) {
  const viewBox = svgElement.getAttribute('viewBox') || '0 0 900 1200';
  const [, , width, height] = viewBox.split(/\s+/).map(Number);

  return {
    viewBox,
    width: Number.isFinite(width) ? width : 900,
    height: Number.isFinite(height) ? height : 1200,
  };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not create PNG export.'));
      }
    }, 'image/png');
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getBaseFileName(poster) {
  const title = poster.title || 'star-map-poster';

  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'star-map-poster'
  );
}
