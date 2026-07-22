const mysql = require('mysql2');

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'xinguang',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// 连接池错误处理，防止未捕获异常导致进程崩溃
pool.on('error', (err) => {
  console.error('[数据库连接池错误]', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('[数据库] 连接丢失，连接池将自动重连');
  }
});

// 使用 promise 接口
const promisePool = pool.promise();

// 测试数据库连接
async function testConnection() {
  try {
    const [rows] = await promisePool.query('SELECT 1 + 1 AS result');
    console.log('[数据库] 连接成功');
  } catch (err) {
    console.error('[数据库] 连接失败:', err.message);
  }
}

testConnection();

module.exports = promisePool;
