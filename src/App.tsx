import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import QuiSommesNous from './pages/QuiSommesNous';
import Presentation from './pages/Presentation';
import Bureau from './pages/Bureau';
import Statuts from './pages/Statuts';
import NosInformations from './pages/NosInformations';
import Publications from './pages/Publications';
import Communiques from './pages/Communiques';
import TextesOfficiels from './pages/TextesOfficiels';
import JO from './pages/JO';
import Rapports from './pages/Rapports';
import NosLiens from './pages/NosLiens';
import ContactezNous from './pages/ContactezNous';
import Login from './pages/Login';
import JadhereAuSrh from './pages/JadhereAuSrh';
import Privacy from './pages/Privacy';
import Article from './pages/Article';

function App() {
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
          <Route path="/textes-officiels" element={<TextesOfficiels />} />
          <Route path="/jo" element={<JO />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/nos-liens" element={<NosLiens />} />
          <Route path="/contactez-nous" element={<ContactezNous />} />
          <Route path="/login" element={<Login />} />
          <Route path="/jadhere-au-srh" element={<JadhereAuSrh />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/article" element={<Article />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
