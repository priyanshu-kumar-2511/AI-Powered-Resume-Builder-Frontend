import { CommonModule } from '@angular/common';
import {
  Component, ElementRef, EventEmitter, OnDestroy, OnInit,
  Output, ViewChild, inject
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { BuilderStateService } from '../services/builder-state.service';
import { LivePreviewService } from '../services/live-preview.service';
import { ResumeSection, Template } from '../../../shared/models/models';

@Component({
  selector: 'app-live-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-preview.component.html'
})
export class LivePreviewComponent implements OnInit, OnDestroy {
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

    this.builderState.sections$.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.sections = s;
      this.sectionsLoaded = true;
      if (this.templateLoaded) {
        this.loading = false;
        setTimeout(() => this.injectClickListeners(), 700);
      }
    });

    this.builderState.template$.pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.template = t;
      this.templateLoaded = true;
      if (this.sectionsLoaded) {
        this.loading = false;
        setTimeout(() => this.injectClickListeners(), 700);
      }
    });

    // Fallback — always show after 1.5s
    setTimeout(() => {
      this.loading = false;
      setTimeout(() => this.injectClickListeners(), 700);
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
        [data-section] {
          cursor: pointer !important;
          border-radius: 3px;
          transition: outline 0.12s ease !important;
        }
        .section:hover, section:hover, .summary:hover, .experience:hover,
        .skills:hover, .education:hover, .certifications:hover, .languages:hover,
        .projects:hover, .references:hover, .custom:hover {
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

      const sectionTypes = ['SUMMARY','EXPERIENCE','EDUCATION','SKILLS',
        'CERTIFICATIONS','LANGUAGES','PROJECTS','REFERENCES','CUSTOM'];

      const selectors = [
        '.section','section','.summary','.experience','.skills',
        '.education','.certifications','.languages','.projects',
        '.references','.custom','[data-section]'
      ];

      selectors.forEach(sel => {
        doc.querySelectorAll<HTMLElement>(sel).forEach(el => {
          // Remove existing listener by cloning (simple approach)
          const clone = el.cloneNode(true) as HTMLElement;
          el.parentNode?.replaceChild(clone, el);
          clone.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            // Highlight clicked section
            doc.querySelectorAll('.__selected').forEach(s => s.classList.remove('__selected'));
            clone.classList.add('__selected');
            // Find matching sectionType from element classes
            const classes = Array.from(clone.classList).map(c => c.toUpperCase());
            const matched = sectionTypes.find(t => classes.some(c => c.includes(t)));
            if (matched) {
              window.parent.postMessage({ type: 'SECTION_CLICK', sectionType: matched }, '*');
            }
          });
        });
      });
    } catch { /* not ready / cross-origin */ }
  }

  private onIframeMessage = (event: MessageEvent): void => {
    if (event.data?.type === 'SECTION_CLICK' && event.data.sectionType) {
      this.sectionClicked.emit(event.data.sectionType as string);
    }
  };
}
