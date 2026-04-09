import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API } from '../../core/services/api-endpoints';

// ─────────────────────────────────────────────────────────────
// Adaptez cet import selon votre structure réelle :
// import { NotificationService } from '../../../core/services/notification.service';
// ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {

  // ── Compteurs panel gauche ────────────────────────────────
get retardCount(): number {
  return this.notifications.filter(n => n.type === 'RETARD').length;
}

get urgentCount(): number {
  return this.notifications.filter(n => n.type === 'URGENT').length;
}

get clotureCount(): number {
  return this.notifications.filter(n => n.type === 'CLOTURE').length;
}

// ── Pagination ────────────────────────────────────────────
currentPage: number = 1;
totalPages: number = 1;

prevPage(): void {
  if (this.currentPage > 1) this.currentPage--;
}

nextPage(): void {
  if (this.currentPage < this.totalPages) this.currentPage++;
}

  // ── Données ───────────────────────────────────────────────
  notifications: any[] = [];

  // ── Onglet actif : 'all' | 'unread' | 'retard' ───────────
  activeTab: string = 'all';

  // ── Compteur non lues ─────────────────────────────────────
  unreadCount: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  // ── Chargement HTTP ───────────────────────────────────────
  loadNotifications(): void {
    this.http.get<any[]>(API.notifications.getMes).subscribe({
      next: (data) => {
        this.notifications = (data || []).map(n => ({
          ...n,
          lue: !!(n.lue ?? n.isRead)
        }));
        this.updateUnreadCount();
      },
      error: (err) => { console.error('Erreur chargement notifications', err); }
    });
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.lue).length;
  }

  // ── Getter tableau filtré ─────────────────────────────────
  get filteredNotifications(): any[] {
    switch (this.activeTab) {
      case 'unread':
        return this.notifications.filter(n => !n.lue);
      case 'retard':
        return this.notifications.filter(n => n.type === 'RETARD');
      default:
        return this.notifications;
    }
  }

  // ── Changer d'onglet ──────────────────────────────────────
  setTab(tab: string): void {
    this.activeTab = tab;
  }

  // ── Marquer une notification comme lue ───────────────────
  markAsRead(notif: any): void {
    if (notif.lue) return;
    notif.lue = true;
    this.updateUnreadCount();

    // Appel HTTP optionnel — adaptez l'URL :
    this.http.patch(API.notifications.markRead(notif.id), {}).subscribe({
      error: (err) => { console.error('Erreur mark as read', err); }
    });
  }

  // ── Tout marquer comme lu ─────────────────────────────────
  markAllAsRead(): void {
    this.notifications.forEach(n => n.lue = true);
    this.unreadCount = 0;

    // Appel HTTP optionnel — adaptez l'URL :
    this.http.patch(API.notifications.markAllRead, {}).subscribe({
      error: (err) => { console.error('Erreur mark all as read', err); }
    });
  }
}
