import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiSidebarComponent } from './ai-sidebar.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../core/services/auth.service';
import { AiApiService } from '../services/ai-api.service';
import { QuotaStateService } from '../services/quota-state.service';
import { BuilderStateService } from '../../builder/services/builder-state.service';
import { SectionApiService } from '../../builder/services/section-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, BehaviorSubject } from 'rxjs';

describe('AiSidebarComponent', () => {
  let component: AiSidebarComponent;
  let fixture: ComponentFixture<AiSidebarComponent>;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      getCurrentPlan: jasmine.createSpy('getCurrentPlan').and.returnValue('FREE'),
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(1),
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ fullName: 'Test' })
    };

    const mockAiApi = {
      generateSummary:    jasmine.createSpy().and.returnValue(of({ content: '' })),
      generateBullets:    jasmine.createSpy().and.returnValue(of({ content: '' })),
      suggestSkills:      jasmine.createSpy().and.returnValue(of({ skills: [] })),
      checkAts:           jasmine.createSpy().and.returnValue(of({ score: 0, suggestions: [], missingKeywords: [] })),
      improveSection:     jasmine.createSpy().and.returnValue(of({ content: '' })),
      tailorResume:       jasmine.createSpy().and.returnValue(of({ content: '' })),
      getHistory:         jasmine.createSpy().and.returnValue(of([])),
      translateSection:   jasmine.createSpy().and.returnValue(of({ content: '' })),
      getQuota:           jasmine.createSpy().and.returnValue(of({})),
      generateCoverLetter:jasmine.createSpy().and.returnValue(of({ content: '' }))
    };

    const mockQuotaState = {
      getSnapshot: jasmine.createSpy().and.returnValue({
        remainingSummary: 10, summaryLimit: 10,
        remainingAts: 3, atsLimit: 3, isPremium: false
      }),
      quota: of({ remainingSummary: 10, summaryLimit: 10, remainingAts: 3, atsLimit: 3, isPremium: false }),
      setQuota: jasmine.createSpy(),
      decrementSummary: jasmine.createSpy(),
      decrementAts: jasmine.createSpy()
    };

    const mockBuilderState = {
      resume$:   new BehaviorSubject(null),
      sections$: new BehaviorSubject([]),
      selectedSection$: new BehaviorSubject(null),
      sectionsSnapshot: [],
      updateSection: jasmine.createSpy(),
      setSections:   jasmine.createSpy(),
      addSection:    jasmine.createSpy(),
      setResume:     jasmine.createSpy()
    };

    const mockSectionApi = {
      getAll:           jasmine.createSpy().and.returnValue(of([])),
      addSection:       jasmine.createSpy().and.returnValue(of({})),
      toggleVisibility: jasmine.createSpy().and.returnValue(of({})),
      reorder:          jasmine.createSpy().and.returnValue(of({})),
      updateContent:    jasmine.createSpy().and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [AiSidebarComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService,       useValue: mockAuthService },
        { provide: AiApiService,      useValue: mockAiApi },
        { provide: QuotaStateService, useValue: mockQuotaState },
        { provide: BuilderStateService, useValue: mockBuilderState },
        { provide: SectionApiService,   useValue: mockSectionApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiSidebarComponent);
    component = fixture.componentInstance;
    component.resumeId = 5;
    fixture.detectChanges();
  });

  it('should create in collapsed state on improve tab', () => {
    expect(component).toBeTruthy();
    expect(component.collapsed).toBeTrue();
    expect(component.activeTab).toBe('improve');
  });

  it('should toggle collapsed state', () => {
    component.collapsed = !component.collapsed;
    expect(component.collapsed).toBeFalse();

    component.collapsed = !component.collapsed;
    expect(component.collapsed).toBeTrue();
  });

  it('should switch tabs correctly', () => {
    component.activeTab = 'generate';
    expect(component.activeTab).toBe('generate');

    component.activeTab = 'ats';
    expect(component.activeTab).toBe('ats');

    component.activeTab = 'history';
    expect(component.activeTab).toBe('history');
  });

  it('should return isPremium = false for FREE plan', () => {
    mockAuthService.getCurrentPlan.and.returnValue('FREE');
    expect(component.isPremium).toBeFalse();
  });

  it('should return isPremium = true for PREMIUM plan', () => {
    mockAuthService.getCurrentPlan.and.returnValue('PREMIUM');
    expect(component.isPremium).toBeTrue();
  });

  it('should have 4 tabs defined', () => {
    expect(component.tabs.length).toBe(4);
    const tabIds = component.tabs.map(t => t.id);
    expect(tabIds).toContain('improve');
    expect(tabIds).toContain('generate');
    expect(tabIds).toContain('ats');
    expect(tabIds).toContain('history');
  });

  it('should mark improve and history tabs as premium', () => {
    const premiumTabs = component.tabs.filter(t => t.premium);
    expect(premiumTabs.map(t => t.id)).toContain('improve');
    expect(premiumTabs.map(t => t.id)).toContain('history');
  });
});
