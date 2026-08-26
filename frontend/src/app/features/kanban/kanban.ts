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

import { finalize } from 'rxjs';

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

  isLoading = true;
  loadError: string | null = null;
  saveError: string | null = null;

  private readonly updatingLeadIds = new Set<Lead['id']>();

  get totalLeads(): number {
    return this.columns.reduce(
      (total, column) => total + column.leads.length,
      0,
    );
  }

  ngOnInit(): void {
    this.cargarLeads();
  }

  retryLoad(): void {
    this.cargarLeads();
  }

  isLeadUpdating(leadId: Lead['id']): boolean {
    return this.updatingLeadIds.has(leadId);
  }

  private cargarLeads(): void {
    this.isLoading = true;
    this.loadError = null;

    this.kanbanDataService.getLeads().subscribe({
      next: (leads) => {
        console.log('Leads reales de Firebase:', leads);

        for (const column of this.columns) {
          column.leads = leads.filter(
            (lead) => lead.status === column.status,
          );
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error(
          'Error al obtener los leads desde Firebase:',
          error,
        );

        this.isLoading = false;
        this.loadError =
          'Verifica la conexión e intenta cargar el tablero nuevamente.';

        this.cdr.markForCheck();
      },
    });
  }

  selectLead(lead: Lead): void {
    if (this.isLeadUpdating(lead.id)) {
      return;
    }

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

    const lead = event.previousContainer.data[event.previousIndex];

    if (!lead || this.isLeadUpdating(lead.id)) {
      return;
    }

    const destinationColumn = this.columns.find(
      (column) => column.id === event.container.id,
    );

    if (!destinationColumn) {
      return;
    }

    const previousStatus = lead.status;
    const previousIndex = event.previousIndex;
    const previousContainer = event.previousContainer;
    const destinationContainer = event.container;

    this.saveError = null;

    // Movimiento visual inmediato.
    transferArrayItem(
      previousContainer.data,
      destinationContainer.data,
      previousIndex,
      event.currentIndex,
    );

    lead.status = destinationColumn.status;
    this.updatingLeadIds.add(lead.id);

    this.cdr.markForCheck();

    this.kanbanDataService
      .updateLeadStatus(
        lead.id,
        destinationColumn.status,
      )
      .pipe(
        finalize(() => {
          this.updatingLeadIds.delete(lead.id);
          this.cdr.markForCheck();
        }),
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

          /*
           * Buscamos la posición real de la tarjeta antes de revertirla.
           * Así evitamos mover una tarjeta equivocada si otra tarjeta
           * cambió de posición mientras Firebase respondía.
           */
          const currentLeadIndex = destinationContainer.data.findIndex(
            (item) => item.id === lead.id,
          );

          if (currentLeadIndex >= 0) {
            const restoreIndex = Math.min(
              previousIndex,
              previousContainer.data.length,
            );

            transferArrayItem(
              destinationContainer.data,
              previousContainer.data,
              currentLeadIndex,
              restoreIndex,
            );
          }

          lead.status = previousStatus;

          this.saveError =
            `No se pudo mover a ${lead.nombre}. ` +
            'La tarjeta regresó a su etapa anterior.';

          this.cdr.markForCheck();
        },
      });
  }
}
