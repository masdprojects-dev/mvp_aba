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
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import { finalize } from 'rxjs';

import {
  Lead,
  LeadStatus,
} from '../../core/models/lead.model';

import {
  Asesora,
  AsesoraInput,
  KanbanDataService,
} from '../../core/services/kanban-data.service';

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
    ReactiveFormsModule,
    LeadDetail,
  ],
  templateUrl: './kanban.html',
  styleUrl: './kanban.scss',
})
export class Kanban implements OnInit {
  private readonly kanbanDataService = inject(KanbanDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

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

  asesoraManagerOpen = false;
  asesoras: Asesora[] = [];
  asesorasLoading = true;
  asesorasLoadError: string | null = null;
  asesoraSaving = false;
  asesoraFormError: string | null = null;
  asesoraFormSuccess: string | null = null;
  editingAsesoraId: string | null = null;

  readonly asesoraForm = this.fb.nonNullable.group({
    nombre: [''],
    email: [''],
    telefono: [''],
  });

  private readonly updatingLeadIds = new Set<Lead['id']>();

  get totalLeads(): number {
    return this.columns.reduce(
      (total, column) => total + column.leads.length,
      0,
    );
  }

  get isEditingAsesora(): boolean {
    return this.editingAsesoraId !== null;
  }

  ngOnInit(): void {
    this.cargarLeads();
    this.cargarAsesoras();
  }

  retryLoad(): void {
    this.cargarLeads();
  }

  isLeadUpdating(leadId: Lead['id']): boolean {
    return this.updatingLeadIds.has(leadId);
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

  openAsesoraManager(): void {
    this.asesoraManagerOpen = true;
    this.cancelAsesoraEdit();
  }

  closeAsesoraManager(): void {
    if (this.asesoraSaving) {
      return;
    }

    this.asesoraManagerOpen = false;
    this.cancelAsesoraEdit();
  }

  editAsesora(asesora: Asesora): void {
    if (!asesora.id) {
      return;
    }

    this.editingAsesoraId = asesora.id;
    this.asesoraFormError = null;
    this.asesoraFormSuccess = null;

    this.asesoraForm.setValue({
      nombre: asesora.nombre ?? '',
      email: asesora.email ?? '',
      telefono: asesora.telefono ?? '',
    });
  }

  cancelAsesoraEdit(): void {
    this.editingAsesoraId = null;
    this.asesoraFormError = null;
    this.asesoraFormSuccess = null;
    this.asesoraForm.reset({
      nombre: '',
      email: '',
      telefono: '',
    });
  }

  saveAsesora(): void {
    const value = this.asesoraForm.getRawValue();
    const nombre = value.nombre.trim();

    this.asesoraFormError = null;
    this.asesoraFormSuccess = null;

    if (!nombre) {
      this.asesoraFormError =
        'El nombre del asesor es obligatorio.';
      return;
    }

    const payload: AsesoraInput = {
      nombre,
      email: value.email.trim(),
      telefono: value.telefono.trim(),
    };

    this.asesoraSaving = true;

    const request$ = this.editingAsesoraId
      ? this.kanbanDataService.updateAsesora(
          this.editingAsesoraId,
          payload,
        )
      : this.kanbanDataService.createAsesora(
          payload,
        );

    request$
      .pipe(
        finalize(() => {
          this.asesoraSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          const message = this.editingAsesoraId
            ? 'Asesor actualizado correctamente.'
            : 'Asesor registrado correctamente.';

          this.editingAsesoraId = null;
          this.asesoraForm.reset({
            nombre: '',
            email: '',
            telefono: '',
          });
          this.asesoraFormSuccess = message;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error(
            'Error al guardar asesor:',
            error,
          );

          this.asesoraFormError =
            this.getAsesoraErrorMessage(error);
          this.cdr.markForCheck();
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
        previousStatus,
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

        if (this.selectedLead) {
          this.selectedLead =
            leads.find(
              (lead) =>
                lead.id === this.selectedLead?.id,
            ) ?? null;
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

  private cargarAsesoras(): void {
    this.asesorasLoading = true;
    this.asesorasLoadError = null;

    this.kanbanDataService.getAsesoras().subscribe({
      next: (asesoras) => {
        this.asesoras = asesoras;
        this.asesorasLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error(
          'Error al obtener asesoras:',
          error,
        );

        this.asesorasLoading = false;
        this.asesorasLoadError =
          'No se pudo cargar el catálogo de asesores.';
        this.cdr.markForCheck();
      },
    });
  }

  private getAsesoraErrorMessage(
    error: unknown,
  ): string {
    const message =
      error instanceof Error
        ? error.message
        : '';

    if (message.includes('ASESORA_DUPLICADA')) {
      return 'Ya existe un asesor con ese nombre.';
    }

    if (
      message.includes(
        'ASESORA_NOMBRE_REQUERIDO',
      )
    ) {
      return 'El nombre del asesor es obligatorio.';
    }

    return (
      'No se pudo guardar el asesor. ' +
      'Verifica la conexión o los permisos de Firebase.'
    );
  }
}
