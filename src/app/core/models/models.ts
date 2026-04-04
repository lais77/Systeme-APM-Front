export type Role = 'ADMIN' | 'MANAGER' | 'RESPONSABLE' | 'AUDITEUR';

export type StatutAction =
  | 'CREE'
  | 'ASSIGNE'
  | 'EN_COURS'
  | 'EN_REVISION'
  | 'VALIDE'
  | 'REJETE'
  | 'CLOTURE';

export type Efficacite = 'EFFICACE' | 'MOYEN' | 'INEFFICACE';
export type Priorite = 'CRITIQUE' | 'HAUTE' | 'MOYENNE' | 'BASSE';
export type TypeAction = 'PREVENTIF' | 'CORRECTIF';
export type Criticite = 'FAIBLE' | 'MOYENNE' | 'ELEVEE';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  departmentName?: string;
  equipe?: string;
  chefHierarchiqueId?: number;
  actif: boolean;
}

export interface Plan {
  id: number;
  titre: string;
  description?: string;
  objectif?: string;
  contexte?: string;
  piloteId: number;
  pilote?: User;
  processus: string;
  departmentName?: string;
  priorite: Priorite;
  visibilite: 'PUBLIC' | 'PRIVE';
  dateDebut: Date;
  dateEcheance: Date;
  dateCreation: Date;
  statut: 'EN_COURS' | 'CLOTURE';
  tauxAvancement: number;
  actions?: Action[];
}

export interface Action {
  id: number;
  planId: number;
  theme: string;
  type: TypeAction;
  criticite: Criticite;
  cause: string;
  description: string;
  responsableId: number;
  responsable?: User;
  delai: Date;
  avancement: number;
  commentaire?: string;
  statut: StatutAction;
  dateRealisation?: Date;
  methodeRealisation?: string;
  dateVerification?: Date;
  methodeVerification?: string;
  efficacite?: Efficacite;
  noteQualite?: number;
  commentaireEvaluation?: string;
  actionParentId?: number;
  actionEnfant?: Action;
  historiqueStatuts?: HistoriqueStatut[];
}

export interface HistoriqueStatut {
  id: number;
  actionId: number;
  statut: StatutAction;
  date: Date;
  auteurId: number;
  auteur?: User;
  commentaire?: string;
}

export interface Commentaire {
  id: number;
  actionId: number;
  auteurId: number;
  auteur?: User;
  message: string;
  dateCreation: Date;
}

export interface Fichier {
  id: number;
  actionId: number;
  nom: string;
  description: string;
  url: string;
  version: number;
  dateUpload: Date;
  uploadeurId: number;
}

export interface Notification {
  id: number;
  userId: number;
  titre: string;
  message: string;
  lu: boolean;
  dateCreation: Date;
  actionId?: number;
  type: 'ATTRIBUTION' | 'RAPPEL' | 'RETARD' | 'STATUT' | 'COMMENTAIRE' | 'ESCALADE';
}

export interface AuthRequest {
  email: string;
  password: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}

export interface StatsGlobal {
  totalPlans: number;
  totalActions: number;
  tauxRealisation: number;
  tauxCloture: number;
  tauxEfficacite: number;
  actionsEnRetard: number;
  actionsEnCours: number;
  actionsCloturees: number;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}