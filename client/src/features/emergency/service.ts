import api from '@/core/api';
import { isApiError } from '@/core/exceptions';
import type {
  EmergencyContact,
  EmergencyContactResponse,
  EmergencyAlertHistoryResponse,
  CooldownStatusResponse,
  SystemStatusResponse,
} from './types';

export const emergencyContactsApi = {
  saveEmergencyContacts: async (
    contacts: EmergencyContact,
  ): Promise<{ status: string; message: string }> => {
    const { data } = await api.post<{ status: string; message: string }>('/emergency-contacts', contacts);
    return data;
  },

  getEmergencyContacts: async (): Promise<EmergencyContactResponse | null> => {
    try {
      const { data } = await api.get<EmergencyContactResponse>('/emergency-contacts');
      return data;
    } catch (err: unknown) {
      if (isApiError(err) && err.code === 404) return null;
      throw err;
    }
  },

  deleteEmergencyContacts: async (): Promise<{ status: string; message: string }> => {
    const { data } = await api.delete<{ status: string; message: string }>('/emergency-contacts');
    return data;
  },

  getAlertHistory: async (daysBack = 30): Promise<EmergencyAlertHistoryResponse> => {
    const { data } = await api.get<EmergencyAlertHistoryResponse>('/emergency-contacts/alerts/history', {
      params: { days_back: daysBack },
    });
    return data;
  },

  getCooldownStatus: async (): Promise<CooldownStatusResponse> => {
    const { data } = await api.get<CooldownStatusResponse>('/emergency-contacts/cooldown');
    return data;
  },

  testEmailDelivery: async (email: string): Promise<{ status: string; message: string }> => {
    const { data } = await api.post<{ status: string; message: string }>('/emergency-contacts/test/email', {
      email,
    });
    return data;
  },

  getSystemStatus: async (): Promise<SystemStatusResponse> => {
    const { data } = await api.get<SystemStatusResponse>('/emergency-contacts/system/status');
    return data;
  },
};
