import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Notification } from '../../core/models/models';
import { API } from '../../core/services/api-endpoints';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  chargement = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.http.get<Notification[]>(API.notifications.getMes).subscribe({
      next: (data) => { this.notifications = data; this.chargement = false; },
      error: () => { this.chargement = false; }
    });
  }

  marquerLu(id: number): void {
    this.http.patch(API.notifications.markRead(id), {}).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.isRead = true;
      }
    });
  }

  marquerToutLu(): void {
    this.http.patch(API.notifications.markAllRead, {}).subscribe({
      next: () => { this.notifications.forEach(n => n.isRead = true); }
    });
  }
}