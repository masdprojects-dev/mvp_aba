import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import { Lead } from '../../core/models/lead.model';
import { LeadsMock } from '../../core/services/leads-mock';

@Component({
  selector: 'app-kanban',
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './kanban.html',
  styleUrl: './kanban.scss',
})
export class Kanban implements OnInit {
  private readonly leadsMock = inject(LeadsMock);
  private readonly cdr = inject(ChangeDetectorRef);

  nuevos: Lead[] = [];
  contactados: Lead[] = [];

  ngOnInit(): void {
    this.leadsMock.getLeads().subscribe({
      next: (leads) => {

        this.nuevos = leads.filter(
          (lead) => lead.status === 'NUEVO',
        );

        this.contactados = leads.filter(
          (lead) => lead.status === 'CONTACTADO',
        );

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error al cargar los leads:', error);
      },
    });
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

    lead.status =
      event.container.id === 'contactados'
        ? 'CONTACTADO'
        : 'NUEVO';
  }
}