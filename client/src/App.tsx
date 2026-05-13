import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/DocumentDetail";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import Feedback from "./pages/Feedback";
import FeedbackManagement from "./pages/FeedbackManagement";
import KnowledgeBasesPage from "./pages/KnowledgeBasesPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import DatabaseControlPanel from "./pages/DatabaseControlPanel";
import ApiDocumentation from "./pages/ApiDocumentation";
import Settings from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/" component={Home} />
      <Route path="/upload" component={Upload} />
      <Route path="/documents" component={Documents} />
      <Route path="/documents/:id" component={DocumentDetail} />
      <Route path="/admin" component={Admin} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/feedback-management" component={FeedbackManagement} />
      <Route path="/knowledge-bases" component={KnowledgeBasesPage} />
      <Route path="/api-keys" component={ApiKeysPage} />
      <Route path="/database" component={DatabaseControlPanel} />
      <Route path="/api-docs" component={ApiDocumentation} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
        // switchable
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
