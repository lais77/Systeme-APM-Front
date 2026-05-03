import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="login-container">
  <!-- Left Side: Industrial Visual -->
  <div class="visual-side">
    <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop" 
         alt="Industrial Electronics Manufacturing">
    <div class="overlay"></div>
    <div class="content">
      <h1>Excellence en Électronique Industrielle</h1>
      <p>Solutions de pointe pour la gestion de la production et le suivi qualité au cœur de l'industrie 4.0.</p>
      <div class="stats">
        <div class="stat-item">
          <div class="label">ISO 9001</div>
          <div class="desc">Certifié Qualité</div>
        </div>
        <div class="stat-item">
          <div class="label">100%</div>
          <div class="desc">Traçabilité</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Right Side: Form -->
  <div class="form-side">
    <div class="form-wrapper">
      <div class="brand-header">
        <h2>TIS Circuits</h2>
        <div class="subtitle-wrapper">
          <div class="line"></div>
          <span>Réinitialisation du mot de passe</span>
        </div>
      </div>

      <form (ngSubmit)="onSubmit()">
        <p class="instruction-text">Entrez votre email pour recevoir un lien de réinitialisation.</p>

        <div class="input-group">
          <label for="email">Email</label>
          <div class="input-wrapper">
            <span class="icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </span>
            <input type="email" id="email" name="email" [(ngModel)]="email" placeholder="nom@tis-circuits.com" required autocomplete="email">
          </div>
        </div>

        <div class="succes" *ngIf="succes">Email envoyé ! Vérifiez votre boîte mail.</div>
        <div class="erreur" *ngIf="erreur">{{ erreur }}</div>

        <button type="submit" class="btn-submit" [disabled]="chargement">
          {{ chargement ? 'Envoi...' : 'Envoyer le lien' }}
          <svg *ngIf="!chargement" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>

        <div class="form-actions" style="justify-content: center; margin-top: 1.5rem;">
          <a routerLink="/auth/login" class="forgot-password">Retour à la connexion</a>
        </div>
      </form>

      <div class="footer">
        <p class="disclaimer">Accès restreint au personnel autorisé.</p>
        <div class="footer-links">
          <a href="#">Support Technique</a>
          <a href="#">Mentions Légales</a>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styleUrls: ['../login/login.component.scss'],
  styles: [`
    .instruction-text {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    .succes {
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      color: #059669;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .erreur {
      background: #fff0f0;
      border: 1px solid #fca5a5;
      color: #c00010;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  succes = false;
  erreur = '';
  chargement = false;

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.email) { this.erreur = 'Veuillez entrer votre email.'; return; }
    this.chargement = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: () => { this.succes = true; this.erreur = ''; this.chargement = false; },
      error: () => { this.erreur = "Erreur lors de l'envoi."; this.succes = false; this.chargement = false; }
    });
  }
}