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

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let position = 0;
  let remainingHeight = imgHeight;

  while (remainingHeight > 0) {
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    remainingHeight -= pageHeight;
    if (remainingHeight > 0) {
      pdf.addPage();
      position = 0;
    }
  }

  pdf.save(filename);
}
