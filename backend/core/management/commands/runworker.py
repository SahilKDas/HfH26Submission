from __future__ import annotations

import time

from django.core.management.base import BaseCommand

from core.api import purge_expired_events
from core.jobs import recover_stale_jobs, run_one_job


class Command(BaseCommand):
    help = "Run the PostgreSQL-backed Unspool model worker"

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true", help="Claim at most one job and exit")
        parser.add_argument("--poll", type=float, default=1.0, help="Idle polling interval in seconds")

    def handle(self, *args, **options):
        recover_stale_jobs()
        purge_expired_events()
        while True:
            worked = run_one_job()
            if options["once"]:
                return
            if not worked:
                time.sleep(max(0.1, options["poll"]))
