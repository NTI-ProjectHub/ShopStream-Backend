const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const cors = require('cors');
const { connectDB } = require('./config/db.Config');
const userRouter = require('./routes/user.route');
const restaurantRouter = require('./routes/restaurant.route');
const orderRouter = require('./routes/order.route');
const menuRouter = require('./routes/menu.route');
const menuItemRouter = require('./routes/menuItem.route');
const initial = require('./utils/initial');

connectDB();

// initail data
//initial.all();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use('/api/auth', userRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/menus' , menuRouter);
app.use('/api/menuItems' , menuItemRouter);
app.use('/api/restaurants', menuRouter);
app.use('/api/orders' , orderRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Uber Eats Clone API');
});

module.exports = app;