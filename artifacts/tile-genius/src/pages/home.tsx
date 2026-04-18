import { Link } from "wouter";
import { Sparkles, ArrowRight, ChevronRight, TrendingUp, Zap, Shield, Layers, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetTrendingTiles, useListTiles } from "@workspace/api-client-react";
import { TileCard } from "@/components/shared/TileCard";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const ROOMS = [
  { label: "Living Room", value: "living_room", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&q=80" },
  { label: "Bedroom", value: "bedroom", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&h=300&fit=crop&q=80" },
  { label: "Kitchen", value: "kitchen", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80" },
  { label: "Bathroom", value: "bathroom", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop&q=80" },
  { label: "Outdoor", value: "outdoor", image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=400&h=300&fit=crop&q=80" },
];

const STATS = [
  { label: "Tile Designs", value: "500+" },
  { label: "Happy Customers", value: "10,000+" },
  { label: "AI Consultations", value: "50,000+" },
  { label: "Design Awards", value: "28" },
];

export default function Home() {
  const { data: trendingTiles, isLoading: isTrendingLoading } = useGetTrendingTiles();
  const { data: allTilesData, isLoading: isNewLoading } = useListTiles({ limit: 20 });
  const newArrivalTiles = allTilesData?.tiles?.filter((t) => t.isNew)?.slice(0, 4) ?? [];

  return (
    <div className="flex flex-col w-full">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-sidebar">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80"
            alt="Luxury modern interior"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide mb-4">
                SOMAI INTELLITILE AI
              </span>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
                Design with <span className="text-primary italic">Intelligence</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Discover perfect tiles using our advanced AI design assistant. Describe your dream space, visualize renders, and bring your architectural vision to life — all in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/ai-advisor">
                  <Button size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary/20 group">
                    <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    Start AI Design Chat
                  </Button>
                </Link>
                <Link href="/catalog">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-background/50 backdrop-blur-sm border-border/50">
                    Explore Catalog <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold font-serif mb-1">{s.value}</div>
                <div className="text-primary-foreground/70 text-sm font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop By Room ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-3">Shop By Room</h2>
            <p className="text-muted-foreground">Curated collections for every space in your home</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {ROOMS.map((room) => (
              <Link key={room.value} href={`/catalog?room=${room.value}`}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer shadow-md"
                >
                  <img
                    src={room.image}
                    alt={room.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-semibold text-lg">{room.label}</p>
                    <p className="text-white/70 text-xs flex items-center gap-1 mt-1">
                      Browse tiles <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Tiles ── */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-2">Trending This Season</h2>
              <p className="text-muted-foreground">Our most popular tiles, ranked by customer preference.</p>
            </div>
            <Link href="/catalog">
              <Button variant="ghost" className="group">
                View All <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {isTrendingLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {trendingTiles?.slice(0, 4).map((tile) => (
                <TileCard key={tile.id} tile={tile} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-2">New Arrivals</h2>
              <p className="text-muted-foreground">Fresh from our design studio — just added to the catalog.</p>
            </div>
            <Link href="/catalog">
              <Button variant="ghost" className="group">
                See All New <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {isNewLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {newArrivalTiles.map((tile) => (
                <TileCard key={tile.id} tile={tile} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Compare Promo Banner ── */}
      <section className="py-16 bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <GitCompare className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold mb-2">Compare Tiles Side-by-Side</h3>
                <p className="text-muted-foreground max-w-lg">
                  Select up to 3 tiles and let our AI compare aesthetics, price-per-value, finish quality, and the best rooms for each — all in one view.
                </p>
              </div>
            </div>
            <Link href="/compare">
              <Button size="lg" className="h-14 px-8 whitespace-nowrap shadow-md">
                <GitCompare className="mr-2 h-5 w-5" /> Try Tile Comparison
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Section ── */}
      <section className="py-16 bg-background border-y">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "ISI Certified", desc: "All tiles in our catalog carry Bureau of Indian Standards quality certification" },
              { icon: Zap, title: "AI in 2 Seconds", desc: "Room visualizations generated in under 2 seconds with our gpt-image-1 engine" },
              { icon: TrendingUp, title: "2+ Decades of Trust", desc: "Serving Indian homes since 1969 with award-winning ceramic craftsmanship" },
              { icon: Layers, title: "500+ Collections", desc: "From floor to feature walls — every aesthetic covered in one intelligent catalog" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=1920&q=80')] bg-cover mix-blend-overlay" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Ready to transform your space?</h2>
          <p className="text-xl text-primary-foreground/80 mb-10">
            Join thousands of interior designers and homeowners who use SOMAI IntelliTile AI to discover the perfect tile for every vision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai-advisor">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold text-primary hover:bg-white">
                Start AI Design Chat
              </Button>
            </Link>
            <Link href="/visualizer">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-white/40 text-white hover:bg-white/10">
                Try the Visualizer
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
