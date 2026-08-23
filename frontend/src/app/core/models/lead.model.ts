export type LeadStatus =
  | 'CONTACTO_INICIAL'
  | 'DISCOVERY'
  | 'SHOWING'
  | 'CIERRE';

export interface Lead {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  proyecto: string;
  origen: string;
  fechaIngreso: string;
  asesorAsignado: string | null;
  status: LeadStatus;
}
