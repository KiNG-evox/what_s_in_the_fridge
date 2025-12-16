export interface User {
  _id: string;
  name: string;
  lastname: string;
  pseudo: string;
  email: string;
  role: 'admin' | 'user';
  profilePicture?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  data: User;
}