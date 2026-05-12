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

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-normal"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
