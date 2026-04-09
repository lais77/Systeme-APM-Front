import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API } from '../../../core/services/api-endpoints';

@Component({
  selector: 'app-processus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './processus.component.html',
  styleUrl: './processus.component.scss'
})
export class ProcessusComponent implements OnInit {
  processus: any[] = [];
  searchTerm = '';
  showFormModal = false;
  showConfirmModal = false;
  isEditMode = false;
  selectedItem: any = null;
  formData: any = {};

  get filteredProcessus() {
    if (!this.searchTerm) return this.processus;
    return this.processus.filter(p =>
      p.nom?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.http.get<any[]>(API.processus.getAll)
      .subscribe(p => this.processus = p);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.formData = {};
    this.showFormModal = true;
  }

  openEditModal(p: any): void {
    this.isEditMode = true;
    this.formData = { ...p };
    this.showFormModal = true;
  }

  openConfirmModal(p: any): void {
    this.selectedItem = p;
    this.showConfirmModal = true;
  }

  closeFormModal(): void { this.showFormModal = false; }
  closeConfirmModal(): void { this.showConfirmModal = false; }

  saveProcessus(): void {
    const obs = this.isEditMode
      ? this.http.put(API.processus.update(this.formData.id), this.formData)
      : this.http.post(API.processus.create, this.formData);
    obs.subscribe(() => { this.charger(); this.closeFormModal(); });
  }

  deleteProcessus(): void {
    this.http.delete(API.processus.delete(this.selectedItem.id))
      .subscribe(() => { this.charger(); this.closeConfirmModal(); });
  }
}