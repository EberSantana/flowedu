import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Schedules from "./pages/Schedules";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import Activities from "./pages/Activities";
import ProfessionalBands from "./pages/ProfessionalBands";
import Profile from "./pages/Profile";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/schedules"} component={Schedules} />
        <Route path={"/classes"} component={Classes} />
        <Route path={"/subjects"} component={Subjects} />
        <Route path={"/activities"} component={Activities} />
        <Route path={"/professional-bands"} component={ProfessionalBands} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        defaultColorTheme="blue"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
