import { useLocation } from "wouter";
import { Home, Calendar, MapPin, Music, BarChart3, BookOpen } from "lucide-react";

const navItems = [
  { path: "/", label: "홈", icon: Home },
  { path: "/calendar", label: "캘린더", icon: Calendar },
  { path: "/stadium", label: "구장안내", icon: MapPin },
  { path: "/cheer", label: "응원", icon: Music },
  { path: "/rank", label: "순위", icon: BarChart3 },
  { path: "/rules", label: "규칙", icon: BookOpen },
];

export default function Header() {
  const [location, setLocation] = useLocation();

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => setLocation("/")}
          className="text-xl font-bold tracking-tight text-foreground"
        >
          fullcount.kr
        </button>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  isActive
                    ? "bg-foreground text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
