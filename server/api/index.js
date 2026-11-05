/**
 * Vercel Serverless Entry Point
 * Vercel invokes this file for every /api/* request.
 * It simply re-exports the configured Express app from server.js.
 */
const app = require('../server');

module.exports = app;
