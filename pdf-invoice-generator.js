/**
 * PDF Invoice Generator for PawnFlow Loans - Enhanced Table Format
 * Creates professional invoices with all loan details in proper tables
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generate a professional loan invoice PDF with table format
 * @param {Object} loan - Loan object from database
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateLoanPDF(loan) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Colors
      const darkBlue = '#2C3E50';
      const orange = '#F39C12';
      const green = '#27AE60';
      const lightGray = '#ECF0F1';
      const white = '#FFFFFF';
      const textColor = '#2C3E50';

      // ===== HEADER SECTION =====
      doc.fillColor(darkBlue)
        .rect(0, 0, doc.page.width, 100)
        .fill();

      // Company Name
      doc.fillColor(white)
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('PAWN FLOW', 50, 20);

      // Company Info
      doc.fontSize(10)
        .font('Helvetica')
        .text('Professional Pawn Shop Management', 50, 52);

      doc.fontSize(9)
        .text('Phone: (555) 123-4567 | Email: info@pawnflow.com', 50, 68);

      // Transaction Number (Orange box, top right)
      const transNum = loan.transaction_number || 'N/A';
      doc.fillColor(orange)
        .rect(450, 20, 120, 60)
        .fill();

      doc.fillColor(white)
        .fontSize(8)
        .text('TRANSACTION #', 460, 30, { width: 100, align: 'center' })
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(transNum, 460, 48, { width: 100, align: 'center' });

      let yPosition = 120;
      doc.fillColor(textColor).font('Helvetica');

      // ===== CUSTOMER & IDENTIFICATION DETAILS =====
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(darkBlue)
        .text('CUSTOMER & IDENTIFICATION DETAILS', 50, yPosition);

      yPosition += 25;

      const customerData = [
        { field: 'First Name', value: loan.first_name || '-' },
        { field: 'Last Name', value: loan.last_name || '-' },
        { field: 'Email', value: loan.email || '-' },
        { field: 'Mobile Phone', value: loan.mobile_phone || '-' },
        { field: 'Home Phone', value: loan.home_phone || '-' },
        { field: 'Birthdate', value: loan.birthdate ? new Date(loan.birthdate).toLocaleDateString() : '-' },
        { field: 'Street Address', value: loan.street_address || '-' },
        { field: 'City', value: loan.city || '-' },
        { field: 'State', value: loan.state || '-' },
        { field: 'Zipcode', value: loan.zipcode || '-' },
        { field: 'ID Type', value: loan.id_type || '-' },
        { field: 'ID Number', value: loan.id_number || '-' }
      ];

      drawTable(doc, yPosition, customerData, darkBlue, orange, green, lightGray);
      yPosition += (Math.ceil(customerData.length / 2) * 28) + 45;

      // ===== ITEM & COLLATERAL DETAILS =====
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(darkBlue)
        .text('ITEM & COLLATERAL DETAILS', 50, yPosition);

      yPosition += 25;

      const itemData = [
        { field: 'Item Category', value: loan.item_category || '-' },
        { field: 'Item Description', value: loan.item_description || '-' },
        { field: 'Collateral Description', value: loan.collateral_description || '-' },
        { field: 'Status', value: (loan.status || 'ACTIVE').toUpperCase() }
      ];

      drawTable(doc, yPosition, itemData, darkBlue, orange, green, lightGray);
      yPosition += (Math.ceil(itemData.length / 2) * 28) + 45;

      // ===== FINANCIAL DETAILS =====
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(darkBlue)
        .text('FINANCIAL DETAILS', 50, yPosition);

      yPosition += 25;

      const rowHeight = 28;
      const financialData = [
        { label: 'Loan Amount', value: `$${parseFloat(loan.loan_amount || 0).toFixed(2)}`, highlight: false },
        { label: 'Interest Rate', value: `${parseFloat(loan.interest_rate || 0).toFixed(2)}%`, highlight: false },
        { label: 'Interest Amount', value: `$${parseFloat(loan.interest_amount || 0).toFixed(2)}`, highlight: false },
        { label: 'Total Payable Amount', value: `$${parseFloat(loan.total_payable_amount || 0).toFixed(2)}`, highlight: true },
        { label: 'Remaining Balance', value: `$${parseFloat(loan.remaining_balance || loan.total_payable_amount || 0).toFixed(2)}`, highlight: true }
      ];

      // Header row
      doc.fillColor(darkBlue)
        .rect(40, yPosition - 5, doc.page.width - 80, rowHeight)
        .fill();

      doc.fillColor(white)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, yPosition + 5)
        .text('Amount', 400, yPosition + 5);

      yPosition += rowHeight + 5;

      financialData.forEach((item, idx) => {
        const rowY = yPosition + (idx * rowHeight);
        const isHighlight = item.highlight;

        doc.fillColor(isHighlight ? green : (idx % 2 === 0 ? lightGray : white))
          .rect(40, rowY - 5, doc.page.width - 80, rowHeight)
          .fill();

        doc.strokeColor(darkBlue)
          .lineWidth(0.5)
          .rect(40, rowY - 5, doc.page.width - 80, rowHeight)
          .stroke();

        doc.fillColor(isHighlight ? white : textColor)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(item.label, 50, rowY)
          .fillColor(isHighlight ? white : orange)
          .text(item.value, 400, rowY);
      });

      yPosition += (financialData.length * rowHeight) + 35;

      // ===== LOAN DATES =====
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(darkBlue)
        .text('LOAN DATES', 50, yPosition);

      yPosition += 25;

      const datesData = [
        { field: 'Loan Issued Date', value: loan.loan_issued_date ? new Date(loan.loan_issued_date).toLocaleDateString() : new Date().toLocaleDateString() },
        { field: 'Due Date', value: loan.due_date ? new Date(loan.due_date).toLocaleDateString() : '-' }
      ];

      drawTable(doc, yPosition, datesData, darkBlue, orange, green, lightGray);

      // ===== FOOTER =====
      const footerY = doc.page.height - 60;

      doc.fillColor(darkBlue)
        .rect(0, footerY - 30, doc.page.width, doc.page.height - footerY + 30)
        .fill();

      doc.fillColor(white)
        .fontSize(9)
        .font('Helvetica')
        .text('Generated: ' + new Date().toLocaleString(), 50, footerY, { align: 'left' })
        .text('Pawn Flow Management System', doc.page.width - 200, footerY, { align: 'right', width: 150 });

      doc.fontSize(8)
        .text('This document is generated electronically. No signature required.', 50, footerY + 15);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw a 2-column table with field/value pairs
 */
function drawTable(doc, startY, data, darkBlue, orange, green, lightGray) {
  const rowHeight = 28;
  const colWidth = 260;

  // Header row
  doc.fillColor(darkBlue)
    .rect(40, startY - 5, doc.page.width - 80, rowHeight)
    .fill();

  doc.fillColor('#FFFFFF')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Field', 50, startY + 5)
    .text('Value', 310, startY + 5);

  let currentY = startY + rowHeight + 5;

  // Data rows (2 per row)
  for (let i = 0; i < data.length; i += 2) {
    const isEven = (i / 2) % 2 === 0;
    const rowY = currentY;

    // Background
    doc.fillColor(isEven ? lightGray : '#FFFFFF')
      .rect(40, rowY - 5, doc.page.width - 80, rowHeight)
      .fill();

    // Border
    doc.strokeColor(darkBlue)
      .lineWidth(0.5)
      .rect(40, rowY - 5, doc.page.width - 80, rowHeight)
      .stroke();

    doc.fontSize(9)
      .font('Helvetica')
      .fillColor('#2C3E50');

    // Left column
    doc.text(data[i].field + ':', 50, rowY);
    doc.fillColor(green)
      .font('Helvetica-Bold')
      .text(String(data[i].value), 310, rowY);

    // Right column (if exists)
    if (data[i + 1]) {
      doc.fillColor('#2C3E50')
        .font('Helvetica')
        .text(data[i + 1].field + ':', 50, rowY + 14);
      doc.fillColor(green)
        .font('Helvetica-Bold')
        .text(String(data[i + 1].value), 310, rowY + 14);
    }

    currentY += rowHeight;
  }
}

/**
 * Save PDF to file system (optional)
 */
async function savePDFToFile(loan, outputDir = './pdfs') {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `loan_${loan.id}_${loan.transaction_number || 'unknown'}.pdf`;
    const filepath = `${outputDir}/${filename}`;

    const pdfBuffer = await generateLoanPDF(loan);
    fs.writeFileSync(filepath, pdfBuffer);

    return filepath;
  } catch (error) {
    console.error('Error saving PDF to file:', error);
    throw error;
  }
}

module.exports = {
  generateLoanPDF,
  savePDFToFile
};
