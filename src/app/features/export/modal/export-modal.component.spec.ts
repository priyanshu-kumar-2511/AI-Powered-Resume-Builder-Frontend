import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ExportModalComponent } from './export-modal.component';
import { LivePreviewService } from '../../builder/services/live-preview.service';

describe('ExportModalComponent', () => {
  let component: ExportModalComponent;
  let fixture: ComponentFixture<ExportModalComponent>;
  let livePreview: jasmine.SpyObj<LivePreviewService>;

  beforeEach(async () => {
    livePreview = jasmine.createSpyObj<LivePreviewService>('LivePreviewService', ['getRenderedHtml']);
    livePreview.getRenderedHtml.and.returnValue('<html><body>Resume</body></html>');

    await TestBed.configureTestingModule({
      imports: [ExportModalComponent],
      providers: [
        { provide: LivePreviewService, useValue: livePreview }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExportModalComponent);
    component = fixture.componentInstance;
    component.resumeId = 123;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start client-side export and change steps', fakeAsync(() => {
    // Spy on printHtml to prevent actual print popup
    spyOn<any>(component, 'printHtml').and.stub();

    component.submitExport();
    expect(component.submitting).toBeTrue();
    expect(component.step).toBe('exporting');
    
    tick(500);
    expect(livePreview.getRenderedHtml).toHaveBeenCalled();
    expect(component.currentStep).toBe('PROCESSING');
    
    tick(800);
    expect(component['printHtml']).toHaveBeenCalled();
    expect(component.currentStep).toBe('COMPLETED');
    
    tick(600);
    expect(component.step).toBe('done');
    expect(component.submitting).toBeFalse();
  }));

  it('should handle error when rendering fails', fakeAsync(() => {
    livePreview.getRenderedHtml.and.returnValue(null as any);

    component.submitExport();
    
    tick(500);
    expect(component.step).toBe('error');
    expect(component.submitting).toBeFalse();
    expect(component.errorMsg).toContain('Could not read resume preview');
  }));

  it('should reset to form view', () => {
    component.step = 'error';
    component.errorMsg = 'Some error';

    component.resetToForm();

    expect(component.step).toBe('form');
    expect(component.errorMsg).toBe('');
  });
});
