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
  try {
    console.log('🔧 PDF Generator - Creating jsPDF receipt for loan:', loan?.id);
    
    // Validate loan object
    if (!loan) throw new Error('Loan object is required');
    if (!loan.id) throw new Error('Loan ID is required');
    
    // Extract loan amount
    const loanAmount = loan.loan_amount || loan.loanAmount || 0;
    if (loanAmount === null || loanAmount === undefined || loanAmount === '') {
      throw new Error('Loan amount is required and must be a valid number');
    }

    // Create PDF document using jsPDF (which IS in package.json)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // ===== COMPANY HEADER =====
    doc.setFontSize(16).setFont(undefined, 'bold');
    doc.text('GREEN MOOLAA BRAMPTON', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text('263 QUEEN ST. E. UNIT 4', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text('BRAMPTON ON L6W 4K6', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text('(905) 796-7777', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Horizontal line
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ===== CUSTOMER INFO =====
    doc.setFontSize(11).setFont(undefined, 'bold');
    doc.text('[CUSTOMER]', margin, y);
    
    const transactionNumber = loan.transaction_number || loan.transactionNumber || 'N/A';
    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text(`Transaction: ${transactionNumber}`, pageWidth - margin - 50, y);
    y += 7;

    // Customer name
    const firstName = loan.first_name || loan.firstName || 'Customer';
    const lastName = loan.last_name || loan.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text(fullName || 'N/A', margin, y);
    y += 6;

    // Loan details
    const loanId = loan.id || loan.loanId || 'N/A';
    const dueDate = loan.due_date || loan.dueDate || 'N/A';
    
    doc.setFontSize(9);
    doc.text(`Loan ID: ${loanId}`, margin, y);
    y += 5;
    doc.text(`Loan Amount: $${parseFloat(loanAmount).toFixed(2)}`, margin, y);
    y += 5;
    doc.text(`Due Date: ${dueDate}`, margin, y);
    y += 8;

    // ===== TABLE HEADER =====
    doc.setDrawColor(0);
    doc.rect(margin, y, pageWidth - 2 * margin, 8);
    
    doc.setFontSize(9).setFont(undefined, 'bold');
    doc.text('ITEM', margin + 2, y + 5);
    doc.text('CATEGORY', margin + 35, y + 5);
    doc.text('DESCRIPTION', margin + 75, y + 5);
    doc.text('AMOUNT', pageWidth - margin - 25, y + 5);
    y += 10;

    // ===== TABLE CONTENT =====
    const itemCategory = loan.item_category || loan.itemCategory || 'Loan';
    const itemDescription = (loan.collateral_description || loan.collateralDescription || loan.item_description || loan.itemDescription || 'Pawn Loan Agreement').substring(0, 45);
    const totalPayable = loan.total_payable_amount || loan.totalPayableAmount || loanAmount;

    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text(`LN-${loanId}`, margin + 2, y);
    doc.text(itemCategory, margin + 35, y);
    doc.text(itemDescription, margin + 75, y);
    doc.text(`$${parseFloat(totalPayable).toFixed(2)}`, pageWidth - margin - 25, y);
    y += 10;

    // ===== CHARGES DUE =====
    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text('CHARGES ON THIS ACCOUNT ARE DUE ON OR BEFORE', margin, y);
    doc.text(dueDate, pageWidth - margin - 30, y);
    y += 8;

    // ===== TOTAL =====
    doc.setFontSize(11).setFont(undefined, 'bold');
    doc.text('TOTAL', margin, y);
    doc.text(`$${parseFloat(totalPayable).toFixed(2)}`, pageWidth - margin - 30, y);
    y += 10;

    // ===== LEGAL TERMS =====
    doc.setFontSize(7).setFont(undefined, 'normal');
    const legalText = `I, the undersigned (herein 'the seller'), do hereby loan the item(s) above amount, the receipt of which is acknowledge by the undersigned (herein 'the Seller'), said Seller does sell, transfer, and assign all rights, title and interest in the described property to GRN. The seller declares that the above is their own personal property free and clear of all claims and liens whatsoever and that they have the full power to sell, transfer and deliver said property as provided herein.`;
    
    const splitText = doc.splitTextToSize(legalText, pageWidth - 2 * margin - 4);
    doc.text(splitText, margin + 2, y);

    // ===== FOOTER =====
    doc.setDrawColor(0);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFontSize(7);
    doc.text('Pawn-GR-02-CAN', pageWidth - margin - 25, pageHeight - 5);

    // Return as buffer - use output() which handles the rendering
    const pdfOutput = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfOutput);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty - PDF generation failed');
    }
    
    console.log('✅ PDF generated successfully, buffer size:', pdfBuffer.length);
    return pdfBuffer;
  } catch (error) {
    console.error('❌ PDF Generation Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Loan object:', { id: loan?.id, loan_amount: loan?.loan_amount, loanAmount: loan?.loanAmount });
    throw error;
  }
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
