import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detect network errors or 500+ server errors
    if (!error.response || error.response.status >= 500) {
      // Don't trigger for the initial health check endpoints if they fail, wait, we probably DO want to trigger, 
      // but the initial health check is handled differently. We can ignore /health.
      if (error.config && !error.config.url?.includes('/health')) {
        window.dispatchEvent(new CustomEvent('backend-down'));
      }
    }
    return Promise.reject(error);
  }
);

export interface BuyerLead {
  id: number;
  hs_code: string;
  keyword: string;
  country: string;
  company_name: string;
  company_country: string;
  company_website_link: string;
  description: string;
  source: string;
  created_at: string;
}

export interface HSCode {
  id: number;
  hs_code: string;
  description: string;
  country: string;
  source: string;
  created_at: string;
  isAlreadyVaulted?: boolean;
}

export interface TradeHistory {
  id: number;
  posting_date: string;
  cust_name: string;
  ship_to_country: string;
  ship_to_name: string;
  description_brand: string;
  base_uom_item: string;
  total_quantity_pcs: number;
  product_code: string;
  item_no: string;
  company_name: string;
  posting_group: string;
  salesperson?: string;
  created_at: string;
}

export interface PaginatedHistoryResponse {
  data: TradeHistory[];
  total: number;
  page: number;
  page_size: number;
}

export interface UploadHistoryResponse {
  inserted_rows: number;
  skipped_rows: number;
  message: string;
}

export interface AnalyticalResult {
  total_quantity_pcs: number;
  company_name?: string;
  ship_to_country?: string;
  product_code?: string;
  month?: string;
  size?: string;
  item_no?: string;
  posting_group?: string;
  salesperson?: string;
  year?: string;
}

export interface PotentialBuyer {
  company_name: string;
  country: string;
  total_orders: number;
  total_quantity_pcs: number;
  first_purchase: string;
  last_purchase: string;
  activity_period: string;
}

/** Shared date-range params forwarded to all analytics API calls. */
export interface DateParams {
  date_from?: string | null;
  date_to?: string | null;
}

export interface BuyerByProduct {
  company_name: string;
  country: string;
  total_volume: number;
  transaction_count: number;
  last_purchase: string;
}

export interface RecommendedBuyer extends BuyerByProduct {
  match_reason: string;
  is_exact_match: boolean;
}

export interface AIRecommendationMetrics {
  matched_products: number;
  total_orders: number;
  total_volume: number;
  last_purchase_date: string;
}

export interface BehavioralMetrics {
  avg_order_volume: string;
  purchase_frequency: string;
  activity_window: string;
  dominant_size: string | null;
  repeat_order_score: number;
  variant_diversity_score: number;
}

export interface AIRecommendedBuyer {
  buyer_name: string;
  country: string;
  score: number;
  confidence_tier: 'High' | 'Medium' | 'Low';
  primary_match_type: string;
  archetype: string;
  activity_status: 'HOT' | 'ACTIVE' | 'WARM' | 'COLD';
  recommendation_strength: string;
  insight_summary: string;
  opportunity_signals: string[];
  behavioral_metrics: BehavioralMetrics;
  metrics: AIRecommendationMetrics;
}

export interface AIRecommendationEnvelope {
  recommendation_version: string;
  data: AIRecommendedBuyer[];
}

export interface BuyerFinderParams extends DateParams {
  product_code?: string;
  size?: string;
  country?: string;
  limit?: number;
  include_existing?: boolean;
  diversity_mode?: boolean;
}

export const leadService = {
  getLeads: async (params?: { hs_code?: string; country?: string; keyword?: string }) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },
  generateLeads: async (hs_code: string, keyword: string, country: string) => {
    const response = await api.post('/ai/generate-buyers', { hs_code, keyword, country });
    return response.data;
  },
  saveLeadManual: async (lead: Partial<BuyerLead>) => {
    const response = await api.post('/leads/manual', lead);
    return response.data;
  },
  updateLead: async (id: number, lead: Partial<BuyerLead>) => {
    const response = await api.put(`/leads/${id}`, lead);
    return response.data;
  },
  deleteLead: async (id: number) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  }
};

export const hsCodeService = {
  getHSCodes: async (country?: string) => {
    const response = await api.get('/hscodes', { params: { country } });
    return response.data;
  },
  generateHSCodes: async (product_type: string, country: string) => {
    const response = await api.post('/ai/generate-hscode', { product_type, country });
    return response.data;
  },
  saveHSCodes: async (codes: Partial<HSCode>[], country: string) => {
    const response = await api.post('/hscodes', codes, { params: { country } });
    return response.data;
  },
  saveHSCodeManual: async (code: Partial<HSCode>) => {
    const response = await api.post('/hscodes/manual', code);
    return response.data;
  },
  updateHSCode: async (id: number, code: Partial<HSCode>) => {
    const response = await api.put(`/hscodes/${id}`, code);
    return response.data;
  },
  deleteHSCode: async (id: number) => {
    const response = await api.delete(`/hscodes/${id}`);
    return response.data;
  }
};

export interface FallbackResponse<T> {
  data: T[];
  fallback: boolean;
}

export const tradeService = {
  getHistory: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
    company_name?: string;
    country?: string;
    product_code?: string;
    item_no?: string;
    posting_group?: string;
  }): Promise<PaginatedHistoryResponse> => {
    const response = await api.get('/history', { params });
    return response.data;
  },

  uploadHistory: async (files: File[]): Promise<UploadHistoryResponse> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await api.post('/history/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getTopBuyers: async (limit: number = 10, dates?: DateParams): Promise<AnalyticalResult[]> => {
    const response = await api.get('/analytics/top-buyers', { params: { limit, ...dates } });
    return response.data;
  },

  getTopCountries: async (limit: number = 10, dates?: DateParams): Promise<AnalyticalResult[]> => {
    const response = await api.get('/analytics/top-countries', { params: { limit, ...dates } });
    return response.data;
  },

  getTopProducts: async (limit: number = 10, dates?: DateParams): Promise<AnalyticalResult[]> => {
    const response = await api.get('/analytics/top-products', { params: { limit, ...dates } });
    return response.data;
  },

  getMonthlyTrend: async (dates?: DateParams): Promise<AnalyticalResult[]> => {
    const response = await api.get('/analytics/monthly-trend', { params: { ...dates } });
    return response.data;
  },

  getCompanyTrend: async (companyName: string, dates?: DateParams): Promise<AnalyticalResult[]> => {
    const response = await api.get('/analytics/company-trend', { params: { company_name: companyName, ...dates } });
    return response.data;
  },

  getTopSizes: async (limit: number = 10, dates?: DateParams): Promise<AnalyticalResult[]> => {
    const response = await api.get('/analytics/top-sizes', { params: { limit, ...dates } });
    return response.data;
  },

  getTopItems: async (limit: number = 20, dates?: DateParams): Promise<AnalyticalResult[]> => {
    const response = await api.get('/analytics/top-items', { params: { limit, ...dates } });
    return response.data;
  },

  getTopGroups: async (limit: number = 10, dates?: DateParams): Promise<AnalyticalResult[]> => {
    const response = await api.get('/analytics/top-groups', { params: { limit, ...dates } });
    return response.data;
  },

  getTopSalespeople: async (limit: number = 10, dates?: DateParams): Promise<AnalyticalResult[]> => {
    const response = await api.get('/analytics/top-salespeople', { params: { limit, ...dates } });
    return response.data;
  },

  getYearlyTrend: async (dateParams?: DateParams): Promise<AnalyticalResult[]> => {
    const params = new URLSearchParams(dateParams as Record<string, string>);
    const response = await api.get(`/analytics/yearly-trend?${params}`);
    return response.data;
  },

  getYoyComparison: async (dateParams?: DateParams, product_code?: string, country?: string): Promise<any[]> => {
    const params = new URLSearchParams(dateParams as Record<string, string>);
    if (product_code) params.append('product_code', product_code);
    if (country) params.append('country', country);
    const response = await api.get(`/analytics/yoy-comparison?${params}`);
    return response.data;
  },

  getPotentialBuyers: async (minTransactions: number, minValue: number, dateParams?: DateParams): Promise<PotentialBuyer[]> => {
    const response = await api.get('/analytics/potential-buyers', {
      params: { min_transactions: minTransactions, min_value: minValue, ...dateParams }
    });
    return response.data;
  },

  getBuyersByProduct: async (params: BuyerFinderParams): Promise<FallbackResponse<BuyerByProduct>> => {
    const response = await api.get('/analytics/buyers-by-product', { params });
    return response.data;
  },

  getRecommendedBuyers: async (params: BuyerFinderParams): Promise<RecommendedBuyer[]> => {
    const response = await api.get('/analytics/recommended-buyers', { params });
    return response.data;
  },

  getAIRecommendedBuyers: async (params: BuyerFinderParams): Promise<AIRecommendationEnvelope> => {
    const response = await api.get('/analytics/recommended-buyers-ai', { params });
    return response.data;
  }
};

export const filterService = {
  getProductCodes: async (search: string, limit = 20, country?: string, size?: string): Promise<FallbackResponse<string>> => {
    const response = await api.get('/filters/product-codes', { params: { search: search || undefined, limit, country, size } });
    return response.data;
  },

  getCountries: async (search: string, limit = 20, product_code?: string, size?: string): Promise<FallbackResponse<string>> => {
    const response = await api.get('/filters/countries', { params: { search: search || undefined, limit, product_code, size } });
    return response.data;
  },

  getSizes: async (country?: string, product_code?: string): Promise<FallbackResponse<string>> => {
    const response = await api.get('/filters/sizes', {
      params: { country: country || undefined, product_code: product_code || undefined },
    });
    return response.data;
  },
};

export const healthService = {
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};
