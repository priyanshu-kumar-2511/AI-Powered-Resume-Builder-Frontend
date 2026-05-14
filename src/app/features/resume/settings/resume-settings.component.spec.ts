import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ResumeSettingsComponent } from './resume-settings.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ResumeApiService } from '../services/resume-api.service';
import { ResumeStateService } from '../services/resume-state.service';
import { of, throwError, Subject } from 'rxjs';

describe('ResumeSettingsComponent', () => {
  let component: ResumeSettingsComponent;
  let fixture: ComponentFixture<ResumeSettingsComponent>;
  let mockResumeApi: any;
  let mockResumeState: any;

  beforeEach(async () => {
    mockResumeApi = {
      getById: jasmine.createSpy('getById').and.returnValue(of({
        resumeId: 1, title: 'Resume', targetJobTitle: 'Dev', language: 'en', status: 'DRAFT'
      })),
      update: jasmine.createSpy('update').and.returnValue(of({ resumeId: 1, title: 'Updated' }))
    };

    mockResumeState = {
      update: jasmine.createSpy('update')
    };

    await TestBed.configureTestingModule({
      imports: [ResumeSettingsComponent, ReactiveFormsModule],
      providers: [
        { provide: ResumeApiService, useValue: mockResumeApi },
        { provide: ResumeStateService, useValue: mockResumeState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeSettingsComponent);
    component = fixture.componentInstance;
    component.resumeId = 1;
    spyOn(component.resumeLoaded, 'emit');
    spyOn(component.resumeChange, 'emit');
    fixture.detectChanges();
  });

  it('should load resume on init', () => {
    expect(mockResumeApi.getById).toHaveBeenCalledWith(1);
    expect(component.form.value.title).toBe('Resume');
    expect(component.resumeLoaded.emit).toHaveBeenCalled();
  });

  it('should handle load error', () => {
    mockResumeApi.getById.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    expect(component.error).toContain('could not load');
  });

  it('should auto-save changes', fakeAsync(() => {
    component.form.patchValue({ title: 'New Title' });
    tick(600); // debounce time
    
    expect(mockResumeApi.update).toHaveBeenCalled();
    expect(mockResumeState.update).toHaveBeenCalled();
    expect(component.resumeChange.emit).toHaveBeenCalled();
    expect(component.saveState).toBe('saved');
    expect(component.saveLabel).toContain('Saved at');
  }));

  it('should handle auto-save error', fakeAsync(() => {
    mockResumeApi.update.and.returnValue(throwError(() => new Error('error')));
    component.form.patchValue({ title: 'Another Title' });
    tick(600);
    
    expect(component.saveState).toBe('error');
    expect(component.error).toContain('Changes were not saved');
    expect(component.saveLabel).toBe('Unable to save changes');
  }));

  it('should show Saving... while saving', fakeAsync(() => {
    const updateSubject = new Subject();
    mockResumeApi.update.and.returnValue(updateSubject.asObservable());
    
    component.form.patchValue({ title: 'Title' });
    tick(600); // Trigger debounce
    expect(component.saveLabel).toBe('Saving changes...');
    
    updateSubject.next({ resumeId: 1, title: 'Title' });
    tick(); // resolve subscribe
  }));

  it('should show autosave is on initially', () => {
    component.saveState = 'idle';
    expect(component.saveLabel).toBe('Autosave is on');
  });
});
