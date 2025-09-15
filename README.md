# Hospice Care Assistant PWA

## Version 1.3.2

A Progressive Web Application for hospice care support and information assistance.

## Features

- 💬 AI-powered chat interface for hospice care questions
- 📄 Document management system for important files
- 📱 PWA support with offline capabilities
- 🔒 Secure and private conversations
- 📲 Mobile-friendly responsive design
- 🌐 Cross-platform compatibility

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Install server dependencies:
```bash
cd server && npm install && cd ..
```

3. Set up environment variables:
   - Copy `server/.env.example` to `server/.env`
   - Add your API keys and configuration

### Development

Run both frontend and backend:
```bash
npm start
```

Or run them separately:

Frontend only:
```bash
npm run dev
```

Backend only:
```bash
npm run server
```

### Production Build

```bash
npm run build
```

The built files will be in the `dist` folder.

## Deployment

### Vercel
The project is configured for Vercel deployment with `vercel.json`.

### Other Platforms
- Build the project: `npm run build`
- Deploy the `dist` folder to your hosting service
- Ensure service worker headers are properly configured

## Project Structure

```
hospice-chatbot-pwa/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   └── App.tsx         # Main app component
├── server/             # Backend server
│   └── index.js        # Express server
├── public/             # Static assets
│   ├── sw.js          # Service worker
│   └── manifest.json   # PWA manifest
└── dist/              # Production build
```

## Technologies Used

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Express.js backend
- PWA with service workers
- React Router for navigation

## License

MIT
