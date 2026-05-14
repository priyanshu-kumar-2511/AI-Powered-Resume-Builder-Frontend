import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplateListComponent } from './template-list.component';
import { TemplateService } from '../../../core/services/template.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({ selector: 'app-navbar', standalone: true, template: '' })
class MockNavbarComponent {}

describe('TemplateListComponent', () => {
  let component: TemplateListComponent;
  let fixture: ComponentFixture<TemplateListComponent>;
  let mockTemplateSvc: any;
  let mockAuth: any;

  beforeEach(async () => {
    mockTemplateSvc = {
      getAllTemplates: jasmine.createSpy('getAllTemplates').and.returnValue(of([
        { templateId: 1, name: 'T1', category: 'PROFESSIONAL', tier: 'FREE' },
        { templateId: 2, name: 'T2', category: 'CREATIVE', tier: 'PREMIUM' }
      ]))
    };
    mockAuth = { isAdmin: () => false };

    await TestBed.configureTestingModule({
      imports: [TemplateListComponent, RouterTestingModule, HttpClientTestingModule, CommonModule, FormsModule],
      providers: [
        { provide: TemplateService, useValue: mockTemplateSvc },
        { provide: AuthService,    useValue: mockAuth }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(TemplateListComponent, {
      set: { imports: [CommonModule, FormsModule, MockNavbarComponent, RouterTestingModule], schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateListComponent);
    component = fixture.componentInstance;
  });

  it('should load templates on init', () => {
    fixture.detectChanges();
    expect(mockTemplateSvc.getAllTemplates).toHaveBeenCalled();
    expect(component.filtered.length).toBe(2);
  });

  it('should filter by category', () => {
    fixture.detectChanges();
    component.setCategory('PROFESSIONAL');
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].name).toBe('T1');
  });

  it('should filter by tier', () => {
    fixture.detectChanges();
    component.setTier('PREMIUM');
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].tier).toBe('PREMIUM');
  });

  it('should search templates', () => {
    fixture.detectChanges();
    component.searchQuery = 'T2';
    component.applyFilters();
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].name).toBe('T2');
  });
});
