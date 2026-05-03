import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TemplateService } from './template.service';
import { TEMPLATE_API } from '../config/api.config';
import { TemplateResponseDTO } from '../../shared/models/models';

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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all templates', () => {
    const mockTemplates: TemplateResponseDTO[] = [{ templateId: 1, name: 'Modern' } as any];

    service.getAllTemplates().subscribe(templates => {
      expect(templates.length).toBe(1);
      expect(templates[0].name).toBe('Modern');
    });

    const req = httpMock.expectOne(TEMPLATE_API);
    expect(req.request.method).toBe('GET');
    req.flush(mockTemplates);
  });

  it('should fetch free templates', () => {
    service.getFreeTemplates().subscribe();
    const req = httpMock.expectOne(`${TEMPLATE_API}/free`);
    expect(req.request.method).toBe('GET');
  });

  it('should fetch template by id', () => {
    const mockTemplate = { templateId: 1, name: 'Modern', htmlLayout: '<div></div>' } as any;

    service.getTemplateById(1).subscribe(template => {
      expect(template.htmlLayout).toBe('<div></div>');
    });

    const req = httpMock.expectOne(`${TEMPLATE_API}/1`);
    req.flush(mockTemplate);
  });
});
