const User = require('../models/user.model.js');
const hashPassword = require('../utils/hashPassword.js');
const jwt = require('../utils/jwt.js');
const cookie = require('../utils/cookie.js');

exports.register = async (req, res) => {
    try {
        const {username , email , password} = req.body;
        let {name} = req.body;

        // Validate required fields
        if(!username || !email || !password){
            return res.status(400).json({ message: 'All fields are required' });
        }
        if(!name) {
            name = username; // Default name
        }

        // Check if the username or email already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await hashPassword.hash(password);
        
        // Create a new user
        name = name.trim();
        const user = new User({name,username,email,password:hashedPassword});
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


exports.login = async (req, res) => {
    try {
        if(req.user) {
            return res.status(400).json({
                message: 'User already logged in',
                login: true,
                user: {
                    name: req.user.name,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role,
                }
            });
        }

        const { username, password } = req.body;

        // Validate required fields
        if(!username || !password){
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            user = await User.findOne({ email:username });
        }
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        // Compare the provided password with the stored hashed password
        const isPasswordValid = await hashPassword.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Generate JWT tokens
        // Set cookies for access and refresh tokens
        cookie.setCookie(res , 'accessToken', jwt.generateAccessToken(user), 60*1000);
        user.refreshToken = jwt.generateRefreshToken(user);
        user.sessionExpiry = Date.now() + 60*60*24*7*1000;
        await user.save();

        // Respond with user details and access token
        return res.status(200).json({
            message: 'Login successful',
            user: {
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            token: jwt.generateAccessToken(user)
        });

    }
    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.logout = async (req, res) => {
    try {
        const currentUser = req.user;
        if(!currentUser) {
            return res.status(400).json({
                message: 'User not logged in' , 
                login:false
            });
        }
        let user = await User.findById(currentUser.id);
        user.refreshToken = '';
        user.sessionExpiry = Date.now();
        await user.save();
        cookie.clearCookie(res,'accessToken');
        res.status(200).json({ message: 'Logout successful' });
    }
    catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}