// Environment Variable Checker
// This utility helps debug environment variable issues

function getEnvironmentVariable(key: string): string | undefined {
  // Try multiple ways to access environment variables
  
  // 1. Vite-style (import.meta.env) - Primary method for Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  
  // 2. Process.env (Node.js style) - Fallback
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  // 3. Window global (if manually set) - Last resort
  if (typeof window !== 'undefined' && (window as any).env) {
    return (window as any).env[key];
  }
  
  return undefined;
}

export function checkEnvironmentVariables() {
  const results = {
    processAvailable: typeof process !== 'undefined',
    processEnvAvailable: typeof process !== 'undefined' && !!process.env,
    viteEnvAvailable: typeof import.meta !== 'undefined' && !!import.meta.env,
    openaiKey: undefined as string | undefined,
    geminiKey: undefined as string | undefined,
    allEnvVars: {} as Record<string, string | undefined>
  };

  // Try to get API keys using VITE_ prefix
  results.openaiKey = getEnvironmentVariable('VITE_OPENAI_API_KEY');
  results.geminiKey = getEnvironmentVariable('VITE_GEMINI_API_KEY');
  
  // Get all VITE_ variables from available sources
  if (results.viteEnvAvailable && import.meta.env) {
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        results.allEnvVars[key] = import.meta.env[key];
      }
    });
  }
  
  if (results.processEnvAvailable && process.env) {
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        results.allEnvVars[key] = process.env[key];
      }
    });
  }

  return results;
}

export function logEnvironmentStatus() {
  const status = checkEnvironmentVariables();
  
  console.group('🔧 Environment Variable Status');
  console.log('Process available:', status.processAvailable);
  console.log('Process.env available:', status.processEnvAvailable);
  console.log('Vite import.meta.env available:', status.viteEnvAvailable);
  console.log('OpenAI API Key:', status.openaiKey ? '✅ Found' : '❌ Not found');
  console.log('Gemini API Key:', status.geminiKey ? '✅ Found' : '❌ Not found');
  
  if (Object.keys(status.allEnvVars).length > 0) {
    console.log('All VITE_ variables:', status.allEnvVars);
  } else {
    console.log('❌ No VITE_ variables found');
    console.log('💡 Make sure your .env file is in the project root with:');
    console.log('   VITE_OPENAI_API_KEY=your_key_here');
    console.log('   VITE_GEMINI_API_KEY=your_key_here');
    console.log('💡 Restart your development server after adding environment variables');
    console.log('💡 In Vite, environment variables must start with VITE_ to be exposed to the client');
  }
  
  console.groupEnd();
  
  return status;
}

// Export the getEnvironmentVariable function for use in other modules
export { getEnvironmentVariable };
