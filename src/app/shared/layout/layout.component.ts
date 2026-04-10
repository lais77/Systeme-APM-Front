import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/models';
import { API } from '../../core/services/api-endpoints';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {

  // ── Utilisateur connecté ──────────────────────────────────
  currentUser: User | null = null;
  userRole: string = '';
  currentYear = new Date().getFullYear();

  // ── Badge notifications ───────────────────────────────────
  unreadCount: number = 0;
  notificationMenuOpen = false;
  settingsMenuOpen = false;
  userMenuOpen = false;
  /** Aligné sur l’apparence claire par défaut (:root) ; persistant dans localStorage */
  isLightMode = true;
  private readonly themeStorageKey = 'apm-ui-light-mode';
  notifications: Array<{ id?: number; title: string; details: string; time: string; read: boolean }> = [
    { title: 'Nouveau processus créé', details: 'créé par Admin APM', time: "À l'instant", read: false },
    { title: 'Rapport mensuel prêt', details: 'disponible pour téléchargement', time: 'Il y a 10 min', read: false },
    { title: 'Alerte système', details: 'Stockage saturé à 90%', time: 'Il y a 25 min', read: false },
    { title: 'Ticket support résolu', details: 'Ticket #241 marqué résolu', time: 'Il y a 1 h', read: true },
    { title: 'Nouveau département', details: 'Département Qualité ajouté', time: 'Hier', read: true }
  ];

  // ── Titre page (topbar) ───────────────────────────────────
  pageTitle: string = 'Dashboard';

  // ── Mapping route → titre ─────────────────────────────────
  private routeTitles: { [key: string]: string } = {
    '/dashboard':             'Tableau de bord',
    '/reporting':             'Reporting',
    '/admin/utilisateurs':    'Utilisateurs',
    '/admin/departements':    'Départements',
    '/admin/processus':       'Processus',
    '/notifications':         'Notifications',
    '/support':               'Support',
    '/plans-usine':           'Plans Usine',
    '/mes-plans':             'Mes Plans',
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
    });
    this.loadUnreadCount();
    this.watchRouteChanges();
  }

  /** Ne pas fermer les menus sur un clic à l’intérieur d’une zone header (sinon le menu disparaît avant le handler du bouton). */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const t = event.target as HTMLElement | null;
    if (t?.closest('.header-menu-wrap')) {
      return;
    }
    this.closeMenus();
  }

  // ── Charger le nombre de notifications non lues ──────────
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
      error: () => {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
      }
    });
  }

  // ── Mettre à jour le titre selon la route active ─────────
  private watchRouteChanges(): void {
    // Titre initial
    this.updateTitle(this.router.url);

    // Titre à chaque navigation
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.updateTitle(e.urlAfterRedirects));
  }

  private updateTitle(url: string): void {
    const cleanUrl = url.split('?')[0];
    this.pageTitle = this.routeTitles[cleanUrl] || 'APM';
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

  // ── Déconnexion ───────────────────────────────────────────
  logout(event?: MouseEvent): void {
    event?.stopPropagation();
    this.closeMenus();
    this.authService.logout();
  }
}
