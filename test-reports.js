const axios = require('axios');

async function testReports() {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    console.log('\n🧪 Testing Daily Cash Report Endpoints\n');
    console.log(`Date: ${today}\n`);

    // Test 1: Daily Cash Balancing Report
    console.log('1️⃣ Testing /reports/daily-cash-balancing...');
    const balancingResponse = await axios.get('http://localhost:5000/reports/daily-cash-balancing', {
      params: {
        startDate: today,
        endDate: today
      }
    });
    console.log('✅ Balancing Report:');
    console.log(JSON.stringify(balancingResponse.data, null, 2));

    // Test 2: Active Loans Breakdown
    console.log('\n2️⃣ Testing /reports/active-loans-breakdown...');
    const activeResponse = await axios.get('http://localhost:5000/reports/active-loans-breakdown', {
      params: {
        startDate: today,
        endDate: today
      }
    });
    console.log('✅ Active Loans:');
    console.log(JSON.stringify(activeResponse.data, null, 2));

    // Test 3: Due Loans Breakdown
    console.log('\n3️⃣ Testing /reports/due-loans-breakdown...');
    const dueResponse = await axios.get('http://localhost:5000/reports/due-loans-breakdown', {
      params: {
        startDate: today,
        endDate: today
      }
    });
    console.log('✅ Due Loans:');
    console.log(JSON.stringify(dueResponse.data, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    process.exit(1);
  }
}

testReports();
