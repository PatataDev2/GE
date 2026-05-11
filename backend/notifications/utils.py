from notifications.models import Notification, ActivityLog


def create_notification(recipient, actor, notification_type, title, message, expedient_id=None, document_id=None):
    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        title=title,
        message=message,
        expedient_id=expedient_id,
        document_id=document_id,
    )


def create_activity_log(user, action, action_type, target='-', ip_address=None):
    return ActivityLog.objects.create(
        user=user,
        action=action,
        action_type=action_type,
        target=target,
        ip_address=ip_address,
    )
