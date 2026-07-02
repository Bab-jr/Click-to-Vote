import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import VoterLayout from '@/components/voter/VoterLayout';
import ElectionDashboard from '@/pages/ElectionDashboard';
import ElectionHistory from '@/pages/ElectionHistory';
import VoterManagement from '@/pages/VoterManagement';
import OfficerManagement from '@/pages/OfficerManagement';
import CandidateManagement from '@/pages/CandidateManagement';
import ReportsAndAudits from '@/pages/ReportsAndAudits';
import VoterDashboard from '@/pages/VoterDashboard';
import VotingScreen from '@/pages/VotingScreen';
import ConfirmInfo from '@/pages/ConfirmInfo';

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Voter routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<VoterLayout />}>
          <Route path="/vote" element={<VoterDashboard />} />
          <Route path="/vote/:electionId" element={<VotingScreen />} />
          <Route path="/confirm-info" element={<ConfirmInfo />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<ElectionDashboard />} />
          <Route path="/history" element={<ElectionHistory />} />
          <Route path="/voters" element={<VoterManagement />} />
          <Route path="/officers" element={<OfficerManagement />} />
          <Route path="/candidates" element={<CandidateManagement />} />
          <Route path="/reports" element={<ReportsAndAudits />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App