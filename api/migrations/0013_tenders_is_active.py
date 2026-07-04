from django.db import migrations, models


def activate_existing_tenders(apps, schema_editor):
    """Existing tenders were created before the archive flag, so keep them
    visible to contractors by marking them active."""
    Tenders = apps.get_model("api", "Tenders")
    Tenders.objects.update(is_active=True)


def deactivate_existing_tenders(apps, schema_editor):
    Tenders = apps.get_model("api", "Tenders")
    Tenders.objects.update(is_active=False)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0012_alter_boqprice_unit_price"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenders",
            name="is_active",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(
            activate_existing_tenders, deactivate_existing_tenders
        ),
    ]
