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

    // Create PDF document using PDFKit (instead of jsPDF for better control)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Collect PDF data
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log('✅ PDF generated successfully, buffer size:', pdfBuffer.length);
        resolve(pdfBuffer);
      });
      
      doc.on('error', err => {
        console.error('❌ PDF Generation Error:', err.message);
        reject(err);
      });

      try {
        const pageWidth = 595;
        const pageHeight = 842;
        const margin = 40;
        let y = margin;

        // ===== COMPANY HEADER =====
        doc.fontSize(16).font('Helvetica-Bold').text('GREEN MOOLAA BRAMPTON', { align: 'center' });
        y += 20;
        doc.fontSize(10).font('Helvetica').text('263 QUEEN ST. E. UNIT 4', { align: 'center' });
        doc.text('BRAMPTON ON L6W 4K6', { align: 'center' });
        doc.text('(905) 796-7777', { align: 'center' });
        y += 15;

        // Horizontal line
        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
        y += 15;

        // ===== CUSTOMER INFO =====
        doc.fontSize(10).font('Helvetica-Bold').text('[CUSTOMER]', margin, y);
        const transactionNumber = loan.transaction_number || loan.transactionNumber || 'N/A';
        doc.fontSize(9).font('Helvetica').text(`Transaction: ${transactionNumber}`, pageWidth - margin - 100, y);
        y += 15;

        const firstName = loan.first_name || loan.firstName || 'Customer';
        const lastName = loan.last_name || loan.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        doc.fontSize(10).font('Helvetica').text(fullName || 'N/A', margin);
        y += 12;

        // Loan details
        const loanId = loan.id || loan.loanId || 'N/A';
        const dueDate = loan.due_date || loan.dueDate || 'N/A';
        
        doc.fontSize(9).font('Helvetica').text(`Loan ID: ${loanId}`, margin);
        doc.text(`Loan Amount: $${parseFloat(loanAmount).toFixed(2)}`, margin);
        doc.text(`Due Date: ${dueDate}`, margin);
        y += 20;

        // ===== TABLE HEADER =====
        const colX = { item: margin, category: margin + 60, description: margin + 140, amount: margin + 280 };
        
        doc.rect(margin, y - 5, pageWidth - 2 * margin, 20).stroke();
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('ITEM', colX.item, y);
        doc.text('CATEGORY', colX.category, y);
        doc.text('DESCRIPTION', colX.description, y);
        doc.text('AMOUNT', colX.amount, y);
        y += 25;

        // ===== TABLE CONTENT =====
        const itemCategory = loan.item_category || loan.itemCategory || 'Loan';
        const itemDescription = loan.collateral_description || loan.collateralDescription || loan.item_description || loan.itemDescription || 'Pawn Loan Agreement';
        const totalPayable = loan.total_payable_amount || loan.totalPayableAmount || loanAmount;

        doc.fontSize(9).font('Helvetica');
        doc.text(`LN-${loanId}`, colX.item);
        doc.text(itemCategory, colX.category);
        doc.text(itemDescription.substring(0, 40), colX.description);
        doc.text(`$${parseFloat(totalPayable).toFixed(2)}`, colX.amount);
        y += 20;

        // ===== CHARGES DUE =====
        doc.fontSize(9).font('Helvetica').text('CHARGES ON THIS ACCOUNT ARE DUE ON OR BEFORE', margin);
        doc.text(dueDate, pageWidth - margin - 80, y - 12);
        y += 15;

        // ===== TOTAL =====
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('TOTAL', margin);
        doc.text(`$${parseFloat(totalPayable).toFixed(2)}`, pageWidth - margin - 80, y - 12);
        y += 20;

        // ===== LEGAL TERMS =====
        doc.fontSize(7).font('Helvetica');
        const legalText = `I, the undersigned (herein 'the seller'), do hereby loan the item(s) above amount, the receipt of which is acknowledge by the undersigned (herein 'the Seller'), said Seller does sell, transfer, and assign all rights, title and interest in the described property to GRN. The seller declares that the above is their own personal property free and clear of all claims and liens whatsoever and that they have the full power to sell, transfer and deliver said property as provided herein.`;
        
        doc.text(legalText, margin, y, { width: pageWidth - 2 * margin, align: 'left' });

        // ===== FOOTER =====
        doc.fontSize(7).text('Pawn-GR-02-CAN', pageWidth - margin - 50, pageHeight - margin);

        doc.end();
      } catch (err) {
        console.error('❌ PDF Generation Error:', err.message);
        reject(err);
      }
    });
  } catch (error) {
    console.error('❌ PDF Generation Error:', error.message);
    console.error('Stack:', error.stack);
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
