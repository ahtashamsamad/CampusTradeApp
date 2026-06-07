const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Campus Trade App API is running' });
});

// Routes
app.use('/api/listings', require('./routes/listings'));
app.use('/api/verify', require('./routes/verification'));
app.use('/api/messaging', require('./routes/messaging'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} and listening on 0.0.0.0`);
});
