import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/models';
import { API } from '../../core/services/api-endpoints';

import { ChatbotComponent } from '../chatbot/chatbot.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, ChatbotComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {

  // ── Utilisateur connecté ──────────────────────────────────
  currentUser: User | null = null;
  userRole: string = '';
  currentYear = new Date().getFullYear();
  profileGreeting: string = 'Bonjour';
  userInitial: string = 'A';

  // ── Badge notifications ───────────────────────────────────
  unreadCount: number = 0;
  notificationMenuOpen = false;
  settingsMenuOpen = false;
  userMenuOpen = false;
  
  isLightMode = true;
  private readonly themeStorageKey = 'apm-ui-light-mode';
  notifications: Array<{ id?: number; title: string; details: string; time: string; read: boolean }> = [
    { title: 'Nouveau departement cree', details: 'cree par Admin APM', time: "A l'instant", read: false }
  ];

  // ── Titre page (topbar) ───────────────────────────────────
  pageTitle: string = 'Accueil';

  // ── Mapping route → titre ─────────────────────────────────
  private routeTitles: { [key: string]: string } = {
    '/dashboard':             'Accueil',
    '/reporting':             'Statistiques',
    '/admin/users':           'Utilisateurs',
    '/admin/departements':    'Départements',
    '/notifications':         'Notifications',
    '/support':               'Support',
    '/plans-usine':           "Plans d'Action Usine",
    '/mes-plans':             "Mes Plans d'Action",
    '/mes-actions':           'Mes Actions',
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const stored = localStorage.getItem(this.themeStorageKey);
    if (stored !== null) {
      this.isLightMode = stored === 'true';
    }
    // S'abonner aux changements de l'utilisateur
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.userRole = user?.role ? user.role.toUpperCase() : '';
      this.updateProfileInfo();
    });
    this.loadUnreadCount();
    this.watchRouteChanges();
    this.updateProfileInfo();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const t = event.target as HTMLElement | null;
    if (t?.closest('.header-menu-wrap')) {
      return;
    }
    this.closeMenus();
  }

  private loadUnreadCount(): void {
    this.http.get<any[]>(API.notifications.getMes).subscribe({
      next: (data) => {
        const all = data || [];
        this.unreadCount = all.filter((n: any) => !(n.isRead ?? n.lue)).length;
        this.notifications = all.slice(0, 5).map((n: any) => ({
          id: n.id,
          title: n.title || 'Notification',
          details: n.message || '',
          time: this.formatRelativeTime(n.createdAt),
          read: !!(n.isRead ?? n.lue)
        }));
      },
      error: () => {}
    });
  }

  private watchRouteChanges(): void {
    this.updateTitle(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.updateTitle(e.urlAfterRedirects));
  }

  private updateTitle(url: string): void {
    const cleanUrl = url.split('?')[0];
    this.pageTitle = this.routeTitles[cleanUrl] || 'APM';
  }

  private updateProfileInfo(): void {
    const hour = new Date().getHours();
    const salutation = hour < 18 ? 'Bonjour' : 'Bonsoir';
    const fullName = this.currentUser?.fullName?.trim() || 'Admin APM';
    this.profileGreeting = `${salutation}, ${fullName}`;
    this.userInitial = fullName.charAt(0).toUpperCase();
  }

  toggleNotificationMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationMenuOpen = !this.notificationMenuOpen;
    this.settingsMenuOpen = false;
    this.userMenuOpen = false;
  }

  toggleSettingsMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.settingsMenuOpen = !this.settingsMenuOpen;
    this.notificationMenuOpen = false;
    this.userMenuOpen = false;
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
    this.notificationMenuOpen = false;
    this.settingsMenuOpen = false;
  }

  markAllNotificationsAsRead(event: MouseEvent): void {
    event.stopPropagation();
    this.http.put(API.notifications.markAllRead, {}).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, read: true }));
        this.unreadCount = 0;
      },
      error: () => {
        this.notifications = this.notifications.map(n => ({ ...n, read: true }));
        this.unreadCount = 0;
      }
    });
  }

  openNotificationsPage(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenus();
    this.router.navigate(['/notifications']);
  }

  openProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenus();
    this.router.navigate(['/support']);
  }

  openSystemSettings(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenus();
    this.router.navigate(['/admin/users']);
  }

  toggleTheme(event: MouseEvent): void {
    event.stopPropagation();
    this.isLightMode = !this.isLightMode;
    localStorage.setItem(this.themeStorageKey, String(this.isLightMode));
    this.closeMenus();
  }

  private closeMenus(): void {
    this.notificationMenuOpen = false;
    this.settingsMenuOpen = false;
    this.userMenuOpen = false;
  }

  private formatRelativeTime(dateValue?: string): string {
    if (!dateValue) return "À l'instant";
    const date = new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    return 'Hier';
  }

  logout(event?: MouseEvent): void {
    event?.stopPropagation();
    this.closeMenus();
    this.authService.logout();
  }

  // Ces méthodes renvoient maintenant des propriétés pré-calculées
  getProfileGreeting(): string { return this.profileGreeting; }
  getUserInitial(): string { return this.userInitial; }
}
