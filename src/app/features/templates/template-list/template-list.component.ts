import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TemplateService } from '../../../core/services/template.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TemplateCategory, TemplateResponseDTO, TemplateTier } from '../../../shared/models/models';

type FilterTier = 'ALL' | TemplateTier;
type FilterCategory = 'ALL' | TemplateCategory;

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FormsModule],
  templateUrl: './template-list.component.html'
})
export class TemplateListComponent implements OnInit {
  private templateSvc = inject(TemplateService);

  auth = inject(AuthService);

  allTemplates: TemplateResponseDTO[] = [];
  filtered: TemplateResponseDTO[] = [];

  loading = true;
  error = '';

  activeTier: FilterTier = 'ALL';
  activeCategory: FilterCategory = 'ALL';
  searchQuery = '';

  categories: FilterCategory[] = ['ALL', 'PROFESSIONAL', 'CREATIVE', 'MODERN', 'MINIMALIST', 'ATS_OPTIMISED'];
  tiers: FilterTier[] = ['ALL', 'FREE', 'PREMIUM'];

  ngOnInit(): void {
    this.templateSvc.getAllTemplates().subscribe({
      next: (templates) => {
        this.allTemplates = templates;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load templates.';
        this.loading = false;
      }
    });
  }

  setTier(tier: FilterTier): void {
    this.activeTier = tier;
    this.applyFilters();
  }

  setCategory(category: FilterCategory): void {
    this.activeCategory = category;
    this.applyFilters();
  }

  applyFilters(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filtered = this.allTemplates.filter((template) => {
      const tierMatch = this.activeTier === 'ALL' || template.tier === this.activeTier;
      const categoryMatch = this.activeCategory === 'ALL' || template.category === this.activeCategory;
      const searchMatch = !query
        || template.name.toLowerCase().includes(query)
        || (template.description || '').toLowerCase().includes(query);
      return tierMatch && categoryMatch && searchMatch;
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
