import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExportProgressComponent } from './export-progress.component';
import { ExportApiService } from '../services/export-api.service';
import { of, Subject, throwError } from 'rxjs';
import { ExportJob } from '../../../shared/models/models';

describe('ExportProgressComponent', () => {
  let component: ExportProgressComponent;
  let fixture: ComponentFixture<ExportProgressComponent>;
  let mockExportApi: any;

  const makeJob = (overrides: Partial<ExportJob> = {}): ExportJob => ({
    jobId: 'job-abc',
    resumeId: 5,
    format: 'PDF',
    status: 'QUEUED',
    requestedAt: new Date().toISOString(),
    expiresAt: null,
    fileSizeKb: null,
    downloadUrl: null,
    ...overrides
  } as ExportJob);

  beforeEach(async () => {
    mockExportApi = {
      pollJobStatus: jasmine.createSpy('pollJobStatus').and.returnValue(of(makeJob({ status: 'PROCESSING' }))),
      downloadFile:  jasmine.createSpy('downloadFile').and.returnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [ExportProgressComponent],
      providers: [
        { provide: ExportApiService, useValue: mockExportApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExportProgressComponent);
    component = fixture.componentInstance;
    component.initialJob = makeJob();
    spyOn(component.retry, 'emit');
  });

  it('should create component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should set initial job on ngOnInit and start polling', () => {
    fixture.detectChanges();
    expect(component.job?.status).toBe('PROCESSING');
    expect(mockExportApi.pollJobStatus).toHaveBeenCalledWith('job-abc', jasmine.any(Subject));
  });

  it('should NOT poll if initial status is COMPLETED', () => {
    component.initialJob = makeJob({ status: 'COMPLETED' });
    mockExportApi.pollJobStatus.calls.reset();
    fixture.detectChanges();
    expect(mockExportApi.pollJobStatus).not.toHaveBeenCalled();
    expect(component.job?.status).toBe('COMPLETED');
  });

  it('should NOT poll if initial status is FAILED', () => {
    component.initialJob = makeJob({ status: 'FAILED' });
    mockExportApi.pollJobStatus.calls.reset();
    fixture.detectChanges();
    expect(mockExportApi.pollJobStatus).not.toHaveBeenCalled();
  });

  it('should stop polling when status becomes COMPLETED', () => {
    const completedJob = makeJob({ status: 'COMPLETED' });
    mockExportApi.pollJobStatus.and.returnValue(of(completedJob));
    fixture.detectChanges();
    expect(component.job?.status).toBe('COMPLETED');
  });

  it('should stop polling when status becomes FAILED', () => {
    const failedJob = makeJob({ status: 'FAILED' });
    mockExportApi.pollJobStatus.and.returnValue(of(failedJob));
    fixture.detectChanges();
    expect(component.job?.status).toBe('FAILED');
  });

  it('should call downloadFile on onDownload()', () => {
    component.initialJob = makeJob({ status: 'COMPLETED' });
    fixture.detectChanges();
    component.job = makeJob({ status: 'COMPLETED', format: 'PDF' });
    component.onDownload();
    expect(mockExportApi.downloadFile).toHaveBeenCalledWith('job-abc', 'PDF', 5);
  });

  it('should have correct steps defined', () => {
    fixture.detectChanges();
    expect(component.steps.length).toBe(3);
    expect(component.steps.map(s => s.key)).toEqual(['QUEUED', 'PROCESSING', 'COMPLETED']);
  });

  describe('isStepDone()', () => {
    it('should return true for steps before current status', () => {
      fixture.detectChanges();
      component.job = makeJob({ status: 'COMPLETED' });
      expect(component.isStepDone('QUEUED')).toBeTrue();
      expect(component.isStepDone('PROCESSING')).toBeTrue();
      expect(component.isStepDone('COMPLETED')).toBeFalse(); // current, not "done"
    });

    it('should return false when status is FAILED', () => {
      fixture.detectChanges();
      component.job = makeJob({ status: 'FAILED' });
      expect(component.isStepDone('QUEUED')).toBeFalse();
    });

    it('should return false when job is null', () => {
      fixture.detectChanges();
      component.job = null;
      expect(component.isStepDone('QUEUED')).toBeFalse();
    });
  });

  describe('isStepActive()', () => {
    it('should return true when key matches current status', () => {
      fixture.detectChanges();
      component.job = makeJob({ status: 'PROCESSING' });
      expect(component.isStepActive('PROCESSING')).toBeTrue();
      expect(component.isStepActive('QUEUED')).toBeFalse();
    });

    it('should return true for PROCESSING step when status is FAILED', () => {
      fixture.detectChanges();
      component.job = makeJob({ status: 'FAILED' });
      expect(component.isStepActive('PROCESSING')).toBeTrue();
      expect(component.isStepActive('QUEUED')).toBeFalse();
    });

    it('should return false when job is null', () => {
      fixture.detectChanges();
      component.job = null;
      expect(component.isStepActive('QUEUED')).toBeFalse();
    });
  });
});
