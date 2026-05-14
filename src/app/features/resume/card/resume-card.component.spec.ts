import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumeCardComponent } from './resume-card.component';
import { Resume } from '../../../shared/models/models';

describe('ResumeCardComponent', () => {
  let component: ResumeCardComponent;
  let fixture: ComponentFixture<ResumeCardComponent>;
  
  const mockResume: Resume = {
    resumeId: 1,
    userId: 1,
    title: 'Software Engineer Resume',
    templateId: 1,
    targetJobTitle: 'Developer',
    language: 'en',
    status: 'COMPLETE',
    atsScore: 85,
    isPublic: true,
    viewCount: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 mins ago
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeCardComponent);
    component = fixture.componentInstance;
    component.resume = mockResume;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute atsScore within bounds', () => {
    expect(component.atsScore).toBe(85);
    
    component.resume = { ...mockResume, atsScore: 150 };
    expect(component.atsScore).toBe(100);

    component.resume = { ...mockResume, atsScore: -10 };
    expect(component.atsScore).toBe(0);
  });

  it('should compute atsOffset correctly', () => {
    const expectedOffset = 113.1 - (85 / 100) * 113.1;
    expect(component.atsOffset).toBeCloseTo(expectedOffset, 2);
  });

  it('should compute atsColor correctly', () => {
    expect(component.atsColor).toBe('#00d4b4'); // >= 80

    component.resume = { ...mockResume, atsScore: 60 };
    expect(component.atsColor).toBe('#c9a84c'); // >= 50

    component.resume = { ...mockResume, atsScore: 30 };
    expect(component.atsColor).toBe('#f87171'); // < 50
  });

  it('should compute lastUpdatedLabel correctly', () => {
    expect(component.lastUpdatedLabel).toBe('Updated 30m ago');

    component.resume = { ...mockResume, updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }; // 2 hours
    expect(component.lastUpdatedLabel).toBe('Updated 2h ago');

    component.resume = { ...mockResume, updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }; // 2 days
    expect(component.lastUpdatedLabel).toBe('Updated 2d ago');

    component.resume = { ...mockResume, updatedAt: new Date(Date.now() + 10000).toISOString() }; // future
    expect(component.lastUpdatedLabel).toBe('Updated just now');
  });

  it('should return correct statusClass', () => {
    expect(component.statusClass).toBe('status-complete');
    component.resume = { ...mockResume, status: 'DRAFT' };
    expect(component.statusClass).toBe('status-draft');
  });

  it('should emit viewDetails event when handleOpen is called', () => {
    spyOn(component.viewDetails, 'emit');
    component.showPublicMeta = true;
    component.handleOpen();
    expect(component.viewDetails.emit).toHaveBeenCalledWith(mockResume);
  });

  it('should not emit viewDetails event when showPublicMeta is false', () => {
    spyOn(component.viewDetails, 'emit');
    component.showPublicMeta = false;
    component.handleOpen();
    expect(component.viewDetails.emit).not.toHaveBeenCalled();
  });
});
