const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5432/pawn_shop'
});

pool.query(
  `SELECT id, first_name, last_name, customer_id, street_address, city, state, zipcode 
   FROM loans 
   WHERE customer_id = $1 
   LIMIT 10`,
  [6],
  (err, res) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Loans for customer_id 6:');
      console.log(JSON.stringify(res.rows, null, 2));
    }
    pool.end();
  }
);
