import { useRoute } from "wouter";
import { useGetTile, useGetSimilarTiles } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Layers, Sparkles, Ruler, Palette, MapPin, Tag, Star, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { TileCard } from "@/components/shared/TileCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function TileDetail() {
  const [match, params] = useRoute("/tile/:id");
  const id = match ? parseInt(params.id, 10) : 0;

  const { data: tile, isLoading: isTileLoading } = useGetTile(id, { 
    query: { enabled: !!id, queryKey: ['/api/tiles', id] } 
  });
  
  const { data: similarTiles, isLoading: isSimilarLoading } = useGetSimilarTiles(id, {
    query: { enabled: !!id, queryKey: ['/api/tiles/similar', id] }
  });

  if (isTileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!tile) return <div className="p-8 text-center">Tile not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/catalog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mb-20">
        {/* Left: Image */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative aspect-square rounded-2xl overflow-hidden bg-muted border"
        >
          <img 
            src={tile.imageUrl || `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80`} 
            alt={tile.name}
            className="object-cover w-full h-full"
          />
          {tile.isBestSeller && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary px-3 py-1 text-sm shadow-md">Best Seller</Badge>
            </div>
          )}
        </motion.div>

        {/* Right: Details */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col"
        >
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="uppercase tracking-wider">{tile.collection || 'Standard Collection'}</span>
            <span>•</span>
            <span>SKU: {tile.sku}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">{tile.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              <span className="ml-1.5 font-medium text-lg text-foreground">{tile.rating || "4.8"}</span>
              <span className="ml-1 text-muted-foreground text-sm">({tile.reviewCount || "124"} reviews)</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-2xl font-bold text-primary">₹{tile.pricePerSqft}<span className="text-base font-normal text-muted-foreground">/sqft</span></div>
          </div>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {tile.description}
          </p>

          <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-10 py-6 border-y">
            <DetailItem icon={MapPin} label="Ideal For" value={tile.room.replace('_', ' ')} />
            <DetailItem icon={Tag} label="Category" value={tile.category.replace('_', ' ')} />
            <DetailItem icon={Ruler} label="Size" value={tile.size} />
            <DetailItem icon={Sparkles} label="Finish" value={tile.finish.replace('_', ' ')} />
            <DetailItem icon={Palette} label="Color" value={tile.color} />
            {tile.pattern && <DetailItem icon={Layers} label="Pattern" value={tile.pattern} />}
          </div>

          <div className="mt-auto flex flex-col sm:flex-row gap-4">
            <Link href={`/visualizer?tileId=${tile.id}`}>
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 shadow-md">
                <Layers className="mr-2 h-5 w-5" /> Visualize in Room
              </Button>
            </Link>
            <Link href={`/ai-advisor?reference=${tile.id}`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 border-primary text-primary hover:bg-primary/5">
                <Sparkles className="mr-2 h-5 w-5" /> Ask AI Advisor
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Similar Tiles Section */}
      <div className="py-12 border-t">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-serif font-bold">AI Recommended Similar Tiles</h2>
        </div>

        {isSimilarLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
            ))}
          </div>
        ) : similarTiles && similarTiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {similarTiles.slice(0, 4).map((t) => (
              <TileCard key={t.id} tile={t} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No similar tiles found.</p>
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-muted rounded-md text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
        <p className="font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}