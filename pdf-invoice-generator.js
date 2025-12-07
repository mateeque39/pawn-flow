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
    console.log('   Loan object keys:', Object.keys(loan || {}).join(', '));
    console.log('   Customer data - first_name:', loan?.first_name, 'last_name:', loan?.last_name);
    console.log('   Collateral description:', loan?.collateral_description);
    
    // Validate loan object
    if (!loan) {
      console.error('   ❌ Loan object is null/undefined');
      throw new Error('Loan object is required');
    }
    if (!loan.id) {
      console.error('   ❌ Loan ID missing from loan object');
      throw new Error('Loan ID is required');
    }
    
    // Extract loan amount
    const loanAmount = loan.loan_amount || loan.loanAmount || 0;
    console.log('   Extracted loanAmount:', loanAmount, 'type:', typeof loanAmount);
    if (loanAmount === null || loanAmount === undefined || loanAmount === '') {
      console.error('   ❌ Loan amount validation failed:', loanAmount);
      throw new Error('Loan amount is required and must be a valid number');
    }

    // Create PDF document using jsPDF (which IS in package.json)
    let doc;
    try {
      console.log('   Creating jsPDF document...');
      console.log('   jsPDF constructor available:', typeof jsPDF);
      doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      console.log('   ✓ jsPDF document created successfully');
    } catch (docErr) {
      console.error('   ❌ jsPDF creation failed:', docErr.message);
      console.error('   ❌ jsPDF creation error type:', docErr.name);
      console.error('   ❌ jsPDF full error:', docErr);
      throw new Error(`Failed to create PDF document: ${docErr.message}`);
    }

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

    // ===== CUSTOMER INFO SECTION =====
    // Left: [CUSTOMER] label and name
    // Right: Transaction number
    doc.setFontSize(11).setFont(undefined, 'bold');
    doc.text('[CUSTOMER]', margin, y);
    y += 7;

    // Customer name - extract from database fields
    const firstName = String(loan.first_name || '').trim();
    const lastName = String(loan.last_name || '').trim();
    const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown Customer';
    
    console.log('   Full name constructed:', fullName);
    
    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text(fullName, margin, y);
    y += 7;

    // Loan details
    const loanId = loan.id || 'N/A';
    const transactionNumber = String(loan.transaction_number || 'N/A').trim();
    
    doc.setFontSize(9);
    doc.text(`Loan ID: ${loanId}`, margin, y);
    y += 5;
    doc.text(`Loan Amount: $${parseFloat(loanAmount).toFixed(2)}`, margin, y);
    y += 5;
    
    // Due date
    let dueDate = loan.due_date || loan.dueDate || 'N/A';
    if (dueDate instanceof Date) {
      dueDate = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } else if (typeof dueDate === 'string') {
      // If it's a string, try to parse and format it
      try {
        const dateObj = new Date(dueDate);
        if (!isNaN(dateObj.getTime())) {
          dueDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        }
      } catch (e) {
        // Keep original string if parsing fails
      }
    }
    doc.text(`Due Date: ${String(dueDate)}`, margin, y);
    
    // Transaction number on the right
    const transactionY = margin + 15; // Positioned at top right near customer section
    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text(`Transaction: ${transactionNumber}`, pageWidth - margin - 50, transactionY, { align: 'right' });
    
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
    const itemCategory = String(loan.item_category || 'Loan').trim();
    const collateralDesc = String(loan.collateral_description || 'Pawn Loan Agreement').trim();
    const itemDescription = collateralDesc.substring(0, 40); // Truncate to fit
    const totalPayable = loan.total_payable_amount || loanAmount;

    console.log('   Item category:', itemCategory);
    console.log('   Item description:', itemDescription);
    console.log('   Total payable:', totalPayable);

    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text(`LN-${loanId}`, margin + 2, y);
    doc.text(itemCategory, margin + 35, y);
    doc.text(itemDescription, margin + 75, y);
    doc.text(`$${parseFloat(totalPayable).toFixed(2)}`, pageWidth - margin - 25, y);
    y += 10;

    // ===== CHARGES DUE =====
    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text('CHARGES ON THIS ACCOUNT ARE DUE ON OR BEFORE', margin, y);
    doc.text(String(dueDate), pageWidth - margin - 30, y);
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
    let pdfOutput;
    let pdfBuffer;
    try {
      console.log('   Converting PDF to buffer...');
      pdfOutput = doc.output('arraybuffer');
      console.log('   pdfOutput type:', typeof pdfOutput, 'is ArrayBuffer:', pdfOutput instanceof ArrayBuffer);
      if (!pdfOutput) {
        throw new Error('doc.output() returned null/undefined');
      }
      pdfBuffer = Buffer.from(pdfOutput);
      console.log('   ✓ PDF converted to buffer, size:', pdfBuffer.length, 'bytes');
    } catch (bufErr) {
      console.error('   ❌ Buffer conversion error:', bufErr.message);
      console.error('   ❌ Buffer conversion error type:', bufErr.name);
      console.error('   ❌ pdfOutput value:', pdfOutput);
      console.error('   ❌ Full error:', bufErr);
      throw new Error(`Failed to convert PDF to buffer: ${bufErr.message}`);
    }
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('   ❌ PDF buffer is empty or invalid');
      console.error('   ❌ pdfBuffer:', pdfBuffer);
      throw new Error('PDF buffer is empty - PDF generation failed');
    }
    
    console.log('✅ PDF generated successfully, buffer size:', pdfBuffer.length);
    return pdfBuffer;
  } catch (error) {
    console.error('❌ PDF Generation Error:', error.message);
    console.error('   Error type:', error.name);
    console.error('   Stack:', error.stack);
    console.error('   Loan ID:', loan?.id);
    console.error('   Loan amount:', loan?.loan_amount);
    console.error('   Customer:', `${loan?.first_name} ${loan?.last_name}`);
    console.error('   Full error object:', JSON.stringify(error, null, 2));
    // Always throw with all available info
    throw new Error(`PDF Generation failed: ${error.message} | Type: ${error.name} | Loan: ${loan?.id}`);
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
