import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { TimelinePage } from './pages/TimelinePage';
import { CreateMemoryPage } from './pages/CreateMemoryPage';
import { EditMemoryPage } from './pages/EditMemoryPage';
import { MemoryDetailsPage } from './pages/MemoryDetailsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <PrivateRoute>
              <TimelinePage />
            </PrivateRoute>
          } />
          <Route path="/create" element={
            <PrivateRoute>
              <CreateMemoryPage />
            </PrivateRoute>
          } />
          <Route path="/memory/:id/edit" element={
            <PrivateRoute>
              <EditMemoryPage />
            </PrivateRoute>
          } />
          <Route path="/memory/:id" element={
            <PrivateRoute>
              <MemoryDetailsPage />
            </PrivateRoute>
          } />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;