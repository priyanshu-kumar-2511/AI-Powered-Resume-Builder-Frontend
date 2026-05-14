import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminTemplate, TemplateCreateRequest } from '../services/admin-api.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { TemplateRenderService } from '../../../shared/services/template-render.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
              <div class="tpl-preview" (click)="openPreview(t)" title="Click to preview full size">
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
                <button class="tpl-btn tpl-btn-danger" (click)="deleteTemplate(t)" [disabled]="busy === t.templateId" title="Delete Template">
                  🗑️
                </button>
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

      <!-- Full Page Preview Modal -->
      @if (previewTarget && previewUrl) {
        <div class="preview-backdrop" (click)="closePreview()">
          <div class="preview-modal" (click)="$event.stopPropagation()">
            <div class="preview-header">
              <div class="header-info">
                <h2 class="preview-title">{{ previewTarget.name }}</h2>
                <span class="preview-tag">{{ previewTarget.category }} • {{ previewTarget.tier }}</span>
              </div>
              <div class="header-actions">
                <button class="preview-edit-btn" (click)="openEditFromPreview()">✏️ Edit Layout</button>
                <button class="preview-close-btn" (click)="closePreview()">✕</button>
              </div>
            </div>
            <div class="preview-frame-container">
              <iframe [src]="previewUrl" class="preview-iframe"></iframe>
            </div>
          </div>
        </div>
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
    .tpl-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }
    .tpl-btn-danger { flex: 0 0 40px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }

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

    /* Preview Modal */
    .tpl-preview { cursor: zoom-in; }
    .preview-backdrop { position: fixed; inset: 0; background: radial-gradient(circle at center, rgba(31,41,55,0.95) 0%, rgba(17,24,39,0.98) 100%); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    .preview-modal { width: 100%; max-width: 1200px; height: 98vh; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.7); animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    
    .preview-header { background: #1e293b; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
    .header-info { display: flex; flex-direction: column; gap: 4px; }
    .preview-title { font-size: 1.4rem; font-weight: 800; color: #fff; margin: 0; font-family: var(--font-display); letter-spacing: -0.02em; }
    .preview-tag { font-size: 0.8rem; color: var(--teal); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
    
    .header-actions { display: flex; gap: 16px; align-items: center; }
    .preview-edit-btn { background: var(--teal); color: #000; border: none; padding: 10px 24px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,212,180,0.3); }
    .preview-edit-btn:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,212,180,0.4); }
    .preview-close-btn { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.1); width: 44px; height: 44px; border-radius: 14px; font-size: 1.4rem; cursor: pointer; display: grid; place-items: center; transition: all 0.3s; }
    .preview-close-btn:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); transform: rotate(90deg); }
    
    .preview-frame-container { 
      flex: 1; 
      background: #0f172a; 
      background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 30px 30px;
      overflow: hidden; 
      padding: 20px; 
      display: flex; 
      justify-content: center; 
      align-items: center;
      /* Hide scrollbars for all browsers */
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .preview-frame-container::-webkit-scrollbar {
      display: none;
    }
    .preview-iframe { 
      /* Render at full A4 resolution for perfect layout */
      width: 210mm; 
      height: 297mm;
      /* Visual zoom to fit screen without affecting logical resolution */
      zoom: 0.65;
      border: none; 
      background: #fff; 
      box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05); 
      flex-shrink: 0;
      pointer-events: none;
      user-select: none;
      border-radius: 4px;
      transform-origin: top center;
    }

    /* Adjust zoom for different screen heights */
    @media (max-height: 900px) {
      .preview-iframe { zoom: 0.6; }
    }
    @media (max-height: 800px) {
      .preview-iframe { zoom: 0.55; }
    }
    @media (max-height: 700px) {
      .preview-iframe { zoom: 0.45; }
    }

    /* Responsive scaling for small screens */
    @media (max-width: 900px) {
      .preview-iframe { transform: scale(0.8); }
    }
    @media (max-width: 700px) {
      .preview-iframe { transform: scale(0.6); }
    }
  `]
})
export class AdminTemplatesComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private confirmService = inject(ConfirmService);
  private renderService = inject(TemplateRenderService);
  private sanitizer = inject(DomSanitizer);

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

  previewTarget: AdminTemplate | null = null;
  previewUrl: SafeResourceUrl | null = null;

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

  async deleteTemplate(t: AdminTemplate): Promise<void> {
    const confirmed = await this.confirmService.ask({
      title: 'Delete Template',
      message: `Are you sure you want to permanently delete "${t.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!confirmed) {
      return;
    }

    this.busy = t.templateId;
    this.adminApi.deleteTemplate(t.templateId).subscribe({
      next: () => {
        this.templates = this.templates.filter(tpl => tpl.templateId !== t.templateId);
        this.busy = null;
        this.showToast(`"${t.name}" deleted permanently`);
      },
      error: () => {
        this.busy = null;
        this.showToast('Failed to delete template', true);
      }
    });
  }

  openPreview(t: AdminTemplate): void {
    this.previewTarget = t;
    const demoData = {
      personalInfo: {
        fullName: 'Priyanshu Kumar',
        jobTitle: 'Senior Full Stack Developer',
        email: 'priyanshu@example.com',
        mobileNumber: '+91 9876543210',
        location: 'Patna, Bihar',
        linkedin: 'linkedin.com/in/priyanshu',
        github: 'github.com/priyanshu',
        website: 'priyanshu.dev'
      },
      summary: 'Passionate software engineer with 5+ years of experience in building scalable web applications. Expert in Angular, Node.js, and Cloud architectures.',
      sections: [
        {
          title: 'Experience',
          sectionType: 'EXPERIENCE',
          content: JSON.stringify({
            items: [
              {
                title: 'Senior Software Engineer',
                subtitle: 'Tech Innovators Inc.',
                startDate: 'Jan 2021',
                endDate: 'Present',
                isCurrent: true,
                bullets: [
                  'Led a team of 5 developers to build a high-performance analytics dashboard.',
                  'Optimized database queries reducing latency by 40%.',
                  'Implemented CI/CD pipelines increasing deployment frequency by 2x.'
                ]
              },
              {
                title: 'Full Stack Developer',
                subtitle: 'Creative Solutions',
                startDate: 'June 2018',
                endDate: 'Dec 2020',
                isCurrent: false,
                bullets: [
                  'Developed multiple client-facing websites using Angular and Firebase.',
                  'Integrated third-party APIs for payment processing and messaging.'
                ]
              }
            ]
          })
        },
        {
          title: 'Education',
          sectionType: 'EDUCATION',
          content: JSON.stringify({
            items: [
              {
                title: 'B.Tech in Computer Science',
                subtitle: 'National Institute of Technology',
                startDate: '2014',
                endDate: '2018',
                isCurrent: false,
                bullets: ['Graduated with 8.5 CGPA', 'Core Member of Coding Club']
              }
            ]
          })
        },
        {
          title: 'Skills',
          sectionType: 'SKILLS',
          content: JSON.stringify({
            items: [
              { title: 'Frontend', bullets: ['Angular', 'React', 'TypeScript', 'SCSS'] },
              { title: 'Backend', bullets: ['Node.js', 'Spring Boot', 'PostgreSQL', 'Redis'] },
              { title: 'Tools', bullets: ['Docker', 'AWS', 'Git', 'Jenkins'] }
            ]
          })
        }
      ]
    };

    let html = this.renderService.renderDocument(t as any, { useDemoData: true });
    if (!html) return;

    // Inject style to hide scrollbars inside the iframe for a cleaner look
    html = html.replace('</head>', '<style>body { overflow: hidden !important; }</style></head>');

    const blob = new Blob([html], { type: 'text/html' });
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
  }

  closePreview(): void {
    if (this.previewUrl) {
      // Clean up URL to avoid memory leaks
      const url = (this.previewUrl as any).changingThisBreaksApplicationSecurity;
      if (url) URL.revokeObjectURL(url);
    }
    this.previewTarget = null;
    this.previewUrl = null;
  }

  openEditFromPreview(): void {
    if (this.previewTarget) {
      const t = this.previewTarget;
      this.closePreview();
      this.openEdit(t);
    }
  }

  private blankForm(): TemplateCreateRequest {
    return { name: '', description: '', htmlLayout: '', cssStyles: '', category: 'PROFESSIONAL', tier: 'FREE', thumbnailUrl: '' };
  }

  private showToast(msg: string, err = false): void {
    this.toast = msg; this.toastErr = err;
    setTimeout(() => this.toast = '', 3000);
  }
}
