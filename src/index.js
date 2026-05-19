const express  = require ('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authroutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//routes
app.use('/api/auth', authRoutes);

//TEST ROUTE
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to NeuroSound API!' });
});

// start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});