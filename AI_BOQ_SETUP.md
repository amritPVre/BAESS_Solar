# AI BOQ Generation Setup Guide

## Overview
The BESS Designer now includes AI-powered BOQ (Bill of Quantities) generation using DeepSeek v3 AI model through OpenRouter API. This feature automatically generates detailed specifications for:

- Battery Racking System components
- Earthing System components  
- Lightning Protection System
- Cable Management (trays, conduits, accessories)
- AC/DC Distribution Boxes & MCBs
- Other Electrical BOS items

## Setup Instructions

### 1. Get OpenRouter API Key

1. Visit [https://openrouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the API key (starts with `sk-or-...`)

### 2. Configure Environment Variable

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
VITE_OPENROUTER_API_KEY=sk-or-your-actual-api-key-here
```

**Important Notes:**
- The variable MUST start with `VITE_` to be accessible in the browser
- Do NOT commit your `.env` file to version control
- Add `.env` to your `.gitignore` file

### 3. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Usage

1. Complete your BESS design (PV system, batteries, inverters)
2. Navigate to the **BOQ** tab
3. Click the **✨ AI Generate BOS Details** button
4. Wait 5-10 seconds for AI to generate detailed BOQ items
5. Review the generated items and adjust as needed

## Features

### Automatic Context Detection
The AI automatically analyzes your project:
- PV system capacity
- Battery capacity and technology
- Number of batteries
- System coupling type (AC/DC)
- Inverter configuration
- Required battery racks

### Detailed Specifications
AI generates:
- Specific component descriptions
- Technical specifications
- Appropriate units of measurement
- Estimated quantities based on your design

### Smart Replacement
- Default lumpsum items are replaced with detailed AI-generated items
- Original major components (panels, batteries, inverters, cables) remain unchanged
- Only BOS and auxiliary components are AI-enhanced

## Troubleshooting

### API Key Not Working
- Verify the key starts with `sk-or-`
- Check for extra spaces in the `.env` file
- Ensure variable name is exactly `VITE_OPENROUTER_API_KEY`
- Restart development server after adding the key

### AI Generation Fails
- Check browser console for error messages
- Verify OpenRouter API status
- Ensure you have API credits remaining (free tier available)
- Check network connectivity

### No Button Visible
- Ensure batteries are configured in BESS Configuration tab
- Check if environment variable is properly set

## API Costs

DeepSeek v3 on OpenRouter:
- **Free tier available**: `deepseek/deepseek-chat-v3.1:free`
- Very cost-effective for BOQ generation
- Typical request cost: < $0.01 per BOQ

## Model Details

- **Model**: `deepseek/deepseek-chat` (Standard DeepSeek Chat)
- **Provider**: OpenRouter AI
- **Temperature**: 0.7 (balanced creativity/accuracy)
- **Max Tokens**: 2000 (sufficient for detailed BOQ)

**Note**: The model name has been updated to `deepseek/deepseek-chat` which is the correct endpoint for OpenRouter. The free tier may have usage limits.

## Security Notes

1. **Never commit API keys to version control**
2. Add `.env` to `.gitignore`
3. Use separate keys for development and production
4. Rotate keys periodically
5. Monitor API usage in OpenRouter dashboard

## Example .env File

```env
# OpenRouter API Key for AI BOQ Generation
VITE_OPENROUTER_API_KEY=sk-or-v1-abc123def456...

# Other environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify API key configuration
3. Test API key directly on OpenRouter website
4. Contact BAESS Labs support

---

**Last Updated**: January 2025
**Feature Version**: 1.0.0

