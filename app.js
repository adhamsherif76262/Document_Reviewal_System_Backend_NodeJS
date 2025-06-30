// app.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const documentRoutes = require('./routes/document.routes');

const app = express();

// Middleware: Enable CORS for cross-origin requests (Netlify → Render)
app.use(cors());

// Middleware: Parse incoming JSON requests (application/json)
app.use(express.json());

// Middleware: Log HTTP requests in dev format
app.use(morgan('dev'));

// Route Test: Health check or API landing
app.get('/', (req, res) => {
  res.send('✅ Document Review API is up and running...');
});

// Route Placeholder (real routes will be added later)
// app.use('/api/users', require('./routes/user.routes'));
// Mount user routes
app.use('/api/users', require('./routes/user.routes'));

app.use('/api/documents', documentRoutes);

app.use('/api/admin', require('./routes/admin.routes'));

app.use('/api/admin/logs', require('./routes/log.routes'));

app.use('/api/reviews/', require('./routes/reviewRoutes'));

module.exports = app;
