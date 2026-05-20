const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

//register user 

const register = async (req, res) => {
    //pulling iut the data that user sent
    const { name, email, password } = req.body;

    //making sure that they sen t all fields 
    if (!name || !email || !password) {
        return res.status(400).json(
            { message: 'Please provide name, email and password' }
        );
    }


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

    //make sure both fields are provided
    if (!email || !password) {
        return res.status(400).json({
            message: 'please provide both email and password'
        });
    }

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

        //create a JWT token 
        //we put the user id and email inside the token (the payload)
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }

        );
        //send back th etoken and user info
        res.status(200).json({
            message: 'Login successful',
            token,
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
    }


}

//get current user (protected)
const getMe  = async (req, res) => {

    try {
        //request user attached by the middleware
        //req.user.id is the user id  fro mteh JWT token
        const [users] = await db.query (
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
    getMe
};
