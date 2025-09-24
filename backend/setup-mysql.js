const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupMySQL() {
  try {
    console.log('🔧 Setting up MySQL database...');
    
    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin',
      port: 3306
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS bustrack');
    console.log('✅ Database "bustrack" created/verified');

    // Use the database
    await connection.execute('USE bustrack');
    console.log('✅ Using database "bustrack"');

    // Test the connection
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database connection test successful');

    await connection.end();
    console.log('🎉 MySQL setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run db:generate');
    console.log('2. Run: npm run db:push');
    console.log('3. Run: npm run db:seed');
    console.log('4. Run: npm run dev');

  } catch (error) {
    console.error('❌ MySQL setup failed:', error.message);
    console.log('');
    console.log('Please ensure:');
    console.log('1. MySQL server is running');
    console.log('2. Username: root, Password: admin');
    console.log('3. MySQL is accessible on localhost:3306');
    process.exit(1);
  }
}

setupMySQL();
