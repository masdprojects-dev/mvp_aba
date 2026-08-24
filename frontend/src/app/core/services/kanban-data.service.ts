import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  Firestore,
  query // <-- 1. Se agregó 'query' aquí
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Lead } from '../models/lead.model';

// ---------------------------------------------------------------------------
// Interfaces para las colecciones adicionales
// ---------------------------------------------------------------------------

export interface Asesora {
  id?: string;
  nombre: string;
  correo: string;
  telefono?: string;
  [key: string]: unknown;
}

export interface Proyecto {
  id?: string;
  nombre: string;
  ubicacion?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Servicio
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class KanbanDataService {
  private readonly firestore = inject(Firestore);

  /** Retorna un Observable con todos los documentos de la coleccion leads. */
  getLeads(): Observable<Lead[]> {
    const ref = collection(this.firestore, 'leads');
    // 2. Envolvemos 'ref' dentro de query()
    return collectionData(query(ref), { idField: 'id' }) as Observable<Lead[]>;
  }

  /** Retorna un Observable con todos los documentos de la coleccion asesoras. */
  getAsesoras(): Observable<Asesora[]> {
    const ref = collection(this.firestore, 'asesoras');
    // 2. Envolvemos 'ref' dentro de query()
    return collectionData(query(ref), { idField: 'id' }) as Observable<Asesora[]>;
  }

  /** Retorna un Observable con todos los documentos de la coleccion proyectos. */
  getProyectos(): Observable<Proyecto[]> {
    const ref = collection(this.firestore, 'proyectos');
    // 2. Envolvemos 'ref' dentro de query()
    return collectionData(query(ref), { idField: 'id' }) as Observable<Proyecto[]>;
  }
}