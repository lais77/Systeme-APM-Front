import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container">
      <div class="card">
        <h2>Nouveau mot de passe</h2>
        <p>Choisissez un nouveau mot de passe pour votre compte.</p>

        <div class="form-group">
          <label>Nouveau mot de passe</label>
          <input type="password" [(ngModel)]="motDePasse" placeholder="••••••••" />
        </div>

        <div class="form-group">
          <label>Confirmer le mot de passe</label>
          <input type="password" [(ngModel)]="confirmation" placeholder="••••••••" />
        </div>

        <div class="succes" *ngIf="succes">
          Mot de passe modifié ! <a routerLink="/auth/login">Se connecter</a>
        </div>
        <div class="erreur" *ngIf="erreur">{{ erreur }}</div>

        <button (click)="onSubmit()" [disabled]="chargement">
          {{ chargement ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
    .card { background: white; border-radius: 12px; padding: 2.5rem; width: 100%; max-width: 400px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    h2 { margin-bottom: 0.5rem; }
    p { color: #888; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; }
    input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
    button { width: 100%; padding: 0.875rem; background: #1a73e8; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; margin-top: 0.5rem; }
    button:disabled { background: #9dc3f7; }
    .succes { background: #e8f5e9; color: #2e7d32; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    .erreur { background: #fdecea; color: #c62828; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    a { color: #1a73e8; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  motDePasse = '';
  confirmation = '';
  token = '';
  succes = false;
  erreur = '';
  chargement = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
  }

  onSubmit(): void {
    if (!this.motDePasse || !this.confirmation) {
      this.erreur = 'Veuillez remplir tous les champs.';
      return;
    }
    if (this.motDePasse !== this.confirmation) {
      this.erreur = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.chargement = true;
    this.authService.resetPassword(this.token, this.motDePasse).subscribe({
      next: () => { this.succes = true; this.chargement = false; },
      error: () => { this.erreur = 'Lien invalide ou expiré.'; this.chargement = false; }
    });
  }
}