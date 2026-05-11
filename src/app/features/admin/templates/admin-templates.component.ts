import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminTemplate, TemplateCreateRequest } from '../services/admin-api.service';

@Component({
  selector: 'app-admin-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div>
          <h1 class="page-title">Template Management</h1>
          <p class="page-sub">{{ templates.length }} templates total</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ New Template</button>
      </div>

      <!-- Template grid -->
      @if (loading) {
        <div class="tpl-grid">
          @for (i of [1,2,3,4,5,6]; track i) { <div class="tpl-skeleton"></div> }
        </div>
      }

      @if (!loading) {
        <div class="tpl-grid">
          @for (t of templates; track t.templateId) {
            <div class="tpl-card" [class.inactive]="!t.isActive">
              <!-- Preview -->
              <div class="tpl-preview">
                @if (t.thumbnailUrl) {
                  <img [src]="t.thumbnailUrl" [alt]="t.name" class="tpl-thumb">
                } @else {
                  <div class="tpl-no-thumb">🎨</div>
                }
                <div class="tpl-badges">
                  <span class="badge" [class.badge-premium]="t.tier === 'PREMIUM'" [class.badge-free]="t.tier === 'FREE'">
                    {{ t.tier }}
                  </span>
                  @if (!t.isActive) {
                    <span class="badge badge-inactive">Inactive</span>
                  }
                </div>
              </div>

              <div class="tpl-body">
                <div class="tpl-name">{{ t.name }}</div>
                <div class="tpl-cat">{{ t.category }}</div>
                <div class="tpl-uses">{{ t.usageCount }} uses</div>
              </div>

              <div class="tpl-actions">
                <button class="tpl-btn" (click)="openEdit(t)">✏️ Edit</button>
                @if (t.isActive) {
                  <button class="tpl-btn tpl-btn-warn" (click)="deactivate(t)" [disabled]="busy === t.templateId">
                    Deactivate
                  </button>
                } @else {
                  <button class="tpl-btn tpl-btn-ok" (click)="activate(t)" [disabled]="busy === t.templateId">
                    Activate
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Create / Edit Modal -->
      @if (showForm) {
        <div class="modal-backdrop" (click)="closeForm()">
          <div class="tpl-modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h2 class="modal-title">{{ editTarget ? 'Edit Template' : 'Create Template' }}</h2>
              <button class="modal-close" (click)="closeForm()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-row">
                <label class="form-label">Template Name *</label>
                <input class="form-input" [(ngModel)]="form.name" placeholder="e.g. Executive Navy">
              </div>
              <div class="form-row">
                <label class="form-label">Description</label>
                <input class="form-input" [(ngModel)]="form.description" placeholder="Short description">
              </div>
              <div class="form-row two-col">
                <div>
                  <label class="form-label">Category *</label>
                  <select class="form-select" [(ngModel)]="form.category">
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="CREATIVE">Creative</option>
                    <option value="MODERN">Modern</option>
                    <option value="MINIMALIST">Minimalist</option>
                    <option value="ATS_OPTIMISED">ATS Optimised</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Tier *</label>
                  <select class="form-select" [(ngModel)]="form.tier">
                    <option value="FREE">Free</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>
              </div>
              <!-- AI Auto-extraction -->
              <div class="form-row">
                <label class="form-label">Auto-Extract via AI (Optional)</label>
                <div class="ai-upload-box" [class.extracting]="aiExtracting">
                  @if (aiExtracting) {
                    <div class="ai-loader">🤖 AI is scanning PDF and writing HTML...</div>
                  } @else {
                    <input type="file" accept="application/pdf" (change)="onPdfUpload($event)" id="pdf-upload" class="hidden-input">
                    <label for="pdf-upload" class="upload-label">
                      <span>📄 Upload PDF Resume to Auto-Fill Template</span>
                    </label>
                  }
                </div>
              </div>

              <div class="form-row">
                <label class="form-label">Thumbnail URL</label>
                <input class="form-input" [(ngModel)]="form.thumbnailUrl" placeholder="https://…">
              </div>
              <div class="form-row">
                <label class="form-label">HTML Layout *</label>
                <textarea class="form-textarea" [(ngModel)]="form.htmlLayout"
                          placeholder="Full HTML template with Mustache placeholders…" rows="8"></textarea>
              </div>
              <div class="form-row">
                <label class="form-label">CSS Styles *</label>
                <textarea class="form-textarea" [(ngModel)]="form.cssStyles"
                          placeholder="body { … }" rows="6"></textarea>
              </div>

              @if (formError) { <div class="form-error">{{ formError }}</div> }
            </div>

            <div class="modal-foot">
              <button class="btn-cancel" (click)="closeForm()">Cancel</button>
              <button class="btn-primary" (click)="saveForm()" [disabled]="saving">
                @if (saving) { <div class="btn-spinner"></div> }
                {{ editTarget ? 'Save Changes' : 'Create Template' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (toast) {
        <div class="toast" [class.toast-err]="toastErr">{{ toast }}</div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { padding: 32px 36px; max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0 0 4px; font-family: var(--font-display); }
    .page-sub { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }

    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; background: var(--teal); color: #000; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { background: var(--teal-dim); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,212,180,0.2); }
    .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

    .tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
    .tpl-skeleton { height: 280px; border-radius: 12px; background: linear-gradient(90deg,var(--bg-card) 25%,var(--bg-card-hover) 50%,var(--bg-card) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .tpl-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: all 0.2s; }
    .tpl-card:hover { border-color: var(--border-teal); transform: translateY(-2px); box-shadow: var(--shadow-card); }
    .tpl-card.inactive { border-color: rgba(239,68,68,0.25); }
    .tpl-card.inactive .tpl-thumb { filter: none; opacity: 1; }

    .tpl-preview { height: 180px; background: #ffffff; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid var(--border); }
    .tpl-thumb { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
    .tpl-card:hover .tpl-thumb { transform: scale(1.05); }
    .tpl-no-thumb { font-size: 2rem; color: #333; }
    .tpl-badges { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 6px; z-index: 10; }
    .badge { font-size: 0.65rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .badge-free { background: var(--teal); color: #000; }
    .badge-premium { background: var(--gold); color: #000; }
    .badge-inactive { background: #ef4444; color: #fff; box-shadow: 0 2px 8px rgba(239,68,68,0.4); }

    .tpl-body { padding: 14px 16px; flex: 1; }
    .tpl-name { font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 4px; font-family: var(--font-display); }
    .tpl-cat { font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
    .tpl-uses { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 5px; }
    .tpl-uses::before { content: '📊'; font-size: 0.8rem; }

    .tpl-actions { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); background: rgba(255,255,255,0.01); }
    .tpl-btn { flex: 1; padding: 8px; border-radius: 7px; font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: inherit; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary); transition: all 0.2s; }
    .tpl-btn:hover:not(:disabled) { background: var(--bg-card-hover); color: #fff; border-color: var(--text-muted); }
    .tpl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .tpl-btn-warn:hover:not(:disabled) { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #f87171; }
    .tpl-btn-ok:hover:not(:disabled) { background: var(--teal-subtle); border-color: var(--teal); color: var(--teal); }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .tpl-modal { width: 100%; max-width: 650px; max-height: 90vh; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; display: flex; flex-direction: column; box-shadow: 0 24px 48px rgba(0,0,0,0.5); }
    .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); }
    .modal-title { font-size: 1.2rem; font-weight: 700; color: #fff; font-family: var(--font-display); }
    .modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; transition: color 0.2s; }
    .modal-close:hover { color: #fff; }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .modal-foot { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end; }

    .form-row { display: flex; flex-direction: column; gap: 8px; }
    .two-col { flex-direction: row; gap: 16px; }
    .two-col > div { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .form-label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-input, .form-select, .form-textarea { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; color: #fff; font-size: 0.9rem; padding: 10px 14px; font-family: inherit; outline: none; transition: border-color 0.2s; }
    .form-textarea { resize: vertical; font-family: 'Fira Code', 'Courier New', monospace; font-size: 0.85rem; }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-subtle); }

    .btn-cancel { padding: 10px 20px; border-radius: 8px; background: transparent; border: 1px solid var(--border); color: var(--text-secondary); cursor: pointer; font-family: inherit; font-size: 0.85rem; transition: all 0.2s; }
    .btn-cancel:hover { background: rgba(255,255,255,0.05); color: #fff; }

    .toast { position: fixed; bottom: 24px; right: 24px; background: var(--bg-surface); border: 1px solid var(--teal); color: var(--teal); padding: 12px 24px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; z-index: 2000; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .toast.toast-err { border-color: #ef4444; color: #f87171; }

    .ai-upload-box { background: rgba(0,212,180,0.05); border: 1px dashed rgba(0,212,180,0.4); border-radius: 8px; padding: 16px; text-align: center; transition: all 0.2s; }
    .ai-upload-box:hover:not(.extracting) { background: rgba(0,212,180,0.1); border-color: var(--teal); }
    .hidden-input { display: none; }
    .upload-label { cursor: pointer; color: var(--teal); font-size: 0.85rem; font-weight: 600; display: block; width: 100%; }
    .ai-loader { color: var(--gold); font-size: 0.85rem; font-weight: 600; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
  `]
})
export class AdminTemplatesComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  templates:   AdminTemplate[] = [];
  loading      = true;
  busy:        number | null = null;
  showForm     = false;
  saving       = false;
  formError    = '';
  editTarget:  AdminTemplate | null = null;
  toast        = '';
  toastErr     = false;
  aiExtracting = false;

  form: TemplateCreateRequest & { thumbnailUrl?: string } = this.blankForm();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminApi.getAllTemplates().subscribe({
      next:  t  => { this.templates = t; this.loading = false; },
      error: () => this.loading = false
    });
  }

  openCreate(): void { this.editTarget = null; this.form = this.blankForm(); this.formError = ''; this.showForm = true; }
  openEdit(t: AdminTemplate): void {
    this.editTarget = t;
    this.form = { name: t.name, description: t.description, htmlLayout: t.htmlLayout, cssStyles: t.cssStyles, category: t.category, tier: t.tier, thumbnailUrl: t.thumbnailUrl };
    this.formError = '';
    this.showForm = true;
  }
  closeForm(): void { this.showForm = false; this.aiExtracting = false; }

  onPdfUpload(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      this.formError = 'Please upload a valid PDF file.';
      return;
    }

    this.aiExtracting = true;
    this.formError = '';
    this.adminApi.extractTemplateFromPdf(file).subscribe({
      next: (res) => {
        this.form.thumbnailUrl = res.thumbnailUrl;
        this.form.htmlLayout = res.htmlLayout;
        
        if (res.cssStyles && res.cssStyles.trim().length > 0) {
          this.form.cssStyles = res.cssStyles;
        } else if (!this.form.cssStyles) {
          this.form.cssStyles = "body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }";
        }
        
        this.aiExtracting = false;
        this.showToast('AI template extraction complete!');
      },
      error: () => {
        this.aiExtracting = false;
        this.formError = 'Failed to extract template from PDF. Please check the AI service logs.';
      }
    });
  }

  saveForm(): void {
    if (!this.form.name || !this.form.htmlLayout || !this.form.cssStyles) {
      this.formError = 'Name, HTML Layout and CSS Styles are required.'; return;
    }
    this.saving = true; this.formError = '';
    const req$ = this.editTarget
      ? this.adminApi.updateTemplate(this.editTarget.templateId, this.form)
      : this.adminApi.createTemplate(this.form);

    req$.subscribe({
      next: (saved) => {
        this.saving = false; this.showForm = false;
        if (this.editTarget) {
          const idx = this.templates.findIndex(t => t.templateId === this.editTarget!.templateId);
          if (idx > -1) this.templates[idx] = saved;
        } else {
          this.templates.unshift(saved);
        }
        this.showToast(this.editTarget ? 'Template updated' : 'Template created');
      },
      error: () => { this.saving = false; this.formError = 'Save failed. Please try again.'; }
    });
  }

  deactivate(t: AdminTemplate): void {
    this.busy = t.templateId;
    this.adminApi.deactivateTemplate(t.templateId).subscribe({
      next:  () => { t.isActive = false; this.busy = null; this.showToast(`"${t.name}" deactivated`); },
      error: () => { this.busy = null; this.showToast('Failed', true); }
    });
  }

  activate(t: AdminTemplate): void {
    this.busy = t.templateId;
    // Explicitly set isActive to true for the update
    const updatePayload = { ...t, isActive: true };
    this.adminApi.updateTemplate(t.templateId, updatePayload as any).subscribe({
      next:  () => { t.isActive = true; this.busy = null; this.showToast(`"${t.name}" activated`); },
      error: () => { this.busy = null; this.showToast('Activation failed', true); }
    });
  }

  private blankForm(): TemplateCreateRequest {
    return { name: '', description: '', htmlLayout: '', cssStyles: '', category: 'PROFESSIONAL', tier: 'FREE', thumbnailUrl: '' };
  }

  private showToast(msg: string, err = false): void {
    this.toast = msg; this.toastErr = err;
    setTimeout(() => this.toast = '', 3000);
  }
}
