import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SectionApiService } from './section-api.service';
import { SECTION_API } from '../../../core/config/api.config';
import { ResumeSection } from '../../../shared/models/models';

describe('SectionApiService', () => {
  let service: SectionApiService;
  let httpMock: HttpTestingController;

  const mockSection: ResumeSection = {
    sectionId: 10, resumeId: 5, sectionType: 'SUMMARY',
    title: 'Summary', content: '{}', displayOrder: 0,
    isVisible: true, aiGenerated: false,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SectionApiService]
    });
    service = TestBed.inject(SectionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST to add a section', () => {
    service.addSection({ resumeId: 5, sectionType: 'SUMMARY' } as any).subscribe(s => {
      expect(s.sectionId).toBe(10);
    });
    const req = httpMock.expectOne(SECTION_API);
    expect(req.request.method).toBe('POST');
    req.flush(mockSection);
  });

  it('should GET sections by resumeId', () => {
    service.getSections(5).subscribe(list => {
      expect(list.length).toBe(1);
      expect(list[0].sectionType).toBe('SUMMARY');
    });
    const req = httpMock.expectOne(`${SECTION_API}/resume/5`);
    expect(req.request.method).toBe('GET');
    req.flush([mockSection]);
  });

  it('should GET section by sectionId', () => {
    service.getSectionById(10).subscribe(s => expect(s.sectionId).toBe(10));
    const req = httpMock.expectOne(`${SECTION_API}/10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSection);
  });

  it('should PUT to update a section', () => {
    service.updateSection(10, { content: '{"name":"John"}' } as any).subscribe(s => {
      expect(s.sectionId).toBe(10);
    });
    const req = httpMock.expectOne(`${SECTION_API}/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ content: '{"name":"John"}' });
    req.flush(mockSection);
  });

  it('should DELETE a section', () => {
    service.deleteSection(10).subscribe();
    const req = httpMock.expectOne(`${SECTION_API}/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should PUT to reorder sections', () => {
    service.reorder(5, [3, 1, 2]).subscribe();
    const req = httpMock.expectOne(`${SECTION_API}/resume/5/reorder`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual([3, 1, 2]);
    req.flush(null);
  });

  it('should PUT to toggle visibility', () => {
    service.toggleVisibility(10).subscribe(s => expect(s.isVisible).toBe(true));
    const req = httpMock.expectOne(`${SECTION_API}/10/toggle-visibility`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockSection, isVisible: true });
  });

  it('should PUT to bulk update sections', () => {
    service.bulkUpdate([mockSection]).subscribe(list => expect(list.length).toBe(1));
    const req = httpMock.expectOne(`${SECTION_API}/bulk-update`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual([mockSection]);
    req.flush([mockSection]);
  });
});
