
import { toast } from "sonner";
import { 
  Currency, 
  ElectricityData, 
  FinancialMetrics, 
  FinancialSettings, 
  OMParams, 
  ProjectCost, 
  RegionalData, 
  YearlyDetail 
} from "@/types/solarCalculations";

// Currency data
export const CURRENCIES: Record<string, Currency> = {
  "USD": { symbol: "$", name: "US Dollar", country: "United States" },
  "EUR": { symbol: "€", name: "Euro", country: "European Union" },
  "GBP": { symbol: "£", name: "British Pound", country: "United Kingdom" },
  "INR": { symbol: "₹", name: "Indian Rupee", country: "India" },
  "AED": { symbol: "د.إ", name: "UAE Dirham", country: "United Arab Emirates" },
  "SAR": { symbol: "﷼", name: "Saudi Riyal", country: "Saudi Arabia" },
  "OMR": { symbol: "ر.ع.", name: "Omani Rial", country: "Oman" },
  "CAD": { symbol: "C$", name: "Canadian Dollar", country: "Canada" },
  "JPY": { symbol: "¥", name: "Japanese Yen", country: "Japan" }
};

// Regional cost data
export const REGION_COSTS: Record<string, RegionalData> = {
  "North America": {
    countries: ["United States", "Canada"],
    cost_per_kw: 2300,
    default_tariff: 0.15,
    om_cost_percent: 1.5,
    default_escalation: 2.5
  },
  "Europe": {
    countries: ["United Kingdom", "European Union", "Germany", "France", "Spain", "Italy"],
    cost_per_kw: 1800,
    default_tariff: 0.22,
    om_cost_percent: 1.8,
    default_escalation: 2.0
  },
  "Middle East": {
    countries: ["United Arab Emirates", "Saudi Arabia", "Oman", "Qatar", "Bahrain", "Kuwait"],
    cost_per_kw: 1600,
    default_tariff: 0.10,
    om_cost_percent: 2.0,
    default_escalation: 3.0
  },
  "Asia": {
    countries: ["India", "China", "Japan", "South Korea", "Singapore"],
    cost_per_kw: 1400,
    default_tariff: 0.12,
    om_cost_percent: 2.5,
    default_escalation: 3.5
  }
};

export class FinancialCalculator {
  exchange_rates: Record<string, number> = {};
  current_settings: FinancialSettings = {
    region: "North America",
    country: "United States",
    currency: "USD",
    currency_symbol: "$",
    exchange_rate: 1.0,
    regional_data: REGION_COSTS["North America"]
  };

  // Get exchange rate between currencies
  get_exchange_rate(from_currency: string, to_currency: string): number {
    if (from_currency === to_currency) return 1.0;
    
    // Default exchange rates (simplified)
    const DEFAULT_RATES: Record<string, Record<string, number>> = {
      "USD": {
        "INR": 83.0,
        "EUR": 0.92,
        "GBP": 0.79,
        "AED": 3.67,
        "OMR": 0.38,
        "SAR": 3.75,
        "JPY": 148.0,
        "CAD": 1.35
      }
    };
    
    if (from_currency === "USD" && to_currency in DEFAULT_RATES["USD"]) {
      return DEFAULT_RATES["USD"][to_currency];
    } else if (to_currency === "USD" && from_currency in DEFAULT_RATES["USD"]) {
      return 1.0 / DEFAULT_RATES["USD"][from_currency];
    } else if (from_currency in DEFAULT_RATES["USD"] && to_currency in DEFAULT_RATES["USD"]) {
      // Convert via USD
      const from_to_usd = 1.0 / DEFAULT_RATES["USD"][from_currency];
      const usd_to_to = DEFAULT_RATES["USD"][to_currency];
      return from_to_usd * usd_to_to;
    }
    
    return 1.0; // Default fallback
  }

  // Initialize financial settings with location integration
  initialize_financial_settings(default_country?: string): FinancialSettings {
    let country = default_country?.trim() || "United States";
    
    // Find the region for this country
    let region = Object.keys(REGION_COSTS).find(reg => 
      REGION_COSTS[reg].countries.includes(country)
    ) || "North America";
    
    // Get regional defaults
    const regional_data = REGION_COSTS[region];
    
    // Get local currency based on country
    const local_currency = Object.keys(CURRENCIES).find(code => 
      CURRENCIES[code].country === country
    ) || "USD";
    
    const settings: FinancialSettings = {
      region,
      country,
      currency: local_currency,
      currency_symbol: CURRENCIES[local_currency].symbol,
      exchange_rate: 1.0,
      regional_data
    };
    
    this.current_settings = settings;
    return settings;
  }

  // Calculate project cost with currency conversion
  calculate_project_cost(capacity_kw: number): ProjectCost {
    const regional_data = this.current_settings.regional_data;
    
    // Get base USD values
    const base_cost_per_kw_usd = regional_data.cost_per_kw;
    const base_cost_usd = capacity_kw * base_cost_per_kw_usd;
    
    // Convert to selected currency
    const exchange_rate = this.get_exchange_rate('USD', this.current_settings.currency);
    const base_cost_local = base_cost_usd * exchange_rate;
    const cost_per_kw_local = base_cost_per_kw_usd * exchange_rate;
    
    return {
      base_cost_usd,
      base_cost_local,
      cost_per_kw_usd: base_cost_per_kw_usd,
      cost_per_kw_local,
      cost_local: base_cost_local, // Default
      currency: this.current_settings.currency,
      currency_symbol: this.current_settings.currency_symbol
    };
  }

  // Calculate O&M parameters
  calculate_om_parameters(project_cost: number): OMParams {
    const regional_data = this.current_settings.regional_data;
    const yearly_om_cost = project_cost * (regional_data.om_cost_percent / 100);
    
    return {
      yearly_om_cost,
      om_escalation: regional_data.default_escalation / 100,  // Convert to decimal
      tariff_escalation: regional_data.default_escalation / 100  // Convert to decimal
    };
  }

  // Calculate financial metrics
  calculate_financial_metrics(
    energy_data: ElectricityData,
    project_cost: number,
    om_params: OMParams,
    yearly_generation: number = 0,
    degradation_rate: number = 0.005
  ): FinancialMetrics {
    try {
      // Constants
      const ANALYSIS_PERIOD = 25;  // years
      const DISCOUNT_RATE = 0.08;  // 8% discount rate
      const ANNUAL_DEGRADATION = degradation_rate; // Default 0.5% annual degradation
      
      // Calculate initial yearly savings/revenue
      const initial_yearly_revenue = yearly_generation > 0 
        ? yearly_generation * (energy_data.tariff.type === "flat" ? energy_data.tariff.rate || 0 : 0.15)
        : energy_data.yearly_amount;
  
      const revenue_type = energy_data.system_type === "Grid Export Only" ? "Revenue" : "Savings";
      
      // Calculate cash flows with degradation
      const cash_flows = [-project_cost];  // Initial investment (negative)
      let current_revenue = initial_yearly_revenue;
      let current_om_cost = om_params.yearly_om_cost;
      
      const yearly_details: YearlyDetail[] = [];
      
      for (let year = 0; year < ANALYSIS_PERIOD; year++) {
        // Calculate degraded generation and revenue/savings
        const degradation_factor = Math.pow(1 - ANNUAL_DEGRADATION, year);
        const degraded_amount = current_revenue * degradation_factor;
        
        // Calculate net cash flow
        const net_cash_flow = degraded_amount - current_om_cost;
        cash_flows.push(net_cash_flow);
        
        // Store yearly details
        const yearly_detail: YearlyDetail = {
          year: year + 1,
          degradation_factor,
          energy_output: yearly_generation * degradation_factor,
          om_cost: current_om_cost,
          net_cash_flow
        };
        
        if (revenue_type === "Revenue") {
          yearly_detail.revenue = degraded_amount;
        } else {
          yearly_detail.savings = degraded_amount;
        }
        
        yearly_details.push(yearly_detail);
        
        // Apply escalation rates for next year
        current_revenue *= (1 + om_params.tariff_escalation);
        current_om_cost *= (1 + om_params.om_escalation);
      }
      
      // Calculate NPV
      const npv = this._calculate_npv(cash_flows, DISCOUNT_RATE);
      
      // Calculate IRR
      const irr = this._calculate_irr(cash_flows);
      
      // Calculate ROI (exclude initial investment from total returns)
      const total_returns = cash_flows.slice(1).reduce((sum, val) => sum + val, 0);
      const roi = (total_returns / Math.abs(project_cost)) * 100 / ANALYSIS_PERIOD;  // Annualized ROI
      
      // Calculate payback period
      const payback = this._calculate_payback_period(cash_flows);
      
      // Calculate cumulative metrics
      const total_energy = yearly_details.reduce((sum, year) => sum + year.energy_output, 0);
      const total_revenue = yearly_details.reduce((sum, year) => {
        return sum + (year.revenue || year.savings || 0);
      }, 0);
      const total_om_cost = yearly_details.reduce((sum, year) => sum + year.om_cost, 0);
      
      return {
        npv,
        irr,
        roi,
        payback_period: payback,
        yearly_details,
        cash_flows,
        system_type: energy_data.system_type,
        summary: {
          total_energy_25yr: total_energy,
          total_revenue_25yr: total_revenue,
          total_om_cost_25yr: total_om_cost,
          net_revenue_25yr: total_revenue - total_om_cost,
          revenue_type
        }
      };
    } catch (error) {
      console.error("Error in financial metrics calculation:", error);
      toast.error("Error in financial calculations. Please check inputs.");
      
      // Return default values
      return {
        npv: 0,
        irr: 0,
        roi: 0,
        payback_period: 0,
        yearly_details: [],
        cash_flows: [-project_cost],
        system_type: energy_data.system_type,
        summary: {
          total_energy_25yr: 0,
          total_revenue_25yr: 0,
          total_om_cost_25yr: 0,
          net_revenue_25yr: 0,
          revenue_type: "Savings"
        }
      };
    }
  }

  // Helper method: Calculate NPV
  _calculate_npv(cash_flows: number[], discount_rate: number): number {
    let npv = 0;
    for (let year = 0; year < cash_flows.length; year++) {
      npv += cash_flows[year] / Math.pow(1 + discount_rate, year);
    }
    return npv;
  }

  // Helper method: Calculate IRR (simplified approach)
  _calculate_irr(cash_flows: number[]): number {
    const MAX_ITERATIONS = 1000;
    const PRECISION = 0.0001;
    
    let guess = 0.1;  // Initial guess at 10%
    
    // Newton-Raphson method for IRR calculation
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      let npv = 0;
      let derivative = 0;
      
      for (let t = 0; t < cash_flows.length; t++) {
        npv += cash_flows[t] / Math.pow(1 + guess, t);
        if (t > 0) {
          derivative -= t * cash_flows[t] / Math.pow(1 + guess, t + 1);
        }
      }
      
      // If derivative is close to zero, avoid division by zero
      if (Math.abs(derivative) < PRECISION) {
        break;
      }
      
      const next_guess = guess - npv / derivative;
      
      // Check for convergence
      if (Math.abs(next_guess - guess) < PRECISION) {
        guess = next_guess;
        break;
      }
      
      guess = next_guess;
      
      // Check if guess is out of reasonable range
      if (guess < -0.999 || guess > 100) {
        return 0; // Return 0 if IRR calculation fails
      }
    }
    
    return guess * 100;  // Convert to percentage
  }

  // Helper method: Calculate payback period
  _calculate_payback_period(cash_flows: number[]): number {
    const initial_investment = Math.abs(cash_flows[0]);
    let cumulative = 0;
    
    for (let i = 1; i < cash_flows.length; i++) {
      cumulative += cash_flows[i];
      if (cumulative >= initial_investment) {
        // Interpolate for fractional year
        const fraction = (initial_investment - (cumulative - cash_flows[i])) / cash_flows[i];
        return i - 1 + fraction;
      }
    }
    
    // If payback is never reached
    return Infinity;
  }
}

// Create and export these types for compatibility with existing code
export type { Currency, RegionalData, ProjectCost, OMParams, ElectricityData, FinancialMetrics };
