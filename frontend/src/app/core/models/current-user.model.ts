export type UserRole =
  | 'ADMIN'
  | 'FINANCE'
  | 'MANAGER'
  | 'ADVISOR'
  | 'MARKETING';

export type FirestoreRole =
  | 'direccion_general'
  | 'financiera'
  | 'inmobiliaria'
  | 'asesores'
  | 'marketing';

export interface RolePermissions {
  [permission: string]: boolean;
}

export interface CurrentUser {
  uid: string;
  name: string;
  email: string;

  role: UserRole;
  roleId: FirestoreRole;

  active: boolean;
  is_admin: boolean;

  permissions: RolePermissions;
}