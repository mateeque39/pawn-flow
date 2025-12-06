const axios = require('axios');

async function testCashReport() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n🧪 Testing /cash-report endpoint with date: ${today}\n`);

    const response = await axios.get('http://localhost:5000/cash-report', {
      params: {
        date: today
      }
    });

    console.log('✅ Cash Report Response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Error code:', err.code);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    } else if (err.request) {
      console.error('No response received. Request config:', err.request);
    }
    console.error('Full error:', JSON.stringify(err, null, 2));
  }
}

testCashReport();
