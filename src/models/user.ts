export class User {
  email: string;
  username: string;
  timeRegistered: number;

  constructor(
    email: string,
    username: string,
    timeRegistered: number
  ) {
    this.email = email;
    this.username = username;
    this.timeRegistered = timeRegistered;
  }

  getEmail(): string {
    return this.email;
  }

  getUsername(): string {
    return this.username;
  }

  getTimeRegistered(): number {
    return this.timeRegistered;
  }
}