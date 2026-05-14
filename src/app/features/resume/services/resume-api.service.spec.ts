import { TestBed } from '@angular/core/testing';
import { ResumeApiService } from './resume-api.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Resume } from '../../../shared/models/models';
import { RESUME_API } from '../../../core/config/api.config';

describe('ResumeApiService', () => {
  let service: ResumeApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResumeApiService]
    });
    service = TestBed.inject(ResumeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get resumes by user', () => {
    const mockResumes: Resume[] = [{ resumeId: 1, title: 'R1' } as any];
    service.getByUser(1).subscribe(res => expect(res).toEqual(mockResumes));
    const req = httpMock.expectOne(`${RESUME_API}/user/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResumes);
  });

  it('should handle error on getByUser', () => {
    service.getByUser(1).subscribe({
      error: (err: any) => expect(err).toBeTruthy()
    });
    const req = httpMock.expectOne(`${RESUME_API}/user/1`);
    req.error(new ErrorEvent('Network error'));
  });

  it('should duplicate resume', () => {
    service.duplicate(1).subscribe(res => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${RESUME_API}/1/duplicate`);
    expect(req.request.method).toBe('POST');
    req.flush({ resumeId: 2 } as any);
  });

  it('should publish resume', () => {
    service.publish(1).subscribe(res => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${RESUME_API}/1/publish`);
    expect(req.request.method).toBe('PUT');
    req.flush({ resumeId: 1, isPublic: true } as any);
  });

  it('should unpublish resume', () => {
    service.unpublish(1).subscribe(res => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${RESUME_API}/1/unpublish`);
    expect(req.request.method).toBe('PUT');
    req.flush({ resumeId: 1, isPublic: false } as any);
  });

  it('should update resume', () => {
    const payload = { title: 'New Title' };
    service.update(1, payload as any).subscribe(res => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${RESUME_API}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ resumeId: 1, ...payload } as any);
  });

  it('should delete resume', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne(`${RESUME_API}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
