const express = require('express');
const app = express();
const { connectDB } = require('./config/dbConfig');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/user.route');

connectDB();
app.use(express.json());
app.use(cookieParser());
app.use('/', userRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Uber Eats Clone API');
});

module.exports = app;