# MOVE Rewards Tracker

A Next.js web application to track MOVE token rewards from Movement Network DeFi staking.

## Data Source

This application tracks rewards from vaults provided by [Canopy](https://app.canopyhub.xyz/explore), which provides on-chain yield infrastructure on the Movement Network.

## Features

- Track reward claims for multiple wallet addresses
- View total rewards, claim history, and statistics
- Fetch real-time MOVE token price
- Responsive design with modern UI
- Built with Next.js for optimal performance

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Deployment on Vercel

This app is optimized for deployment on Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Deploy with one click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/move-rewards-tracker)

## Environment Variables

No environment variables are required for basic functionality.

Optional:

- `CMC_API_KEY` – CoinMarketCap API key used as a fallback source for real-time price data.

## API Routes

- `POST /api/rewards` - Get reward history for wallet addresses
- `GET /api/move-price` - Fetch real-time MOVE token price
- `GET /api/health` - Health check endpoint

## Contract Information

- **Network**: Movement Network Mainnet
- **Contract**: `0x113a1769acc5ce21b5ece6f9533eef6dd34c758911fa5235124c87ff1298633b`
- **RPC URL**: `https://full.mainnet.movementinfra.xyz/v1`


## Tech Stack

- **Framework**: Next.js 14
- **Frontend**: React 18
- **Styling**: CSS Modules
- **HTTP Client**: Axios
- **Deployment**: Vercel

## License

MIT