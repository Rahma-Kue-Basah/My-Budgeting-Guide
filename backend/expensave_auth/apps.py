from django.apps import AppConfig


class ExpensaveAuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expensave_auth'

    def ready(self):
        import expensave_auth.signals  # noqa: F401
