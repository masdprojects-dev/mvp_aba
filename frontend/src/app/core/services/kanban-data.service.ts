import { inject, Injectable } from '@angular/core';

import {
  collection,
  collectionData,
  doc,
  Firestore,
  query,
  updateDoc,
} from '@angular/fire/firestore';

import {
  combineLatest,
  from,
  map,
  Observable,
} from 'rxjs';

import {
  Lead,
  LeadStatus,
} from '../models/lead.model';

// ---------------------------------------------------------------------------
// Estructura real de los documentos de Firestore
// ---------------------------------------------------------------------------

interface FirestoreLead {
  id?: string;
  lead_id?: string;

  cliente?: {
    nombre?: string;
    telefono?: string;
    email?: string;
  };

  origen?: {
    canal?: string;
    fuente?: string;
    proyecto_id?: string;
    ad_id?: string;
    ad_headline?: string;
  };

  asignacion?: {
    asesora_id?: string;
    asesora_nombre?: string;
    asesora_telefono?: string;
    asignado_en?: unknown;
  };

  primer_mensaje?: string;
  estado?: string;
  creado_en?: unknown;
}

// ---------------------------------------------------------------------------
// Interfaces de colecciones adicionales
// ---------------------------------------------------------------------------

export interface Asesora {
  id?: string;
  nombre: string;
  email?: string;
  telefono?: string;
  proyectos_asignados?: string[];
  esta_activa?: boolean;
  leads_totales?: number;
  ultimo_lead_asignado?: unknown;

  [key: string]: unknown;
}

export interface Proyecto {
  id?: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;

  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Servicio
// ---------------------------------------------------------------------------

@Injectable({
  providedIn: 'root',
})
export class KanbanDataService {
  private readonly firestore = inject(Firestore);

  /**
   * Obtiene los leads reales de Firestore y los transforma al modelo
   * que utiliza actualmente el Kanban.
   */
  getLeads(): Observable<Lead[]> {
    const leadsRef = collection(
      this.firestore,
      'leads',
    );

    const proyectosRef = collection(
      this.firestore,
      'proyectos',
    );

    const leads$ = collectionData(
      query(leadsRef),
      {
        idField: 'id',
      },
    ) as Observable<FirestoreLead[]>;

    const proyectos$ = collectionData(
      query(proyectosRef),
      {
        idField: 'id',
      },
    ) as Observable<Proyecto[]>;

    return combineLatest([
      leads$,
      proyectos$,
    ]).pipe(
      map(([leads, proyectos]) => {
        const nombresProyectos = new Map<string, string>();

        for (const proyecto of proyectos) {
          if (proyecto.id) {
            nombresProyectos.set(
              proyecto.id,
              proyecto.nombre,
            );
          }
        }

        return leads.map((lead) => {
          const proyectoId =
            lead.origen?.proyecto_id ?? '';

          return {
            id:
              lead.id ??
              lead.lead_id ??
              '',

            nombre:
              lead.cliente?.nombre ??
              'Sin nombre',

            telefono:
              lead.cliente?.telefono ??
              '',

            correo:
              lead.cliente?.email ??
              '',

            proyecto:
              nombresProyectos.get(proyectoId) ??
              proyectoId ??
              'Sin proyecto',

            origen:
              lead.origen?.canal ??
              lead.origen?.fuente ??
              'Sin origen',

            fechaIngreso:
              this.formatFecha(
                lead.creado_en,
              ),

            asesorAsignado:
              lead.asignacion?.asesora_nombre ??
              null,

            status:
              this.normalizarEstado(
                lead.estado,
              ),
          };
        });
      }),
    );
  }

  /**
   * Obtiene las asesoras directamente de Firestore.
   */
  getAsesoras(): Observable<Asesora[]> {
    const ref = collection(
      this.firestore,
      'asesoras',
    );

    return collectionData(
      query(ref),
      {
        idField: 'id',
      },
    ) as Observable<Asesora[]>;
  }

  /**
   * Obtiene los proyectos directamente de Firestore.
   */
  getProyectos(): Observable<Proyecto[]> {
    const ref = collection(
      this.firestore,
      'proyectos',
    );

    return collectionData(
      query(ref),
      {
        idField: 'id',
      },
    ) as Observable<Proyecto[]>;
  }

  /**
   * Actualiza la etapa comercial de un lead.
   */
  updateLeadStatus(
    leadId: string,
    status: LeadStatus,
  ): Observable<void> {
    const leadRef = doc(
      this.firestore,
      'leads',
      leadId,
    );

    return from(
      updateDoc(
        leadRef,
        {
          estado: status,
        },
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private normalizarEstado(
    estado?: string,
  ): LeadStatus {
    const estadoNormalizado =
      estado
        ?.trim()
        .toUpperCase()
        .replace(/\s+/g, '_') ?? '';

    switch (estadoNormalizado) {
      case 'DISCOVERY':
        return 'DISCOVERY';

      case 'SHOWING':
        return 'SHOWING';

      case 'CIERRE':
        return 'CIERRE';

      case 'CONTACTO_INICIAL':
      case 'NUEVO':
      case 'NUEVA':
      default:
        return 'CONTACTO_INICIAL';
    }
  }

  private formatFecha(
    value: unknown,
  ): string {
    if (!value) {
      return '';
    }

    let fecha: Date | null = null;

    if (value instanceof Date) {
      fecha = value;
    }

    if (
      !fecha &&
      typeof value === 'object'
    ) {
      const timestamp = value as {
        toDate?: () => Date;
        seconds?: number;
      };

      if (
        typeof timestamp.toDate ===
        'function'
      ) {
        fecha = timestamp.toDate();
      } else if (
        typeof timestamp.seconds ===
        'number'
      ) {
        fecha = new Date(
          timestamp.seconds * 1000,
        );
      }
    }

    if (
      !fecha &&
      typeof value === 'string'
    ) {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        fecha = parsed;
      }
    }

    if (!fecha) {
      return '';
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(fecha);
  }
}