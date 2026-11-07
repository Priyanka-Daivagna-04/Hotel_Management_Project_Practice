const session = require('express-session');
const connectMongo = require('connect-mongo');

// Handle both CJS and ESM interop across connect-mongo versions (v5 and v6)
const MongoStore = connectMongo.MongoStore || connectMongo.default || connectMongo;

const configureSession = () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_management';
  const isProd = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'hotel_secret_key_change_in_production_98765',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.SECURE_COOKIE === 'true', // false on HTTP Elastic Beanstalk domain
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: 'lax'
    }
  };

  // In test environment, use default memory store for instantaneous tests
  if (!isTest && typeof MongoStore.create === 'function') {
    sessionConfig.store = MongoStore.create({
      mongoUrl: mongoURI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24, // 1 day
      autoRemove: 'native'
    });
  }

  return session(sessionConfig);
};

module.exports = configureSession;
