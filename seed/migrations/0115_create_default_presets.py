# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations
from datetime import datetime
from json import load


def pm_mappings():
    with open("./seed/lib/mappings/data/pm-mapping.json", "r") as read_file:
        raw_mappings = load(read_file)

    # Verify that from_field values are all uniq
    from_fields = [rm['from_field'] for rm in raw_mappings]
    assert len(from_fields) == len(set(from_fields))

    # taken from mapping partial (./static/seed/partials/mapping.html)
    valid_units = [
        # area units
        "ft**2",
        "m**2",
        # eui_units
        "kBtu/ft**2/year",
        "kWh/m**2/year",
        "GJ/m**2/year",
        "MJ/m**2/year",
        "kBtu/m**2/year",
    ]

    formatted_mappings = []

    # check unit value is one that SEED recognizes
    for rm in raw_mappings:
        from_units = rm.get('units', None)
        if from_units not in valid_units:
            from_units = None

        mapping = {
            "to_field": rm.get('to_field'),
            "from_field": rm.get('from_field'),
            "from_units": from_units,
            "to_table_name": rm.get('to_table_name'),
        }

        formatted_mappings.append(mapping)

    return formatted_mappings


def snapshot_mappings(ColumnMapping, org):
    # logic adapted from ColumnMapping static method, get_column_mappings
    column_mappings = ColumnMapping.objects.filter(super_organization=org)
    formatted_mappings = []
    for cm in column_mappings:
        if not cm.column_mapped.all().exists():
            continue

        raw_columns_info = cm.column_raw.all().values_list('column_name', flat=True)
        mapped_columns_info = cm.column_mapped.all().values_list('table_name', 'column_name')

        if len(raw_columns_info) != 1:
            print('skipped raw_columns_info: ', raw_columns_info)
            continue

        if len(mapped_columns_info) != 1:
            print('skipped mapped_columns_info: ', mapped_columns_info)
            continue

        raw_col_name = raw_columns_info[0]
        mapped_col = mapped_columns_info[0]

        mapping = {
            "to_field": mapped_col[1],
            "from_field": raw_col_name,
            "from_units": None,
            "to_table_name": mapped_col[0],
        }

        # check there are no duplicates
        formatted_mappings.append(mapping)

    return formatted_mappings


def forwards(apps, schema_editor):
    Organization = apps.get_model("orgs", "Organization")
    ColumnMapping = apps.get_model("seed", "ColumnMapping")

    todays_date = datetime.date(datetime.now()).isoformat()

    for org in Organization.objects.all():
        if org.column_mappings.exists():
            # Create mappings based on snapshot of current org mappings
            snapshot_mapping_name = todays_date + ' org-wide mapping snapshot'
            org.columnmappingpreset_set.create(
                name=snapshot_mapping_name,
                mappings=snapshot_mappings(ColumnMapping, org)
            )

            # Create PM mappings
            pm_mapping_name = 'Portfolio Manager Defaults'
            org.columnmappingpreset_set.create(
                name=pm_mapping_name,
                mappings=pm_mappings()
            )


class Migration(migrations.Migration):
    dependencies = [
        ('seed', '0114_columnmappingpreset_organizations'),
    ]

    operations = [
        migrations.RunPython(forwards),
    ]
