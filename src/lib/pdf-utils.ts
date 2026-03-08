import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export { autoTable };

interface PdfHeaderOptions {
  title: string;
  subtitle: string;
  groupName?: string;
}

interface SummaryCard {
  label: string;
  value: string;
  color: [number, number, number];
}

export function createPdfDoc(): jsPDF {
  return new jsPDF();
}

export function drawHeader(doc: jsPDF, opts: PdfHeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(44, 62, 80);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.title, 14, 18);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(opts.subtitle, 14, 28);

  if (opts.groupName) {
    doc.setFontSize(10);
    doc.text(opts.groupName, 14, 35);
  }

  doc.setTextColor(0, 0, 0);
  return 50;
}

export function drawSummaryCards(doc: jsPDF, cards: SummaryCard[], startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const gap = 6;
  const cardWidth = (pageWidth - 28 - gap * (cards.length - 1)) / cards.length;

  cards.forEach((card, i) => {
    const x = 14 + i * (cardWidth + gap);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, startY, cardWidth, 24, 3, 3, 'F');
    doc.setFillColor(...card.color);
    doc.roundedRect(x, startY, 4, 24, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label.toUpperCase(), x + 10, startY + 9);
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 10, startY + 19);
  });

  return startY + 34;
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number, color: [number, number, number] = [44, 62, 80]): number {
  doc.setTextColor(...color);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);
  return y + 4;
}

export function drawFooter(doc: jsPDF, y: number, moduleName: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • ${moduleName} — Smart Money`,
    14, y
  );
}

export function getTableFinalY(doc: jsPDF): number {
  return (doc as any).lastAutoTable?.finalY ?? 60;
}

export function fmt(n: number): string {
  return `Rs. ${n.toFixed(2).replace(/\.00$/, '')}`;
}
