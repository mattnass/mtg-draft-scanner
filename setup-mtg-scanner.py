#!/usr/bin/env python3
"""
MTG Draft Pool Scanner Setup Script
Creates complete project structure with backend API and frontend
"""

import os
import json
import sys
from pathlib import Path

def create_file(filepath, content):
    """Create a file with the given content"""
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created {filepath}")

def create_project_structure():
    """Create the complete project structure"""
    
    print("🚀 Setting up MTG Draft Pool Scanner...")
    print("=" * 50)
    
    # Create main directories
    os.makedirs("mtg-scanner-backend", exist_ok=True)
    os.makedirs("mtg-scanner-frontend/src", exist_ok=True)
    
    # Backend package.json
    backend_package = {
        "name": "mtg-decklist-backend",
        "version": "1.0.0",
        "description": "Backend API for MTG Draft Pool Scanner",
        "main": "server.js",
        "scripts": {
            "start": "node server.js",
            "dev": "nodemon server.js"
        },
        "dependencies": {
            "@azure/ai-form-recognizer": "^5.0.0",
            "express": "^4.18.2",
            "multer": "^1.4.5-lts.1",
            "cors": "^2.8.5",
            "dotenv": "^16.3.1"
        },
        "devDependencies": {
            "nodemon": "^3.0.1"
        }
    }
    
    create_file("mtg-scanner-backend/package.json", json.dumps(backend_package, indent=2))
    
    # Backend server.js
    server_js = '''// server.js - Node.js/Express backend for Azure Document Intelligence

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.use(express.json());

// Azure Document Intelligence configuration
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
const modelId = process.env.AZURE_MODEL_ID;

if (!endpoint || !apiKey || !modelId) {
  console.error('❌ Missing Azure configuration! Check your .env file');
  process.exit(1);
}

const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

// Endpoint to analyze MTG decklist images
app.post('/api/analyze-decklist', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log(`📸 Analyzing image: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Send image to Azure Document Intelligence
    const poller = await client.beginAnalyzeDocument(modelId, req.file.buffer);
    const result = await poller.pollUntilDone();

    console.log('✅ Analysis complete, processing results...');
    
    // Extract fields from the result
    const fields = {};
    if (result.documents && result.documents[0] && result.documents[0].fields) {
      for (const [fieldName, field] of Object.entries(result.documents[0].fields)) {
        fields[fieldName] = {
          valueString: field.value || field.content || '',
          confidence: field.confidence || 0
        };
      }
    }

    // Return in the format expected by your frontend
    const response = {
      analyzeResult: {
        documents: [{
          fields: fields
        }]
      }
    };

    console.log(`🔍 Found ${Object.keys(fields).length} fields`);
    res.json(response);

  } catch (error) {
    console.error('❌ Azure analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    model: modelId,
    endpoint: endpoint?.split('.')[0] + '...'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Azure endpoint: ${endpoint}`);
  console.log(`📋 Model ID: ${modelId}`);
  console.log(`💡 Test health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
'''
    
    create_file("mtg-scanner-backend/server.js", server_js)
    
    # Environment file template
    env_template = '''# Azure Document Intelligence Configuration
# Get these values from Azure Portal -> Your Document Intelligence Resource

# Your endpoint URL (from Overview page)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/

# Your API key (from Keys and Endpoint page)  
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-api-key-here

# Your custom model ID (from Document Intelligence Studio)
AZURE_MODEL_ID=your-custom-model-id

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Optional: Add logging level
LOG_LEVEL=info
'''
    
    create_file("mtg-scanner-backend/.env.template", env_template)
    
    # Create actual .env file
    create_file("mtg-scanner-backend/.env", env_template + "\n# TODO: Fill in your actual Azure values above!")
    
    # .gitignore
    gitignore = '''# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
'''
    
    create_file("mtg-scanner-backend/.gitignore", gitignore)
    
    # Card database utility
    card_db = '''// cardDatabase.js - Integration with Scryfall API for card data

class CardDatabase {
  constructor() {
    this.cache = new Map();
    this.baseUrl = 'https://api.scryfall.com';
  }

  // Get card by set and collector number
  async getCardBySetNumber(setCode, collectorNumber) {
    const cacheKey = `${setCode}-${collectorNumber}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/cards/${setCode}/${collectorNumber}`
      );
      
      if (!response.ok) {
        throw new Error(`Card not found: ${setCode} #${collectorNumber}`);
      }
      
      const cardData = await response.json();
      const processedCard = {
        name: cardData.name,
        colors: cardData.colors || [],
        colorIdentity: cardData.color_identity || [],
        type: cardData.type_line,
        manaCost: cardData.mana_cost,
        set: cardData.set,
        collectorNumber: cardData.collector_number,
        rarity: cardData.rarity,
        imageUrl: cardData.image_uris?.normal
      };
      
      this.cache.set(cacheKey, processedCard);
      return processedCard;
    } catch (error) {
      console.warn(`Failed to fetch card ${setCode} #${collectorNumber}:`, error);
      return {
        name: `Unknown Card #${collectorNumber}`,
        colors: [],
        colorIdentity: [],
        type: 'Unknown',
        set: setCode,
        collectorNumber: collectorNumber
      };
    }
  }

  // Map section names to set codes (customize for your set)
  getSectionMapping(section, setNumber) {
    const setCode = 'eoe'; // Replace with your actual set code
    
    return {
      setCode,
      collectorNumber: setNumber.toString().padStart(3, '0')
    };
  }
}

module.exports = CardDatabase;
'''
    
    create_file("mtg-scanner-backend/cardDatabase.js", card_db)
    
    # Frontend package.json
    frontend_package = {
        "name": "mtg-scanner-frontend",
        "version": "1.0.0",
        "private": True,
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1",
            "lucide-react": "^0.263.1"
        },
        "scripts": {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test",
            "eject": "react-scripts eject"
        },
        "eslintConfig": {
            "extends": [
                "react-app",
                "react-app/jest"
            ]
        },
        "browserslist": {
            "production": [
                ">0.2%",
                "not dead",
                "not op_mini all"
            ],
            "development": [
                "last 1 chrome version",
                "last 1 firefox version",
                "last 1 safari version"
            ]
        },
        "proxy": "http://localhost:3001"
    }
    
    create_file("mtg-scanner-frontend/package.json", json.dumps(frontend_package, indent=2))
    
    # Frontend index.html
    index_html = '''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="MTG Draft Pool Scanner - Analyze your Magic cards with AI" />
    <title>MTG Draft Pool Scanner</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
'''
    
    create_file("mtg-scanner-frontend/public/index.html", index_html)
    
    # Frontend index.js
    index_js = '''import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
'''
    
    create_file("mtg-scanner-frontend/src/index.js", index_js)
    
    # Frontend .gitignore
    create_file("mtg-scanner-frontend/.gitignore", gitignore)
    
    # Setup instructions
    readme = '''# MTG Draft Pool Scanner

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
'''
    
    create_file("README.md", readme)
    
    # Installation script
    install_script = '''#!/bin/bash
# install.sh - Quick installation script

echo "🚀 Installing MTG Scanner dependencies..."

# Backend
echo "📦 Installing backend dependencies..."
cd mtg-scanner-backend
npm install
cd ..

# Frontend  
echo "🎨 Installing frontend dependencies..."
cd mtg-scanner-frontend
npm install
cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit mtg-scanner-backend/.env with your Azure credentials"
echo "2. Start backend: cd mtg-scanner-backend && npm run dev"
echo "3. Start frontend: cd mtg-scanner-frontend && npm start" 
echo ""
echo "🔗 Backend will run on http://localhost:3001"
echo "🌐 Frontend will run on http://localhost:3000"
'''
    
    create_file("install.sh", install_script)
    
    # Make install script executable
    os.chmod("install.sh", 0o755)
    
    print("\n" + "=" * 50)
    print("🎉 Project setup complete!")
    print("\nCreated structure:")
    print("├── mtg-scanner-backend/    # Node.js API server")
    print("├── mtg-scanner-frontend/   # React app") 
    print("├── README.md               # Setup instructions")
    print("└── install.sh              # Quick install script")
    print("\nNext steps:")
    print("1. Run: chmod +x install.sh && ./install.sh")
    print("2. Edit mtg-scanner-backend/.env with your Azure credentials")
    print("3. Start both servers and test!")
    print("\n💡 See README.md for detailed instructions")

if __name__ == "__main__":
    create_project_structure()