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

import { Lead } from '../../../core/models/lead.model';

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
}