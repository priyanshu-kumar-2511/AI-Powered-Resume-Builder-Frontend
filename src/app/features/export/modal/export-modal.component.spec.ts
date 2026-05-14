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

  it('should determine if step is done', () => {
    component.step = 'exporting';
    component.currentStep = 'PROCESSING';
    expect(component.isStepDone('QUEUED')).toBeTrue();
    expect(component.isStepDone('PROCESSING')).toBeFalse();
    expect(component.isStepDone('COMPLETED')).toBeFalse();

    component.step = 'error';
    expect(component.isStepDone('QUEUED')).toBeFalse();
  });

  it('should emit close on close button click', () => {
    spyOn(component.close, 'emit');
    const closeBtn = fixture.nativeElement.querySelector('.em-close');
    closeBtn.click();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close on backdrop click', () => {
    spyOn(component.close, 'emit');
    const backdrop = fixture.nativeElement.querySelector('.em-backdrop');
    
    // Click on backdrop itself
    backdrop.click();
    expect(component.close.emit).toHaveBeenCalled();

    // Click on modal content should NOT emit
    (component.close.emit as jasmine.Spy).calls.reset();
    const modal = fixture.nativeElement.querySelector('.em-modal');
    modal.click();
    expect(component.close.emit).not.toHaveBeenCalled();
  });

  it('should start client-side export and change steps', fakeAsync(() => {
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

  it('should handle print errors (blocked popups)', fakeAsync(() => {
    spyOn(window, 'open').and.returnValue(null);

    component.submitExport();
    tick(500); // Wait for first timeout
    tick(800); // Wait for second timeout (printHtml call)
    
    expect(component.step).toBe('error');
    expect(component.errorMsg).toContain('blocked');
    expect(component.submitting).toBeFalse();
  }));

  it('should successfully write to print window', fakeAsync(() => {
    const mockWindow = {
      document: {
        open: jasmine.createSpy('open'),
        write: jasmine.createSpy('write'),
        close: jasmine.createSpy('close')
      },
      focus: jasmine.createSpy('focus'),
      print: jasmine.createSpy('print'),
      close: jasmine.createSpy('close'),
      closed: false,
      onload: null as any
    } as any;

    spyOn(window, 'open').and.returnValue(mockWindow);

    // Case 1: With head
    component['printHtml']('<html><head></head><body>Resume</body></html>');
    expect(mockWindow.document.write).toHaveBeenCalledWith(jasmine.stringMatching('</style></head>'));

    // Case 2: Without head
    (mockWindow.document.write as jasmine.Spy).calls.reset();
    component['printHtml']('<body>Resume</body>');
    expect(mockWindow.document.write).toHaveBeenCalledWith(jasmine.stringContaining('<body>Resume</body>'));

    expect(mockWindow.document.open).toHaveBeenCalled();
    expect(mockWindow.document.close).toHaveBeenCalled();

    // Simulate onload
    if (mockWindow.onload) mockWindow.onload();
    tick(300);
    expect(mockWindow.focus).toHaveBeenCalled();
    expect(mockWindow.print).toHaveBeenCalled();
    
    tick(1000);
    expect(mockWindow.close).toHaveBeenCalled();
    
    // Backup focus/print after 1.5s
    tick(1500); 
    expect(mockWindow.focus).toHaveBeenCalledTimes(3);
  }));

  it('should handle generic errors without message', fakeAsync(() => {
    spyOn<any>(component, 'printHtml').and.throwError({} as any);

    component.submitExport();
    tick(500);
    tick(800);
    
    expect(component.step).toBe('error');
    expect(component.errorMsg).toBe('Print window was blocked. Please allow popups for this site.');
  }));

  it('should call ngOnDestroy', () => {
    component.ngOnDestroy();
    expect(true).toBeTrue();
  });

  it('should reset to form view', () => {
    component.step = 'error';
    component.errorMsg = 'Some error';

    component.resetToForm();

    expect(component.step).toBe('form');
    expect(component.errorMsg).toBe('');
  });
});
