
import { toast } from "sonner";

// Currency and Regional Data
export const CURRENCIES: Record<string, { name: string; symbol: string; country: string }> = {
  "USD": { name: "US Dollar", symbol: "$", country: "United States" },
  "EUR": { name: "Euro", symbol: "€", country: "Germany" },
  "GBP": { name: "British Pound", symbol: "£", country: "United Kingdom" },
  "INR": { name: "Indian Rupee", symbol: "₹", country: "India" },
  "AED": { name: "UAE Dirham", symbol: "د.إ", country: "United Arab Emirates" },
  "OMR": { name: "Omani Rial", symbol: "ر.ع.", country: "Oman" },
  "SAR": { name: "Saudi Riyal", symbol: "ر.س", country: "Saudi Arabia" },
  "JPY": { name: "Japanese Yen", symbol: "¥", country: "Japan" },
  "CAD": { name: "Canadian Dollar", symbol: "C$", country: "Canada" },
  "AUD": { name: "Australian Dollar", symbol: "A$", country: "Australia" }
};

export const REGION_COSTS: Record<string, any> = {
  "North America": {
    "countries": ["United States", "Canada"],
    "cost_per_kw": 2800,
    "om_cost_percent": 1.5,
    "default_tariff": 0.15,
    "default_escalation": 2.5
  },
  "Europe": {
    "countries": ["Germany", "France", "United Kingdom", "Spain", "Italy"],
    "cost_per_kw": 1800,
    "om_cost_percent": 1.2,
    "default_tariff": 0.25,
    "default_escalation": 2.0
  },
  "Asia": {
    "countries": ["India", "China", "Japan", "Singapore"],
    "cost_per_kw": 1200,
    "om_cost_percent": 1.0,
    "default_tariff": 0.10,
    "default_escalation": 3.0
  },
  "Middle East": {
    "countries": ["United Arab Emirates", "Saudi Arabia", "Oman", "Qatar"],
    "cost_per_kw": 1400,
    "om_cost_percent": 1.8,
    "default_tariff": 0.08,
    "default_escalation": 2.0
  },
  "Australia & Oceania": {
    "countries": ["Australia", "New Zealand"],
    "cost_per_kw": 2000,
    "om_cost_percent": 1.3,
    "default_tariff": 0.22,
    "default_escalation": 2.2
  }
};

export interface FinancialSettings {
  region: string;
  country: string;
  currency: string;
  currency_symbol: string;
  exchange_rate: number;
  regional_data: any;
}

export interface ProjectCost {
  base_cost_usd: number;
  base_cost_local: number;
  cost_per_kw_usd: number;
  cost_per_kw_local: number;
  cost_local?: number;
  cost_per_kw_actual?: number;
  currency: string;
  currency_symbol: string;
}

export interface OMParams {
  yearly_om_cost: number;
  om_escalation: number;
  tariff_escalation: number;
}

export interface ElectricityData {
  system_type: "Captive Consumption" | "Grid Export Only";
  consumption: {
    type: "average" | "detailed";
    value?: number;
    values?: Record<string, number>;
  } | null;
  tariff: {
    type: "flat" | "slab";
    rate?: number;
    slabs?: Array<{ units: number; rate: number }>;
  };
  yearly_amount: number;
}

export interface FinancialInputs {
  project_cost: ProjectCost;
  om_params: OMParams;
  electricity_data: ElectricityData;
}

export interface FinancialMetrics {
  npv: number;
  irr: number;
  roi: number;
  payback_period: number;
  yearly_details: Array<{
    year: number;
    degradation_factor: number;
    energy_output: number;
    revenue?: number;
    savings?: number;
    om_cost: number;
    net_cash_flow: number;
  }>;
  cash_flows: number[];
  system_type: string;
  summary: {
    total_energy_25yr: number;
    total_revenue_25yr: number;
    total_om_cost_25yr: number;
    net_revenue_25yr: number;
    revenue_type: string;
  };
}

export class FinancialCalculator {
  private exchange_rates: Record<string, number> = {};
  private current_settings: FinancialSettings;

  constructor() {
    this.exchange_rates = {};
    this.current_settings = this.initialize_financial_settings();
  }

  get_exchange_rate(from_currency: string, to_currency: string): number {
    if (from_currency === to_currency) {
      return 1.0;
    }

    // Using fallback exchange rates instead of API for now
    return this.get_default_exchange_rate(from_currency, to_currency);
  }

  get_default_exchange_rate(from_currency: string, to_currency: string): number {
    // Default exchange rates (update regularly)
    const EXCHANGE_RATES: Record<string, Record<string, number>> = {
      "USD": {
        "INR": 83.0,
        "EUR": 0.92,
        "GBP": 0.79,
        "AED": 3.67,
        "OMR": 0.38,
        "SAR": 3.75,
        "JPY": 148.0,
        "CAD": 1.35,
        "AUD": 1.50
      }
    };
    
    if (from_currency === to_currency) {
      return 1.0;
    } else if (from_currency === "USD") {
      return EXCHANGE_RATES["USD"][to_currency] || 1.0;
    } else if (to_currency === "USD") {
      return 1.0 / (EXCHANGE_RATES["USD"][from_currency] || 1.0);
    } else {
      const usd_to_from = 1.0 / (EXCHANGE_RATES["USD"][from_currency] || 1.0);
      const usd_to_to = EXCHANGE_RATES["USD"][to_currency] || 1.0;
      return usd_to_from * usd_to_to;
    }
  }
  
  initialize_financial_settings(default_country: string = "United States"): FinancialSettings {
    // Find the region for this country
    const country = default_country.trim();
    const region = Object.keys(REGION_COSTS).find(
      reg => REGION_COSTS[reg].countries.includes(country)
    ) || "North America";  // Default region if country not found
    
    // Get regional defaults
    const regional_data = REGION_COSTS[region];
    
    // Get local currency based on country
    const local_currency = Object.keys(CURRENCIES).find(
      code => CURRENCIES[code].country === country
    ) || "USD";  // Default to USD if currency not found
    
    const settings: FinancialSettings = {
      region: region,
      country: country,
      currency: local_currency,
      currency_symbol: CURRENCIES[local_currency].symbol,
      exchange_rate: 1.0,
      regional_data: regional_data
    };
    
    this.current_settings = settings;
    return settings;
  }
  
  update_currency(new_currency: string, financial_inputs: FinancialInputs): void {
    const old_currency = this.current_settings.currency;
    
    if (old_currency !== new_currency) {
      try {
        // Get exchange rate
        const exchange_rate = this.get_exchange_rate(old_currency, new_currency);
        
        // Update project cost data
        if (financial_inputs.project_cost) {
          const project_cost = financial_inputs.project_cost;
          // Convert all monetary values in project cost
          project_cost.cost_local = project_cost.cost_local ? project_cost.cost_local * exchange_rate : undefined;
          project_cost.base_cost_local *= exchange_rate;
          project_cost.cost_per_kw_local *= exchange_rate;
          if (project_cost.cost_per_kw_actual !== undefined) {
            project_cost.cost_per_kw_actual *= exchange_rate;
          }
          project_cost.currency = new_currency;
          project_cost.currency_symbol = CURRENCIES[new_currency].symbol;
        }
        
        // Update O&M costs
        if (financial_inputs.om_params) {
          const om_params = financial_inputs.om_params;
          om_params.yearly_om_cost *= exchange_rate;
        }
        
        // Update electricity tariffs
        if (financial_inputs.electricity_data) {
          const electricity_data = financial_inputs.electricity_data;
          if (electricity_data.tariff.type === "flat" && electricity_data.tariff.rate) {
            electricity_data.tariff.rate *= exchange_rate;
          } else if (electricity_data.tariff.type === "slab" && electricity_data.tariff.slabs) {
            for (const slab of electricity_data.tariff.slabs) {
              slab.rate *= exchange_rate;
            }
          }
          
          electricity_data.yearly_amount *= exchange_rate;
        }
        
        // Update regional data costs in current settings
        const regional_data = this.current_settings.regional_data;
        regional_data.default_tariff *= exchange_rate;
        
        // Update settings
        this.current_settings = {
          ...this.current_settings,
          currency: new_currency,
          currency_symbol: CURRENCIES[new_currency].symbol,
          exchange_rate: exchange_rate,
          regional_data: regional_data
        };
        
      } catch (error) {
        toast.error(`Error updating currency: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  calculate_project_cost(capacity_kw: number): ProjectCost {
    const settings = this.current_settings;
    const regional_data = settings.regional_data;
    
    // Get base USD values
    const base_cost_per_kw_usd = regional_data.cost_per_kw;
    const base_cost_usd = capacity_kw * base_cost_per_kw_usd;
    
    // Convert to selected currency
    const exchange_rate = this.get_exchange_rate('USD', settings.currency);
    const base_cost_local = base_cost_usd * exchange_rate;
    const cost_per_kw_local = base_cost_per_kw_usd * exchange_rate;
    
    return {
      base_cost_usd: base_cost_usd,
      base_cost_local: base_cost_local,
      cost_per_kw_usd: base_cost_per_kw_usd,
      cost_per_kw_local: cost_per_kw_local,
      currency: settings.currency,
      currency_symbol: settings.currency_symbol
    };
  }
  
  calculate_om_parameters(project_cost: number): OMParams {
    const settings = this.current_settings;
    const regional_data = settings.regional_data;
    
    const yearly_om_percent = regional_data.om_cost_percent;
    const yearly_om_cost = project_cost * (yearly_om_percent / 100);
    const om_escalation = regional_data.default_escalation / 100;
    const tariff_escalation = regional_data.default_escalation / 100;
    
    return {
      yearly_om_cost: yearly_om_cost,
      om_escalation: om_escalation,
      tariff_escalation: tariff_escalation
    };
  }
  
  calculate_slab_cost(consumption: number, slabs: Array<{ units: number; rate: number }>): number {
    let total_cost = 0;
    let remaining_units = consumption;
    
    for (let i = 0; i < slabs.length; i++) {
      if (i === 0) {
        const units = Math.min(remaining_units, slabs[i].units);
        total_cost += units * slabs[i].rate;
      } else {
        const prev_units = slabs[i - 1].units;
        const units = Math.min(remaining_units, slabs[i].units - prev_units);
        total_cost += units * slabs[i].rate;
      }
      
      remaining_units -= units;
      
      if (remaining_units <= 0) {
        break;
      }
      
      // If this is the last slab and there are remaining units
      if (i === slabs.length - 1 && remaining_units > 0) {
        total_cost += remaining_units * slabs[i].rate;
      }
    }
    
    return total_cost;
  }
  
  calculate_financial_metrics(
    energy_data: ElectricityData, 
    project_cost: number, 
    om_params: OMParams,
    yearly_generation: number,
    annual_degradation: number = 0.006
  ): FinancialMetrics {
    // Constants
    const ANALYSIS_PERIOD = 25;  // years
    const DISCOUNT_RATE = 0.08;  // 8% discount rate
    const ANNUAL_DEGRADATION = annual_degradation;  // Default 0.6% annual degradation
    
    // Calculate initial yearly savings/revenue
    let initial_yearly_revenue = 0;
    let revenue_type = energy_data.system_type === "Grid Export Only" ? "Revenue" : "Savings";
    
    if (energy_data.tariff.type === "flat" && energy_data.tariff.rate) {
      initial_yearly_revenue = yearly_generation * energy_data.tariff.rate;
    } else if (energy_data.tariff.type === "slab" && energy_data.tariff.slabs) {
      // Calculate monthly revenue using the slab structure
      const monthly_generation = yearly_generation / 12;
      const monthly_revenue = this.calculate_slab_cost(monthly_generation, energy_data.tariff.slabs);
      initial_yearly_revenue = monthly_revenue * 12;
    }
    
    // Calculate cash flows with degradation
    const cash_flows = [-project_cost];  // Initial investment (negative)
    let current_revenue = initial_yearly_revenue;
    let current_om_cost = om_params.yearly_om_cost;
    
    const yearly_details = [];  // Store yearly details for display
    
    for (let year = 0; year < ANALYSIS_PERIOD; year++) {
      // Calculate degraded generation and revenue/savings
      const degradation_factor = Math.pow(1 - ANNUAL_DEGRADATION, year);
      const degraded_generation = yearly_generation * degradation_factor;
      const degraded_amount = current_revenue * degradation_factor;
      
      // Calculate net cash flow
      const net_cash_flow = degraded_amount - current_om_cost;
      cash_flows.push(net_cash_flow);
      
      // Store yearly details
      const yearly_detail: any = {
        year: year + 1,
        degradation_factor: degradation_factor,
        energy_output: degraded_generation,
        om_cost: current_om_cost,
        net_cash_flow: net_cash_flow
      };
      
      // Add the appropriate revenue key
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
    const npv = this.calculate_npv(cash_flows, DISCOUNT_RATE);
    
    // Calculate IRR
    const irr = this.calculate_irr(cash_flows);
    
    // Calculate ROI (exclude initial investment from total returns)
    const total_returns = cash_flows.slice(1).reduce((sum, val) => sum + val, 0);
    const roi = (total_returns / Math.abs(project_cost)) * 100 / ANALYSIS_PERIOD;  // Annualized ROI
    
    // Calculate payback period
    const payback = this.calculate_payback_period(cash_flows);
    
    // Calculate cumulative metrics
    const total_energy = yearly_details.reduce((sum, year_data) => sum + year_data.energy_output, 0);
    const total_revenue = yearly_details.reduce((sum, year_data) => {
      return sum + (year_data[revenue_type.toLowerCase()] || 0);
    }, 0);
    const total_om_cost = yearly_details.reduce((sum, year_data) => sum + year_data.om_cost, 0);
    
    return {
      npv: npv,
      irr: irr,
      roi: roi,
      payback_period: payback,
      yearly_details: yearly_details,
      cash_flows: cash_flows,
      system_type: energy_data.system_type,
      summary: {
        total_energy_25yr: total_energy,
        total_revenue_25yr: total_revenue,
        total_om_cost_25yr: total_om_cost,
        net_revenue_25yr: total_revenue - total_om_cost,
        revenue_type: revenue_type
      }
    };
  }
  
  calculate_npv(cash_flows: number[], discount_rate: number): number {
    let npv = 0;
    for (let year = 0; year < cash_flows.length; year++) {
      npv += cash_flows[year] / Math.pow(1 + discount_rate, year);
    }
    return npv;
  }
  
  calculate_irr(cash_flows: number[]): number {
    // Simple approximation for IRR
    // In a real implementation, use Newton-Raphson or bisection methods
    const guess_rate = 0.1;  // Initial guess: 10%
    
    // For simplicity, we'll use a basic iterative approach
    let irr = guess_rate;
    const max_iterations = 1000;
    const tolerance = 0.0001;
    
    for (let i = 0; i < max_iterations; i++) {
      let npv = 0;
      for (let j = 0; j < cash_flows.length; j++) {
        npv += cash_flows[j] / Math.pow(1 + irr, j);
      }
      
      if (Math.abs(npv) < tolerance) {
        return irr * 100;  // Convert to percentage
      }
      
      // Adjust irr based on npv
      irr = irr + (npv > 0 ? 0.001 : -0.001);
      
      // Safety check
      if (irr <= 0 || irr >= 1) {
        break;
      }
    }
    
    // If unable to converge, use a direct cash flow approach
    const total_returns = cash_flows.slice(1).reduce((a, b) => a + b, 0);
    const simple_irr = (total_returns / Math.abs(cash_flows[0]) - 1) * 100 / (cash_flows.length - 1);
    
    return Math.max(0, simple_irr); // Ensure non-negative
  }
  
  calculate_payback_period(cash_flows: number[]): number {
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
    return Number.POSITIVE_INFINITY;
  }
}
