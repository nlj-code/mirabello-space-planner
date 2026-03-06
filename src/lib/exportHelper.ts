import Konva from 'konva';
import jsPDF from 'jspdf';

export interface ExportRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExportOptions {
  projectName: string;
  designerName: string;
  scaleLabel: string;
  region?: ExportRegion;
}

/** Composite a Konva dataURL onto a white background canvas, returning a new dataURL. */
async function withWhiteBackground(dataUrl: string, width: number, height: number, pixelRatio: number): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const img = new Image();
  await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = dataUrl; });
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function exportToPng(stage: Konva.Stage, _opts: ExportOptions): Promise<void> {
  // Reset stage transform so content coordinates match pixel coordinates for toDataURL.
  // (The export region is stored in content space from getRelativePointerPosition,
  //  but toDataURL clips in stage pixel space — resetting the transform reconciles them.)
  const oldPos = { x: stage.x(), y: stage.y() };
  const oldScale = { x: stage.scaleX(), y: stage.scaleY() };
  stage.position({ x: 0, y: 0 });
  stage.scale({ x: 1, y: 1 });

  // Hide transformer handles so they don't appear in the export
  const transformers = stage.find('Transformer');
  transformers.forEach(t => t.visible(false));

  const pixelRatio = 2;
  const toDataUrlOpts: any = { pixelRatio };
  const imgW = _opts.region ? _opts.region.width : stage.width();
  const imgH = _opts.region ? _opts.region.height : stage.height();
  if (_opts.region) {
    toDataUrlOpts.x = _opts.region.x;
    toDataUrlOpts.y = _opts.region.y;
    toDataUrlOpts.width = _opts.region.width;
    toDataUrlOpts.height = _opts.region.height;
  }
  const rawDataUrl = stage.toDataURL(toDataUrlOpts);

  // Restore stage transform and overlays
  stage.position(oldPos);
  stage.scale(oldScale);
  transformers.forEach(t => t.visible(true));

  // Composite onto white so transparent canvas areas don't appear as dark frames
  const dataUrl = await withWhiteBackground(rawDataUrl, imgW, imgH, pixelRatio);

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${(_opts.projectName || 'floorplan').replace(/\s+/g, '_')}.png`;
  a.click();
}

export async function exportToPdf(stage: Konva.Stage, opts: ExportOptions): Promise<void> {
  // Reset stage transform so content coordinates match pixel coordinates for toDataURL.
  const oldPos = { x: stage.x(), y: stage.y() };
  const oldScale = { x: stage.scaleX(), y: stage.scaleY() };
  stage.position({ x: 0, y: 0 });
  stage.scale({ x: 1, y: 1 });

  // Hide transformer handles so they don't appear in the export
  const transformers = stage.find('Transformer');
  transformers.forEach(t => t.visible(false));

  const toDataUrlOpts: any = { pixelRatio: 2 };
  if (opts.region) {
    toDataUrlOpts.x = opts.region.x;
    toDataUrlOpts.y = opts.region.y;
    toDataUrlOpts.width = opts.region.width;
    toDataUrlOpts.height = opts.region.height;
  }
  const dataUrl = stage.toDataURL(toDataUrlOpts);
  const stageW = opts.region ? opts.region.width : stage.width();
  const stageH = opts.region ? opts.region.height : stage.height();

  // Restore stage transform and overlays
  stage.position(oldPos);
  stage.scale(oldScale);
  transformers.forEach(t => t.visible(true));

  // A3 landscape: 420 x 297 mm
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const pdfW = 420;
  const pdfH = 297;

  // Header area
  const headerH = 20;
  const contentY = headerH + 5;
  const contentH = pdfH - headerH - 15;
  const contentW = pdfW - 20;

  // Dark background
  pdf.setFillColor(26, 26, 46);
  pdf.rect(0, 0, pdfW, pdfH, 'F');

  // Header bar
  pdf.setFillColor(22, 33, 62);
  pdf.rect(0, 0, pdfW, headerH, 'F');

  // Logo placeholder
  pdf.setFillColor(232, 184, 109);
  pdf.rect(8, 4, 30, 12, 'F');
  pdf.setTextColor(26, 26, 46);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MIRABELLO', 9, 11);
  pdf.setFontSize(5);
  pdf.text('SPACE PLANNER', 9, 15);

  // Project info
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(opts.projectName || 'Untitled Project', 50, 9);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(160, 174, 192);
  pdf.text(`Designer: ${opts.designerName || '—'}`, 50, 14);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 50, 18);
  pdf.text(`Scale: ${opts.scaleLabel}`, 120, 14);

  // North arrow placeholder
  const northX = pdfW - 25;
  const northY = 10;
  pdf.setDrawColor(232, 184, 109);
  pdf.setLineWidth(0.5);
  pdf.line(northX, northY + 6, northX, northY);
  pdf.triangle(northX - 2, northY + 2, northX + 2, northY + 2, northX, northY - 2, 'S');
  pdf.setTextColor(232, 184, 109);
  pdf.setFontSize(7);
  pdf.text('N', northX - 1, northY - 3);

  // Floor plan image — centered horizontally and vertically in the content area
  const imgRatio = stageW / stageH;
  let drawW = contentW;
  let drawH = drawW / imgRatio;
  if (drawH > contentH) {
    drawH = contentH;
    drawW = drawH * imgRatio;
  }
  const drawX = 10 + (contentW - drawW) / 2;
  const drawY = contentY + (contentH - drawH) / 2;
  // White background so transparent canvas areas don't show the dark PDF background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(drawX, drawY, drawW, drawH, 'F');
  pdf.addImage(dataUrl, 'PNG', drawX, drawY, drawW, drawH);

  // Scale bar
  const barY = pdfH - 10;
  pdf.setDrawColor(232, 184, 109);
  pdf.setLineWidth(0.3);
  pdf.line(10, barY, 60, barY);
  pdf.line(10, barY - 2, 10, barY + 2);
  pdf.line(60, barY - 2, 60, barY + 2);
  pdf.setTextColor(160, 174, 192);
  pdf.setFontSize(7);
  pdf.text(opts.scaleLabel, 10, barY + 5);

  pdf.save(`${(opts.projectName || 'floorplan').replace(/\s+/g, '_')}.pdf`);
}
