import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { NgFor, NgIf } from '@angular/common';

import { AdminUser } from '../../core/models/admin-user.model';

import { AdminUsersService } from '../../core/services/admin-users.service';

import { UserSessionService } from '../../core/services/user-session.service';

import { FormsModule } from '@angular/forms';

import { CreateAdminUser } from '../../core/services/admin-users.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  private readonly adminUsersService = inject(AdminUsersService);

  private readonly userSessionService = inject(UserSessionService);

  private readonly changeDetector = inject(ChangeDetectorRef);

  users: AdminUser[] = [];

  loading = true;

  errorMessage = '';

  updatingUserId: string | null = null;

  showCreateModal = false;

  creatingUser = false;

  createUserError = '';

  newUser: CreateAdminUser = {
    name: '',
    usuario: '',
    email: '',
    password: '',
    telefono: '',
    role: 'asesores',
    is_admin: false,
  };

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const users = await this.adminUsersService.getUsers();

      const currentUid = this.userSessionService.currentUser?.uid;

      console.log('Usuarios obtenidos de Firestore:', users);

      this.users = users.filter((user) => user.uid !== currentUid);
    } catch (error) {
      console.error('Error cargando usuarios:', error);

      this.errorMessage = 'No se pudieron cargar los usuarios.';
    } finally {
      this.loading = false;

      // El proyecto usa Zoneless Change Detection.
      // Avisamos a Angular que debe volver a renderizar.
      this.changeDetector.markForCheck();
    }
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      direccion_general: 'Dirección General',

      financiera: 'Financiera',

      inmobiliaria: 'Inmobiliaria',

      asesores: 'Asesor',

      marketing: 'Marketing',
    };

    return labels[role] ?? role;
  }

  async toggleUserStatus(user: AdminUser): Promise<void> {
    if (this.updatingUserId === user.documentId) {
      return;
    }

    this.updatingUserId = user.documentId;

    try {
      const newStatus = !user.active;

      await this.adminUsersService.updateUserStatus(user.documentId, newStatus);

      user.active = newStatus;
    } catch (error) {
      console.error('Error actualizando usuario:', error);

      this.errorMessage = 'No se pudo actualizar el estado del usuario.';
    } finally {
      this.updatingUserId = null;

      this.changeDetector.markForCheck();
    }
  }

  openCreateModal(): void {
    this.createUserError = '';

    this.newUser = {
      name: '',
      usuario: '',
      email: '',
      password: '',
      telefono: '',
      role: 'asesores',
      is_admin: false,
    };

    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    if (this.creatingUser) {
      return;
    }

    this.showCreateModal = false;
  }

  async createUser(): Promise<void> {
    if (
      !this.newUser.name.trim() ||
      !this.newUser.usuario.trim() ||
      !this.newUser.email.trim() ||
      !this.newUser.password ||
      !this.newUser.role
    ) {
      this.createUserError = 'Completa todos los campos obligatorios.';

      return;
    }

    if (this.newUser.password.length < 6) {
      this.createUserError = 'La contraseña debe tener al menos 6 caracteres.';

      return;
    }

    this.creatingUser = true;
    this.createUserError = '';

    try {
      await this.adminUsersService.createUser(this.newUser);

      this.showCreateModal = false;

      await this.loadUsers();
    } catch (error: any) {
      console.error('Error creando usuario:', error);

      this.createUserError = error?.error?.detail ?? 'No se pudo crear el usuario.';
    } finally {
      this.creatingUser = false;

      this.changeDetector.markForCheck();
    }
  }
}
