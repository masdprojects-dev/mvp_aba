import { FirestoreRole } from './current-user.model';

export interface AdminUser {
  documentId: string;

  uid: string;
  name: string;
  email: string;

  role: FirestoreRole;

  active: boolean;
  is_admin: boolean;

  telefono?: string | number;
  usuario?: string;
}
