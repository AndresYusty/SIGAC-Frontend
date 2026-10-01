import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, SessionState, UsuarioDto } from './models';

const STORAGE_KEY = 'sigac.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionSig = signal<SessionState | null>(this.restore());

  readonly session = this.sessionSig.asReadonly();
  readonly user = computed(() => this.sessionSig()?.usuario ?? null);
  readonly loggedIn = computed(() => !!this.sessionSig()?.token);

  token(): string | null {
    return this.sessionSig()?.token ?? null;
  }

  has(...roles: string[]): boolean {
    const mine = this.user()?.roles ?? [];
    return roles.some((r) => mine.includes(r));
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.persist(res)));
  }

  forgot(email: string) {
    return this.http.post<{ mensaje: string }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  reset(token: string, nuevaClave: string) {
    return this.http.post<{ mensaje: string }>(`${environment.apiUrl}/auth/reset-password`, { token, nuevaClave });
  }

  me() {
    return this.http.get<UsuarioDto>(`${environment.apiUrl}/users/me`).pipe(
      tap((usuario) => {
        const current = this.sessionSig();
        if (current) {
          const next = { ...current, usuario };
          this.sessionSig.set(next);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      }),
    );
  }

  changePassword(claveActual: string, claveNueva: string) {
    return this.http.put<{ mensaje: string }>(`${environment.apiUrl}/users/me/password`, { claveActual, claveNueva });
  }

  logout(redirect = true): void {
    this.sessionSig.set(null);
    localStorage.removeItem(STORAGE_KEY);
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  private persist(res: LoginResponse): void {
    const state: SessionState = {
      token: res.token,
      tipo: res.tipo,
      expiraEn: res.expiraEn,
      usuario: res.usuario,
    };
    this.sessionSig.set(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private restore(): SessionState | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as SessionState;
      if (!parsed.token || new Date(parsed.expiraEn).getTime() <= Date.now()) {
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
