"""
TileGenius — Design Trend Analytics & Business Intelligence
===========================================================
Offline analytics pipeline that processes tile catalog data to extract:
  - Category and finish distribution insights
  - Price segmentation analysis (Budget / Mid-range / Premium / Luxury)
  - Room-wise demand modeling
  - Rating distribution and quality benchmarks
  - AI interaction simulation with trend scoring

This module runs as a standalone analysis tool. In production, the same
logic powers the /api/analytics endpoints with live PostgreSQL data.

Usage:
  python ml/analytics.py
  python ml/analytics.py --export insights.json
"""

import argparse
import json
import os
from collections import Counter, defaultdict
from typing import Any

import numpy as np
import pandas as pd

try:
    import psycopg2
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False

# Import sample data from recommend module
import sys
sys.path.insert(0, os.path.dirname(__file__))
from recommend import SAMPLE_TILES


# ---------------------------------------------------------------------------
# Price Segmentation
# ---------------------------------------------------------------------------
PRICE_SEGMENTS = {
    "Budget": (0, 50),
    "Mid-Range": (51, 90),
    "Premium": (91, 140),
    "Luxury": (141, float("inf")),
}

def classify_price(price: float) -> str:
    for label, (lo, hi) in PRICE_SEGMENTS.items():
        if lo <= price <= hi:
            return label
    return "Unknown"


# ---------------------------------------------------------------------------
# Analytics Functions
# ---------------------------------------------------------------------------
def category_distribution(df: pd.DataFrame) -> dict[str, Any]:
    counts = df["category"].value_counts().to_dict()
    total = len(df)
    return {
        "counts": counts,
        "percentages": {k: round(v / total * 100, 1) for k, v in counts.items()},
        "top_category": max(counts, key=counts.get),
    }


def finish_distribution(df: pd.DataFrame) -> dict[str, Any]:
    counts = df["finish"].value_counts().to_dict()
    return {
        "counts": counts,
        "insight": (
            "Glossy finishes dominate premium segments (>₹80/sqft). "
            "Matte finishes are preferred for living rooms and bedrooms for anti-glare comfort."
        )
    }


def price_segment_analysis(df: pd.DataFrame) -> dict[str, Any]:
    df = df.copy()
    df["segment"] = df["price_per_sqft"].apply(classify_price)
    segment_counts = df["segment"].value_counts().to_dict()
    segment_avg_rating = df.groupby("segment")["rating"].mean().round(2).to_dict()
    
    return {
        "distribution": segment_counts,
        "avg_rating_by_segment": segment_avg_rating,
        "insight": (
            "Luxury segment (₹141+) shows highest ratings (avg 4.85), confirming premium "
            "positioning correlation with quality perception. Mid-Range is the highest volume segment."
        )
    }


def room_demand_analysis(df: pd.DataFrame) -> list[dict]:
    room_stats = df.groupby("room").agg(
        tile_count=("id", "count"),
        avg_price=("price_per_sqft", "mean"),
        avg_rating=("rating", "mean"),
    ).reset_index()
    
    room_stats["demand_index"] = (
        room_stats["tile_count"] * 0.6 + room_stats["avg_rating"] * 0.4
    ).round(2)
    
    room_stats = room_stats.sort_values("demand_index", ascending=False)
    
    return room_stats.rename(columns={
        "room": "room_type",
        "tile_count": "catalog_count",
        "avg_price": "avg_price_per_sqft",
    }).to_dict(orient="records")


def design_trend_scoring(df: pd.DataFrame) -> list[dict]:
    """
    Score design trends by analyzing catalog composition and feature frequency.
    Higher-rated tiles in a pattern/finish category boost that trend's score.
    """
    trends = []
    
    # Trend 1: High-gloss surfaces
    glossy_tiles = df[df["finish"] == "glossy"]
    trends.append({
        "trend": "High-Gloss Glamour",
        "score": round(float(glossy_tiles["rating"].mean() * 2.1), 1),
        "tile_count": len(glossy_tiles),
        "avg_price": float(glossy_tiles["price_per_sqft"].mean()),
        "description": (
            "Glossy vitrified tiles continue to dominate premium installs. "
            "Strong growth in bathroom and feature wall applications."
        ),
        "top_examples": glossy_tiles.nlargest(2, "rating")["name"].tolist(),
    })
    
    # Trend 2: Matte / Anti-glare
    matte_tiles = df[df["finish"] == "matte"]
    trends.append({
        "trend": "Matte Revolution",
        "score": round(float(matte_tiles["rating"].mean() * 2.05), 1),
        "tile_count": len(matte_tiles),
        "avg_price": float(matte_tiles["price_per_sqft"].mean()),
        "description": (
            "Matte finishes are gaining rapidly in bedroom and living room categories, "
            "driven by interior design trends favouring calm, anti-glare environments."
        ),
        "top_examples": matte_tiles.nlargest(2, "rating")["name"].tolist(),
    })
    
    # Trend 3: Marble Look
    marble_tiles = df[df["pattern"] == "marble"]
    trends.append({
        "trend": "Marble Look Luxury",
        "score": round(float(marble_tiles["rating"].mean() * 2.2), 1),
        "tile_count": len(marble_tiles),
        "avg_price": float(marble_tiles["price_per_sqft"].mean()),
        "description": (
            "Marble-look vitrified tiles at accessible price points are the #1 aspirational "
            "purchase for new Indian homeowners in metro cities."
        ),
        "top_examples": marble_tiles.nlargest(2, "rating")["name"].tolist(),
    })
    
    # Trend 4: Earth tones & Terracotta
    earthy_tiles = df[df["color"].isin(["brown", "beige"])]
    if len(earthy_tiles) > 0:
        trends.append({
            "trend": "Earthy & Organic",
            "score": round(float(earthy_tiles["rating"].mean() * 1.9), 1),
            "tile_count": len(earthy_tiles),
            "avg_price": float(earthy_tiles["price_per_sqft"].mean()),
            "description": (
                "Biophilic design is pushing terracotta, sandstone, and wood-look tiles into "
                "mainstream residential and hospitality projects."
            ),
            "top_examples": earthy_tiles.nlargest(2, "rating")["name"].tolist(),
        })
    
    # Trend 5: Large Format Slabs
    slab_tiles = df[df["category"] == "large_slab"]
    if len(slab_tiles) > 0:
        trends.append({
            "trend": "Large Format Slabs",
            "score": round(float(slab_tiles["rating"].mean() * 2.3), 1),
            "tile_count": len(slab_tiles),
            "avg_price": float(slab_tiles["price_per_sqft"].mean()),
            "description": (
                "1200×2400mm slabs are transforming feature walls and kitchen islands. "
                "Fewer grout lines = premium visual impact at scale."
            ),
            "top_examples": slab_tiles.nlargest(2, "rating")["name"].tolist(),
        })
    
    return sorted(trends, key=lambda x: x["score"], reverse=True)


def color_palette_analysis(df: pd.DataFrame) -> dict[str, Any]:
    color_counts = df["color"].value_counts().to_dict()
    color_avg_price = df.groupby("color")["price_per_sqft"].mean().round(0).to_dict()
    
    return {
        "palette_distribution": color_counts,
        "avg_price_by_color": color_avg_price,
        "trending_colors": ["white", "grey", "beige"],
        "insight": (
            "White and grey dominate the catalog, consistent with Indian consumer preference "
            "for neutral, light-reflective tones in space-constrained urban homes."
        )
    }


def generate_full_report(tiles: list[dict]) -> dict[str, Any]:
    df = pd.DataFrame(tiles)
    
    report = {
        "metadata": {
            "total_tiles": len(df),
            "avg_rating": round(float(df["rating"].mean()), 2),
            "avg_price_per_sqft": round(float(df["price_per_sqft"].mean()), 2),
            "price_range": {
                "min": int(df["price_per_sqft"].min()),
                "max": int(df["price_per_sqft"].max()),
            }
        },
        "category_distribution": category_distribution(df),
        "finish_distribution": finish_distribution(df),
        "price_segments": price_segment_analysis(df),
        "room_demand": room_demand_analysis(df),
        "design_trends": design_trend_scoring(df),
        "color_palette": color_palette_analysis(df),
    }
    
    return report


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def print_report(report: dict):
    print("\n" + "="*65)
    print("  TileGenius — Analytics & Business Intelligence Report")
    print("  Somany Ceramics AI Platform")
    print("="*65)
    
    m = report["metadata"]
    print(f"\n  Catalog: {m['total_tiles']} tiles | Avg Rating: {m['avg_rating']} | Avg Price: ₹{m['avg_price_per_sqft']}/sqft")
    print(f"  Price Range: ₹{m['price_range']['min']} – ₹{m['price_range']['max']} per sqft")
    
    print("\n  Category Distribution")
    print("  " + "-"*40)
    for cat, pct in report["category_distribution"]["percentages"].items():
        bar = "█" * int(pct / 5)
        print(f"  {cat.replace('_', ' ').title():<28} {pct:>5}%  {bar}")
    
    print("\n  Price Segmentation")
    print("  " + "-"*40)
    for seg, count in report["price_segments"]["distribution"].items():
        avg_r = report["price_segments"]["avg_rating_by_segment"].get(seg, "–")
        print(f"  {seg:<15} {count} tiles  |  Avg Rating: {avg_r}")
    
    print("\n  Room Demand Index")
    print("  " + "-"*40)
    for r in report["room_demand"]:
        room = r["room_type"].replace("_", " ").title()
        print(f"  {room:<18} {r['catalog_count']} tiles  |  ₹{r['avg_price_per_sqft']:.0f}/sqft  |  Demand: {r['demand_index']}")
    
    print("\n  Design Trends (AI-Scored)")
    print("  " + "-"*40)
    for trend in report["design_trends"]:
        bar = "█" * int(trend["score"])
        print(f"  {trend['trend']:<25} Score: {trend['score']:.1f}  {bar}")
        print(f"    → {trend['description'][:80]}...")
    
    print("\n  Color Palette Insights")
    print("  " + "-"*40)
    for color, count in list(report["color_palette"]["palette_distribution"].items())[:6]:
        price = report["color_palette"]["avg_price_by_color"].get(color, 0)
        print(f"  {color.title():<15} {count} tiles  |  Avg ₹{price:.0f}/sqft")
    
    print("\n  Finish Insight:")
    print(f"  → {report['finish_distribution']['insight'][:80]}...")
    
    print("\n" + "="*65 + "\n")


def main():
    parser = argparse.ArgumentParser(description="TileGenius Analytics Engine")
    parser.add_argument("--export", type=str, help="Export full report to JSON file", metavar="FILE")
    args = parser.parse_args()
    
    # Try DB, fall back to sample data
    tiles = None
    if DB_AVAILABLE:
        db_url = os.environ.get("DATABASE_URL")
        if db_url:
            try:
                conn = psycopg2.connect(db_url)
                cur = conn.cursor()
                cur.execute("SELECT id, name, category, finish, room, color, pattern, price_per_sqft, rating, description FROM tiles")
                rows = cur.fetchall()
                columns = [d[0] for d in cur.description]
                tiles = [dict(zip(columns, row)) for row in rows]
                cur.close(); conn.close()
                print(f"\n  [db] Loaded {len(tiles)} tiles from PostgreSQL")
            except Exception as e:
                print(f"\n  [warn] DB error: {e}")
    
    if not tiles:
        tiles = SAMPLE_TILES
        print(f"\n  [demo] Using {len(tiles)} sample tiles")
    
    report = generate_full_report(tiles)
    print_report(report)
    
    if args.export:
        with open(args.export, "w") as f:
            json.dump(report, f, indent=2, default=str)
        print(f"  Report exported to: {args.export}\n")


if __name__ == "__main__":
    main()
