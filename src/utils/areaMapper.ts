
import { toast } from "sonner";

/**
 * Calculates area of polygon in square meters using the Shoelace formula
 * @param coordinates Array of [lat, lng] coordinates
 * @returns Area in square meters
 */
export const calculatePolygonArea = (coordinates: number[][]): number => {
  if (coordinates.length < 3) return 0;
  
  // Earth's radius in meters
  const R = 6371000;
  
  // Convert to radians and calculate area using spherical earth Shoelace formula
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    
    const lat1 = coordinates[i][0] * Math.PI / 180;
    const lon1 = coordinates[i][1] * Math.PI / 180;
    const lat2 = coordinates[j][0] * Math.PI / 180;
    const lon2 = coordinates[j][1] * Math.PI / 180;
    
    // Apply spherical earth Shoelace formula
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs(area * R * R / 2.0);
  return area;
};

/**
 * Calculates the solar installation potential for a given area
 * @param area Area in square meters
 * @param gcrValue Ground Coverage Ratio (decimal)
 * @returns Installation potential data
 */
export const calculateInstallationPotential = (
  area: number,
  gcrValue: number = 0.4
) => {
  if (area <= 0) return null;
  
  // Calculate initial usable area (85% of total)
  const initialUsableArea = area * 0.85;
  
  // Calculate final usable area with GCR
  const finalUsableArea = initialUsableArea * gcrValue;
  
  // Estimating PV capacity
  const modulesEstimate = Math.floor(finalUsableArea / 2.16);  // Using a typical module size of 2.16m²/500W
  const potentialCapacityLow = modulesEstimate * 450 / 1000;  // Low-power modules (~450W)  
  const potentialCapacityHigh = modulesEstimate * 620 / 1000;  // High-power modules (~620W)
  const potentialCapacity = (potentialCapacityLow + potentialCapacityHigh) / 2;
  
  return {
    totalArea: area,
    initialUsableArea,
    finalUsableArea,
    modulesEstimate,
    potentialCapacityLow,
    potentialCapacityHigh,
    potentialCapacity,
    gcr: gcrValue
  };
};

/**
 * Ground Coverage Ratio (GCR) categories and values
 */
export const gcrCategories = [
  "Ground Mount",
  "Rooftop",
  "Carport"
];

export const installationTypes: Record<string, string[]> = {
  "Ground Mount": [
    "Fixed Tilt",
    "Single-Axis Tracker",
    "Dual-Axis Tracker"
  ],
  "Rooftop": [
    "Flat Roof Ballasted",
    "Flat Roof Attached",
    "Pitched Roof"
  ],
  "Carport": [
    "Standard Carport",
    "Premium Carport",
    "EV Charging Integrated"
  ]
};

export const gcrValues: Record<string, Record<string, number>> = {
  "Ground Mount": {
    "Fixed Tilt": 0.4,
    "Single-Axis Tracker": 0.33,
    "Dual-Axis Tracker": 0.25
  },
  "Rooftop": {
    "Flat Roof Ballasted": 0.7,
    "Flat Roof Attached": 0.8,
    "Pitched Roof": 0.95
  },
  "Carport": {
    "Standard Carport": 0.85,
    "Premium Carport": 0.9,
    "EV Charging Integrated": 0.8
  }
};

export const gcrRanges: Record<string, Record<string, [number, number]>> = {
  "Ground Mount": {
    "Fixed Tilt": [0.35, 0.5],
    "Single-Axis Tracker": [0.28, 0.4],
    "Dual-Axis Tracker": [0.2, 0.3]
  },
  "Rooftop": {
    "Flat Roof Ballasted": [0.6, 0.8],
    "Flat Roof Attached": [0.7, 0.9],
    "Pitched Roof": [0.9, 1.0]
  },
  "Carport": {
    "Standard Carport": [0.8, 0.9],
    "Premium Carport": [0.85, 0.95],
    "EV Charging Integrated": [0.75, 0.85]
  }
};

export const installationDescriptions: Record<string, Record<string, string>> = {
  "Ground Mount": {
    "Fixed Tilt": "Standard ground-mounted array with fixed tilt angle",
    "Single-Axis Tracker": "Ground mount with tracking on a single axis (usually east-west)",
    "Dual-Axis Tracker": "Premium ground mount tracking both sun altitude and azimuth"
  },
  "Rooftop": {
    "Flat Roof Ballasted": "Non-penetrating system using ballast weight on flat roofs",
    "Flat Roof Attached": "Attached system with roof penetrations on flat roofs",
    "Pitched Roof": "Traditional flush-mounted system for sloped roofs"
  },
  "Carport": {
    "Standard Carport": "Basic overhead parking canopy with solar panels",
    "Premium Carport": "Enhanced design with integrated water management and lighting",
    "EV Charging Integrated": "Solar carport with built-in electric vehicle charging stations"
  }
};

/**
 * Get GCR value for a specific project category and installation type
 */
export const getGcrValue = (category: string, installationType: string): number => {
  if (gcrValues[category] && gcrValues[category][installationType]) {
    return gcrValues[category][installationType];
  }
  return 0.4; // Default value
};

/**
 * Get GCR range for a specific project category and installation type
 */
export const getGcrRange = (category: string, installationType: string): [number, number] => {
  if (gcrRanges[category] && gcrRanges[category][installationType]) {
    return gcrRanges[category][installationType];
  }
  return [0.3, 0.5]; // Default range
};

/**
 * Get installation description for a specific project category and installation type
 */
export const getInstallationDescription = (category: string, installationType: string): string => {
  if (installationDescriptions[category] && installationDescriptions[category][installationType]) {
    return installationDescriptions[category][installationType];
  }
  return "Standard solar PV installation"; // Default description
};

/**
 * Search for location using OpenStreetMap Nominatim API
 */
export const searchLocation = async (address: string): Promise<{ lat: number, lng: number, displayName: string } | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    
    if (!response.ok) {
      throw new Error(`Network response error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error("Location search error:", error);
    toast.error(`Error searching for location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};
