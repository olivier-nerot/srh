import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
// Removed direct turso import - now using API
import HomePage from './pages/HomePage';
import QuiSommesNous from './pages/QuiSommesNous';
import Presentation from './pages/Presentation';
import Bureau from './pages/Bureau';
import Statuts from './pages/Statuts';
import NosInformations from './pages/NosInformations';
import Publications from './pages/Publications';
import Communiques from './pages/Communiques';
import Content from './pages/Content';
import TextesOfficiels from './pages/TextesOfficiels';
import JO from './pages/JO';
import Rapports from './pages/Rapports';
import NosLiens from './pages/NosLiens';
import ContactezNous from './pages/ContactezNous';
import Login from './pages/Login';
import JadhereAuSrh from './pages/JadhereAuSrh';
import Privacy from './pages/Privacy';
import Article from './pages/Article';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import AdminMembers from './pages/admin/AdminMembers';
import AdminPublications from './pages/admin/AdminPublications';
import AdminJO from './pages/admin/AdminJO';
import AdminRoute from './components/auth/AdminRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import FAQ from './pages/FAQ';

function App() {
  useEffect(() => {
    // Test connection via API
    fetch('/api/test-connection')
      .then(res => res.json())
      .then(result => console.log('Connection test:', result))
      .catch(err => console.error('Connection test failed:', err));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/qui-sommes-nous" element={<QuiSommesNous />} />
          <Route path="/presentation" element={<Presentation />} />
          <Route path="/bureau" element={<Bureau />} />
          <Route path="/statuts" element={<Statuts />} />
          <Route path="/nos-informations" element={<NosInformations />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/communiques" element={<Communiques />} />
          <Route path="/content" element={<Content />} />
          <Route path="/textes-officiels" element={<TextesOfficiels />} />
          <Route path="/jo" element={<JO />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/nos-liens" element={<NosLiens />} />
          <Route path="/contactez-nous" element={<ContactezNous />} />
          <Route path="/login" element={<Login />} />
          <Route path="/jadhere-au-srh" element={<JadhereAuSrh />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/article" element={<Article />} />
          <Route path="/faq" element={<FAQ />} />
          {/* Protected User Profile Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/profile/edit" element={
            <ProtectedRoute>
              <ProfileEdit />
            </ProtectedRoute>
          } />
          {/* Protected Admin Routes */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <Routes>
                <Route path="members" element={<AdminMembers />} />
                <Route path="publications" element={<AdminPublications />} />
                <Route path="communiques" element={<Communiques />} />
                <Route path="jo" element={<AdminJO />} />
                {/* Add more admin routes here */}
              </Routes>
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
