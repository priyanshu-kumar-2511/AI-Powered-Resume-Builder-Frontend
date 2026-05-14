import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationItemComponent } from './notification-item.component';
import { NotificationType } from '../../../shared/models/models';

describe('NotificationItemComponent', () => {
  let component: NotificationItemComponent;
  let fixture: ComponentFixture<NotificationItemComponent>;

  const mockNotification = {
    id: 1,
    recipientId: 1,
    title: 'Test Title',
    message: 'Test Message',
    type: 'SUCCESS' as NotificationType,
    tier: 'ALL' as any,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationItemComponent);
    component = fixture.componentInstance;
    component.notification = { ...mockNotification };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct icon for SUCCESS type', () => {
    expect(component.typeIcon).toBe('✅');
  });

  it('should return correct color for SUCCESS type', () => {
    expect(component.typeColor).toBe('#22c55e');
  });

  it('should return fallback icon and color for unknown types', () => {
    component.notification.type = 'UNKNOWN' as any;
    expect(component.typeIcon).toBe('🔔');
    expect(component.typeColor).toBe('var(--teal)');
  });

  it('should return "Just now" for current date', () => {
    expect(component.relativeTime).toBe('Just now');
  });

  it('should return "Xm ago" for minutes', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    component.notification.createdAt = tenMinAgo;
    expect(component.relativeTime).toBe('10m ago');
  });

  it('should return "Xh ago" for hours', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600_000).toISOString();
    component.notification.createdAt = twoHoursAgo;
    expect(component.relativeTime).toBe('2h ago');
  });

  it('should return "Xd ago" for days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600_000).toISOString();
    component.notification.createdAt = threeDaysAgo;
    expect(component.relativeTime).toBe('3d ago');
  });

  it('should emit markRead on unread item click', () => {
    spyOn(component.markRead, 'emit');
    component.onItemClick();
    expect(component.markRead.emit).toHaveBeenCalledWith(1);
  });

  it('should NOT emit markRead on read item click', () => {
    component.notification.isRead = true;
    spyOn(component.markRead, 'emit');
    component.onItemClick();
    expect(component.markRead.emit).not.toHaveBeenCalled();
  });

  it('should emit deleted and stop propagation', () => {
    spyOn(component.deleted, 'emit');
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    component.onDelete(mockEvent);
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.deleted.emit).toHaveBeenCalledWith(1);
  });
});
