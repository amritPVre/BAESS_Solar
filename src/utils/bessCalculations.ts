/**
 * BESS Calculation Utilities
 * 
 * This module contains all the core calculation functions for Battery Energy Storage System (BESS) sizing.
 * It implements the correct methodology where:
 * - Battery is sized for NIGHTTIME energy consumption only
 * - PV is sized to supply DAYTIME load + charge battery for nighttime use
 * - Inverters are sized based on peak loads and battery C-rates
 * 
 * @see BESS_CALCULATION_METHODOLOGY.md for detailed formulas and methodology
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const SOLAR_START_HOUR = 6;  // 6:00 AM
export const SOLAR_END_HOUR = 18;   // 6:00 PM (solar production ends)
export const BATTERY_C_RATE = 0.5;  // 0.5C for charging/discharging
export const INVERTER_EFFICIENCY = 0.90; // 90% efficiency for all inverters
export const DEFAULT_CHARGING_EFFICIENCY = 0.95;
export const DEFAULT_DISCHARGING_EFFICIENCY = 0.95;
export const DEFAULT_PV_SYSTEM_LOSSES = 0.15; // 15%
export const DEFAULT_SOLAR_UNCERTAINTY = 0.10; // 10%

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EnergySplit {
    daytimeEnergy: number;          // kWh consumed during solar hours (6am-6pm)
    nighttimeEnergy: number;        // kWh consumed during non-solar hours (6pm-6am)
    totalEnergy: number;            // Total 24-hour consumption
    peakDaytimeLoad: number;        // Peak load during daytime (kW)
    peakNighttimeLoad: number;      // Peak load during nighttime (kW)
    peakLoad: number;               // Absolute peak load (kW)
    daytimeHours: number[];         // Array of daytime hour indices
    nighttimeHours: number[];       // Array of nighttime hour indices
}

export interface BatteryCapacityResult {
    usableCapacity: number;         // kWh (after efficiency losses, before DoD)
    nameplateCapacity: number;      // kWh (total battery capacity at given DoD)
    nighttimeEnergy: number;        // kWh (input nighttime energy)
    dischargeEfficiency: number;    // 0-1
    depthOfDischarge: number;       // 0-1
    daysOfAutonomy: number;         // Number of days
}

export interface PVCapacityResult {
    totalEnergyRequired: number;    // kWh/day (daytime + battery charging)
    daytimeEnergy: number;          // kWh/day (direct consumption)
    batteryChargingEnergy: number;  // kWh/day (to charge battery)
    pvCapacity: number;             // kWp (recommended PV capacity)
    adjustedSolarIrradiation: number; // kWh/m²/day (after uncertainty)
    pvSystemEfficiency: number;     // 0-1 (after losses)
}

export interface BatteryInverterResult {
    dischargePower: number;         // kW (based on peak nighttime load)
    chargingPower: number;          // kW (based on battery capacity and C-rate)
    requiredRating: number;         // kW (max of discharge and charging)
    peakNighttimeLoad: number;      // kW (input)
    batteryCapacity: number;        // kWh (input)
    cRate: number;                  // C-rate used
}

export interface HybridInverterResult {
    peakLoadScenario: number;       // kW (must handle peak load)
    pvOverloadScenario: number;     // kW (PV with 120% DC overloading)
    loadPlusChargingScenario: number; // kW (concurrent load + battery charging)
    dischargingScenario: number;    // kW (battery discharge only)
    requiredRating: number;         // kW (max of all scenarios)
    peakLoad: number;               // kW (input)
    pvCapacity: number;             // kWp (input)
    batteryCapacity: number;        // kWh (input)
    cRate: number;                  // C-rate used
}

export interface PVInverterResult {
    ratingByDcAcRatio: number;      // kW (PV capacity / DC:AC ratio)
    ratingByOverload: number;       // kW (PV capacity / 1.20)
    recommendedRating: number;      // kW (final recommendation)
    pvCapacity: number;             // kWp (input)
    dcAcRatio: number;              // DC:AC ratio used
}

// ============================================================================
// STEP 1: DAY/NIGHT ENERGY SEPARATION
// ============================================================================

/**
 * Separates 24-hour load profile into daytime and nighttime energy consumption.
 * 
 * Daytime: 6:00 AM to 6:00 PM (hours 6-17, inclusive) - when PV can supply directly
 * Nighttime: 6:00 PM to 6:00 AM (hours 18-23, 0-5) - when battery must supply
 * 
 * @param hourlyLoads - Array of 24 hourly load values in kWh (index 0 = midnight)
 * @param solarStartHour - Hour when solar production starts (default: 6 for 6:00 AM)
 * @param solarEndHour - Hour when solar production ends (default: 18 for 6:00 PM)
 * @returns EnergySplit object with daytime, nighttime, and total energy
 * 
 * @example
 * const loads = [2.5, 2.0, 1.8, ...]; // 24 values
 * const split = separateDayNightEnergy(loads);
 * console.log(split.nighttimeEnergy); // e.g., 25.3 kWh
 */
export function separateDayNightEnergy(
    hourlyLoads: number[],
    solarStartHour: number = SOLAR_START_HOUR,
    solarEndHour: number = SOLAR_END_HOUR
): EnergySplit {
    // Validate input
    if (!Array.isArray(hourlyLoads) || hourlyLoads.length !== 24) {
        console.error('Invalid hourly loads array. Expected 24 values, got:', hourlyLoads.length);
        return {
            daytimeEnergy: 0,
            nighttimeEnergy: 0,
            totalEnergy: 0,
            peakDaytimeLoad: 0,
            peakNighttimeLoad: 0,
            peakLoad: 0,
            daytimeHours: [],
            nighttimeHours: []
        };
    }

    let daytimeEnergy = 0;
    let nighttimeEnergy = 0;
    let peakDaytimeLoad = 0;
    let peakNighttimeLoad = 0;
    const daytimeHours: number[] = [];
    const nighttimeHours: number[] = [];

    hourlyLoads.forEach((load, hour) => {
        // Daytime: hours >= solarStartHour and < solarEndHour
        if (hour >= solarStartHour && hour < solarEndHour) {
            daytimeEnergy += load;
            daytimeHours.push(hour);
            if (load > peakDaytimeLoad) {
                peakDaytimeLoad = load;
            }
        } else {
            // Nighttime: all other hours
            nighttimeEnergy += load;
            nighttimeHours.push(hour);
            if (load > peakNighttimeLoad) {
                peakNighttimeLoad = load;
            }
        }
    });

    const totalEnergy = daytimeEnergy + nighttimeEnergy;
    const peakLoad = Math.max(...hourlyLoads);

    return {
        daytimeEnergy,
        nighttimeEnergy,
        totalEnergy,
        peakDaytimeLoad,
        peakNighttimeLoad,
        peakLoad,
        daytimeHours,
        nighttimeHours
    };
}

// ============================================================================
// STEP 2: BATTERY CAPACITY CALCULATION
// ============================================================================

/**
 * Calculates battery capacity based on NIGHTTIME energy consumption only.
 * 
 * Formula:
 * Usable Capacity = Nighttime Energy / Discharge Efficiency
 * Nameplate Capacity = Usable Capacity / Depth of Discharge
 * 
 * The battery must store enough energy to supply the entire nighttime load,
 * accounting for discharge efficiency losses and depth of discharge limitations.
 * 
 * @param nighttimeEnergy - Energy consumed during nighttime hours (kWh)
 * @param dischargeEfficiency - Battery discharge efficiency (0-1, typically 0.95)
 * @param depthOfDischarge - Battery DoD (0-1, typically 0.80 or 0.90)
 * @param daysOfAutonomy - Number of days of backup required (typically 1)
 * @returns BatteryCapacityResult with usable and nameplate capacities
 * 
 * @example
 * const result = calculateBatteryCapacity(25, 0.95, 0.80, 1);
 * console.log(result.nameplateCapacity); // ~32.89 kWh
 */
export function calculateBatteryCapacity(
    nighttimeEnergy: number,
    dischargeEfficiency: number = DEFAULT_DISCHARGING_EFFICIENCY,
    depthOfDischarge: number = 0.80,
    daysOfAutonomy: number = 1
): BatteryCapacityResult {
    // Step 1: Calculate usable capacity needed (accounting for discharge losses)
    const usableCapacity = (nighttimeEnergy * daysOfAutonomy) / dischargeEfficiency;

    // Step 2: Calculate nameplate capacity (accounting for DoD limitation)
    const nameplateCapacity = usableCapacity / depthOfDischarge;

    return {
        usableCapacity,
        nameplateCapacity,
        nighttimeEnergy,
        dischargeEfficiency,
        depthOfDischarge,
        daysOfAutonomy
    };
}

// ============================================================================
// STEP 3: PV CAPACITY CALCULATION
// ============================================================================

/**
 * Calculates PV capacity needed to supply both daytime load and battery charging.
 * 
 * PV must produce enough energy to:
 * 1. Supply daytime load directly
 * 2. Charge battery for nighttime use (accounting for charging losses)
 * 
 * Formula:
 * Battery Charging Energy = Nighttime Energy / (Charging Eff × PV Eff)
 * Total Energy Required = Daytime Energy + Battery Charging Energy
 * PV Capacity = Total Energy / (Adjusted Solar Irradiation × PV System Eff)
 * 
 * @param daytimeEnergy - Energy consumed during daytime (kWh)
 * @param nighttimeEnergy - Energy consumed during nighttime (kWh)
 * @param avgDailySolarIrradiation - Average daily solar irradiation (kWh/m²/day)
 * @param pvSystemLosses - PV system losses as fraction (0-1, typically 0.15 for 15%)
 * @param chargingEfficiency - Battery charging efficiency (0-1, typically 0.95)
 * @param solarUncertainty - Solar uncertainty factor (0-1, typically 0.10 for 10%)
 * @returns PVCapacityResult with total energy required and PV capacity
 * 
 * @example
 * const result = calculatePVCapacity(35, 25, 5.0);
 * console.log(result.pvCapacity); // ~15.52 kWp
 */
export function calculatePVCapacity(
    daytimeEnergy: number,
    nighttimeEnergy: number,
    avgDailySolarIrradiation: number,
    pvSystemLosses: number = DEFAULT_PV_SYSTEM_LOSSES,
    chargingEfficiency: number = DEFAULT_CHARGING_EFFICIENCY,
    solarUncertainty: number = DEFAULT_SOLAR_UNCERTAINTY
): PVCapacityResult {
    // Step 1: Adjust solar irradiation for uncertainty
    const adjustedSolarIrradiation = avgDailySolarIrradiation * (1 - solarUncertainty);

    // Step 2: Calculate PV system efficiency after losses
    const pvSystemEfficiency = 1 - pvSystemLosses;

    // Step 3: Calculate battery charging energy requirement
    // Must account for both charging efficiency losses AND PV system losses
    const batteryChargingEnergy = nighttimeEnergy / (chargingEfficiency * pvSystemEfficiency);

    // Step 4: Total PV energy required = direct daytime consumption + battery charging
    const totalEnergyRequired = daytimeEnergy + batteryChargingEnergy;

    // Step 5: Calculate PV capacity
    // PV Capacity = Total Energy Required / (Adjusted Solar Irradiation × PV System Efficiency)
    const pvCapacity = totalEnergyRequired / (adjustedSolarIrradiation * pvSystemEfficiency);

    return {
        totalEnergyRequired,
        daytimeEnergy,
        batteryChargingEnergy,
        pvCapacity,
        adjustedSolarIrradiation,
        pvSystemEfficiency
    };
}

// ============================================================================
// STEP 4: BATTERY INVERTER SIZING (AC COUPLED)
// ============================================================================

/**
 * Calculates battery inverter (PCS) sizing for AC coupled systems.
 * 
 * The battery inverter must handle:
 * 1. Discharge Power: Supply peak nighttime load
 * 2. Charging Power: Recharge battery during daytime (at 0.5C rate)
 * 
 * Rating = max(Discharge Power, Charging Power)
 * 
 * @param batteryCapacity - Battery nameplate capacity (kWh)
 * @param peakNighttimeLoad - Peak load during nighttime (kW)
 * @param cRate - Battery C-rate for charging/discharging (typically 0.5)
 * @param safetyMargin - Safety margin multiplier (typically 1.2 for 20% margin)
 * @returns BatteryInverterResult with discharge, charging, and required rating
 * 
 * @example
 * const result = calculateBatteryInverterAC(32.89, 4.5);
 * console.log(result.requiredRating); // ~16.45 kW
 */
export function calculateBatteryInverterAC(
    batteryCapacity: number,
    peakNighttimeLoad: number,
    cRate: number = BATTERY_C_RATE,
    safetyMargin: number = 1.2
): BatteryInverterResult {
    // Discharge power: Based on peak nighttime load with safety margin
    const dischargePower = peakNighttimeLoad * safetyMargin;

    // Charging power: Based on battery capacity and C-rate
    // At 0.5C, a 32.89 kWh battery can charge at 16.45 kW
    const chargingPower = batteryCapacity * cRate;

    // Required rating is the maximum of both scenarios
    const requiredRating = Math.max(dischargePower, chargingPower);

    return {
        dischargePower,
        chargingPower,
        requiredRating,
        peakNighttimeLoad,
        batteryCapacity,
        cRate
    };
}

// ============================================================================
// STEP 5: HYBRID INVERTER SIZING (DC COUPLED)
// ============================================================================

/**
 * Calculates hybrid inverter sizing for DC coupled systems.
 * 
 * The hybrid inverter must handle multiple scenarios:
 * 1. Peak Load: Supply maximum load at any time
 * 2. PV Overload: Handle PV peak power (with 120% DC overloading)
 * 3. Load + Charging: Supply load while charging battery (at 0.5C × 0.6 practical rate)
 * 4. Discharging: Battery discharge at 0.5C rate
 * 
 * Rating = max(all scenarios)
 * 
 * @param batteryCapacity - Battery nameplate capacity (kWh)
 * @param peakLoad - Peak load at any time (kW)
 * @param pvCapacity - PV array capacity (kWp)
 * @param cRate - Battery C-rate for charging/discharging (typically 0.5)
 * @param concurrentChargingFactor - Factor for concurrent load serving (0.6 = 60% of full C-rate)
 * @returns HybridInverterResult with all scenarios and required rating
 * 
 * @example
 * const result = calculateHybridInverterDC(32.89, 5.0, 15.52);
 * console.log(result.requiredRating); // ~16.45 kW
 */
export function calculateHybridInverterDC(
    batteryCapacity: number,
    peakLoad: number,
    pvCapacity: number,
    cRate: number = BATTERY_C_RATE,
    concurrentChargingFactor: number = 0.6
): HybridInverterResult {
    // Scenario 1: Must handle peak load
    const peakLoadScenario = peakLoad;

    // Scenario 2: PV with 120% DC overloading
    // Inverter rating = PV capacity / 1.20
    const pvOverloadScenario = pvCapacity / 1.20;

    // Scenario 3: Peak load + Battery charging (concurrent operation)
    // Use reduced C-rate (0.6 × 0.5C = 0.3C) for practical concurrent charging
    const chargingPower = batteryCapacity * cRate * concurrentChargingFactor;
    const loadPlusChargingScenario = peakLoad + chargingPower;

    // Scenario 4: Battery discharging only (at full 0.5C rate)
    const dischargingScenario = batteryCapacity * cRate;

    // Required rating is the maximum of all scenarios
    const requiredRating = Math.max(
        peakLoadScenario,
        pvOverloadScenario,
        loadPlusChargingScenario,
        dischargingScenario
    );

    return {
        peakLoadScenario,
        pvOverloadScenario,
        loadPlusChargingScenario,
        dischargingScenario,
        requiredRating,
        peakLoad,
        pvCapacity,
        batteryCapacity,
        cRate
    };
}

// ============================================================================
// STEP 6: PV INVERTER SIZING (AC COUPLED)
// ============================================================================

/**
 * Calculates PV inverter sizing for AC coupled systems.
 * 
 * Two methods:
 * 1. DC:AC Ratio Method: PV capacity / DC:AC ratio (typically 1.15-1.35)
 * 2. Overload Method: PV capacity / 1.20 (120% DC overloading)
 * 
 * Recommendation uses DC:AC ratio method by default.
 * 
 * @param pvCapacity - PV array capacity (kWp)
 * @param dcAcRatio - DC:AC ratio (typically 1.25)
 * @param peakDaytimeLoad - Peak daytime load (kW) - for validation
 * @returns PVInverterResult with both methods and recommendation
 * 
 * @example
 * const result = calculatePVInverterAC(15.52, 1.25);
 * console.log(result.recommendedRating); // ~12.42 kW
 */
export function calculatePVInverterAC(
    pvCapacity: number,
    dcAcRatio: number = 1.25,
    peakDaytimeLoad: number = 0
): PVInverterResult {
    // Method 1: DC:AC ratio
    const ratingByDcAcRatio = pvCapacity / dcAcRatio;

    // Method 2: 120% DC overloading
    const ratingByOverload = pvCapacity / 1.20;

    // Recommended rating (use DC:AC ratio method)
    let recommendedRating = ratingByDcAcRatio;

    // Ensure it can at least handle peak daytime load
    if (peakDaytimeLoad > 0 && recommendedRating < peakDaytimeLoad) {
        recommendedRating = peakDaytimeLoad * 1.2; // Add 20% margin
    }

    return {
        ratingByDcAcRatio,
        ratingByOverload,
        recommendedRating,
        pvCapacity,
        dcAcRatio
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats a number to a fixed decimal place with units
 */
export function formatCapacity(value: number, decimals: number = 2, unit: string = 'kWh'): string {
    return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Validates if hourly loads array is valid
 */
export function validateHourlyLoads(hourlyLoads: number[]): boolean {
    if (!Array.isArray(hourlyLoads)) return false;
    if (hourlyLoads.length !== 24) return false;
    if (hourlyLoads.some(load => typeof load !== 'number' || load < 0)) return false;
    return true;
}

/**
 * Calculates percentage difference between two values
 */
export function calculatePercentageDifference(value1: number, value2: number): number {
    if (value2 === 0) return 0;
    return ((value1 - value2) / value2) * 100;
}

