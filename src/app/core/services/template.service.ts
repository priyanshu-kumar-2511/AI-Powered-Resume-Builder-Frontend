import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Template, TemplateResponseDTO, TemplateCategory } from '../../shared/models/models';

const API = 'http://localhost:8080/api/v1/templates';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private http = inject(HttpClient);

  getAllTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(API);
  }

  getFreeTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${API}/free`);
  }

  getPremiumTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${API}/premium`);
  }

  getPopularTemplates(): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${API}/popular`);
  }

  getTemplatesByCategory(category: TemplateCategory): Observable<TemplateResponseDTO[]> {
    return this.http.get<TemplateResponseDTO[]>(`${API}/category/${category}`);
  }

  getTemplateById(id: number): Observable<Template> {
    return this.http.get<Template>(`${API}/${id}`);
  }

  incrementUsage(id: number): Observable<void> {
    return this.http.put<void>(`${API}/${id}/increment-usage`, {});
  }
}
