import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationApiService } from './notification-api.service';
import { NOTIFICATION_API } from '../../../core/config/api.config';

describe('NotificationApiService', () => {
  let service: NotificationApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationApiService]
    });
    service = TestBed.inject(NotificationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET notifications by recipient with default page/size', () => {
    service.getByRecipient(5).subscribe(page => expect(page).toBeTruthy());
    const req = httpMock.expectOne(r =>
      r.url === `${NOTIFICATION_API}/recipient/5` &&
      r.params.get('page') === '0' &&
      r.params.get('size') === '20'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });

  it('should GET notifications by recipient with custom page/size', () => {
    service.getByRecipient(5, 2, 10).subscribe(res => {
      expect(res.content).toEqual([]);
    });
    const req = httpMock.expectOne(r =>
      r.url === `${NOTIFICATION_API}/recipient/5` &&
      r.params.get('page') === '2' &&
      r.params.get('size') === '10'
    );
    req.flush({ content: [], totalElements: 0 });
  });

  it('should GET unread count for userId', () => {
    service.getUnreadCount(5).subscribe(count => expect(count).toBe(3));
    const req = httpMock.expectOne(`${NOTIFICATION_API}/recipient/5/unread-count`);
    expect(req.request.method).toBe('GET');
    req.flush(3);
  });

  it('should PUT to mark single notification as read', () => {
    service.markRead(42).subscribe(res => {
      expect(res).toBeNull();
    });
    const req = httpMock.expectOne(`${NOTIFICATION_API}/42/mark-read`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should PUT to mark all notifications as read for user', () => {
    service.markAllRead(5).subscribe(res => {
      expect(res).toBeNull();
    });
    const req = httpMock.expectOne(`${NOTIFICATION_API}/recipient/5/mark-all-read`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should DELETE a notification', () => {
    service.delete(99).subscribe(res => {
      expect(res).toBeNull();
    });
    const req = httpMock.expectOne(`${NOTIFICATION_API}/99`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
