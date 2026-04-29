import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ai-bullets-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-bullets">
      <div class="ai-gen-header">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        AI Bullet Points
      </div>

      <textarea class="ai-textarea" placeholder="Describe responsibilities…" [(ngModel)]="responsibilities" rows="3"></textarea>

      <button class="ai-btn" (click)="generate()" [disabled]="loading || !responsibilities">
        @if (loading) { <span class="ai-spinner"></span> Generating… }
        @else { ✦ Generate Bullets }
      </button>

      @if (error) { <p class="ai-error">{{ error }}</p> }

      @if (bullets.length) {
        <div class="bullets-list">
          @for (bullet of bullets; track $index) {
            <div class="bullet-row" [class.accepted]="acceptedIndexes.has($index)" [class.rejected]="rejectedIndexes.has($index)">
              <p class="bullet-text">• {{ bullet }}</p>
              @if (!acceptedIndexes.has($index) && !rejectedIndexes.has($index)) {
                <div class="bullet-actions">
                  <button class="b-accept" (click)="acceptBullet($index)">✓ Add</button>
                  <button class="b-reject" (click)="rejectedIndexes.add($index)">✕</button>
                </div>
              } @else if (acceptedIndexes.has($index)) {
                <span class="b-added">Added ✓</span>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ai-bullets { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; }
    .ai-textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: rgba(255,255,255,0.85); font-size: 0.8rem; padding: 8px 10px; font-family: inherit; outline: none; resize: vertical; transition: border-color 0.2s; }
    .ai-textarea:focus { border-color: rgba(0,212,180,0.4); }
    .ai-textarea::placeholder { color: rgba(255,255,255,0.3); }
    .ai-btn { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, rgba(0,212,180,0.15), rgba(0,212,180,0.08)); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.78rem; font-weight: 600; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .ai-btn:hover:not(:disabled) { background: rgba(0,212,180,0.2); }
    .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ai-error { font-size: 0.75rem; color: #ef4444; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); padding: 8px 10px; border-radius: 7px; }
    .bullets-list { display: flex; flex-direction: column; gap: 6px; }
    .bullet-row { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; transition: border-color 0.2s; }
    .bullet-row.accepted { border-color: rgba(0,212,180,0.25); background: rgba(0,212,180,0.04); }
    .bullet-row.rejected { opacity: 0.3; }
    .bullet-text { font-size: 0.78rem; color: rgba(255,255,255,0.75); line-height: 1.5; margin: 0; }
    .bullet-actions { display: flex; gap: 6px; }
    .b-accept { flex: 1; background: rgba(0,212,180,0.12); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.72rem; font-weight: 600; padding: 5px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .b-reject { background: transparent; border: 1px solid rgba(239,68,68,0.2); color: rgba(239,68,68,0.6); font-size: 0.72rem; padding: 5px 9px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .b-added { font-size: 0.7rem; color: #00d4b4; font-weight: 600; }
  `]
})
export class AiBulletsGeneratorComponent {
  @Input() resumeId!: number;
  @Input() role = '';
  @Output() bulletAccepted = new EventEmitter<string>();

  private aiApi = inject(AiApiService);
  private auth  = inject(AuthService);

  responsibilities = '';
  bullets: string[] = [];
  acceptedIndexes   = new Set<number>();
  rejectedIndexes   = new Set<number>();
  loading = false;
  error   = '';

  generate(): void {
    if (!this.responsibilities.trim()) return;
    this.loading = true;
    this.error   = '';
    this.bullets = [];
    this.acceptedIndexes.clear();
    this.rejectedIndexes.clear();

    const userId = String(this.auth.getCurrentUserId() ?? '');
    this.aiApi.generateBullets({
      userId,
      resumeId: this.resumeId,
      targetJobTitle: this.role,
      existingContent: this.responsibilities
    }).subscribe({
      next: res => {
        const raw = res.content ?? '';
        // Parse bullet lines from AI response
        this.bullets = raw.split('\n')
          .map(l => l.replace(/^[-•*\d.]+\s*/, '').trim())
          .filter(l => l.length > 10);
        this.loading = false;
      },
      error: err => {
        this.error   = err?.error?.message ?? 'Failed to generate bullets.';
        this.loading = false;
      }
    });
  }

  acceptBullet(index: number): void {
    this.acceptedIndexes.add(index);
    this.bulletAccepted.emit(this.bullets[index]);
  }
}
