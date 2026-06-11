// Vercel Serverless entry: re-export the Express app from backend/src/index.js
// Vercel will treat this file as a serverless function at /.api
// The backend's src/index.js already exports the Express app (module.exports = app)

const app = require('../backend/src/index.js');

// Export the app as the serverless handler
module.exports = app;
