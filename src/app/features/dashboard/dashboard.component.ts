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

  stats: any = null;
  statsMensuelles: any[] = [];
  chargement = true;
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerStats();
  }

  ngAfterViewInit(): void {}

  chargerStats(): void {
    // Statistiques globales
    this.http.get(`${this.api}/stats/global`).subscribe({
      next: (data) => {
        this.stats = data;
        this.chargement = false;
        setTimeout(() => this.creerGraphiques(), 100);
      },
      error: () => { this.chargement = false; }
    });

    // Statistiques mensuelles
    const annee = new Date().getFullYear();
    this.http.get<any[]>(`${this.api}/stats/monthly/${annee}`).subscribe({
      next: (data) => { this.statsMensuelles = data; }
    });
  }

  creerGraphiques(): void {
    if (!this.stats) return;

    // Camembert : Actions en cours / Clôturées / En retard
    if (this.camembertCanvas) {
      new Chart(this.camembertCanvas.nativeElement, {
        type: 'pie',
        data: {
          labels: ['Actions en cours', 'Actions clôturées', 'Actions en retard'],
          datasets: [{
            data: [
              this.stats.actionsEnCours,
              this.stats.actionsCloturees,
              this.stats.actionsEnRetard
            ],
            backgroundColor: ['#3b82f6', '#22c55e', '#ef4444'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            title: {
              display: true,
              text: 'Répartition des Plans d\'Actions TIS Circuits 2024'
            }
          }
        }
      });
    }

    // Histogramme mensuel : Actions clôturées / En retard par mois
    if (this.histogrammeCanvas && this.statsMensuelles.length > 0) {
      const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      
      new Chart(this.histogrammeCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: mois,
          datasets: [
            {
              label: 'Actions clôturées',
              data: this.statsMensuelles.map(s => s.actionsCloturees || 0),
              backgroundColor: '#22c55e'
            },
            {
              label: 'Actions en retard',
              data: this.statsMensuelles.map(s => s.actionsEnRetard || 0),
              backgroundColor: '#ef4444'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Représentation des Plans d\'Action TIS Circuits par Mois'
            }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }
}
