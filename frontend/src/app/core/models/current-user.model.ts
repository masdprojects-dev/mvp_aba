export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'ADVISOR'
  | 'MARKETING'
  | 'VIEWER';

export interface CurrentUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
}