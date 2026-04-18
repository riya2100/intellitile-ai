import { useState, useEffect } from "react";
import { useGenerateRoomVisualization, useGenerateMoodBoard, useListTiles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PulseLoading } from "@/components/shared/LoadingState";
import { Layers, Image as ImageIcon, Sparkles, Download, Wand2, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const ROOM_OPTIONS = [
  { label: "Living Room", value: "living_room" },
  { label: "Bedroom", value: "bedroom" },
  { label: "Kitchen", value: "kitchen" },
  { label: "Bathroom", value: "bathroom" },
  { label: "Outdoor / Patio", value: "outdoor" },
];

const STYLE_OPTIONS = [
  { label: "Modern", value: "modern" },
  { label: "Rustic / Earthy", value: "rustic" },
  { label: "Scandinavian", value: "scandinavian" },
  { label: "Royal / Luxury", value: "royal" },
  { label: "Industrial", value: "industrial" },
  { label: "Bohemian", value: "bohemian" },
  { label: "Minimalist", value: "minimalist" },
];

export default function Visualizer() {
  const searchParams = new URLSearchParams(window.location.search);
  const tileIdParam = searchParams.get("tileId");

  const [tileId, setTileId] = useState(tileIdParam || "");
  const [roomType, setRoomType] = useState("living_room");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("modern");

  const { data: tilesData } = useListTiles({ limit: 50 });
  const tiles = tilesData?.tiles || [];

  const visualizerMutation = useGenerateRoomVisualization();
  const moodBoardMutation = useGenerateMoodBoard();

  useEffect(() => {
    if (tileIdParam) {
      setTileId(tileIdParam);
    }
  }, [tileIdParam]);

  const handleVisualize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tileId) {
      toast.error("Please select a tile first");
      return;
    }
    visualizerMutation.mutate({
      data: {
        tileId: parseInt(tileId, 10),
        roomType,
        roomDescription: description,
      },
    });
  };

  const handleMoodBoard = (e: React.FormEvent) => {
    e.preventDefault();
    const anchorTileId = tileId && tileId !== "__none__" ? parseInt(tileId, 10) : undefined;
    moodBoardMutation.mutate({
      data: {
        style,
        roomType,
        tileIds: anchorTileId ? [anchorTileId] : undefined,
      },
    });
  };

  const handleDownload = () => {
    const imageBase64 = visualizerMutation.data?.imageBase64 || moodBoardMutation.data?.imageBase64;
    if (!imageBase64) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${imageBase64}`;
    link.download = `tilgenius-render-${Date.now()}.png`;
    link.click();
    toast.success("Image downloaded successfully!");
  };

  const generatedImage = visualizerMutation.data?.imageBase64 || moodBoardMutation.data?.imageBase64;
  const isGenerating = visualizerMutation.isPending || moodBoardMutation.isPending;
  const selectedTile = tiles.find((t) => String(t.id) === tileId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-serif font-bold mb-4">Design Studio Visualizer</h1>
        <p className="text-muted-foreground text-lg">
          See your tiles in context or generate complete mood boards using our generative AI engine.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Controls Panel */}
        <Card className="lg:col-span-4 border-border/50 shadow-md">
          <CardContent className="p-6">
            <Tabs defaultValue="visualizer" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="visualizer">Room Render</TabsTrigger>
                <TabsTrigger value="moodboard">Mood Board</TabsTrigger>
              </TabsList>

              {/* Room Render Tab */}
              <TabsContent value="visualizer">
                <form onSubmit={handleVisualize} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Tile</label>
                    <Select value={tileId} onValueChange={setTileId}>
                      <SelectTrigger className="h-auto min-h-[42px]">
                        <SelectValue placeholder="Choose a tile from catalog..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {tiles.map((tile) => (
                          <SelectItem key={tile.id} value={String(tile.id)}>
                            <span className="font-medium">{tile.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              {tile.finish} · ₹{tile.pricePerSqft}/sqft
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTile && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                        <img
                          src={selectedTile.thumbnailUrl || selectedTile.imageUrl || ""}
                          alt={selectedTile.name}
                          className="w-12 h-12 rounded-md object-cover border"
                        />
                        <div>
                          <p className="text-sm font-medium">{selectedTile.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedTile.sku} · {selectedTile.size}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Room Type</label>
                    <Select value={roomType} onValueChange={setRoomType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Style Notes <span className="text-muted-foreground font-normal">(Optional)</span></label>
                    <Textarea
                      placeholder="e.g. Large windows, minimalist furniture, warm lighting..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="resize-none h-24"
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isGenerating || !tileId}>
                    {isGenerating ? (
                      <>Rendering with AI...</>
                    ) : (
                      <><Wand2 className="mr-2 h-4 w-4" /> Generate Room Render</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Powered by gpt-image-1 · Takes ~10–20 seconds
                  </p>
                </form>
              </TabsContent>

              {/* Mood Board Tab */}
              <TabsContent value="moodboard">
                <form onSubmit={handleMoodBoard} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Design Style</label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Room Type</label>
                    <Select value={roomType} onValueChange={setRoomType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Anchor Tile <span className="text-muted-foreground font-normal">(Optional)</span></label>
                    <Select value={tileId} onValueChange={setTileId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a tile to anchor the board..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="__none__">No specific tile</SelectItem>
                        {tiles.map((tile) => (
                          <SelectItem key={tile.id} value={String(tile.id)}>
                            {tile.name} · {tile.finish}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Include a specific tile to anchor the board's palette.</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>Compiling Mood Board...</>
                    ) : (
                      <><Palette className="mr-2 h-4 w-4" /> Create Mood Board</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Powered by gpt-image-1 · Takes ~10–20 seconds
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Render Panel */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex-1 min-h-[520px] bg-muted/30 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative shadow-inner">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm z-10 gap-6"
                >
                  <PulseLoading />
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Generating your visualization…</p>
                    <p className="text-sm text-muted-foreground mt-1">gpt-image-1 is rendering a photorealistic scene</p>
                  </div>
                </motion.div>
              ) : generatedImage ? (
                <motion.div
                  key="image"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full h-full group"
                >
                  <img
                    src={`data:image/png;base64,${generatedImage}`}
                    alt="AI Generated Visualization"
                    className="w-full h-full object-contain bg-black/5 rounded-2xl"
                  />
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="shadow-lg backdrop-blur-md bg-white/90 hover:bg-white"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center p-8 max-w-md"
                >
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Visualize</h3>
                  <p className="text-muted-foreground">
                    Select a tile and room type on the left, then click <strong>Generate</strong> to see the AI render.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {(visualizerMutation.data?.prompt || moodBoardMutation.data?.prompt) && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-muted/50 rounded-xl border text-sm text-muted-foreground flex gap-3 items-start"
            >
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">AI Prompt Used: </span>
                {visualizerMutation.data?.prompt || moodBoardMutation.data?.prompt}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
