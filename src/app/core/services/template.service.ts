import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Template, TemplateResponseDTO, TemplateCategory } from '../../shared/models/models';
import { TEMPLATE_API } from '../config/api.config';

/**
 * Service for managing resume templates.
 * Provides methods for fetching templates by tier, category, and popularity.
 */
@Injectable({ providedIn: 'root' })
export class TemplateService {
  private http = inject(HttpClient);

  /**
   * Fetches all active templates from the backend.
   * @returns Observable of TemplateResponseDTO array
   */
  getAllTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(TEMPLATE_API);
  }

  /**
   * Fetches only the FREE tier templates.
   * @returns Observable of TemplateResponseDTO array
   */
  getFreeTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${TEMPLATE_API}/free`);
  }

  /**
   * Fetches only the PREMIUM tier templates.
   * @returns Observable of TemplateResponseDTO array
   */
  getPremiumTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${TEMPLATE_API}/premium`);
  }

  /**
   * Fetches popular templates sorted by their usage count.
   * @returns Observable of TemplateResponseDTO array
   */
  getPopularTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${TEMPLATE_API}/popular`);
  }

  /**
   * Fetches templates filtered by a specific category.
   * @param category The TemplateCategory to filter by.
   * @returns Observable of TemplateResponseDTO array
   */
  getTemplatesByCategory(category: TemplateCategory): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${TEMPLATE_API}/category/${category}`);
  }

  /**
   * Fetches the full template details including HTML/CSS layout.
   * @param id The ID of the template to fetch
   * @returns Observable of Template object
   */
  getTemplateById(id: number): Observable<Template> {
    return this.http.get<Template>(`${TEMPLATE_API}/${id}`);
  }

  /**
   * Increments the usage count of a template by 1.
   * Automatically triggered when a user selects "Use this template".
   * @param id The ID of the template.
   * @returns Observable completing the PUT request.
   */
  incrementUsage(id: number): Observable<void> {
    return this.http.put<void>(`${TEMPLATE_API}/${id}/increment-usage`, {});
  }
}
