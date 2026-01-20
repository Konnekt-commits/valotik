// Types pour l'API D3E Collection

export interface CreatePickupRequestDTO {
  clientName: string;
  siteName: string;
  siteAddress: string;
  contactName: string;
  contactFunction?: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
  mainCategory: string;
  estimatedVolume?: string;
  priority: 'high' | 'medium' | 'low';
  plannedVisitDate?: string;
  accessNotes?: string;
}

export interface UpdatePickupRequestDTO {
  descriptionInitiale?: string;
  categoriePrincipale?: string;
  volumeEstime?: string;
  priorite?: 'high' | 'medium' | 'low';
  statut?: string;
  plannedVisitAt?: Date;
  accessNotes?: string;
}

export interface CreateCaseFileDTO {
  requestId: string;
  reference: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  statut?: string;
  priorite?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}
