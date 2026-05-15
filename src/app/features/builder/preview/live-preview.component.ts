import { CommonModule } from '@angular/common';
import {
  Component, ElementRef, EventEmitter, OnDestroy, OnInit,
  Output, ViewChild, inject
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { BuilderStateService } from '../services/builder-state.service';
import { LivePreviewService } from '../services/live-preview.service';
import { ResumeSection, Template } from '../../../shared/models/models';

/**
 * Component responsible for rendering the visual representation of the resume.
 * Utilizes a secure iframe to isolate CSS from the main Angular application,
 * injecting interaction listeners to sync iframe clicks back to Angular state.
 */
@Component({
  selector: 'app-live-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-preview.component.html'
})
export class LivePreviewComponent implements OnInit, OnDestroy {
  private readonly a4ViewportHeightPx = 1123;
  private readonly contentRootSelector = '.resume, .creative-resume, .navy-resume, .timeline-resume, .teal-resume, .ivory-resume, .mono-resume, .ankesh-resume';
  @ViewChild('previewFrame') set frameRef(ref: ElementRef<HTMLIFrameElement>) {
    if (ref?.nativeElement) {
      this.livePreview.registerIframe(ref.nativeElement);
      this.iframeEl = ref.nativeElement;
    }
  }

  /** Emits sectionType when user clicks a section inside the preview */
  @Output() sectionClicked = new EventEmitter<string>();

  private builderState = inject(BuilderStateService);
  private livePreview  = inject(LivePreviewService);
  private destroy$     = new Subject<void>();
  private iframeEl: HTMLIFrameElement | null = null;

  sections: ResumeSection[] = [];
  template: Template | null = null;
  loading = true;

  private sectionsLoaded = false;
  private templateLoaded = false;

  ngOnInit(): void {
    // Receive postMessage from inside the iframe when a section is clicked
    window.addEventListener('message', this.onIframeMessage);

    // Coordinate click listener injection precisely with afterRender$ notifications
    this.livePreview.afterRender$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.injectClickListeners();
      this.checkHeight();
    });

    // Check height periodically or on specific events
    const resizeObserver = new ResizeObserver(() => this.checkHeight());
    this.destroy$.subscribe(() => resizeObserver.disconnect());

    this.builderState.sections$.pipe(takeUntil(this.destroy$)).subscribe((s: ResumeSection[]) => {
      this.sections = s;
      this.sectionsLoaded = true;
      if (this.templateLoaded) {
        this.loading = false;
      }
    });

    this.builderState.template$.pipe(takeUntil(this.destroy$)).subscribe((t: Template | null) => {
      this.template = t;
      this.templateLoaded = true;
      if (this.sectionsLoaded) {
        this.loading = false;
      }
    });

    // Fallback — always show after 1.5s
    setTimeout(() => {
      this.loading = false;
    }, 1500);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onIframeMessage);
    this.destroy$.next();
    this.destroy$.complete();
  }

  get visibleSections(): ResumeSection[] {
    return this.sections.filter(s => s.isVisible);
  }

  /**
   * Inject CSS hover outlines + click event listeners into the iframe DOM.
   * When a section is clicked, it posts a message to parent with the sectionType.
   */
  private injectClickListeners(): void {
    try {
      const doc = this.iframeEl?.contentDocument;
      if (!doc || !doc.body) return;

      // Add hover + click styles
      doc.getElementById('__click_edit_styles')?.remove();
      const style = doc.createElement('style');
      style.id = '__click_edit_styles';
      style.textContent = `
        .section, section, .summary, .experience, .skills, .education,
        .certifications, .languages, .projects, .references, .custom,
        .main-section, .side-section, .profile-section, .additional,
        .achievements, .expertise,
        [data-section] {
          cursor: pointer !important;
          border-radius: 3px;
          transition: outline 0.12s ease !important;
        }
        .section:hover, section:hover, .summary:hover, .experience:hover,
        .skills:hover, .education:hover, .certifications:hover, .languages:hover,
        .projects:hover, .references:hover, .custom:hover, .main-section:hover,
        .side-section:hover, .profile-section:hover, .additional:hover,
        .achievements:hover, .expertise:hover {
          outline: 2px solid rgba(0,212,180,0.65) !important;
          outline-offset: 4px !important;
        }
        .__selected {
          outline: 2px solid #00d4b4 !important;
          outline-offset: 4px !important;
          background: rgba(0,212,180,0.04) !important;
        }
      `;
      doc.head.appendChild(style);

      const previousHandler = (doc as Document & { __resumeClickHandler?: EventListener }).__resumeClickHandler;
      if (previousHandler) {
        doc.removeEventListener('click', previousHandler, true);
      }

      const handler: EventListener = (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        const clickable = target.closest<HTMLElement>(
          '[data-section], .main-section, .side-section, .profile-section, .additional, .achievements, .expertise, .section, section, .summary, .experience, .skills, .education, .certifications, .languages, .projects, .references, .custom, .contact, .header, .sidebar-panel, .header-main, .header-text, .ats-header, .corp-header, .navy-header, .timeline-header, .teal-header'
        );

        if (!clickable) return;

        event.preventDefault();
        event.stopPropagation();

        doc.querySelectorAll('.__selected').forEach((selected) => selected.classList.remove('__selected'));
        clickable.classList.add('__selected');

        const matched = this.resolveSectionType(clickable);
        if (matched) {
          window.parent.postMessage({ type: 'SECTION_CLICK', sectionType: matched }, '*');
        }
      };

      (doc as Document & { __resumeClickHandler?: EventListener }).__resumeClickHandler = handler;
      doc.addEventListener('click', handler, true);
    } catch { /* not ready / cross-origin */ }
  }

  private resolveSectionType(element: HTMLElement): string | null {
    const explicitType = element.dataset['section'];
    if (explicitType) {
      return explicitType.toUpperCase();
    }

    const classes = Array.from(element.classList).map((cls) => cls.toLowerCase());
    const text = (element.textContent || '').toLowerCase();
    const heading = this.extractSectionHeading(element);
    const lowHeading = heading.toLowerCase();

    // 1. Check for Contact/Header specifically by Class or explicit Heading
    if (
      classes.some((cls) => ['contact', 'header', 'sidebar-panel', 'ats-header', 'corp-header', 'navy-header', 'timeline-header', 'teal-header'].includes(cls)) ||
      /contact|profile|personal info/.test(lowHeading)
    ) {
      return 'CONTACT';
    }

    // 2. Return the heading as the primary hint if found
    if (heading) {
      return heading.toUpperCase();
    }

    // 3. Fallback to keyword matching if no clear heading
    if (classes.some((cls) => cls.includes('summary')) || /about me|summary|professional summary|profile|career objective/.test(text)) {
      return 'SUMMARY';
    }
    if (classes.some((cls) => cls.includes('experience')) || /work experience|professional experience/.test(text)) {
      return 'EXPERIENCE';
    }
    if (classes.some((cls) => cls.includes('education')) || /education/.test(text)) {
      return 'EDUCATION';
    }
    if (classes.some((cls) => cls.includes('skills') || cls.includes('expertise')) || /skills|key skills|technical skills|soft skills/.test(text)) {
      return 'SKILLS';
    }

    return null;
  }

  private extractSectionHeading(element: HTMLElement): string {
    const heading = element.querySelector('h1, h2, h3, .section-title, .extra-title, .section-title-bar h2');
    return (heading?.textContent || '').trim().toLowerCase();
  }

  private checkHeight(): void {
    try {
      const doc = this.iframeEl?.contentDocument;
      if (!doc || !doc.body) return;

      const viewportHeight = Math.max(
        doc.documentElement.clientHeight,
        doc.body.clientHeight,
        this.iframeEl?.contentWindow?.innerHeight ?? 0,
        this.a4ViewportHeightPx
      );
      const contentHeight = this.measureContentHeight(doc);

      // Ignore tiny measurement noise, but show the warning as soon as content genuinely flows
      // beyond the A4 viewport instead of treating min-height stretching as overflow.
      const isOver = contentHeight > (viewportHeight + 8);
      this.isOverA4 = isOver;
      this.builderState.setOverA4Height(isOver);
    } catch { }
  }

  private measureContentHeight(doc: Document): number {
    const root = doc.querySelector<HTMLElement>(this.contentRootSelector);
    const body = doc.body;
    const docEl = doc.documentElement;

    return Math.max(
      root ? this.getElementExtent(root) : 0,
      this.getContentBottom(body),
      body.scrollHeight,
      docEl.scrollHeight
    );
  }

  private getElementExtent(element: HTMLElement): number {
    return Math.max(
      element.scrollHeight,
      element.offsetHeight,
      Math.ceil(element.getBoundingClientRect().height)
    );
  }

  private getContentBottom(container: HTMLElement): number {
    const descendants = Array.from(container.querySelectorAll<HTMLElement>('*'));
    let maxBottom = 0;

    for (const element of descendants) {
      const style = window.getComputedStyle(element);
      if (style.position === 'fixed') {
        continue;
      }

      const hasRenderableContent =
        (element.textContent || '').trim().length > 0 ||
        element.children.length > 0 ||
        element.offsetHeight > 1;

      if (!hasRenderableContent) {
        continue;
      }

      maxBottom = Math.max(maxBottom, element.offsetTop + element.offsetHeight);
    }

    return maxBottom;
  }

  private onIframeMessage = (event: MessageEvent): void => {
    if (event.data?.type === 'SECTION_CLICK' && event.data.sectionType) {
      this.sectionClicked.emit(event.data.sectionType as string);
    }
  };

  isOverA4 = false;
}
