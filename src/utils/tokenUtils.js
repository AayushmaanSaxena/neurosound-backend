const jwt = require('jsonwebtoken');
const db  = require('../config/db');

//create a short lived acces token (15 minutes) 
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
}

// Creates a long-lived refresh token (30 days)
// and saves it to the database
const generateRefreshToken  =async (user) => {
    const token  =jwt.sign(
        { id: user.id},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
    );

     // Calculate expiry date — 30 days from now
     const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Add 30 days

    // Save the refresh token in the database
    await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt]
    );

    return token;
};

//send the refresh token as an httpOnly cookie
const sendRefreshToken = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true, // Not accessible via JavaScript
        secure: false, // set to true in production (http only)
        sameSite: 'lax', // CSRF protection
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
        });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    sendRefreshToken
}