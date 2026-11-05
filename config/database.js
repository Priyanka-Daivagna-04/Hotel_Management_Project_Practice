const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_management';

    // Mask credentials for secure logging
    const maskedURI = mongoURI.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:******@');
    console.log(`[MongoDB] Initiating connection to: ${maskedURI}`);

    const options = {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(mongoURI, options);
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} | Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Runtime connection error:`, err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[MongoDB] Disconnected. Automatic reconnection in progress...`);
    });

    return conn;
  } catch (error) {
    console.error(`\n[MongoDB Atlas Connection Error]: ${error.message}`);
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error(`👉 Troubleshooting: Verify your MongoDB Atlas username and password in the MONGODB_URI.`);
      console.error(`👉 Note: If your password contains special characters (@, :, /, %, etc.), make sure they are URL-encoded.`);
    } else if (error.message.includes('whitelist') || error.message.includes('ServerSelectionError') || error.message.includes('ENOTFOUND')) {
      console.error(`👉 Troubleshooting: Check MongoDB Atlas Network Access:`);
      console.error(`   1. Go to cloud.mongodb.com -> Network Access.`);
      console.error(`   2. Ensure your current IP address (or 0.0.0.0/0 for AWS) is added to the IP Access List.`);
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
