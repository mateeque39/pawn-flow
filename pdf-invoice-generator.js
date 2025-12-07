/**
 * PDF Generation - Loan Receipt Template
 * Uses jsPDF library for professional PDF generation
 */

const jsPDF = require('jspdf').jsPDF;

/**
 * Format currency values
 */
function formatCurrency(value) {
  return `$${parseFloat(value || 0).toFixed(2)}`;
}

/**
 * Generate professional loan receipt PDF
 * Matches the approved jsPDF template format
 * @param {Object} loan - Loan object from database
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateLoanPDF(loan) {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔧 PDF Generator - Creating jsPDF receipt for loan:', loan?.id);
      
      // Validate loan object
      if (!loan) {
        throw new Error('Loan object is required');
      }
      if (!loan.id) {
        throw new Error('Loan ID is required');
      }

      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // ===== COMPANY HEADER =====
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('GREEN MOOLAA BRAMPTON', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('263 QUEEN ST. E. UNIT 4', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      doc.text('BRAMPTON ON L6W 4K6', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      doc.text('(905) 796-7777', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;

      // Dividing line
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // ===== CUSTOMER INFO & TRANSACTION =====
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('[CUSTOMER]', margin, yPosition);

      doc.setFontSize(8);
      const transactionNumber = loan.transaction_number || loan.transactionNumber || 'N/A';
      doc.text(`Transaction: ${transactionNumber}`, pageWidth - margin - 40, yPosition);
      yPosition += 5;

      // Customer name
      const firstName = loan.first_name || loan.firstName || '';
      const lastName = loan.last_name || loan.lastName || '';
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${firstName} ${lastName}`, margin, yPosition);
      yPosition += 4;

      // Loan details
      doc.setFontSize(8);
      const loanId = loan.id || loan.loanId || 'N/A';
      const loanAmount = loan.loan_amount || loan.loanAmount || '0.00';
      const dueDate = loan.due_date || loan.dueDate || 'N/A';

      doc.text(`Loan ID: ${loanId}`, margin, yPosition);
      yPosition += 4;
      doc.text(`Loan Amount: $${parseFloat(loanAmount).toFixed(2)}`, margin, yPosition);
      yPosition += 4;
      doc.text(`Due Date: ${dueDate}`, margin, yPosition);
      yPosition += 6;

      // ===== TABLE HEADER =====
      const tableTop = yPosition;
      const colWidths = {
        item: 25,
        category: 35,
        description: 70,
        amount: 30
      };

      // Header background
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, tableTop, contentWidth, 7, 'F');

      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('ITEM', margin + 2, tableTop + 5);
      doc.text('CATEGORY', margin + colWidths.item + 2, tableTop + 5);
      doc.text('DESCRIPTION', margin + colWidths.item + colWidths.category + 2, tableTop + 5);
      doc.text('AMOUNT', margin + colWidths.item + colWidths.category + colWidths.description + 2, tableTop + 5);

      // Table border
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, tableTop, contentWidth, 7);
      doc.line(margin + colWidths.item, tableTop, margin + colWidths.item, tableTop + 7);
      doc.line(margin + colWidths.item + colWidths.category, tableTop, margin + colWidths.item + colWidths.category, tableTop + 7);
      doc.line(margin + colWidths.item + colWidths.category + colWidths.description, tableTop, margin + colWidths.item + colWidths.category + colWidths.description, tableTop + 7);

      yPosition = tableTop + 8;

      // ===== TABLE CONTENT =====
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text('LN-' + loanId, margin + 2, yPosition);

      // Use actual collateral/item data from loan
      const itemCategory = loan.item_category || loan.itemCategory || 'Loan';
      const itemDescription = loan.collateral_description || loan.collateralDescription || loan.item_description || loan.itemDescription || 'Pawn Loan Agreement';

      doc.text(itemCategory, margin + colWidths.item + 2, yPosition);
      doc.text(itemDescription, margin + colWidths.item + colWidths.category + 2, yPosition);

      const totalPayable = loan.total_payable_amount || loan.totalPayableAmount || loanAmount;
      doc.text(formatCurrency(totalPayable), margin + colWidths.item + colWidths.category + colWidths.description + 2, yPosition);

      yPosition += 8;

      // ===== CHARGES DUE =====
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text('CHARGES ON THIS ACCOUNT ARE DUE ON OR BEFORE', margin + colWidths.item + colWidths.category + 5, yPosition);
      doc.text(dueDate, pageWidth - margin - 40, yPosition);
      yPosition += 6;

      // ===== TOTAL =====
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('TOTAL', margin + colWidths.item + colWidths.category + 5, yPosition);
      doc.text(formatCurrency(totalPayable), pageWidth - margin - 40, yPosition);
      yPosition += 8;

      // ===== LEGAL TERMS =====
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);

      const legalText = `I, the undersigned (herein 'the seller'), do hereby loan the item(s) above amount, the receipt of which is acknowledge by the undersigned (herein 'the Seller'), said Seller does sell, transfer, and assign all rights, title and interest in the described property to GRN. The seller declares that the above is their own personal property free and clear of all claims and liens whatsoever and that they have the full power to sell, transfer and deliver said property as provided herein.`;

      const splitText = doc.splitTextToSize(legalText, contentWidth - 4);
      doc.text(splitText, margin + 2, yPosition);

      // ===== FOOTER =====
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      doc.setFontSize(7);
      doc.text('Pawn-GR-02-CAN', pageWidth - margin - 30, pageHeight - 5);

      // Output as buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      console.log('✅ PDF generated successfully, buffer size:', pdfBuffer.length);
      resolve(pdfBuffer);
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
