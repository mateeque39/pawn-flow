/**
 * Integration Tests for Customer Fields Implementation
 * Tests create-loan and search-loan endpoints with extended customer fields
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Utility function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test Runner
async function runTests() {
  console.log('\n=== INTEGRATION TESTS: Customer Fields Implementation ===\n');

  let passCount = 0;
  let failCount = 0;

  // Helper to assert
  function assert(condition, testName) {
    if (condition) {
      console.log(`✓ ${testName}`);
      passCount++;
    } else {
      console.log(`✗ ${testName}`);
      failCount++;
    }
  }

  // ===== CREATE-LOAN TESTS =====
  console.log('\n--- POST /create-loan Tests ---\n');

  // Test 1: Create loan with all customer fields (happy path)
  const createLoanPayload = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    homePhone: '555-1234',
    mobilePhone: '555-5678',
    birthdate: '1980-01-01',
    referral: 'friend',
    identificationInfo: 'Passport: 123ABC456',
    streetAddress: '123 Main St Apt 4',
    city: 'Boston',
    state: 'MA',
    zipcode: '02111',
    loanAmount: 100,
    interestRate: 10,
    loanTerm: 30,
    loanIssuedDate: '2025-11-21',
    collateralDescription: 'Gold ring',
    customerNote: 'VIP customer',
    createdByUserId: 1,
    createdByUsername: 'admin',
  };

  try {
    const response = await makeRequest('POST', '/create-loan', createLoanPayload);
    assert(response.status === 201, 'CREATE: Status 201 Created');
    assert(response.body.loan !== undefined, 'CREATE: Response contains loan object');
    assert(response.body.loan.first_name === 'Jane', 'CREATE: first_name is Jane (snake_case)');
    assert(response.body.loan.last_name === 'Doe', 'CREATE: last_name is Doe (snake_case)');
    assert(response.body.loan.email === 'jane.doe@example.com', 'CREATE: email matches input');
    assert(response.body.loan.mobile_phone === '555-5678', 'CREATE: mobile_phone matches (snake_case)');
    assert(response.body.loan.street_address === '123 Main St Apt 4', 'CREATE: street_address stored (snake_case)');
    assert(response.body.loan.city === 'Boston', 'CREATE: city stored');
    assert(response.body.loan.state === 'MA', 'CREATE: state stored');
    assert(response.body.loan.zipcode === '02111', 'CREATE: zipcode stored');
    assert(response.body.loan.birthdate === '1980-01-01', 'CREATE: birthdate stored');
    assert(response.body.loan.referral === 'friend', 'CREATE: referral stored');
    assert(response.body.loan.identification_info === 'Passport: 123ABC456', 'CREATE: identification_info stored (snake_case)');
    assert(response.body.loan.interest_amount === 10, 'CREATE: interest_amount calculated (100 * 10% = 10)');
    assert(response.body.loan.total_payable_amount === 110, 'CREATE: total_payable_amount calculated (100 + 10 = 110)');
    assert(response.body.loan.status === 'active', 'CREATE: status set to active');
  } catch (err) {
    console.log(`✗ CREATE: API request failed - ${err.message}`);
    failCount++;
  }

  // Test 2: Create loan with snake_case input (backward compatibility)
  const snakeCasePayload = {
    first_name: 'John',
    last_name: 'Smith',
    email: 'john@example.com',
    mobile_phone: '555-9999',
    street_address: '456 Oak Ave',
    city: 'NYC',
    state: 'NY',
    zipcode: '10001',
    loan_amount: 500,
    interest_rate: 15,
    loan_term: 60,
  };

  try {
    const response = await makeRequest('POST', '/create-loan', snakeCasePayload);
    assert(response.status === 201, 'CREATE: Snake_case input accepted (status 201)');
    assert(response.body.loan.first_name === 'John', 'CREATE: Snake_case first_name preserved');
  } catch (err) {
    console.log(`✗ CREATE: Snake_case test failed - ${err.message}`);
    failCount++;
  }

  // Test 3: Create loan with pre-computed interest amounts
  const preComputedPayload = {
    firstName: 'Alice',
    lastName: 'Johnson',
    loanAmount: 200,
    interestRate: 5,
    loanTerm: 30,
    interestAmount: 10,
    totalPayableAmount: 210,
  };

  try {
    const response = await makeRequest('POST', '/create-loan', preComputedPayload);
    assert(response.status === 201, 'CREATE: Pre-computed amounts accepted (status 201)');
    assert(response.body.loan.interest_amount === 10, 'CREATE: Pre-computed interest_amount used');
    assert(response.body.loan.total_payable_amount === 210, 'CREATE: Pre-computed total_payable_amount used');
  } catch (err) {
    console.log(`✗ CREATE: Pre-computed amounts test failed - ${err.message}`);
    failCount++;
  }

  // Test 4: Missing required first_name
  try {
    const response = await makeRequest('POST', '/create-loan', {
      lastName: 'Doe',
      loanAmount: 100,
      interestRate: 10,
      loanTerm: 30,
    });
    assert(response.status === 400, 'VALIDATION: Missing first_name returns 400');
    assert(response.body.message && response.body.message.includes('first_name'), 'VALIDATION: Error message mentions first_name');
  } catch (err) {
    console.log(`✗ VALIDATION: Missing first_name test failed - ${err.message}`);
    failCount++;
  }

  // Test 5: Missing required last_name
  try {
    const response = await makeRequest('POST', '/create-loan', {
      firstName: 'Jane',
      loanAmount: 100,
      interestRate: 10,
      loanTerm: 30,
    });
    assert(response.status === 400, 'VALIDATION: Missing last_name returns 400');
    assert(response.body.message && response.body.message.includes('last_name'), 'VALIDATION: Error message mentions last_name');
  } catch (err) {
    console.log(`✗ VALIDATION: Missing last_name test failed - ${err.message}`);
    failCount++;
  }

  // Test 6: Invalid email format
  try {
    const response = await makeRequest('POST', '/create-loan', {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'not-an-email',
      loanAmount: 100,
      interestRate: 10,
      loanTerm: 30,
    });
    assert(response.status === 400, 'VALIDATION: Invalid email returns 400');
    assert(response.body.message && response.body.message.toLowerCase().includes('email'), 'VALIDATION: Error message mentions email');
  } catch (err) {
    console.log(`✗ VALIDATION: Invalid email test failed - ${err.message}`);
    failCount++;
  }

  // Test 7: Invalid mobile phone format
  try {
    const response = await makeRequest('POST', '/create-loan', {
      firstName: 'Jane',
      lastName: 'Doe',
      mobilePhone: '123',
      loanAmount: 100,
      interestRate: 10,
      loanTerm: 30,
    });
    assert(response.status === 400, 'VALIDATION: Invalid phone returns 400');
    assert(response.body.message && response.body.message.toLowerCase().includes('mobile_phone'), 'VALIDATION: Error message mentions mobile_phone');
  } catch (err) {
    console.log(`✗ VALIDATION: Invalid phone test failed - ${err.message}`);
    failCount++;
  }

  // Test 8: Invalid loanAmount
  try {
    const response = await makeRequest('POST', '/create-loan', {
      firstName: 'Jane',
      lastName: 'Doe',
      loanAmount: -100,
      interestRate: 10,
      loanTerm: 30,
    });
    assert(response.status === 400, 'VALIDATION: Negative loanAmount returns 400');
    assert(response.body.message && response.body.message.includes('loan_amount'), 'VALIDATION: Error message mentions loan_amount');
  } catch (err) {
    console.log(`✗ VALIDATION: Negative loanAmount test failed - ${err.message}`);
    failCount++;
  }

  // Test 9: Invalid birthdate format
  try {
    const response = await makeRequest('POST', '/create-loan', {
      firstName: 'Jane',
      lastName: 'Doe',
      birthdate: 'invalid-date',
      loanAmount: 100,
      interestRate: 10,
      loanTerm: 30,
    });
    assert(response.status === 400, 'VALIDATION: Invalid birthdate returns 400');
    assert(response.body.message && response.body.message.toLowerCase().includes('birthdate'), 'VALIDATION: Error message mentions birthdate');
  } catch (err) {
    console.log(`✗ VALIDATION: Invalid birthdate test failed - ${err.message}`);
    failCount++;
  }

  // ===== SEARCH-LOAN TESTS =====
  console.log('\n--- GET /search-loan Tests ---\n');

  // Test 10: Search by firstName
  try {
    const response = await makeRequest('GET', '/search-loan?firstName=Jane', null);
    assert(
      response.status === 200 || response.status === 404,
      'SEARCH: Search by firstName returns 200 or 404'
    );
    if (response.status === 200 && Array.isArray(response.body)) {
      assert(true, 'SEARCH: Response is array');
    }
  } catch (err) {
    console.log(`✗ SEARCH: Search by firstName failed - ${err.message}`);
    failCount++;
  }

  // Test 11: Search by lastName
  try {
    const response = await makeRequest('GET', '/search-loan?lastName=Smith', null);
    assert(
      response.status === 200 || response.status === 404,
      'SEARCH: Search by lastName returns 200 or 404'
    );
  } catch (err) {
    console.log(`✗ SEARCH: Search by lastName failed - ${err.message}`);
    failCount++;
  }

  // Test 12: Search by email
  try {
    const response = await makeRequest('GET', '/search-loan?email=jane@example.com', null);
    assert(
      response.status === 200 || response.status === 404,
      'SEARCH: Search by email returns 200 or 404'
    );
  } catch (err) {
    console.log(`✗ SEARCH: Search by email failed - ${err.message}`);
    failCount++;
  }

  // Test 13: Search by mobilePhone
  try {
    const response = await makeRequest('GET', '/search-loan?mobilePhone=555', null);
    assert(
      response.status === 200 || response.status === 404,
      'SEARCH: Search by mobilePhone returns 200 or 404'
    );
  } catch (err) {
    console.log(`✗ SEARCH: Search by mobilePhone failed - ${err.message}`);
    failCount++;
  }

  // Test 14: Search by city
  try {
    const response = await makeRequest('GET', '/search-loan?city=Boston', null);
    assert(
      response.status === 200 || response.status === 404,
      'SEARCH: Search by city returns 200 or 404'
    );
  } catch (err) {
    console.log(`✗ SEARCH: Search by city failed - ${err.message}`);
    failCount++;
  }

  // Test 15: Search by state
  try {
    const response = await makeRequest('GET', '/search-loan?state=MA', null);
    assert(
      response.status === 200 || response.status === 404,
      'SEARCH: Search by state returns 200 or 404'
    );
  } catch (err) {
    console.log(`✗ SEARCH: Search by state failed - ${err.message}`);
    failCount++;
  }

  // Test 16: Search by zipcode
  try {
    const response = await makeRequest('GET', '/search-loan?zipcode=02111', null);
    assert(
      response.status === 200 || response.status === 404,
      'SEARCH: Search by zipcode returns 200 or 404'
    );
  } catch (err) {
    console.log(`✗ SEARCH: Search by zipcode failed - ${err.message}`);
    failCount++;
  }

  // Test 17: Search with multiple criteria
  try {
    const response = await makeRequest('GET', '/search-loan?firstName=Jane&lastName=Doe&email=jane@example.com', null);
    assert(
      response.status === 200 || response.status === 404,
      'SEARCH: Multiple criteria returns 200 or 404'
    );
  } catch (err) {
    console.log(`✗ SEARCH: Multiple criteria test failed - ${err.message}`);
    failCount++;
  }

  // Test 18: Search without criteria
  try {
    const response = await makeRequest('GET', '/search-loan', null);
    assert(response.status === 400, 'SEARCH: No criteria returns 400');
    assert(response.body.message && response.body.message.includes('search criteria'), 'SEARCH: Error message about search criteria');
  } catch (err) {
    console.log(`✗ SEARCH: No criteria test failed - ${err.message}`);
    failCount++;
  }

  // ===== SUMMARY =====
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total:  ${passCount + failCount}\n`);

  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
