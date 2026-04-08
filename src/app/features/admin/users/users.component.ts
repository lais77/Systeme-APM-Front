import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { User } from '../../../core/models/models';
import { API } from '../../../core/services/api-endpoints';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  departements: any[] = [];
  chargement = true;
  modalOuvert = false;
  modalConfirmOuvert = false;
  userADesactiver: number | null = null;
  userSelectionne: Partial<User> = {};
  modeEdition = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void { 
    this.chargerUsers();
    this.http.get<any[]>(API.departements.getAll).subscribe({
      next: (data) => { this.departements = data; }
    });
  }

  chargerUsers(): void {
    this.http.get<User[]>(API.users.getAll).subscribe({
      next: (data) => { this.users = data; this.chargement = false; },
      error: () => { this.chargement = false; }
    });
  }

  ouvrirModal(user?: User): void {
    this.modeEdition = !!user;
    this.userSelectionne = user ? { ...user } : { role: 'RESPONSABLE', isActive: true };
    this.modalOuvert = true;
  }

  fermerModal(): void { this.modalOuvert = false; }

  sauvegarder(): void {
    if (this.modeEdition && this.userSelectionne.id) {
      this.http.put(API.users.update(this.userSelectionne.id), this.userSelectionne).subscribe({
        next: () => { this.chargerUsers(); this.fermerModal(); }
      });
    } else {
      this.http.post(API.users.create, this.userSelectionne).subscribe({
        next: () => { this.chargerUsers(); this.fermerModal(); }
      });
    }
  }

  desactiver(id: number): void {
    this.userADesactiver = id;
    this.modalConfirmOuvert = true;
  }

  confirmerDesactivation(): void {
    if (this.userADesactiver) {
      this.http.patch(API.users.deactivate(this.userADesactiver), {}).subscribe({
        next: () => { this.chargerUsers(); this.modalConfirmOuvert = false; }
      });
    }
  }

  activer(id: number): void {
    this.http.put(API.users.activer(id), {}).subscribe({
      next: () => this.chargerUsers()
    });
  }

  getRoleBadgeClass(role: string): string {
    const classes: any = {
      ADMIN: 'badge-admin',
      MANAGER: 'badge-manager',
      RESPONSABLE: 'badge-responsable',
      AUDITEUR: 'badge-auditeur'
    };
    return classes[role] || '';
  }
}