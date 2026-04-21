import PDFDocument from 'pdfkit';
import { query, sql } from '../config/db.js';
import { httpError } from '../utils/helpers.js';

// GET /api/invoices/:id/pdf
const generateInvoicePDF = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Fetch invoice with all related data
    const [invResult, paymentsResult] = await Promise.all([
      query(
        `SELECT i.*,
                b.bookingDate, b.tripStart, b.tripEnd, b.basePrice,
                b.taxRate, b.numberOfTravellers, b.description AS bookingDescription,
                c.firstName AS customerFirstName, c.lastName AS customerLastName,
                c.email AS customerEmail, c.homePhone, c.address,
                c.city AS customerCity, c.province AS customerProvince,
                c.postalCode, c.country,
                p.productName,
                d.destinationName,
                e.firstName AS agentFirstName, e.lastName AS agentLastName,
                e.agentCode, e.email AS agentEmail
         FROM   invoices  i
         JOIN   bookings  b ON b.bookingID  = i.bookingID
         JOIN   customers c ON c.customerID = b.customerID
         JOIN   products  p ON p.productID  = b.productID
         JOIN   employees e ON e.employeeID = b.employeeID
         LEFT   JOIN destinations d ON d.destinationID = b.destinationID
         WHERE  i.invoiceID = @id`,
        { id: { type: sql.Int, value: id } }
      ),
      query(
        `SELECT paymentID, amountPaid, paymentMethod, paymentDate,
                paymentType, status, reference
         FROM   payments WHERE invoiceID = @id AND status = 'completed'
         ORDER  BY paymentDate`,
        { id: { type: sql.Int, value: id } }
      ),
    ]);

    if (!invResult.recordset[0]) throw httpError(404, 'Invoice not found.');
    const inv = invResult.recordset[0];
    const payments = paymentsResult.recordset;

    const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amountPaid || 0), 0);
    const balance   = parseFloat(inv.totalAmount || 0) - totalPaid;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'Letter',
      margin: 50,
      bottomMargin: 80,
      info: {
        Title: `Invoice #${inv.invoiceID} — KUKAT Travel`,
        Author: 'KUKAT Travel Agency',
        Subject: `Invoice for ${inv.customerFirstName} ${inv.customerLastName}`,
      },
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KUKAT-Invoice-${inv.invoiceID}.pdf"`);
    doc.pipe(res);

    // ── Color palette ─────────────────────────────────────
    const NAVY  = '#0B2B40';
    const TEAL  = '#0D9488';
    const AMBER = '#F59E0B';
    const GRAY  = '#64748B';
    const LIGHT = '#F8FAFC';
    const BORDER = '#E2E8F0';

    const fmt = (n) => n != null
      ? `$${parseFloat(n).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`
      : '—';

    const fmtDate = (d) => d
      ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    const pageW = doc.page.width - 100; // usable width

    // ── Header bar ────────────────────────────────────────
    doc.rect(50, 45, pageW, 70).fill(NAVY);

    // Company name
    doc.fontSize(22).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text('KUKAT', 70, 60);
    doc.fontSize(9).fillColor('#0D9488').font('Helvetica')
       .text('TRAVEL AGENCY', 70, 85);

    // Invoice title on right
    doc.fontSize(20).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text('INVOICE', 0, 60, { align: 'right' });
    doc.fontSize(9).fillColor(AMBER).font('Helvetica')
       .text(`#${String(inv.invoiceID).padStart(5, '0')}`, 0, 85, { align: 'right' });

    doc.moveDown(4);

    // ── Status badge ──────────────────────────────────────
    const statusColors = {
      paid:     { bg: '#DCFCE7', text: '#15803D' },
      unpaid:   { bg: '#FEE2E2', text: '#DC2626' },
      partial:  { bg: '#FEF9C3', text: '#854D0E' },
      refunded: { bg: '#F3F4F6', text: '#374151' },
    };
    const sc = statusColors[inv.status] || statusColors.unpaid;
    doc.rect(50, 130, 70, 20).fill(sc.bg);
    doc.fontSize(9).fillColor(sc.text).font('Helvetica-Bold')
       .text(inv.status.toUpperCase(), 50, 136, { width: 70, align: 'center' });

    // ── Invoice meta ──────────────────────────────────────
    doc.fontSize(8).fillColor(GRAY).font('Helvetica')
       .text(`Invoice date: ${fmtDate(inv.invoiceDate)}`, 0, 130, { align: 'right' })
       .text(`Due date: ${fmtDate(inv.dueDate)}`, 0, 143, { align: 'right' });

    doc.moveDown(2);

    // ── Bill to / Agent columns ───────────────────────────
    const colY = 165;
    const col2X = 300;

    doc.fontSize(8).fillColor(TEAL).font('Helvetica-Bold').text('BILL TO', 50, colY);
    doc.moveTo(50, colY + 12).lineTo(200, colY + 12).stroke(TEAL);

    doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold')
       .text(`${inv.customerFirstName} ${inv.customerLastName}`, 50, colY + 18);
    doc.fontSize(8).fillColor(GRAY).font('Helvetica')
       .text(inv.customerEmail || '', 50, colY + 32)
       .text(inv.homePhone || '', 50, colY + 44)
       .text([inv.address, inv.customerCity, inv.customerProvince].filter(Boolean).join(', '), 50, colY + 56)
       .text([inv.postalCode, inv.country].filter(Boolean).join('  '), 50, colY + 68);

    doc.fontSize(8).fillColor(TEAL).font('Helvetica-Bold').text('TRAVEL AGENT', col2X, colY);
    doc.moveTo(col2X, colY + 12).lineTo(col2X + 150, colY + 12).stroke(TEAL);

    doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold')
       .text(`${inv.agentFirstName} ${inv.agentLastName}`, col2X, colY + 18);
    doc.fontSize(8).fillColor(GRAY).font('Helvetica')
       .text(`Code: ${inv.agentCode || '—'}`, col2X, colY + 32)
       .text(inv.agentEmail || '', col2X, colY + 44);

    // ── Booking details card ──────────────────────────────
    const bookY = 260;
    doc.rect(50, bookY, pageW, 14).fill(NAVY);
    doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text('BOOKING DETAILS', 58, bookY + 3);

    const bookDetails = [
      ['Product',      inv.productName || '—'],
      ['Destination',  inv.destinationName || '—'],
      ['Booking date', fmtDate(inv.bookingDate)],
      ['Trip start',   fmtDate(inv.tripStart)],
      ['Trip end',     fmtDate(inv.tripEnd)],
      ['Travellers',   String(inv.numberOfTravellers || 1)],
      ['Booking ref',  `#${inv.bookingID}`],
    ];

    let detailY = bookY + 18;
    bookDetails.forEach(([label, value], i) => {
      if (i % 2 === 0) doc.rect(50, detailY, pageW, 16).fill(LIGHT);
      doc.fontSize(8).fillColor(GRAY).font('Helvetica')
         .text(label, 58, detailY + 4, { width: 120 });
      doc.fontSize(8).fillColor(NAVY).font('Helvetica-Bold')
         .text(value, 180, detailY + 4, { width: pageW - 130 });
      detailY += 16;
    });

    if (inv.bookingDescription) {
      doc.rect(50, detailY, pageW, 16).fill(LIGHT);
      doc.fontSize(8).fillColor(GRAY).font('Helvetica')
         .text('Notes', 58, detailY + 4, { width: 120 });
      doc.fontSize(8).fillColor(NAVY).font('Helvetica')
         .text(inv.bookingDescription, 180, detailY + 4, { width: pageW - 130 });
      detailY += 16;
    }

    // ── Charges table ─────────────────────────────────────
    const chargeY = detailY + 20;
    doc.rect(50, chargeY, pageW, 14).fill(NAVY);
    doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text('CHARGES', 58, chargeY + 3);

    const charges = [
      ['Base price', `1 × ${inv.productName}`, fmt(inv.subtotal)],
      ['Tax', `${parseFloat(inv.basePrice || 0) > 0 ? parseFloat(inv.taxRate || 5).toFixed(1) : 0}%`, fmt(inv.taxAmount)],
    ];
    if (parseFloat(inv.feeAmount || 0) > 0) {
      charges.push(['Booking fee', '', fmt(inv.feeAmount)]);
    }

    // Header row
    let chargeRowY = chargeY + 18;
    doc.rect(50, chargeRowY, pageW, 14).fill(BORDER);
    doc.fontSize(8).fillColor(NAVY).font('Helvetica-Bold')
       .text('DESCRIPTION', 58, chargeRowY + 3)
       .text('DETAIL', 250, chargeRowY + 3)
       .text('AMOUNT', 0, chargeRowY + 3, { align: 'right' });
    chargeRowY += 14;

    charges.forEach(([desc, detail, amount], i) => {
      if (i % 2 === 0) doc.rect(50, chargeRowY, pageW, 16).fill(LIGHT);
      doc.fontSize(8).fillColor(GRAY).font('Helvetica')
         .text(desc, 58, chargeRowY + 4)
         .text(detail, 250, chargeRowY + 4);
      doc.fontSize(8).fillColor(NAVY).font('Helvetica-Bold')
         .text(amount, 0, chargeRowY + 4, { align: 'right' });
      chargeRowY += 16;
    });

    // Totals
    chargeRowY += 8;
    doc.moveTo(350, chargeRowY).lineTo(50 + pageW, chargeRowY).stroke(BORDER);
    chargeRowY += 8;

    const totals = [
      ['Subtotal',  fmt(inv.subtotal), GRAY, 'Helvetica'],
      ['Tax',       fmt(inv.taxAmount), GRAY, 'Helvetica'],
    ];
    if (parseFloat(inv.feeAmount || 0) > 0) {
      totals.push(['Fees', fmt(inv.feeAmount), GRAY, 'Helvetica']);
    }
    totals.push(['TOTAL', fmt(inv.totalAmount), NAVY, 'Helvetica-Bold']);
    totals.push(['Paid', fmt(totalPaid), '#15803D', 'Helvetica-Bold']);
    if (balance > 0) {
      totals.push(['Balance due', fmt(balance), '#DC2626', 'Helvetica-Bold']);
    }

    totals.forEach(([label, amount, color, font]) => {
      doc.fontSize(9).fillColor(color).font(font)
         .text(label, 350, chargeRowY, { width: 100 })
         .text(amount, 0, chargeRowY, { align: 'right' });
      chargeRowY += 16;
    });

    // ── Payments table ────────────────────────────────────
    if (payments.length > 0) {
      const payY = chargeRowY + 20;
      doc.rect(50, payY, pageW, 14).fill(TEAL);
      doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold')
         .text('PAYMENT HISTORY', 58, payY + 3);

      let payRowY = payY + 18;
      doc.rect(50, payRowY, pageW, 14).fill(BORDER);
      doc.fontSize(8).fillColor(NAVY).font('Helvetica-Bold')
         .text('DATE', 58, payRowY + 3)
         .text('METHOD', 180, payRowY + 3)
         .text('TYPE', 280, payRowY + 3)
         .text('REFERENCE', 360, payRowY + 3)
         .text('AMOUNT', 0, payRowY + 3, { align: 'right' });
      payRowY += 14;

      payments.forEach((p, i) => {
        if (i % 2 === 0) doc.rect(50, payRowY, pageW, 16).fill(LIGHT);
        doc.fontSize(8).fillColor(GRAY).font('Helvetica')
           .text(fmtDate(p.paymentDate), 58, payRowY + 4)
           .text(p.paymentMethod, 180, payRowY + 4)
           .text(p.paymentType || '—', 280, payRowY + 4)
           .text(p.reference || '—', 360, payRowY + 4);
        doc.fontSize(8).fillColor('#15803D').font('Helvetica-Bold')
           .text(fmt(p.amountPaid), 0, payRowY + 4, { align: 'right' });
        payRowY += 16;
      });
    }

    // ── Footer ────────────────────────────────────────────
    // Use current Y position instead of fixed footer position
    const footY = Math.max(chargeRowY + 20, payments.length > 0 ? chargeRowY + 20 : chargeRowY + 20);

    // Only add footer if it fits on current page — no forced page breaks
    if (footY + 60 < doc.page.height - 30) {
    doc.rect(50, footY, pageW, 1).fill(BORDER);
    doc.fontSize(8).fillColor(GRAY).font('Helvetica')
        .text('Thank you for choosing KUKAT Travel Agency.', 50, footY + 10, { align: 'center', width: pageW })
        .text('For questions about this invoice, contact your travel agent.', 50, footY + 22, { align: 'center', width: pageW });
    doc.fontSize(7).fillColor(GRAY)
        .text(`Generated ${new Date().toLocaleDateString('en-CA')} · KUKAT Travel Agency · Invoice #${inv.invoiceID}`,
            50, footY + 40, { align: 'center', width: pageW });
    }

    doc.end();

  } catch (err) { next(err); }
};

export { generateInvoicePDF };