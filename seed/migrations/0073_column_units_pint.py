# -*- coding: utf-8 -*-
# Generated by Django 1.9.13 on 2017-09-08 23:28
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('seed', '0072_auto_20170908_1521'),
    ]

    operations = [
        migrations.AddField(
            model_name='column',
            name='units_pint',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
    ]
