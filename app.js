// app.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const documentRoutes = require('./routes/document.routes');
const { defaultLimiter } = require('./utils/rateLimiter');
const logger = require('./utils/logger');

const app = express();

app.set('trust proxy', 1); // Trust first proxy (like Render or Netlify)

// ✅ Use morgan for HTTP request logging in dev
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ✅ In production, pipe Morgan logs to Winston
if (process.env.NODE_ENV === 'production') {
  const morganMiddleware = morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  });
  app.use(morganMiddleware);
}

app.use(defaultLimiter); // applies to everything

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
