
import { toast } from "sonner";

// Currency and Regional Data
export const CURRENCIES: { [key: string]: { name: string; symbol: string; country: string } } = {
  "USD": { name: "US Dollar", symbol: "$", country: "United States" },
  "EUR": { name: "Euro", symbol: "€", country: "European Union" },
  "GBP": { name: "British Pound", symbol: "£", country: "United Kingdom" },
  "INR": { name: "Indian Rupee", symbol: "₹", country: "India" },
  "AED": { name: "UAE Dirham", symbol: "د.إ", country: "United Arab Emirates" },
  "OMR": { name: "Omani Rial", symbol: "ر.ع.", country: "Oman" },
  "SAR": { name: "Saudi Riyal", symbol: "ر.س", country: "Saudi Arabia" },
  "JPY": { name: "Japanese Yen", symbol: "¥", country: "Japan" },
  "CAD": { name: "Canadian Dollar", symbol: "C$", country: "Canada" }
};

export const REGION_COSTS: { [key: string]: any } = {
  "North America": {
    "countries": ["United States", "Canada"],
    "cost_per_kw": 2000, // USD per kW
    "om_cost_percent": 1.0, // 1% of project cost per year
    "default_tariff": 0.12, // USD per kWh
    "default_escalation": 2.0 // 2% per year
  },
  "Europe": {
    "countries": ["United Kingdom", "European Union", "Germany", "France", "Spain", "Italy"],
    "cost_per_kw": 1800,
    "om_cost_percent": 1.2,
    "default_tariff": 0.20,
    "default_escalation": 2.5
  },
  "Middle East": {
    "countries": ["United Arab Emirates", "Saudi Arabia", "Oman", "Qatar", "Bahrain", "Kuwait"],
    "cost_per_kw": 1200,
    "om_cost_percent": 1.5,
    "default_tariff": 0.08,
    "default_escalation": 3.0
  },
  "Asia": {
    "countries": ["India", "Japan", "China", "Singapore", "Malaysia", "Thailand"],
    "cost_per_kw": 1500,
    "om_cost_percent": 1.3,
    "default_tariff": 0.15,
    "default_escalation": 2.8
  }
};

// Type definitions
export interface ProjectCost {
  base_cost_usd: number;
  base_cost_local: number;
  cost_per_kw_usd: number;
  cost_per_kw_local: number;
  cost_local: number;
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
  system_type: string;
  consumption: {
    type: string;
    value?: number;
    values?: { [key: string]: number };
  } | null;
  tariff: {
    type: string;
    rate?: number;
    slabs?: { units: number; rate: number }[];
  };
  yearly_amount: number;
}

export interface FinancialMetrics {
  npv: number;
  irr: number;
  roi: number;
  payback_period: number;
  yearly_details: any[];
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
  exchange_rates: { [key: string]: number } = {};
  current_settings: {
    region: string;
    country: string;
    currency: string;
    currency_symbol: string;
    exchange_rate: number;
    regional_data: any;
  };

  constructor() {
    this.current_settings = this.initialize_financial_settings();
  }

  initialize_financial_settings(default_country: string = "United States"): any {
    try {
      const country = default_country.trim();
      
      // Find the region for this country
      const region = Object.keys(REGION_COSTS).find(
        (reg) => REGION_COSTS[reg].countries.includes(country)
      ) || "North America";  // Default region if country not found
      
      // Get regional defaults
      const regional_data = REGION_COSTS[region];
      
      // Get local currency based on country
      const local_currency = Object.keys(CURRENCIES).find(
        (code) => CURRENCIES[code].country === country
      ) || "USD";  // Default to USD if currency not found
      
      const settings = {
        region,
        country,
        currency: local_currency,
        currency_symbol: CURRENCIES[local_currency].symbol,
        exchange_rate: 1.0,
        regional_data
      };
      
      return settings;
    } catch (error) {
      console.error("Error initializing financial settings:", error);
      // Return default settings if there's an error
      return {
        region: "North America",
        country: "United States",
        currency: "USD",
        currency_symbol: "$",
        exchange_rate: 1.0,
        regional_data: REGION_COSTS["North America"]
      };
    }
  }

  get_default_exchange_rate(from_currency: string, to_currency: string): number {
    // Default exchange rates (update regularly)
    const EXCHANGE_RATES: { [key: string]: { [key: string]: number } } = {
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

  async get_exchange_rate(from_currency: string, to_currency: string): Promise<number> {
    try {
      if (from_currency === to_currency) {
        return 1.0;
      }
      
      // Using a free currency API
      const url = `https://api.exchangerate-api.com/v4/latest/${from_currency}`;
      const response = await fetch(url);
      
      if (response.status === 200) {
        const data = await response.json();
        const rate = data.rates[to_currency];
        return rate;
      }
      return this.get_default_exchange_rate(from_currency, to_currency);
    } catch (error) {
      console.warn(`Using default exchange rates: ${error}`);
      return this.get_default_exchange_rate(from_currency, to_currency);
    }
  }

  update_currency(new_currency: string, financial_inputs: any): void {
    const old_currency = this.current_settings.currency;
    
    if (old_currency !== new_currency) {
      try {
        // Get exchange rate
        const exchange_rate = this.get_default_exchange_rate(old_currency, new_currency);
        
        // Update project cost data
        if (financial_inputs.project_cost) {
          const project_cost = financial_inputs.project_cost;
          // Convert all monetary values in project cost
          project_cost.cost_local *= exchange_rate;
          project_cost.base_cost_local *= exchange_rate;
          project_cost.cost_per_kw_local *= exchange_rate;
          if ('cost_per_kw_actual' in project_cost) {
            project_cost.cost_per_kw_actual *= exchange_rate;
          }
          project_cost.currency = new_currency;
          project_cost.currency_symbol = CURRENCIES[new_currency].symbol;
        }
        
        // Update O&M costs
        if (financial_inputs.om_params) {
          financial_inputs.om_params.yearly_om_cost *= exchange_rate;
        }
        
        // Update electricity tariffs
        if (financial_inputs.electricity_data) {
          const electricity_data = financial_inputs.electricity_data;
          if (electricity_data.tariff.type === "flat") {
            electricity_data.tariff.rate *= exchange_rate;
          } else {
            electricity_data.tariff.slabs.forEach((slab: any) => {
              slab.rate *= exchange_rate;
            });
          }
          
          electricity_data.yearly_amount *= exchange_rate;
        }
        
        // Update regional data costs in current settings
        const regional_data = { ...this.current_settings.regional_data };
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
        console.error(`Error updating currency: ${error}`);
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
    const exchange_rate = this.get_default_exchange_rate('USD', settings.currency);
    const base_cost_local = base_cost_usd * exchange_rate;
    const cost_per_kw_local = base_cost_per_kw_usd * exchange_rate;
    
    return {
      base_cost_usd,
      base_cost_local,
      cost_per_kw_usd: base_cost_per_kw_usd,
      cost_per_kw_local,
      cost_local: base_cost_local,
      currency: settings.currency,
      currency_symbol: settings.currency_symbol
    };
  }

  calculate_om_parameters(project_cost: number): OMParams {
    const settings = this.current_settings;
    const regional_data = settings.regional_data;
    
    const yearly_om_percent = regional_data.om_cost_percent;
    const yearly_om_cost = project_cost * (yearly_om_percent / 100);
    
    return {
      yearly_om_cost,
      om_escalation: regional_data.default_escalation / 100,
      tariff_escalation: regional_data.default_escalation / 100
    };
  }

  calculate_financial_metrics(
    energy_data: ElectricityData,
    project_cost: number,
    om_params: OMParams,
    yearly_generation: number,
    degradation_rate: number = 0.005
  ): FinancialMetrics {
    try {
      // Constants
      const ANALYSIS_PERIOD = 25;  // years
      const DISCOUNT_RATE = 0.08;  // 8% discount rate
      
      // Calculate initial yearly savings/revenue
      let initial_yearly_revenue = 0;
      let revenue_type = "Revenue";
      
      if (energy_data.system_type === "Grid Export Only") {
        initial_yearly_revenue = this._calculate_grid_export_revenue(energy_data, yearly_generation);
        revenue_type = "Revenue";
      } else {  // Captive Consumption
        initial_yearly_revenue = this._calculate_consumption_savings(energy_data, yearly_generation);
        revenue_type = "Savings";
      }
      
      // Calculate cash flows with degradation
      const cash_flows: number[] = [-project_cost];  // Initial investment (negative)
      let current_revenue = initial_yearly_revenue;
      let current_om_cost = om_params.yearly_om_cost;
      
      const yearly_details: any[] = [];  // Store yearly details for display
      
      for (let year = 0; year < ANALYSIS_PERIOD; year++) {
        // Calculate degraded generation and revenue/savings
        const degradation_factor = Math.pow(1 - degradation_rate, year);
        const degraded_amount = current_revenue * degradation_factor;
        
        // Calculate net cash flow
        const net_cash_flow = degraded_amount - current_om_cost;
        cash_flows.push(net_cash_flow);
        
        // Store yearly details
        const yearly_detail: any = {
          year: year + 1,
          degradation_factor,
          energy_output: yearly_generation * degradation_factor,
        };
        
        // Use the appropriate key based on revenue type
        if (revenue_type === "Revenue") {
          yearly_detail.revenue = degraded_amount;
        } else {
          yearly_detail.savings = degraded_amount;
        }
        
        yearly_detail.om_cost = current_om_cost;
        yearly_detail.net_cash_flow = net_cash_flow;
        
        yearly_details.push(yearly_detail);
        
        // Apply escalation rates for next year
        current_revenue *= (1 + om_params.tariff_escalation);
        current_om_cost *= (1 + om_params.om_escalation);
      }
      
      // Calculate NPV
      const npv = this._calculate_npv(cash_flows, DISCOUNT_RATE);
      
      // Calculate IRR
      const irr = this._calculate_irr(cash_flows);
      
      // Calculate ROI
      const total_returns = cash_flows.slice(1).reduce((sum, val) => sum + val, 0);
      const roi = (total_returns / project_cost) * 100 / ANALYSIS_PERIOD; // Annualized ROI
      
      // Calculate payback period
      const payback = this._calculate_payback_period(cash_flows);
      
      // Calculate cumulative metrics
      const total_energy = yearly_details.reduce((sum, year) => sum + year.energy_output, 0);
      const total_revenue = yearly_details.reduce((sum, year) => {
        return sum + (revenue_type === "Revenue" ? year.revenue : year.savings);
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
      console.error(`Error in financial metrics calculation: ${error}`);
      throw error;
    }
  }

  _calculate_grid_export_revenue(energy_data: ElectricityData, yearly_generation: number): number {
    try {
      if (energy_data.tariff.type === 'flat' && energy_data.tariff.rate !== undefined) {
        return yearly_generation * energy_data.tariff.rate;
      } else if (energy_data.tariff.slabs) {
        // For slab-based tariff
        const monthly_generation = yearly_generation / 12;
        const monthly_revenue = this._calculate_slab_cost(monthly_generation, energy_data.tariff.slabs);
        return monthly_revenue * 12;
      }
      return 0;
    } catch (error) {
      console.error(`Error calculating grid export revenue: ${error}`);
      return 0;
    }
  }

  _calculate_consumption_savings(energy_data: ElectricityData, yearly_generation: number): number {
    try {
      if (!energy_data.consumption) {
        // If no consumption data, treat as grid export
        return this._calculate_grid_export_revenue(energy_data, yearly_generation);
      }
      
      if (energy_data.tariff.type === 'flat' && energy_data.tariff.rate !== undefined) {
        return yearly_generation * energy_data.tariff.rate;
      } else if (energy_data.tariff.slabs) {
        const monthly_generation = yearly_generation / 12;
        const monthly_savings = this._calculate_slab_cost(monthly_generation, energy_data.tariff.slabs);
        return monthly_savings * 12;
      }
      return 0;
    } catch (error) {
      console.error(`Error calculating consumption savings: ${error}`);
      return 0;
    }
  }

  _calculate_slab_cost(consumption: number, slabs: { units: number; rate: number }[]): number {
    try {
      let total_cost = 0;
      let remaining_units = consumption;
      
      for (let i = 0; i < slabs.length; i++) {
        let units;
        if (i === 0) {
          units = Math.min(remaining_units, slabs[i].units);
        } else {
          const prev_units = slabs[i-1].units;
          units = Math.min(remaining_units, slabs[i].units - prev_units);
        }
        
        total_cost += units * slabs[i].rate;
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
    } catch (error) {
      console.error(`Error calculating slab cost: ${error}`);
      return 0;
    }
  }

  _calculate_npv(cash_flows: number[], discount_rate: number): number {
    try {
      let npv = 0;
      for (let year = 0; year < cash_flows.length; year++) {
        npv += cash_flows[year] / Math.pow(1 + discount_rate, year);
      }
      return npv;
    } catch (error) {
      console.error(`Error calculating NPV: ${error}`);
      return 0;
    }
  }

  _calculate_irr(cash_flows: number[]): number {
    try {
      if (cash_flows.length < 2) return 0;
      
      // Simple Newton-Raphson method for IRR
      let guess = 0.1; // Initial guess
      let maxIterations = 100;
      let precision = 0.0001;
      
      for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let derivative = 0;
        
        for (let j = 0; j < cash_flows.length; j++) {
          const denom = Math.pow(1 + guess, j);
          npv += cash_flows[j] / denom;
          if (j > 0) {
            derivative -= j * cash_flows[j] / (Math.pow(1 + guess, j + 1));
          }
        }
        
        if (Math.abs(npv) < precision) {
          return guess * 100; // Convert to percentage
        }
        
        if (derivative === 0) {
          break; // Avoid division by zero
        }
        
        guess = guess - npv / derivative;
        
        // If the guess becomes negative or too large, fallback calculation
        if (guess < -0.99 || guess > 1) {
          // Simple approximation for extreme cases
          const totalReturn = cash_flows.slice(1).reduce((sum, cf) => sum + cf, 0);
          return (totalReturn / Math.abs(cash_flows[0]) - 1) * 100 / (cash_flows.length - 1);
        }
      }
      
      // Fallback if not converged
      console.warn("IRR calculation did not converge, using approximation");
      const totalReturn = cash_flows.slice(1).reduce((sum, cf) => sum + cf, 0);
      const approximateIRR = (totalReturn / Math.abs(cash_flows[0]) - 1) * 100 / (cash_flows.length - 1);
      return approximateIRR;
    } catch (error) {
      console.error(`Error calculating IRR: ${error}`);
      return 0;
    }
  }

  _calculate_payback_period(cash_flows: number[]): number {
    try {
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
    } catch (error) {
      console.error(`Error calculating payback period: ${error}`);
      return Infinity;
    }
  }
}
