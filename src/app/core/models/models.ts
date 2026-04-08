export type Role = 'ADMIN' | 'MANAGER' | 'RESPONSABLE' | 'AUDITEUR';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  departmentId?: number;
  teamId?: number;
  managerId?: number;
  isActive: boolean;
  password?: string;
}

export interface Plan {
  id: number;
  title: string;
  description?: string;
  objective?: string;
  priority: string;
  status: string;
  startDate: Date;
  dueDate: Date;
  progressPercentage: number;
  createdAt: Date;
  closedAt?: Date;
  pilotId: number;
  pilotName: string;
  processId: number;
  processName: string;
  departmentId?: number;
  departmentName?: string;
  totalActions: number;
  actions?: Action[];
}

export interface Action {
  id: number;
  theme: string;
  anomalyDescription?: string;
  actionDescription: string;
  type: string;
  criticity: string;
  cause?: string;
  status: string;
  progressPercentage: number;
  deadline: Date;
  delai?: string;
  date_realisation?: string;
  realizationMethod?: string;
  realizationDate?: Date;
  verificationMethod?: string;
  verificationDate?: Date;
  format_verification?: string;
  commentaire?: string;
  effectiveness?: string;
  effectivenessComment?: string;
  starRating?: number;
  createdAt: Date;
  actionPlanId: number;
  responsibleId: number;
  responsibleName: string;
  parentActionId?: number;
}

export interface Commentaire {
  id: number;
  actionItemId: number;
  authorId: number;
  authorName?: string;
  content: string;
  createdAt: Date;
}

export interface Fichier {
  id: number;
  actionItemId: number;
  fileName: string;
  description?: string;
  filePath: string;
  uploadedAt: Date;
  uploadedById: number;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionItemId?: number;
  type: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: Role;
    departmentName?: string;
  };
}

export interface StatsGlobal {
  totalPlans: number;
  totalActions: number;
  completionRate: number;
  closureRate: number;
  effectivenessRate: number;
  overdueActions: number;
  inProgressActions: number;
  closedActions: number;
}