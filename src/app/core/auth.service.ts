import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthSession, LoginResponse, MessageResponse, RoleName, UserDto } from './models';

const STORAGE_KEY = 'sigac.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionSig = signal<AuthSession | null>(this.restore());

  readonly session = this.sessionSig.asReadonly();
  readonly user = computed(() => this.sessionSig()?.user ?? null);
  readonly loggedIn = computed(() => !!this.sessionSig()?.token);

  token(): string | null {
    return this.sessionSig()?.token ?? null;
  }

  has(...roles: RoleName[]): boolean {
    const mine = this.user()?.roles ?? [];
    return roles.some((r) => mine.includes(r));
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.persist(res)));
  }

  forgotPassword(email: string) {
    return this.http.post<MessageResponse>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<MessageResponse>(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  me() {
    return this.http.get<UserDto>(`${environment.apiUrl}/users/me`).pipe(
      tap((user) => {
        const current = this.sessionSig();
        if (current) {
          this.persist({ ...current, user });
        }
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<MessageResponse>(`${environment.apiUrl}/users/me/password`, { currentPassword, newPassword });
  }

  logout(redirect = true): void {
    this.sessionSig.set(null);
    localStorage.removeItem(STORAGE_KEY);
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  private persist(session: AuthSession): void {
    this.sessionSig.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private restore(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed.token || !parsed.user || new Date(parsed.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
