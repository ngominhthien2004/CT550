require('dotenv').config();

const connectDB = require('./config/db');

(async () => {
    await connectDB();
    require('./server');
})();
