#!/usr/bin/env python3
"""Refresh CONUS Tesla Supercharger snapshot from supercharge.info."""

from __future__ import annotations

import json
import os
import urllib.request
from datetime import date
from pathlib import Path

API = "https://supercharge.info/service/supercharge/allSites"
OUT = Path(__file__).resolve().parents[1] / "public" / "data" / "superchargers-conus.json"
NON_CONUS = {"AK", "HI", "PR", "VI", "GU", "AS", "MP"}


def main() -> None:
    req = urllib.request.Request(API, headers={"User-Agent": "tesla-park-planner/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read().decode())

    sites = []
    for s in data:
        addr = s.get("address") or {}
        if (addr.get("country") or "").upper() not in ("USA", "US", "UNITED STATES"):
            continue
        status = (s.get("status") or "").upper()
        if status not in ("OPEN", "EXPANDING"):
            continue
        gps = s.get("gps") or {}
        lat, lng = gps.get("latitude"), gps.get("longitude")
        if lat is None or lng is None:
            continue
        if not (24.3 <= float(lat) <= 49.5 and -125.0 <= float(lng) <= -66.5):
            continue
        state = (addr.get("state") or "").strip().upper()
        if state in NON_CONUS:
            continue
        plugs = s.get("plugs") or {}
        sites.append(
            {
                "id": s["id"],
                "name": s.get("name") or "",
                "lat": round(float(lat), 5),
                "lng": round(float(lng), 5),
                "city": addr.get("city") or "",
                "state": state,
                "street": addr.get("street") or "",
                "stalls": s.get("stallCount") or 0,
                "kw": s.get("powerKilowatt") or 0,
                "status": status,
                "otherEVs": bool(s.get("otherEVs")),
                "nacs": plugs.get("nacs") or 0,
            }
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": "supercharge.info",
        "updated": date.today().isoformat(),
        "count": len(sites),
        "sites": sites,
    }
    with OUT.open("w") as f:
        json.dump(payload, f, separators=(",", ":"))
    print(f"Wrote {len(sites)} sites → {OUT} ({os.path.getsize(OUT):,} bytes)")


if __name__ == "__main__":
    main()
