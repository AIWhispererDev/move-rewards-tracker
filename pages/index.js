import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FaXTwitter, FaDownload } from 'react-icons/fa6';

export default function Home() {
  const [addresses, setAddresses] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [movePrice, setMovePrice] = useState(null);
  const [priceSource, setPriceSource] = useState('Loading...');
  const [priceLoading, setPriceLoading] = useState(true);

  // Fetch real-time MOVE price
  useEffect(() => {
    fetchMovePrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchMovePrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMovePrice = async () => {
    try {
      setPriceLoading(true);
      const response = await fetch('/api/move-price');
      const data = await response.json();
      
      if (data.success && data.price) {
        console.log('💰 Price fetched successfully:', data.price, 'from', data.source);
        setMovePrice(data.price);
        setPriceSource(data.source);
      } else {
        setMovePrice(null);
        setPriceSource('Fallback');
        console.warn('❌ Failed to fetch real-time price:', data.error);
      }
    } catch (error) {
      console.error('Error fetching MOVE price:', error);
      setMovePrice(null);
      setPriceSource('Error');
    } finally {
      setPriceLoading(false);
    }
  };

  const addAddressInput = () => {
    setAddresses([...addresses, '']);
  };

  const removeAddress = (index) => {
    if (addresses.length > 1) {
      const newAddresses = addresses.filter((_, i) => i !== index);
      setAddresses(newAddresses);
    }
  };

  const updateAddress = (index, value) => {
    const newAddresses = [...addresses];
    newAddresses[index] = value;
    setAddresses(newAddresses);
  };

  const trackRewards = async () => {
    setLoading(true);
    setShowResults(false);
    
    try {
      const validAddresses = addresses.filter(addr => addr.trim() !== '');
      
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: validAddresses }),
      });

      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error tracking rewards:', error);
      alert('Error tracking rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatMoveAmount = (amount) => {
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 'unknown') return 'Unknown';
    try {
      const date = new Date(parseInt(timestamp) / 1000);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  // Download claims as CSV. Accepts either enriched claim objects (with moveAmount) or raw claimHistory entries.
  const downloadCSV = (claims, address) => {
    if (!claims || claims.length === 0) {
      alert('No claims data available to download.');
      return;
    }

    const headers = ['Timestamp', 'Date (UTC)', 'MOVE Amount', 'Value (USD)', 'Pool Address'];
        // Normalise claim object to ensure we have a numeric MOVE amount
    const rows = claims.map(claim => {
      // Some objects coming from `claimHistory` don't include `moveAmount` – derive it
      const moveAmt = claim.moveAmount !== undefined ? claim.moveAmount : (claim.rewardAmountParsed || 0) / Math.pow(10, 8);
      return [
        claim.timestamp,
        formatDate(claim.timestamp),
        moveAmt,
        (moveAmt * movePrice).toFixed(2),
        claim.poolAddress
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `move_claims_${address}.csv`);
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
  };

  const totalTokensClaimed = results?.results
    ?.filter(result => result.success)
    .reduce((sum, result) => sum + result.data.summary.totalMoveTokens, 0) || 0;

  const handleTwitterShare = () => {
    if (typeof window !== 'undefined') {
        const text = `I've claimed a total of ${formatMoveAmount(totalTokensClaimed)} $MOVE tokens from the @canopyxyz Vaults! Check out your own rewards.`;
        const url = window.location.href;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=MOVE,MovementNetwork,DeFi`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <Head>
        <title>Canopy Vaults Rewards Tracker</title>
        <meta name="description" content="Track your MOVE token rewards from Canopy vaults - Movement Network's all-in-one yield aggregation platform. Advanced analytics for DeFi staking." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="container">
        <header className="header">
          <div className="header-content">
            <h1 className="title">
              <span className="icon">🚀</span>
              Canopy Vaults Rewards Tracker
            </h1>
            <p className="subtitle">Track your MOVE token rewards from Canopy vaults</p>
            <div style={{ 
              marginTop: '20px', 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '24px', 
              flexWrap: 'wrap',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: priceLoading ? 'var(--warning-gradient)' : 'var(--success-gradient)',
                  display: 'inline-block',
                  animation: priceLoading ? 'pulse 2s infinite' : 'none'
                }}></span>
                {priceLoading ? (
                  'MOVE Price: Loading...'
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    MOVE Price: ${movePrice ? movePrice.toFixed(4) : 'N/A'} ({priceSource})
                    <button 
                      onClick={fetchMovePrice}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '2px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={(e) => e.target.style.background = 'none'}
                      title="Refresh price"
                    >
                      🔄
                    </button>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: 'var(--primary-gradient)',
                  display: 'inline-block'
                }}></span>
                Network: Movement Mainnet
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: 'var(--warning-gradient)',
                  display: 'inline-block'
                }}></span>
                Real-time Data
              </div>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="input-section">
            <div className="card">
              <h2>Enter Wallet Addresses</h2>
              <p className="description">Track rewards across Canopy's yield-optimized vaults</p>
              
              <div className="address-input-container">
                <div className="address-inputs">
                  {addresses.map((address, index) => (
                    <div key={index} className="address-input-group">
                      <input 
                        type="text" 
                        className="address-input" 
                        placeholder="Enter wallet address (0x...)"
                        value={address}
                        onChange={(e) => updateAddress(index, e.target.value)}
                      />
                      {addresses.length > 1 && (
                        <button 
                          type="button" 
                          className="remove-btn" 
                          onClick={() => removeAddress(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="input-actions">
                  <button type="button" className="add-address-btn" onClick={addAddressInput}>
                    + Add Another Address
                  </button>
                  <button 
                    type="button" 
                    className="track-btn" 
                    onClick={trackRewards}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="btn-loading">
                        <span className="spinner"></span>
                        Loading Rewards...
                      </span>
                    ) : (
                      <span className="btn-text">🔍 Track Rewards</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showResults && results && (
            <div className="results-section">
              <div className="results-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
                  <h2>📊 Reward Summary</h2>
                  {totalTokensClaimed > 0 && (
                      <button 
                          onClick={handleTwitterShare} 
                          style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: '#000',
                              color: 'white',
                              border: '1px solid #333',
                              padding: '8px 16px',
                              borderRadius: '999px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#111';
                              e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#000';
                              e.currentTarget.style.transform = 'scale(1)';
                          }}
                      >
                          <FaXTwitter size={14} />
                          <span>Share on X</span>
                      </button>
                  )}
                </div>
                <div className="results-meta">
                  Tracking complete for {results.results?.length || 0} address(es)
                </div>
              </div>
              <div className="results-container">
                {results.results?.map((result, index) => (
                  <div key={index} className="address-result">
                    <div className="address-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h3>Address: {result.address}</h3>
                        <span className={`status ${result.success ? 'success' : 'error'}`}>
                          {result.success ? '✓ Success' : '✗ Error'}
                        </span>
                      </div>
                      {result.success && result.data.claimHistory?.length > 0 && (
                        <button 
                          className="download-csv-btn"
                          onClick={() => downloadCSV(result.data.claimHistory, result.address)}
                          title="Download all claims as CSV"
                        >
                          <FaDownload size={12} />
                          <span>Download History CSV</span>
                        </button>
                      )}
                    </div>
                    
                    {result.success ? (
                      <div className="reward-data">
                        <div className="summary-stats">
                          <div className="stat-card">
                            <div className="stat-value">{result.data.summary.totalClaims}</div>
                            <div className="stat-label">Total Claims</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value">{formatMoveAmount(result.data.summary.totalMoveTokens)}</div>
                            <div className="stat-label">Total MOVE Tokens Claimed</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value">{formatCurrency(result.data.summary.totalMoveTokens * movePrice)}</div>
                            <div className="stat-label">Total Value (USD)</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value">{formatMoveAmount(result.data.summary.averageClaimAmount)}</div>
                            <div className="stat-label">Average per Claim</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value">
                              {(() => {
                                // Calculate claims for the current day in the user's local timezone
                                const today = new Date();
                                let dailyTotal = 0;
                                
                                result.data.summary.recentClaims.forEach(claim => {
                                  const claimDate = new Date(parseInt(claim.timestamp) / 1000);
                                  
                                  if (
                                    claimDate.getFullYear() === today.getFullYear() &&
                                    claimDate.getMonth() === today.getMonth() &&
                                    claimDate.getDate() === today.getDate()
                                  ) {
                                    dailyTotal += claim.moveAmount;
                                  }
                                });
                                
                                return `${formatMoveAmount(dailyTotal)} (${formatCurrency(dailyTotal * movePrice)})`;
                              })()}
                            </div>
                            <div className="stat-label">Today Claimed</div>
                          </div>
                        </div>

                        {result.data.summary.recentClaims.length > 0 && (
                          <div className="recent-claims">
                            <h4>💰 Recent Claims</h4>
                            <div className="claims-list">
                              {result.data.summary.recentClaims.slice(0, 10).map((claim, claimIndex) => (
                                <div key={claimIndex} className="claim-item">
                                  <div className="claim-amount">
                                    {formatMoveAmount(claim.moveAmount)} MOVE
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '8px' }}>
                                      ({formatCurrency(claim.moveAmount * movePrice)})
                                    </span>
                                  </div>
                                  <div className="claim-details">
                                    <div className="claim-date">{formatDate(claim.timestamp)}</div>
                                    <div className="claim-pool">Pool: {claim.poolAddress.slice(0, 10)}...</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="error-message">
                        ❌ Error: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="footer">
          <p>🏗️ Built for Movement Network • Contract: 0x113a1769acc5ce21b5ece6f9533eef6dd34c758911fa5235124c87ff1298633b</p>
          <p style={{ 
            marginTop: '8px', 
            fontSize: '0.8rem', 
            opacity: '0.7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            Powered by raki
            <a 
              href="https://x.com/AncestorStoic" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                color: 'inherit',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                opacity: '0.8'
              }}
              onMouseOver={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.target.style.opacity = '0.8';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <FaXTwitter size={16} />
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}