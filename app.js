const express = require('express');
const app = express();
const { connectDB } = require('./config/dbConfig');

connectDB();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Uber Eats Clone API');
});

module.exports = app;