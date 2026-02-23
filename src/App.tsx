import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import QuiSommesNous from "./pages/QuiSommesNous";
import Presentation from "./pages/Presentation";
import Bureau from "./pages/Bureau";
import Statuts from "./pages/Statuts";
import NosInformations from "./pages/NosInformations";
import Publications from "./pages/Publications";
import ContentItem from "./pages/ContentItem";
import Content from "./pages/Content";
import NosLiens from "./pages/NosLiens";
import ContactezNous from "./pages/ContactezNous";
import Login from "./pages/Login";
import JadhereAuSrh from "./pages/JadhereAuSrh";
import Privacy from "./pages/Privacy";
import Article from "./pages/Article";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import AdminRoute from "./components/auth/AdminRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import FAQ from "./pages/FAQ";
import Documents from "./pages/Documents";

// Lazy-loaded admin pages (code splitting)
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const AdminPublications = lazy(() => import("./pages/admin/AdminPublications"));
const AdminNewsletter = lazy(() => import("./pages/admin/AdminNewsletter"));

function App() {
  useEffect(() => {
    // Test connection via API
    fetch("/api/utils?utilType=test-connection")
      .then((res) => res.json())
      .then(() => {}) // Connection test successful
      .catch(() => {});
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
          <Route path="/item" element={<ContentItem />} />
          <Route path="/content" element={<Content />} />
          <Route path="/nos-liens" element={<NosLiens />} />
          <Route path="/contactez-nous" element={<ContactezNous />} />
          <Route path="/login" element={<Login />} />
          <Route path="/jadhere-au-srh" element={<JadhereAuSrh />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/article" element={<Article />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/documents" element={<Documents />} />
          {/* Protected User Profile Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          {/* Protected Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center min-h-[50vh]">
                      Chargement...
                    </div>
                  }
                >
                  <Routes>
                    <Route path="members" element={<AdminMembers />} />
                    <Route
                      path="publications"
                      element={<AdminPublications />}
                    />
                    <Route path="newsletter" element={<AdminNewsletter />} />
                  </Routes>
                </Suspense>
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
