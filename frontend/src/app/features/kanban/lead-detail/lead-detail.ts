import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import { Lead } from '../../../core/models/lead.model';

@Component({
  selector: 'app-lead-detail',
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './lead-detail.html',
  styleUrl: './lead-detail.scss',
})
export class LeadDetail implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input({ required: true }) lead!: Lead;

  @Output() closePanel = new EventEmitter<void>();

  readonly leadForm = this.fb.group({
    nombre: [''],
    proyecto: [''],
    asesorAsignado: [''],
    telefono: [''],
    correo: [''],
    origen: [''],
    fechaIngreso: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lead'] && this.lead) {
      this.leadForm.patchValue({
        nombre: this.lead.nombre,
        proyecto: this.lead.proyecto,
        asesorAsignado: this.lead.asesorAsignado ?? 'Sin asignar',
        telefono: this.lead.telefono,
        correo: this.lead.correo,
        origen: this.lead.origen,
        fechaIngreso: this.lead.fechaIngreso,
      });
    }
  }

  close(): void {
    this.closePanel.emit();
  }
}
