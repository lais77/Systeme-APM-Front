import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API } from '../../../core/services/api-endpoints';

@Component({
  selector: 'app-departements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './departements.component.html',
  styleUrl: './departements.component.scss'
})
export class DepartementsComponent implements OnInit {
  departements: any[] = [];
  searchTerm = '';
  showFormModal = false;
  showConfirmModal = false;
  isEditMode = false;
  selectedItem: any = null;
  formData: any = {};

  get filteredDepartements() {
    if (!this.searchTerm) return this.departements;
    return this.departements.filter(d =>
      d.nom?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.http.get<any[]>(API.departements.getAll)
      .subscribe(d => this.departements = d);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.formData = {};
    this.showFormModal = true;
  }

  openEditModal(dep: any): void {
    this.isEditMode = true;
    this.formData = { ...dep };
    this.showFormModal = true;
  }

  openConfirmModal(dep: any): void {
    this.selectedItem = dep;
    this.showConfirmModal = true;
  }

  closeFormModal(): void { this.showFormModal = false; }
  closeConfirmModal(): void { this.showConfirmModal = false; }

  saveDepartement(): void {
    const obs = this.isEditMode
      ? this.http.put(API.departements.update(this.formData.id), this.formData)
      : this.http.post(API.departements.create, this.formData);
    obs.subscribe(() => { this.charger(); this.closeFormModal(); });
  }

  deleteDepartement(): void {
    this.http.delete(API.departements.delete(this.selectedItem.id))
      .subscribe(() => { this.charger(); this.closeConfirmModal(); });
  }
}