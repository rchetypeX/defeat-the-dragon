import { apiRequest } from './api';

// Admin-only API functions for alpha code management

export interface AlphaCode {
  id: string;
  code_hash: string;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  notes: string | null;
}

export interface AlphaCodeStatistics {
  total: number;
  used: number;
  available: number;
}

export interface AlphaCodeResponse {
  codes: AlphaCode[];
  statistics: AlphaCodeStatistics;
}

export interface GenerateCodesRequest {
  count: number;
  notes?: string;
}

export interface GenerateCodesResponse {
  success: boolean;
  message: string;
  codes: string[];
  statistics: AlphaCodeStatistics;
}

// Get all alpha codes (admin only)
export async function getAlphaCodes(): Promise<AlphaCodeResponse> {
  return apiRequest<AlphaCodeResponse>('/admin/alpha-codes');
}

// Generate new alpha codes (admin only)
export async function generateAlphaCodes(request: GenerateCodesRequest): Promise<GenerateCodesResponse> {
  return apiRequest<GenerateCodesResponse>('/admin/alpha-codes', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

// Clear all alpha codes (admin only)
export async function clearAllAlphaCodes(): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>('/admin/alpha-codes', {
    method: 'DELETE'
  });
}

// Export alpha codes to secure location (admin only)
export async function exportAlphaCodes(): Promise<{ success: boolean; codes: string[] }> {
  const response = await getAlphaCodes();
  const availableCodes = response.codes
    .filter(code => !code.used)
    .map(code => code.code_hash);
  
  return {
    success: true,
    codes: availableCodes
  };
}
