import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PlansService } from '../../../core/services/plans.service';
import { Plan } from '../../../core/models/models';
import { HttpClient } from '@angular/common/http';
import { API } from '../../../core/services/api-endpoints';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  // SVG circular progress properties
  circumference = 2 * Math.PI * 45; // radius = 45

  constructor(
    private plansService: PlansService,
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

  getDelaiCouleur(dateRealisation: string | undefined): string {
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
    const classes: any = {
      Created: 'badge-cree',
      Assigned: 'badge-assigne',
      InProgress: 'badge-encours',
      UnderReview: 'badge-revision',
      Validated: 'badge-valide',
      Rejected: 'badge-rejete',
      Closed: 'badge-cloture'
    };
    return classes[status] || '';
  }

  getStatutActionLabel(status: string): string {
    const labels: Record<string, string> = {
      Created: 'P - Planifiée',
      Assigned: 'P - Planifiée',
      InProgress: 'En réalisation',
      UnderReview: 'D - À valider',
      Validated: 'D - Réalisée',
      Rejected: 'À reprendre',
      Closed: 'C - Clôturée'
    };
    return labels[status] || status;
  }

  planLectureSeule(): boolean {
    return this.plan?.status === 'Closed';
  }

  planEnCours(): boolean {
    return this.plan?.status === 'InProgress';
  }

  validerPlan(): void {
    if (!this.planEnCours() || !this.plan) return;
    if (!confirm('Valider ce plan ?')) return;

    this.plansService.validerPlan(this.plan.id).subscribe({
      next: () => {
        this.rechargerPlan();
      }
    });
  }

  cloturerPlan(): void {
    if (!this.planEnCours() || !this.plan) return;
    if (!confirm('Clôturer ce plan ?')) return;

    this.plansService.cloturerPlan(this.plan.id).subscribe({
      next: () => {
        this.rechargerPlan();
      }
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