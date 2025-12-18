import { Role } from "./rbac";

export const RBAC_RULES: Record<string, Role[]> = {
  // Profile
  "/api/profile": [Role.CUSTOMER, Role.ADMIN],
  "/api/profile/addresses": [Role.CUSTOMER, Role.ADMIN],

  // Pets
  "/api/pets": [Role.CUSTOMER],

  // Reception
  "/api/reception": [Role.RECEPTIONIST, Role.ADMIN],

  // Doctor
  "/api/doctor": [Role.DOCTOR],

  // Admin
  "/api/admin": [Role.ADMIN],
};
