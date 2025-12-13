import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SidebarProvider } from "./contexts/SidebarContext";
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
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import LearningPaths from "./pages/LearningPaths";
import StudentDashboard from "./pages/StudentDashboard";
import StudentSubjectView from "./pages/StudentSubjectView";
import ManageEnrollments from "./pages/ManageEnrollments";
import TopicMaterialsManager from "./pages/TopicMaterialsManager";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import SubjectEnrollments from "./pages/SubjectEnrollments";
import PortalChoice from "./pages/PortalChoice";
import StudentLogin from "./pages/StudentLogin";
import BibleFooter from "./components/BibleFooter";
import { InstallPWA } from "./components/InstallPWA";
import OfflineIndicator from "./components/OfflineIndicator";

function Router() {
  return (
    <>
      <Switch>
        <Route path={"/"} component={PortalChoice} />
        <Route path={"/student-login"} component={StudentLogin} />
        <Route path={"dashboard"} component={Dashboard} />
        <Route path={"/subjects"} component={Subjects} />
        <Route path={"/classes"} component={Classes} />
        <Route path={"/shifts"} component={Shifts} />
        <Route path={"/shifts/:shiftId/timeslots"} component={TimeSlots} />
        <Route path={"/schedule"} component={Schedule} />
        <Route path={"/calendar"} component={Calendar} />
        <Route path={"/reports"} component={Reports} />
        <Route path={"/learning-paths"} component={LearningPaths} />
        <Route path={"/active-methodologies"} component={ActiveMethodologies} />
        <Route path={"/tasks"} component={Tasks} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/admin/users"} component={AdminUsers} />
        <Route path={"/student-dashboard"} component={StudentDashboard} />
        <Route path={"/student/subject/:subjectId/:professorId"} component={StudentSubjectView} />
        <Route path={"/subjects/:subjectId/enrollments"} component={ManageEnrollments} />
        <Route path={"/learning-paths/:subjectId/topic/:topicId/materials"} component={TopicMaterialsManager} />
        <Route path={"/students"} component={Students} />
        <Route path={"/students/:id"} component={StudentProfile} />
        <Route path={"/subjects/:id/enrollments"} component={SubjectEnrollments} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <OfflineIndicator />
      <BibleFooter />
      <InstallPWA />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SidebarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
