const express = require('express');
const app = express();

// Simple test route
app.get('/test', (req, res) => {
  console.log('✅ /test endpoint called');
  res.json({ message: 'Test successful', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = 5001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log(`📝 Try: curl http://localhost:${PORT}/test`);
});

// Log when server closes
server.on('close', () => {
  console.log('❌ Server closed');
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n✋ Server shutdown requested');
  server.close(() => {
    process.exit(0);
  });
});
