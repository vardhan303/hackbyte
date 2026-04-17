const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...\n');
console.log('MONGO_URI:', process.env.MONGO_URI.replace(/:([^:]+)@/, ':****@'), '\n');

async function testConnection() {
  try {
    console.log('Attempting to connect...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    });
    
    console.log('✅ SUCCESS! MongoDB connected successfully');
    console.log('Database name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(col => console.log('  -', col.name));
    
    await mongoose.connection.close();
    console.log('\nConnection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED to connect to MongoDB');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testConnection();
