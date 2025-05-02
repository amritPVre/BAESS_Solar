
import axios from 'axios';
import { PVWATTS_API_KEY, PVWATTS_BASE_URL } from '../config/api';
import { PVWattsRequest, PVWattsResponse } from '../types/pvwatts';
import { toast } from "sonner";

export const calculatePVWatts = async (params: Omit<PVWattsRequest, 'api_key'>): Promise<PVWattsResponse> => {
  try {
    const response = await axios.get(PVWATTS_BASE_URL, {
      params: {
        ...params,
        api_key: PVWATTS_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating PVWatts:', error);
    toast.error('Failed to fetch energy production data');
    throw error;
  }
};
