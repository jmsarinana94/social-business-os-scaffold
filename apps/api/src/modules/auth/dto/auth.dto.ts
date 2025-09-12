// Minimal DTOs for e2e tests. No validation needed for now.
export class SignupDto {
  email!: string;
  password!: string;
  name?: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}