import {
  inject,
  Injectable,
} from '@angular/core';

import {
  Auth,
} from '@angular/fire/auth';

import {
  Firestore,
} from '@angular/fire/firestore';

import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

import {
  CurrentUser,
  FirestoreRole,
  RolePermissions,
  UserRole,
} from '../models/current-user.model';

import {
  UserSessionService,
} from './user-session.service';


interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  is_admin: boolean;

  telefono?: string | number;
  usuario?: string;
}


const ROLE_MAP: Record<
  FirestoreRole,
  UserRole
> = {
  direccion_general: 'ADMIN',
  financiera: 'FINANCE',
  inmobiliaria: 'MANAGER',
  asesores: 'ADVISOR',
  marketing: 'MARKETING',
};


@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly auth =
    inject(Auth);

  private readonly firestore =
    inject(Firestore);

  private readonly userSession =
    inject(UserSessionService);


  async login(
    email: string,
    password: string,
  ): Promise<CurrentUser> {

    const credential =
      await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

    try {

      return await this.loadCurrentUser(
        credential.user,
      );

    } catch (error) {

      await this.clearAuthentication();

      throw error;
    }
  }


  async logout(): Promise<void> {

    await this.clearAuthentication();
  }


  async restoreSession():
    Promise<CurrentUser | null> {

    const firebaseUser =
      await this.waitForFirebaseUser();

    if (!firebaseUser) {

      this.userSession.clearUser();

      return null;
    }

    try {

      return await this.loadCurrentUser(
        firebaseUser,
      );

    } catch {

      await this.clearAuthentication();

      return null;
    }
  }


  private async loadCurrentUser(
    firebaseUser: User,
  ): Promise<CurrentUser> {

    const userData =
      await this.findUserProfile(
        firebaseUser.uid,
      );


    if (userData.active !== true) {

      throw new Error(
        'USER_INACTIVE',
      );
    }


    if (
      !this.isFirestoreRole(
        userData.role,
      )
    ) {

      throw new Error(
        'USER_ROLE_INVALID',
      );
    }


    const roleId =
      userData.role;


    const permissions =
      await this.loadPermissions(
        roleId,
      );


    const currentUser: CurrentUser = {

      uid:
        firebaseUser.uid,

      name:
        userData.name ??
        firebaseUser.displayName ??
        '',

      email:
        userData.email ??
        firebaseUser.email ??
        '',

      role:
        ROLE_MAP[roleId],

      roleId,

      active:
        true,

      is_admin:
        userData.is_admin === true,

      permissions,
    };


    this.userSession.setUser(
      currentUser,
    );


    return currentUser;
  }


  private async findUserProfile(
    uid: string,
  ): Promise<FirestoreUser> {

    const usersRef =
      collection(
        this.firestore,
        'users',
      );


    const userQuery =
      query(
        usersRef,
        where(
          'uid',
          '==',
          uid,
        ),
        limit(2),
      );


    const snapshot =
      await getDocs(
        userQuery,
      );


    if (snapshot.empty) {

      throw new Error(
        'USER_PROFILE_NOT_FOUND',
      );
    }


    if (snapshot.size > 1) {

      throw new Error(
        'USER_PROFILE_AMBIGUOUS',
      );
    }


    return snapshot.docs[0]
      .data() as FirestoreUser;
  }


  private async loadPermissions(
    roleId: FirestoreRole,
  ): Promise<RolePermissions> {

    const roleRef =
      doc(
        this.firestore,
        'roles',
        roleId,
      );


    const roleSnapshot =
      await getDoc(
        roleRef,
      );


    if (!roleSnapshot.exists()) {

      throw new Error(
        'ROLE_NOT_FOUND',
      );
    }


    const roleData =
      roleSnapshot.data();


    return (
      roleData['permissions'] ??
      {}
    ) as RolePermissions;
  }


  private isFirestoreRole(
    role: unknown,
  ): role is FirestoreRole {

    return (
      role === 'direccion_general' ||
      role === 'financiera' ||
      role === 'inmobiliaria' ||
      role === 'asesores' ||
      role === 'marketing'
    );
  }


  private async clearAuthentication():
    Promise<void> {

    this.userSession.clearUser();


    if (this.auth.currentUser) {

      await signOut(
        this.auth,
      );
    }
  }


  private waitForFirebaseUser():
    Promise<User | null> {

    return new Promise(
      (resolve) => {

        const unsubscribe =
          onAuthStateChanged(
            this.auth,
            (user) => {

              unsubscribe();

              resolve(user);
            },
          );
      },
    );
  }
}