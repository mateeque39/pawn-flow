const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testLoanCreation() {
  try {
    console.log('\n🧪 Testing loan creation and PDF data flow...\n');

    const loanData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      mobilePhone: '555-1234567',
      homePhone: '555-9876543',
      loanAmount: 500,
      interestRate: 15,
      loanTerm: 30,
      collateralDescription: 'MacBook Pro',
      itemDescription: 'MacBook Pro',
      customerNote: 'Test loan for PDF generation'
    };

    console.log('Creating loan with data:', JSON.stringify(loanData, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    const response = await axios.post(`${API_URL}/create-loan`, loanData);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Response received from backend:\n');
    console.log('Response keys:', Object.keys(response.data));
    console.log('\nLoan object keys:', Object.keys(response.data.loan));
    console.log('\nLoan object data:');
    console.log(JSON.stringify(response.data.loan, null, 2));

    const loan = response.data.loan;
    console.log('\n📋 Key field values in response:');
    console.log(`   id: ${loan.id}`);
    console.log(`   first_name: ${loan.first_name}`);
    console.log(`   last_name: ${loan.last_name}`);
    console.log(`   loan_amount: ${loan.loan_amount}`);
    console.log(`   interest_rate: ${loan.interest_rate}`);
    console.log(`   transaction_number: ${loan.transaction_number}`);
    console.log(`   pdf_url: ${response.data.pdf_url}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLoanCreation();
