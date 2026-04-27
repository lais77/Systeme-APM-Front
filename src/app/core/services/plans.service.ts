import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Plan } from '../models/models';
import { API } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class PlansService {

  constructor(private http: HttpClient) {}

  getTousLesPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(API.plans.getAll);
  }

  getMesPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(API.plans.getMes);
  }

  getPlanById(id: number): Observable<Plan> {
    return this.http.get<Plan>(API.plans.getById(id));
  }

  creerPlan(plan: any): Observable<Plan> {
    return this.http.post<Plan>(API.plans.create, plan);
  }

  modifierPlan(id: number, plan: any): Observable<Plan> {
    return this.http.put<Plan>(API.plans.update(id), plan);
  }

  validerPlan(id: number): Observable<any> {
    return this.http.patch(API.plans.valider(id), {});
  }

  cloturerPlan(id: number): Observable<any> {
    return this.http.patch(API.plans.cloturer(id), {});
  }
}