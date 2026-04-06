import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  invoice_no: string;
  company_name: string;
  posting_group: string;
  salesperson: string;
  import_batch: string;
  created_at: string;
}

export const leadService = {
  getLeads: async (params?: { hs_code?: string; country?: string; keyword?: string }) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },
  generateLeads: async (hs_code: string, keyword: string, country: string) => {
    const response = await api.post('/leads/generate', { hs_code, keyword, country });
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
    const response = await api.get('/hscodes/generate', { params: { product_type, country } });
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

export const tradeService = {
  getHistory: async (params?: { company?: string; country?: string }) => {
    const response = await api.get('/history', { params });
    return response.data;
  }
};

export const healthService = {
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};
