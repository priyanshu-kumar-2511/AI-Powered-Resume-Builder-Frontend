import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LivePreviewService } from './live-preview.service';
import { BuilderStateService } from './builder-state.service';
import { TemplateRenderService } from '../../../shared/services/template-render.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { Resume, ResumeSection, Template, UserProfileResponse } from '../../../shared/models/models';

describe('LivePreviewService', () => {
  let service: LivePreviewService;
  let mockBuilderState: any;
  let mockTemplateRenderer: any;

  let sectionsSub = new BehaviorSubject<ResumeSection[]>([]);
  let templateSub = new BehaviorSubject<Template | null>(null);
  let resumeSub   = new BehaviorSubject<Resume | null>(null);
  let profileSub  = new BehaviorSubject<UserProfileResponse | null>(null);
  let fontSub     = new BehaviorSubject<any>({ fontSize: 12, fontFamily: 'Inter', primaryColor: '#00d4b4' });

  beforeEach(() => {
    mockBuilderState = {
      sections$: sectionsSub.asObservable(),
      template$: templateSub.asObservable(),
      resume$: resumeSub.asObservable(),
      userProfile$: profileSub.asObservable(),
      font$: fontSub.asObservable(),
      fontSnapshot: fontSub.value,
      sectionsSnapshot: [],
      templateSnapshot: null,
      resumeSnapshot: null,
      userProfileSnapshot: null
    };

    mockTemplateRenderer = {
      renderDocument: jasmine.createSpy('renderDocument').and.returnValue('<html>Rendered</html>')
    };

    TestBed.configureTestingModule({
      providers: [
        LivePreviewService,
        { provide: BuilderStateService, useValue: mockBuilderState },
        { provide: TemplateRenderService, useValue: mockTemplateRenderer }
      ]
    });
    service = TestBed.inject(LivePreviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register iframe and start listening', fakeAsync(() => {
    const mockIframe = document.createElement('iframe');
    const mockDoc = jasmine.createSpyObj('Document', ['open', 'write', 'close']);
    spyOnProperty(mockIframe, 'contentDocument', 'get').and.returnValue(mockDoc);

    service.registerIframe(mockIframe);
    
    // Trigger state change
    sectionsSub.next([{ sectionType: 'SUMMARY', title: 'Summary', isVisible: true } as any]);
    
    tick(500); // Debounce
    
    expect(mockDoc.open).toHaveBeenCalled();
    expect(mockDoc.write).toHaveBeenCalledWith('<html>Rendered</html>');
    expect(mockDoc.close).toHaveBeenCalled();
  }));

  it('should get current style from snapshot', () => {
    expect(service.getCurrentStyle()).toEqual(fontSub.value);
  });

  it('should get rendered HTML for export with overrides', () => {
    const html = service.getRenderedHtml({ primaryColor: '#ff0000' });
    expect(html).toBe('<html>Rendered</html>');
    expect(mockTemplateRenderer.renderDocument).toHaveBeenCalled();
    const args = mockTemplateRenderer.renderDocument.calls.mostRecent().args[1];
    expect(args.primaryColor).toBe('#ff0000');
  });

  it('should fallback to default layout if template renderer fails', () => {
    mockTemplateRenderer.renderDocument.and.returnValue('');
    
    const sections: ResumeSection[] = [
      { sectionType: 'SUMMARY', title: 'Summary', content: JSON.stringify('My bio'), isVisible: true } as any,
      { sectionType: 'EXPERIENCE', title: 'Work', content: JSON.stringify([{ role: 'Dev', company: 'X' }]), isVisible: true } as any,
      { sectionType: 'EDUCATION', title: 'Edu', content: JSON.stringify([{ institution: 'U', degree: 'B.S' }]), isVisible: true } as any,
      { sectionType: 'SKILLS', title: 'Skills', content: JSON.stringify(['JS', 'TS']), isVisible: true } as any
    ];

    const html = (service as any).buildHtml(sections, null, null, null, fontSub.value);
    expect(html).toContain('My bio');
    expect(html).toContain('Dev');
    expect(html).toContain('JS');
  });

  it('should escape HTML to prevent XSS in fallback', () => {
    const dangerous = '<script>alert(1)</script>';
    const rendered = (service as any).renderRichText(dangerous);
    expect(rendered).not.toContain('<script>');
    expect(rendered).toContain('&lt;script&gt;');
  });

  it('should handle complex skill object in fallback', () => {
    const parsed = { 'Technical': ['Angular', 'React'], 'Soft': ['Leadership'] };
    const section = { sectionType: 'SKILLS', title: 'Skills', content: JSON.stringify(parsed), isVisible: true } as any;
    const html = (service as any).renderSection(section);
    expect(html).toContain('Angular');
    expect(html).toContain('Leadership');
  });

  it('should handle bad JSON content gracefully', () => {
    const section = { sectionType: 'SUMMARY', title: 'Summary', content: '{bad json', isVisible: true } as any;
    const html = (service as any).renderSection(section);
    expect(html).toContain('<div class="section summary"><h2>Summary</h2>');
  });

  it('should extractTextValue from various object formats', () => {
    expect((service as any).extractTextValue('Plain Text')).toBe('Plain Text');
    expect((service as any).extractTextValue({ html: '<p>HTML</p>' })).toBe('<p>HTML</p>');
    expect((service as any).extractTextValue({ text: 'Just Text' })).toBe('Just Text');
    expect((service as any).extractTextValue({ other: 'Value' })).toBe('');
    expect((service as any).extractTextValue(null)).toBe('');
  });

  it('should render generic sections', () => {
    const section = { sectionType: 'AWARDS', title: 'Awards', content: JSON.stringify('Top Achiever'), isVisible: true } as any;
    const html = (service as any).renderSection(section);
    expect(html).toContain('<div class="section generic">');
    expect(html).toContain('Top Achiever');
  });

  it('should handle skill arrays with objects', () => {
    const parsed = [{ name: 'Angular' }, 'React'];
    const section = { sectionType: 'SKILLS', title: 'Skills', content: JSON.stringify(parsed), isVisible: true } as any;
    const html = (service as any).renderSection(section);
    expect(html).toContain('Angular');
    expect(html).toContain('React');
  });
});
