import { supabase } from "../integrations/supabase/client";
import type { Database } from "../integrations/supabase/types";
import { toast } from "sonner";

// Circuit breaker types
export type CircuitBreaker = {
  id: string;
  breaker_type: string;
  ampacity: number;
  rated_voltage: number;
  created_at: string;
  updated_at: string;
};

// Selection parameters
export interface BreakerSelectionParams {
  currentRating: number;
  voltageRating: number;
  breakerType?: 'MCB' | 'MCCB' | 'ACB' | 'VCB';
}

/**
 * Fetches all circuit breakers
 */
export async function fetchCircuitBreakers(): Promise<CircuitBreaker[]> {
  const { data, error } = await supabase
    .from('circuit_breakers')
    .select('*')
    .order('breaker_type', { ascending: true })
    .order('ampacity', { ascending: true });
  
  if (error) {
    console.error('Error fetching circuit breakers:', error);
    toast.error("Failed to load circuit breakers");
    return [];
  }
  
  return data || [];
}

/**
 * Fetches circuit breakers by type
 */
export async function fetchCircuitBreakersByType(
  breakerType: 'MCB' | 'MCCB' | 'ACB' | 'VCB',
  minAmpacity?: number,
  maxAmpacity?: number
): Promise<CircuitBreaker[]> {
  let query = supabase
    .from('circuit_breakers')
    .select('*')
    .eq('breaker_type', breakerType);
  
  if (minAmpacity !== undefined) {
    query = query.gte('ampacity', minAmpacity);
  }
  
  if (maxAmpacity !== undefined) {
    query = query.lte('ampacity', maxAmpacity);
  }
  
  query = query.order('ampacity');
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching circuit breakers by type:', error);
    toast.error("Failed to load circuit breakers");
    return [];
  }
  
  return data || [];
}

/**
 * Selects appropriate circuit breaker based on current and voltage requirements
 */
export async function selectCircuitBreaker(params: BreakerSelectionParams): Promise<CircuitBreaker> {
  const { currentRating, voltageRating, breakerType } = params;
  
  try {
    // Apply safety factor for circuit breaker sizing (typically 1.25x)
    const requiredAmpacity = currentRating * 1.25;
    
    // Convert voltage from V to kV for comparison
    const voltageRatingKV = voltageRating / 1000;
    
    let query = supabase
      .from('circuit_breakers')
      .select('*');
    
    // Filter by breaker type if specified
    if (breakerType) {
      query = query.eq('breaker_type', breakerType);
    }
    
    // Filter by voltage rating (should be greater than or equal to required)
    query = query.gte('rated_voltage', voltageRatingKV);
    
    // Find the next higher standard ampacity
    query = query.gte('ampacity', requiredAmpacity)
      .order('ampacity')
      .limit(1);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error selecting circuit breaker:', error);
      toast.error("Failed to select circuit breaker - using mock data");
      return mockCircuitBreaker(params);
    }
    
    return data && data.length > 0 ? data[0] : mockCircuitBreaker(params);
  } catch (error) {
    console.error('Error selecting circuit breaker:', error);
    toast.error("Failed to select circuit breaker - using mock data");
    return mockCircuitBreaker(params);
  }
}

// Mock circuit breaker for fallback
function mockCircuitBreaker(params: BreakerSelectionParams): CircuitBreaker {
  const { currentRating, voltageRating, breakerType = 'MCCB' } = params;
  
  // Calculate next standard ampacity
  const standardRatings = {
    'MCB': [0.5, 1, 2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63],
    'MCCB': [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 3200],
    'ACB': [400, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6300],
    'VCB': [630, 800, 1250, 1600, 2000, 2500, 3150, 4000]
  };
  
  const ratings = standardRatings[breakerType];
  const requiredRating = currentRating * 1.25;
  
  let selectedRating = ratings[0];
  for (const rating of ratings) {
    if (rating >= requiredRating) {
      selectedRating = rating;
      break;
    }
  }
  
  return {
    id: `mock-${breakerType.toLowerCase()}-${selectedRating}`,
    breaker_type: breakerType,
    ampacity: selectedRating,
    rated_voltage: voltageRating / 1000, // Convert to kV
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Get available standard ampacity ratings for a breaker type
 */
export async function getStandardAmpacityRatings(breakerType: 'MCB' | 'MCCB' | 'ACB' | 'VCB'): Promise<number[]> {
  const { data, error } = await supabase
    .from('circuit_breakers')
    .select('ampacity')
    .eq('breaker_type', breakerType)
    .order('ampacity');
  
  if (error || !data) {
    console.error('Error fetching standard ampacity ratings:', error);
    toast.error("Failed to load standard ampacity ratings");
    return [];
  }
  
  // Extract unique ampacity ratings
  const ratings = data.map(r => r.ampacity);
  const uniqueRatings = [...new Set(ratings)];
  
  return uniqueRatings;
} 