import axios from 'axios';

const RPC_URL = 'https://full.mainnet.movementinfra.xyz/v1';
const CONTRACT_ADDRESS = '0x113a1769acc5ce21b5ece6f9533eef6dd34c758911fa5235124c87ff1298633b';
const EVENT_TYPE = `${CONTRACT_ADDRESS}::multi_rewards::RewardClaimedEvent`;

async function getEventsUsingUserTransactions(userAddress) {
  console.log(`Fetching user transactions for ${userAddress}...`);
  
  // Get all transactions for the user and filter for contract interactions
  let allTransactions = [];
  let start = 0;
  const limit = 100;
  let hasMore = true;
  
  while (hasMore && start < 2000) { // Limit to 2000 transactions
    try {
      const userTxResponse = await axios.get(`${RPC_URL}/accounts/${userAddress}/transactions?start=${start}&limit=${limit}`);
      
      if (userTxResponse.data && Array.isArray(userTxResponse.data) && userTxResponse.data.length > 0) {
        allTransactions = allTransactions.concat(userTxResponse.data);
        start += limit;
        
        if (userTxResponse.data.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.log(`Error fetching transactions at start ${start}:`, error.message);
      hasMore = false;
    }
  }
  
  console.log(`Found ${allTransactions.length} total user transactions`);
  
  // Filter for reward claim events
  const rewardEvents = [];
  
  allTransactions.forEach(tx => {
    if (tx.events) {
      tx.events.forEach(event => {
        if (event.type === EVENT_TYPE) {
          rewardEvents.push({
            ...event,
            transaction_version: tx.version,
            transaction_hash: tx.hash,
            timestamp: tx.timestamp
          });
        }
      });
    }
  });

  console.log(`Found ${rewardEvents.length} reward claim events`);
  return rewardEvents;
}

async function processEvents(events, userAddress) {
  const rewardTotals = {};
  const claimHistory = [];
  
  events.forEach(event => {
    try {
      // Handle different event data structures
      let data = event.data;
      
      // If data is a string, try to parse it
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.warn('Could not parse event data as JSON:', data);
          return;
        }
      }
      
      // Check if this is a reward claimed event for our user
      const eventUserAddress = data.user || data.claimer || data.account;
      
      if (eventUserAddress === userAddress) {
        // Handle the reward_token structure which can be an object with 'inner' property
        let rewardToken = data.reward_token || data.token || data.reward_type;
        if (rewardToken && typeof rewardToken === 'object' && rewardToken.inner) {
          rewardToken = rewardToken.inner;
        }
        
        const rewardAmountStr = data.reward_amount || data.amount || data.value;
        const rewardAmount = parseInt(rewardAmountStr) || 0;
        
        if (rewardToken && rewardAmount > 0) {
          // Sum rewards by token
          rewardTotals[rewardToken] = (rewardTotals[rewardToken] || 0) + rewardAmount;
          
          // Add to claim history
          claimHistory.push({
            poolAddress: data.pool_address || data.pool || 'unknown',
            rewardToken: rewardToken,
            rewardAmount: rewardAmountStr,
            rewardAmountParsed: rewardAmount,
            sequenceNumber: event.sequence_number || event.seq || 'unknown',
            transactionVersion: event.version || event.transaction_version || 'unknown',
            transactionHash: event.transaction_hash || 'unknown',
            timestamp: event.timestamp || 'unknown',
            eventType: event.type || 'unknown'
          });
        }
      }
    } catch (error) {
      console.warn('Error processing event:', error.message, event);
    }
  });

  return { rewardTotals, claimHistory };
}

async function getRewardHistory(userAddress) {
  try {
    console.log(`Fetching reward history for: ${userAddress}`);
    
    // Get events using user transactions
    const events = await getEventsUsingUserTransactions(userAddress);
    
    if (events.length === 0) {
      return {
        userAddress,
        totalRewards: {},
        claimHistory: [],
        summary: {
          totalClaims: 0,
          totalMoveTokens: 0,
          averageClaimAmount: 0,
          poolBreakdown: {},
          recentClaims: []
        }
      };
    }
    
    const result = await processEvents(events, userAddress);
    
    // Calculate summary statistics
    const totalAmount = Object.values(result.rewardTotals).reduce((sum, amount) => sum + amount, 0);
    const totalMoveTokens = totalAmount / Math.pow(10, 8); // 8 decimals for MOVE
    const avgAmount = result.claimHistory.length > 0 ? totalAmount / result.claimHistory.length : 0;
    const avgMoveAmount = avgAmount / Math.pow(10, 8);
    
    // Pool breakdown
    const poolBreakdown = {};
    result.claimHistory.forEach(claim => {
      if (!poolBreakdown[claim.poolAddress]) {
        poolBreakdown[claim.poolAddress] = { count: 0, total: 0 };
      }
      poolBreakdown[claim.poolAddress].count++;
      poolBreakdown[claim.poolAddress].total += claim.rewardAmountParsed;
    });
    
    // Convert pool totals to MOVE tokens
    Object.keys(poolBreakdown).forEach(pool => {
      poolBreakdown[pool].totalMove = poolBreakdown[pool].total / Math.pow(10, 8);
    });
    
    // Recent claims (last 10)
    const recentClaims = result.claimHistory.slice(-10).reverse().map(claim => ({
      ...claim,
      moveAmount: claim.rewardAmountParsed / Math.pow(10, 8),
      date: new Date(parseInt(claim.timestamp) / 1000).toISOString()
    }));
    
    // Debug logging
    console.log('Debug summary calculation:', {
      claimHistoryLength: result.claimHistory.length,
      totalMoveTokens: totalMoveTokens,
      avgMoveAmount: avgMoveAmount
    });

    return {
      userAddress,
      totalRewards: result.rewardTotals,
      claimHistory: result.claimHistory,
      summary: {
        totalClaims: result.claimHistory.length, // This should be a whole number
        totalMoveTokens,
        averageClaimAmount: avgMoveAmount,
        poolBreakdown,
        recentClaims
      }
    };
    
  } catch (error) {
    console.error(`Error getting reward history for ${userAddress}:`, error.message);
    throw error;
  }
}

export { getRewardHistory };