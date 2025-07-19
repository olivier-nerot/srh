import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import QuiSommesNous from './pages/QuiSommesNous';
import NosInformations from './pages/NosInformations';
import TextesOfficiels from './pages/TextesOfficiels';
import NosLiens from './pages/NosLiens';
import ContactezNous from './pages/ContactezNous';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/qui-sommes-nous" element={<QuiSommesNous />} />
            <Route path="/nos-informations" element={<NosInformations />} />
            <Route path="/textes-officiels" element={<TextesOfficiels />} />
            <Route path="/nos-liens" element={<NosLiens />} />
            <Route path="/contactez-nous" element={<ContactezNous />} />
            {/* External links */}
            <Route path="/jadhere-au-srh" element={<div>Redirection vers le formulaire d'adhésion...</div>} />
          </Route>
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
