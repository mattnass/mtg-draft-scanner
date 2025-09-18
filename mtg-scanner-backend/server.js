// server.js - Node.js/Express backend for Azure Document Intelligence

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
    
    // Extract fields from the result with detailed logging
    const fields = {};
    if (result.documents && result.documents[0] && result.documents[0].fields) {
      console.log('\n🔍 RAW AZURE RESPONSE:');
      console.log('Number of documents:', result.documents.length);
      console.log('Document 0 fields:', Object.keys(result.documents[0].fields));
      
      for (const [fieldName, field] of Object.entries(result.documents[0].fields)) {
        console.log(`\n📋 Field: ${fieldName}`);
        console.log('  - Value:', field.value);
        console.log('  - Content:', field.content);
        console.log('  - Confidence:', field.confidence);
        console.log('  - Type:', field.kind);
        
        fields[fieldName] = {
          valueString: field.value || field.content || '',
          confidence: field.confidence || 0
        };
      }
    } else {
      console.log('❌ No documents or fields found in Azure response');
      console.log('Full result structure:', JSON.stringify(result, null, 2));
    }

    // Return in the format expected by your frontend
    const response = {
      analyzeResult: {
        documents: [{
          fields: fields
        }]
      }
    };

    console.log(`\n📊 SUMMARY:`);
    console.log(`Found ${Object.keys(fields).length} total fields`);
    console.log('Field names:', Object.keys(fields).slice(0, 10), Object.keys(fields).length > 10 ? '...' : '');
    
    res.json(response);

  } catch (error) {
    console.error('❌ Azure analysis error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
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