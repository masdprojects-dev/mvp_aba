import { inject, Injectable } from '@angular/core';

import { Firestore } from '@angular/fire/firestore';

import { collection, getDocs } from 'firebase/firestore';
import { AdminUser } from '../models/admin-user.model';

import { HttpClient } from '@angular/common/http';

import { Auth } from '@angular/fire/auth';

import { getIdToken } from 'firebase/auth';

import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private readonly http = inject(HttpClient);

  private readonly auth = inject(Auth);

  private readonly apiUrl = 'http://localhost:8080';

  private readonly firestore = inject(Firestore);

  async getUsers(): Promise<AdminUser[]> {
    const usersRef = collection(this.firestore, 'users');

    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map((document) => {
      const data = document.data();

      return {
        documentId: document.id,

        uid: data['uid'] ?? '',

        name: data['name'] ?? '',

        email: data['email'] ?? '',

        role: data['role'],

        active: data['active'] === true,

        is_admin: data['is_admin'] === true,

        telefono: data['telefono'],

        usuario: data['usuario'],
      } as AdminUser;
    });
  }

  async updateUserStatus(documentId: string, active: boolean): Promise<void> {
    const firebaseUser = this.auth.currentUser;

    if (!firebaseUser) {
      throw new Error('USER_NOT_AUTHENTICATED');
    }

    const token = await getIdToken(firebaseUser);

    await firstValueFrom(
      this.http.patch(
        `${this.apiUrl}/api/admin/users/${documentId}/status`,
        {
          active,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    );
  }

  async createUser(user: CreateAdminUser): Promise<void> {
    const firebaseUser = this.auth.currentUser;

    if (!firebaseUser) {
      throw new Error('USER_NOT_AUTHENTICATED');
    }

    const token = await getIdToken(firebaseUser);

    await firstValueFrom(
      this.http.post(`${this.apiUrl}/api/admin/users`, user, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
  }
}

export interface CreateAdminUser {
  name: string;
  usuario: string;
  email: string;
  password: string;
  telefono: string;
  role: string;
  is_admin: boolean;
}
