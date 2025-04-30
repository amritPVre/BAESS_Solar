
import { SolarProject } from "./solarProject";

export interface SolarAreaMapperProps {
  onComplete: (results: any) => void;
  initialCapacity?: number;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  country?: string;
  city?: string;
  defaultLocation?: string;
}

export interface SolarCalculatorProps {
  projectData?: SolarProject;
  initialLocation?: {
    latitude: number;
    longitude: number;
    timezone: string;
    country: string;
    city: string;
  };
  onSaveProject?: (updatedProject: SolarProject) => Promise<void>;
}
