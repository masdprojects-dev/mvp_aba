export type UserRole =
  | 'ADMIN'
  | 'FINANCE'
  | 'MANAGER'
  | 'ADVISOR'
  | 'MARKETING';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;

  role: UserRole;
  active: boolean;
}