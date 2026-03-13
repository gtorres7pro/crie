const { Pool } = require('pg');
const connectionString = "postgresql://postgres.xtjpxemtsnulcrhwnmbg:CrieApp2026@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require";

const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection Error:', err.message);
  } else {
    console.log('Connection Success:', res.rows[0]);
  }
  pool.end();
});
