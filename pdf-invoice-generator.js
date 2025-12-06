/**
 * PDF Invoice Generator for PawnFlow Loans - Exact Template Match
 * Creates professional invoices matching the reference template design exactly
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Format currency values
 */
function formatCurrency(value) {
  return `$${parseFloat(value || 0).toFixed(2)}`;
}

/**
 * Format date to MM/DD/YYYY format
 */
function formatDate(date) {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return date;
  }
}

/**
 * Generate a professional loan invoice PDF matching the template exactly
 * @param {Object} loan - Loan object from database
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateLoanPDF(loan) {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔧 PDF Generator - Received loan data:', {
        id: loan?.id,
        transaction_number: loan?.transaction_number,
        first_name: loan?.first_name,
        loan_amount: loan?.loan_amount
      });

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      let yPos = 40;

      // ===== HEADER - Company Name and Address =====
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('GREEN MOOLAA BRAMPTON', { align: 'center' });

      yPos += 16;

      doc.fontSize(10)
        .font('Helvetica')
        .text('263 QUEEN ST E, UNIT 4 BRAMPTON ON L6W 4K6', { align: 'center' });

      yPos += 12;

      doc.fontSize(10)
        .text('(905) 796-7777', { align: 'center' });

      yPos += 25;

      // ===== BILLED TO SECTION =====
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('BILLED TO:');

      yPos += 16;

      doc.fontSize(10)
        .font('Helvetica')
        .text(`${loan.first_name || ''} ${loan.last_name || ''}`);

      yPos += 35;

      // ===== TRANSACTION LINE WITH UNDERLINE =====
      // Draw horizontal line
      doc.strokeColor('#000000')
        .lineWidth(0.5)
        .moveTo(60, yPos)
        .lineTo(540, yPos)
        .stroke();

      yPos += 12;

      // Transaction details row
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Transaction No. ' + (loan.transaction_number || 'N/A'), 60, yPos);

      doc.text('Status: ' + (loan.status || 'ACTIVE').toUpperCase(), 240, yPos);

      doc.text('Amount: ' + formatCurrency(loan.loan_amount), 420, yPos, { align: 'right' });

      yPos += 18;

      // Draw line below transaction details
      doc.strokeColor('#000000')
        .lineWidth(0.5)
        .moveTo(60, yPos)
        .lineTo(540, yPos)
        .stroke();

      yPos += 18;

      // ===== COLLATERAL ITEM LINE =====
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Collateral Item', 60, yPos);

      doc.text(loan.collateral_description || loan.item_description || 'N/A', 280, yPos);

      yPos += 16;

      // Draw separator line
      doc.strokeColor('#000000')
        .lineWidth(0.5)
        .moveTo(60, yPos)
        .lineTo(540, yPos)
        .stroke();

      yPos += 18;

      // ===== ITEM DESCRIPTION LINE =====
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Item Description', 60, yPos);

      doc.text(loan.item_description || 'None', 280, yPos);

      yPos += 16;

      // Draw separator line
      doc.strokeColor('#000000')
        .lineWidth(0.5)
        .moveTo(60, yPos)
        .lineTo(540, yPos)
        .stroke();

      yPos += 28;

      // ===== BLANK SPACE FOR NOTES =====
      doc.strokeColor('#000000')
        .lineWidth(0.5)
        .moveTo(60, yPos)
        .lineTo(540, yPos)
        .stroke();

      yPos += 28;

      // ===== FINANCIAL DETAILS SECTION =====
      // Interest Amount (right side)
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Interest Amount:', 320, yPos, { width: 100, align: 'right' });

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text(formatCurrency(loan.interest_amount || 0), 420, yPos, { width: 100, align: 'right' });

      yPos += 20;

      // Loan Created date (left), Recurring Fee (right)
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Loan Created: ' + formatDate(loan.loan_issued_date), 60, yPos);

      doc.text('Recurring Fee:', 320, yPos, { width: 100, align: 'right' });

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text(formatCurrency(loan.recurring_fee || 0), 420, yPos, { width: 100, align: 'right' });

      yPos += 20;

      // Due Date (left), Total Payable (right - highlighted)
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Due Date: ' + formatDate(loan.due_date), 60, yPos);

      // Total Payable Box
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('Total', 320, yPos + 2, { width: 100, align: 'right' });

      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(formatCurrency(loan.total_payable_amount || 0), 350, yPos + 15, { width: 80, align: 'center' });

      yPos += 50;

      // ===== TERMS AND CONDITIONS =====
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#000000');

      const termsText = `I, the undersigned (herein 'the seller'), do hereby loan the item(s) above to the customer amount, the receipt of which is acknowledge by the undersigned (herein 'the Seller'), said Seller does sell, transfer, and assign all rights, title and interest in the described property to GRN. The seller declares that the above is their own personal property free and all claims and liens whatsoever and that they have the full power to sell, transfer and deliver said property as provided herein.

Seller is hereby granted a customer option by GRN to repurchase the described property from GRN at a mutually agreeable price, which is set forth on this contract. The seller has (30) days from the date of the agreement to exercise this agreement to exercise the seller option and will forfeit the option (1) days from the agreement date.`;

      doc.text(termsText, 60, yPos, {
        width: 480,
        height: 120,
        align: 'left',
        lineGap: 3
      });

      // ===== FOOTER =====
      const footerY = doc.page.height - 40;

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Generated: ' + new Date().toLocaleString(), 60, footerY);

      doc.end();
    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      reject(error);
    }
  });
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

    console.log(`✅ PDF saved successfully: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('❌ Error saving PDF to file:', error);
    throw error;
  }
}

module.exports = {
  generateLoanPDF,
  savePDFToFile
};
