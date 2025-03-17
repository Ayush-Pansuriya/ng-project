const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Hardcoded constants
const MONGO_URI = '';
const PORT = 5000;

// Database connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoute = require('./routes/auth');
const userRoute = require('./routes/userrout');
const productRoute = require('./routes/productrout');
const cartRoute = require('./routes/cartroute');
const orderRoute = require('./routes/orderroute');
const newOrderRoute = require('./routes/newOrderRoute');
const adminRoute = require('./routes/admin');
app.use('/assets', express.static(path.join(__dirname, '../frontend/myapp/src/assets')));
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/cart', cartRoute);
app.use('/api/orders', orderRoute);
app.use('/api/neworders', newOrderRoute);
app.use('/api/admin', adminRoute);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});