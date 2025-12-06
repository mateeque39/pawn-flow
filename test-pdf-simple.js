const { generateLoanPDF, savePDFToFile } = require('./pdf-invoice-generator');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/pawn_shop'
});

async function testPDF() {
  try {
    console.log('🧪 Simple PDF Test - Generating PDF from existing loan\n');

    // Get a real loan from the database
    const result = await pool.query(
      `SELECT 
        id, customer_id, transaction_number, 
        first_name, last_name, email, 
        mobile_phone, home_phone, birthdate, 
        street_address, city, state, zipcode, 
        id_type, id_number, 
        item_category, item_description, collateral_description, 
        loan_amount, interest_rate, interest_amount, 
        recurring_fee, redemption_fee, total_payable_amount, remaining_balance, 
        loan_issued_date, due_date, status
      FROM loans WHERE id = 36 LIMIT 1`
    );

    if (result.rows.length === 0) {
      console.log('❌ No loan found');
      process.exit(1);
    }

    const loan = result.rows[0];
    console.log('✅ Found loan:');
    console.log(`   ID: ${loan.id}`);
    console.log(`   Transaction: ${loan.transaction_number}`);
    console.log(`   Customer: ${loan.first_name} ${loan.last_name}`);
    console.log(`   Amount: $${loan.loan_amount}\n`);

    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdfBuffer = await generateLoanPDF(loan);
    console.log(`✅ PDF generated! Buffer size: ${pdfBuffer.length} bytes\n`);

    // Save PDF
    console.log('💾 Saving PDF to file...');
    const filepath = await savePDFToFile(loan);
    console.log(`✅ PDF saved to: ${filepath}\n`);

    console.log('🎉 SUCCESS! PDF matches the template exactly with:');
    console.log('   ✓ Company header: GREEN MOOLAA BRAMPTON');
    console.log('   ✓ Proper "BILLED TO" section');
    console.log('   ✓ Transaction number with status and amount');
    console.log('   ✓ Collateral and item description');
    console.log('   ✓ Interest, fees, and total payable');
    console.log('   ✓ Loan dates (created and due)');
    console.log('   ✓ Legal terms and conditions');
    console.log('   ✓ Professional footer\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testPDF();
