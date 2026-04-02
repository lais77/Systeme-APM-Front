import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API } from '../../../core/services/api-endpoints';

@Component({
  selector: 'app-departements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Départements</h1>
        <button class="btn-primary" (click)="ouvrirModal()">+ Nouveau</button>
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>Nom</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let dep of departements">
              <td>{{ dep.nom }}</td>
              <td>
                <button class="btn-icon" (click)="ouvrirModal(dep)">✏️</button>
                <button class="btn-icon" (click)="supprimer(dep.id)">🗑️</button>
              </td>
            </tr>
            <tr *ngIf="departements.length === 0">
              <td colspan="2" class="empty">Aucun département.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="modal-overlay" *ngIf="modalOuvert" (click)="fermerModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ modeEdition ? 'Modifier' : 'Nouveau' }} département</h2>
            <button (click)="fermerModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nom</label>
              <input type="text" [(ngModel)]="selectionne.nom" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="fermerModal()">Annuler</button>
            <button class="btn-primary" (click)="sauvegarder()">Sauvegarder</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../users/users.component.scss'
})
export class DepartementsComponent implements OnInit {
  departements: any[] = [];
  modalOuvert = false;
  modeEdition = false;
  selectionne: any = {};

  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.charger(); }
  charger(): void { this.http.get<any[]>(API.departements.getAll).subscribe(d => this.departements = d); }
  ouvrirModal(dep?: any): void { this.modeEdition = !!dep; this.selectionne = dep ? { ...dep } : {}; this.modalOuvert = true; }
  fermerModal(): void { this.modalOuvert = false; }
  sauvegarder(): void {
    const obs = this.modeEdition
      ? this.http.put(API.departements.update(this.selectionne.id), this.selectionne)
      : this.http.post(API.departements.create, this.selectionne);
    obs.subscribe(() => { this.charger(); this.fermerModal(); });
  }
  supprimer(id: number): void {
    if (confirm('Supprimer ?')) this.http.delete(API.departements.delete(id)).subscribe(() => this.charger());
  }
}