import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActionsService } from '../../../core/services/actions.service';
import { AuthService } from '../../../core/services/auth.service';
import { Action, Commentaire, Fichier } from '../../../core/models/models';
import { API } from '../../../core/services/api-endpoints';

@Component({
  selector: 'app-action-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './action-detail.component.html',
  styleUrl: './action-detail.component.scss'
})
export class ActionDetailComponent implements OnInit {
  action: Action | null = null;
  commentaires: Commentaire[] = [];
  fichiers: Fichier[] = [];
  chargement = true;
  nouveauCommentaire = '';
  fichierSelectionne: File | null = null;
  descriptionFichier = '';
  modalSoumission = false;
  modalValidation = false;
  modalEvaluation = false;
  soumissionData: any = {};
  validationData: any = { isApproved: true };
  evaluationData: any = { effectiveness: 'Effective', starRating: 5 };
  actionRemplacement: any = {};
  currentUser: any;
  responsables: any[] = [];

  constructor(
    private actionsService: ActionsService,
    private authService: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.chargerAction(id);
    this.chargerResponsables();
  }

  chargerAction(id: number): void {
    this.actionsService.getActionById(id).subscribe({
      next: (data) => {
        this.action = data;
        this.chargement = false;
        this.chargerCommentaires(id);
        this.chargerFichiers(id);
      },
      error: () => { this.chargement = false; }
    });
  }

  chargerCommentaires(id: number): void {
    this.http.get<Commentaire[]>(API.commentaires.getByAction(id)).subscribe({
      next: (data) => { this.commentaires = data; }
    });
  }

  chargerFichiers(id: number): void {
    this.http.get<Fichier[]>(API.fichiers.getByAction(id)).subscribe({
      next: (data) => { this.fichiers = data; }
    });
  }

  chargerResponsables(): void {
    this.http.get<any[]>(API.users.responsables).subscribe({
      next: (data) => { this.responsables = data || []; },
      error: () => { this.responsables = []; }
    });
  }

  ajouterCommentaire(): void {
    if (!this.nouveauCommentaire.trim() || !this.action || this.estEnLectureSeule()) return;
    this.http.post(API.commentaires.add(this.action.id), { content: this.nouveauCommentaire }).subscribe({
      next: (c: any) => {
        this.commentaires.push(c);
        this.nouveauCommentaire = '';
      }
    });
  }

  onFichierChange(event: any): void {
    this.fichierSelectionne = event.target.files[0];
  }

  uploadFichier(): void {
    if (!this.fichierSelectionne || !this.action || this.estEnLectureSeule()) return;
    const formData = new FormData();
    formData.append('file', this.fichierSelectionne);
    formData.append('description', this.descriptionFichier);

    this.http.post(API.fichiers.upload(this.action.id), formData).subscribe({
      next: (f: any) => {
        this.fichiers.push(f);
        this.fichierSelectionne = null;
        this.descriptionFichier = '';
      }
    });
  }

  demarrer(): void {
    if (!this.action || !this.peutDemarrer()) return;
    if (!confirm("Passer cette action à l'état En réalisation ?")) return;
    this.actionsService.demarrer(this.action.id).subscribe({
      next: (data) => { this.action = data; }
    });
  }

  soumettre(): void {
    if (!this.action || !this.peutSoumettre()) return;
    if (!confirm("Confirmer la clôture de l'action et l'envoyer pour validation ?")) return;
    this.actionsService.soumettre(this.action.id, this.soumissionData).subscribe({
      next: (data) => {
        this.action = data;
        this.modalSoumission = false;
      }
    });
  }

  valider(): void {
    if (!this.action || !this.peutValider()) return;
    const decision = this.validationData?.isApproved ? 'valider' : 'rejeter';
    if (!confirm(`Confirmer: ${decision} cette action ?`)) return;
    this.actionsService.valider(this.action.id, this.validationData).subscribe({
      next: (data) => {
        this.action = data;
        this.modalValidation = false;
      }
    });
  }

  evaluer(): void {
    if (!this.action || !this.peutEvaluer()) return;
    if (!confirm("Enregistrer l'évaluation finale de cette action ?")) return;
    const data = {
      ...this.evaluationData,
      replacementAction: this.evaluationData.effectiveness === 'Ineffective'
        ? this.actionRemplacement
        : null
    };
    this.actionsService.evaluer(this.action.id, data).subscribe({
      next: (d) => {
        this.action = d;
        this.modalEvaluation = false;
      }
    });
  }

  retour(): void {
    window.history.back();
  }

  isManager(): boolean {
    return this.currentUser?.role === 'MANAGER';
  }

  isResponsable(): boolean {
    return this.currentUser?.role === 'RESPONSABLE';
  }

  peutDemarrer(): boolean {
    return this.isManager() && ['Created', 'Assigned'].includes(this.action?.status || '');
  }

  peutSoumettre(): boolean {
    return this.isResponsable() && this.action?.status === 'InProgress';
  }

  peutValider(): boolean {
    return this.isManager() && this.action?.status === 'UnderReview';
  }

  peutEvaluer(): boolean {
    return this.isManager() && this.action?.status === 'Validated';
  }

  estEnLectureSeule(): boolean {
    return this.action?.status === 'Closed';
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

  getEtatCode(status: string | undefined): 'P' | 'D' | 'C' {
    if (!status) return 'P';
    if (status === 'Closed') return 'C';
    if (status === 'UnderReview' || status === 'Validated') return 'D';
    return 'P';
  }

  getSoumissionHint(): string {
    const dateTxt = this.soumissionData?.realizationDate || 'la date choisie';
    return `La soumission enverra l'action en attente de validation pilote (D) avec la date ${dateTxt}.`;
  }

  getValidationHint(): string {
    return this.validationData?.isApproved
      ? "Validation: l'action sera considérée réalisée."
      : "Rejet: l'action devra être reprise et corrigée.";
  }

  telechargerFichier(id: number, fileName: string): void {
    this.http.get(API.fichiers.download(id), { responseType: 'blob' }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  supprimerFichier(id: number): void {
    if (this.estEnLectureSeule()) return;
    if (confirm('Supprimer ce fichier ?')) {
      this.http.delete(API.fichiers.delete(id)).subscribe({
        next: () => {
          this.fichiers = this.fichiers.filter(f => f.id !== id);
        }
      });
    }
  }

  isAfterStage(stageCode: 'P' | 'D' | 'C'): boolean {
    if (!this.action) return false;
    const currentStage = this.getEtatCode(this.action.status);
    const stageOrder = { 'P': 0, 'D': 1, 'C': 2 };
    return stageOrder[currentStage] > stageOrder[stageCode];
  }

  isLastStage(stageCode: 'P' | 'D' | 'C'): boolean {
    return stageCode === 'C';
  }

  getDeadlineClass(): string {
    if (!this.action?.deadline) return '';
    const today = new Date();
    const deadline = new Date(this.action.deadline);
    const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) return 'deadline-overdue';
    if (daysRemaining <= 3) return 'deadline-warning';
    return 'deadline-ok';
  }
}