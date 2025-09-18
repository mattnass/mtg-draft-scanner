// cardDatabase.js - Integration with Scryfall API for card data

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
