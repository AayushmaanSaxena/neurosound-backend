const express  = require ('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authroutes');
const songRoutes = require('./routes/songRoutes');
const artistRoutes = require('./routes/artistRoutes');
const albumRoutes = require('./routes/albumRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const searchRoutes = require('./routes/searchRoutes');
const { authLimiter, apiLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

// Middleware
app.use(cors({
      origin: 'http://localhost:5173', // React app URL (Vite default)
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser()); // Reads cookies from incoming requests
app.use(apiLimiter); // Apply rate limiting to API routes

//routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/search', searchRoutes);
//TEST ROUTE
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to NeuroSound API!' });
});

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Catches any error that wasn't handled
// Must have 4 parameters — (err, req, res, next)
// Express identifies it as an error handler by the 4th param
// ─────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        message: 'Something went wrong. Please try again.'
    });
});

// Handle routes that don't exist
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});