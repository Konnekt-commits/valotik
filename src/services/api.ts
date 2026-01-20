// Service API pour communiquer avec le backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Configuration de base pour fetch
const fetchConfig: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Fonction générique pour les requêtes
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchConfig,
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la requête');
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error.message || 'Erreur de communication avec le serveur',
    };
  }
}

// API Pickup Requests
export const pickupRequestsApi = {
  // Créer une nouvelle demande
  create: async (data: any): Promise<ApiResponse> => {
    return request('/pickup-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Récupérer toutes les demandes
  getAll: async (params?: {
    page?: number;
    limit?: number;
    statut?: string;
    priorite?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.statut) queryParams.append('statut', params.statut);
    if (params?.priorite) queryParams.append('priorite', params.priorite);

    const query = queryParams.toString();
    return request(`/pickup-requests${query ? `?${query}` : ''}`);
  },

  // Récupérer une demande par ID
  getById: async (id: string): Promise<ApiResponse> => {
    return request(`/pickup-requests/${id}`);
  },

  // Mettre à jour une demande
  update: async (id: string, data: any): Promise<ApiResponse> => {
    return request(`/pickup-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Supprimer une demande
  delete: async (id: string): Promise<ApiResponse> => {
    return request(`/pickup-requests/${id}`, {
      method: 'DELETE',
    });
  },
};

// API Case Files
export const caseFilesApi = {
  // Récupérer tous les dossiers
  getAll: async (params?: {
    page?: number;
    limit?: number;
    statut?: string;
    clientId?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.statut) queryParams.append('statut', params.statut);
    if (params?.clientId) queryParams.append('clientId', params.clientId);

    const query = queryParams.toString();
    return request(`/case-files${query ? `?${query}` : ''}`);
  },

  // Récupérer un dossier par ID
  getById: async (id: string): Promise<ApiResponse> => {
    return request(`/case-files/${id}`);
  },

  // Mettre à jour un dossier
  update: async (id: string, data: any): Promise<ApiResponse> => {
    return request(`/case-files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Clôturer un dossier
  close: async (id: string): Promise<ApiResponse> => {
    return request(`/case-files/${id}/close`, {
      method: 'POST',
    });
  },
};

// API Users
export const usersApi = {
  // Récupérer tous les utilisateurs
  getAll: async (): Promise<ApiResponse> => {
    return request('/users');
  },

  // Récupérer un utilisateur par ID
  getById: async (id: string): Promise<ApiResponse> => {
    return request(`/users/${id}`);
  },
};

// API Lots
export const lotsApi = {
  // Créer un lot avec ses composants
  create: async (data: any): Promise<ApiResponse> => {
    return request('/lots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Récupérer tous les lots d'un dossier
  getByCaseFile: async (caseFileId: string): Promise<ApiResponse> => {
    return request(`/lots/case-file/${caseFileId}`);
  },

  // Récupérer un lot par ID
  getById: async (id: string): Promise<ApiResponse> => {
    return request(`/lots/${id}`);
  },

  // Mettre à jour un lot
  update: async (id: string, data: any): Promise<ApiResponse> => {
    return request(`/lots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Supprimer un lot
  delete: async (id: string): Promise<ApiResponse> => {
    return request(`/lots/${id}`, {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthCheck = async (): Promise<ApiResponse> => {
  return request('/health');
};

export default {
  pickupRequests: pickupRequestsApi,
  caseFiles: caseFilesApi,
  users: usersApi,
  lots: lotsApi,
  healthCheck,
};
