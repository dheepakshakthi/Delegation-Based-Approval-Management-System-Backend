const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    // Configure DNS resolution for Windows compatibility
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      family: 4, // Force IPv4
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    if (collections.length > 0) {
      console.log(`📁 Collections: ${collections.map(c => c.name).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('\n🔍 Troubleshooting Tips:');
      console.error('1. Check your internet connection');
      console.error('2. Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
      console.error('3. Check if your network/firewall blocks MongoDB connections');
      console.error('4. Verify cluster is not paused in MongoDB Atlas');
    }
    
    if (error.message.includes('authentication failed')) {
      console.error('\n🔍 Authentication Issue:');
      console.error('1. Verify username and password in MONGODB_URI');
      console.error('2. Check database user permissions in MongoDB Atlas');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
