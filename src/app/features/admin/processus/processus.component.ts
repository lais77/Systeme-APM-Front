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
  plans: any[] = [];
  searchTerm = '';
  showFormModal = false;
  showConfirmModal = false;
  isEditMode = false;
  selectedItem: any = null;
  formData: any = {};
  expandedProcessIds = new Set<number>();

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
      .subscribe(p => {
        this.processus = p;
        this.chargerPlans();
      });
  }

  chargerPlans(): void {
    this.http.get<any[]>(API.plans.getAll).subscribe({
      next: (plans) => this.plans = plans
    });
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

  togglePlans(processId: number): void {
    if (this.expandedProcessIds.has(processId)) {
      this.expandedProcessIds.delete(processId);
    } else {
      this.expandedProcessIds.add(processId);
    }
  }

  isExpanded(processId: number): boolean {
    return this.expandedProcessIds.has(processId);
  }

  getPlansByProcess(processId: number): any[] {
    return this.plans.filter(p => p.processId === processId);
  }

  getTotalActionsForProcess(processId: number): number {
    return this.getPlansByProcess(processId).reduce((sum, p) => sum + (p.totalActions ?? p.actions?.length ?? 0), 0);
  }
}