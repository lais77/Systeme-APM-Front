import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { API } from '../../../core/services/api-endpoints';

@Component({
  selector: 'app-departements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './departements.component.html',
  styleUrl: './departements.component.scss'
})
export class DepartementsComponent implements OnInit {
  departements: any[] = [];
  plans: any[] = [];
  searchTerm = '';
  showFormModal = false;
  showConfirmModal = false;
  isEditMode = false;
  selectedItem: any = null;
  formData: any = {};
  expandedDepartmentIds = new Set<number>();

  get filteredDepartements() {
    if (!this.searchTerm) return this.departements;
    return this.departements.filter(d =>
      d.nom?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.http.get<any[]>(API.departements.getAll)
      .subscribe(d => {
        this.departements = d;
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
    if (!this.formData.nom || !String(this.formData.nom).trim()) {
      alert('Veuillez renseigner le nom du departement.');
      return;
    }

    const obs = this.isEditMode
      ? this.http.put(API.departements.update(this.formData.id), this.formData)
      : this.http.post(API.departements.create, this.formData);
    obs.subscribe({
      next: () => { this.charger(); this.closeFormModal(); },
      error: () => alert('Creation/modification impossible. Verifiez les champs.')
    });
  }

  deleteDepartement(): void {
    this.http.delete(API.departements.delete(this.selectedItem.id))
      .subscribe(() => { this.charger(); this.closeConfirmModal(); });
  }

  togglePlans(departmentId: number): void {
    if (this.expandedDepartmentIds.has(departmentId)) {
      this.expandedDepartmentIds.delete(departmentId);
    } else {
      this.expandedDepartmentIds.add(departmentId);
    }
  }

  isExpanded(departmentId: number): boolean {
    return this.expandedDepartmentIds.has(departmentId);
  }

  getPlansByDepartment(departmentId: number): any[] {
    return this.plans.filter(p => p.departmentId === departmentId);
  }

  getTotalActionsForDepartment(departmentId: number): number {
    return this.getPlansByDepartment(departmentId).reduce((sum, p) => sum + (p.totalActions ?? p.actions?.length ?? 0), 0);
  }

  getDepartmentSummaryLabel(departmentId: number): string {
    const totalPlans = this.getPlansByDepartment(departmentId).length;
    const totalActions = this.getTotalActionsForDepartment(departmentId);
    return `${totalPlans} plan(s) / ${totalActions} action(s)`;
  }

  openDepartmentPlans(departmentId: number): void {
    const plans = this.getPlansByDepartment(departmentId);
    if (plans.length === 1) {
      this.router.navigate(['/plans', plans[0].id]);
      return;
    }

    this.router.navigate(['/plans-usine']);
  }
}