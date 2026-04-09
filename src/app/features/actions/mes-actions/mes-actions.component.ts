import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActionsService } from '../../../core/services/actions.service';
import { Action } from '../../../core/models/models';

@Component({
  selector: 'app-mes-actions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mes-actions.component.html',
  styleUrl: './mes-actions.component.scss'
})
export class MesActionsComponent implements OnInit {
  actions: Action[] = [];
  actionsFiltrees: Action[] = [];
  chargement = true;
  filtreStatut = '';

  constructor(private actionsService: ActionsService) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.actionsService.getMesActions().subscribe({
      next: (data) => {
        this.actions = data;
        this.actionsFiltrees = data;
        this.chargement = false;
      },
      error: () => { this.chargement = false; }
    });
  }

  filtrer(): void {
    this.actionsFiltrees = this.actions.filter(a =>
      !this.filtreStatut || a.status === this.filtreStatut
    );
  }

  getStatutClass(status: string): string {
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

  getStatutLabel(status: string): string {
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

  getCriticiteClass(criticity: string): string {
    const classes: any = {
      High: 'badge-critique',
      Medium: 'badge-moyenne',
      Low: 'badge-basse'
    };
    return classes[criticity] || '';
  }

  isEnRetard(deadline: Date): boolean {
    return new Date(deadline) < new Date();
  }
}