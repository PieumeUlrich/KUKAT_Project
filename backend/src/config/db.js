
import 'dotenv/config';
import sql from 'mssql';

/********** CONFIGURATION AZURE SERVER CONNECTION **********/
const config = {
  server:   process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt:              process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
    enableArithAbort:     true,
  },
  pool: {
    max:              10,
    min:              0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout:    30000,
};


let pool = null;

const getPool = async () => {
  
  
  
  if (pool) return pool;
  pool = await sql.connect(config);
  pool.on('error', (err) => {
    console.error('SQL Pool error:', err);
    pool = null;
  });
  return pool;
}

const query = async (text, params = {}) => {
  const p   = await getPool();
  const req = p.request();
  for (const [key, { type, value }] of Object.entries(params)) {
    req.input(key, type, value);
  }
  return req.query(text);
}

export { sql, getPool, query };
