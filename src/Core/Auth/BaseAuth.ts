export class BaseAuth {
  isAuthenticated(): Boolean {
    return false;
  }

  authenticate(...parameters: any[]): any {}
}
