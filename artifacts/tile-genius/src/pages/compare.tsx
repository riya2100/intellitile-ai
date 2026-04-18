import { useState } from "react";
import { useListTiles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCompare, Trophy, Sparkles, X, Star, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
const API_BASE = import.meta.env.VITE_API_URL || "";

interface ComparisonResult {
  summary: string;
  aesthetics: {
    heading: string;
    insights: { tileName: string; analysis: string; score: number }[];
    winner: string;
    winnerReason: string;
  };
  priceValue: {
    heading: string;
    insights: { tileName: string; analysis: string; score: number }[];
    winner: string;
    winnerReason: string;
  };
  roomFit: {
    heading: string;
    insights: { tileName: string; bestRooms: string[]; worstRooms: string[]; analysis: string }[];
  };
  overallWinner: {
    tileName: string;
    reason: string;
  };
}

interface TileData {
  id: number;
  name: string;
  sku: string;
  category: string;
  room: string;
  finish: string;
  size: string;
  color: string;
  pricePerSqft: string;
  imageUrl?: string;
  collection?: string;
  rating?: string;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm font-bold text-primary w-8 text-right">{score}/10</span>
    </div>
  );
}

export default function Compare() {
  const { data: allTilesData, isLoading: tilesLoading } = useListTiles({ limit: 50 });
  const tiles = allTilesData?.tiles ?? [];

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<{ tiles: TileData[]; analysis: ComparisonResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addTile = (idStr: string) => {
    const id = parseInt(idStr, 10);
    if (!selectedIds.includes(id) && selectedIds.length < 3) {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const removeTile = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setResult(null);
  };

  const selectedTiles = selectedIds.map((id) => tiles.find((t) => t.id === id)).filter(Boolean) as TileData[];
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
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Comparison failed. Please try again.");
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <GitCompare className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Tile Comparison Studio</h1>
        </div>
        <p className="text-muted-foreground text-lg ml-14">
          Select up to 3 tiles and get an AI-powered comparison of aesthetics, price-per-value, and ideal room fit.
        </p>
      </div>

      {/* Tile Selector */}
      <Card className="mb-8 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Select Tiles to Compare
            <Badge variant="outline" className="ml-auto">{selectedIds.length}/3 selected</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector Dropdown */}
          {selectedIds.length < 3 && (
            <Select onValueChange={addTile} value="">
              <SelectTrigger className="w-full md:w-80">
                <SelectValue placeholder={tilesLoading ? "Loading tiles…" : "Add a tile to compare…"} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {availableTiles.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name} — ₹{t.pricePerSqft}/sqft
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Selected Tile Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AnimatePresence>
              {selectedTiles.map((tile) => (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative rounded-xl border border-border/60 overflow-hidden bg-card"
                >
                  <button
                    onClick={() => removeTile(tile.id)}
                    className="absolute top-2 right-2 z-10 bg-background/80 rounded-full p-1 hover:bg-destructive/10 transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={tile.imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop"}
                      alt={tile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm line-clamp-1">{tile.name}</p>
                    <p className="text-xs text-muted-foreground">{tile.sku} · {tile.finish.replace("_", " ")}</p>
                    <p className="text-sm font-bold text-primary mt-1">₹{tile.pricePerSqft}/sqft</p>
                  </div>
                </motion.div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: Math.max(0, 2 - selectedTiles.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="rounded-xl border-2 border-dashed border-border/40 aspect-[4/3] flex items-center justify-center text-muted-foreground/50 text-sm"
                >
                  + Add tile
                </div>
              ))}
            </AnimatePresence>
          </div>

          {/* Compare Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={runComparison}
              disabled={selectedIds.length < 2 || comparing}
              size="lg"
              className="gap-2 min-w-48"
            >
              {comparing ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  AI is analysing…
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4" />
                  Compare {selectedIds.length} Tiles
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {comparing && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/40 bg-destructive/5 p-6 text-center text-destructive">
          {error}
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !comparing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <p className="text-foreground text-base leading-relaxed">{result.analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Side-by-side data table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">At a Glance</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Attribute</th>
                      {result.tiles.map((t) => (
                        <th key={t.id} className="text-left py-2 px-4 font-semibold">{t.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { label: "Price/sqft", key: (t: TileData) => `₹${t.pricePerSqft}` },
                      { label: "Finish", key: (t: TileData) => t.finish.replace("_", " ") },
                      { label: "Size", key: (t: TileData) => t.size },
                      { label: "Room", key: (t: TileData) => t.room.replace("_", " ") },
                      { label: "Color", key: (t: TileData) => t.color },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className="py-2.5 pr-4 text-muted-foreground capitalize font-medium">{row.label}</td>
                        {result.tiles.map((t) => (
                          <td key={t.id} className="py-2.5 px-4 capitalize">{row.key(t)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Aesthetics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {result.analysis.aesthetics?.heading ?? "Aesthetic Appeal"}
                  {result.analysis.aesthetics?.winner && (
                    <Badge className="ml-auto bg-yellow-500/15 text-yellow-700 border-yellow-500/30">
                      Winner: {result.analysis.aesthetics.winner}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.analysis.aesthetics?.insights?.map((item) => (
                  <div key={item.tileName} className="bg-muted/30 rounded-xl p-4">
                    <p className="font-semibold mb-1">{item.tileName}</p>
                    <ScoreBar score={item.score} />
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.analysis}</p>
                  </div>
                ))}
                {result.analysis.aesthetics?.winnerReason && (
                  <div className="md:col-span-2 lg:col-span-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Why: </span>{result.analysis.aesthetics.winnerReason}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price-per-value */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-500" />
                  {result.analysis.priceValue?.heading ?? "Price-Per-Value"}
                  {result.analysis.priceValue?.winner && (
                    <Badge className="ml-auto bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                      Winner: {result.analysis.priceValue.winner}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.analysis.priceValue?.insights?.map((item) => (
                  <div key={item.tileName} className="bg-muted/30 rounded-xl p-4">
                    <p className="font-semibold mb-1">{item.tileName}</p>
                    <ScoreBar score={item.score} />
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.analysis}</p>
                  </div>
                ))}
                {result.analysis.priceValue?.winnerReason && (
                  <div className="md:col-span-2 lg:col-span-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Why: </span>{result.analysis.priceValue.winnerReason}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Room Fit */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best Room Fit</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.analysis.roomFit?.insights?.map((item) => (
                  <div key={item.tileName} className="bg-muted/30 rounded-xl p-4">
                    <p className="font-semibold mb-3">{item.tileName}</p>
                    {item.bestRooms?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Best for</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.bestRooms.map((r) => (
                            <span key={r} className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" />{r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.worstRooms?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Avoid in</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.worstRooms.map((r) => (
                            <span key={r} className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">
                              <XCircle className="h-3 w-3" />{r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.analysis}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Overall Winner */}
            {result.analysis.overallWinner && (
              <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 bg-primary/15 rounded-xl shrink-0">
                    <Trophy className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">AI Recommendation</p>
                    <h3 className="text-2xl font-serif font-bold mb-2">{result.analysis.overallWinner.tileName}</h3>
                    <p className="text-muted-foreground leading-relaxed">{result.analysis.overallWinner.reason}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
