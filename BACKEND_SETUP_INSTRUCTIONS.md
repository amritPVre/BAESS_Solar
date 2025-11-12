# Backend Server Setup Instructions

## Problem
Vite is frontend-only. The API routes in `src/pages/api/` don't work because there's no backend server.

## Solution
Run an Express backend server alongside your Vite dev server.

## Setup Steps

### 1. Install Dependencies

```bash
npm install express cors dotenv concurrently
```

### 2. Update package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "server": "node server.js",
    "dev:full": "concurrently \"npm run dev\" \"npm run server\""
  }
}
```

### 3. Update .env File

Add the backend port:

```env
# Frontend (Vite) runs on port 8080
VITE_APP_URL=http://localhost:8080

# Backend API server runs on port 3001
PORT=3001

# API requests go to backend
VITE_API_URL=http://localhost:3001
```

### 4. Update Frontend API Client

Update `src/services/dodoPaymentService.ts`:

```typescript
export class SubscriptionAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }
  
  // ... rest of the code
}
```

### 5. Start Both Servers

```bash
# Option A: Run both in one command
npm run dev:full

# Option B: Run separately
# Terminal 1:
npm run dev

# Terminal 2:
npm run server
```

### 6. Update ngrok to Point to Backend

```bash
# Point ngrok to the backend server (port 3001)
ngrok http 3001
```

Use the ngrok URL for Dodo webhooks:
```
https://your-ngrok-url.ngrok-free.dev/api/webhooks/dodo
```

## Architecture

```
Frontend (Vite)          Backend (Express)         Dodo Payments
localhost:8080    →      localhost:3001      →     api.dodopayments.com
                  ↑                          ↑
                  └──────────────────────────┘
                     (webhooks via ngrok)
```

## Testing

1. **Frontend**: http://localhost:8080
2. **Backend health**: http://localhost:3001/api/health
3. **Should return**: `{"status":"ok"}`

## Troubleshooting

**"Cannot find module 'express'"**
```bash
npm install express cors dotenv
```

**"Port 3001 already in use"**
```bash
# Change PORT in .env
PORT=3002
```

**"Checkout button still not working"**
- Check browser console for errors
- Check backend terminal for logs
- Verify VITE_API_URL in .env
- Verify Dodo API keys are in .env

