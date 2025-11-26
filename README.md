# BAESS Solar - AI-Powered Solar Design Platform

## About BAESS Labs

BAESS Solar is a comprehensive solar design and engineering platform that combines AI-powered tools with professional-grade calculations to revolutionize solar system design and financial analysis.

**Live URL**: https://www.baess.app

## Key Features

- **AI PV Designer Pro** - Advanced solar system design simulator with AI-powered BOQ generation
- **BESS Designer** - Battery Energy Storage System design tool
- **AI Financial Analysis** - Intelligent financial modeling and reporting
- **3D Visualization** - Interactive solar panel placement and shading analysis
- **Professional Reports** - Export-ready engineering documentation

## Technology Stack

This project is built with modern web technologies:

- **Vite** - Lightning-fast build tool
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn/ui** - Component library
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend and authentication
- **Google Maps API** - Location services
- **Gemini AI** - AI-powered features
- **Dodo Payments** - Payment processing

## Getting Started

### Prerequisites

- Node.js (v18 or higher) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn package manager

### Installation

```sh
# Step 1: Clone the repository
git clone https://github.com/amritPVre/BAESS_Solar.git

# Step 2: Navigate to the project directory
cd BAESS_Solar

# Step 3: Install dependencies
npm install

# Step 4: Set up environment variables
# Copy .env.example to .env and fill in your API keys

# Step 5: Start the development server
npm run dev
```

### Available Scripts

```sh
# Start frontend development server (localhost:8080)
npm run dev

# Start backend server (localhost:3001)
npm run server

# Run both frontend and backend concurrently
npm run dev:full

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# Dodo Payments
VITE_DODO_API_KEY=your_dodo_api_key
DODO_WEBHOOK_SECRET=your_webhook_secret

# App URLs
VITE_APP_URL=http://localhost:8084
VITE_API_URL=http://localhost:3001

# reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
VITE_RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

For detailed deployment instructions, see `DEPLOYMENT.md`

### Custom Domain Setup

The app is deployed at `www.baess.app` with custom domain configuration. For DNS setup instructions, see the documentation in the project.

## Project Structure

```
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── integrations/     # Third-party integrations
├── api/                  # Vercel serverless functions
├── supabase/             # Database migrations
├── public/               # Static assets
└── ...config files
```

## Features Documentation

- **AI BOQ Generation** - Uses Gemini 2.0 for intelligent bill of quantities
- **PV Simulation** - NREL PVWatts integration for accurate energy modeling
- **Financial Analysis** - Industry-standard financial calculations
- **User Management** - Supabase authentication with role-based access
- **Subscription Plans** - Integrated with Dodo Payments
- **Referral System** - Built-in referral program for user growth

## Support

For questions or issues:
- Email: konnect@baesslabs.com
- GitHub Issues: [Report a bug](https://github.com/amritPVre/BAESS_Solar/issues)

## License

Proprietary - All rights reserved by BAESS Labs

## Contributing

This is a private project. For collaboration inquiries, contact konnect@baesslabs.com

---

**Built with ❤️ by BAESS Labs**  
Solar Intelligence for the Future
