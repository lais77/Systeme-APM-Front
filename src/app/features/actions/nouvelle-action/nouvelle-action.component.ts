import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ActionsService } from '../../../core/services/actions.service';
import { API } from '../../../core/services/api-endpoints';

@Component({
  selector: 'app-nouvelle-action',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './nouvelle-action.component.html',
  styleUrl: './nouvelle-action.component.scss'
})
export class NouvelleActionComponent implements OnInit {
  planId: number = 0;
  users: any[] = [];
  action: any = {
    type: 'Corrective',
    criticity: 'Medium',
    prevCorr: 'Corrective',
    deadline: new Date().toISOString().split('T')[0]
  };
  chargement = false;
  erreur = '';

  constructor(
    private actionsService: ActionsService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('planId'));
    this.chargerUsers();
  }

  chargerUsers(): void {
    this.http.get<any[]>(API.users.responsables).subscribe({
      next: (data) => { this.users = data || []; },
      error: () => { this.erreur = 'Impossible de charger les responsables.'; }
    });
  }

  creer(): void {
    if (!this.action.theme || !this.action.actionDescription || !this.action.responsibleId) {
      this.erreur = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.chargement = true;
    this.actionsService.creerAction(this.planId, this.action).subscribe({
      next: () => {
        this.router.navigate(['/plans', this.planId]);
      },
      error: () => {
        this.erreur = 'Erreur lors de la création.';
        this.chargement = false;
      }
    });
  }

  getTypeLabel(type: string | undefined): string {
    if (type === 'Preventive') return 'Préventif';
    return 'Correctif';
  }
}