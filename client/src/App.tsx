import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import GameDetail from "./pages/GameDetail";
import CalendarPage from "./pages/CalendarPage";
import Stadium from "./pages/Stadium";
import Cheer from "./pages/Cheer";
import Standings from "./pages/Standings";
import Rules from "./pages/Rules";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/game/:id"} component={GameDetail} />
      <Route path={"/calendar"} component={CalendarPage} />
      <Route path={"/stadium"} component={Stadium} />
      <Route path={"/cheer"} component={Cheer} />
      <Route path={"/rank"} component={Standings} />
      <Route path={"/rules"} component={Rules} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Header />
          <Router />
          <BottomNav />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
