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
    this.actionsService.demarrer(this.action.id).subscribe({
      next: (data) => { this.action = data; }
    });
  }

  soumettre(): void {
    if (!this.action || !this.peutSoumettre()) return;
    this.actionsService.soumettre(this.action.id, this.soumissionData).subscribe({
      next: (data) => {
        this.action = data;
        this.modalSoumission = false;
      }
    });
  }

  valider(): void {
    if (!this.action || !this.peutValider()) return;
    this.actionsService.valider(this.action.id, this.validationData).subscribe({
      next: (data) => {
        this.action = data;
        this.modalValidation = false;
      }
    });
  }

  evaluer(): void {
    if (!this.action || !this.peutEvaluer()) return;
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
}