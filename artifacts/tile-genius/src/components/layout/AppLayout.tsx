import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}