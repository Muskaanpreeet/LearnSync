const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// 1. Connect to MongoDB before anything else
connectDB();

const app = express();

// 2. Core middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // allow cookies (used for refresh-token style flows)
  })
);
app.use(express.json()); // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// 3. Health check — useful to verify the API is alive during grading/demo
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'LearnSync API is running' });
});

// 4. Routes (mounted incrementally as each module is built)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// 5. 404 + centralized error handler (always last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`LearnSync running on port ${PORT}`);
});
