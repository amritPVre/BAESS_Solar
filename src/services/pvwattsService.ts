
import axios from 'axios';
import { PVWATTS_API_KEY, PVWATTS_BASE_URL } from '../config/api';
import { PVWattsRequest, PVWattsResponse } from '../types/pvwatts';
import { toast } from "sonner";

export const calculatePVWatts = async (params: Omit<PVWattsRequest, 'api_key'>): Promise<PVWattsResponse> => {
  try {
    console.log('Calling PVWatts API with URL:', PVWATTS_BASE_URL);
    console.log('Using parameters:', params);
    console.log('🌍 Ground reflectance (albedo):', params.albedo || 'Not specified (PVWatts will use default)');
    console.log('📏 Ground coverage ratio (GCR):', params.gcr || 'Not specified (PVWatts will use default 0.4)');
    
    const response = await axios.get(PVWATTS_BASE_URL, {
      params: {
        ...params,
        api_key: PVWATTS_API_KEY,
      },
    });
    
    console.log('PVWatts API response version:', response.data.version);
    return response.data;
  } catch (error) {
    console.error('Error calculating PVWatts:', error);
    toast.error('Failed to fetch energy production data');
    throw error;
  }
};
