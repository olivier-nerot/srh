import React, { useState } from 'react';
import franceMap from '../assets/images/france-map.png';

// Regional delegates data
const regionDelegates = {
  'ile-de-france': {
    name: 'Île-de-France',
    delegates: [
      { name: 'Dr M. ZINS', city: 'PARIS' },
      { name: 'Pr H. KOBEITER', city: 'PARIS' },
      { name: 'Dr N. PYATIGORSKAYA', city: 'PARIS' },
      { name: 'Dr F. AMRAR-VENNIER', city: 'CORBEIL-ESSONNES' }
    ]
  },
  'hauts-de-france': {
    name: 'Hauts-de-France',
    delegates: [
      { name: 'Pr F. PONTANA', city: 'LILLE' }
    ]
  },
  'bretagne': {
    name: 'Bretagne', 
    delegates: [
      { name: 'Dr J-F. HEAUTOT', city: 'RENNES' },
      { name: 'Pr J-Y. GAUVRIT', city: 'RENNES' }
    ]
  },
  'normandie': {
    name: 'Normandie',
    delegates: [
      { name: 'Pr C. SAVOIE COLLET', city: 'ROUEN' }
    ]
  },
  'nouvelle-aquitaine': {
    name: 'Nouvelle-Aquitaine',
    delegates: [
      { name: 'Dr J. BERGE', city: 'BORDEAUX' },
      { name: 'Pr J.-F. CHATEIL', city: 'BORDEAUX' }
    ]
  },
  'occitanie': {
    name: 'Occitanie',
    delegates: [
      { name: 'Pr P. TAOUREL', city: 'MONTPELLIER' },
      { name: 'Dr. Julien FRANDON', city: 'NIMES' }
    ]
  },
  'provence-alpes': {
    name: 'Provence-Alpes-Côte d\'Azur',
    delegates: [
      { name: 'Pr P. CHAMPSAUR', city: 'MARSEILLE' }
    ]
  },
  'auvergne-rhone': {
    name: 'Auvergne-Rhône-Alpes',
    delegates: [
      { name: 'Pr A. KRAINIK', city: 'GRENOBLE' }
    ]
  },
  'grand-est': {
    name: 'Grand Est',
    delegates: [
      { name: 'Dr P. CART', city: 'CHARLEVILLE-MEZIERES' }
    ]
  },
  'bourgogne': {
    name: 'Bourgogne-Franche-Comté',
    delegates: [
      { name: 'Dr J-B. TUETEY', city: 'CHALON S/SAONE' }
    ]
  }
};

const InteractiveMap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  return (
    <div className="relative w-full h-96">
      {/* France Map Background */}
      <div 
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${franceMap})`,
          backgroundSize: 'contain'
        }}
      />
      
      {/* Interactive overlay with clickable regions */}
      <svg viewBox="0 0 590 562" className="w-full h-full relative z-10">
        {/* Île-de-France - positioned around Paris area */}
        <circle 
          cx="295" cy="220" r="18"
          className={`cursor-pointer transition-all ${selectedRegion === 'ile-de-france' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'ile-de-france' ? null : 'ile-de-france')}
        />
        <text x="295" y="226" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">IDF</text>
        
        {/* Hauts-de-France - positioned in north */}
        <circle 
          cx="270" cy="130" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'hauts-de-france' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'hauts-de-france' ? null : 'hauts-de-france')}
        />
        <text x="270" y="135" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">HDF</text>
        
        {/* Bretagne - positioned in west */}
        <circle 
          cx="140" cy="220" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'bretagne' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'bretagne' ? null : 'bretagne')}
        />
        <text x="140" y="225" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">BRT</text>
        
        {/* Normandie - positioned in northwest */}
        <circle 
          cx="220" cy="160" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'normandie' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'normandie' ? null : 'normandie')}
        />
        <text x="220" y="165" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">NOR</text>
        
        {/* Nouvelle-Aquitaine - positioned in southwest */}
        <circle 
          cx="180" cy="350" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'nouvelle-aquitaine' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'nouvelle-aquitaine' ? null : 'nouvelle-aquitaine')}
        />
        <text x="180" y="355" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">NAQ</text>
        
        {/* Occitanie - positioned in south center */}
        <circle 
          cx="280" cy="400" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'occitanie' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'occitanie' ? null : 'occitanie')}
        />
        <text x="280" y="405" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">OCC</text>
        
        {/* Provence-Alpes-Côte d'Azur - positioned in southeast */}
        <circle 
          cx="420" cy="410" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'provence-alpes' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'provence-alpes' ? null : 'provence-alpes')}
        />
        <text x="420" y="415" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">PAC</text>
        
        {/* Auvergne-Rhône-Alpes - positioned in east center */}
        <circle 
          cx="380" cy="300" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'auvergne-rhone' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'auvergne-rhone' ? null : 'auvergne-rhone')}
        />
        <text x="380" y="305" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">ARA</text>
        
        {/* Grand Est - positioned in northeast */}
        <circle 
          cx="420" cy="180" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'grand-est' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'grand-est' ? null : 'grand-est')}
        />
        <text x="420" y="185" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">GE</text>
        
        {/* Bourgogne-Franche-Comté - positioned in east center */}
        <circle 
          cx="350" cy="240" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'bourgogne' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'bourgogne' ? null : 'bourgogne')}
        />
        <text x="350" y="245" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">BFC</text>
      </svg>
      
      {/* Selected Region Info Card */}
      {selectedRegion && regionDelegates[selectedRegion] && (
        <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-xs border border-gray-200">
          <h4 className="font-bold text-srh-blue mb-2">{regionDelegates[selectedRegion].name}</h4>
          <div className="space-y-1">
            {regionDelegates[selectedRegion].delegates.map((delegate, idx) => (
              <p key={idx} className="text-sm text-gray-700">
                <strong>{delegate.name}</strong><br/>
                {delegate.city}
              </p>
            ))}
          </div>
          <button 
            onClick={() => setSelectedRegion(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Fermer
          </button>
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-100 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          Cliquez sur une région pour voir les délégués
        </p>
      </div>
    </div>
  );
};

const QuiSommesNous: React.FC = () => {
  return (
    <>

      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Pourquoi rejoindre le SRH ?</h1>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Presentation Section */}
        <section id="presentation" className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-lg text-gray-700 mb-6">
                Créé en 1994, le Syndicat des Radiologues Hospitaliers - SRH - est un syndicat régi par la loi du 1er juillet 1901. Il représente l'ensemble des radiologues des hôpitaux publics regroupant hospitaliers et hospitalo-universitaires, temps pleins et temps partiels.
              </p>
              
              <h2 className="text-2xl font-semibold text-srh-blue mb-4">Objectif du SRH et avantages concurrentiels</h2>
              <p className="text-gray-700 mb-4">
                Le syndicat a pour objectif d'assurer la défense des intérêts professionnels de la discipline et de ses membres.
              </p>
              <p className="text-gray-700 mb-4">
                Une grande partie des radiologues hospitaliers sont cotisants au SRH, ce qui permet à notre syndicat de disposer d'une solide assise représentative médicale l'une des plus importantes, sinon la plus importante représentativité.
              </p>
              <p className="text-gray-700">
                Outre son excellente représentativité, le SRH se distingue par le fait qu'il fédère la totalité de la Radiologie Hospitalière car il n'existe aucun autre syndicat représentatif dans la discipline.
              </p>
            </div>
            
            <div>
              <img 
                src="https://cdn.prod.website-files.com/628c7dc6cc23833b26d6d1de/628c997658483edf357adeed_team-young-specialist-doctors-standing-corridor-hospital%201.webp" 
                alt="Radiologues hospitaliers"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
          
          <div className="prose max-w-4xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Présentation</h2>
            <p className="text-lg text-gray-700 mb-6">
              Le Syndicat des Radiologues Hospitaliers (SRH) a été fondé en 1994. C'est un syndicat régi par la loi du 1er juillet 1901.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Le SRH représente les radiologues des hôpitaux publics (temps plein et temps partiel, hospitaliers et hospitalo-universitaires).
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Nos objectifs</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Défendre les intérêts professionnels de la discipline et de ses membres</li>
              <li>Représenter l'ensemble de la Radiologie Hospitalière</li>
              <li>Améliorer l'organisation des soins radiologiques pour les patients</li>
            </ul>
          </div>
        </section>

        {/* Membres Section - Match original card design */}
        <section id="membres" className="mb-16">
          <h2 className="text-3xl font-bold text-srh-blue text-center mb-12">Membres du bureau</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* President */}
            <div className="bg-srh-blue text-white p-6 rounded-lg text-center">
              <div className="mb-4">
                <img 
                  src="https://cdn.prod.website-files.com/628c7dc6cc23833b26d6d1de/67796a56c2fe85a4c6e9d206_T%20Martinelli%202.jpg" 
                  alt="Docteur Thomas MARTINELLI"
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              </div>
              <h3 className="font-bold mb-2">Président</h3>
              <p className="text-sm">
                Docteur Thomas<br/>
                MARTINELLI<br/>
                Centre Hospitalier de<br/>
                Valence<br/>
                Service de Radiologie
              </p>
            </div>

            {/* Vice-President */}
            <div className="bg-srh-blue text-white p-6 rounded-lg text-center">
              <div className="mb-4">
                <img 
                  src="https://cdn.prod.website-files.com/628c7dc6cc23833b26d6d1de/67791d404f621e3ead171319_Pierre%20Champsaur%202.jpg" 
                  alt="Professeur Pierre Champsaur"
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              </div>
              <h3 className="font-bold mb-2">Vice-Président<br/>Secrétaire Général</h3>
              <p className="text-sm">
                Professeur Pierre<br/>
                Champsaur<br/>
                Hôpital Sainte<br/>
                Marguerite<br/>
                AP-HM, Marseille<br/>
                Radiologie et Imagerie<br/>
                Médicale
              </p>
            </div>

            {/* Tresorier */}
            <div className="bg-srh-blue text-white p-6 rounded-lg text-center">
              <div className="mb-4">
                <img 
                  src="https://cdn.prod.website-files.com/628c7dc6cc23833b26d6d1de/67791ff8c191eeed96cba7e8_N%20Pyatigorskaya%202.jpg" 
                  alt="Professeure Nadya Pyatigorskaya"
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              </div>
              <h3 className="font-bold mb-2">Trésorière</h3>
              <p className="text-sm">
                Professeure Nadya<br/>
                Pyatigorskaya<br/>
                CHU Pitié-Salpêtrière<br/>
                AP-HP, Paris<br/>
                Service de<br/>
                Neuroradiologie
              </p>
            </div>

            {/* Tresorier adjoint */}
            <div className="bg-srh-blue text-white p-6 rounded-lg text-center">
              <div className="mb-4">
                <img 
                  src="https://cdn.prod.website-files.com/628c7dc6cc23833b26d6d1de/64e725afef369076940ad2e7_Anne%20liesse.jpg" 
                  alt="Docteur Anne LIESSE"
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              </div>
              <h3 className="font-bold mb-2">Trésorière<br/>adjointe</h3>
              <p className="text-sm">
                Docteur Anne LIESSE<br/>
                Hôpital Victor Provo,<br/>
                Roubaix<br/>
                Service de Radiologie
              </p>
            </div>
          </div>

        </section>

        {/* Conseil d'administration avec carte interactive */}
        <section id="conseil" className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-srh-blue mb-6">Conseil d'administration</h2>
              <p className="text-gray-700 mb-6">
                Le conseil d'administration du SRH peut s'appuyer sur les délégués régionaux qui ont été choisis sur la base du volontariat.
              </p>
              <p className="text-gray-700 mb-6">
                Ces délégués sont des relais du SRH après de vous et seront invités à participer aux actions du Conseil d'Administration.
              </p>
              
              <div className="bg-srh-blue text-white p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <p><strong>Docteure Dihia BELABBAS</strong><br/>Roubaix</p>
                    <p><strong>Docteure Vanessa BRUN</strong><br/>Rennes</p>
                    <p><strong>Docteur Vincent DUROUS</strong><br/>Annecy</p>
                    <p><strong>Professeur Pascal CHABROT</strong><br/>Clermont-Ferrand</p>
                    <p><strong>Professeur Pierre CHAMPSAUR</strong><br/>Marseille</p>
                    <p><strong>Professeure Myriam EDJALI GOUJON</strong><br/>Garches</p>
                    <p><strong>Professeur Julien FRANDON</strong><br/>Nimes</p>
                    <p><strong>Professeur Jean-Yves GAUVRIT</strong><br/>Rennes</p>
                    <p><strong>Docteur Marc HABELAY</strong><br/>Valenciennes</p>
                  </div>
                  <div className="space-y-3">
                    <p><strong>Docteur Jean-François HEAUTOT</strong><br/>Rennes</p>
                    <p><strong>Docteure Eva JAMBON</strong><br/>Bordeaux</p>
                    <p><strong>Docteure Anne LIESSE</strong><br/>Roubaix</p>
                    <p><strong>Docteur Thomas MARTINELLI</strong><br/>Valence</p>
                    <p><strong>Professeur François PONTANA</strong><br/>Lille</p>
                    <p><strong>Professeure Nadia PYATIGORSKAYA</strong><br/>Paris</p>
                    <p><strong>Professeure Céline SAVOIE COLLET</strong><br/>Rouen</p>
                    <p><strong>Docteur Cherif SI HASSEN</strong><br/>Meaux</p>
                    <p><strong>Professeur Jean Pierre TASU</strong><br/>Poitiers</p>
                    <p><strong>Docteur Marc ZINS</strong><br/>Paris</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <InteractiveMap />
            </div>
          </div>
        </section>

        {/* Statuts Section - Complete 11 Articles */}
        <section id="statuts" className="mb-16">
          <h2 className="text-3xl font-bold text-srh-blue text-center mb-8">Les statuts</h2>
          
          <div className="space-y-6">
            {/* Article 1 */}
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-srh-blue">
              <h3 className="text-lg font-semibold text-srh-blue mb-3">Article 1 - CONSTITUTION - DÉNOMINATION - SIÈGE</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Il est créé entre les médecins spécialistes qualifiés en radiologie et imagerie médicale titulaires et/ou salariés des établissements, groupements et centres de santé universitaires, publics ou privés chargés d'une mission de service public (notamment les Centres de lutte contre le cancer et les établissements de santé privés d'intérêt collectifs) telle que définie par le Code de la santé publique et qui adhèrent aux présents statuts, un Syndicat des médecins Radiologues Hospitaliers. Ce syndicat professionnel, est établi selon les dispositions ad hoc du code du Travail. Ce syndicat prend le titre de « Syndicat des Radiologues Hospitaliers ou SRH », et sera désigné ci-dessous sous le terme de « Syndicat ».
                <br/><br/>
                Son siège social est fixé au 15 rue Ferdinand Duval 75004 Paris, tél. 01 48 87 93 49 et peut être transféré à une autre adresse sur décision du Conseil d'administration selon les modalités prévues au règlement intérieur du Syndicat.
              </p>
            </div>

            {/* Article 2 */}
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-green-700 mb-3">Article 2 - OBJET ET MISSIONS</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Le Syndicat a pour objet l'étude et la défense des droits et/ou des intérêts matériels et moraux, tant collectifs qu'individuels, des personnes visées par ses statuts. A cet effet, il se donne notamment pour missions :
                <br/>
                1. d'assurer la défense des intérêts professionnels de la discipline et de ses membres.
                <br/>
                2. d'œuvrer pour une meilleure organisation de la radiologie hospitalière et pour l'amélioration des conditions et des résultats de la prise en charge radiologique des patients.
                <br/>
                3. de contribuer à l'organisation et à la coordination régionale, nationale et européenne de l'exercice de la radiologie - imagerie médicale.
              </p>
            </div>

            {/* Article 3 */}
            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold text-orange-700 mb-3">Article 3 - MOYENS D'ACTION</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Les moyens d'action du Syndicat, pour réaliser l'objet et les missions définies à l'article 2, sont :
                <br/>
                1) d'établir entre ses membres une solidarité effective pour la défense de leurs intérêts professionnels, économiques et sociaux ;
                <br/>
                2) de contribuer à la formation et à l'information de ses membres dans les domaines administratif, juridique et scientifique, notamment par son journal ou son site web ;
                <br/>
                3) de représenter la profession auprès des tutelles et des instances internationales, européennes nationales, régionales, ou locales, ainsi que devant les organismes de sécurité sociale et les mutuelles ;
                <br/>
                4) d'agir en justice pour défendre les intérêts de la profession et/ou de ses membres ;
                <br/>
                5) d'adhérer au nom de ses membres, à des contrats de partenariat avec d'autres syndicats, des associations, entreprises ou des mutuelles.
              </p>
            </div>

            {/* Article 4 */}
            <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-purple-700 mb-3">Article 4 - MEMBRES ET ADHÉSION</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>1° Membres actifs :</strong> Peut être membre actif tout médecin radiologue, praticien titulaire et/ou salarié en exercice ou retraité, à temps plein ou partiel de centre hospitalier ou hospitalo-universitaire, ou d'un établissement visé à l'article 1, et à la condition :
                <br/>
                - d'avoir été préalablement agréé par le conseil d'administration selon les modalités prévues par le règlement intérieur du Syndicat ;
                <br/>
                - de s'acquitter régulièrement chaque année de la cotisation syndicale de l'année en cours ;
                <br/>
                - d'être régulièrement autorisé à exercer la médecine en France, selon les dispositions du Code de la santé publique.
                <br/><br/>
                <strong>2° Membres d'honneur :</strong> Les anciens présidents du Syndicat sont de droit membres d'honneur. Le Président peut proposer d'autres membres d'honneur à l'élection par l'Assemblée générale.
                <br/><br/>
                <strong>3° Membres donateurs :</strong> Sur proposition au Conseil d'administration du Président, l'adhésion de membres donateurs est possible, moyennant une cotisation majorée.
              </p>
            </div>

            {/* Article 5 */}
            <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-red-700 mb-3">Article 5 - DÉMISSION - RADIATION</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                La qualité de membre du Syndicat se perd :
                <br/>
                1° - par démission écrite adressée au Président ;
                <br/>
                2° - par radiation prononcée par le Conseil d'Administration, à la majorité des 3/4 de ses membres présents ou représentés, le membre intéressé ayant été préalablement invité à se présenter devant le Conseil d'Administration pour fournir des explications sur les faits qui motivent son éventuelle radiation.
                <br/><br/>
                Cette radiation peut être prononcée pour les motifs suivants :
                <br/>
                - suspension d'exercice exécutoire pour l'Ordre des Médecins
                <br/>
                - manquement grave aux dispositions des statuts ou du règlement intérieur du Syndicat
                <br/>
                - non règlement des cotisations de deux années successives
                <br/>
                - agissements portant un préjudice matériel, professionnel ou moral au Syndicat.
              </p>
            </div>

            {/* Article 6 */}
            <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
              <h3 className="text-lg font-semibold text-indigo-700 mb-3">Article 6 - CONSEIL D'ADMINISTRATION</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>1° - Election au Conseil d'administration :</strong> Le Syndicat est administré par un Conseil d'administration composé de 20 administrateurs avec voix délibératives (10 hospitalo-universitaires titulaires, PU-PH ou MCU-PH, 10 médecins radiologues non universitaires), élus pour trois ans.
                <br/><br/>
                Les administrateurs sont élus à la majorité absolue des membres actifs votants ou représentés au premier tour, et à la majorité relative au second tour. Le renouvellement des administrateurs s'effectue par moitié tous les trois ans.
                <br/><br/>
                <strong>2° Réunions au Conseil d'administration :</strong> Le Conseil d'administration se réunit aussi souvent qu'il est nécessaire et au moins une fois tous les trois mois, sur convocation et sous la présidence du Président ou à défaut d'un Vice-président.
              </p>
            </div>

            {/* Article 7 */}
            <div className="bg-teal-50 p-6 rounded-lg border-l-4 border-teal-500">
              <h3 className="text-lg font-semibold text-teal-700 mb-3">Article 7 - LE BUREAU</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>1° Election au Bureau :</strong> Le Conseil d'administration élit en son sein un Président, puis sur proposition du Président et pour une durée de 3 ans, les membres du Bureau.
                <br/><br/>
                Organisé à parité globale entre les membres de statut universitaire et non universitaire, ce Bureau est composé des membres suivants et, au minimum, d'un Président, d'un Vice-Président-Secrétaire Général et d'un Trésorier :
                <br/>
                - un Président (alternativement universitaire ou non)
                <br/>
                - un Premier vice-président - Secrétaire Général
                <br/>
                - éventuellement un ou plusieurs vice-présidents
                <br/>
                - un Trésorier
                <br/>
                - et éventuellement un Trésorier adjoint.
                <br/><br/>
                <strong>2° Pouvoirs des membres du Bureau :</strong> Les membres du Bureau sont collectivement chargés de préparer et d'exécuter les décisions du Conseil d'administration.
              </p>
            </div>

            {/* Article 8 */}
            <div className="bg-pink-50 p-6 rounded-lg border-l-4 border-pink-500">
              <h3 className="text-lg font-semibold text-pink-700 mb-3">Article 8 - ASSEMBLÉES GÉNÉRALES</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Les Assemblées générales sont ordinaires ou extraordinaires. Elles comprennent l'ensemble des membres actifs du Syndicat à jour de leurs cotisations. Elles sont présidées par le Président ou à défaut par le Premier Vice président - Secrétaire Général.
                <br/><br/>
                <strong>1° Assemblées Générales Ordinaires :</strong> L'Assemblée générale ordinaire se réunit au moins une fois par an et entend les rapports sur la gestion et les actions du Conseil d'administration ainsi que sur la situation financière et morale du Syndicat.
                <br/><br/>
                Pour l'Assemblée générale ordinaire, la convocation doit être adressée au moins deux semaines à l'avance. L'Assemblée ne peut délibérer valablement que si au moins 25 membres actifs à jour de leurs cotisations sont présents ou représentés ainsi que la moitié du CA.
              </p>
            </div>

            {/* Article 9 */}
            <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold text-yellow-700 mb-3">Article 9 - RESSOURCES DU SYNDICAT</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Les ressources du Syndicat sont :
                <br/>
                - les cotisations versées par les membres actifs et donateurs ;
                <br/>
                - tous dons et legs susceptibles de lui être attribués, après accord du Bureau ;
                <br/>
                - les intérêts et revenus des biens et valeurs appartenant au Syndicat ;
                <br/>
                - les revenus tirés des actions de partenariat et des publications du Syndicat.
              </p>
            </div>

            {/* Article 10 */}
            <div className="bg-cyan-50 p-6 rounded-lg border-l-4 border-cyan-500">
              <h3 className="text-lg font-semibold text-cyan-700 mb-3">Article 10 - FONDS DE RÉSERVES</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Afin d'une part de couvrir les engagements qu'il supporte dans le cadre de son fonctionnement, d'autre part d'assurer sa pérennité, le Syndicat a la faculté de constituer un Fonds de réserve dont l'objet spécifique est de faire face à tout ou partie des obligations auxquelles il pourrait souscrire pour la réalisation de son objet statutaire.
                <br/><br/>
                Les mécanismes de fonctionnement et d'abondement de ce fonds sont fixés, sur proposition du Conseil d'administration, par l'Assemblée générale.
              </p>
            </div>

            {/* Article 11 */}
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-500">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Article 11 - DISSOLUTION</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                En cas de dissolution volontaire ou forcée, l'Assemblée générale extraordinaire désigne un ou plusieurs commissaires chargés de la liquidation des biens du Syndicat.
                <br/><br/>
                Elle attribue l'actif net à tout organisme de son choix ayant un objet similaire.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default QuiSommesNous;