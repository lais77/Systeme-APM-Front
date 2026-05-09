import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
  process: string;
  pilot: string;
  type: string;
  progress: number;
  createdAt: string;
  dueDate: string;
  totalActions: number;
  status: string;
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
  viewMode: 'cards' | 'list' = 'list';
  modalOuvert = false;
  nouveauPlan: any = {};
  departements: any[] = [];
  processus: any[] = [];
  utilisateurs: any[] = [];
  piloteNom = '';

  // Propriétés pour éviter les boucles de change detection
  displayPlansList: PlanCardView[] = [];

  private readonly fallbackPlans: PlanCardView[] = [
    {
      priority: 'Low',
      title: 'testtest',
      department: 'Production',
      process: 'Informatique',
      pilot: 'Admin APM',
      type: 'Mono',
      progress: 0,
      createdAt: '08/05/2026',
      dueDate: '30/04/2026',
      totalActions: 0,
      status: 'InProgress'
    }
  ];

  filtreProcessus: string | null = null;

  constructor(
    private plansService: PlansService, 
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.filtreProcessus = params['process'] || null;
      this.chargerPlans();
    });
    this.chargerDepartements();
    this.chargerProcessus();
    this.chargerPiloteConnecte();
    this.chargerUtilisateurs();
  }

  chargerPlans(): void {
    this.plansService.getMesPlans().subscribe({
      next: (data) => { 
        this.plans = data || []; 
        this.updateDerivedStats();
        this.chargement = false; 
      },
      error: () => { 
        this.updateDerivedStats();
        this.chargement = false; 
      }
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
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    this.nouveauPlan = {
      priority: 'Medium',
      type: 'Mono',
      departmentId: null,
      processId: null,
      pilotId: currentUser.id || null,
      visibility: 'Publique',
      createdAtDisplay: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      coPilotIds: []
    };
    this.modalOuvert = true;
  }

  onDepartementChange(value: string): void {
    const id = Number(value);
    this.nouveauPlan.departmentId = Number.isFinite(id) ? id : null;
    // Compatibilité backend : si le processus n'est plus géré à part, on utilise l'ID du département
    this.nouveauPlan.processId = this.nouveauPlan.departmentId;
  }

  onProcessusChange(value: string): void {
    const id = Number(value);
    this.nouveauPlan.processId = Number.isFinite(id) ? id : null;
  }

  onTypeChange(type: string): void {
    if (type === 'Mono') {
      this.nouveauPlan.coPilotIds = [];
    }
  }

  togglePilote(userId: number): void {
    if (!this.nouveauPlan.coPilotIds) this.nouveauPlan.coPilotIds = [];
    const index = this.nouveauPlan.coPilotIds.indexOf(userId);
    if (index > -1) {
      this.nouveauPlan.coPilotIds.splice(index, 1);
    } else {
      this.nouveauPlan.coPilotIds.push(userId);
    }
  }

  isPiloteSelected(userId: number): boolean {
    return this.nouveauPlan.coPilotIds?.includes(userId) || false;
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

    // Validation du pilote
    if (!this.nouveauPlan.pilotId && (this.nouveauPlan.type === 'Mono' || !this.nouveauPlan.coPilotIds?.length)) {
      alert('Veuillez selectionner au moins un responsable (pilote).');
      return;
    }

    // Le processId est maintenant automatiquement lié au département
    if (!this.nouveauPlan.processId) {
      this.nouveauPlan.processId = this.nouveauPlan.departmentId;
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
    this.plansService.cloturerPlan(id).subscribe({
      next: () => this.chargerPlans()
    });
  }

  private chargerProcessus(): void {
    this.http.get<any[]>(API.processus.getAll).subscribe({
      next: (data) => { this.processus = data || []; },
      error: () => { this.processus = []; }
    });
  }

  private chargerUtilisateurs(): void {
    this.http.get<any[]>(API.utilisateurs.getAll).subscribe({
      next: (data) => { this.utilisateurs = data || []; },
      error: () => { this.utilisateurs = []; }
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

  private updateDerivedStats(): void {
    if (!this.plans.length) {
      this.displayPlansList = this.fallbackPlans;
    } else {
      let filteredPlans = this.plans;
      if (this.filtreProcessus) {
        filteredPlans = this.plans.filter(p => p.processName === this.filtreProcessus);
      }

      if (filteredPlans.length === 0) {
        this.displayPlansList = [];
      } else {
        this.displayPlansList = filteredPlans.map(plan => ({
          id: plan.id,
          priority: plan.priority || 'Low',
          title: plan.title,
          department: plan.departmentName || plan.processName || 'Sans département',
          process: plan.processName || 'Sans processus',
          pilot: plan.pilotName || this.piloteNom || 'Pilote',
          type: plan.type || 'Mono',
          progress: plan.progressPercentage || 0,
          createdAt: this.formatDate(plan.createdAt),
          dueDate: this.formatDate(plan.dueDate),
          totalActions: plan.totalActions ?? plan.actions?.length ?? 0,
          status: plan.status || 'InProgress'
        }));
      }
    }
  }

  get displayPlans(): PlanCardView[] {
    return this.displayPlansList;
  }

  private formatDate(value: Date | string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR');
  }
}
