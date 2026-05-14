import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExportHistoryComponent } from './export-history.component';
import { ExportApiService } from '../services/export-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { ExportJob } from '../../../shared/models/models';

describe('ExportHistoryComponent', () => {
  let component: ExportHistoryComponent;
  let fixture: ComponentFixture<ExportHistoryComponent>;
  let mockExportApi: any;
  let mockAuthService: any;

  const makeJob = (overrides: Partial<ExportJob> = {}): ExportJob => ({
    jobId: 'job-1',
    resumeId: 10,
    format: 'PDF',
    status: 'COMPLETED',
    requestedAt: '2024-01-15T10:30:00Z',
    expiresAt: null,
    fileSizeKb: 120,
    downloadUrl: null,
    ...overrides
  } as ExportJob);

  beforeEach(async () => {
    mockExportApi = {
      getByUser:    jasmine.createSpy('getByUser').and.returnValue(of([makeJob()])),
      downloadFile: jasmine.createSpy('downloadFile').and.returnValue(of(undefined)),
      deleteExport: jasmine.createSpy('deleteExport').and.returnValue(of(undefined))
    };

    mockAuthService = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(7)
    };

    await TestBed.configureTestingModule({
      imports: [ExportHistoryComponent],
      providers: [
        { provide: ExportApiService, useValue: mockExportApi },
        { provide: AuthService,      useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExportHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load export jobs', () => {
    expect(component).toBeTruthy();
    expect(mockExportApi.getByUser).toHaveBeenCalledWith(7);
    expect(component.jobs.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should not load if userId is null', () => {
    mockAuthService.getCurrentUserId.and.returnValue(null);
    mockExportApi.getByUser.calls.reset();
    component.ngOnInit();
    expect(mockExportApi.getByUser).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should handle load error gracefully', () => {
    mockExportApi.getByUser.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('should sort jobs by requestedAt descending', () => {
    const older = makeJob({ jobId: 'job-1', requestedAt: '2024-01-10T10:00:00Z' });
    const newer = makeJob({ jobId: 'job-2', requestedAt: '2024-01-15T10:00:00Z' });
    mockExportApi.getByUser.and.returnValue(of([older, newer]));
    component.ngOnInit();
    expect(component.jobs[0].jobId).toBe('job-2'); // newer first
  });

  it('should trigger download and clear downloading state', () => {
    const job = makeJob();
    component.download(job);
    expect(mockExportApi.downloadFile).toHaveBeenCalledWith('job-1', 'PDF', 10);
    expect(component.downloading).toBeNull();
  });

  it('should handle download error and clear downloading', () => {
    mockExportApi.downloadFile.and.returnValue(throwError(() => new Error('error')));
    component.download(makeJob());
    expect(component.downloading).toBeNull();
  });

  it('should delete job and remove from list', () => {
    component.jobs = [makeJob({ jobId: 'job-1' }), makeJob({ jobId: 'job-2' })];
    component.deleteJob(component.jobs[0]);
    expect(mockExportApi.deleteExport).toHaveBeenCalledWith('job-1');
    expect(component.jobs.length).toBe(1);
    expect(component.jobs[0].jobId).toBe('job-2');
    expect(component.deleting).toBeNull();
  });

  it('should handle delete error and clear deleting', () => {
    mockExportApi.deleteExport.and.returnValue(throwError(() => new Error('error')));
    component.jobs = [makeJob()];
    component.deleteJob(component.jobs[0]);
    expect(component.deleting).toBeNull();
  });

  it('should format date correctly', () => {
    const result = component.formatDate('2024-01-15T10:30:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('should return false for isExpired when expiresAt is null', () => {
    expect(component.isExpired(null)).toBeFalse();
  });

  it('should return true for isExpired when date is in the past', () => {
    expect(component.isExpired('2020-01-01T00:00:00Z')).toBeTrue();
  });

  it('should return false for isExpired when date is in the future', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(component.isExpired(future)).toBeFalse();
  });
});
