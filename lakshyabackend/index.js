const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const AuthRouter = require('./Routes/AuthRouter');

dotenv.config();
require('./models/database');
const app = express();
const port = process.env.PORT || 3000;

app.get('/ping', (req, res) => {
    res.send('pong');
});

app.use(bodyParser.json());

app.use(cors());

app.use('/auth',AuthRouter);


app.get('/lakshya', (req, res) => {
    res.send('Welcome to Lakshya Backend!');
});

// SIGNUP API (THIS IS IMPORTANT)
// app.post('/auth/signup', (req, res) => {
//   const { name, email, number, password } = req.body;

//   if (!name || !email || !number || !password) {
//     return res.status(400).json({
//       success: false,
//       message: 'All fields are required',
//     });
//   }

//   return res.status(201).json({
//     success: true,
//     message: 'Signup successful',
//     data: { name, email },
//   });
// });



app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})