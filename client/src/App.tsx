import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { WidgetThemeProvider } from "./contexts/WidgetThemeContext";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Classes from "./pages/Classes";
import Schedule from "./pages/Schedule";
import Shifts from "./pages/Shifts";
import TimeSlots from "./pages/TimeSlots";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import ActiveMethodologies from "./pages/ActiveMethodologies";
import BibleFooter from "./components/BibleFooter";
import { InstallPWA } from "./components/InstallPWA";

function Router() {
  return (
    <>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/subjects"} component={Subjects} />
        <Route path={"/classes"} component={Classes} />
        <Route path={"/shifts"} component={Shifts} />
        <Route path={"/shifts/:shiftId/timeslots"} component={TimeSlots} />
        <Route path={"/schedule"} component={Schedule} />
        <Route path={"/calendar"} component={Calendar} />
        <Route path={"/active-methodologies"} component={ActiveMethodologies} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/admin/users"} component={AdminUsers} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <BibleFooter />
      <InstallPWA />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <WidgetThemeProvider>
          <SidebarProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </SidebarProvider>
        </WidgetThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
