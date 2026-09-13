import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';

import {
  Firestore,
  doc,
  getDoc,
} from '@angular/fire/firestore';

import { AppUser } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  private appUser: AppUser | null = null;

  async login(email: string, password: string): Promise<AppUser> {
    const credential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const uid = credential.user.uid;

    const userRef = doc(this.firestore, `users/${uid}`);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await signOut(this.auth);

      throw new Error(
        'El usuario no tiene un perfil configurado en el CRM.'
      );
    }

    const data = userSnapshot.data();

    const user: AppUser = {
      uid,
      email: credential.user.email ?? '',
      displayName: data['displayName'] ?? '',
      role: data['role'],
      active: data['active'] ?? false,
    };

    if (!user.active) {
      await signOut(this.auth);

      throw new Error(
        'Tu cuenta se encuentra desactivada. Contacta a un administrador.'
      );
    }

    this.appUser = user;

    return user;
  }

  async logout(): Promise<void> {
    this.appUser = null;
    await signOut(this.auth);
  }

  getCurrentUser(): AppUser | null {
    return this.appUser;
  }

  get firebaseUser() {
    return this.auth.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }
}