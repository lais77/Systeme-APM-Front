import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  motDePasse = '';
  erreur = '';
  chargement = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.email || !this.motDePasse) {
      this.erreur = 'Veuillez remplir tous les champs.';
      return;
    }
    this.chargement = true;
    this.erreur = '';

    this.authService.login({ email: this.email, password: this.motDePasse }).subscribe({
      next: () => {
        this.chargement = false;
        const user = this.authService.getCurrentUser();
        const role = user?.role;
        if (role === 'ADMIN') this.router.navigate(['/admin/users']);
        else if (role === 'MANAGER') this.router.navigate(['/mes-plans']);
        else if (role === 'RESPONSABLE') this.router.navigate(['/mes-actions']);
        else if (role === 'AUDITEUR') this.router.navigate(['/dashboard']);
        else this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.chargement = false;
        this.erreur = 'Email ou mot de passe incorrect.';
      }
    });
  }
}