import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import BibleFooter from "./components/BibleFooter";
import { InstallPWA } from "./components/InstallPWA";
import OfflineIndicator from "./components/OfflineIndicator";
import { CommandPalette } from "./components/CommandPalette";

// Páginas críticas carregadas imediatamente (login/portal)
import PortalChoice from "./pages/PortalChoice";
import StudentLogin from "./pages/StudentLogin";
import TeacherLogin from "./pages/TeacherLogin";
import NotFound from "./pages/NotFound";

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Lazy loaded pages - Teacher Portal
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Subjects = lazy(() => import("./pages/Subjects"));
const SubjectCTStats = lazy(() => import("./pages/SubjectCTStats"));
const Classes = lazy(() => import("./pages/Classes"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Shifts = lazy(() => import("./pages/Shifts"));
const TimeSlots = lazy(() => import("./pages/TimeSlots"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const ActiveMethodologies = lazy(() => import("./pages/ActiveMethodologies"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Reports = lazy(() => import("./pages/Reports"));
const LearningAnalytics = lazy(() => import("./pages/LearningAnalytics").then(m => ({ default: m.LearningAnalytics })));
const LearningPaths = lazy(() => import("./pages/LearningPaths"));
const ManageEnrollments = lazy(() => import("./pages/ManageEnrollments"));
const TopicMaterialsManager = lazy(() => import("./pages/TopicMaterialsManager"));
const Students = lazy(() => import("./pages/Students"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const SubjectEnrollments = lazy(() => import("./pages/SubjectEnrollments"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Questions = lazy(() => import("./pages/Questions"));
const QuestionDetail = lazy(() => import("./pages/QuestionDetail"));
const ExercisePerformanceReport = lazy(() => import("./pages/ExercisePerformanceReport"));

// Lazy loaded pages - Student Portal
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const StudentSubjectView = lazy(() => import("./pages/StudentSubjectView"));
const StudentSubjectDetails = lazy(() => import("./pages/StudentSubjectDetails"));
const StudentAnnouncements = lazy(() => import("./pages/StudentAnnouncements"));
const StudentSubjects = lazy(() => import("./pages/StudentSubjects"));
const StudentLearningPaths = lazy(() => import("./pages/StudentLearningPaths"));
const StudentLearningPathDetail = lazy(() => import("./pages/StudentLearningPathDetail"));
const StudentProfilePage = lazy(() => import("./pages/StudentProfilePage"));
const StudentExercises = lazy(() => import("./pages/StudentExercises"));
const StudentExerciseAttempt = lazy(() => import("./pages/StudentExerciseAttempt"));
const StudentExerciseResults = lazy(() => import("./pages/StudentExerciseResults"));
const StudentExerciseReview = lazy(() => import("./pages/StudentExerciseReview"));
const StudentReview = lazy(() => import("./pages/StudentReview"));
const StudentSmartReview = lazy(() => import("./pages/StudentSmartReview"));
const StudentSmartReviewItem = lazy(() => import("./pages/StudentSmartReviewItem"));
const StudentSubmitQuestion = lazy(() => import("./pages/StudentSubmitQuestion"));
const StudentMyQuestions = lazy(() => import("./pages/StudentMyQuestions"));
const StudentLearningJournal = lazy(() => import("./pages/StudentLearningJournal"));
const StudentDoubts = lazy(() => import("./pages/StudentDoubts"));
const StudentStatistics = lazy(() => import("./pages/StudentStatistics"));
const StudentNotebook = lazy(() => import("./pages/StudentNotebook"));
// MistakeNotebook removido - funcionalidade consolidada em StudentSmartReview

// Lazy loaded pages - Auth
const Register = lazy(() => import("./pages/Register"));
const TeacherRegister = lazy(() => import("./pages/TeacherRegister"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ClearSession = lazy(() => import("./pages/ClearSession"));

function Router() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Portal principal - carregado imediatamente */}
          <Route path={"/"} component={PortalChoice} />
          <Route path={"/student-login"} component={StudentLogin} />
          <Route path={"/login-professor"} component={TeacherLogin} />
          
          {/* Auth pages - lazy loaded */}
          <Route path={"/register"} component={Register} />
          <Route path={"/cadastro-professor"} component={TeacherRegister} />
          <Route path={"/esqueci-senha"} component={ForgotPassword} />
          <Route path={"/redefinir-senha"} component={ResetPassword} />
          <Route path={"/clear-session"} component={ClearSession} />

          {/* Teacher Portal - lazy loaded */}
          <Route path={"/dashboard"} component={Dashboard} />
          <Route path={"/subjects"} component={Subjects} />
          <Route path={"/subjects/:id/ct-stats"} component={SubjectCTStats} />
          <Route path={"/classes"} component={Classes} />
          <Route path={"/shifts"} component={Shifts} />
          <Route path={"/shifts/:shiftId/timeslots"} component={TimeSlots} />
          <Route path={"/schedule"} component={Schedule} />
          <Route path={"/calendar"} component={Calendar} />
          <Route path={"/reports"} component={Reports} />
          <Route path={"/learning-analytics"} component={LearningAnalytics} />
          <Route path="/exercise-performance" component={ExercisePerformanceReport} />
          <Route path={"/learning-paths"} component={LearningPaths} />
          <Route path={"/active-methodologies"} component={ActiveMethodologies} />
          <Route path={"/tasks"} component={Tasks} />
          <Route path={"/announcements"} component={Announcements} />
          <Route path={"/profile"} component={Profile} />
          <Route path={"/admin/users"} component={AdminUsers} />
          <Route path={"/subjects/:subjectId/enrollments"} component={ManageEnrollments} />
          <Route path={"/learning-paths/:subjectId/topic/:topicId/materials"} component={TopicMaterialsManager} />
          <Route path={"/students"} component={Students} />
          <Route path={"/students/:id"} component={StudentProfile} />
          <Route path={"/:subjectId/enrollments"} component={SubjectEnrollments} />
          <Route path={"/questions"} component={Questions} />
          <Route path={"/questions/:id"} component={QuestionDetail} />

          {/* Student Portal - lazy loaded */}
          <Route path={"/student-dashboard"} component={StudentDashboard} />
          <Route path={"/student-subjects"} component={StudentSubjects} />
          <Route path={"/student-learning-paths"} component={StudentLearningPaths} />
          <Route path={"/student/learning-path/:subjectId/:professorId"} component={StudentLearningPathDetail} />
          <Route path={"/student-announcements"} component={StudentAnnouncements} />
          <Route path={"/student-profile"} component={StudentProfilePage} />
          <Route path={"/student-exercises"} component={StudentExercises} />
          <Route path={"/student-exercises/:id/attempt"} component={StudentExerciseAttempt} />
          <Route path={"/student-exercises/:id/results/:attemptId"} component={StudentExerciseResults} />
          <Route path={"/student-exercises/:id/review"} component={StudentExerciseReview} />
          <Route path={"/student-review"} component={StudentReview} />
          <Route path={"/student/smart-review"} component={StudentSmartReview} />
          <Route path={"/student/smart-review/:id"} component={StudentSmartReviewItem} />
          <Route path={"/student/subject/:subjectId/:professorId"} component={StudentSubjectView} />
          <Route path={"/student/subject-details/:subjectId/:professorId"} component={StudentSubjectDetails} />
          <Route path={"/student/submit-question"} component={StudentSubmitQuestion} />
          <Route path={"/student/my-questions"} component={StudentMyQuestions} />
          <Route path={"/student/learning-journal"} component={StudentLearningJournal} />
          <Route path={"/student/doubts"} component={StudentDoubts} />
          <Route path={"/student/statistics"} component={StudentStatistics} />
          <Route path={"/student/notebook"} component={StudentNotebook} />
          {/* MistakeNotebook removido - usar /student/smart-review */}

          {/* 404 */}
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
      <OfflineIndicator />
      <BibleFooter />
      <InstallPWA />
      <CommandPalette />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" switchable={true}>
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
