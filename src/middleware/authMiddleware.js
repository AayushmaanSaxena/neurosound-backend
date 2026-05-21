const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = async (req, res, next) => {

    //get the authorization header from the request 
    const authHeader = req.headers['authorization'];

    //check if header exists at all
    if (!authHeader) {
        return res.status(401).json({
            message: 'No token provided, Please log in'
        });
    }

    // The header looks like "Bearer TOKEN"
    // We split by space and take the second part (index 1)
    // "Bearer eyJhbG...".split(' ') = ["Bearer", "eyJhbG..."]
    const token = authHeader.split(' ')[1];

    //check if the token exists after splitting
    if (!token) {
        return res.status(401).json({
            message: 'Token missing, Please log in'
        });
    }

    // Verify the token using our JWT_SECRET
    // jwt.verify will throw an error if:
    // - the token is fake/tampered
    // - the token has expired

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded user info to the request object
        // This makes req.user available in every route handler after this middleware
        req.user = decoded;

        // Call next() to pass control to the next middleware or route handler
        next();

    }
    catch (error) {
        // if jwt.verify throws an error, it means the token is invalid or expired
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Access Token expired, Please log in again',
                expired: true
            });
        }

        return res.status(401).json({
            message: 'Invalid token, Please log in again'
        });
    }
};

module.exports = { protect };