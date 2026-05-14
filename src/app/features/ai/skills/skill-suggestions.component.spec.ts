import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SkillSuggestionsComponent } from './skill-suggestions.component';
import { AiApiService } from '../services/ai-api.service';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';

describe('SkillSuggestionsComponent', () => {
  let component: SkillSuggestionsComponent;
  let fixture: ComponentFixture<SkillSuggestionsComponent>;
  let mockAiApi: any;

  beforeEach(async () => {
    mockAiApi = {
      suggestSkills: jasmine.createSpy('suggestSkills').and.returnValue(
        of(['TypeScript', 'Angular', 'RxJS', 'Node.js'])
      )
    };

    await TestBed.configureTestingModule({
      imports: [SkillSuggestionsComponent],
      providers: [
        { provide: AiApiService, useValue: mockAiApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SkillSuggestionsComponent);
    component = fixture.componentInstance;
    component.resumeId = 7;
    spyOn(component.skillAdded, 'emit');
    fixture.detectChanges();
  });

  it('should create with empty state', () => {
    expect(component).toBeTruthy();
    expect(component.skills).toEqual([]);
    expect(component.loading).toBeFalse();
  });

  it('should load skills when jobTitle changes to non-empty', () => {
    component.jobTitle = 'Frontend Developer';
    component.ngOnChanges({
      jobTitle: new SimpleChange(null, 'Frontend Developer', true)
    });

    expect(mockAiApi.suggestSkills).toHaveBeenCalledWith(7, 'Frontend Developer');
    expect(component.skills).toEqual(['TypeScript', 'Angular', 'RxJS', 'Node.js']);
    expect(component.loading).toBeFalse();
  });

  it('should not load skills when jobTitle is blank', () => {
    component.jobTitle = '  ';
    component.ngOnChanges({
      jobTitle: new SimpleChange('Old', '  ', false)
    });
    expect(mockAiApi.suggestSkills).not.toHaveBeenCalled();
  });

  it('should not call api when non-jobTitle input changes', () => {
    component.ngOnChanges({
      resumeId: new SimpleChange(null, 7, true)
    });
    expect(mockAiApi.suggestSkills).not.toHaveBeenCalled();
  });

  it('should add a skill and emit it', () => {
    component.skills = ['TypeScript', 'Angular'];
    component.addSkill('TypeScript');

    expect(component.addedSkills.has('TypeScript')).toBeTrue();
    expect(component.skillAdded.emit).toHaveBeenCalledWith('TypeScript');
  });

  it('should handle skill load error gracefully', () => {
    mockAiApi.suggestSkills.and.returnValue(throwError(() => new Error('Network error')));
    component.jobTitle = 'Designer';
    component.ngOnChanges({
      jobTitle: new SimpleChange(null, 'Designer', true)
    });

    expect(component.loading).toBeFalse();
    expect(component.skills).toEqual([]);
  });

  it('should prevent adding same skill twice', () => {
    component.skills = ['Angular'];
    component.addSkill('Angular');
    component.addSkill('Angular'); // second add

    expect(component.addedSkills.size).toBe(1);
    expect(component.skillAdded.emit).toHaveBeenCalledTimes(2); // emits regardless
  });

  it('should call loadSkills directly', () => {
    component.jobTitle = 'DevOps Engineer';
    component.loadSkills();

    expect(mockAiApi.suggestSkills).toHaveBeenCalledWith(7, 'DevOps Engineer');
    expect(component.skills.length).toBeGreaterThan(0);
  });
});
