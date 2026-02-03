const mongoose = require('mongoose');
const dns = require('dns');

// MongoDB Atlas Connection URI
const MONGODB_URI = 'mongodb+srv://adminDatabase:Rb3395@dbams.kpdevvj.mongodb.net/?appName=DBAMS';

console.log('Testing MongoDB Atlas Connection...');
console.log('URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password in output

async function testConnection() {
  try {
    console.log('\nAttempting to connect...');
    
    // Configure DNS resolution for Windows
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      family: 4, // Force IPv4
    });

    console.log('\n✅ SUCCESS! MongoDB Connected');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    console.log('Connection State:', conn.connection.readyState); // 1 = connected
    
    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('\nExisting Collections:', collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None (empty database)');
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Connection closed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('\n🔍 Troubleshooting Tips:');
      console.error('1. Check your internet connection');
      console.error('2. Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
      console.error('3. Check if your network/firewall blocks MongoDB connections');
      console.error('4. Try using a VPN or different network');
      console.error('5. Verify cluster is not paused in MongoDB Atlas');
    }
    
    if (error.message.includes('authentication failed')) {
      console.error('\n🔍 Authentication Issue:');
      console.error('1. Verify username: nsdshakthi_db');
      console.error('2. Verify password: Rb33_95');
      console.error('3. Check database user permissions in MongoDB Atlas');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();
