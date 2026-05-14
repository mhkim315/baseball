import { useLocation } from "wouter";
import { Home, Calendar, MapPin, Music, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "홈", icon: Home },
  { path: "/calendar", label: "일정", icon: Calendar },
  { path: "/stadium", label: "구장", icon: MapPin },
  { path: "/rank", label: "순위", icon: BarChart3 },
  { path: "/cheer", label: "응원가", icon: Music },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
      <div className="max-w-lg mx-auto px-4 pb-3 pointer-events-auto">
        <div className="bg-card/85 backdrop-blur-xl border border-border rounded-2xl shadow-lg px-2 py-1">
          <div className="flex items-center justify-around h-14">
            {navItems.map((item) => {
              const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-xl transition-all",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-normal")}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
