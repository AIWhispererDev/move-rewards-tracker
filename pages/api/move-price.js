// Real-time MOVE token price API endpoint
// This will try multiple sources to get the most accurate price

export default async function handler(req, res) {
  try {
    // Method 1: Try CoinGecko (most reliable for major tokens)
    const price = await fetchFromCoinGecko();
    if (price) {
      return res.json({ 
        price, 
        source: 'CoinGecko',
        timestamp: new Date().toISOString(),
        success: true 
      });
    }

    // Fallback: Return last known price with warning
    return res.json({ 
      price: null, 
      source: 'Fallback',
      timestamp: new Date().toISOString(),
      success: false,
      error: 'Could not fetch real-time price from any source'
    });

  } catch (error) {
    console.error('Price fetch error:', error);
    return res.status(500).json({ 
      price: null, 
      source: 'Error Fallback',
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message 
    });
  }
}

// Method 1: CoinGecko API
async function fetchFromCoinGecko() {
  try {
    // Try different possible IDs for MOVE token
    const possibleIds = ['movement', 'move', 'move-token', 'movement-network'];
    
    for (const id of possibleIds) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
          { timeout: 5000 }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data[id]?.usd) {
            console.log(`Found MOVE price on CoinGecko with ID: ${id}`);
            return data[id].usd;
          }
        }
      } catch (e) {
        continue; // Try next ID
      }
    }
    
    return null;
  } catch (error) {
    console.error('CoinGecko fetch error:', error);
    return null;
  }
}

// Method 2: CoinMarketCap API (requires API key)
async function fetchFromCoinMarketCap() {
  try {
    // Note: This requires CMC API key - you'd need to sign up
    // const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=MOVE', {
    //   headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
    // });
    
    // For now, return null (no API key)
    return null;
  } catch (error) {
    console.error('CoinMarketCap fetch error:', error);
    return null;
  }
}

// Method 3: DEX Price Aggregators
async function fetchFromDEX() {
  try {
    // Try DexScreener API (good for newer tokens)
    const response = await fetch(
      'https://api.dexscreener.com/latest/dex/search/?q=MOVE',
      { timeout: 5000 }
    );
    
    if (response.ok) {
      const data = await response.json();
      // Look for MOVE token pairs
      const movePairs = data.pairs?.filter(pair => 
        pair.baseToken?.symbol?.toLowerCase() === 'move' ||
        pair.quoteToken?.symbol?.toLowerCase() === 'move'
      );
      
      if (movePairs && movePairs.length > 0) {
        // Get the pair with highest liquidity
        const bestPair = movePairs.sort((a, b) => 
          parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0)
        )[0];
        
        if (bestPair.priceUsd) {
          console.log('Found MOVE price on DexScreener');
          return parseFloat(bestPair.priceUsd);
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('DEX fetch error:', error);
    return null;
  }
}

// Method 4: Movement Network RPC (if they have price oracle)
async function fetchFromMovementRPC() {
  try {
    const RPC_URL = 'https://full.mainnet.movementinfra.xyz/v1';
    
    // Try to get price from Movement Network's price oracle if available
    // This would require knowing their price oracle contract address
    // For now, return null as we don't have this information
    
    return null;
  } catch (error) {
    console.error('Movement RPC fetch error:', error);
    return null;
  }
}