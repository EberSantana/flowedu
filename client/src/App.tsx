import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import SubjectCTStats from "./pages/SubjectCTStats";
import Classes from "./pages/Classes";
import Schedule from "./pages/Schedule";
import Shifts from "./pages/Shifts";
import TimeSlots from "./pages/TimeSlots";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import ProfileSelection from "./pages/ProfileSelection";
import AdminUsers from "./pages/AdminUsers";
import ActiveMethodologies from "./pages/ActiveMethodologies";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import LearningPaths from "./pages/LearningPaths";
import StudentDashboard from "./pages/StudentDashboard";
import StudentSubjectView from "./pages/StudentSubjectView";
import StudentSubjectDetails from "./pages/StudentSubjectDetails";
import ManageEnrollments from "./pages/ManageEnrollments";
import TopicMaterialsManager from "./pages/TopicMaterialsManager";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import SubjectEnrollments from "./pages/SubjectEnrollments";
import PortalChoice from "./pages/PortalChoice";
import StudentLogin from "./pages/StudentLogin";
import Register from "./pages/Register";
import TeacherRegister from "./pages/TeacherRegister";
import TeacherLogin from "./pages/TeacherLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Announcements from "./pages/Announcements";
import StudentAnnouncements from "./pages/StudentAnnouncements";
import StudentSubjects from "./pages/StudentSubjects";
import StudentLearningPaths from "./pages/StudentLearningPaths";
import StudentLearningPathDetail from "./pages/StudentLearningPathDetail";
import StudentProfilePage from "./pages/StudentProfilePage";
import StudentExercises from "./pages/StudentExercises";
import StudentExerciseAttempt from "./pages/StudentExerciseAttempt";
import StudentExerciseResults from "./pages/StudentExerciseResults";
import ExercisePerformanceReport from "./pages/ExercisePerformanceReport";
import TeacherReviewAnswers from "./pages/TeacherReviewAnswers";
import StudentReview from "./pages/StudentReview";
import BibleFooter from "./components/BibleFooter";
import { InstallPWA } from "./components/InstallPWA";
import OfflineIndicator from "./components/OfflineIndicator";
import { TeacherAddActivity } from "./pages/TeacherAddActivity";

function Router() {
  return (
    <>
      <Switch>
        <Route path={"/"} component={PortalChoice} />
        <Route path={"/student-login"} component={StudentLogin} />
        <Route path={"/register"} component={Register} />
        <Route path={"/cadastro-professor"} component={TeacherRegister} />
        <Route path={"/login-professor"} component={TeacherLogin} />
        <Route path={"/esqueci-senha"} component={ForgotPassword} />
        <Route path={"/redefinir-senha"} component={ResetPassword} />
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/subjects"} component={Subjects} />
        <Route path={"/subjects/:id/ct-stats"} component={SubjectCTStats} />
        <Route path={"/classes"} component={Classes} />
        <Route path={"/shifts"} component={Shifts} />
        <Route path={"/shifts/:shiftId/timeslots"} component={TimeSlots} />
        <Route path={"/schedule"} component={Schedule} />
        <Route path={"/calendar"} component={Calendar} />
        <Route path={"/reports"} component={Reports} />
        <Route path="/exercise-performance" component={ExercisePerformanceReport} />
        <Route path="/teacher-review-answers" component={TeacherReviewAnswers} />
        <Route path={"/learning-paths"} component={LearningPaths} />
        <Route path={"/active-methodologies"} component={ActiveMethodologies} />
        <Route path={"/tasks"} component={Tasks} />
        <Route path={"/announcements"} component={Announcements} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/profile-selection"} component={ProfileSelection} />
        <Route path={"/admin/users"} component={AdminUsers} />
        <Route path={"/student-dashboard"} component={StudentDashboard} />
        <Route path={"/student-subjects"} component={StudentSubjects} />
        <Route path={"/student-learning-paths"} component={StudentLearningPaths} />
        <Route path={"/student/learning-path/:subjectId/:professorId"} component={StudentLearningPathDetail} />
        <Route path={"/student-announcements"} component={StudentAnnouncements} />
        <Route path={"/student-profile"} component={StudentProfilePage} />
        <Route path={"/student-exercises"} component={StudentExercises} />
        <Route path={"/student-exercises/:id/attempt"} component={StudentExerciseAttempt} />
        <Route path={"/student-exercises/:id/results/:attemptId"} component={StudentExerciseResults} />
        <Route path={"/student-review"} component={StudentReview} />
        <Route path={"/student/subject/:subjectId/:professorId"} component={StudentSubjectView} />
        <Route path={"/student/subject-details/:subjectId/:professorId"} component={StudentSubjectDetails} />
        <Route path={"/subjects/:subjectId/enrollments"} component={ManageEnrollments} />
        <Route path={"/learning-paths/:subjectId/topic/:topicId/materials"} component={TopicMaterialsManager} />
        <Route path={"/students"} component={Students} />
        <Route path={"/students/:id"} component={StudentProfile} />
        <Route path={"/:subjectId/enrollments"} component={SubjectEnrollments} />
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
            <Router />
          </TooltipProvider>
        </SidebarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
