/**
 * PDF Generation Utility - Backend Version
 * Uses PDFKit with the correct receipt template format
 * Generates professional loan receipts with table layout
 */

const PDFDocument = require('pdfkit');

/**
 * Format currency values
 */
function formatCurrency(value) {
  return `$${parseFloat(value || 0).toFixed(2)}`;
}

/**
 * Format date to display format
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
 * Generate a professional loan receipt PDF with correct table format
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
        margin: 12,
        bufferPages: true
      });

      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        console.log('✅ PDF generated successfully, buffer size:', pdfBuffer.length);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 12;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // ===== COMPANY HEADER =====
      doc.fontSize(14).font('Helvetica-Bold').text('GREEN MOOLAA BRAMPTON', {
        align: 'center'
      });
      yPos += 14;

      doc.fontSize(10).font('Helvetica').text('263 QUEEN ST. E. UNIT 4', {
        align: 'center'
      });
      yPos += 10;

      doc.text('BRAMPTON ON L6W 4K6', {
        align: 'center'
      });
      yPos += 10;

      doc.text('(905) 796-7777', {
        align: 'center'
      });
      yPos += 14;

      // Dividing line
      doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).stroke();
      yPos += 8;

      // ===== CUSTOMER INFO & TRANSACTION =====
      doc.fontSize(9).font('Helvetica-Bold').text('[ORIGINAL]', margin, yPos);
      
      const transactionNumber = loan.transaction_number || loan.transactionNumber || 'N/A';
      doc.fontSize(8).font('Helvetica').text(`Transaction: ${transactionNumber}`, pageWidth - margin - 80, yPos);
      yPos += 10;

      // Customer name
      const firstName = loan.first_name || loan.firstName || '';
      const lastName = loan.last_name || loan.lastName || '';
      doc.fontSize(9).font('Helvetica').text(`${firstName} ${lastName}`, margin, yPos);
      yPos += 8;

      // Loan details
      const loanId = loan.id || loan.loanId || 'N/A';
      const loanAmount = loan.loan_amount || loan.loanAmount || '0.00';
      const dueDate = loan.due_date || loan.dueDate || 'N/A';

      doc.fontSize(8).text(`Loan Amount: $${parseFloat(loanAmount).toFixed(2)}`, margin, yPos);
      yPos += 8;

      doc.text(`Due Date: ${dueDate}`, margin, yPos);
      yPos += 12;

      // ===== TABLE HEADER =====
      const tableTop = yPos;
      const colWidths = {
        item: 25,
        category: 35,
        description: 70,
        amount: 30
      };

      // Header background - gray rect
      doc.rect(margin, tableTop, contentWidth, 12).fillAndStroke('#CCCCCC', '#000000');

      // Header text
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
      doc.text('ITEM', margin + 2, tableTop + 2);
      doc.text('CATEGORY', margin + colWidths.item + 2, tableTop + 2);
      doc.text('DESCRIPTION', margin + colWidths.item + colWidths.category + 2, tableTop + 2);
      doc.text('AMOUNT', margin + colWidths.item + colWidths.category + colWidths.description + 2, tableTop + 2);

      yPos = tableTop + 16;

      // ===== TABLE CONTENT =====
      doc.fontSize(8).font('Helvetica');

      const itemCategory = loan.item_category || loan.itemCategory || 'Loan';
      const itemDescription = loan.collateral_description || loan.collateralDescription || loan.item_description || loan.itemDescription || 'Pawn Loan Agreement';

      doc.text('LN-' + loanId, margin + 2, yPos);
      doc.text(itemCategory, margin + colWidths.item + 2, yPos);
      doc.text(itemDescription, margin + colWidths.item + colWidths.category + 2, yPos);

      const totalPayable = loan.total_payable_amount || loan.totalPayableAmount || loanAmount;
      doc.text(formatCurrency(totalPayable), margin + colWidths.item + colWidths.category + colWidths.description + 2, yPos);

      yPos += 12;

      // ===== CHARGES DUE =====
      doc.fontSize(8).text('CHARGES ON THIS ACCOUNT ARE DUE ON OR BEFORE', margin + colWidths.item + colWidths.category + 5, yPos);
      doc.text(dueDate, pageWidth - margin - 50, yPos);
      yPos += 10;

      // ===== TOTAL =====
      doc.fontSize(9).font('Helvetica-Bold').text('TOTAL', margin + colWidths.item + colWidths.category + 5, yPos);
      doc.text(formatCurrency(totalPayable), pageWidth - margin - 50, yPos);
      yPos += 14;

      // ===== LEGAL TERMS =====
      doc.fontSize(7).font('Helvetica');
      
      const legalText = `I, the undersigned (herein 'the seller'), do hereby loan the item(s) above amount, the receipt of which is acknowledge by the undersigned (herein 'the Seller'), said Seller does sell, transfer, and assign all rights, title and interest in the described property to GRN. The seller declares that the above is their own personal property free and clear of all claims and liens whatsoever and that they have the full power to sell, transfer and deliver said property as provided herein.`;

      doc.text(legalText, margin + 2, yPos, {
        width: contentWidth - 4,
        align: 'left',
        lineGap: 2
      });

      // ===== FOOTER =====
      doc.moveTo(margin, pageHeight - 15).lineTo(pageWidth - margin, pageHeight - 15).stroke();
      doc.fontSize(7).text('Pawn-GR-02-CAN', pageWidth - margin - 35, pageHeight - 10);

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
    const fs = require('fs');
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
