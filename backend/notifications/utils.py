from notifications.models import Notification


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
