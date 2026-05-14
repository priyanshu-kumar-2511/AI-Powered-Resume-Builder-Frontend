import { TestBed } from '@angular/core/testing';
import { TemplateService } from './template.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TEMPLATE_API } from '../config/api.config';

describe('TemplateService', () => {
  let service: TemplateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TemplateService]
    });
    service = TestBed.inject(TemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all templates', () => {
    service.getAllTemplates().subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });
    const req = httpMock.expectOne(TEMPLATE_API);
    req.flush([]);
  });

  it('should fetch free templates', () => {
    service.getFreeTemplates().subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });
    const req = httpMock.expectOne(`${TEMPLATE_API}/free`);
    req.flush([]);
  });

  it('should fetch premium templates', () => {
    service.getPremiumTemplates().subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });
    const req = httpMock.expectOne(`${TEMPLATE_API}/premium`);
    req.flush([]);
  });

  it('should fetch popular templates', () => {
    service.getPopularTemplates().subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });
    const req = httpMock.expectOne(`${TEMPLATE_API}/popular`);
    req.flush([]);
  });

  it('should fetch by category', () => {
    service.getTemplatesByCategory('MODERN' as any).subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });
    const req = httpMock.expectOne(`${TEMPLATE_API}/category/MODERN`);
    req.flush([]);
  });

  it('should fetch template by id', () => {
    service.getTemplateById(1).subscribe(res => {
      expect(res.templateId).toBe(1);
    });
    const req = httpMock.expectOne(`${TEMPLATE_API}/1`);
    req.flush({ templateId: 1 });
  });

  it('should increment usage', () => {
    service.incrementUsage(1).subscribe(res => {
      expect(res).toBeNull();
    });
    const req = httpMock.expectOne(`${TEMPLATE_API}/1/increment-usage`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });
});
