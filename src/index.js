const express  = require ('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authroutes');

const app = express();

// Middleware
app.use(cors({
      origin: 'http://localhost:5173', // React app URL (Vite default)
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser()); // Reads cookies from incoming requests

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