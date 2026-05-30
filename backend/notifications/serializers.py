from rest_framework import serializers
from .models import Notification, ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'user',
            'action',
            'target',
            'action_type',
            'ip_address',
            'created_at',
        ]


class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True, allow_null=True)
    actor_role = serializers.CharField(source='actor.rol', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'actor_username',
            'actor_role',
            'notification_type',
            'title',
            'message',
            'expedient_id',
            'document_id',
            'read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'recipient']
