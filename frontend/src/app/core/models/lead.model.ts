export type LeadStatus =
  | 'CONTACTO_INICIAL'
  | 'DISCOVERY'
  | 'SHOWING'
  | 'CIERRE';

export interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  proyecto: string;
  origen: string;
  fechaIngreso: string;
  asesorAsignado: string | null;
  status: LeadStatus;
}
