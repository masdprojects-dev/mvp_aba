export type LeadStatus =
  | 'CONTACTO_INICIAL'
  | 'DISCOVERY'
  | 'SHOWING'
  | 'CIERRE';

export type LeadHistoryType =
  | 'REGISTRO'
  | 'CAMBIO_ETAPA';

export interface LeadHistoryItem {
  id: string;
  tipo: LeadHistoryType;
  fecha: string;
  descripcion: string;
  estadoAnterior: LeadStatus | null;
  estadoNuevo: LeadStatus | null;
}

export interface Lead {
  id: string;
  leadIdOrigen: string;

  nombre: string;
  telefono: string;
  correo: string;

  proyecto: string;
  proyectoId: string;

  origen: string;
  canalOrigen: string;
  fuenteOrigen: string;
  adId: string;
  adHeadline: string;

  primerMensaje: string;

  fechaIngreso: string;
  fechaIngresoCompleta: string;

  asesorAsignadoId: string | null;
  asesorAsignado: string | null;
  asesorTelefono: string;
  fechaAsignacion: string;

  status: LeadStatus;
  historial: LeadHistoryItem[];
}
