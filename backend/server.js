const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const passport = require('passport');
require('./config/passport');

const connectDB = require('./config/db');
const { getAllowedOrigins, getJwtSecret } = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { verifyToken } = require('./middlewares/auth.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const artworkRoutes = require('./routes/artwork.routes');
const commentRoutes = require('./routes/comment.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');
const likeRoutes = require('./routes/like.routes');
const feedRoutes = require('./routes/feed.routes');
const tagRoutes = require('./routes/tag.routes');
const notificationRoutes = require('./routes/notification.routes');
const messageRoutes = require('./routes/message.routes');
const aiRoutes = require('./routes/ai.routes');
const requestRoutes = require('./routes/request.routes');
const settingRoutes = require('./routes/setting.routes');
const seriesRoutes = require('./routes/series.routes');
const userReportRoutes = require('./routes/userReport.routes');
const bannerRoutes = require('./routes/banner.routes');
const path = require('path');

// Force IPv4 DNS resolution to avoid timeout issues with IPv6 (e.g., HuggingFace API)
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = getAllowedOrigins();
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

getJwtSecret();

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && (allowedOrigins.includes(origin) || isLocalDevOrigin(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (process.env.NODE_ENV !== 'production') {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    return next();
});
app.use(express.json());
app.use(passport.initialize());

// Connect to MongoDB
connectDB();

app.get('/api', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/user-reports', userReportRoutes);
app.use('/api/banners', bannerRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../frontend/dist');
    const fs = require('fs');
    if (fs.existsSync(frontendDist)) {
        app.use(express.static(frontendDist));
        // SPA fallback — Express 5 does not support `app.get('*', ...)`, use app.use
        app.use((req, res) => {
            res.sendFile(path.join(frontendDist, 'index.html'));
        });
    }
}

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        credentials: true,
    },
});

// Socket.IO JWT authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            console.log('[Socket] No token provided');
            return next(new Error('Authentication required'));
        }

        const jwt = require('jsonwebtoken');
        const JWT_SECRET = getJwtSecret();
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[Socket] Token decoded:', decoded.id);

        const User = require('./models/User');
        const user = await User.findById(decoded.id).select('_id username role');
        if (!user) {
            console.log('[Socket] User not found');
            return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        console.log('[Socket] Authenticated user:', socket.userId);
        next();
    } catch (error) {
        console.log('[Socket] Auth error:', error.message);
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // If admin, join admin room
    if (socket.userRole === 'admin') {
        socket.join('admins');
    }

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
    });
});

// Make io accessible throughout the app
module.exports = { app, server, io };

// Pass Socket.IO to notification utility
const { setSocketIO } = require('./utils/notification');
setSocketIO(io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
