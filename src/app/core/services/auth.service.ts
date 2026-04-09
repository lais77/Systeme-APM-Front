import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse, User } from '../models/models';
import { API } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('user');
    if (stored) this.currentUserSubject.next(JSON.parse(stored));
  }

  login(credentials: AuthRequest): Observable<any> {
    return this.http.post<any>(API.auth.login, credentials).pipe(
      tap({
        next: (res) => {
        if (res && res.token && res.user) {
          const user: User = {
            id: res.user.id,
            fullName: res.user.fullName,
            email: res.user.email,
            role: res.user.role,
            isActive: true
          };
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      }})
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    return this.getCurrentUser()?.role === role;
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(API.auth.forgotPassword, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(API.auth.resetPassword, { token, password });
  }
}