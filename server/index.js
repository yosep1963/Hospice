const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.post('/api/chat/send', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Mock response for now - integrate with actual AI service
    const response = {
      id: Date.now().toString(),
      content: `I understand you're asking about: "${message}". As a hospice care assistant, I'm here to provide compassionate support and information. How can I help you further?`,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || 'default'
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Documents API
app.get('/api/documents', (req, res) => {
  // Mock documents data
  const documents = [
    {
      id: '1',
      name: 'Hospice Care Guide',
      type: 'pdf',
      size: 2048000,
      category: 'guides',
      uploadedAt: new Date().toISOString(),
      url: '/documents/hospice-guide.pdf'
    },
    {
      id: '2',
      name: 'Pain Management Resources',
      type: 'pdf',
      size: 1536000,
      category: 'medical',
      uploadedAt: new Date().toISOString(),
      url: '/documents/pain-management.pdf'
    },
    {
      id: '3',
      name: 'Family Support Information',
      type: 'pdf',
      size: 1024000,
      category: 'support',
      uploadedAt: new Date().toISOString(),
      url: '/documents/family-support.pdf'
    }
  ];

  res.json(documents);
});

// Upload document endpoint
app.post('/api/documents/upload', (req, res) => {
  // Mock upload response
  res.json({
    success: true,
    document: {
      id: Date.now().toString(),
      name: 'Uploaded Document',
      type: 'pdf',
      size: 1024000,
      uploadedAt: new Date().toISOString()
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});