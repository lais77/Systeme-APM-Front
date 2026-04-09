import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('camembertCanvas') camembertCanvas!: ElementRef;
  @ViewChild('histogrammeCanvas') histogrammeCanvas!: ElementRef;

  // ── Données existantes ───────────────────────────────────────
  stats: any = null;
  statsMensuelles: any[] = [];
  chargement = true;
  private api = environment.apiUrl;
  private camembertChart?: Chart;
  private histogrammeChart?: Chart;

  // ── Propriétés ajoutées pour le nouveau template HTML ────────
  today: Date = new Date();

  // Alias pour compatibilité template (isLoading → chargement)
  get isLoading(): boolean {
    return this.chargement;
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerStats();
  }

  ngAfterViewInit(): void {}

  // ── Chargement HTTP (logique existante inchangée) ─────────────
  chargerStats(): void {
    this.http.get(`${this.api}/stats/global`).subscribe({
      next: (data) => {
        this.stats = data;
        this.chargement = false;
        setTimeout(() => this.creerGraphiques(), 100);
      },
      error: () => {
        this.chargement = false;
      }
    });

    const annee = new Date().getFullYear();
    this.http.get<any[]>(`${this.api}/stats/monthly/${annee}`).subscribe({
      next: (data) => {
        this.statsMensuelles = data;
        // Re-dessiner l'histogramme si les stats globales sont déjà chargées
        if (!this.chargement) {
          setTimeout(() => this.creerHistogramme(), 100);
        }
      }
    });
  }

  // ── Création des deux graphiques ──────────────────────────────
  creerGraphiques(): void {
    this.creerCamembert();
    this.creerHistogramme();
  }

  private creerCamembert(): void {
    if (!this.camembertCanvas || !this.stats) return;

    this.camembertChart?.destroy();
    this.camembertChart = new Chart(this.camembertCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Action Clôturée', 'Action en cours', 'Action en retard'],
        datasets: [{
          data: [
            this.stats.actionsCloturees ?? this.stats.cloturees ?? 0,
            this.stats.actionsEnCours   ?? this.stats.enCours   ?? 0,
            this.stats.actionsEnRetard  ?? this.stats.enRetard  ?? 0
          ],
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
              font: { family: 'Segoe UI', size: 11, weight: 600 }
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

  private creerHistogramme(): void {
    if (!this.histogrammeCanvas) return;

    const mois = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    const cloturees = this.statsMensuelles.length > 0
      ? this.statsMensuelles.map(s => s.actionsCloturees ?? 0)
      : new Array(12).fill(0);

    const enRetard = this.statsMensuelles.length > 0
      ? this.statsMensuelles.map(s => s.actionsEnRetard ?? 0)
      : new Array(12).fill(0);

    const enCours = this.statsMensuelles.length > 0
      ? this.statsMensuelles.map(s => s.actionsEnCours ?? 0)
      : new Array(12).fill(0);

    this.histogrammeChart?.destroy();
    this.histogrammeChart = new Chart(this.histogrammeCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: mois,
        datasets: [
          {
            label: 'Action en retard',
            data: enRetard,
            backgroundColor: '#46a3c7',
            borderRadius: 2,
            borderSkipped: false,
            barPercentage: 0.5,
            categoryPercentage: 0.72
          },
          {
            label: 'Action clôturée',
            data: cloturees,
            backgroundColor: '#00c800',
            borderRadius: 2,
            borderSkipped: false,
            barPercentage: 0.5,
            categoryPercentage: 0.72
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
              font: { family: 'Segoe UI', size: 11, weight: 600 }
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
            max: 10,
            grid: { color: '#e5e7eb' },
            ticks: { color: '#6b7280', font: { size: 11 }, stepSize: 2.5 }
          }
        }
      }
    });
  }

  // ── Helpers template : compatibilité noms de champs API ───────
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
}
