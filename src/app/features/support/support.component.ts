import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateSupportTicketRequest, SupportTicket, TicketCategory, TicketPriority } from '../../core/models/models';
import { SupportService } from '../../core/services/support.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent implements OnInit {
  tickets: SupportTicket[] = [];
  loading = true;
  showModal = false;
  submitting = false;
  selectedFileName = '';

  form: CreateSupportTicketRequest = {
    category: 'TECHNICAL',
    priority: 'MEDIUM',
    message: '',
    pageUrl: window.location.href
  };

  constructor(private supportService: SupportService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.supportService.getMyTickets().subscribe({
      next: (data) => {
        this.tickets = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openModal(): void {
    this.form = {
      category: 'TECHNICAL',
      priority: 'MEDIUM',
      message: '',
      pageUrl: window.location.href
    };
    this.selectedFileName = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    this.selectedFileName = file ? file.name : '';
  }

  submit(): void {
    if (!this.form.message.trim()) return;
    this.submitting = true;
    const payload: CreateSupportTicketRequest = {
      ...this.form,
      fileName: this.selectedFileName || undefined,
      pageUrl: window.location.href
    };
    this.supportService.createTicket(payload).subscribe({
      next: (ticket) => {
        this.tickets = [ticket, ...this.tickets];
        this.submitting = false;
        this.showModal = false;
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  getStatusLabel(status: SupportTicket['status']): string {
    const labels: Record<SupportTicket['status'], string> = {
      OPEN: 'Ouvert',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Résolu'
    };
    return labels[status];
  }

  getCategoryLabel(category: TicketCategory): string {
    const labels: Record<TicketCategory, string> = {
      TECHNICAL: 'Problème technique',
      PROCESS: 'Question processus',
      ACCESS: "Demande d'accès"
    };
    return labels[category];
  }

  getPriorityLabel(priority: TicketPriority): string {
    const labels: Record<TicketPriority, string> = {
      LOW: 'Basse',
      MEDIUM: 'Moyenne',
      HIGH: 'Haute'
    };
    return labels[priority];
  }
}
