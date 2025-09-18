# MTG Draft Pool Scanner

AI-powered Magic: The Gathering draft pool analyzer using Azure Document Intelligence.

## Quick Start

### 1. Backend Setup
```bash
cd mtg-scanner-backend
npm install
```

### 2. Configure Azure
Edit `.env` file with your Azure credentials:
- Get endpoint from Azure Portal → Your Document Intelligence resource → Overview
- Get API key from Keys and Endpoint section  
- Get model ID from Document Intelligence Studio

### 3. Start Backend
```bash
npm run dev
```

### 4. Frontend Setup (in another terminal)
```bash
cd mtg-scanner-frontend
npm install
npm start
```

### 5. Test
- Visit http://localhost:3000
- Upload a decklist image
- Watch the magic happen! ✨

## Project Structure
```
mtg-scanner-backend/       # Node.js API server
├── server.js             # Main API server
├── cardDatabase.js       # Card data integration
├── .env                  # Azure configuration
└── package.json

mtg-scanner-frontend/     # React app
├── src/
│   ├── App.js           # Main React component
│   └── index.js
├── public/
│   └── index.html
└── package.json
```

## Troubleshooting

### Backend won't start?
- Check your `.env` file has correct Azure values
- Make sure ports 3001 and 3000 are free

### CORS errors?
- Make sure backend is running on port 3001
- Check the proxy setting in frontend package.json

### Model not found?
- Verify your model ID in Azure Portal
- Make sure your model is trained and published

## Deployment

See deployment guide for production setup options.
