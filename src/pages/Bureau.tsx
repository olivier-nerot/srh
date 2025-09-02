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
          cx="300" cy="160" r="18"
          className={`cursor-pointer transition-all ${selectedRegion === 'ile-de-france' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'ile-de-france' ? null : 'ile-de-france')}
        />
        <text x="300" y="166" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">IDF</text>
        
        {/* Hauts-de-France - positioned in north */}
        <circle 
          cx="310" cy="70" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'hauts-de-france' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'hauts-de-france' ? null : 'hauts-de-france')}
        />
        <text x="310" y="75" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">HDF</text>
        
        {/* Bretagne - positioned in west */}
        <circle 
          cx="80" cy="180" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'bretagne' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'bretagne' ? null : 'bretagne')}
        />
        <text x="80" y="185" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">BRT</text>
        
        {/* Normandie - positioned in northwest */}
        <circle 
          cx="200" cy="130" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'normandie' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'normandie' ? null : 'normandie')}
        />
        <text x="200" y="135" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">NOR</text>
        
        {/* Nouvelle-Aquitaine - positioned in southwest */}
        <circle 
          cx="190" cy="340" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'nouvelle-aquitaine' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'nouvelle-aquitaine' ? null : 'nouvelle-aquitaine')}
        />
        <text x="190" y="345" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">NAO</text>
        
        {/* Occitanie - positioned in south center */}
        <circle 
          cx="260" cy="440" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'occitanie' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'occitanie' ? null : 'occitanie')}
        />
        <text x="260" y="445" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">OCC</text>
        
        {/* Provence-Alpes-Côte d'Azur - positioned in southeast */}
        <circle 
          cx="460" cy="440" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'provence-alpes' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'provence-alpes' ? null : 'provence-alpes')}
        />
        <text x="460" y="445" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">PAC</text>
        
        {/* Auvergne-Rhône-Alpes - positioned in east center */}
        <circle 
          cx="380" cy="340" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'auvergne-rhone' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'auvergne-rhone' ? null : 'auvergne-rhone')}
        />
        <text x="380" y="345" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">ARA</text>
        
        {/* Grand Est - positioned in northeast */}
        <circle 
          cx="370" cy="130" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'grand-est' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'grand-est' ? null : 'grand-est')}
        />
        <text x="370" y="135" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">GE</text>
        
        {/* Bourgogne-Franche-Comté - positioned in east center */}
        <circle 
          cx="370" cy="230" r="15"
          className={`cursor-pointer transition-all ${selectedRegion === 'bourgogne' ? 'fill-srh-blue opacity-80' : 'fill-blue-400 hover:fill-blue-500 opacity-60 hover:opacity-80'}`}
          onClick={() => setSelectedRegion(selectedRegion === 'bourgogne' ? null : 'bourgogne')}
        />
        <text x="370" y="235" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">BFC</text>
      </svg>
      
      {/* Selected Region Info Card */}
      {selectedRegion && regionDelegates[selectedRegion as keyof typeof regionDelegates] && (
        <div key={selectedRegion} className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-xs border border-gray-200 z-20">
          <h4 className="font-bold text-srh-blue mb-2">{regionDelegates[selectedRegion as keyof typeof regionDelegates].name}</h4>
          <div className="space-y-1">
            {regionDelegates[selectedRegion as keyof typeof regionDelegates].delegates.map((delegate: {name: string, city: string}, idx: number) => (
              <p key={idx} className="text-sm text-gray-700">
                <strong>{delegate.name}</strong><br/>
                {delegate.city}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectedRegion(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 cursor-pointer relative z-30"
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

const Bureau: React.FC = () => {
  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Bureau et Conseil d'administration</h1>
          <p className="text-xl opacity-90">Découvrez les membres dirigeants du SRH</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}} />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Membres du bureau Section */}
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
      </div>
    </>
  );
};

export default Bureau;