import { useState } from "react";
import { Search, Filter, Sparkles, X, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useListTiles, useGetAiRecommendations } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { TileCard } from "@/components/shared/TileCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [room, setRoom] = useState<string | undefined>(undefined);
  const [finish, setFinish] = useState<string | undefined>(undefined);
  const [isAiSearch, setIsAiSearch] = useState(false);

  const { data: listData, isLoading: isListLoading } = useListTiles(
    {
      search: debouncedSearch || undefined,
      category: category !== "all" ? category : undefined,
      room: room !== "all" ? room : undefined,
      finish: finish !== "all" ? finish : undefined,
      limit: 20,
    },
    { query: { enabled: !isAiSearch } }
  );

  const aiSearchMutation = useGetAiRecommendations();

  const handleAiSearch = () => {
    if (!searchTerm) return;
    setIsAiSearch(true);
    aiSearchMutation.mutate({
      data: {
        query: searchTerm,
        roomType: room !== "all" ? room : undefined,
      },
    });
  };

  const clearAiSearch = () => {
    setIsAiSearch(false);
    setSearchTerm("");
    aiSearchMutation.reset();
  };

  const clearAllFilters = () => {
    setRoom(undefined);
    setCategory(undefined);
    setFinish(undefined);
    clearAiSearch();
  };

  const displayedTiles = isAiSearch ? aiSearchMutation.data?.tiles : listData?.tiles;
  const isLoading = isAiSearch ? aiSearchMutation.isPending : isListLoading;
  const totalCount = isAiSearch ? aiSearchMutation.data?.tiles?.length : listData?.total;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Tile Catalog</h1>
          <p className="text-muted-foreground">
            {totalCount != null ? (
              <span><strong className="text-foreground">{totalCount}</strong> tiles found</span>
            ) : (
              "Browse our entire collection or use AI to find exactly what you need."
            )}
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search or describe what you want..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (isAiSearch) setIsAiSearch(false);
              }}
              className="pl-9 border-border focus-visible:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={clearAiSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            onClick={handleAiSearch}
            disabled={!searchTerm || aiSearchMutation.isPending}
            className="whitespace-nowrap"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI Search
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="flex items-center gap-2 font-semibold pb-2 border-b">
              <Filter className="h-4 w-4" /> Filters
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Room</label>
              <Select value={room} onValueChange={setRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  <SelectItem value="living_room">Living Room</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="bathroom">Bathroom</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="ceramic_wall">Ceramic Wall</SelectItem>
                  <SelectItem value="ceramic_floor">Ceramic Floor</SelectItem>
                  <SelectItem value="polished_vitrified">Polished Vitrified</SelectItem>
                  <SelectItem value="glazed_vitrified">Glazed Vitrified</SelectItem>
                  <SelectItem value="large_slab">Large Slab</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Finish</label>
              <Select value={finish} onValueChange={setFinish}>
                <SelectTrigger>
                  <SelectValue placeholder="All Finishes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Finishes</SelectItem>
                  <SelectItem value="matte">Matte</SelectItem>
                  <SelectItem value="glossy">Glossy</SelectItem>
                  <SelectItem value="satin">Satin</SelectItem>
                  <SelectItem value="textured">Textured</SelectItem>
                  <SelectItem value="rustic">Rustic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="w-full" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {isAiSearch && aiSearchMutation.data && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card className="bg-primary/5 border-primary/20 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <Sparkles className="h-5 w-5" /> AI Recommendations
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearAiSearch} className="h-8">
                        Clear
                      </Button>
                    </div>
                    <p className="text-foreground/90 leading-relaxed italic border-l-4 border-primary/30 pl-4 py-1">
                      "{aiSearchMutation.data.reasoning}"
                    </p>
                    {aiSearchMutation.data.styleProfile && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Detected Style:</span>
                        <Badge variant="secondary" className="capitalize">
                          {aiSearchMutation.data.styleProfile}
                        </Badge>
                      </div>
                    )}
                    {aiSearchMutation.data.alternativeSuggestions && aiSearchMutation.data.alternativeSuggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground font-semibold mb-2">Also consider:</p>
                        <div className="flex flex-wrap gap-2">
                          {aiSearchMutation.data.alternativeSuggestions.map((s: string, i: number) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full border">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <LoadingState />
          ) : !displayedTiles || displayedTiles.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-xl border border-dashed bg-muted/10">
              <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No tiles found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
              <Button variant="outline" className="mt-6" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {displayedTiles.map((tile) => (
                <TileCard key={tile.id} tile={tile} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
