import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiBulletsGeneratorComponent } from './ai-bullets-generator.component';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('AiBulletsGeneratorComponent', () => {
  let component: AiBulletsGeneratorComponent;
  let fixture: ComponentFixture<AiBulletsGeneratorComponent>;
  let mockAiApi: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAiApi = {
      generateBullets: jasmine.createSpy('generateBullets').and.returnValue(of({
        content: '- Led cross-functional teams to deliver results\n- Reduced costs by 30% through optimization\n- Built scalable microservices architecture'
      }))
    };

    mockAuthService = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(12)
    };

    await TestBed.configureTestingModule({
      imports: [AiBulletsGeneratorComponent, FormsModule],
      providers: [
        { provide: AiApiService, useValue: mockAiApi },
        { provide: AuthService,  useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiBulletsGeneratorComponent);
    component = fixture.componentInstance;
    component.resumeId = 3;
    component.role = 'Software Engineer';
    spyOn(component.bulletAccepted, 'emit');
    fixture.detectChanges();
  });

  it('should create with empty initial state', () => {
    expect(component).toBeTruthy();
    expect(component.bullets.length).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should not generate if responsibilities is empty', () => {
    component.responsibilities = '';
    component.generate();
    expect(mockAiApi.generateBullets).not.toHaveBeenCalled();
  });

  it('should generate bullets and parse lines correctly', () => {
    component.responsibilities = 'Managed a team and delivered projects';
    component.generate();

    expect(mockAiApi.generateBullets).toHaveBeenCalledWith({
      userId: '12',
      resumeId: 3,
      targetJobTitle: 'Software Engineer',
      existingContent: 'Managed a team and delivered projects'
    });
    expect(component.bullets.length).toBe(3);
    expect(component.bullets[0]).toContain('Led cross-functional');
    expect(component.loading).toBeFalse();
  });

  it('should filter out short lines from parsed bullets', () => {
    mockAiApi.generateBullets.and.returnValue(of({
      content: '- Good\n- A very detailed bullet that is long enough to pass the filter\n- Ok'
    }));
    component.responsibilities = 'Some responsibilities';
    component.generate();
    // Only lines > 10 chars after cleaning pass
    expect(component.bullets.every(b => b.length > 10)).toBeTrue();
  });

  it('should handle generation error', () => {
    mockAiApi.generateBullets.and.returnValue(
      throwError(() => ({ error: { message: 'Server error' } }))
    );
    component.responsibilities = 'Some work';
    component.generate();

    expect(component.error).toBe('Server error');
    expect(component.loading).toBeFalse();
  });

  it('should use fallback error message', () => {
    mockAiApi.generateBullets.and.returnValue(throwError(() => ({})));
    component.responsibilities = 'Some work';
    component.generate();
    expect(component.error).toBe('Failed to generate bullets.');
  });

  it('should accept a bullet and emit it', () => {
    component.bullets = ['Led a team', 'Improved performance by 25%'];
    component.acceptBullet(0);

    expect(component.acceptedIndexes.has(0)).toBeTrue();
    expect(component.bulletAccepted.emit).toHaveBeenCalledWith('Led a team');
  });

  it('should clear indexes on re-generate', () => {
    component.bullets = ['Old bullet 1', 'Old bullet 2'];
    component.acceptedIndexes.add(0);
    component.rejectedIndexes.add(1);

    component.responsibilities = 'New responsibilities here';
    component.generate();

    expect(component.acceptedIndexes.size).toBe(0);
    expect(component.rejectedIndexes.size).toBe(0);
  });
});
