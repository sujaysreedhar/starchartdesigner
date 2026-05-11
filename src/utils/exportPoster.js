import { getPosterHeight } from '../data/posterOptions.js';
import { outlineAllText } from './textToPath.js';

const PDF_SIZES = {
  '12 x 18 in': { label: '12x18', width: 864, height: 1296 },
  '18 x 24 in': { label: '18x24', width: 1296, height: 1728 },
  '24 x 36 in': { label: '24x36', width: 1728, height: 2592 },
  'A2 poster': { label: 'A2', width: 1190.55, height: 1683.78 },
};

// ---------------------------------------------------------------------------
// Standard exports
// ---------------------------------------------------------------------------

export async function downloadSvg(svgElement, poster) {
  const svgMarkup = await serializeSvg(svgElement);
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${getBaseFileName(poster)}.svg`);
}

export async function downloadPng(svgElement, poster) {
  const exportWidth = 5400;
  const exportHeight = getPosterHeight(poster.posterSize) * 6;
  
  const svgMarkup = await serializeSvg(svgElement, exportWidth, exportHeight);
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
  const exportSvg = await makeExportSvg(svgElement);
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
// Direct Light SVG export
// ---------------------------------------------------------------------------

/**
 * Exports a clean, single-stroke SVG for direct light engraving:
 *  - All fills removed (set to "none") except text elements
 *  - All gradient and filter <defs> stripped
 *  - All strokes normalised to #000000 at a uniform 0.5px width
 *  - Opacity attributes removed
 *  - Text preserved with black fill
 *  - White background added
 *  - NO double-line offset (unlike laser cut)
 */
export async function downloadDirectLightSvg(svgElement, poster) {
  const lightSvg = await buildDirectLightSvg(svgElement, poster);
  const markup = new XMLSerializer().serializeToString(lightSvg);
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${getBaseFileName(poster)}-direct-light.svg`);
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
export async function downloadLaserCutSvg(svgElement, poster) {
  const laserSvg = await buildLaserCutSvg(svgElement, poster);
  const markup = new XMLSerializer().serializeToString(laserSvg);
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${getBaseFileName(poster)}-laser-cut.svg`);
}

async function buildDirectLightSvg(svgElement, poster) {
  // ── Step 0: Capture computed styles from the LIVE DOM ────────────────────
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
  let widthInMm = 457.2;
  let heightInMm = 609.6;
  if (poster.posterSize === '12 x 18 in') { widthInMm = 304.8; heightInMm = 457.2; }
  else if (poster.posterSize === '24 x 36 in') { widthInMm = 609.6; heightInMm = 914.4; }
  else if (poster.posterSize === 'A2 poster') { widthInMm = 420; heightInMm = 594; }

  clone.setAttribute('width', `${widthInMm}mm`);
  clone.setAttribute('height', `${heightInMm}mm`);
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

  // ── Step 4: Blank the <style> block ─────────────────────────────────────
  const styleEl = clone.querySelector('style');
  if (styleEl) {
    styleEl.textContent = '/* direct light — styles inlined */';
  }

  // ── Step 4.5: Remove helper elements marked as 'no-laser' ────────────────
  for (const el of clone.querySelectorAll('.no-laser')) {
    el.remove();
  }

  // ── Step 5: Apply laser-cut visual treatment (single-line, no offsets) ───
  applyLaserStyles(clone);

  // ── Step 6: White background rect ────────────────────────────────────────
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

  // ── Step 7: Outline text ─────────────────────────────────────────────────
  await outlineAllText(clone);

  // No double-line offset — direct light uses clean single strokes.

  return clone;
}

async function buildLaserCutSvg(svgElement, poster) {
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
  let widthInMm = 457.2; // default 18 inches
  let heightInMm = 609.6; // default 24 inches
  if (poster.posterSize === '12 x 18 in') { widthInMm = 304.8; heightInMm = 457.2; }
  else if (poster.posterSize === '24 x 36 in') { widthInMm = 609.6; heightInMm = 914.4; }
  else if (poster.posterSize === 'A2 poster') { widthInMm = 420; heightInMm = 594; }

  clone.setAttribute('width', `${widthInMm}mm`);
  clone.setAttribute('height', `${heightInMm}mm`);
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

  // ── Step 4.5: Remove helper elements marked as 'no-laser' ────────────────
  for (const el of clone.querySelectorAll('.no-laser')) {
    el.remove();
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

  // ── Step 7: Outline text (new requirement) ───────────────────────────────
  await outlineAllText(clone);

  // ── Step 8: Create proportionate double-line for engraving ───────────────
  // Calculate user-units per mm based on actual poster physical width.
  const unitsPerMm = 900 / widthInMm;
  const offset = 0.5 * unitsPerMm; 

  // We only offset vector lines (fill="none" and stroke="#000000").
  // This prevents duplicating/bloating filled text paths.
  const elsToDuplicate = Array.from(clone.querySelectorAll('path, line, circle, rect, polygon, polyline, ellipse'));
  
  // Build a lookup map of all stars (circles) to shorten constellation lines so they don't enter the stars
  const circlesMap = new Map();
  for (const c of clone.querySelectorAll('circle')) {
    const cx = parseFloat(c.getAttribute('cx') || '0').toFixed(2);
    const cy = parseFloat(c.getAttribute('cy') || '0').toFixed(2);
    const r = parseFloat(c.getAttribute('r') || '0');
    circlesMap.set(`${cx},${cy}`, r);
  }

  for (const el of elsToDuplicate) {
    if (el === bg) continue;
    
    // Only process pure vector strokes (no fills)
    if (el.getAttribute('fill') !== 'none' || el.getAttribute('stroke') !== '#000000') {
      continue;
    }
    
    const tag = el.tagName.toLowerCase();
    
    // Closed geometric shapes: keep original (inner) and add an outer shell
    if (tag === 'circle') {
      const dupe = el.cloneNode(true);
      const r = parseFloat(el.getAttribute('r') || '0');
      dupe.setAttribute('r', String(r + offset));
      el.parentNode.insertBefore(dupe, el.nextSibling);
    } else if (tag === 'ellipse') {
      const dupe = el.cloneNode(true);
      const rx = parseFloat(el.getAttribute('rx') || '0');
      const ry = parseFloat(el.getAttribute('ry') || '0');
      dupe.setAttribute('rx', String(rx + offset));
      dupe.setAttribute('ry', String(ry + offset));
      el.parentNode.insertBefore(dupe, el.nextSibling);
    } else if (tag === 'rect') {
      const dupe = el.cloneNode(true);
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      const w = parseFloat(el.getAttribute('width') || '0');
      const h = parseFloat(el.getAttribute('height') || '0');
      dupe.setAttribute('x', String(x - offset));
      dupe.setAttribute('y', String(y - offset));
      dupe.setAttribute('width', String(w + offset * 2));
      dupe.setAttribute('height', String(h + offset * 2));
      el.parentNode.insertBefore(dupe, el.nextSibling);
    } 
    // Open lines and paths: remove original (center) and add left/right symmetric lines
    else if (tag === 'line') {
      const x1 = parseFloat(el.getAttribute('x1') || '0');
      const y1 = parseFloat(el.getAttribute('y1') || '0');
      const x2 = parseFloat(el.getAttribute('x2') || '0');
      const y2 = parseFloat(el.getAttribute('y2') || '0');
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len > 0) {
        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;
        
        const gap = offset;
        const shiftX = nx * (gap / 2);
        const shiftY = ny * (gap / 2);

        // Shorten the line so it stops exactly at the outer circle of the star
        let d1 = 0;
        const r1 = circlesMap.get(`${x1.toFixed(2)},${y1.toFixed(2)}`);
        if (r1 !== undefined) {
          const R1 = r1 + gap; // outer radius
          if (R1 > gap / 2) d1 = Math.sqrt(R1 * R1 - (gap / 2) * (gap / 2));
        }

        let d2 = 0;
        const r2 = circlesMap.get(`${x2.toFixed(2)},${y2.toFixed(2)}`);
        if (r2 !== undefined) {
          const R2 = r2 + gap; // outer radius
          if (R2 > gap / 2) d2 = Math.sqrt(R2 * R2 - (gap / 2) * (gap / 2));
        }

        if (len > d1 + d2) {
          const left = el.cloneNode(true);
          left.setAttribute('x1', String(x1 + shiftX + ux * d1));
          left.setAttribute('y1', String(y1 + shiftY + uy * d1));
          left.setAttribute('x2', String(x2 + shiftX - ux * d2));
          left.setAttribute('y2', String(y2 + shiftY - uy * d2));
          el.parentNode.insertBefore(left, el.nextSibling);

          const right = el.cloneNode(true);
          right.setAttribute('x1', String(x1 - shiftX + ux * d1));
          right.setAttribute('y1', String(y1 - shiftY + uy * d1));
          right.setAttribute('x2', String(x2 - shiftX - ux * d2));
          right.setAttribute('y2', String(y2 - shiftY - uy * d2));
          el.parentNode.insertBefore(right, el.nextSibling);
        }
      }
      el.parentNode.removeChild(el); // Remove original center line
    } else if (tag === 'polygon' || tag === 'polyline' || tag === 'path') {
      let isSimplePolyline = false;
      let d = '';
      
      if (tag === 'path') {
        d = el.getAttribute('d') || '';
        if (/^[MLZ\d\s.,-]+$/i.test(d)) isSimplePolyline = true;
      } else {
        const points = (el.getAttribute('points') || '').trim();
        if (points) {
          isSimplePolyline = true;
          d = 'M ' + points.replace(/[,\s]+/g, ' ').trim().replace(/([0-9.-]+ [0-9.-]+) /g, '$1 L ');
          if (tag === 'polygon') d += ' Z';
        }
      }

      if (isSimplePolyline) {
        const pts = [];
        const cmdRegex = /([MLZ])([^MLZ]*)/gi;
        let match;
        while ((match = cmdRegex.exec(d)) !== null) {
          const cmd = match[1].toUpperCase();
          if (cmd === 'Z') pts.push({ cmd: 'Z' });
          else {
            const nums = match[2].trim().split(/[,\s]+/).filter(Boolean).map(parseFloat);
            if (nums.length >= 2) pts.push({ cmd, x: nums[0], y: nums[1] });
          }
        }

        if (pts.length > 1) {
          const leftPts = [];
          const rightPts = [];
          const gap = offset / 2;

          for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            if (p.cmd === 'Z') {
              leftPts.push(p);
              rightPts.push(p);
              continue;
            }

            let prev = null, next = null;
            for (let j = i - 1; j >= 0; j--) { if (pts[j].cmd !== 'Z') { prev = pts[j]; break; } }
            if (!prev && pts[pts.length - 1]?.cmd === 'Z') {
              for (let j = pts.length - 2; j >= 0; j--) { if (pts[j].cmd !== 'Z') { prev = pts[j]; break; } }
            }

            for (let j = i + 1; j < pts.length; j++) { if (pts[j].cmd !== 'Z') { next = pts[j]; break; } }
            if (!next && pts[i + 1]?.cmd === 'Z') {
              for (let j = 0; j < pts.length; j++) { if (pts[j].cmd === 'M') { next = pts[j]; break; } }
            }

            let nx = 0, ny = 0;
            if (prev && next) {
              const dx1 = p.x - prev.x, dy1 = p.y - prev.y;
              const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
              let nx1 = 0, ny1 = 0;
              if (len1 > 0) { nx1 = -dy1 / len1; ny1 = dx1 / len1; }

              const dx2 = next.x - p.x, dy2 = next.y - p.y;
              const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
              let nx2 = 0, ny2 = 0;
              if (len2 > 0) { nx2 = -dy2 / len2; ny2 = dx2 / len2; }

              nx = nx1 + nx2; ny = ny1 + ny2;
              const nlen = Math.sqrt(nx*nx + ny*ny);
              if (nlen > 0) { nx /= nlen; ny /= nlen; }
            } else if (prev) {
              const dx = p.x - prev.x, dy = p.y - prev.y;
              const len = Math.sqrt(dx*dx + dy*dy);
              if (len > 0) { nx = -dy / len; ny = dx / len; }
            } else if (next) {
              const dx = next.x - p.x, dy = next.y - p.y;
              const len = Math.sqrt(dx*dx + dy*dy);
              if (len > 0) { nx = -dy / len; ny = dx / len; }
            }

            leftPts.push({ cmd: p.cmd, x: p.x + nx * gap, y: p.y + ny * gap });
            rightPts.push({ cmd: p.cmd, x: p.x - nx * gap, y: p.y - ny * gap });
          }

          let dLeft = '', dRight = '';
          for (const p of leftPts) { dLeft += (p.cmd === 'Z') ? 'Z ' : `${p.cmd} ${p.x.toFixed(3)},${p.y.toFixed(3)} `; }
          for (const p of rightPts) { dRight += (p.cmd === 'Z') ? 'Z ' : `${p.cmd} ${p.x.toFixed(3)},${p.y.toFixed(3)} `; }

          const leftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const rightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          for (const attr of el.attributes) {
            if (attr.name !== 'points' && attr.name !== 'd') {
              leftPath.setAttribute(attr.name, attr.value);
              rightPath.setAttribute(attr.name, attr.value);
            }
          }
          leftPath.setAttribute('d', dLeft.trim());
          rightPath.setAttribute('d', dRight.trim());
          
          el.parentNode.insertBefore(leftPath, el.nextSibling);
          el.parentNode.insertBefore(rightPath, el.nextSibling);
          el.parentNode.removeChild(el);
          continue;
        }
      }

      // Fallback for complex paths with curves (C, Q, A)
      const dxy = (offset / 2) / Math.sqrt(2);
      const existing = el.getAttribute('transform') || '';
      
      const left = el.cloneNode(true);
      left.setAttribute('transform', `${existing} translate(${dxy.toFixed(4)}, ${dxy.toFixed(4)})`.trim());
      el.parentNode.insertBefore(left, el.nextSibling);

      const right = el.cloneNode(true);
      right.setAttribute('transform', `${existing} translate(${-dxy.toFixed(4)}, ${-dxy.toFixed(4)})`.trim());
      el.parentNode.insertBefore(right, el.nextSibling);
      
      el.parentNode.removeChild(el);
    }
  }

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

async function serializeSvg(svgElement, width, height) {
  const exportSvg = await makeExportSvg(svgElement, width, height);
  return new XMLSerializer().serializeToString(exportSvg);
}

async function makeExportSvg(svgElement, width, height) {
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

  // ── Step 3: Outline text (Convert <text> to <path>) ─────────────────────
  await outlineAllText(exportSvg);

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
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // Trigger download
  link.click();
  
  // Clean up with a delay to ensure the browser has initiated the download
  // with the correct filename and extension.
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 2000);
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
