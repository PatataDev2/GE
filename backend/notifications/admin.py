from django.contrib import admin

from .models import ActivityLog, Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'notification_type', 'read', 'created_at')
    list_filter = ('notification_type', 'read', 'created_at')
    search_fields = ('title', 'message', 'recipient__username')


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'action_type', 'target', 'ip_address', 'created_at')
    list_filter = ('action_type', 'created_at')
    search_fields = ('user__username', 'action', 'target')
