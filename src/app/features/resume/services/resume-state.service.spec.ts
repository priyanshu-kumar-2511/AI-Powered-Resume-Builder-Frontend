import { TestBed } from '@angular/core/testing';
import { ResumeStateService } from './resume-state.service';
import { ResumeApiService } from './resume-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { Resume } from '../../../shared/models/models';

describe('ResumeStateService', () => {
  let service: ResumeStateService;
  let mockApi: any;
  let mockAuth: any;

  const mockResumes: Resume[] = [
    { resumeId: 1, title: 'R1', updatedAt: new Date().toISOString() } as any,
    { resumeId: 2, title: 'R2', updatedAt: new Date().toISOString() } as any
  ];

  beforeEach(() => {
    mockApi = {
      getByUser: jasmine.createSpy('getByUser').and.returnValue(of(mockResumes))
    };
    mockAuth = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(1)
    };

    TestBed.configureTestingModule({
      providers: [
        ResumeStateService,
        { provide: ResumeApiService, useValue: mockApi },
        { provide: AuthService, useValue: mockAuth }
      ]
    });
    service = TestBed.inject(ResumeStateService);
  });

  it('should load resumes into state', () => {
    service.load().subscribe();
    expect(mockAuth.getCurrentUserId).toHaveBeenCalled();
    expect(mockApi.getByUser).toHaveBeenCalledWith(1);
    service.resumes$.subscribe(resumes => {
      expect(resumes.length).toBe(2);
    });
  });

  it('should handle error during load', () => {
    mockApi.getByUser.and.returnValue(throwError(() => new Error('Fail')));
    service.load().subscribe({
      error: (err: any) => expect(err).toBeTruthy()
    });
    expect(service.snapshot).toEqual([]);
  });

  it('should add a resume to state', () => {
    const newResume = { resumeId: 3, title: 'R3', updatedAt: new Date().toISOString() } as any;
    service.add(newResume);
    expect(service.snapshot.some(r => r.resumeId === 3)).toBeTrue();
  });

  it('should remove a resume from state', () => {
    service.set(mockResumes);
    service.remove(1);
    expect(service.snapshot.length).toBe(1);
    expect(service.snapshot[0].resumeId).toBe(2);
  });

  it('should update a resume in state', () => {
    service.set(mockResumes);
    const updated = { ...mockResumes[0], title: 'Updated' };
    service.update(updated);
    const r = service.snapshot.find(x => x.resumeId === 1);
    expect(r?.title).toBe('Updated');
  });

  it('should sort resumes by updatedAt when setting', () => {
    const rOld = { resumeId: 1, updatedAt: '2023-01-01T00:00:00Z' } as any;
    const rNew = { resumeId: 2, updatedAt: '2023-12-31T00:00:00Z' } as any;
    service.set([rOld, rNew]);
    expect(service.snapshot[0].resumeId).toBe(2);
  });

  it('should throw error if load is called when userId is null', () => {
    mockAuth.getCurrentUserId.and.returnValue(null);
    service.load().subscribe({
      next: () => fail('Should have failed'),
      error: (err) => expect(err.message).toBe('Unable to resolve the current user for resume requests.')
    });
  });

  it('should add resume to state if update is called but resume does not exist', () => {
    service.set(mockResumes);
    const newR = { resumeId: 99, title: 'New', updatedAt: new Date().toISOString() } as any;
    service.update(newR);
    expect(service.snapshot.length).toBe(3);
    expect(service.snapshot.some(r => r.resumeId === 99)).toBeTrue();
  });
});
