import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  Shield, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Boxes,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSandboxApiKey } from '@/hooks/sandbox/useSandboxApiKey';
import { toast } from 'sonner';

interface SandboxApiSetupProps {
  onComplete: () => void;
}

/**
 * Sandbox API Setup - First-time setup for OpenRouter API key
 */
const SandboxApiSetup: React.FC<SandboxApiSetupProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveApiKey, validateApiKey } = useSandboxApiKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!apiKey.trim()) {
      setError('Please enter your OpenRouter API key');
      return;
    }

    if (!apiKey.startsWith('sk-or-')) {
      setError('Invalid API key format. OpenRouter keys start with "sk-or-"');
      return;
    }

    setIsValidating(true);

    try {
      // Validate the API key with OpenRouter
      const isValid = await validateApiKey(apiKey);
      
      if (!isValid) {
        setError('Invalid API key. Please check and try again.');
        setIsValidating(false);
        return;
      }

      // Save the API key
      await saveApiKey(apiKey);
      toast.success('API key saved successfully!');
      onComplete();
    } catch (err) {
      setError('Failed to validate API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 w-fit">
              <Boxes className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Welcome to BAESS Sandbox</CardTitle>
            <CardDescription className="text-white/60">
              To use Sandbox apps, you'll need to connect your OpenRouter API key
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Info Box */}
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <h4 className="font-medium text-purple-300 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Why OpenRouter?
              </h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Access to multiple AI models (GPT-4.5, Claude, Gemini)</li>
                <li>• You control your own usage and billing</li>
                <li>• No BAESS subscription required for sandbox</li>
                <li>• Pay only for what you use</li>
              </ul>
            </div>

            {/* API Key Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-xxxxxxxxxxxxx"
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isValidating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save & Continue
                  </>
                )}
              </Button>
            </form>

            {/* Get API Key Link */}
            <div className="text-center">
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Don't have an API key? Get one from OpenRouter
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <Shield className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-white/60">
                <p className="font-medium text-white/80 mb-1">Your key is secure</p>
                <p>Your API key is encrypted and stored securely. It's only used for sandbox apps and never shared.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SandboxApiSetup;

