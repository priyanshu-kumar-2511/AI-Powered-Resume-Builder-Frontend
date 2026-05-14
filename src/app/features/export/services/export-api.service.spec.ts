import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ExportApiService } from './export-api.service';
import { Subject } from 'rxjs';
import { ExportStats } from '../../../shared/models/models';

describe('ExportApiService', () => {
  let service: ExportApiService;
  let httpMock: HttpTestingController;
  const BASE = '/api/v1/exports';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExportApiService]
    });
    service = TestBed.inject(ExportApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should submit PDF export job with customizations', () => {
    const customizations = { primaryColor: '#ff0000' } as any;
    service.exportPdf(1, customizations).subscribe();
    
    const req = httpMock.expectOne(`${BASE}/pdf/1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(JSON.stringify(customizations));
    req.flush({ jobId: 'j1' });
  });

  it('should submit PDF export job without customizations', () => {
    service.exportPdf(1).subscribe();
    const req = httpMock.expectOne(`${BASE}/pdf/1`);
    expect(req.request.body).toBeNull();
    req.flush({ jobId: 'j1' });
  });

  it('should submit DOCX export job without customizations', () => {
    service.exportDocx(1).subscribe();
    const req = httpMock.expectOne(`${BASE}/docx/1`);
    expect(req.request.body).toBeNull();
    req.flush({ jobId: 'j2' });
  });

  it('should submit DOCX export job with customizations', () => {
    const customizations = { fontFamily: 'Arial' } as any;
    service.exportDocx(1, customizations).subscribe();
    const req = httpMock.expectOne(`${BASE}/docx/1`);
    expect(req.request.body).toBe(JSON.stringify(customizations));
    req.flush({ jobId: 'j2' });
  });

  it('should submit JSON export job without customizations', () => {
    service.exportJson(1).subscribe(res => {
      expect(res.jobId).toBe('j3');
    });
    const req = httpMock.expectOne(`${BASE}/json/1`);
    expect(req.request.body).toBeNull();
    req.flush({ jobId: 'j3' });
  });

  it('should submit JSON export job with customizations', () => {
    const customizations = { includeAvatar: true } as any;
    service.exportJson(1, customizations).subscribe();
    const req = httpMock.expectOne(`${BASE}/json/1`);
    expect(req.request.body).toBe(JSON.stringify(customizations));
    req.flush({ jobId: 'j3' });
  });

  it('should poll job status', fakeAsync(() => {
    const stop$ = new Subject<void>();
    let lastStatus: any;
    service.pollJobStatus('j1', stop$).subscribe(status => lastStatus = status);

    // Initial call (timer(0))
    tick(0); // allow timer(0) to trigger
    const req1 = httpMock.expectOne(`${BASE}/job/j1`);
    req1.flush({ status: 'PROCESSING' });
    expect(lastStatus.status).toBe('PROCESSING');

    // Wait 2s
    tick(2000);
    const req2 = httpMock.expectOne(`${BASE}/job/j1`);
    req2.flush({ status: 'COMPLETED' });
    expect(lastStatus.status).toBe('COMPLETED');

    stop$.next();
    tick(2000);
    httpMock.expectNone(`${BASE}/job/j1`);
  }));

  it('should fetch jobs by user', () => {
    service.getByUser(123).subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });
    const req = httpMock.expectOne(`${BASE}/user/123`);
    req.flush([]);
  });

  it('should download file and trigger link click', () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    const createSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
    const revokeSpy = spyOn(URL, 'revokeObjectURL');
    
    service.downloadFile('j1', 'PDF', 1).subscribe();
    
    const req = httpMock.expectOne(`${BASE}/download/j1`);
    req.flush(mockBlob);

    expect(createSpy).toHaveBeenCalledWith(mockBlob);
    // Revoke happens after 5s
  });

  it('should fetch stats', () => {
    const mockStats: ExportStats = { userId: 1, totalExports: 10, todayPdfCount: 2, countByFormat: { PDF: 10 } };
    service.getStats(1).subscribe(res => {
      expect(res).toEqual(mockStats);
    });
    const req = httpMock.expectOne(`${BASE}/stats/1`);
    req.flush(mockStats);
  });

  it('should delete export', () => {
    service.deleteExport('j1').subscribe();
    const req = httpMock.expectOne(`${BASE}/j1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
