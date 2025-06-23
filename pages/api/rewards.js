import { getRewardHistory } from '../../lib/rewardService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { addresses } = req.body;
    
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of addresses' });
    }

    // Validate addresses (basic validation)
    const validAddresses = addresses.filter(addr => 
      typeof addr === 'string' && 
      addr.startsWith('0x') && 
      addr.length === 66
    );

    if (validAddresses.length === 0) {
      return res.status(400).json({ error: 'No valid addresses provided. Addresses must start with 0x and be 66 characters long.' });
    }

    console.log(`Processing ${validAddresses.length} addresses...`);

    // Get reward history for each address
    const results = [];
    for (const address of validAddresses) {
      try {
        console.log(`Fetching rewards for ${address}...`);
        const rewardData = await getRewardHistory(address);
        results.push({
          address,
          success: true,
          data: rewardData
        });
      } catch (error) {
        console.error(`Error fetching rewards for ${address}:`, error.message);
        results.push({
          address,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}