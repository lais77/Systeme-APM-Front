import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlansService } from '../../../core/services/plans.service';
import { Plan } from '../../../core/models/models';
import { HttpClient } from '@angular/common/http';
import { API } from '../../../core/services/api-endpoints';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActionsService } from '../../../core/services/actions.service';

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './plan-detail.component.html',
  styleUrl: './plan-detail.component.scss'
})
export class PlanDetailComponent implements OnInit {
  plan: Plan | null = null;
  chargement = true;
  suggestionsRaw = '';
  resumeRaw = '';
  suggestions = '';
  resume = '';
  chargementIA = false;
  modalValidationPlan = false;
  modalCloturePlan = false;
  modalNouvelleAction = false;
  nouvelleAction: any = {};
  responsables: any[] = [];
  actionSaving = false;

  // SVG circular progress properties
  circumference = 2 * Math.PI * 45; // radius = 45

  constructor(
    private plansService: PlansService,
    private actionsService: ActionsService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.plansService.getPlanById(id).subscribe({
      next: (data) => { this.plan = data; this.chargement = false; },
      error: () => { this.chargement = false; }
    });
    this.chargerResponsables();
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

  getDelaiCouleur(dateRealisation: string | Date | undefined): string {
    // Gérer le cas où la date est undefined
    if (!dateRealisation) {
      return ''; // Pas de couleur si pas de date
    }

    const maintenant = new Date();
    const echeance = new Date(dateRealisation);
    const joursRestants = Math.ceil((echeance.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));

    if (joursRestants < 0) return 'rouge';      // En retard
    if (joursRestants <= 3) return 'orange';    // Moins de 3 jours
    return 'vert';                              // Plus de 3 jours
  }

  getStatutActionClass(status: string): string {
    if (!status) return '';
    const s = status.toLowerCase();
    
    // Classes CSS unifiées
    if (s === 'created' || s === 'p') return 'badge-p';
    if (s === 'inprogress' || s === 'd') return 'badge-inprogress';
    if (s === 'underreview') return 'badge-underreview';
    if (s === 'validated') return 'badge-validated';
    if (s === 'closed' || s === 'c' || s === 'cloture' || s === 'clôturée') return 'badge-closed';
    if (s === 'rejected' || s === 'rejete') return 'badge-rejected';
    
    return 'badge-' + s;
  }

  getStatutActionLabel(status: string): string {
    if (!status) return '—';
    const s = status.toUpperCase();
    
    const labels: Record<string, string> = {
      'P': 'P - Planifiée',
      'CREATED': 'P - Planifiée',
      'ASSIGNED': 'P - Planifiée',
      'INPROGRESS': 'D - En réalisation',
      'D': 'D - Réalisée (À valider)',
      'UNDERREVIEW': 'D - En vérification',
      'VALIDATED': 'D - Validée',
      'REJECTED': 'À reprendre',
      'C': 'C - Clôturée',
      'CLOSED': 'C - Clôturée',
      'CLÔTURÉE': 'C - Clôturée'
    };
    
    return labels[s] || status;
  }

  planLectureSeule(): boolean {
    return this.plan?.status === 'Closed';
  }

  planEnCours(): boolean {
    return this.plan?.status === 'InProgress';
  }

  validerPlan(): void {
    if (!this.planEnCours() || !this.plan) return;
    this.modalValidationPlan = true;
  }

  confirmerValiderPlan(): void {
    if (!this.planEnCours() || !this.plan) return;

    this.plansService.validerPlan(this.plan.id).subscribe({
      next: () => {
        this.modalValidationPlan = false;
        this.rechargerPlan();
      }
    });
  }

  cloturerPlan(): void {
    if (!this.planEnCours() || !this.plan) return;
    this.modalCloturePlan = true;
  }

  confirmerCloturerPlan(): void {
    if (!this.planEnCours() || !this.plan) return;

    this.plansService.cloturerPlan(this.plan.id).subscribe({
      next: () => {
        this.modalCloturePlan = false;
        this.rechargerPlan();
      }
    });
  }

  ouvrirModalAction(): void {
    if (!this.plan || this.planLectureSeule()) return;
    this.nouvelleAction = {
      theme: '',
      anomalyDescription: '',
      actionDescription: '',
      type: 'Corrective',
      criticity: 'Medium',
      cause: '',
      responsibleId: '',
      deadline: new Date().toISOString().split('T')[0],
      commentaire: ''
    };
    this.modalNouvelleAction = true;
  }

  fermerModalAction(): void {
    this.modalNouvelleAction = false;
    this.actionSaving = false;
  }

  creerAction(): void {
    if (!this.plan || this.planLectureSeule()) return;
    if (!this.nouvelleAction.theme?.trim() || !this.nouvelleAction.actionDescription?.trim() || !this.nouvelleAction.responsibleId || !this.nouvelleAction.deadline) {
      alert('Veuillez renseigner les champs obligatoires de l’action.');
      return;
    }

    this.actionSaving = true;
    this.actionsService.creerAction(this.plan.id, this.nouvelleAction).subscribe({
      next: () => {
        this.fermerModalAction();
        this.rechargerPlan();
      },
      error: () => {
        this.actionSaving = false;
        alert("Ajout de l'action impossible. Vérifiez les champs.");
      }
    });
  }

  private chargerResponsables(): void {
    this.http.get<any[]>(API.users.responsables).subscribe({
      next: (data) => { this.responsables = data || []; },
      error: () => { this.responsables = []; }
    });
  }

  private rechargerPlan(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.plansService.getPlanById(id).subscribe({
      next: (data) => { this.plan = data; },
      error: () => {}
    });
  }

  countActionsByStatus(status: string): number {
    return (this.plan?.actions ?? []).filter(a => a.status === status).length;
  }

  get actionsEnRetard(): number {
    const today = new Date();
    return (this.plan?.actions ?? []).filter(a => {
      const due = new Date(a.deadline as any);
      const isClosed = a.status === 'Closed';
      return !isClosed && !Number.isNaN(due.getTime()) && due < today;
    }).length;
  }

  getSuggestions() {
    if (!this.plan) return;
    this.chargementIA = true;
    this.http.get<any>(API.chat.suggestions(this.plan.id))
      .subscribe({
        next: r => {
          this.suggestionsRaw = r.suggestions;
          this.suggestions = this.formatIaResponse(r.suggestions);
          this.chargementIA = false;
        },
        error: () => { this.chargementIA = false; }
      });
  }

  getResume() {
    if (!this.plan) return;
    this.chargementIA = true;
    this.resumeRaw = '';
    this.suggestionsRaw = '';
    this.http.get<any>(API.chat.resume(this.plan.id)).subscribe({
      next: r => {
        this.resumeRaw = r.resume;
        this.resume = this.formatIaResponse(r.resume);
        this.chargementIA = false;
      },
      error: () => { this.chargementIA = false; }
    });
  }

  formatIaResponse(text: string): string {
    if (!text) return '';
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^(\d+\.\s)/gm, '<br><strong>$1</strong>');
  }

  getCircularDashOffset(): number {
    const progress = this.plan?.progressPercentage ?? 0;
    return this.circumference - (progress / 100) * this.circumference;
  }
}
