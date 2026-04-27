import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlansService } from '../../../core/services/plans.service';
import { Plan } from '../../../core/models/models';

@Component({
  selector: 'app-plans-usine',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './plans-usine.component.html',
  styleUrl: './plans-usine.component.scss'
})
export class PlansUsineComponent implements OnInit {
  plans: Plan[] = [];
  plansFiltres: Plan[] = [];
  chargement = true;
  recherche = '';
  filtreStatut = '';
  filtrePriorite = '';

  constructor(private plansService: PlansService) {}

  ngOnInit(): void { this.chargerPlans(); }

  chargerPlans(): void {
    this.plansService.getTousLesPlans().subscribe({
      next: (data) => {
        this.plans = data;
        this.plansFiltres = data;
        this.chargement = false;
      },
      error: () => { this.chargement = false; }
    });
  }

  filtrer(): void {
    this.plansFiltres = this.plans.filter(p => {
      const matchRecherche = !this.recherche ||
        p.title.toLowerCase().includes(this.recherche.toLowerCase());
      const matchStatut = !this.filtreStatut || p.status === this.filtreStatut;
      const matchPriorite = !this.filtrePriorite || p.priority === this.filtrePriorite;
      return matchRecherche && matchStatut && matchPriorite;
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

  getStatutClass(status: string): string {
    return status === 'InProgress' ? 'badge-encours' : 'badge-cloture';
  }

  getStatutLabel(status: string): string {
    return status === 'Closed' ? 'Clôturé' : 'En cours';
  }

  get totalActions(): number {
    return this.plansFiltres.reduce((sum, p) => sum + (p.totalActions || 0), 0);
  }

  get totalPilotes(): number {
    return new Set(this.plansFiltres.map(p => p.pilotName).filter(Boolean)).size;
  }
}