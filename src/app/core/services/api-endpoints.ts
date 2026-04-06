import { environment } from '../../../environments/environment';

const BASE = environment.apiUrl;

export const API = {
  auth: {
    login: `${BASE}/auth/login`,
    logout: `${BASE}/auth/logout`,
    forgotPassword: `${BASE}/auth/forgot-password`,
    resetPassword: `${BASE}/auth/reset-password`,
  },
  users: {
    getAll: `${BASE}/users`,
    getById: (id: number) => `${BASE}/users/${id}`,
    create: `${BASE}/users`,
    update: (id: number) => `${BASE}/users/${id}`,
    deactivate: (id: number) => `${BASE}/users/${id}/desactiver`,
    logs: (id: number) => `${BASE}/users/${id}/logs`,
  },
  departements: {
    getAll: `${BASE}/Departments`,
    create: `${BASE}/Departments`,
    update: (id: number) => `${BASE}/Departments/${id}`,
    delete: (id: number) => `${BASE}/Departments/${id}`,
  },
  processus: {
    getAll: `${BASE}/Processes`,
    create: `${BASE}/Processes`,
    update: (id: number) => `${BASE}/Processes/${id}`,
    delete: (id: number) => `${BASE}/Processes/${id}`,
  },
  plans: {
    getAll: `${BASE}/plans`,
    getMes: `${BASE}/plans/mes-plans`,
    getById: (id: number) => `${BASE}/plans/${id}`,
    create: `${BASE}/plans`,
    update: (id: number) => `${BASE}/plans/${id}`,
    cloturer: (id: number) => `${BASE}/plans/${id}/cloturer`,
  },
  actions: {
    getByPlan: (planId: number) => `${BASE}/plans/${planId}/actions`,
    getMes: `${BASE}/actions/mes-actions`,
    getById: (id: number) => `${BASE}/actions/${id}`,
    create: (planId: number) => `${BASE}/plans/${planId}/actions`,
    update: (id: number) => `${BASE}/actions/${id}`,
    delete: (id: number) => `${BASE}/actions/${id}`,
    demarrer: (id: number) => `${BASE}/actions/${id}/demarrer`,
    submit: (id: number) => `${BASE}/actions/${id}/submit`,
    validate: (id: number) => `${BASE}/actions/${id}/valider`,
    reject: (id: number) => `${BASE}/actions/${id}/rejeter`,
    evaluate: (id: number) => `${BASE}/actions/${id}/evaluer`,
  },
  commentaires: {
    getByAction: (actionId: number) => `${BASE}/actions/${actionId}/comments`,
    add: (actionId: number) => `${BASE}/actions/${actionId}/comments`,
    delete: (id: number) => `${BASE}/comments/${id}`,
  },
  fichiers: {
    getByAction: (actionId: number) => `${BASE}/actions/${actionId}/attachments`,
    upload: (actionId: number) => `${BASE}/actions/${actionId}/attachments`,
    download: (id: number) => `${BASE}/attachments/${id}/download`,
    delete: (id: number) => `${BASE}/attachments/${id}`,
  },
  notifications: {
    getMes: `${BASE}/notifications/my`,
    markRead: (id: number) => `${BASE}/notifications/${id}/read`,
    markAllRead: `${BASE}/notifications/read-all`,
  },
  stats: {
    global: `${BASE}/stats/global`,
    byDepartement: `${BASE}/stats/by-department`,
    byPilote: `${BASE}/stats/by-pilot`,
    byPeriode: `${BASE}/stats/by-period`,
    performance: `${BASE}/stats/performance`,
    export: {
      pdf: `${BASE}/export/pdf`,
      excel: `${BASE}/export/excel`,
    }
  }
};