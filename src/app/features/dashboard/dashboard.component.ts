import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API } from '../../core/services/api-endpoints';
import { AuthService } from '../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type PeriodeHistogramme = 0 | 3 | 6 | 12;

interface MonthlyPoint {
  actionsCloturees: number;
  actionsEnRetard: number;
}

interface ActionUrgenteVm {
  id: number;
  actionPlanId: number;
  actionDescription: string;
  deadline: string;
  planTitle?: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('camembertCanvas') camembertCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('histogrammeCanvas') histogrammeCanvas!: ElementRef<HTMLCanvasElement>;

  stats: any = null;
  /** Données brutes du dernier appel mensuel (tableau « plans critiques » / compat.) */
  statsMensuelles: any[] = [];
  /** Clé `année-mois` (ex. 2026-4) → agrégats */
  private mensuelMap = new Map<string, MonthlyPoint>();
  chargement = true;
  private api = environment.apiUrl;
  private camembertChart?: Chart;
  private histogrammeChart?: Chart;

  today: Date = new Date();
  userRole = '';

  periodeHistogramme: PeriodeHistogramme = 0;

  actionsUrgentes: ActionUrgenteVm[] = [];
  chargementActionsUrgentes = false;

  /** Tableau « plans critiques » : à brancher sur une API dédiée ; évite d’utiliser les stats mensuelles à tort. */
  plansCritiques: any[] = [];

  statsByDept: any[] = [];
  statsByPilot: any[] = [];
  activiteRecente: any[] = [];

  get isLoading(): boolean {
    return this.chargement;
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.userRole = (u?.role ?? '').toUpperCase();
    });
    this.chargerStats();
    this.chargerPlansCritiques();
    this.chargerStatsByDept();
    this.chargerStatsByPilot();
    this.chargerActiviteRecente();
  }

  chargerPlansCritiques(): void {
    this.http.get<any[]>(API.stats.plansCritiques).subscribe({
      next: data => this.plansCritiques = data,
      error: () => {}
    });
  }

  chargerStatsByDept(): void {
    this.http.get<any[]>(API.stats.byDepartment).subscribe({
      next: data => this.statsByDept = data,
      error: () => {}
    });
  }

  chargerStatsByPilot(): void {
    this.http.get<any[]>(API.stats.byPilot).subscribe({
      next: data => this.statsByPilot = data,
      error: () => {}
    });
  }

  chargerActiviteRecente(): void {
    this.http.get<any[]>(API.stats.activiteRecente).subscribe({
      next: data => this.activiteRecente = data,
      error: () => {}
    });
  }

  ngAfterViewInit(): void { }

  setPeriode(p: PeriodeHistogramme): void {
    this.periodeHistogramme = p;
    setTimeout(() => this.creerHistogramme(), 0);
  }

  chargerStats(): void {
    this.chargement = true;
    const y = new Date().getFullYear();
    forkJoin({
      global: this.http.get(`${this.api}/stats/global`),
      mCur: this.http.get<any[]>(`${this.api}/stats/monthly/${y}`),
      mPrev: this.http.get<any[]>(`${this.api}/stats/monthly/${y - 1}`)
    }).subscribe({
      next: ({ global, mCur, mPrev }) => {
        this.stats = global;
        this.statsMensuelles = mCur || [];
        this.mensuelMap.clear();
        this.mergeMonthlyYear(y, mCur || []);
        this.mergeMonthlyYear(y - 1, mPrev || []);
        this.chargement = false;
        setTimeout(() => this.creerGraphiques(), 100);
        this.chargerActionsUrgentes();
      },
      error: () => {
        this.chargement = false;
      }
    });
  }

  private mergeMonthlyYear(year: number, rows: any[]): void {
    rows.forEach((s, i) => {
      let month = s.month ?? s.Month ?? s.mois ?? s.Mois;
      if ((month == null || month === '') && rows.length > 0 && rows.length <= 12) {
        month = i + 1;
      }
      if (month == null || month === '') return;
      const key = `${year}-${month}`;
      this.mensuelMap.set(key, {
        actionsCloturees: s.actionsCloturees ?? s.ActionsCloturees ?? 0,
        actionsEnRetard: s.actionsEnRetard ?? s.ActionsEnRetard ?? 0
      });
    });
  }

  private getMonthly(year: number, month: number): MonthlyPoint {
    return this.mensuelMap.get(`${year}-${month}`) ?? { actionsCloturees: 0, actionsEnRetard: 0 };
  }

  creerGraphiques(): void {
    this.creerCamembert();
    this.creerHistogramme();
  }

  /** Camembert pertinent seulement s’il y a au moins deux segments non nuls. */
  get afficherCamembert(): boolean {
    const d = this.donneesCamembertBrutes;
    const total = d.reduce((a, b) => a + b, 0);
    if (total <= 0) return false;
    return d.filter(v => v > 0).length >= 2;
  }

  get messageEtatCamembert(): string {
    const d = this.donneesCamembertBrutes;
    const total = d.reduce((a, b) => a + b, 0);
    if (total <= 0) {
      return 'Aucune action enregistrée pour le moment.';
    }
    return 'Données insuffisantes pour une répartition comparative — au moins deux statuts distincts sont nécessaires.';
  }

  private get donneesCamembertBrutes(): number[] {
    if (!this.stats) return [0, 0, 0];
    return [
      this.stats.actionsCloturees ?? this.stats.cloturees ?? 0,
      this.stats.actionsEnCours ?? this.stats.enCours ?? 0,
      this.stats.actionsEnRetard ?? this.stats.enRetard ?? 0
    ];
  }

  private creerCamembert(): void {
    this.camembertChart?.destroy();
    this.camembertChart = undefined;
    if (!this.camembertCanvas?.nativeElement || !this.stats || !this.afficherCamembert) return;

    this.camembertChart = new Chart(this.camembertCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Action clôturée', 'Action en cours', 'Action en retard'],
        datasets: [{
          data: this.donneesCamembertBrutes,
          backgroundColor: ['#00c800', '#46a3c7', '#ff0d0d'],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '0%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#374151',
              usePointStyle: true,
              pointStyle: 'rect',
              boxWidth: 10,
              font: { family: 'Segoe UI', size: 11, weight: 'bold' }
            }
          },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f9fafb',
            bodyColor: '#e5e7eb'
          }
        }
      }
    });
  }

  private buildHistogramSeries(): { labels: string[]; enRetard: number[]; cloturees: number[] } {
    const mois = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;

    if (this.periodeHistogramme === 0) {
      const withData: number[] = [];
      for (let m = 1; m <= 12; m++) {
        const p = this.getMonthly(curY, m);
        if (p.actionsCloturees + p.actionsEnRetard > 0) withData.push(m);
      }
      if (withData.length === 0) {
        const to = curM;
        const from = Math.max(1, to - 2);
        const labels: string[] = [];
        const enRetard: number[] = [];
        const cloturees: number[] = [];
        for (let m = from; m <= to; m++) {
          const p = this.getMonthly(curY, m);
          labels.push(mois[m - 1]);
          enRetard.push(p.actionsEnRetard);
          cloturees.push(p.actionsCloturees);
        }
        return { labels, enRetard, cloturees };
      }
      let from = Math.min(...withData);
      let to = Math.max(...withData);
      while (to - from + 1 < 3 && (from > 1 || to < 12)) {
        if (from > 1) from--;
        else if (to < 12) to++;
      }
      const labels: string[] = [];
      const enRetard: number[] = [];
      const cloturees: number[] = [];
      for (let m = from; m <= to; m++) {
        const p = this.getMonthly(curY, m);
        labels.push(mois[m - 1]);
        enRetard.push(p.actionsEnRetard);
        cloturees.push(p.actionsCloturees);
      }
      return { labels, enRetard, cloturees };
    }

    const n = this.periodeHistogramme;
    const labels: string[] = [];
    const enRetard: number[] = [];
    const cloturees: number[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const p = this.getMonthly(y, m);
      const label = y === curY ? mois[m - 1] : `${mois[m - 1]} ’${String(y).slice(-2)}`;
      labels.push(label);
      enRetard.push(p.actionsEnRetard);
      cloturees.push(p.actionsCloturees);
    }
    return { labels, enRetard, cloturees };
  }

  private creerHistogramme(): void {
    if (!this.histogrammeCanvas?.nativeElement) return;

    const { labels, enRetard, cloturees } = this.buildHistogramSeries();
    this.histogrammeChart?.destroy();
    this.histogrammeChart = undefined;
    if (labels.length === 0) return;

    const maxVal = Math.max(1, ...enRetard, ...cloturees);
    const yMax = Math.max(5, Math.ceil(maxVal * 1.15));
    const step = yMax <= 10 ? 2 : Math.max(2, Math.ceil(yMax / 5));

    this.histogrammeChart = new Chart(this.histogrammeCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Action en retard',
            data: enRetard,
            backgroundColor: '#46a3c7',
            borderRadius: 2,
            borderSkipped: false,
            barPercentage: 0.55,
            categoryPercentage: 0.75
          },
          {
            label: 'Action clôturée',
            data: cloturees,
            backgroundColor: '#00c800',
            borderRadius: 2,
            borderSkipped: false,
            barPercentage: 0.55,
            categoryPercentage: 0.75
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'center',
            labels: {
              color: '#374151',
              usePointStyle: false,
              boxWidth: 10,
              font: { family: 'Segoe UI', size: 11, weight: 'bold' }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6b7280', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            max: yMax,
            grid: { color: '#e5e7eb' },
            ticks: {
              color: '#6b7280',
              font: { size: 11 },
              stepSize: step,
              precision: 0
            }
          }
        }
      }
    });
  }

  get totalPlans(): number {
    return this.stats?.totalPlans ?? this.stats?.totalPlanActions ?? 0;
  }

  get totalActions(): number {
    return this.stats?.totalActions ?? 0;
  }

  get actionsEnCours(): number {
    return this.stats?.actionsEnCours ?? this.stats?.enCours ?? 0;
  }

  get actionsCloturees(): number {
    return this.stats?.actionsCloturees ?? this.stats?.cloturees ?? 0;
  }

  get actionsEnRetard(): number {
    return this.stats?.actionsEnRetard ?? this.stats?.enRetard ?? 0;
  }

  get tauxRealisation(): number {
    return this.stats?.tauxRealisation ?? 0;
  }

  get tauxCloture(): number {
    return this.stats?.tauxCloture ?? 0;
  }

  get tauxEfficacite(): number {
    return this.stats?.tauxEfficacite ?? 0;
  }

  get conformiteStyleNeutre(): boolean {
    return (
      !!this.stats &&
      this.totalActions > 0 &&
      this.actionsCloturees === 0 &&
      this.tauxCloture === 0
    );
  }

  get conformitePourcentageAffiche(): string {
    if (!this.stats) return '—';
    if (this.totalActions === 0) return '—';
    return `${this.tauxCloture} %`;
  }

  /** Légende sous le KPI « conformité » (taux de clôture). */
  get legendeTauxConformite(): string {
    if (!this.stats) return '';
    if (this.totalActions === 0) {
      return 'Aucune action enregistrée — le taux s’affichera lorsque des actions existeront.';
    }
    if (this.actionsCloturees === 0) {
      return 'Aucune action clôturée pour le moment — 0 % est normal tant qu’aucune action n’est terminée.';
    }
    if (this.actionsCloturees > 0 && this.tauxEfficacite === 0) {
      return 'Les actions clôturées ne sont pas encore jugées efficaces (ou aucune n’a été évaluée).';
    }
    return `${this.actionsCloturees} action(s) clôturée(s) sur ${this.totalActions}.`;
  }

  get afficherBandeauOnboarding(): boolean {
    return !this.chargement && this.totalPlans === 0 && this.totalActions === 0;
  }

  actionDetailLink(id: number): string {
    return `/actions/${id}`;
  }

  estEcheanceDepassee(deadline: string | Date): boolean {
    return new Date(deadline).getTime() < Date.now();
  }

  private chargerActionsUrgentes(): void {
    const role = this.lireRoleUtilisateur();
    if (!role) {
      this.actionsUrgentes = [];
      this.chargementActionsUrgentes = false;
      return;
    }
    this.chargementActionsUrgentes = true;
    const fin48h = Date.now() + 48 * 60 * 60 * 1000;
    const terminees = new Set(['Clôturé', 'Clôturée', 'Annulé', 'Annulée', 'Closed']);
    const estOuverte = (s: string) => !terminees.has((s || '').trim());
    const estUrgente = (deadline: string) => {
      const t = new Date(deadline).getTime();
      return !Number.isNaN(t) && t <= fin48h;
    };

    const traiterListe = (items: ActionUrgenteVm[]) => {
      this.actionsUrgentes = items
        .filter(a => estOuverte(a.status) && estUrgente(a.deadline))
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 5);
      this.chargementActionsUrgentes = false;
    };

    if (role === 'RESPONSABLE') {
      this.http.get<any[]>(API.actions.getMes).subscribe({
        next: (rows) => {
          const items = (rows || []).map(a => ({
            id: a.id,
            actionPlanId: a.actionPlanId ?? a.ActionPlanId,
            actionDescription: a.actionDescription ?? a.ActionDescription ?? '—',
            deadline: a.deadline ?? a.Deadline,
            status: a.status ?? a.Status ?? '',
            planTitle: undefined as string | undefined
          }));
          traiterListe(items);
        },
        error: () => {
          this.actionsUrgentes = [];
          this.chargementActionsUrgentes = false;
        }
      });
      return;
    }

    const plansUrl =
      role === 'MANAGER' ? API.plans.getMes : API.plans.getAll;
    this.http.get<any[]>(plansUrl).subscribe({
      next: (plans) => {
        const items: ActionUrgenteVm[] = [];
        for (const p of plans || []) {
          const title = p.title ?? p.Title ?? '';
          const pid = p.id ?? p.Id;
          for (const a of p.actions || p.Actions || []) {
            items.push({
              id: a.id ?? a.Id,
              actionPlanId: a.actionPlanId ?? a.ActionPlanId ?? pid,
              actionDescription: a.actionDescription ?? a.ActionDescription ?? '—',
              deadline: a.deadline ?? a.Deadline,
              status: a.status ?? a.Status ?? '',
              planTitle: title
            });
          }
        }
        traiterListe(items);
      },
      error: () => {
        this.actionsUrgentes = [];
        this.chargementActionsUrgentes = false;
      }
    });
  }



  private lireRoleUtilisateur(): string {
    if (this.userRole) return this.userRole;
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return '';
      const u = JSON.parse(raw);
      return String(u?.role ?? '').toUpperCase();
    } catch {
      return '';
    }
  }
}
