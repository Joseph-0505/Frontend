export type AppointmentStatus = "pendente" | "confirmado" | "concluido" | "cancelado";

export interface BusinessProfile {
  businessName: string;
  cnpj: string;
}

export interface UserProfile {
  id: ID;
  name: string;
  email: string;
  cpf: string;
  businessProfile: Nullable<BusinessProfile>;
}

export interface Appointment {
  id: ID;
  clientId: ID;
  professionalId: string;
  roomId?: string;
  sala?: string;
  serviceId: ID;
  scheduledAt?: string;
  day: string;
  hour: string;
  cliente: string;
  servico: string;
  profissional: string;
  status: AppointmentStatus;
  valorEstimado: number;
  duracaoMin?: number;
  endHour?: string;
  observacoes: string;
  notes?: string;
}
