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

  // Propriétés pour éviter les boucles de change detection
  displayDepartmentRows: any[] = [];
  displayFilteredDepartements: any[] = [];
  displayTotalDepartements = 0;
  displayTotalUsersDepartements = 0;
  displayTotalPlansDepartements = 0;
  displayTotalActionsDepartements = 0;

  private readonly fallbackDepartments = [
    { id: 1, nom: "Service Système d'Information", utilisateurs: 2, plansActifs: 0, createdAt: '01/01/2026' },
    { id: 2, nom: 'DQSSE', utilisateurs: 1, plansActifs: 0, createdAt: '01/01/2026' },
    { id: 3, nom: 'Production', utilisateurs: 1, plansActifs: 1, createdAt: '01/01/2026' }
  ];

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
        this.chargerPlans();
      }
    });
  }

  chargerPlans(): void {
    this.http.get<any[]>(API.plans.getAll).subscribe({
      next: (plans) => {
        this.plans = plans || [];
        this.updateDerivedStats();
      },
      error: () => {
        this.plans = [];
        this.updateDerivedStats();
      }
    });
  }

  private updateDerivedStats(): void {
    // 1. Department Rows
    if (!this.departements.length) {
      this.displayDepartmentRows = this.fallbackDepartments;
    } else {
      this.displayDepartmentRows = this.departements.map((dep: any) => ({
        id: dep.id,
        nom: dep.nom,
        utilisateurs: dep.utilisateurs ?? dep.usersCount ?? 1,
        plansActifs: this.getPlansByDepartment(dep.id).length,
        createdAt: this.formatDate(dep.dateCreation ?? dep.createdAt ?? '2026-01-01')
      }));
    }

    // 2. Filtered
    this.applyFilter();

    // 3. Totals
    this.displayTotalDepartements = this.displayDepartmentRows.length;
    this.displayTotalUsersDepartements = this.displayDepartmentRows.reduce((total, dep) => total + (dep.utilisateurs || 0), 0);
    this.displayTotalPlansDepartements = this.departements.reduce((total, dep) => total + this.getPlansByDepartment(dep.id).length, 0);
    this.displayTotalActionsDepartements = this.departements.reduce((total, dep) => total + this.getTotalActionsForDepartment(dep.id), 0);
  }

  applyFilter(): void {
    const source = this.displayDepartmentRows;
    if (!this.searchTerm) {
      this.displayFilteredDepartements = source;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.displayFilteredDepartements = source.filter(d =>
        d.nom?.toLowerCase().includes(term)
      );
    }
  }

  get filteredDepartements() { return this.displayFilteredDepartements; }
  get totalDepartements() { return this.displayTotalDepartements; }
  get totalUsersDepartements() { return this.displayTotalUsersDepartements; }
  get totalPlansDepartements() { return this.displayTotalPlansDepartements; }
  get totalActionsDepartements() { return this.displayTotalActionsDepartements; }

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
    return this.displayDepartmentRows;
  }

  private formatDate(value: string | Date): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '01/01/2026';
    return date.toLocaleDateString('fr-FR');
  }
}
