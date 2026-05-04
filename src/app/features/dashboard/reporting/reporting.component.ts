import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API } from '../../../core/services/api-endpoints';
import { environment } from '../../../../environments/environment';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

const MOIS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.scss'
})
export class ReportingComponent implements OnInit, AfterViewInit {
  @ViewChild('evolutionCanvas') evolutionCanvas!: ElementRef<HTMLCanvasElement>;

  statsDepartements: any[] = [];
  chargement = true;

  private evolutionChart?: Chart;
  private api = environment.apiUrl;
  private mensuelMap = new Map<string, { plans: number; actions: number }>();
  private currentYear = new Date().getFullYear();

  aiLoading = false;
  aiResult = '';

  private readonly fallbackRows = [
    { name: 'Production', totalPlans: 1, totalActions: 0, actionsCloturees: 0, tauxCloture: 0 },
    { name: 'Sans département', totalPlans: 3, totalActions: 1, actionsCloturees: 1, tauxCloture: 100 }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerStats();
  }

  ngAfterViewInit(): void {}

  chargerStats(): void {
    this.chargement = true;
    const y = this.currentYear;
    forkJoin({
      dept: this.http.get<any[]>(API.stats.byDepartement),
      monthly: this.http.get<any[]>(`${this.api}/stats/monthly/${y}`),
      plans: this.http.get<any[]>(API.plans.getAll)
    }).subscribe({
      next: ({ dept, monthly, plans }) => {
        this.statsDepartements = dept || [];
        this.chargement = false;
        this.buildMensuelMap(y, monthly || [], plans || []);
        setTimeout(() => this.creerGraphiqueEvolution(), 100);
      },
      error: () => {
        this.chargement = false;
        setTimeout(() => this.creerGraphiqueEvolution(), 100);
      }
    });
  }

  private buildMensuelMap(year: number, monthly: any[], plans: any[]): void {
    this.mensuelMap.clear();

    // 1. Initialiser avec les plans réels pour garantir la cohérence avec les KPI
    plans.forEach(p => {
      const dateStr = p.createdAt ?? p.dateCreation ?? p.CreatedAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const planYear = d.getFullYear();
      if (isNaN(planYear) || planYear !== year) return;
      
      const month = d.getMonth() + 1;
      const key = `${year}-${month}`;
      const existing = this.mensuelMap.get(key) || { plans: 0, actions: 0 };
      
      const actionCount = (p.actions || p.Actions || []).length;
      this.mensuelMap.set(key, {
        plans: existing.plans + 1,
        actions: existing.actions + actionCount
      });
    });

    // 2. Si on a des stats mensuelles plus précises pour les actions, on les utilise
    // (L'API monthly peut contenir des données historiques sur les actions clôturées)
    if (monthly.length > 0) {
      monthly.forEach((s, i) => {
        let month = s.month ?? s.Month ?? s.mois ?? s.Mois;
        if ((month == null || month === '') && monthly.length <= 12) month = i + 1;
        if (month == null) return;
        
        const key = `${year}-${month}`;
        const existing = this.mensuelMap.get(key) || { plans: 0, actions: 0 };
        
        // On garde les plans calculés à l'étape 1, mais on peut mettre à jour les actions
        // si les stats mensuelles rapportent plus d'activité (ex: actions créées/clôturées)
        const apiActions = s.totalActions ?? s.actions ?? s.actionsCloturees ?? 0;
        if (apiActions > existing.actions) {
          this.mensuelMap.set(key, {
            plans: existing.plans,
            actions: apiActions
          });
        }
      });
    }
  }

  private creerGraphiqueEvolution(): void {
    if (!this.evolutionCanvas?.nativeElement) return;

    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;

    // Afficher de janvier jusqu'au mois courant
    const labels: string[] = [];
    const plansData: number[] = [];
    const actionsData: number[] = [];

    for (let m = 1; m <= curM; m++) {
      const key = `${curY}-${m}`;
      const pt = this.mensuelMap.get(key) || { plans: 0, actions: 0 };
      labels.push(MOIS[m - 1]);
      plansData.push(pt.plans);
      actionsData.push(pt.actions);
    }

    this.evolutionChart?.destroy();
    this.evolutionChart = new Chart(this.evolutionCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Plans',
            data: plansData,
            borderColor: '#d5092f',
            backgroundColor: 'rgba(213,9,47,0.08)',
            borderWidth: 2.5,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#d5092f',
            pointBorderWidth: 2.5,
            pointHoverBackgroundColor: '#d5092f',
            tension: 0.4,
            fill: false
          },
          {
            label: 'Actions',
            data: actionsData,
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22,163,74,0.08)',
            borderWidth: 2.5,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#16a34a',
            pointBorderWidth: 2.5,
            pointHoverBackgroundColor: '#16a34a',
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#374151',
              font: { family: 'Inter, Segoe UI, sans-serif', size: 12, weight: 'bold' },
              boxWidth: 8,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#111827',
            bodyColor: '#374151',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            titleFont: { family: 'Inter, Segoe UI, sans-serif', size: 13, weight: 'bold' },
            bodyFont: { family: 'Inter, Segoe UI, sans-serif', size: 12 },
            callbacks: {
              title: (items) => items[0]?.label ?? '',
              label: (item) => {
                const color = item.datasetIndex === 0 ? '🔴' : '🟢';
                return `${color} ${item.dataset.label} : ${item.formattedValue}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8da0ba', font: { size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#eef2f6' },
            ticks: {
              color: '#8da0ba',
              font: { size: 12 },
              precision: 0
            }
          }
        }
      }
    });
  }

  exporterExcel(): void {
    this.http.get(API.stats.export.excel, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporting_APM_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error("Erreur lors de l'export Excel", err)
    });
  }

  get reportRows() {
    if (!this.statsDepartements.length) return this.fallbackRows;
    return this.statsDepartements.map((dept: any) => {
      const totalActions = dept.totalActions ?? 0;
      const actionsCloturees = dept.actionsCloturees ?? dept['actionsClôturées'] ?? 0;
      // Calculer le taux si absent ou 0 alors que des actions sont clôturées
      let taux = dept.tauxCloture ?? 0;
      if ((taux === 0 || taux == null) && totalActions > 0) {
        taux = Math.round((actionsCloturees / totalActions) * 100);
      } else if (totalActions === 0) {
        taux = 100; // 100% de conformité si aucune action
      }

      return {
        name: dept.departmentName ?? dept.departement ?? dept.name ?? 'Sans département',
        totalPlans: dept.totalPlans ?? 0,
        totalActions: totalActions,
        actionsCloturees: actionsCloturees,
        tauxCloture: taux
      };
    });
  }

  get reportTotals() {
    const rows = this.reportRows;
    const totalPlans = rows.reduce((sum, row) => sum + Number(row.totalPlans || 0), 0);
    const totalActions = rows.reduce((sum, row) => sum + Number(row.totalActions || 0), 0);
    const actionsCloturees = rows.reduce((sum, row) => sum + Number(row.actionsCloturees || 0), 0);
    const tauxGlobal = totalActions > 0 ? Math.round((actionsCloturees / totalActions) * 100) : 100;
    return { totalPlans, totalActions, actionsCloturees, tauxGlobal };
  }

  analyserIA(): void {
    if (this.aiLoading) return;
    this.aiLoading = true;
    this.aiResult = '';

    const totals = this.reportTotals;
    const prompt = `Analyse la performance Reporting APM : ${totals.totalPlans} plans, ${totals.totalActions} actions, ${totals.actionsCloturees} clôturées, taux global ${totals.tauxGlobal}%. Donne 3 points d'analyse et 2 conseils.`;

    this.http.post<any>(API.chat.message, { message: prompt }).subscribe({
      next: (res) => {
        this.aiResult = res?.response ?? res?.message ?? 'Analyse terminée.';
        this.aiLoading = false;
      },
      error: () => {
        this.aiResult = `📊 Synthèse Reporting :\n• Volume global de ${totals.totalPlans} plans pour ${totals.totalActions} actions.\n• Niveau de clôture à ${totals.tauxGlobal}%.\n• ${totals.totalActions - totals.actionsCloturees} actions restent à traiter.\n\n💡 Conseil : Focalisez-vous sur les départements ayant un taux < 70% pour améliorer la performance globale.`;
        this.aiLoading = false;
      }
    });
  }
}
