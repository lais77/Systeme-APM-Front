import { Component, ViewChild, ElementRef, NgZone, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { API } from '../../core/services/api-endpoints';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
  /** Précalculé une seule fois — ne pas recréer dans le template à chaque CD. */
  assistantHtml?: SafeHtml;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements OnInit {

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLElement>;

  isOpen = false;
  isLoading = false;
  unreadCount = 0;
  userInput = '';

  messages: Message[] = [];

  suggestions = [
    'Résumer mes indicateurs',
    'Quels plans sont en retard ?',
    'Suggérer des actions prioritaires'
  ];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const welcome =
      'Bonjour ! Je suis votre assistant APM. Je peux vous aider à suivre vos plans d\'action, identifier les retards et résumer vos indicateurs.';
    this.messages = [
      {
        role: 'assistant',
        content: welcome,
        time: this.now(),
        assistantHtml: this.buildAssistantHtml(welcome)
      }
    ];
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      this.scheduleScrollToBottom();
    }
  }

  sendSuggestion(text: string): void {
    this.userInput = text;
    this.send();
  }

  send(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.messages = [...this.messages, { role: 'user', content: text, time: this.now() }];
    this.userInput = '';
    this.isLoading = true;
    this.scheduleScrollToBottom();

    this.http.post<{ reply: string }>(API.chat.message, { message: text }).subscribe({
      next: (res) => {
        const reply = res.reply ?? '';
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content: reply,
            time: this.now(),
            assistantHtml: this.buildAssistantHtml(reply)
          }
        ];
        this.isLoading = false;
        if (!this.isOpen) {
          this.unreadCount++;
        }
        this.scheduleScrollToBottom();
      },
      error: () => {
        const errText = 'Une erreur s\'est produite. Veuillez réessayer.';
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content: errText,
            time: this.now(),
            assistantHtml: this.buildAssistantHtml(errText)
          }
        ];
        this.isLoading = false;
        this.scheduleScrollToBottom();
      }
    });
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  /** **texte** → strong, sauts de ligne → br (une fois à la création du message). */
  private buildAssistantHtml(content: string): SafeHtml {
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Scroll hors du cycle synchrone de détection (évite boucles / gel).
   * runOutsideAngular évite de ré‑entrer dans la zone sur scrollTop.
   */
  private scheduleScrollToBottom(): void {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.scrollToBottom();
      });
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {
      /* ignore */
    }
  }

  private now(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
