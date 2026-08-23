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
