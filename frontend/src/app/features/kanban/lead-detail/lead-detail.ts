import { DOCUMENT } from '@angular/common';

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  Lead,
  LeadStatus,
} from '../../../core/models/lead.model';

@Component({
  selector: 'app-lead-detail',
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './lead-detail.html',
  styleUrl: './lead-detail.scss',
})
export class LeadDetail
  implements OnChanges, AfterViewInit, OnDestroy
{
  private readonly fb = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);

  private previousBodyOverflow = '';

  @ViewChild('panel')
  private panel?: ElementRef<HTMLElement>;

  @Input({ required: true }) lead!: Lead;

  @Output() closePanel = new EventEmitter<void>();

  readonly leadForm = this.fb.nonNullable.group({
    leadId: [''],
    nombre: [''],
    estado: [''],
    proyecto: [''],
    proyectoId: [''],
    asesorAsignado: [''],
    asesorTelefono: [''],
    fechaAsignacion: [''],
    telefono: [''],
    correo: [''],
    origen: [''],
    canalOrigen: [''],
    fuenteOrigen: [''],
    adHeadline: [''],
    adId: [''],
    fechaIngreso: [''],
    primerMensaje: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lead'] && this.lead) {
      this.leadForm.patchValue({
        leadId: this.lead.leadIdOrigen || this.lead.id,
        nombre: this.lead.nombre,
        estado: this.estadoLabel(this.lead.status),
        proyecto: this.lead.proyecto,
        proyectoId: this.lead.proyectoId,
        asesorAsignado: this.lead.asesorAsignado ?? 'Sin asignar',
        asesorTelefono: this.lead.asesorTelefono,
        fechaAsignacion: this.lead.fechaAsignacion,
        telefono: this.lead.telefono,
        correo: this.lead.correo,
        origen: this.lead.origen,
        canalOrigen: this.lead.canalOrigen,
        fuenteOrigen: this.lead.fuenteOrigen,
        adHeadline: this.lead.adHeadline,
        adId: this.lead.adId,
        fechaIngreso:
          this.lead.fechaIngresoCompleta ||
          this.lead.fechaIngreso,
        primerMensaje: this.lead.primerMensaje,
      });
    }
  }

  ngAfterViewInit(): void {
    this.previousBodyOverflow = this.document.body.style.overflow;

    this.renderer.setStyle(
      this.document.body,
      'overflow',
      'hidden',
    );

    queueMicrotask(() => {
      this.panel?.nativeElement.focus();
    });
  }

  ngOnDestroy(): void {
    if (this.previousBodyOverflow) {
      this.renderer.setStyle(
        this.document.body,
        'overflow',
        this.previousBodyOverflow,
      );
    } else {
      this.renderer.removeStyle(
        this.document.body,
        'overflow',
      );
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  close(): void {
    this.closePanel.emit();
  }

  private estadoLabel(
    status: LeadStatus,
  ): string {
    switch (status) {
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
}