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
    this.cargarLeads();
  }

  private cargarLeads(): void {
    this.kanbanDataService.getLeads().subscribe({
      next: (leads) => {
        console.log('Leads reales de Firebase:', leads);

        for (const column of this.columns) {
          column.leads = leads.filter(
            (lead) => lead.status === column.status,
          );
        }

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error(
          'Error al obtener los leads desde Firebase:',
          error,
        );
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
    // Movimiento dentro de la misma columna
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      return;
    }

    const lead = event.previousContainer.data[event.previousIndex];

    const previousStatus = lead.status;

    const destinationColumn = this.columns.find(
      (column) => column.id === event.container.id,
    );

    if (!destinationColumn) {
      return;
    }

    // Movimiento visual inmediato
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    lead.status = destinationColumn.status;

    this.cdr.markForCheck();

    // Guardar el nuevo estado en Firebase
    this.kanbanDataService
      .updateLeadStatus(
        lead.id,
        destinationColumn.status,
      )
      .subscribe({
        next: () => {
          console.log(
            `Lead ${lead.id} actualizado a ${destinationColumn.status}`,
          );
        },

        error: (error) => {
          console.error(
            'Error al actualizar el estado del lead:',
            error,
          );

          // Si Firebase falla, regresamos visualmente
          // la tarjeta a su columna original.
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex,
          );

          lead.status = previousStatus;

          this.cdr.markForCheck();
        },
      });
  }
}