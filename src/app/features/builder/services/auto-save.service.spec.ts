import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AutoSaveService, SaveStatus } from './auto-save.service';
import { SectionApiService } from './section-api.service';
import { BuilderStateService } from './builder-state.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';
import { of, throwError } from 'rxjs';
import { ResumeSection } from '../../../shared/models/models';

describe('AutoSaveService', () => {
  let service: AutoSaveService;
  let mockSectionApi: any;
  let mockBuilderState: any;
  let mockResumeApi: any;

  const updatedSection: ResumeSection = {
    sectionId: 1, resumeId: 10, sectionType: 'SUMMARY', title: 'Summary',
    content: 'Updated content', displayOrder: 0, isVisible: true,
    aiGenerated: false, createdAt: '', updatedAt: ''
  };

  beforeEach(() => {
    mockSectionApi = {
      updateSection: jasmine.createSpy('updateSection').and.returnValue(of(updatedSection))
    };

    mockBuilderState = {
      updateSection: jasmine.createSpy('updateSection'),
      setResume:     jasmine.createSpy('setResume')
    };

    mockResumeApi = {
      update: jasmine.createSpy('update').and.returnValue(of({ resumeId: 5 }))
    };

    TestBed.configureTestingModule({
      providers: [
        AutoSaveService,
        { provide: SectionApiService,  useValue: mockSectionApi },
        { provide: BuilderStateService, useValue: mockBuilderState },
        { provide: ResumeApiService,   useValue: mockResumeApi }
      ]
    });

    service = TestBed.inject(AutoSaveService);
  });

  it('should be created with idle status', () => {
    expect(service).toBeTruthy();
    let status: SaveStatus | undefined;
    service.saveStatus$.subscribe(s => status = s);
    expect(status).toBe('idle');
  });

  it('should return "Autosave on" label when idle', () => {
    expect(service.statusLabel).toBe('Autosave on');
  });

  it('should return "Saving..." label when saving', fakeAsync(() => {
    service.queueSave(1, { content: 'new' } as any);
    let label: string | undefined;
    service.saveStatus$.subscribe(s => { if (s === 'saving') label = service.statusLabel; });
    expect(label).toBe('Saving...');
    tick(1000);
  }));

  it('should queue section save and call updateSection after debounce', fakeAsync(() => {
    service.queueSave(1, { content: 'Hello' } as any);
    expect(mockSectionApi.updateSection).not.toHaveBeenCalled(); // debounced

    tick(1000);
    expect(mockSectionApi.updateSection).toHaveBeenCalledWith(1, { content: 'Hello' });
    expect(mockBuilderState.updateSection).toHaveBeenCalledWith(updatedSection);
  }));

  it('should set status to "saved" after successful section save', fakeAsync(() => {
    service.queueSave(1, { content: 'test' } as any);
    tick(1000);

    let status: SaveStatus | undefined;
    service.saveStatus$.subscribe(s => status = s);
    expect(status).toBe('saved');
  }));

  it('should set lastSaved after successful save', fakeAsync(() => {
    let lastSaved: Date | null = null;
    service.lastSaved$.subscribe(d => lastSaved = d);

    service.queueSave(1, { content: 'test' } as any);
    tick(1000);
    expect(lastSaved).not.toBeNull();
  }));

  it('should set status to "error" when section save fails', fakeAsync(() => {
    mockSectionApi.updateSection.and.returnValue(throwError(() => new Error('fail')));
    service.queueSave(1, { content: 'bad' } as any);
    tick(1000);

    let status: SaveStatus | undefined;
    service.saveStatus$.subscribe(s => status = s);
    expect(status).toBe('error');
  }));

  it('should return "Save failed" label on error', fakeAsync(() => {
    mockSectionApi.updateSection.and.returnValue(throwError(() => new Error('fail')));
    service.queueSave(1, { content: 'bad' } as any);
    tick(1000);
    expect(service.statusLabel).toBe('Save failed');
  }));

  it('should queue resume customizations and call resumeApi.update after debounce', fakeAsync(() => {
    service.queueResumeCustomizations(5, '{"fontSize":12}');
    expect(mockResumeApi.update).not.toHaveBeenCalled();

    tick(1000);
    expect(mockResumeApi.update).toHaveBeenCalledWith(5, { customizations: '{"fontSize":12}' });
    expect(mockBuilderState.setResume).toHaveBeenCalledWith({ resumeId: 5 });
  }));

  it('should debounce multiple rapid saves — only last one triggers API', fakeAsync(() => {
    service.queueSave(1, { content: 'first' } as any);
    tick(500);
    service.queueSave(1, { content: 'second' } as any);
    tick(500);
    service.queueSave(1, { content: 'final' } as any);
    tick(1000);

    expect(mockSectionApi.updateSection).toHaveBeenCalledTimes(1);
    expect(mockSectionApi.updateSection).toHaveBeenCalledWith(1, { content: 'final' });
  }));

  it('should reset status to idle via resetStatus()', fakeAsync(() => {
    service.queueSave(1, { content: 'x' } as any);
    tick(1000);
    service.resetStatus();

    let status: SaveStatus | undefined;
    service.saveStatus$.subscribe(s => status = s);
    expect(status).toBe('idle');
  }));

  it('should return "Saved ✓ [Time]" label when status is saved', fakeAsync(() => {
    service.queueSave(1, { content: 'test' } as any);
    tick(1000);
    const label = service.statusLabel;
    expect(label).toContain('Saved ✓');
  }));

  it('should set status to error if resume customizations save fails', fakeAsync(() => {
    mockResumeApi.update.and.returnValue(throwError(() => new Error('fail')));
    service.queueResumeCustomizations(5, '{"fontSize":12}');
    tick(1000);
    let status: SaveStatus | undefined;
    service.saveStatus$.subscribe(s => status = s);
    expect(status).toBe('error');
  }));
});
