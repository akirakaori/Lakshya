const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');


const AuthRouter = require('./Routes/AuthRouter');
const AdminRoutes = require('./Routes/AdminRoutes');
const RecruiterRoutes = require('./Routes/RecruiterRoutes');
const JobSeekerRoutes = require('./Routes/JobSeekerRoutes');


dotenv.config();
require('./models/database');
const app = express();
const port = process.env.PORT || 3000;

app.get('/ping', (req, res) => {
    res.send('pong');
});

app.use(bodyParser.json());

app.use(cors());

//Routes 
app.use('/auth', AuthRouter);
app.use('/admin', AdminRoutes);
app.use('/recruiter', RecruiterRoutes);
app.use('/jobseeker', JobSeekerRoutes);


app.get('/lakshya', (req, res) => {
    res.send('Welcome to Lakshya Backend!');
});


app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})