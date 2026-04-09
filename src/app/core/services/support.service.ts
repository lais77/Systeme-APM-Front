import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API } from './api-endpoints';
import { CreateSupportTicketRequest, SupportTicket } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly storageKey = 'support_tickets_local';

  constructor(private http: HttpClient) {}

  getMyTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(API.support.getMyTickets).pipe(
      catchError(() => of(this.getLocalTickets()))
    );
  }

  createTicket(payload: CreateSupportTicketRequest): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(API.support.createTicket, payload).pipe(
      catchError(() => {
        const ticket: SupportTicket = {
          id: Date.now(),
          category: payload.category,
          priority: payload.priority,
          status: 'OPEN',
          message: payload.message,
          pageUrl: payload.pageUrl,
          fileName: payload.fileName,
          createdAt: new Date().toISOString()
        };
        const tickets = [ticket, ...this.getLocalTickets()];
        localStorage.setItem(this.storageKey, JSON.stringify(tickets));
        return of(ticket);
      })
    );
  }

  private getLocalTickets(): SupportTicket[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as SupportTicket[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
