import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertCircle, Edit3, Check, Plus, Trash2 } from 'lucide-react';
import { getCardName } from './cardDatabase.js';



function MTGDecklistApp() {
  const [image, setImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Image compression function to handle mobile photos
  const compressImage = async (file, maxSizeMB = 3.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Start with original dimensions if reasonable, or scale down
        let { width, height } = img;
        const maxDimension = 2000; // Allow larger images for better text quality
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality and adjust if needed
        const targetSize = maxSizeMB * 1024 * 1024;
        let quality = 0.9;
        
        const tryCompress = (qual) => {
          canvas.toBlob((blob) => {
            console.log(`Quality ${qual}: ${Math.round(blob.size/1024)}KB`);
            if (blob.size > targetSize && qual > 0.6) {
              tryCompress(qual - 0.1);
            } else {
              resolve(blob);
            }
          }, 'image/jpeg', qual);
        };
        
        tryCompress(quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Parse Azure Document Intelligence response
  const parseAzureResponse = (azureResponse) => {
    console.log('Parsing Azure response:', azureResponse);
    
    const cardMap = new Map();
    const fields = azureResponse.analyzeResult?.documents?.[0]?.fields || {};
    
    console.log('Available fields:', Object.keys(fields));
    
    Object.entries(fields).forEach(([fieldName, fieldData]) => {
      console.log(`Processing field: ${fieldName}`, fieldData);
      
      // Parse field names like "white_total_31" or "blue_played_46"
      const match = fieldName.match(/^(\w+)_(total|played)_(\d+)$/);
      if (match && fieldData.valueString && fieldData.valueString !== '(Not found)') {
        const [, section, type, setNumber] = match;
        
        // Apply OCR corrections for quantities - ensure it's a string first
        let quantity = String(fieldData.valueString || '');
        quantity = quantity.replace(/[li|I]/g, '1');
        quantity = quantity.replace(/[Oo]/g, '0');
        quantity = quantity.replace(/[Ss]/g, '5');
        quantity = quantity.replace(/22/g, '2');      // 22 -> 2
        quantity = quantity.replace(/33/g, '3');      // 33 -> 3
        quantity = quantity.replace(/44/g, '4');      // 44 -> 4
        
        const cardKey = `${section}_${setNumber}`;
        
        // Use card database for name
        const cardName = getCardName(section, parseInt(setNumber));
        
        console.log(`Found card: ${cardKey} = ${cardName} (${type}: ${quantity})`);
        
        // Group by card, tracking both total and played quantities
        if (!cardMap.has(cardKey)) {
          cardMap.set(cardKey, {
            section,
            setNumber: parseInt(setNumber),
            name: cardName,
            total: 0,
            played: 0,
            totalConfidence: 0,
            playedConfidence: 0
          });
        }
        
        const card = cardMap.get(cardKey);
        if (type === 'total') {
          card.total = parseInt(quantity) || 0;
          card.totalConfidence = fieldData.confidence || 0;
        } else if (type === 'played') {
          card.played = parseInt(quantity) || 0;
          card.playedConfidence = fieldData.confidence || 0;
        }
      } else {
        console.log(`Skipping field ${fieldName}:`, fieldData.valueString);
      }
    });
    
    // Convert map to array and calculate derived values
    const parsedCards = Array.from(cardMap.values()).map(card => ({
      ...card,
      sideboard: Math.max(0, card.total - card.played) // Calculate sideboard count
    }));
    
    console.log('Parsed cards:', parsedCards);
    return parsedCards;
  };

  // Real Azure API call through backend
  const analyzeImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch('https://mtg-draft-scanner-production.up.railway.app/api/analyze-decklist', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Azure analysis result:', result);
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    console.log(`Original file: ${file.name}`);
    console.log(`File type: ${file.type}`);
    console.log(`File size: ${file.size} bytes (${Math.round(file.size/1024)}KB)`);
    
    setImage(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setDebugInfo(null);
    
    try {
      let fileToSend = file;
      const fileSizeKB = Math.round(file.size / 1024);
      
      // Only compress if over 3MB (3072KB) to preserve quality for OCR
      if (file.size > 3145728) { // 3MB in bytes
        console.log(`File is ${fileSizeKB}KB, compressing...`);
        fileToSend = await compressImage(file);
        console.log(`After compression: ${Math.round(fileToSend.size/1024)}KB`);
      } else {
        console.log(`File is ${fileSizeKB}KB, sending original (under 3MB)`);
      }
      
      const azureResponse = await analyzeImage(fileToSend);
      setDebugInfo({
        totalFields: Object.keys(azureResponse.analyzeResult?.documents?.[0]?.fields || {}).length,
        fieldNames: Object.keys(azureResponse.analyzeResult?.documents?.[0]?.fields || {}).slice(0, 10),
        originalSize: file.size,
        compressedSize: fileToSend.size
      });
      
      const parsedCards = parseAzureResponse(azureResponse);
      
      // Calculate totals
      const totalCards = parsedCards.reduce((sum, card) => sum + card.total, 0);
      const totalMainboard = parsedCards.reduce((sum, card) => sum + card.played, 0);
      const totalSideboard = parsedCards.reduce((sum, card) => sum + card.sideboard, 0);
      
      setResults({
        cards: parsedCards,
        totalCards,
        totalMainboard,
        totalSideboard
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Failed to analyze image: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  // Update card quantities
  const updateCard = (cardIndex, field, value) => {
    const updatedCards = [...results.cards];
    const card = updatedCards[cardIndex];
    
    // Parse and validate the input
    const numValue = Math.max(0, parseInt(value) || 0);
    card[field] = numValue;
    
    // Recalculate derived values
    if (field === 'total' || field === 'played') {
      card.sideboard = Math.max(0, card.total - card.played);
    }
    
    // Recalculate totals
    const totalCards = updatedCards.reduce((sum, c) => sum + c.total, 0);
    const totalMainboard = updatedCards.reduce((sum, c) => sum + c.played, 0);
    const totalSideboard = updatedCards.reduce((sum, c) => sum + c.sideboard, 0);
    
    setResults({
      ...results,
      cards: updatedCards,
      totalCards,
      totalMainboard,
      totalSideboard
    });
  };

  // Update card name
  const updateCardName = (cardIndex, newName) => {
    const updatedCards = [...results.cards];
    updatedCards[cardIndex].name = newName;
    setResults({ ...results, cards: updatedCards });
  };

  // Remove a card entirely
  const removeCard = (cardIndex) => {
    const updatedCards = results.cards.filter((_, index) => index !== cardIndex);
    
    const totalCards = updatedCards.reduce((sum, c) => sum + c.total, 0);
    const totalMainboard = updatedCards.reduce((sum, c) => sum + c.played, 0);
    const totalSideboard = updatedCards.reduce((sum, c) => sum + c.sideboard, 0);
    
    setResults({
      ...results,
      cards: updatedCards,
      totalCards,
      totalMainboard,
      totalSideboard
    });
  };

  // Add a new card manually
  const addCard = () => {
    const newCard = {
      section: 'white',
      setNumber: 1,
      name: 'New Card',
      total: 1,
      played: 1,
      sideboard: 0,
      totalConfidence: 1.0,
      playedConfidence: 1.0
    };
    
    const updatedCards = [...results.cards, newCard];
    
    const totalCards = updatedCards.reduce((sum, c) => sum + c.total, 0);
    const totalMainboard = updatedCards.reduce((sum, c) => sum + c.played, 0);
    const totalSideboard = updatedCards.reduce((sum, c) => sum + c.sideboard, 0);
    
    setResults({
      ...results,
      cards: updatedCards,
      totalCards,
      totalMainboard,
      totalSideboard
    });
  };


  const getCardNameColor = (section) => {
    const colors = {
      white: 'text-yellow-700',
      blue: 'text-blue-700',
      black: 'text-gray-900',
      red: 'text-red-700', 
      green: 'text-green-700',
      colorless: 'text-gray-600',
      multi: 'text-purple-700',
      artifact: 'text-amber-700',
      nonbasic: 'text-stone-700',
      stellar_sights_1: 'text-indigo-700',
      stellar_sights_2: 'text-indigo-700',
      basic_lands: 'text-green-600'
    };
    return colors[section] || 'text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
          <h1 className="text-lg font-bold">MTG Draft Pool Scanner</h1>
        </div>

        {/* Upload Section */}
        <div className="p-4">
          {!image && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors"
              >
                <Camera size={16} />
                Camera
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm flex items-center justify-center gap-1 hover:bg-gray-700 transition-colors"
              >
                <Upload size={16} />
                Upload
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Image Preview */}
          {image && (
            <div className="mb-4">
              <img
                src={image}
                alt="Decklist preview"
                className="w-full rounded shadow max-h-48 object-contain"
              />
              <button
                onClick={() => {
                  setImage(null);
                  setResults(null);
                  setError(null);
                  setIsEditing(false);
                  setDebugInfo(null);
                }}
                className="mt-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Upload different image
              </button>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing decklist...</p>
            </div>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-xs">
              <div className="font-medium text-blue-800">Debug Info:</div>
              <div>Total fields found: {debugInfo.totalFields}</div>
              <div>Sample field names: {debugInfo.fieldNames.join(', ')}</div>
              {debugInfo.originalSize && (
                <div>Image compressed: {Math.round(debugInfo.originalSize / 1024)}KB → {Math.round(debugInfo.compressedSize / 1024)}KB</div>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700 mb-4">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              {/* Compact Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-blue-800">{results.totalCards} drafted</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({results.totalMainboard} in deck + {results.totalSideboard} bench)
                  </span>
                </div>
              </div>

              {/* Card Lists */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-800">
                    Mainboard ({results.totalMainboard})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                        isEditing 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {isEditing ? <Check size={12} /> : <Edit3 size={12} />}
                      {isEditing ? 'Done' : 'Edit'}
                    </button>
                    {isEditing && (
                      <button
                        onClick={addCard}
                        className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 transition-colors"
                      >
                        <Plus size={12} />
                        Add
                      </button>
                    )}
                  </div>
                </div>

                {/* Mainboard Table - Two Columns */}
                <div className="bg-gray-50 rounded border overflow-hidden">
                  <div className="bg-gray-100 px-3 py-2 border-b text-xs font-medium text-gray-600 grid grid-cols-2 gap-4">
                    <div className="grid grid-cols-4 gap-1">
                      <div className="col-span-1 text-center">Count</div>
                      <div className="col-span-3">Card Name</div>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <div className="col-span-1 text-center">Count</div>
                      <div className="col-span-3">Card Name</div>
                    </div>
                  </div>
                  
                  {/* Split cards into two columns */}
                  {(() => {
                    const mainboardCards = results.cards.filter(card => card.played > 0);
                    if (mainboardCards.length === 0) {
                      return (
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                          No cards in mainboard
                        </div>
                      );
                    }
                    
                    const midpoint = Math.ceil(mainboardCards.length / 2);
                    const leftColumn = mainboardCards.slice(0, midpoint);
                    const rightColumn = mainboardCards.slice(midpoint);
                    const maxRows = Math.max(leftColumn.length, rightColumn.length);
                    
                    const rows = [];
                    for (let i = 0; i < maxRows; i++) {
                      const leftCard = leftColumn[i];
                      const rightCard = rightColumn[i];
                      const leftOriginalIndex = leftCard ? results.cards.findIndex(c => c === leftCard) : -1;
                      const rightOriginalIndex = rightCard ? results.cards.findIndex(c => c === rightCard) : -1;
                      
                      rows.push(
                        <div key={i} className="px-3 py-2 border-b border-gray-200 last:border-b-0 grid grid-cols-2 gap-4 items-center text-sm hover:bg-gray-50">
                          {/* Left Column */}
                          <div className="grid grid-cols-4 gap-1">
                            {leftCard ? (
                              <>
                                <div className="col-span-1 text-center">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min="0"
                                      value={leftCard.played}
                                      onChange={(e) => updateCard(leftOriginalIndex, 'played', e.target.value)}
                                      className="w-full text-center text-sm border border-gray-300 rounded px-1 py-0.5"
                                    />
                                  ) : (
                                    <span className="font-medium">{leftCard.played}</span>
                                  )}
                                </div>
                                <div className="col-span-3">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={leftCard.name}
                                        onChange={(e) => updateCardName(leftOriginalIndex, e.target.value)}
                                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-0.5"
                                        placeholder="Card name"
                                      />
                                      <button
                                        onClick={() => removeCard(leftOriginalIndex)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Remove card"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`font-medium ${getCardNameColor(leftCard.section)}`}>{leftCard.name}</span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="col-span-4"></div>
                            )}
                          </div>
                          
                          {/* Right Column */}
                          <div className="grid grid-cols-4 gap-1">
                            {rightCard ? (
                              <>
                                <div className="col-span-1 text-center">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min="0"
                                      value={rightCard.played}
                                      onChange={(e) => updateCard(rightOriginalIndex, 'played', e.target.value)}
                                      className="w-full text-center text-sm border border-gray-300 rounded px-1 py-0.5"
                                    />
                                  ) : (
                                    <span className="font-medium">{rightCard.played}</span>
                                  )}
                                </div>
                                <div className="col-span-3">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={rightCard.name}
                                        onChange={(e) => updateCardName(rightOriginalIndex, e.target.value)}
                                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-0.5"
                                        placeholder="Card name"
                                      />
                                      <button
                                        onClick={() => removeCard(rightOriginalIndex)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Remove card"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`font-medium ${getCardNameColor(rightCard.section)}`}>{rightCard.name}</span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="col-span-4"></div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return rows;
                  })()}
                </div>

                {/* Sideboard Section */}
                {results.cards.some(card => card.sideboard > 0) && (
                  <>
                    <h3 className="font-medium text-gray-800 mt-4">
                      Sideboard ({results.totalSideboard})
                    </h3>
                    
                    <div className="bg-gray-50 rounded border overflow-hidden">
                      <div className="bg-gray-100 px-3 py-2 border-b text-xs font-medium text-gray-600 grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-4 gap-1">
                          <div className="col-span-1 text-center">Count</div>
                          <div className="col-span-3">Card Name</div>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          <div className="col-span-1 text-center">Count</div>
                          <div className="col-span-3">Card Name</div>
                        </div>
                      </div>
                      
                      {/* Split sideboard cards into two columns */}
                      {(() => {
                        const sideboardCards = results.cards.filter(card => card.sideboard > 0);
                        const midpoint = Math.ceil(sideboardCards.length / 2);
                        const leftColumn = sideboardCards.slice(0, midpoint);
                        const rightColumn = sideboardCards.slice(midpoint);
                        const maxRows = Math.max(leftColumn.length, rightColumn.length);
                        
                        const rows = [];
                        for (let i = 0; i < maxRows; i++) {
                          const leftCard = leftColumn[i];
                          const rightCard = rightColumn[i];
                          
                          rows.push(
                            <div key={i} className="px-3 py-2 border-b border-gray-200 last:border-b-0 grid grid-cols-2 gap-4 items-center text-sm hover:bg-gray-50">
                              {/* Left Column */}
                              <div className="grid grid-cols-4 gap-1">
                                {leftCard ? (
                                  <>
                                    <div className="col-span-1 text-center">
                                      <span className="font-medium text-gray-600">{leftCard.sideboard}</span>
                                    </div>
                                    <div className="col-span-3">
                                      <span className={`${getCardNameColor(leftCard.section)}`}>{leftCard.name}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="col-span-4"></div>
                                )}
                              </div>
                              
                              {/* Right Column */}
                              <div className="grid grid-cols-4 gap-1">
                                {rightCard ? (
                                  <>
                                    <div className="col-span-1 text-center">
                                      <span className="font-medium text-gray-600">{rightCard.sideboard}</span>
                                    </div>
                                    <div className="col-span-3">
                                      <span className={`${getCardNameColor(rightCard.section)}`}>{rightCard.name}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="col-span-4"></div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return rows;
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MTGDecklistApp;