import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, toDate } from './formatters';

// Usamos el símbolo de céntimo (¢) que sí está soportado por las fuentes por defecto de jsPDF
const safeCurrency = (value) => {
  return formatCurrency(value).replace('₡', '¢');
};

export function generarReciboPago(payment, clientName, loan, appName = 'PrestaFácil') {
  // A4 size for standard professional look and no cutoffs
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [79, 70, 229]; // Indigo
  const textDark = [15, 23, 42];
  const textMuted = [100, 116, 139];
  const borderLight = [226, 232, 240];

  // --- HEADER ---
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 35, pageWidth - 20, 35); // Top separator

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(appName, 20, 25);
  
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RECIBO DE PAGO', pageWidth - 20, 20, { align: 'right' });
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Nº ${payment.id.substring(0, 8).toUpperCase()}`, pageWidth - 20, 26, { align: 'right' });

  // --- DETAILS GRID ---
  doc.setFontSize(10);
  
  // Left Column (Client)
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('RECIBIMOS DE:', 20, 48);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(clientName || 'Cliente', 20, 55);
  
  // Right Column (Date)
  doc.setFontSize(10);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('FECHA DEL PAGO:', pageWidth - 20, 48, { align: 'right' });
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(toDate(payment.date)), pageWidth - 20, 54, { align: 'right' });

  // --- AMOUNT HIGHLIGHT ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(20, 70, pageWidth - 40, 35, 3, 3, 'FD');
  
  doc.setFontSize(11);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('CANTIDAD ABONADA:', 28, 82);
  
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(safeCurrency(payment.amount), 28, 95);

  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'italic');
  doc.text(payment.note ? `Concepto: ${payment.note}` : `Concepto: Abono a préstamo`, pageWidth - 28, 92, { align: 'right' });

  // --- LOAN SUMMARY TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Estado del Préstamo', 20, 125);

  autoTable(doc, {
    startY: 130,
    head: [['Detalle', 'Monto']],
    body: [
      ['Total del Préstamo', safeCurrency(loan.totalAmount)],
      ['Total Pagado (Incluyendo este abono)', safeCurrency(loan.totalPaid)],
      ['Nuevo Saldo Restante', safeCurrency(loan.remainingBalance)],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: textMuted,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      textColor: textDark,
      halign: 'left'
    },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10, cellPadding: 8 },
    alternateRowStyles: { fillColor: [255, 255, 255] }
  });

  // --- FOOTER ---
  const finalY = doc.lastAutoTable.finalY || 180;
  
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(20, finalY + 20, pageWidth - 20, finalY + 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Este documento es un comprobante digital generado automáticamente.', 20, finalY + 30);
  doc.text('¡Gracias por tu pago puntual!', 20, finalY + 35);
  
  doc.setFont('helvetica', 'bold');
  doc.text(appName, pageWidth - 20, finalY + 30, { align: 'right' });

  // Download
  const cleanName = (clientName || 'Cliente').replace(/\s+/g, '_');
  const cleanDate = formatDate(toDate(payment.date)).replace(/\s+/g, '_');
  const filename = `Recibo_${cleanName}_${cleanDate}.pdf`;
  doc.save(filename);
}
