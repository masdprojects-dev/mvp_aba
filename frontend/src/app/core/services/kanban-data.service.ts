import { inject, Injectable } from '@angular/core';

import {
  addDoc,
  arrayUnion,
  collection,
  collectionData,
  doc,
  Firestore,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';

import {
  combineLatest,
  from,
  map,
  Observable,
} from 'rxjs';

import {
  Lead,
  LeadHistoryItem,
  LeadStatus,
} from '../models/lead.model';

// ---------------------------------------------------------------------------
// Estructura real de los documentos de Firestore
// ---------------------------------------------------------------------------

interface FirestoreLeadHistory {
  tipo?: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  creado_en?: unknown;
}

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
  historial?: FirestoreLeadHistory[];
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

export interface AsesoraInput {
  nombre: string;
  email: string;
  telefono: string;
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
   * que utiliza el Kanban.
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

          const documentId =
            lead.id ??
            lead.lead_id ??
            '';

          return {
            id: documentId,
            leadIdOrigen:
              lead.lead_id ?? documentId,

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

            proyectoId,

            origen:
              lead.origen?.canal ??
              lead.origen?.fuente ??
              'Sin origen',

            canalOrigen:
              lead.origen?.canal ?? '',

            fuenteOrigen:
              lead.origen?.fuente ?? '',

            adId:
              lead.origen?.ad_id ?? '',

            adHeadline:
              lead.origen?.ad_headline ?? '',

            primerMensaje:
              lead.primer_mensaje ?? '',

            fechaIngreso:
              this.formatFecha(
                lead.creado_en,
              ),

            fechaIngresoCompleta:
              this.formatFechaHora(
                lead.creado_en,
              ),

            asesorAsignadoId:
              lead.asignacion?.asesora_id ??
              null,

            asesorAsignado:
              lead.asignacion?.asesora_nombre ??
              null,

            asesorTelefono:
              lead.asignacion?.asesora_telefono ??
              '',

            fechaAsignacion:
              this.formatFechaHora(
                lead.asignacion?.asignado_en,
              ),

            status:
              this.normalizarEstado(
                lead.estado,
              ),

            historial:
              this.mapHistorial(
                documentId,
                lead.creado_en,
                lead.historial ?? [],
              ),
          } satisfies Lead;
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
    ).pipe(
      map((asesoras) =>
        (asesoras as Asesora[])
          .slice()
          .sort((a, b) =>
            a.nombre.localeCompare(
              b.nombre,
              'es',
              {
                sensitivity: 'base',
              },
            ),
          ),
      ),
    );
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
   * Actualiza la etapa comercial del lead y registra el movimiento
   * dentro del mismo documento, en el arreglo "historial".
   */
  updateLeadStatus(
    leadId: string,
    status: LeadStatus,
    previousStatus: LeadStatus,
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
          historial: arrayUnion({
            tipo: 'CAMBIO_ETAPA',
            estado_anterior: previousStatus,
            estado_nuevo: status,
            creado_en: Timestamp.now(),
          }),
        },
      ),
    );
  }

  /**
   * Registra una asesora nueva. Antes valida el nombre para evitar
   * duplicados ignorando mayúsculas, acentos y espacios extra.
   */
  createAsesora(
    input: AsesoraInput,
  ): Observable<void> {
    return from(
      this.createAsesoraInternal(input),
    );
  }

  /**
   * Modifica una asesora existente. Si cambia nombre o teléfono,
   * también actualiza esos datos denormalizados en los leads asignados.
   */
  updateAsesora(
    asesoraId: string,
    input: AsesoraInput,
  ): Observable<void> {
    return from(
      this.updateAsesoraInternal(
        asesoraId,
        input,
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Asesoras
  // -------------------------------------------------------------------------

  private async createAsesoraInternal(
    input: AsesoraInput,
  ): Promise<void> {
    const ref = collection(
      this.firestore,
      'asesoras',
    );

    const nombre = input.nombre.trim();
    const email = input.email.trim();
    const telefono = input.telefono.trim();

    await this.ensureAsesoraNombreDisponible(
      nombre,
    );

    await addDoc(
      ref,
      {
        nombre,
        nombre_normalizado:
          this.normalizarNombre(nombre),
        email,
        telefono,
        esta_activa: true,
        proyectos_asignados: [],
        leads_totales: 0,
        creado_en: Timestamp.now(),
      },
    );
  }

  private async updateAsesoraInternal(
    asesoraId: string,
    input: AsesoraInput,
  ): Promise<void> {
    const nombre = input.nombre.trim();
    const email = input.email.trim();
    const telefono = input.telefono.trim();

    await this.ensureAsesoraNombreDisponible(
      nombre,
      asesoraId,
    );

    const asesoraRef = doc(
      this.firestore,
      'asesoras',
      asesoraId,
    );

    const leadsRef = collection(
      this.firestore,
      'leads',
    );

    const leadsAsignados = await getDocs(
      query(
        leadsRef,
        where(
          'asignacion.asesora_id',
          '==',
          asesoraId,
        ),
      ),
    );

    const batch = writeBatch(
      this.firestore,
    );

    batch.update(
      asesoraRef,
      {
        nombre,
        nombre_normalizado:
          this.normalizarNombre(nombre),
        email,
        telefono,
      },
    );

    for (const leadSnapshot of leadsAsignados.docs) {
      batch.update(
        leadSnapshot.ref,
        {
          'asignacion.asesora_nombre': nombre,
          'asignacion.asesora_telefono': telefono,
        },
      );
    }

    await batch.commit();
  }

  private async ensureAsesoraNombreDisponible(
    nombre: string,
    currentId?: string,
  ): Promise<void> {
    if (!nombre) {
      throw new Error('ASESORA_NOMBRE_REQUERIDO');
    }

    const ref = collection(
      this.firestore,
      'asesoras',
    );

    const snapshot = await getDocs(
      query(ref),
    );

    const normalizado =
      this.normalizarNombre(nombre);

    const duplicate = snapshot.docs.some(
      (documentSnapshot) => {
        if (
          currentId &&
          documentSnapshot.id === currentId
        ) {
          return false;
        }

        const data =
          documentSnapshot.data() as Asesora;

        return (
          this.normalizarNombre(
            data.nombre ?? '',
          ) === normalizado
        );
      },
    );

    if (duplicate) {
      throw new Error('ASESORA_DUPLICADA');
    }
  }

  private normalizarNombre(
    nombre: string,
  ): string {
    return nombre
      .trim()
      .toLocaleLowerCase('es-MX')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  // -------------------------------------------------------------------------
  // Historial
  // -------------------------------------------------------------------------

  private mapHistorial(
    leadId: string,
    creadoEn: unknown,
    historial: FirestoreLeadHistory[],
  ): LeadHistoryItem[] {
    const items: LeadHistoryItem[] = [
      {
        id: `${leadId}_registro`,
        tipo: 'REGISTRO',
        fecha:
          this.formatFechaHora(creadoEn) ||
          'Fecha no disponible',
        descripcion: 'Lead registrado en el CRM',
        estadoAnterior: null,
        estadoNuevo: null,
      },
    ];

    historial.forEach(
      (item, index) => {
        const estadoAnterior =
          this.normalizarEstadoOpcional(
            item.estado_anterior,
          );

        const estadoNuevo =
          this.normalizarEstadoOpcional(
            item.estado_nuevo,
          );

        items.push({
          id: `${leadId}_movimiento_${index}`,
          tipo: 'CAMBIO_ETAPA',
          fecha:
            this.formatFechaHora(
              item.creado_en,
            ) || 'Fecha no disponible',
          descripcion:
            estadoAnterior && estadoNuevo
              ? `${this.estadoLabel(estadoAnterior)} → ${this.estadoLabel(estadoNuevo)}`
              : 'Cambio de etapa',
          estadoAnterior,
          estadoNuevo,
        });
      },
    );

    return items;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private normalizarEstado(
    estado?: string,
  ): LeadStatus {
    return (
      this.normalizarEstadoOpcional(estado) ??
      'CONTACTO_INICIAL'
    );
  }

  private normalizarEstadoOpcional(
    estado?: string,
  ): LeadStatus | null {
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
        return 'CONTACTO_INICIAL';

      default:
        return null;
    }
  }

  private estadoLabel(
    estado: LeadStatus,
  ): string {
    switch (estado) {
      case 'CONTACTO_INICIAL':
        return 'Contacto inicial';

      case 'DISCOVERY':
        return 'Discovery';

      case 'SHOWING':
        return 'Showing';

      case 'CIERRE':
        return 'Cierre';
    }
  }

  private formatFecha(
    value: unknown,
  ): string {
    const fecha = this.toDate(value);

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

  private formatFechaHora(
    value: unknown,
  ): string {
    const fecha = this.toDate(value);

    if (!fecha) {
      return '';
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(fecha);
  }

  private toDate(
    value: unknown,
  ): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'object') {
      const timestamp = value as {
        toDate?: () => Date;
        seconds?: number;
      };

      if (
        typeof timestamp.toDate ===
        'function'
      ) {
        return timestamp.toDate();
      }

      if (
        typeof timestamp.seconds ===
        'number'
      ) {
        return new Date(
          timestamp.seconds * 1000,
        );
      }
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  }
}
