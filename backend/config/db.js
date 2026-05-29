const mongoose = require('mongoose');
const dns = require('dns');

// Override DNS servers to avoid ECONNREFUSED on SRV lookups from local DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ct550';
        const conn = await mongoose.connect(uri, {
            retryWrites: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
