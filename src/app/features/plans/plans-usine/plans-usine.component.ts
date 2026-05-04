import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlansService } from '../../../core/services/plans.service';
import { Plan } from '../../../core/models/models';

interface ProcessRow {
  name: string;
  responsable: string;
  plans: number;
  actions: number;
  avancement: number;
  statut: 'Actif' | 'En pause' | 'Inactif';
}

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

  private readonly fallbackProcessRows: ProcessRow[] = [
    { name: 'Production PCB', responsable: 'Admin APM', plans: 2, actions: 5, avancement: 60, statut: 'Actif' },
    { name: 'Contrôle Qualité', responsable: 'Chadli BEDDEY', plans: 1, actions: 3, avancement: 33, statut: 'Actif' },
    { name: 'Logistique Interne', responsable: 'samir', plans: 1, actions: 2, avancement: 50, statut: 'En pause' }
  ];

  constructor(private plansService: PlansService) {}

  ngOnInit(): void { this.chargerPlans(); }

  chargerPlans(): void {
    this.plansService.getTousLesPlans().subscribe({
      next: (data) => {
        this.plans = data || [];
        this.plansFiltres = data || [];
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

  get processRows(): ProcessRow[] {
    if (!this.plansFiltres.length) return this.fallbackProcessRows;

    const grouped = new Map<string, ProcessRow & { progressTotal: number }>();
    for (const plan of this.plansFiltres) {
      const name = plan.processName || 'Sans processus';
      const existing = grouped.get(name) || {
        name,
        responsable: plan.pilotName || 'Admin APM',
        plans: 0,
        actions: 0,
        avancement: 0,
        progressTotal: 0,
        statut: 'Actif' as const
      };
      existing.plans += 1;
      existing.actions += plan.totalActions || 0;
      existing.progressTotal += plan.progressPercentage || 0;
      existing.responsable = existing.responsable || plan.pilotName || 'Admin APM';
      grouped.set(name, existing);
    }

    return Array.from(grouped.values()).map(row => ({
      name: row.name,
      responsable: row.responsable,
      plans: row.plans,
      actions: row.actions,
      avancement: row.plans ? Math.round(row.progressTotal / row.plans) : 0,
      statut: row.statut
    }));
  }

  get processStats() {
    const rows = this.processRows;
    const plans = rows.reduce((sum, row) => sum + row.plans, 0);
    const actions = rows.reduce((sum, row) => sum + row.actions, 0);
    const avancement = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + row.avancement, 0) / rows.length)
      : 0;
    const actifs = rows.filter(row => row.statut === 'Actif').length;
    return { actifs, plans, actions, avancement };
  }
}
