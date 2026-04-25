import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TemplateService } from '../../../core/services/template.service';
import { AuthService } from '../../../core/services/auth.service';
import { TemplateResponseDTO, TemplateCategory, TemplateTier } from '../../../shared/models/models';

type FilterTier     = 'ALL' | TemplateTier;
type FilterCategory = 'ALL' | TemplateCategory;

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FormsModule],
  templateUrl: './template-list.component.html'
})
export class TemplateListComponent implements OnInit {
  private templateSvc = inject(TemplateService);
  auth                = inject(AuthService);

  allTemplates: TemplateResponseDTO[] = [];
  filtered:     TemplateResponseDTO[] = [];

  loading = true;
  error   = '';

  activeTier:     FilterTier     = 'ALL';
  activeCategory: FilterCategory = 'ALL';
  searchQuery = '';

  categories: FilterCategory[] = ['ALL', 'PROFESSIONAL', 'CREATIVE', 'MODERN', 'MINIMALIST', 'ATS_OPTIMISED'];
  tiers:      FilterTier[]     = ['ALL', 'FREE', 'PREMIUM'];

  ngOnInit() {
    this.templateSvc.getAllTemplates().subscribe({
      next: (templates) => {
        this.allTemplates = templates;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load templates.'; this.loading = false; }
    });
  }

  setTier(tier: FilterTier) {
    this.activeTier = tier;
    this.applyFilters();
  }

  setCategory(cat: FilterCategory) {
    this.activeCategory = cat;
    this.applyFilters();
  }

  applyFilters() {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.allTemplates.filter(t => {
      const tierMatch = this.activeTier === 'ALL' || t.tier === this.activeTier;
      const catMatch  = this.activeCategory === 'ALL' || t.category === this.activeCategory;
      const searchMatch = !q || t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      return tierMatch && catMatch && searchMatch;
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  formatCategory(cat: string): string {
    return cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get freeCount()    { return this.allTemplates.filter(t => t.tier === 'FREE').length; }
  get premiumCount() { return this.allTemplates.filter(t => t.tier === 'PREMIUM').length; }
}
