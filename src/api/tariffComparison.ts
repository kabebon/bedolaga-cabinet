import apiClient from './client';

export type ComparisonCellKind = 'yes' | 'no' | 'text' | 'empty';

export interface ComparisonCell {
  kind: ComparisonCellKind;
  text: string;
}

export interface ComparisonRow {
  id: string;
  labels: Record<string, string>;
  cells: Record<string, ComparisonCell>;
}

export interface ComparisonColumn {
  id: number;
  name: string;
  is_highlighted: boolean;
}

export interface ComparisonPublic {
  enabled: boolean;
  title: string;
  columns: ComparisonColumn[];
  rows: Array<{
    id: string;
    label: string;
    custom: boolean;
    cells: Record<string, ComparisonCell>;
  }>;
}

export interface ComparisonAdminTariff {
  id: number;
  name: string;
  is_active: boolean;
  is_highlighted: boolean;
}

export interface ComparisonAdmin {
  enabled: boolean;
  show_auto: boolean;
  rows: ComparisonRow[];
  tariffs: ComparisonAdminTariff[];
}

export interface ComparisonUpdate {
  enabled: boolean;
  show_auto: boolean;
  rows: ComparisonRow[];
}

export const tariffComparisonApi = {
  getPublic: async (lang: string): Promise<ComparisonPublic> => {
    const response = await apiClient.get<ComparisonPublic>('/cabinet/tariff-comparison', {
      params: { lang },
    });
    return response.data;
  },

  getAdmin: async (): Promise<ComparisonAdmin> => {
    const response = await apiClient.get<ComparisonAdmin>('/cabinet/admin/tariff-comparison');
    return response.data;
  },

  saveAdmin: async (payload: ComparisonUpdate): Promise<ComparisonAdmin> => {
    const response = await apiClient.put<ComparisonAdmin>('/cabinet/admin/tariff-comparison', payload);
    return response.data;
  },
};
