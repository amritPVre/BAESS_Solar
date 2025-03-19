import { toast } from "sonner";

// Currency data
export const CURRENCIES: {
  [code: string]: { 
    name: string;
    symbol: string;
    country: string;
  }
} = {
  "USD": { name: "US Dollar", symbol: "$", country: "United States" },
  "EUR": { name: "Euro", symbol: "€", country: "Germany" },
  "GBP": { name: "British Pound", symbol: "£", country: "United Kingdom" },
  "INR": { name: "Indian Rupee", symbol: "₹", country: "India" },
  "AED": { name: "UAE Dirham", symbol: "د.إ", country: "United Arab Emirates" },
  "SAR": { name: "Saudi Riyal", symbol: "﷼", country: "Saudi Arabia" },
  "JPY": { name: "Japanese Yen", symbol: "¥", country: "Japan" },
  "AUD": { name: "Australian Dollar", symbol: "A$", country: "Australia" },
  "CAD": { name: "Canadian Dollar", symbol: "C$", country: "Canada" }
};

// Regional cost data
export const REGION_COSTS: {
  [region: string]: {
    countries: string[];
    cost_per_kw: number;
    om_cost_percent: number;
    default_tariff: number;
    default_escalation: number;
  }
} = {
  "North America": {
    countries: ["United States", "Canada"],
    cost_per_kw: 2800,
    om_cost_percent: 1.5,
    default_tariff: 0.15,
    default_escalation: 3.0
  },
  "Europe": {
    countries: ["Germany", "France", "United Kingdom", "Spain", "Italy"],
    cost_per_kw: 2500,
    om_cost_percent: 1.8,
    default_tariff: 0.22,
    default_escalation: 2.5
  },
  "South Asia": {
    countries: ["India", "Pakistan", "Bangladesh", "Sri Lanka"],
    cost_per_kw: 1000,
    om_cost_percent: 2.0,
    default_tariff: 0.12,
    default_escalation: 4.5
  },
  "Middle East": {
    countries: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Oman"],
    cost_per_kw: 1200,
    om_cost_percent: 1.2,
    default_tariff: 0.08,
    default_escalation: 2.0
  },
  "East Asia": {
    countries: ["Japan", "South Korea", "China"],
    cost_per_kw: 1800,
    om_cost_percent: 1.5,
    default_tariff: 0.18,
    default_escalation: 2.0
  },
  "Australia/Oceania": {
    countries: ["Australia", "New Zealand"],
    cost_per_kw: 2200,
    om_cost_percent: 1.7,
    default_tariff: 0.25,
    default_escalation: 3.0
  }
};

export interface ElectricityData {
  system_type: string;
  consumption: {
    type: string;
    value?: number;
    values?: { [month: string]: number };
  } | null;
  tariff: {
    type: string;
    rate?: number;
    slabs?: { units: number; rate: number }[];
  };
  yearly_cost?: number;
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

export interface YearlyDetail {
  year: number;
  degradation_factor: number;
  energy_output: number;
  revenue?: number;
  savings?: number;
  om_cost: number;
  net_cash_flow: number;
}

export interface FinancialMetrics {
  npv: number;
  irr: number;
  roi: number;
  payback_period: number;
  yearly_details: YearlyDetail[];
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
    regional_data: {
      cost_per_kw: number;
      om_cost_percent: number;
      default_tariff: number;
      default_escalation: number;
    };
  };

  constructor() {
    // Default settings
    this.current_settings = {
      region: "North America",
      country: "United States",
      currency: "USD",
      currency_symbol: "$",
      exchange_rate: 1.0,
      regional_data: REGION_COSTS["North America"]
    };
  }

  get_exchange_rate(from_currency: string, to_currency: string): number {
    try {
      if (from_currency === to_currency) {
        return 1.0;
      }

      // Use stored exchange rate if available
      const key = `${from_currency}_${to_currency}`;
      if (this.exchange_rates[key]) {
        return this.exchange_rates[key];
      }

      // Otherwise use default rates
      return this.get_default_exchange_rate(from_currency, to_currency);
    } catch (e) {
      console.error("Error getting exchange rate:", e);
      return this.get_default_exchange_rate(from_currency, to_currency);
    }
  }

  get_default_exchange_rate(from_currency: string, to_currency: string): number {
    // Default exchange rates (update regularly in production)
    const EXCHANGE_RATES: { [currency: string]: { [currency: string]: number } } = {
      "USD": {
        "INR": 83.0,
        "EUR": 0.92,
        "GBP": 0.79,
        "AED": 3.67,
        "SAR": 3.75,
        "JPY": 148.0,
        "CAD": 1.35,
        "AUD": 1.48
      }
    };

    if (from_currency === to_currency) {
      return 1.0;
    } else if (from_currency === "USD") {
      return EXCHANGE_RATES["USD"][to_currency] || 1.0;
    } else if (to_currency === "USD") {
      // Invert the rate for USD to X conversions
      const usd_to_from = EXCHANGE_RATES["USD"][from_currency];
      return usd_to_from ? 1.0 / usd_to_from : 1.0;
    } else {
      // Convert through USD
      const usd_to_from = EXCHANGE_RATES["USD"][from_currency];
      const usd_to_to = EXCHANGE_RATES["USD"][to_currency];
      
      if (usd_to_from && usd_to_to) {
        return (1.0 / usd_to_from) * usd_to_to;
      }
      return 1.0;
    }
  }

  update_currency(new_currency: string, financial_inputs: {
    project_cost: ProjectCost | null;
    om_params: OMParams | null;
    electricity_data: ElectricityData | null;
  }): void {
    const old_currency = this.current_settings.currency;

    if (old_currency !== new_currency) {
      try {
        // Get exchange rate
        const exchange_rate = this.get_exchange_rate(old_currency, new_currency);

        // Update project cost data
        if (financial_inputs.project_cost) {
          const project_cost = financial_inputs.project_cost;
          project_cost.cost_local = project_cost.cost_local ? project_cost.cost_local * exchange_rate : 0;
          project_cost.base_cost_local *= exchange_rate;
          project_cost.cost_per_kw_local *= exchange_rate;
          if (project_cost.cost_per_kw_actual) {
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
          } else if (electricity_data.tariff.slabs) {
            for (const slab of electricity_data.tariff.slabs) {
              slab.rate *= exchange_rate;
            }
          }

          if (electricity_data.yearly_cost) {
            electricity_data.yearly_cost *= exchange_rate;
          }
        }

        // Update regional data costs in current settings
        const regional_data = this.current_settings.regional_data;
        regional_data.default_tariff *= exchange_rate;

        // Update settings
        this.current_settings.currency = new_currency;
        this.current_settings.currency_symbol = CURRENCIES[new_currency].symbol;
        this.current_settings.exchange_rate = exchange_rate;

        console.log(`Currency updated from ${old_currency} to ${new_currency}`);
        console.log(`Exchange rate: ${exchange_rate}`);
      } catch (e) {
        console.error("Error updating currency:", e);
        toast.error(`Error updating currency: ${e}`);
      }
    }
  }

  initialize_financial_settings(default_country: string = ""): {
    region: string;
    country: string;
    currency: string;
    currency_symbol: string;
    exchange_rate: number;
    regional_data: {
      cost_per_kw: number;
      om_cost_percent: number;
      default_tariff: number;
      default_escalation: number;
    };
  } {
    let country = default_country || "United States";
    let region = "North America";

    // Find the region for this country
    for (const [reg, data] of Object.entries(REGION_COSTS)) {
      if (data.countries.includes(country)) {
        region = reg;
        break;
      }
    }

    // Get regional defaults
    const regional_data = REGION_COSTS[region];

    // Get local currency based on country
    let local_currency = "USD";
    for (const [code, data] of Object.entries(CURRENCIES)) {
      if (data.country === country) {
        local_currency = code;
        break;
      }
    }

    const settings = {
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

  _calculate_slab_cost(consumption: number, slabs: { units: number; rate: number }[]): number {
    let total_cost = 0;
    let remaining_units = consumption;

    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];
      let units_in_slab;

      if (i === 0) {
        units_in_slab = Math.min(remaining_units, slab.units);
      } else {
        const prev_units = slabs[i-1].units;
        units_in_slab = Math.min(remaining_units, slab.units - prev_units);
      }

      total_cost += units_in_slab * slab.rate;
      remaining_units -= units_in_slab;

      if (remaining_units <= 0) {
        break;
      }

      // If this is the last slab and there are remaining units
      if (i === slabs.length - 1 && remaining_units > 0) {
        total_cost += remaining_units * slab.rate;
      }
    }

    return total_cost;
  }

  _calculate_npv(cash_flows: number[], discount_rate: number): number {
    try {
      let npv = 0;
      for (let year = 0; year < cash_flows.length; year++) {
        npv += cash_flows[year] / Math.pow(1 + discount_rate, year);
      }
      return npv;
    } catch (e) {
      console.error("Error calculating NPV:", e);
      return 0;
    }
  }

  _calculate_irr(cash_flows: number[]): number {
    try {
      const MAX_ITERATIONS = 1000;
      const PRECISION = 0.0000001;

      // Check if there's at least one positive and one negative cash flow
      let positive = false;
      let negative = false;
      for (const cf of cash_flows) {
        if (cf > 0) positive = true;
        if (cf < 0) negative = true;
      }

      if (!positive || !negative) return 0;

      // Newton-Raphson method for IRR calculation
      const npv = (rate: number): number => {
        let value = 0;
        for (let i = 0; i < cash_flows.length; i++) {
          value += cash_flows[i] / Math.pow(1 + rate, i);
        }
        return value;
      };

      const npvDerivative = (rate: number): number => {
        let value = 0;
        for (let i = 1; i < cash_flows.length; i++) {
          value -= i * cash_flows[i] / Math.pow(1 + rate, i + 1);
        }
        return value;
      };

      // Starting guess
      let rate = 0.1;
      let iteration = 0;

      while (iteration < MAX_ITERATIONS) {
        const value = npv(rate);
        if (Math.abs(value) < PRECISION) {
          return rate * 100; // Convert to percentage
        }

        const derivative = npvDerivative(rate);
        if (derivative === 0) {
          break;
        }

        rate = rate - value / derivative;
        
        // Handle out-of-bounds rates
        if (rate <= -1) {
          rate = -0.99;
        }

        iteration++;
      }

      // Fallback to approximation method if Newton-Raphson doesn't converge
      return this._approximateIRR(cash_flows) * 100;
    } catch (e) {
      console.error("Error calculating IRR:", e);
      return 0;
    }
  }

  _approximateIRR(cash_flows: number[]): number {
    const MIN_RATE = -0.99;
    const MAX_RATE = 0.99;
    const STEP = 0.01;
    const PRECISION = 0.01;
    
    // Function to calculate NPV at a given rate
    const npv = (rate: number): number => {
      let value = 0;
      for (let i = 0; i < cash_flows.length; i++) {
        value += cash_flows[i] / Math.pow(1 + rate, i);
      }
      return value;
    };
    
    // Binary search for IRR
    let low = MIN_RATE;
    let high = MAX_RATE;
    let mid;
    
    while (high - low > PRECISION) {
      mid = (low + high) / 2;
      const value = npv(mid);
      
      if (Math.abs(value) < PRECISION) {
        return mid;
      }
      
      if (value > 0) {
        low = mid;
      } else {
        high = mid;
      }
    }
    
    return (low + high) / 2;
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
    } catch (e) {
      console.error("Error calculating payback period:", e);
      return Infinity;
    }
  }

  calculate_financial_metrics(
    energy_data: ElectricityData,
    project_cost: number,
    om_params: OMParams,
    yearly_generation: number = 0,
    annual_degradation: number = 0.005 // 0.5% annual degradation by default
  ): FinancialMetrics {
    try {
      // Constants
      const ANALYSIS_PERIOD = 25;  // years
      const DISCOUNT_RATE = 0.08;  // 8% discount rate

      // If yearly_generation is not provided, try to use data from energy_data
      if (!yearly_generation && energy_data.yearly_cost && energy_data.tariff.type === "flat" && energy_data.tariff.rate) {
        yearly_generation = energy_data.yearly_cost / energy_data.tariff.rate;
      }

      // Calculate initial yearly savings/revenue
      let initial_yearly_revenue = 0;
      let revenue_type = "";

      if (energy_data.system_type === "Grid Export Only") {
        if (energy_data.tariff.type === "flat" && energy_data.tariff.rate) {
          initial_yearly_revenue = yearly_generation * energy_data.tariff.rate;
        } else if (energy_data.tariff.slabs) {
          // For slab-based tariff, calculate monthly revenue
          const monthly_generation = yearly_generation / 12;
          const monthly_revenue = this._calculate_slab_cost(monthly_generation, energy_data.tariff.slabs);
          initial_yearly_revenue = monthly_revenue * 12;
        }
        revenue_type = "Revenue";
      } else { // Captive Consumption
        if (energy_data.tariff.type === "flat" && energy_data.tariff.rate) {
          initial_yearly_revenue = yearly_generation * energy_data.tariff.rate;
        } else if (energy_data.tariff.slabs) {
          // For slab-based tariff, calculate monthly savings
          const monthly_generation = yearly_generation / 12;
          const monthly_savings = this._calculate_slab_cost(monthly_generation, energy_data.tariff.slabs);
          initial_yearly_revenue = monthly_savings * 12;
        }
        revenue_type = "Savings";
      }

      // Calculate cash flows with degradation
      const cash_flows = [-project_cost]; // Initial investment (negative)
      let current_revenue = initial_yearly_revenue;
      let current_om_cost = om_params.yearly_om_cost;

      const yearly_details: YearlyDetail[] = []; // Store yearly details for display

      for (let year = 0; year < ANALYSIS_PERIOD; year++) {
        // Calculate degraded generation and revenue/savings
        const degradation_factor = Math.pow(1 - annual_degradation, year);
        const degraded_amount = initial_yearly_revenue * degradation_factor;

        // Apply escalation for tariff and O&M
        const tariff_escalation_factor = Math.pow(1 + om_params.tariff_escalation, year);
        const om_escalation_factor = Math.pow(1 + om_params.om_escalation, year);
        
        const year_revenue = degraded_amount * tariff_escalation_factor;
        const year_om_cost = om_params.yearly_om_cost * om_escalation_factor;

        // Calculate net cash flow
        const net_cash_flow = year_revenue - year_om_cost;
        cash_flows.push(net_cash_flow);

        // Store yearly details
        const yearly_detail: YearlyDetail = {
          year: year + 1,
          degradation_factor,
          energy_output: yearly_generation * degradation_factor,
          om_cost: year_om_cost,
          net_cash_flow
        };

        if (revenue_type === "Revenue") {
          yearly_detail.revenue = year_revenue;
        } else {
          yearly_detail.savings = year_revenue;
        }

        yearly_details.push(yearly_detail);
      }

      // Calculate NPV
      const npv = this._calculate_npv(cash_flows, DISCOUNT_RATE);

      // Calculate IRR
      const irr = this._calculate_irr(cash_flows);

      // Calculate ROI (exclude initial investment from total returns)
      const total_returns = cash_flows.slice(1).reduce((sum, cf) => sum + cf, 0);
      const roi = (total_returns / Math.abs(project_cost)) * 100 / ANALYSIS_PERIOD; // Annualized ROI

      // Calculate payback period
      const payback = this._calculate_payback_period(cash_flows);

      // Calculate cumulative metrics
      const total_energy = yearly_details.reduce((sum, year) => sum + year.energy_output, 0);
      const total_revenue = yearly_details.reduce((sum, year) => sum + (year.revenue || year.savings || 0), 0);
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
    } catch (e) {
      console.error("Error in financial metrics calculation:", e);
      toast.error("Error calculating financial metrics");
      
      // Return default values
      return {
        npv: 0,
        irr: 0,
        roi: 0,
        payback_period: Infinity,
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
}
