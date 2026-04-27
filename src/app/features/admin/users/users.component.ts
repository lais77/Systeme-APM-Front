import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API } from '../../../core/services/api-endpoints';

// ─────────────────────────────────────────────────────────────
// Adaptez cet import selon votre structure réelle :
// import { UserService } from '../../../core/services/user.service';
// ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {

  // ── Données ───────────────────────────────────────────────
  users: any[] = [];
  departements: any[] = [];

  // ── Filtres ───────────────────────────────────────────────
  searchTerm: string = '';
  filterRole: string = '';
  filterStatut: string = '';

  // ── État modals ───────────────────────────────────────────
  showFormModal: boolean = false;
  showConfirmModal: boolean = false;
  isEditMode: boolean = false;
  selectedUser: any = null;

  // ── Données formulaire ────────────────────────────────────
  formData: any = {
    prenom: '',
    nom: '',
    email: '',
    password: '',
    role: '',
    departementId: null
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadDepartements();
  }

  // ── Chargement HTTP ───────────────────────────────────────
  loadUsers(): void {
    this.http.get<any[]>(API.users.getAll).subscribe({
      next: (data) => {
        this.users = (data || []).map((u: any) => {
          const fullName = (u.fullName || '').trim();
          const parts = fullName.split(' ').filter((p: string) => p.length > 0);
          const prenom = parts.length > 0 ? parts[0] : '';
          const nom = parts.length > 1 ? parts.slice(1).join(' ') : '';

          return {
            ...u,
            prenom,
            nom,
            actif: u.isActive ?? u.actif ?? false,
            departementId: u.departmentId ?? u.departementId ?? null
          };
        });
      },
      error: (err) => { console.error('Erreur chargement utilisateurs', err); }
    });
  }

  loadDepartements(): void {
    this.http.get<any[]>(API.departements.getAll).subscribe({
      next: (data) => { this.departements = data; },
      error: (err) => { console.error('Erreur chargement départements', err); }
    });
  }

  // ── Getter tableau filtré ─────────────────────────────────
  get filteredUsers(): any[] {
    return this.users.filter(u => {
      const fullName = ((u.prenom || '') + ' ' + (u.nom || '')).toLowerCase();
      const matchSearch = !this.searchTerm ||
        fullName.includes(this.searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchRole    = !this.filterRole   || u.role === this.filterRole;
      const matchStatut  = !this.filterStatut || String(u.actif) === this.filterStatut;
      return matchSearch && matchRole && matchStatut;
    });
  }

  // ── Modal Créer ───────────────────────────────────────────
  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedUser = null;
    this.formData = {
      prenom: '', nom: '', email: '',
      password: '', role: '', departementId: null
    };
    this.showFormModal = true;
  }

  // ── Modal Modifier ────────────────────────────────────────
  openEditModal(user: any): void {
    this.isEditMode = true;
    this.selectedUser = user;
    this.formData = {
      prenom:        user.prenom       || '',
      nom:           user.nom          || '',
      email:         user.email        || '',
      password:      '',
      role:          user.role         || '',
      departementId: user.departementId ?? user.departement?.id ?? null
    };
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
  }

  // ── Sauvegarde (créer ou modifier) ────────────────────────
  saveUser(): void {
    const fullName = `${this.formData.prenom || ''} ${this.formData.nom || ''}`.trim();
    if (!fullName || !this.formData.email || !this.formData.role) {
      alert('Veuillez renseigner nom, email et role.');
      return;
    }

    const payload: any = {
      fullName,
      email: this.formData.email,
      role: this.formData.role,
      departmentId: this.formData.departementId ? Number(this.formData.departementId) : null
    };

    if (this.isEditMode && this.selectedUser) {
      payload.isActive = this.selectedUser.actif ?? true;
      this.http.put(API.users.update(this.selectedUser.id), payload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeFormModal();
        },
        error: (err) => {
          console.error('Erreur modification', err);
          alert('Creation/modification impossible. Verifiez les champs.');
        }
      });
    } else {
      if (!this.formData.password) {
        payload.password = 'Apm@2025';
      } else {
        payload.password = this.formData.password;
      }

      this.http.post(API.users.create, payload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeFormModal();
        },
        error: (err) => {
          console.error('Erreur création', err);
          alert('Creation/modification impossible. Verifiez les champs.');
        }
      });
    }
  }

  // ── Modal Confirmation désactivation ─────────────────────
  openConfirmModal(user: any): void {
    this.selectedUser = user;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.selectedUser = null;
  }

  // ── Désactiver l'utilisateur ──────────────────────────────
  disableUser(): void {
    if (!this.selectedUser) return;
    // Adaptez l'URL selon votre API :
    this.http.patch(API.users.deactivate(this.selectedUser.id), {}).subscribe({
      next: () => {
        this.loadUsers();
        this.closeConfirmModal();
      },
      error: (err) => { console.error('Erreur désactivation', err); }
    });
  }

  // ── Réactiver l'utilisateur ───────────────────────────────
  enableUser(user: any): void {
    if (!user?.id) return;
    this.http.put(API.users.activer(user.id), {}).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => { console.error('Erreur réactivation', err); }
    });
  }
}
