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
const reviewRouter = require('./routes/review.route');
const adminRouter = require('./routes/admin.route');
const paymentRouter = require('./routes/payment.route');
const initial = require('./utils/initial');

connectDB();

// initail data
//initial.seedAll();

// Middlewares
const allowedOrigins = [
  "http://localhost:4200",
  "https://your-frontend-domain.com"
];


app.use(cors({
  origin: 'http://localhost:4200', // Specify your Angular app’s origin
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// app.use(cors({
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use('/api/auth', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/restaurants', menuRouter);
app.use('/api/menuItems' , menuItemRouter);
app.use('/api/orders' , orderRouter);
app.use('/api/reviews' , reviewRouter);
app.use('/api/payment', paymentRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Uber Eats Clone API');
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  // Default values
  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  // Log error in server console
  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Send response (structured JSON)
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }) // show stack only in dev
  });
});

module.exports = app;