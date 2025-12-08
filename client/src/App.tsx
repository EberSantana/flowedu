import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Classes from "./pages/Classes";
import Schedule from "./pages/Schedule";
import Shifts from "./pages/Shifts";
import TimeSlots from "./pages/TimeSlots";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import BibleFooter from "./components/BibleFooter";

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
        <Route path={"/profile"} component={Profile} />
        <Route path={"/admin/users"} component={AdminUsers} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <BibleFooter />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
