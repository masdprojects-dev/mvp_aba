import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import {
  Lead,
  LeadStatus,
} from '../../core/models/lead.model';
import { LeadsMock } from '../../core/services/leads-mock';
import { KanbanDataService } from '../../core/services/kanban-data.service';
import { LeadDetail } from './lead-detail/lead-detail';

interface KanbanColumn {
  id: string;
  title: string;
  status: LeadStatus;
  indicatorClass: string;
  leads: Lead[];
}

@Component({
  selector: 'app-kanban',
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    LeadDetail,
  ],
  templateUrl: './kanban.html',
  styleUrl: './kanban.scss',
})
export class Kanban implements OnInit {
  private readonly leadsMock = inject(LeadsMock);
  private readonly kanbanDataService = inject(KanbanDataService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly columns: KanbanColumn[] = [
    {
      id: 'contacto-inicial',
      title: 'CONTACTO INICIAL',
      status: 'CONTACTO_INICIAL',
      indicatorClass: 'initial',
      leads: [],
    },
    {
      id: 'discovery',
      title: 'DISCOVERY',
      status: 'DISCOVERY',
      indicatorClass: 'discovery',
      leads: [],
    },
    {
      id: 'showing',
      title: 'SHOWING',
      status: 'SHOWING',
      indicatorClass: 'showing',
      leads: [],
    },
    {
      id: 'cierre',
      title: 'CIERRE',
      status: 'CIERRE',
      indicatorClass: 'closing',
      leads: [],
    },
  ];

  selectedLead: Lead | null = null;

  get totalLeads(): number {
    return this.columns.reduce(
      (total, column) => total + column.leads.length,
      0,
    );
  }

  ngOnInit(): void {
    // -----------------------------------------------------------------------
    // Conexión a Firebase Firestore — console.log de diagnóstico
    // -----------------------------------------------------------------------

    this.kanbanDataService.getLeads().subscribe({
      next: (leads) => {
        console.log('Datos de Leads:', leads);
      },
      error: (error) => {
        console.error('Error al obtener Leads desde Firestore:', error);
      },
    });

    this.kanbanDataService.getAsesoras().subscribe({
      next: (asesoras) => {
        console.log('Datos de Asesoras:', asesoras);
      },
      error: (error) => {
        console.error('Error al obtener Asesoras desde Firestore:', error);
      },
    });

    this.kanbanDataService.getProyectos().subscribe({
      next: (proyectos) => {
        console.log('Datos de Proyectos:', proyectos);
      },
      error: (error) => {
        console.error('Error al obtener Proyectos desde Firestore:', error);
      },
    });

    // -----------------------------------------------------------------------
    // Carga de datos mock para renderizar las columnas del tablero
    // -----------------------------------------------------------------------

    this.leadsMock.getLeads().subscribe({
      next: (leads) => {
        for (const column of this.columns) {
          column.leads = leads.filter(
            (lead) => lead.status === column.status,
          );
        }

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error al cargar los leads:', error);
      },
    });
  }

  selectLead(lead: Lead): void {
    this.selectedLead = lead;
  }

  closeLeadDetail(): void {
    this.selectedLead = null;
  }

  drop(event: CdkDragDrop<Lead[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const lead = event.container.data[event.currentIndex];
    const destinationColumn = this.columns.find(
      (column) => column.id === event.container.id,
    );

    if (destinationColumn) {
      lead.status = destinationColumn.status;
    }
  }
}
