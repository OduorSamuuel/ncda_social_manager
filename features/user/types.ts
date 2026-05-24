export type UserRole = "admin" | "user";

export interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  email?: string;
  [key: string]: unknown;
}
export interface User {
  id: string;
  email?: string;

}
export type Role = "admin" | "user";