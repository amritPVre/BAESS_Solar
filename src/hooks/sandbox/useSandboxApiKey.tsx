import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Available AI models via OpenRouter
export const AVAILABLE_MODELS = [
  { 
    id: 'google/gemini-2.5-pro-preview', 
    name: 'Gemini 2.5 Pro', 
    provider: 'Google',
    description: 'Most capable Gemini model'
  },
  { 
    id: 'openai/gpt-4.5-preview', 
    name: 'GPT-4.5', 
    provider: 'OpenAI',
    description: 'Latest GPT model'
  },
  { 
    id: 'anthropic/claude-sonnet-4', 
    name: 'Claude Sonnet 4', 
    provider: 'Anthropic',
    description: 'Balanced Claude model'
  },
];

interface SandboxSettings {
  api_key: string;
  selected_model: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for managing Sandbox OpenRouter API key
 */
export function useSandboxApiKey() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedModel, setSelectedModelState] = useState<string>(AVAILABLE_MODELS[0].id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load API key from Supabase
  const loadApiKey = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Try to fetch existing settings
      const { data, error: fetchError } = await supabase
        .from('sandbox_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is okay for new users
        console.error('Error loading sandbox settings:', fetchError);
        setError('Failed to load settings');
      }

      if (data) {
        setApiKey(data.api_key);
        setSelectedModelState(data.selected_model || AVAILABLE_MODELS[0].id);
      }
    } catch (err) {
      console.error('Error in loadApiKey:', err);
      setError('Failed to load API key');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadApiKey();
  }, [loadApiKey]);

  // Validate API key with OpenRouter
  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${key}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.label !== undefined; // Key is valid if it has a label
      }
      return false;
    } catch (err) {
      console.error('Error validating API key:', err);
      return false;
    }
  };

  // Save API key to Supabase
  const saveApiKey = async (key: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      const { error: upsertError } = await supabase
        .from('sandbox_settings')
        .upsert({
          user_id: user.id,
          api_key: key,
          selected_model: selectedModel,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('Error saving API key:', upsertError);
        setError('Failed to save API key');
        return false;
      }

      setApiKey(key);
      return true;
    } catch (err) {
      console.error('Error in saveApiKey:', err);
      setError('Failed to save API key');
      return false;
    }
  };

  // Update selected model
  const setSelectedModel = async (modelId: string) => {
    setSelectedModelState(modelId);

    if (!user?.id || !apiKey) return;

    try {
      await supabase
        .from('sandbox_settings')
        .update({
          selected_model: modelId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error updating selected model:', err);
    }
  };

  // Delete API key
  const deleteApiKey = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error: deleteError } = await supabase
        .from('sandbox_settings')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting API key:', deleteError);
        return false;
      }

      setApiKey(null);
      return true;
    } catch (err) {
      console.error('Error in deleteApiKey:', err);
      return false;
    }
  };

  return {
    apiKey,
    selectedModel,
    setSelectedModel,
    loading,
    error,
    hasApiKey: !!apiKey,
    availableModels: AVAILABLE_MODELS,
    validateApiKey,
    saveApiKey,
    deleteApiKey,
    reload: loadApiKey,
  };
}

export default useSandboxApiKey;

