const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { generateAccessToken, generateRefreshToken, sendRefreshToken } = require('../utils/tokenUtils');

//register user 

const register = async (req, res) => {
    //pulling iut the data that user sent
    const { name, email, password } = req.body;

    //checking  if teh email already exists in the database 
    try {
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        if (existingUser.length > 0) {
            return res.status(400).json(
                { message: 'An account with this email already exists' }
            );
        }

        //hashing the password before saving 
        //the number 10 is the salt rounds, which determines how secure the hash will be (higher is more secure but slower)
        const hashedPassword = await bcrypt.hash(password, 10);

        //insert teh new user into teh database
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        //send back success response
        res.status(201).json(
            {
                message: 'User registered successfully',
                userId: result.insertId
            }
        );
    }
    catch (error) {
        //if anything goes wrong, ctach the error and send back a 500 response
        console.error('Error registering user:', error);
        res.status(500).json(
            { message: 'Server error. Please try again.' }
        );
    }
};

//Login user
const login = async (req, res) => {

    //pull out email and password from the request
    const { email, password } = req.body;

    try {
        //find the user in the database by email
        const [users] = await db.query(
            'select * from users where email = ?',
            [email]
        );

        //if no user found with that email
        if (users.length === 0) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        //compare the provided password with the hashed password in the database
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Generate both tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        // Send refresh token as HTTP-only cookie
        sendRefreshToken(res, refreshToken);

        //send back the access token and user info
        res.status(200).json({
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profile_image: user.profile_image
            }
        });

    }
    catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({
            message: 'Server error. Please try again.'
        });
    };
}
//REFRESH - issues a new access token using the refresh token
const refresh = async (req, res) => {

    //the refresh token comes from the HTTP-only cookie
    const token = req.cookies.refreshToken;

    if (!token) {
        return res.status(401).json({
            message: 'No refresh token provided. Please log in'
        });
    }

    try {
        //verify the refresh token signature 
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        //check if the token exists in the database (in case it was revoked)
        const [tokens] = await db.query(
            'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?',
            [token, decoded.id]
        );

        if (tokens.length === 0) {
            return res.status(401).json({
                message: 'Invalid refresh token. Please log in'
            });
        }

        //check if it has expired in  database
        const storedToken = tokens[0];
        if (new Date() > new Date(storedToken.expires_at)) {
            //delete the expired token from the database
            await db.query(
                'DELETE FROM refresh_tokens WHERE id = ?',
                [storedToken.id]
            );
            return res.status(401).json({
                message: 'Refresh token expired. Please log in again'
            });
        }

        // get the user from the database
        const [users] = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [decoded.id]
        );
        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        //generate a new access token
        const newAccessToken = generateAccessToken(users[0]);

        //send back the new access token
        res.status(200).json({
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(401).json({
            message: 'Invalid refresh token. Please log in again'
        });
    }
};

//Logout - deletes the refresh token from the database and clears the cookie
const logout = async (req, res) => {
    const token = req.cookies.refreshToken;

    if (token) {
        // Delete from database — this is what "invalidates" the session
        await db.query(
            'DELETE FROM refresh_tokens WHERE token = ?',
            [token]
        );
    }

    // Clear the cookie from the browser
    res.clearCookie('refreshToken');

    res.status(200).json({ message: 'Logged out successfully' });

}

//get current user (protected)
const getMe = async (req, res) => {

    try {
        //request user attached by the middleware
        //req.user.id is the user id  fro mteh JWT token
        const [users] = await db.query(
            'SELECT id, name, email, profile_image, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        //notice we only send back the id, name, email and profile image, 
        // not the password or any sensitive info
        res.status(200).json({
            user: users[0]
        });
    }
    catch (error) {
        console.error('Get me error: ', error);
        res.status(500).json({
            message: 'Server error. Please try again.'
        });
    }
}


module.exports = {
    register,
    login,
    getMe,
    refresh,
    logout
};
