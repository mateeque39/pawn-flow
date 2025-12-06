const express = require('express');
const app = express();
const PORT = 5000;

console.log('⚙️ Starting minimal test server...');

app.get('/test', (req, res) => {
  console.log('📍 Test endpoint called');
  res.json({ message: 'Test successful', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED:', err);
  process.exit(1);
});

// Keep server alive
setInterval(() => {
  // Keep-alive
}, 1000);
