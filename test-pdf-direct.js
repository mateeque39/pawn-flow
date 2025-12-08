#!/usr/bin/env node
/**
 * Direct PDF Generation Test
 * Tests generateLoanPDF without the server
 */

const { generateLoanPDF } = require('./pdf-invoice-generator');

// Test loan object
const testLoan = {
  id: 36,
  first_name: 'Khalil',
  last_name: 'Rehman',
  loan_amount: 100,
  transaction_number: '794153372',
  collateral_description: 'Test Item',
  due_date: '2025-12-20'
};

async function test() {
  try {
    console.log('Testing PDF generation with loan:', testLoan);
    const buffer = await generateLoanPDF(testLoan);
    console.log('✅ PDF generated successfully!');
    console.log('   Buffer size:', buffer.length, 'bytes');
    console.log('   Buffer type:', buffer.constructor.name);
  } catch (error) {
    console.error('❌ PDF generation FAILED:');
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    process.exit(1);
  }
}

test();
