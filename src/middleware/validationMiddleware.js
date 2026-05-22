const { body , validationResult } = require('express-validator');

//---------------------------------
//Reusable validation handler
//this runs after the validation rules below 
//if there is an error, it sends them back 
//if no errors. it calls next() tp continue
//---------------------------------

const handleValidationErrors = (req, res, next) => {
    const errors  = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg
        });
    }
    next();
};

// REGISTER VALIDATION RULES

const validateRegister = [
    body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Name must be between 3 and 50 characters'),

    body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

    body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number'),

    handleValidationErrors
]

// LOGIN VALIDATION RULES
const validateLogin = [
    body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),

    body('password')
    .notEmpty().withMessage('Password is required'),

    handleValidationErrors
]
    

module.exports = {
    validateRegister,
    validateLogin
}