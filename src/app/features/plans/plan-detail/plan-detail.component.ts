import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PlansService } from '../../../core/services/plans.service';
import { Plan } from '../../../core/models/models';

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

  constructor(
    private plansService: PlansService,
    private route: ActivatedRoute
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
}