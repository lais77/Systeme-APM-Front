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

  private readonly fallbackDepartments = [
    { id: 1, nom: "Service Système d'Information", utilisateurs: 2, plansActifs: 0, createdAt: '01/01/2026' },
    { id: 2, nom: 'DQSSE', utilisateurs: 1, plansActifs: 0, createdAt: '01/01/2026' },
    { id: 3, nom: 'Production', utilisateurs: 1, plansActifs: 1, createdAt: '01/01/2026' }
  ];

  get filteredDepartements() {
    const source = this.departmentRows;
    if (!this.searchTerm) return source;
    return source.filter(d =>
      d.nom?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get totalDepartements(): number {
    return this.departmentRows.length;
  }

  get totalUsersDepartements(): number {
    return this.departmentRows.reduce((total, dep) => total + (dep.utilisateurs || 0), 0);
  }

  get totalPlansDepartements(): number {
    return this.departements.reduce((total, dep) => total + this.getPlansByDepartment(dep.id).length, 0);
  }

  get totalActionsDepartements(): number {
    return this.departements.reduce((total, dep) => total + this.getTotalActionsForDepartment(dep.id), 0);
  }

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.http.get<any[]>(API.departements.getAll)
      .subscribe({
      next: (d) => {
        this.departements = d || [];
        this.chargerPlans();
      },
      error: () => {
        this.departements = [];
      }
    });
  }

  chargerPlans(): void {
    this.http.get<any[]>(API.plans.getAll).subscribe({
      next: (plans) => this.plans = plans || [],
      error: () => this.plans = []
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

  get departmentRows() {
    if (!this.departements.length) return this.fallbackDepartments;
    return this.departements.map((dep: any) => ({
      id: dep.id,
      nom: dep.nom,
      utilisateurs: dep.utilisateurs ?? dep.usersCount ?? 1,
      plansActifs: this.getPlansByDepartment(dep.id).length,
      createdAt: this.formatDate(dep.dateCreation ?? dep.createdAt ?? '2026-01-01')
    }));
  }

  private formatDate(value: string | Date): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '01/01/2026';
    return date.toLocaleDateString('fr-FR');
  }
}
