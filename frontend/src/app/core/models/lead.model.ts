export type LeadStatus = 'NUEVO' | 'CONTACTADO';

export interface Lead {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  proyecto: string;
  origen: string;
  fechaIngreso: string;
  status: LeadStatus;
}