# ShopStream (Backend) 🛒💻

**ShopStream** is the backend API for a modern e-commerce and food delivery platform. Built with **Node.js** and **Express**, it provides a robust and scalable architecture for managing users, restaurants, menus, orders, and payments.

## 🚀 Features

*   **Authentication & Authorization:**
    *   Secure user registration and login using JWT.
    *   Role-based access control (Customer, Restaurant, Admin).
*   **User Management:**
    *   Profile management.
    *   Admin controls to manage users and roles.
*   **Restaurant Management:**
    *   Restaurant registration requests and admin approval workflow.
    *   Detailed restaurant profiles with cover images.
*   **Menu System:**
    *   Comprehensive menu management (Menus, Sub-menus, and Items).
    *   Image uploads for menu items.
*   **Order Processing:**
    *   Place, track, and manage orders.
    *   Real-time status updates (Pending, In Progress, Delivered, Cancelled).
*   **Payments:**
    *   Secure payment processing using **Stripe**.
    *   Support for payment intents, confirmations, and refunds.
*   **Reviews & Ratings:**
    *   Users can review restaurants and items.
*   **File Uploads:**
    *   Integration with **Cloudinary** for managing images.

## 🛠️ Tech Stack

*   **Runtime:** [Node.js](https://nodejs.org/)
*   **Framework:** [Express.js](https://expressjs.com/)
*   **Database:** [MongoDB](https://www.mongodb.com/) (with [Mongoose](https://mongoosejs.com/))
*   **Authentication:** [JSON Web Token (JWT)](https://jwt.io/), [Bcrypt](https://www.npmjs.com/package/bcrypt)
*   **Payments:** [Stripe](https://stripe.com/)
*   **File Storage:** [Cloudinary](https://cloudinary.com/) (with [Multer](https://www.npmjs.com/package/multer))
*   **Validation:** [Express Validator](https://express-validator.github.io/)
*   **Real-time:** [Socket.io](https://socket.io/) (available dependency)
*   **Logging:** [Winston](https://github.com/winstonjs/winston), [Morgan](https://github.com/expressjs/morgan)

## 📂 Project Structure

```
├── config/             # Configuration files (DB, Multer, etc.)
├── controllers/        # Request handlers
├── middlewares/        # Custom middlewares (Auth, Roles, Uploads)
├── models/             # Mongoose schemas (User, Order, Restaurant, etc.)
├── routes/             # API Route definitions
├── utils/              # Utility functions
├── validators/         # Input validation logic
├── app.js              # Express app setup
├── server.js           # Server entry point
└── Examples.env        # Template for environment variables
```

## ⚙️ Installation & Setup

### Prerequisites

*   Node.js (v14 or higher recommended)
*   MongoDB (Local or Atlas)
*   Stripe Account
*   Cloudinary Account

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add the following variables (reference `Examples.env`):

    ```env
    PORT=3000
    MONGO_URI=your_mongodb_connection_string

    # JWT Secrets
    JWT_ACCESS_SECRET=your_access_secret
    JWT_REFRESH_SECRET=your_refresh_secret
    JWT_RESET_SECRET=your_reset_secret

    # Bcrypt
    BCRYPT_SALT_ROUNDS=10

    # Cloudinary
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # Stripe
    STRIPE_SECRET_KEY=your_stripe_secret_key

    # Frontend URL (for CORS)
    CLIENT_URL=http://localhost:4200
    ```

4.  **Start the Server:**
    ```bash
    npm start
    ```
    The server will run on `http://localhost:3000`.

## 📡 API Endpoints

### Authentication (`/api/auth`)
*   `POST /register` - Register a new user
*   `POST /login` - Login user
*   `POST /logout` - Logout user

### Admin (`/api/admin`)
*   `GET /users` - Get all users
*   `DELETE /users/:id` - Delete a user
*   `GET /restaurant-requests` - View restaurant join requests
*   `POST /restaurant-requests/:id/approve` - Approve a restaurant
*   `POST /restaurant-requests/:id/reject` - Reject a restaurant

### Restaurants (`/api/restaurants`)
*   `GET /` - List all restaurants
*   `GET /:id` - Get restaurant details
*   `POST /requests` - Request to join as a restaurant (requires `restaurant` role)

### Menu (`/api/restaurants` & `/api/menuItems`)
*   `GET /:restaurantId/menu-items` - Get menu for a restaurant
*   `POST /:restaurantId/menu` - Create a menu item
*   `PUT /:menuId/items/:id` - Update a menu item
*   `DELETE /:menuId/items/:id` - Delete a menu item

### Orders (`/api/orders`)
*   `POST /` - Place a new order
*   `GET /` - Get all orders (User specific or Admin/Restaurant view)
*   `PATCH /:id/status` - Update order status
*   `PATCH /:id/cancel` - Cancel an order

### Payments (`/api/payment`)
*   `POST /create-intent` - Create a payment intent
*   `POST /confirm-intent` - Confirm payment
*   `POST /refund/:orderId` - Process a refund

### Reviews (`/api/reviews`)
*   `POST /` - Create a review
*   `GET /` - Get all reviews
*   `PUT /:id` - Update a review

## 📄 License

This project is licensed under the **ISC License**.
