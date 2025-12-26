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
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})