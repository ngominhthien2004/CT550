const express = require('express');
const cors = require('cors');
require('dotenv').config();

const passport = require('passport');
require('./config/passport');

const connectDB = require('./config/db');
const { getAllowedOrigins, getJwtSecret } = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
