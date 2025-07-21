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