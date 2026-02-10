const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');


const AuthRouter = require('./Routes/auth-router');
const AdminRoutes = require('./Routes/admin-routes');
const RecruiterRoutes = require('./Routes/recruiter-routes');
const JobSeekerRoutes = require('./Routes/job-seeker-routes');


dotenv.config();
require('./models/database');
const app = express();
const port = process.env.PORT || 3000;

app.get('/ping', (req, res) => {
    res.send('pong');
});

app.use(bodyParser.json());

app.use(cors());

app.use((req, res, next) => {
  console.log('=== INCOMING REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Body:', req.body);
  next();
});


//Routes 
app.use('/auth', AuthRouter);
app.use('/admin', AdminRoutes);
app.use('/recruiter', RecruiterRoutes);
app.use('/jobseeker', JobSeekerRoutes);


app.get('/lakshya', (req, res) => {
    res.send('Welcome to Lakshya Backend!');
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})