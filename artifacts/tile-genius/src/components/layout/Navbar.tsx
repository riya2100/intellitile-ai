import { Link, useLocation } from "wouter";
import { Sparkles, LayoutDashboard, Layers, Box, Menu, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/catalog", label: "Catalog", icon: Box },
    { href: "/visualizer", label: "Visualizer", icon: Layers },
    { href: "/compare", label: "Compare", icon: GitCompare },
    { href: "/ai-advisor", label: "AI Advisor", icon: Sparkles },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block font-serif text-xl tracking-tight text-primary">
              TileGenius
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-foreground/80 flex items-center gap-2 ${
                  location.startsWith(item.href) ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link href="/" className="flex items-center mb-6">
              <span className="font-bold font-serif text-xl text-primary">TileGenius</span>
            </Link>
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-foreground/70 transition-colors hover:text-foreground flex items-center gap-2 ${
                    location.startsWith(item.href) ? "text-foreground font-semibold" : ""
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Can add global search here if needed */}
          </div>
          <nav className="flex items-center">
            <Link href="/ai-advisor">
              <Button variant="default" size="sm" className="hidden sm:flex gap-2">
                <Sparkles className="h-4 w-4" />
                Start Design Chat
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}