import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { TimelinePage } from './pages/TimelinePage';
import { CreateMemoryPage } from './pages/CreateMemoryPage';
import { EditMemoryPage } from './pages/EditMemoryPage';
import { MemoryDetailsPage } from './pages/MemoryDetailsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { RecipesPage } from './pages/RecipesPage';
import { AddEditRecipeForm } from './pages/AddEditRecipeForm';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { Header } from './components/Header';
import ScrollToTop from './ScrollToTop';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Header />
    {children}
  </>
);

// Global loading component with branding
const GlobalLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex flex-col items-center justify-center">
    <div className="text-center">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
        <svg className="w-12 h-12 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Nana's Table</h1>
      <p className="text-gray-600 mb-8">Loading your family memories...</p>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={
            <Layout>
              <PrivateRoute>
                <TimelinePage />
              </PrivateRoute>
            </Layout>
          } />
          <Route path="/create" element={
            <Layout>
              <PrivateRoute>
                <CreateMemoryPage />
              </PrivateRoute>
            </Layout>
          } />
          <Route path="/memory/:eventCode/edit" element={
            <Layout>
              <PrivateRoute>
                <EditMemoryPage />
              </PrivateRoute>
            </Layout>
          } />
          <Route path="/memory/:eventCode" element={
            <Layout>
              <PrivateRoute>
                <MemoryDetailsPage />
              </PrivateRoute>
            </Layout>
          } />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/recipes" element={<Layout><RecipesPage /></Layout>} />
          <Route path="/recipes/new" element={<Layout><AddEditRecipeForm /></Layout>} />
          <Route path="/recipes/:slug" element={<Layout><RecipeDetailPage /></Layout>} />
          <Route path="/recipes/:slug/edit" element={<Layout><AddEditRecipeForm /></Layout>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;