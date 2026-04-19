require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_CONN, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 5000 })
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const users = await mongoose.connection.db.collection('users').find({
      $or: [
        { name: /Hari/i },
        { name: /Ram/i },
        { name: /Lional/i },
        { 'jobSeeker.title': /Finance manager/i },
        { 'jobSeeker.title': /Tutor/i },
        { 'jobSeeker.title': /Charter Accountant/i }
      ]
    }).toArray();
    
    console.log('Found users:', users.length);
    users.forEach(u => {
      console.log(`Name: ${u.name} | Role: ${u.role}`);
      console.log(`profileImageUrl: ${u.profileImageUrl}`);
      console.log('---------------------------');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  });
