import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Render a DOM element to PDF and trigger download.
 * The element should be visible (even if off-screen) for accurate rendering.
 */
export async function exportPdfFromElement(elementId: string, filename: string) {
  const node = document.getElementById(elementId);
  if (!node) {
    throw new Error(`Element #${elementId} not found for PDF export`);
  }

  // Give the browser a moment to paint hidden/off-screen content
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

  // html2canvas options - scale improves PDF quality
  const canvas = await html2canvas(node, {
    scale: 2, // Higher scale = better quality
    useCORS: true,
    backgroundColor: '#ffffff',
  } as any); // Type assertion needed due to outdated @types/html2canvas

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  // Single-page export: fit all content width-wise, let height extend naturally
  // PDF viewers will allow scrolling for long content
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

  pdf.save(filename);
}
