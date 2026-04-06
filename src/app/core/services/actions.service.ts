import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Action } from '../models/models';
import { API } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class ActionsService {

  constructor(private http: HttpClient) {}

  getMesActions(): Observable<Action[]> {
    return this.http.get<Action[]>(API.actions.getMes);
  }

  getActionsByPlan(planId: number): Observable<Action[]> {
    return this.http.get<Action[]>(API.actions.getByPlan(planId));
  }

  getActionById(id: number): Observable<Action> {
    return this.http.get<Action>(API.actions.getById(id));
  }

  creerAction(planId: number, action: any): Observable<Action> {
    return this.http.post<Action>(API.actions.create(planId), action);
  }

  modifierAction(id: number, action: any): Observable<Action> {
    return this.http.put<Action>(API.actions.update(id), action);
  }

  supprimerAction(id: number): Observable<any> {
    return this.http.delete(API.actions.delete(id));
  }

  demarrer(id: number): Observable<Action> {
    return this.http.post<Action>(API.actions.demarrer(id), {});
  }

  soumettre(id: number, data: any): Observable<Action> {
    return this.http.post<Action>(API.actions.submit(id), data);
  }

  valider(id: number, data: any): Observable<Action> {
    return this.http.post<Action>(API.actions.validate(id), data);
  }

  evaluer(id: number, data: any): Observable<Action> {
    return this.http.post<Action>(API.actions.evaluate(id), data);
  }
}