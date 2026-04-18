"""
TileGenius — Content-Based Tile Recommendation Engine
=====================================================
This module demonstrates the ML backbone powering tile similarity search.

Key concepts:
  - TF-IDF vectorization of tile semantic descriptors
  - Cosine similarity for nearest-neighbor retrieval
  - Feature engineering combining numeric + categorical attributes
  - Hybrid scoring that blends textual and attribute similarity

In production this is upgraded to:
  - OpenAI text-embedding-3-small for semantic embeddings
  - pgvector for HNSW index nearest-neighbor search at scale
  - Real-time personalization via collaborative filtering layer

Usage:
  python ml/recommend.py
  python ml/recommend.py --tile-id 3 --top-k 5
"""

import argparse
import os
import sys
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

try:
    import psycopg2
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False


# ---------------------------------------------------------------------------
# Sample tile data (mirrors the seeded catalog — used when DB is not connected)
# ---------------------------------------------------------------------------
SAMPLE_TILES = [
    {"id": 1, "name": "Arctic White Floor", "category": "ceramic_floor", "finish": "matte", "room": "living_room", "color": "white", "pattern": "solid", "price_per_sqft": 45, "rating": 4.5, "description": "Clean crisp arctic white ceramic floor tile subtle matte finish timeless versatile"},
    {"id": 2, "name": "Carrara Marble Gloss", "category": "polished_vitrified", "finish": "glossy", "room": "living_room", "color": "white", "pattern": "marble", "price_per_sqft": 85, "rating": 4.8, "description": "Stunning carrara marble look polished vitrified tile glamour luxurious sophisticated bathroom"},
    {"id": 3, "name": "Terracotta Earth", "category": "ceramic_floor", "finish": "rustic", "room": "living_room", "color": "brown", "pattern": "textured", "price_per_sqft": 55, "rating": 4.3, "description": "Warm terracotta rustic earth tones handcrafted artisan character farmhouse outdoor"},
    {"id": 4, "name": "Midnight Galaxy Vitrified", "category": "glazed_vitrified", "finish": "glossy", "room": "living_room", "color": "black", "pattern": "marble", "price_per_sqft": 120, "rating": 4.6, "description": "Dramatic midnight black galaxy veins bold statement feature wall luxury premium"},
    {"id": 5, "name": "Sahara Sand Stone", "category": "ceramic_floor", "finish": "matte", "room": "bedroom", "color": "beige", "pattern": "stone", "price_per_sqft": 60, "rating": 4.4, "description": "Warm sandy beige natural sandstone texture bedroom earthy neutral calming serene"},
    {"id": 6, "name": "Emerald Forest Wall", "category": "ceramic_wall", "finish": "glossy", "room": "bathroom", "color": "green", "pattern": "solid", "price_per_sqft": 75, "rating": 4.7, "description": "Deep rich emerald green glossy bathroom wall vibrant bold nature inspired"},
    {"id": 7, "name": "Industrial Concrete", "category": "large_slab", "finish": "matte", "room": "kitchen", "color": "grey", "pattern": "concrete", "price_per_sqft": 95, "rating": 4.5, "description": "Raw urban industrial concrete look large format slab kitchen modern minimal"},
    {"id": 8, "name": "Royal Blue Moroccan", "category": "ceramic_wall", "finish": "glossy", "room": "bathroom", "color": "blue", "pattern": "geometric", "price_per_sqft": 80, "rating": 4.6, "description": "Exotic moroccan geometric pattern deep cobalt blue wall bathroom bohemian riad"},
    {"id": 9, "name": "Calacatta Gold", "category": "large_slab", "finish": "glossy", "room": "bathroom", "color": "white", "pattern": "marble", "price_per_sqft": 180, "rating": 4.9, "description": "Ultra premium calacatta gold veining luxurious marble slab bathroom master suite opulent"},
    {"id": 10, "name": "Rustic Brick Red", "category": "ceramic_wall", "finish": "rustic", "room": "kitchen", "color": "red", "pattern": "brick", "price_per_sqft": 50, "rating": 4.2, "description": "Classic brick red rustic kitchen backsplash wall warm cosy farmhouse country"},
    {"id": 11, "name": "Pearl White Subway", "category": "ceramic_wall", "finish": "glossy", "room": "kitchen", "color": "white", "pattern": "solid", "price_per_sqft": 40, "rating": 4.4, "description": "Timeless pearl white subway tile kitchen backsplash bright clean classic versatile"},
    {"id": 12, "name": "Teak Wood Plank", "category": "glazed_vitrified", "finish": "satin", "room": "bedroom", "color": "brown", "pattern": "wood", "price_per_sqft": 90, "rating": 4.7, "description": "Realistic teak wood plank look glazed tile bedroom warm natural organic feel"},
    {"id": 13, "name": "Geometric Hex Charcoal", "category": "ceramic_floor", "finish": "matte", "room": "bathroom", "color": "grey", "pattern": "geometric", "price_per_sqft": 70, "rating": 4.5, "description": "Hexagonal charcoal pattern bathroom floor contemporary geometric design graphic"},
    {"id": 14, "name": "Sky Blue Pool", "category": "ceramic_wall", "finish": "glossy", "room": "outdoor", "color": "blue", "pattern": "solid", "price_per_sqft": 55, "rating": 4.3, "description": "Vivid sky blue outdoor pool patio ceramic tile aqua water resort poolside"},
    {"id": 15, "name": "Crystal White PVT", "category": "polished_vitrified", "finish": "glossy", "room": "living_room", "color": "white", "pattern": "solid", "price_per_sqft": 75, "rating": 4.6, "description": "Brilliantly white polished vitrified tile crystal clear living room spacious bright modern"},
    {"id": 16, "name": "Golden Travertine PVT", "category": "polished_vitrified", "finish": "satin", "room": "bedroom", "color": "beige", "pattern": "stone", "price_per_sqft": 110, "rating": 4.8, "description": "Premium golden travertine natural stone look satin finish bedroom warm golden luxury"},
]


# ---------------------------------------------------------------------------
# Feature Engineering
# ---------------------------------------------------------------------------
def build_feature_matrix(tiles: list[dict]) -> tuple[np.ndarray, list[str]]:
    """
    Build a hybrid feature matrix from tile attributes.
    
    Returns:
        (feature_matrix, feature_names) where feature_matrix is (n_tiles, n_features)
    """
    df = pd.DataFrame(tiles)
    
    # 1. Text features: TF-IDF on description + semantic tags
    text_corpus = df.apply(
        lambda row: f"{row['description']} {row['name']} {row['color']} {row['pattern']} {row['finish']} {row['category']}",
        axis=1
    )
    
    tfidf = TfidfVectorizer(
        max_features=100,
        stop_words="english",
        ngram_range=(1, 2),
        sublinear_tf=True
    )
    text_features = tfidf.fit_transform(text_corpus).toarray()
    
    # 2. Categorical features: one-hot encoding
    cat_features = pd.get_dummies(
        df[["category", "finish", "room", "color", "pattern"]],
        drop_first=False
    ).astype(float).values
    
    # 3. Numeric features: normalized price and rating
    scaler = MinMaxScaler()
    num_features = scaler.fit_transform(df[["price_per_sqft", "rating"]])
    
    # 4. Concatenate with weights (text=0.5, categorical=0.35, numeric=0.15)
    weighted_features = np.hstack([
        text_features * 0.5,
        cat_features * 0.35,
        num_features * 0.15
    ])
    
    return weighted_features, list(tfidf.get_feature_names_out())


def compute_similarity_matrix(features: np.ndarray) -> np.ndarray:
    """Compute pairwise cosine similarity between all tiles."""
    return cosine_similarity(features)


def recommend(tile_id: int, tiles: list[dict], top_k: int = 4) -> list[dict]:
    """
    Recommend top-k most similar tiles to a given tile_id.
    
    Args:
        tile_id: ID of the query tile
        tiles: Full tile catalog
        top_k: Number of recommendations to return

    Returns:
        List of recommended tiles with similarity scores
    """
    ids = [t["id"] for t in tiles]
    if tile_id not in ids:
        raise ValueError(f"Tile ID {tile_id} not found in catalog")
    
    query_idx = ids.index(tile_id)
    
    features, _ = build_feature_matrix(tiles)
    sim_matrix = compute_similarity_matrix(features)
    
    # Get similarities for the query tile, excluding itself
    sim_scores = sim_matrix[query_idx]
    sim_scores[query_idx] = -1  # exclude self
    
    top_indices = np.argsort(sim_scores)[::-1][:top_k]
    
    return [
        {**tiles[i], "similarity_score": float(sim_scores[i])}
        for i in top_indices
    ]


def semantic_search(query: str, tiles: list[dict], top_k: int = 5) -> list[dict]:
    """
    Search tiles by a natural language query using TF-IDF similarity.
    
    This is the offline / fallback version. The production version uses
    OpenAI text-embedding-3-small + pgvector cosine search.
    
    Args:
        query: Natural language search query
        tiles: Full tile catalog
        top_k: Number of results to return

    Returns:
        List of matching tiles with relevance scores
    """
    df = pd.DataFrame(tiles)
    
    text_corpus = df.apply(
        lambda row: f"{row['description']} {row['name']} {row['color']} {row['pattern']} {row['finish']} {row['category']} {row['room']}",
        axis=1
    ).tolist()
    
    all_texts = text_corpus + [query]
    
    tfidf = TfidfVectorizer(
        max_features=200,
        stop_words="english",
        ngram_range=(1, 2),
        sublinear_tf=True
    )
    tfidf_matrix = tfidf.fit_transform(all_texts)
    
    tile_vectors = tfidf_matrix[:-1]
    query_vector = tfidf_matrix[-1]
    
    scores = cosine_similarity(query_vector, tile_vectors).flatten()
    top_indices = np.argsort(scores)[::-1][:top_k]
    
    return [
        {**tiles[i], "relevance_score": float(scores[i])}
        for i in top_indices
        if scores[i] > 0.0
    ]


def load_tiles_from_db() -> Optional[list[dict]]:
    """Load tile data from PostgreSQL (requires DATABASE_URL env var)."""
    if not DB_AVAILABLE:
        return None
    
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        return None
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, category, finish, room, color, pattern,
                   price_per_sqft, rating, description
            FROM tiles
        """)
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        cur.close()
        conn.close()
        return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        print(f"  [warn] DB connection failed: {e}. Using sample data.")
        return None


# ---------------------------------------------------------------------------
# CLI Interface
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="TileGenius ML Recommendation Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ml/recommend.py                        # Show all demo modes
  python ml/recommend.py --tile-id 3            # Recommend tiles similar to tile #3
  python ml/recommend.py --query "warm kitchen" # Semantic search
  python ml/recommend.py --tile-id 9 --top-k 3 # Top 3 similar to Calacatta Gold
        """
    )
    parser.add_argument("--tile-id", type=int, help="Tile ID to find similar tiles for")
    parser.add_argument("--query", type=str, help="Natural language search query")
    parser.add_argument("--top-k", type=int, default=4, help="Number of recommendations (default: 4)")
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("  TileGenius — ML Recommendation Engine")
    print("  Somany Ceramics AI Platform")
    print("="*60)
    
    # Load tiles
    tiles = load_tiles_from_db()
    if tiles:
        print(f"\n  [db] Loaded {len(tiles)} tiles from PostgreSQL")
    else:
        tiles = SAMPLE_TILES
        print(f"\n  [demo] Using {len(tiles)} sample tiles (set DATABASE_URL to use live data)")
    
    # Run requested mode
    if args.tile_id:
        print(f"\n  Recommendations for Tile #{args.tile_id}: '{next((t['name'] for t in tiles if t['id'] == args.tile_id), 'Unknown')}'")
        print("-"*60)
        try:
            recs = recommend(args.tile_id, tiles, args.top_k)
            for i, rec in enumerate(recs, 1):
                score_bar = "█" * int(rec["similarity_score"] * 20)
                print(f"  {i}. {rec['name']:<30} Score: {rec['similarity_score']:.3f}  {score_bar}")
                print(f"     {rec['category'].replace('_', ' ').title()} · {rec['finish'].title()} · ₹{rec['price_per_sqft']}/sqft")
        except ValueError as e:
            print(f"  Error: {e}")
    
    elif args.query:
        print(f"\n  Semantic Search: \"{args.query}\"")
        print("-"*60)
        results = semantic_search(args.query, tiles, args.top_k)
        if not results:
            print("  No matching tiles found.")
        for i, tile in enumerate(results, 1):
            score_bar = "█" * int(tile["relevance_score"] * 30)
            print(f"  {i}. {tile['name']:<30} Relevance: {tile['relevance_score']:.3f}  {score_bar}")
            print(f"     {tile['category'].replace('_', ' ').title()} · ₹{tile['price_per_sqft']}/sqft · {tile['room'].replace('_', ' ').title()}")
    
    else:
        # Demo mode: show all capabilities
        print("\n  [1/3] Content-Based Recommendation Demo")
        print("-"*60)
        demo_tile = tiles[1]  # Carrara Marble
        print(f"  Query tile: '{demo_tile['name']}' (Glossy Marble, ₹{demo_tile['price_per_sqft']}/sqft)")
        recs = recommend(demo_tile["id"], tiles, 4)
        for i, rec in enumerate(recs, 1):
            print(f"  {i}. {rec['name']:<32} sim={rec['similarity_score']:.3f}")
        
        print("\n  [2/3] Semantic Search Demo")
        print("-"*60)
        queries = [
            "warm earthy tiles for kitchen under ₹70",
            "luxury white bathroom tiles",
            "industrial grey modern floor",
        ]
        for q in queries:
            results = semantic_search(q, tiles, 2)
            print(f"  Query: \"{q}\"")
            for r in results:
                print(f"    → {r['name']} (score={r['relevance_score']:.3f})")
        
        print("\n  [3/3] Similarity Matrix (top 5 × 5)")
        print("-"*60)
        features, _ = build_feature_matrix(tiles[:5])
        sim_matrix = compute_similarity_matrix(features)
        names = [t["name"][:20] for t in tiles[:5]]
        df_sim = pd.DataFrame(sim_matrix, index=names, columns=names)
        print(df_sim.round(3).to_string())
        
        print("\n  Run with --help to see CLI options for specific lookups.")
    
    print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    main()
