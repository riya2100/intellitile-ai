import { useState } from "react";
import { useListTiles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCompare, Sparkles, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface TileData {
  id: number;
  name: string;
  sku: string;
  category: string;
  room: string;
  finish: string;
  size: string;
  color: string;
  pricePerSqft: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  collection?: string;
  rating?: number;
}

interface CompareResponse {
  comparison: string;
  demoMode?: boolean;
  tilesCompared?: number;
}

export default function Compare() {
  const { data: allTilesData } = useListTiles({ limit: 50 });
  const tiles = (allTilesData?.tiles ?? []) as TileData[];

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addTile = (idStr: string) => {
    const id = parseInt(idStr, 10);
    if (!selectedIds.includes(id) && selectedIds.length < 3) {
      setSelectedIds((prev) => [...prev, id]);
      setResult(null);
      setError(null);
    }
  };

  const removeTile = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setResult(null);
    setError(null);
  };

  const selectedTiles = selectedIds
    .map((id) => tiles.find((t) => t.id === id))
    .filter(Boolean) as TileData[];

  const availableTiles = tiles.filter((t) => !selectedIds.includes(t.id));

  const runComparison = async () => {
    if (selectedIds.length < 2) return;

    setComparing(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch(`${API_BASE}/api/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileIds: selectedIds }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data?.error || "Comparison failed.");
      }

      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Comparison failed. Please try again.");
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-serif font-bold mb-4">Tile Comparison Studio</h1>
        <p className="text-muted-foreground text-lg">
          Select up to 3 tiles and compare finish, pricing, room fit, and overall recommendation.
        </p>
      </div>

      <Card className="border-border/50 shadow-md mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Select Tiles to Compare
            </h2>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {selectedIds.length}/3 selected
            </span>
          </div>

          {selectedIds.length < 3 && (
            <div className="mb-6">
              <Select onValueChange={addTile}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a tile to compare..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTiles.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} — ₹{t.pricePerSqft}/sqft
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {selectedTiles.map((tile) => (
              <div key={tile.id} className="relative border rounded-2xl overflow-hidden bg-card">
                <button
                  onClick={() => removeTile(tile.id)}
                  className="absolute top-2 right-2 z-10 bg-background/90 rounded-full p-2 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </button>

                <img
                  src={tile.imageUrl || tile.thumbnailUrl || ""}
                  alt={tile.name}
                  className="w-full h-64 object-cover"
                />

                <div className="p-4">
                  <h3 className="text-2xl font-semibold">{tile.name}</h3>
                  <p className="text-muted-foreground">
                    {tile.sku} · {tile.finish}
                  </p>
                  <p className="text-primary font-semibold text-3xl mt-3">₹{tile.pricePerSqft}/sqft</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={runComparison}
              disabled={selectedIds.length < 2 || comparing}
              className="h-12 px-8 text-lg font-semibold"
            >
              <GitCompare className="mr-2 h-5 w-5" />
              {comparing ? "Comparing..." : `Compare ${selectedIds.length} Tiles`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-600 rounded-2xl p-6 text-lg">
          {error}
        </div>
      )}

      {result && !comparing && (
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Comparison Result</h2>
              {result.demoMode && (
                <span className="text-sm bg-muted px-3 py-1 rounded-full text-muted-foreground">
                  Demo comparison mode
                </span>
              )}
            </div>

            <div className="whitespace-pre-line leading-8 text-lg text-foreground">
              {result.comparison}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
