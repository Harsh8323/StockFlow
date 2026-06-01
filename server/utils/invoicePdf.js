const PDFDocument = require('pdfkit');

// StockFlow brand — orange accent (matches client tailwind brand-500)
const BRAND = '#f97316';
const BRAND_LIGHT = '#ffedd5';
const TEXT = '#1c1917';
const MUTED = '#78716c';
const BORDER = '#e7e5e4';
const ACCENT_BG = '#fff7ed';

const MARGIN_X = 48;
const MARGIN_TOP = 40;
const MARGIN_BOTTOM = 44;
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - 2 * MARGIN_X;

const formatAmount = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const ellipsize = (doc, text, width) => {
  const ELLIPSIS = '…';
  if (!text) return '';
  if (doc.widthOfString(text) <= width) return text;
  let s = text;
  while (s.length > 0 && doc.widthOfString(s + ELLIPSIS) > width) {
    s = s.slice(0, -1);
  }
  return s + ELLIPSIS;
};

/**
 * Build the PDF for a single order and stream it into `res`.
 */
function generateInvoicePdf({ order, organization }, res) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
    bufferPages: false,
    info: {
      Title: `Invoice ${order.invoiceNumber}`,
      Author: organization?.name || 'StockFlow',
      Subject: `Invoice for ${order.customerSnapshot?.name || 'Customer'}`,
    },
  });

  doc.pipe(res);

  let y = MARGIN_TOP;
  y = drawHeader(doc, order, organization, y);
  y = drawPartyBlocks(doc, order, organization, y);
  y = drawItemsTable(doc, order, y);
  y = drawTotals(doc, order, y);
  drawFooter(doc, order, y);

  doc.end();
  return doc;
}

function drawHeader(doc, order, organization, startY) {
  const orgName = organization?.name || 'StockFlow';
  const rightW = 200;
  const rightX = PAGE_W - MARGIN_X - rightW;

  doc.rect(MARGIN_X, startY, 5, 34).fill(BRAND);
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(20).text(orgName, MARGIN_X + 14, startY + 2);
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text(organization?.tagline || 'Order & Inventory Management', MARGIN_X + 14, startY + 26);

  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(22).text('INVOICE', rightX, startY + 2, {
    width: rightW,
    align: 'right',
  });
  doc.font('Helvetica').fillColor(MUTED).fontSize(9);
  doc.text(`Invoice #: ${order.invoiceNumber}`, rightX, startY + 30, { width: rightW, align: 'right' });
  doc.text(`Date: ${formatDate(order.createdAt)}`, rightX, startY + 42, { width: rightW, align: 'right' });

  const lineY = startY + 62;
  doc.moveTo(MARGIN_X, lineY).lineTo(PAGE_W - MARGIN_X, lineY).strokeColor(BORDER).lineWidth(1).stroke();
  return lineY + 16;
}

function drawPartyBlocks(doc, order, organization, startY) {
  const colW = (CONTENT_W - 24) / 2;
  const c = order.customerSnapshot || {};
  const billX = MARGIN_X + colW + 24;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text('FROM', MARGIN_X, startY);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(TEXT).text(organization?.name || 'StockFlow', MARGIN_X, startY + 12);
  doc.font('Helvetica').fontSize(9).fillColor(MUTED);
  let fromY = startY + 26;
  if (organization?.email) {
    doc.text(organization.email, MARGIN_X, fromY, { width: colW });
    fromY = doc.y;
  }
  if (organization?.phone) {
    doc.text(organization.phone, MARGIN_X, fromY, { width: colW });
    fromY = doc.y;
  }
  if (organization?.address) {
    doc.text(organization.address, MARGIN_X, fromY, { width: colW });
    fromY = doc.y;
  }

  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text('BILL TO', billX, startY);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(TEXT).text(c.name || 'Walk-in customer', billX, startY + 12);
  doc.font('Helvetica').fontSize(9).fillColor(MUTED);
  let billY = startY + 26;
  if (c.email) {
    doc.text(c.email, billX, billY, { width: colW });
    billY = doc.y;
  }
  if (c.phone) {
    doc.text(c.phone, billX, billY, { width: colW });
    billY = doc.y;
  }
  if (c.address) {
    doc.text(c.address, billX, billY, { width: colW });
    billY = doc.y;
  }

  return Math.max(fromY, billY, startY + 50) + 12;
}

function drawItemsTable(doc, order, startY) {
  const tableX = MARGIN_X;
  const tableW = CONTENT_W;
  const rowH = 22;
  const headerH = 22;

  // Column layout — wider numeric columns to prevent wrapping
  const cols = [
    { key: 'desc',  label: 'DESCRIPTION', x: tableX + 6,           w: tableW * 0.40, align: 'left'  },
    { key: 'sku',   label: 'SKU',         x: tableX + tableW * 0.40, w: tableW * 0.14, align: 'left'  },
    { key: 'qty',   label: 'QTY',         x: tableX + tableW * 0.54, w: tableW * 0.08, align: 'right' },
    { key: 'price', label: 'RATE (INR)',  x: tableX + tableW * 0.62, w: tableW * 0.18, align: 'right' },
    { key: 'total', label: 'AMOUNT (INR)', x: tableX + tableW * 0.80, w: tableW * 0.20 - 6, align: 'right' },
  ];

  let y = startY;

  doc.rect(tableX, y, tableW, headerH).fill(ACCENT_BG);
  doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(8);
  for (const col of cols) {
    doc.text(col.label, col.x, y + 7, { width: col.w, align: col.align });
  }
  y += headerH;

  const items = order.items || [];
  const maxRows = Math.min(items.length, 12);

  for (let i = 0; i < maxRows; i += 1) {
    const it = items[i];
    const rowY = y + 4;

    doc.font('Helvetica-Bold').fillColor(TEXT).fontSize(9)
      .text(ellipsize(doc, it.productName, cols[0].w - 4), cols[0].x, rowY, { width: cols[0].w - 4, lineBreak: false });
    doc.font('Helvetica').fillColor(MUTED).fontSize(8)
      .text(it.sku || '—', cols[1].x, rowY + 1, { width: cols[1].w, align: cols[1].align, lineBreak: false });
    doc.fillColor(TEXT).fontSize(9)
      .text(String(it.quantity), cols[2].x, rowY, { width: cols[2].w, align: cols[2].align, lineBreak: false });
    doc.font('Helvetica').fontSize(9)
      .text(formatAmount(it.unitPrice), cols[3].x, rowY, { width: cols[3].w, align: cols[3].align, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(9)
      .text(formatAmount(it.lineTotal), cols[4].x, rowY, { width: cols[4].w, align: cols[4].align, lineBreak: false });

    y += rowH;
    doc.moveTo(tableX, y).lineTo(tableX + tableW, y).strokeColor(BORDER).lineWidth(0.5).stroke();
  }

  if (items.length > maxRows) {
    y += 4;
    doc.font('Helvetica').fillColor(MUTED).fontSize(8)
      .text(`+ ${items.length - maxRows} more item(s) not shown`, tableX + 6, y + 2);
    y += 14;
  }

  return y + 10;
}

function drawTotals(doc, order, startY) {
  const boxW = 230;
  const boxX = PAGE_W - MARGIN_X - boxW;
  let y = startY;

  const row = (label, value, opts = {}) => {
    const h = opts.strong ? 20 : 16;
    doc.font(opts.strong ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(opts.muted ? MUTED : TEXT)
      .fontSize(opts.strong ? 11 : 9)
      .text(label, boxX, y, { width: boxW * 0.52, align: 'left', lineBreak: false });
    doc.text(value, boxX + boxW * 0.52, y, { width: boxW * 0.48, align: 'right', lineBreak: false });
    y += h;
  };

  row('Subtotal', formatAmount(order.subtotal), { muted: true });
  if (order.discount && order.discount > 0) {
    row('Discount', `- ${formatAmount(order.discount)}`, { muted: true });
  }
  row(`GST (${order.gstRate || 0}%)`, formatAmount(order.gstAmount), { muted: true });

  doc.moveTo(boxX, y).lineTo(boxX + boxW, y).strokeColor(BORDER).lineWidth(0.8).stroke();
  y += 8;

  row('Total (INR)', formatAmount(order.totalAmount), { strong: true });

  doc.moveTo(boxX, y).lineTo(boxX + boxW, y).strokeColor(BORDER).lineWidth(0.5).stroke();
  y += 8;

  row('Paid', formatAmount(order.amountPaid || 0), { muted: true });
  const balance = Math.max((order.totalAmount || 0) - (order.amountPaid || 0), 0);
  row('Balance due', formatAmount(balance), { strong: balance > 0 });

  const statusColors = {
    paid: { bg: '#dcfce7', fg: '#166534' },
    partial: { bg: BRAND_LIGHT, fg: '#9a3412' },
    unpaid: { bg: '#fee2e2', fg: '#991b1b' },
  };
  const sc = statusColors[order.paymentStatus] || { bg: ACCENT_BG, fg: TEXT };
  doc.rect(boxX, y, boxW, 20).fill(sc.bg);
  doc.fillColor(sc.fg).font('Helvetica-Bold').fontSize(9)
    .text((order.paymentStatus || 'unpaid').toUpperCase(), boxX, y + 5, { width: boxW, align: 'center' });

  return y + 28;
}

function drawFooter(doc, order, startY) {
  let y = startY + 8;

  if (order.notes) {
    doc.font('Helvetica-Bold').fillColor(MUTED).fontSize(8).text('NOTES', MARGIN_X, y);
    doc.font('Helvetica').fillColor(TEXT).fontSize(9)
      .text(order.notes, MARGIN_X, y + 12, { width: CONTENT_W, lineGap: 2 });
    y = doc.y + 8;
  }

  const footerY = Math.min(y + 6, PAGE_H - MARGIN_BOTTOM - 28);
  doc.moveTo(MARGIN_X, footerY).lineTo(PAGE_W - MARGIN_X, footerY).strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.font('Helvetica').fillColor(MUTED).fontSize(8)
    .text(
      'Thank you for your business. This is a system-generated invoice.',
      MARGIN_X,
      footerY + 8,
      { width: CONTENT_W, align: 'center', lineGap: 1 }
    );
}

module.exports = { generateInvoicePdf };
