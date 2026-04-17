import { Link, useLocation } from "wouter";
import { 
  Stethoscope, Leaf, Home, ScanLine, Sprout, BarChart3, FileText, 
  Menu, X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/scan", label: "Scan Crop", icon: ScanLine },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/recommend", label: "Fertilizer", icon: Sprout },
  { href: "/crops", label: "Crop Library", icon: Leaf },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2 text-primary">
          <img src="/rice-doctor-logo.png" className="w-7 h-7 rounded-md object-contain" alt="Rice Doctor AI" />
          <span className="font-semibold text-lg">Rice Doctor AI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 text-primary mb-6">
          <img src="/rice-doctor-logo.png" className="w-9 h-9 rounded-lg object-contain" alt="Rice Doctor AI" />
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight leading-tight">Rice Doctor AI</span>
            <span className="text-xs text-muted-foreground font-normal">ASEAN Disease Platform</span>
          </div>
        </div>
        <nav className="flex flex-col gap-2 p-4 md:p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block" onClick={() => setSidebarOpen(false)}>
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer
                  ${isActive 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }
                `}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full relative">
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
