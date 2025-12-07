/**
 * Simplified PDF Generation - Loan Receipt Template
 * Uses minimal jsPDF operations to avoid compatibility issues
 */

const jsPDF = require('jspdf').jsPDF;

/**
 * Generate simple loan receipt PDF
 * @param {Object} loan - Loan object from database
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateLoanPDF(loan) {
  try {
    console.log('🔧 SIMPLIFIED PDF Generator - Creating jsPDF receipt for loan:', loan?.id);
    
    // Validate loan object
    if (!loan) throw new Error('Loan object is required');
    if (!loan.id) throw new Error('Loan ID is required');
    
    const loanAmount = loan.loan_amount || 0;
    if (!loanAmount) throw new Error('Loan amount is required');

    console.log('   Creating minimal jsPDF document...');
    
    // Create very basic PDF document
    const doc = new jsPDF();
    
    console.log('   ✓ Document created, adding content...');
    
    // Add minimal text - just the basics
    doc.setFontSize(14);
    doc.text('LOAN RECEIPT', 10, 20);
    
    doc.setFontSize(10);
    let y = 40;
    doc.text(`Loan ID: ${loan.id}`, 10, y); y += 10;
    doc.text(`Customer: ${loan.first_name || ''} ${loan.last_name || ''}`, 10, y); y += 10;
    doc.text(`Amount: $${parseFloat(loanAmount).toFixed(2)}`, 10, y); y += 10;
    doc.text(`Date: ${loan.loan_issued_date || 'N/A'}`, 10, y); y += 10;
    doc.text(`Due Date: ${loan.due_date || 'N/A'}`, 10, y); y += 10;
    
    console.log('   ✓ Content added, converting to buffer...');
    
    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer');
    if (!pdfOutput) throw new Error('doc.output() returned null');
    
    const pdfBuffer = Buffer.from(pdfOutput);
    console.log('✅ Simple PDF generated successfully:', pdfBuffer.length, 'bytes');
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ Simple PDF Generation failed:', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  }
}

module.exports = {
  generateLoanPDF
};
