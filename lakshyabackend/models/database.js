const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS to use IPv4first and Google's DNS servers
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongo_url = process.env.MONGO_CONN;

if (!mongo_url) {
    console.error('MONGO_CONN is not set in environment variables.');
}

const mongooseOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
};

mongoose.connect(mongo_url, mongooseOptions)
    .then(() => {
        console.log('Connected to MongoDB...');
    }).catch((err) => {
        if (err?.code === 'ECONNREFUSED' && err?.syscall === 'querySrv') {
            console.error('Error connecting to MongoDB: DNS SRV lookup failed.');
            console.error('Check internet/DNS access, or use a non-SRV MongoDB URI in MONGO_CONN.');
        }
        console.error('Error connecting to MongoDB', err);
    })