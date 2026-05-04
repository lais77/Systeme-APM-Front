import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PlansService } from '../../../core/services/plans.service';
import { Plan } from '../../../core/models/models';
import { API } from '../../../core/services/api-endpoints';

interface PlanCardView {
  id?: number;
  priority: string;
  title: string;
  department: string;
  type: string;
  progress: number;
  dueDate: string;
}

@Component({
  selector: 'app-mes-plans',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mes-plans.component.html',
  styleUrl: './mes-plans.component.scss'
})
export class MesPlansComponent implements OnInit {
  plans: Plan[] = [];
  chargement = true;
  viewMode: 'cards' | 'list' = 'cards';
  modalOuvert = false;
  nouveauPlan: any = {};
  departements: any[] = [];
  processus: any[] = [];
  piloteNom = '';

  private readonly fallbackPlans: PlanCardView[] = [
    {
      priority: 'Low',
      title: 'testtest',
      department: 'Production',
      type: 'Mono',
      progress: 0,
      dueDate: '30/04/2026'
    }
  ];

  constructor(private plansService: PlansService, private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerPlans();
    this.chargerDepartements();
    this.chargerProcessus();
    this.chargerPiloteConnecte();
  }

  chargerPlans(): void {
    this.plansService.getMesPlans().subscribe({
      next: (data) => { this.plans = data || []; this.chargement = false; },
      error: () => { this.chargement = false; }
    });
  }

  setView(mode: 'cards' | 'list'): void {
    this.viewMode = mode;
  }

  chargerDepartements(): void {
    this.http.get<any[]>(API.departements.getAll).subscribe({
      next: (data) => { this.departements = data; },
      error: () => {
        // Fallback: si l'utilisateur n'a pas acces aux departements,
        // on utilise la liste des processus comme source de selection.
        this.http.get<any[]>(API.processus.getAll).subscribe({
          next: (processes) => {
            this.departements = (processes || []).map((p: any) => ({
              id: p.id,
              nom: p.nom
            }));
          }
        });
      }
    });
  }

  ouvrirModal(): void {
    this.nouveauPlan = {
      priority: 'Medium',
      type: 'Mono',
      departmentId: null,
      processId: null,
      visibility: 'Publique',
      createdAtDisplay: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0]
    };
    this.modalOuvert = true;
  }

  onDepartementChange(value: string): void {
    const id = Number(value);
    this.nouveauPlan.departmentId = Number.isFinite(id) ? id : null;
    if (!this.nouveauPlan.processId) {
      // Compatibilite backend: processId est requis.
      this.nouveauPlan.processId = this.nouveauPlan.departmentId;
    }
  }

  onProcessusChange(value: string): void {
    const id = Number(value);
    this.nouveauPlan.processId = Number.isFinite(id) ? id : null;
  }

  fermerModal(): void { this.modalOuvert = false; }

  creerPlan(): void {
    if (!this.nouveauPlan.title || !String(this.nouveauPlan.title).trim()) {
      alert('Veuillez renseigner le titre du plan.');
      return;
    }

    if (!this.nouveauPlan.departmentId) {
      alert('Veuillez selectionner un departement.');
      return;
    }

    this.plansService.creerPlan(this.nouveauPlan).subscribe({
      next: () => { this.chargerPlans(); this.fermerModal(); },
      error: (err) => {
        console.error(err);
        alert('Creation du plan impossible. Verifiez les champs.');
      }
    });
  }

  getPrioriteClass(priority: string): string {
    const classes: any = {
      Critical: 'badge-critique',
      High: 'badge-haute',
      Medium: 'badge-moyenne',
      Low: 'badge-basse'
    };
    return classes[priority] || '';
  }

  getPlanStatutLabel(status: string): string {
    return status === 'Closed' ? 'Clôturé' : 'En cours';
  }

  cloturerPlan(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Clôturer ce plan ?')) {
      this.plansService.cloturerPlan(id).subscribe({
        next: () => this.chargerPlans()
      });
    }
  }

  private chargerProcessus(): void {
    this.http.get<any[]>(API.processus.getAll).subscribe({
      next: (data) => { this.processus = data || []; },
      error: () => { this.processus = []; }
    });
  }

  private chargerPiloteConnecte(): void {
    const raw = localStorage.getItem('user');
    if (!raw) {
      this.piloteNom = '';
      return;
    }

    try {
      const user = JSON.parse(raw);
      this.piloteNom = user?.fullName || '';
    } catch {
      this.piloteNom = '';
    }
  }

  get displayPlans(): PlanCardView[] {
    if (!this.plans.length) return this.fallbackPlans;
    return this.plans.map(plan => ({
      id: plan.id,
      priority: plan.priority || 'Low',
      title: plan.title,
      department: plan.departmentName || plan.processName || 'Sans département',
      type: plan.type || 'Mono',
      progress: plan.progressPercentage || 0,
      dueDate: this.formatDate(plan.dueDate)
    }));
  }

  private formatDate(value: Date | string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR');
  }
}
