import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/models';
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  user: User | null;
  menuOuvert = false;

  constructor(private authService: AuthService, private router: Router) {
    this.user = this.authService.getCurrentUser();
  }

  isAdmin(): boolean { return this.user?.role === 'ADMIN'; }
  isManager(): boolean { return this.user?.role === 'MANAGER'; }
  isResponsable(): boolean { return this.user?.role === 'RESPONSABLE'; }

  logout(): void { this.authService.logout(); }

  getRoleBadge(): string {
    const labels: any = {
      ADMIN: 'Administrateur',
      MANAGER: 'Manager',
      RESPONSABLE: 'Responsable',
      AUDITEUR: 'Auditeur'
    };
    return labels[this.user?.role || ''] || '';
  }
}