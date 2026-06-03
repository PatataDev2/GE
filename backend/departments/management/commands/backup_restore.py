import os
import datetime
from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.conf import settings


class Command(BaseCommand):
    help = 'Backup or restore database data using dumpdata/loaddata'

    def add_arguments(self, parser):
        sub = parser.add_subparsers(dest='action', required=True)
        
        backup_parser = sub.add_parser('backup', help='Create a backup')
        backup_parser.add_argument('--output', '-o', help='Output file path (default: backups/backup_YYYYMMDD_HHMMSS.json)')
        
        restore_parser = sub.add_parser('restore', help='Restore from a backup')
        restore_parser.add_argument('--input', '-i', required=True, help='Backup file path to restore from')
        restore_parser.add_argument('--force', '-f', action='store_true', help='Skip confirmation prompt')

    def handle(self, *args, **options):
        action = options['action']
        if action == 'backup':
            return self._backup(options)
        elif action == 'restore':
            return self._restore(options)

    def _backup(self, options):
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        output = options.get('output')
        if not output:
            ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            output = os.path.join(backup_dir, f'backup_{ts}.json')

        output = os.path.abspath(output)
        os.makedirs(os.path.dirname(output), exist_ok=True)

        apps = [
            'users.UsersCustom',
            'departments.Department',
            'document_types.DocumentType',
            'expedients.Expedient',
            'documents.Document',
            'notifications.Notification',
            'notifications.ActivityLog',
        ]

        self.stdout.write(f'Creating backup: {output}')
        try:
            with open(output, 'w', encoding='utf-8') as f:
                call_command('dumpdata', *apps, format='json', indent=2, stdout=f)
        except Exception as e:
            raise CommandError(f'Backup failed: {e}')

        self.stdout.write(self.style.SUCCESS(f'Backup created: {output}'))
        self._print_stats(output)

    def _restore(self, options):
        input_file = os.path.abspath(options['input'])

        if not os.path.exists(input_file):
            raise CommandError(f'Backup file not found: {input_file}')

        if not options.get('force'):
            self.stdout.write(self.style.WARNING(
                f'This will DESTROY all existing data and replace it with data from:\n  {input_file}'
            ))
            confirm = input('Are you sure? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write('Restore cancelled.')
                return

        self.stdout.write(f'Restoring from: {input_file}')
        try:
            call_command('loaddata', input_file)
        except Exception as e:
            raise CommandError(f'Restore failed: {e}')

        self.stdout.write(self.style.SUCCESS('Data restored successfully.'))

    def _print_stats(self, filepath):
        try:
            import json
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            counts = {}
            for item in data:
                model = item.get('model', 'unknown')
                counts[model] = counts.get(model, 0) + 1
            self.stdout.write('\nBackup summary:')
            for model, count in sorted(counts.items()):
                self.stdout.write(f'  {model}: {count}')
        except Exception:
            pass
