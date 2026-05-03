import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateService } from '../../../core/services/template.service';
import { TemplateResponseDTO, TemplateCategory } from '../../../shared/models/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-template-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="template-selector">
      <div class="search-box">
        <input type="text" placeholder="Search templates..." [(ngModel)]="searchQuery" (input)="filterTemplates()">
      </div>
      
      <div class="categories">
        <button 
          *ngFor="let cat of categories" 
          (click)="selectCategory(cat)"
          [class.active]="selectedCategory === cat"
          class="cat-chip"
        >
          {{ formatCategory(cat) }}
        </button>
      </div>

      <div class="templates-grid">
        <div 
          *ngFor="let t of filteredTemplates" 
          class="template-item" 
          [class.active]="selectedTemplateId === t.templateId"
          (click)="onSelect(t)"
        >
          <div class="template-thumb">
            <img [src]="t.thumbnailUrl" [alt]="t.name">
            <div class="overlay">
              <span>Use Template</span>
            </div>
          </div>
          <div class="template-info">
            <span class="name">{{ t.name }}</span>
            <span class="tier" [class.premium]="t.tier === 'PREMIUM'">{{ t.tier }}</span>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">Loading templates...</div>
    </div>
  `,
  styles: [`
    .template-selector { display: flex; flex-direction: column; gap: 12px; height: 100%; }
    .search-box input {
      width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: #fff; padding: 10px; font-size: 0.8rem; outline: none;
    }
    .categories { display: flex; flex-wrap: wrap; gap: 6px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .cat-chip {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; color: rgba(255,255,255,0.6); font-size: 0.65rem; padding: 4px 10px;
      cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .cat-chip.active { background: #00d4b4; border-color: #00d4b4; color: #000; font-weight: 700; }
    
    .templates-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; overflow-y: auto; flex: 1; padding-right: 4px; }
    .template-item { cursor: pointer; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.03); border: 2px solid transparent; transition: all 0.2s; }
    .template-item:hover { transform: translateY(-2px); }
    .template-item.active { border-color: #00d4b4; }
    
    .template-thumb { position: relative; aspect-ratio: 1/1.4; background: #fff; }
    .template-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .overlay { position: absolute; inset: 0; background: rgba(0,212,180,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
    .template-item:hover .overlay { opacity: 1; }
    .overlay span { color: #000; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; }
    
    .template-info { padding: 8px; display: flex; flex-direction: column; gap: 2px; }
    .name { font-size: 0.7rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tier { font-size: 0.6rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; }
    .tier.premium { color: #fbbf24; }
    
    .loading { text-align: center; font-size: 0.8rem; color: #64748b; margin-top: 20px; }
    
    /* Scrollbar */
    .templates-grid::-webkit-scrollbar { width: 4px; }
    .templates-grid::-webkit-scrollbar-track { background: transparent; }
    .templates-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  `]
})
export class TemplateSelectorComponent implements OnInit {
  @Input() selectedTemplateId: number | null = null;
  @Output() templateSelected = new EventEmitter<TemplateResponseDTO>();

  private templateSvc = inject(TemplateService);

  templates: TemplateResponseDTO[] = [];
  filteredTemplates: TemplateResponseDTO[] = [];
  categories: (TemplateCategory | 'ALL')[] = ['ALL', 'PROFESSIONAL', 'CREATIVE', 'MODERN', 'MINIMALIST', 'ATS_OPTIMISED'];
  selectedCategory: TemplateCategory | 'ALL' = 'ALL';
  searchQuery = '';
  loading = true;

  ngOnInit(): void {
    this.templateSvc.getAllTemplates().subscribe({
      next: (data) => {
        this.templates = data;
        this.filterTemplates();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectCategory(cat: TemplateCategory | 'ALL'): void {
    this.selectedCategory = cat;
    this.filterTemplates();
  }

  filterTemplates(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredTemplates = this.templates.filter(t => {
      const catMatch = this.selectedCategory === 'ALL' || t.category === this.selectedCategory;
      const searchMatch = !q || t.name.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }

  onSelect(t: TemplateResponseDTO): void {
    this.templateSelected.emit(t);
  }

  formatCategory(cat: string): string {
    if (cat === 'ALL') return 'All';
    return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}
