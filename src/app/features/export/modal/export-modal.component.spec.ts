import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ExportModalComponent } from './export-modal.component';
import { ExportApiService } from '../services/export-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { LivePreviewService } from '../../builder/services/live-preview.service';
import { ExportJob } from '../../../shared/models/models';

describe('ExportModalComponent', () => {
  let component: ExportModalComponent;
  let fixture: ComponentFixture<ExportModalComponent>;
  let exportApi: jasmine.SpyObj<ExportApiService>;
  let auth: jasmine.SpyObj<AuthService>;
  let livePreview: jasmine.SpyObj<LivePreviewService>;

  beforeEach(async () => {
    exportApi = jasmine.createSpyObj<ExportApiService>('ExportApiService', [
      'exportPdf',
      'exportDocx',
      'exportJson',
      'pollJobStatus',
      'downloadFile'
    ]);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentPlan', 'isAdmin']);
    livePreview = jasmine.createSpyObj<LivePreviewService>('LivePreviewService', ['getCurrentStyle', 'getRenderedHtml']);

    auth.getCurrentPlan.and.returnValue('PREMIUM');
    auth.isAdmin.and.returnValue(false);
    livePreview.getCurrentStyle.and.returnValue({
      fontSize: 11,
      fontFamily: 'Inter',
      primaryColor: '#00d4b4'
    });
    livePreview.getRenderedHtml.and.returnValue('<html><body>Resume</body></html>');

    await TestBed.configureTestingModule({
      imports: [ExportModalComponent],
      providers: [
        { provide: ExportApiService, useValue: exportApi },
        { provide: AuthService, useValue: auth },
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

  it('should select a tab', () => {
    component.selectTab('DOCX');
    expect(component.activeTab).toBe('DOCX');
  });

  it('should start DOCX export and show backend failure reason', () => {
    const queuedJob = { jobId: 'job-123', status: 'QUEUED' } as ExportJob;
    const failedJob = { jobId: 'job-123', status: 'FAILED', failureReason: 'Template fetch unauthorized' } as ExportJob;

    exportApi.exportDocx.and.returnValue(of(queuedJob));
    exportApi.pollJobStatus.and.returnValue(of(failedJob));

    component.selectTab('DOCX');
    component.submitExport();

    expect(exportApi.exportDocx).toHaveBeenCalled();
    expect(component.step).toBe('error');
    expect(component.errorMsg).toContain('Template fetch unauthorized');
  });

  it('should handle backend export start error', () => {
    exportApi.exportDocx.and.returnValue(throwError(() => ({ error: { message: 'Premium required' } })));

    component.selectTab('DOCX');
    component.submitExport();

    expect(component.step).toBe('error');
    expect(component.errorMsg).toContain('Premium required');
  });

  it('should reset to form view', () => {
    component.step = 'error';
    component.errorMsg = 'Some error';

    component.resetToForm();

    expect(component.step).toBe('form');
    expect(component.errorMsg).toBe('');
  });
});
