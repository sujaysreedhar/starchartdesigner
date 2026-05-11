import { useState } from 'react';
import { FileCode2, FileDown, FileImage, Printer, Scissors, Sun } from 'lucide-react';
import {
  downloadDirectLightSvg,
  downloadLaserCutSvg,
  downloadPng,
  downloadPrintPdf,
  downloadSvg,
} from '../utils/exportPoster.js';

export function ExportButtons({ poster, svgRef }) {
  const [exporting, setExporting] = useState(null);

  const runExport = async (type, action) => {
    if (!svgRef.current) {
      return;
    }

    setExporting(type);

    try {
      await action(svgRef.current);
    } catch (error) {
      window.alert('The export could not be created. Please try again.');
      console.error(error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="exportPanel">
      <div className="exportHeader">
        <FileDown size={18} />
        <span>Export poster</span>
      </div>

      {/* Standard raster / vector exports */}
      <div className="exportGrid">
        <button
          type="button"
          className="secondaryButton exportButton"
          disabled={Boolean(exporting)}
          onClick={() => runExport('png', (svg) => downloadPng(svg, poster))}
        >
          <FileImage size={17} />
          {exporting === 'png' ? 'Preparing…' : 'Download PNG'}
        </button>

        <button
          type="button"
          className="secondaryButton exportButton"
          disabled={Boolean(exporting)}
          onClick={() => runExport('svg', (svg) => downloadSvg(svg, poster))}
        >
          <FileCode2 size={17} />
          Download SVG
        </button>
      </div>

      {/* Print PDF */}
      <div className="pdfExportRow">
        <button
          type="button"
          className="primaryButton exportButton"
          disabled={Boolean(exporting)}
          onClick={() => runExport('pdf', (svg) => downloadPrintPdf(svg, poster))}
        >
          <Printer size={17} />
          {exporting === 'pdf' ? 'Preparing…' : 'Download print PDF'}
        </button>
      </div>

      {/* Laser cut SVG export */}
      <div className="laserCutRow">
        <button
          type="button"
          className="laserCutButton exportButton"
          disabled={Boolean(exporting)}
          onClick={() => runExport('laser', (svg) => downloadLaserCutSvg(svg, poster))}
          title="Exports a stroke-only SVG ready for a laser cutter or vinyl plotter"
        >
          <Scissors size={17} />
          {exporting === 'laser' ? 'Preparing…' : 'Download Laser Cut SVG'}
        </button>
        <p className="laserCutNote">
          Strokes only · no fills · 0.4 pt · ready for laser cutter or plotter
        </p>
      </div>

      {/* Direct Light SVG export */}
      <div className="directLightRow">
        <button
          type="button"
          className="directLightButton exportButton"
          disabled={Boolean(exporting)}
          onClick={() => runExport('direct-light', (svg) => downloadDirectLightSvg(svg, poster))}
          title="Exports a clean single-line SVG for direct light engraving"
        >
          <Sun size={17} />
          {exporting === 'direct-light' ? 'Preparing…' : 'Download Direct Light SVG'}
        </button>
        <p className="directLightNote">
          Single-line strokes · no fills · clean vectors · ready for light engraving
        </p>
      </div>
    </div>
  );
}
