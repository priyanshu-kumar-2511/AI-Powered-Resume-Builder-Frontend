import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Template, TemplateResponseDTO, TemplateCategory } from '../../shared/models/models';
import { TEMPLATE_API } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private http = inject(HttpClient);

  getAllTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(TEMPLATE_API);
  }

  getFreeTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${TEMPLATE_API}/free`);
  }

  getPremiumTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${TEMPLATE_API}/premium`);
  }

  getPopularTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${TEMPLATE_API}/popular`);
  }

  getTemplatesByCategory(category: TemplateCategory): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${TEMPLATE_API}/category/${category}`);
  }

  getTemplateById(id: number): Observable<Template> {
    return this.http.get<Template>(`${TEMPLATE_API}/${id}`);
  }

  incrementUsage(id: number): Observable<void> {
    return this.http.put<void>(`${TEMPLATE_API}/${id}/increment-usage`, {});
  }
}
