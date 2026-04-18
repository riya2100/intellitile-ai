import { Link } from "wouter";
import { Star, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tile } from "@workspace/api-client-react/src/generated/api.schemas";
import { motion } from "framer-motion";

interface TileCardProps {
  tile: Tile;
}

export function TileCard({ tile }: TileCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/tile/${tile.id}`}>
        <Card className="overflow-hidden group cursor-pointer border-border/50 hover:border-primary/50 transition-colors h-full flex flex-col">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={tile.imageUrl || `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80`}
              alt={tile.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              {tile.isNew && <Badge variant="secondary" className="bg-white/90 text-black backdrop-blur-sm shadow-sm border-none font-medium">New</Badge>}
              {tile.isBestSeller && <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm shadow-sm border-none font-medium">Best Seller</Badge>}
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white flex items-center gap-2 font-medium">
                View Details <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
          <CardContent className="p-4 flex-1">
            <div className="flex justify-between items-start mb-2 gap-2">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{tile.name}</h3>
                <p className="text-sm text-muted-foreground">{tile.sku}</p>
              </div>
              <Badge variant="outline" className="capitalize whitespace-nowrap">{tile.finish.replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-yellow-500 mt-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium text-foreground">{tile.rating || "4.8"}</span>
              <span className="text-muted-foreground ml-1">({tile.reviewCount || Math.floor(Math.random() * 100) + 10})</span>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-border/50 mt-auto">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Price per sqft</span>
              <span className="text-lg font-bold text-primary">₹{tile.pricePerSqft}</span>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <p className="capitalize">{tile.room.replace('_', ' ')}</p>
              <p>{tile.size}</p>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}