const bcrypt = require('bcryptjs');
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

module.exports = {
    register
};
