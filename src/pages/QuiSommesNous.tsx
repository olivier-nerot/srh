import React from 'react';

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
                src="/api/placeholder/400/300" 
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
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full mx-auto mb-4"></div>
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
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full mx-auto mb-4"></div>
              </div>
              <h3 className="font-bold mb-2">Vice-Président<br/>Secrétaire Général</h3>
              <p className="text-sm">
                Professeur Pierre<br/>
                Champsaur<br/>
                Hôpital Sainte<br/>
                Marguerite<br/>
                AP-HM, Marseille<br/>
                Service de Radiologie<br/>
                et Imagerie Médicale
              </p>
            </div>

            {/* Tresorier */}
            <div className="bg-srh-blue text-white p-6 rounded-lg text-center">
              <div className="mb-4">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full mx-auto mb-4"></div>
              </div>
              <h3 className="font-bold mb-2">Trésorier</h3>
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
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full mx-auto mb-4"></div>
              </div>
              <h3 className="font-bold mb-2">Trésorière<br/>adjointe</h3>
              <p className="text-sm">
                Docteur Anne LIESSE<br/>
                Service de Radiologie<br/>
                Hôpital Victor Provo,<br/>
                Roubaix<br/>
                Service de Radiologie
              </p>
            </div>
          </div>

        </section>

        {/* Conseil d'administration avec carte */}
        <section id="conseil" className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-srh-blue mb-6">Conseil d'administration</h2>
              <p className="text-gray-700 mb-6">
                Le conseil d'administration du SRH peut s'appuyer sur ses délégués régionaux qui ont été choisis sur la base du volontariat.
              </p>
              <p className="text-gray-700 mb-6">
                Ces délégués sont des relais du SRH aprés de nous et seront invités à participer aux actions du Conseil d'Administration.
              </p>
              
              <div className="space-y-2 text-sm text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Docteur Driss BELABBAS</strong><br/>Roubaix</p>
                    <p><strong>Docteur Jean-François BEAUCOT</strong><br/>Pelonur</p>
                    <p><strong>Docteur Vanessa BRUN</strong><br/>Nantes</p>
                    <p><strong>Docteur René DUPUIS</strong><br/>Annecy</p>
                  </div>
                  <div>
                    <p><strong>Docteur Eric JAUMON</strong><br/>Nantes</p>
                    <p><strong>Docteur Anne LIESSE</strong><br/>Roubaix</p>
                    <p><strong>Docteur Thomas MARTINELLI</strong><br/>Valence</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="w-full h-96 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 400 300" className="w-full h-full">
                  <path d="M50 50 Q200 100 350 50 L350 250 Q200 200 50 250 Z" fill="#1e4d72" opacity="0.3"/>
                  <text x="200" y="150" textAnchor="middle" className="fill-current text-srh-blue font-bold text-lg">
                    Carte de France
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Statuts Section */}
        <section id="statuts" className="mb-16">
          <h2 className="text-3xl font-bold text-srh-blue text-center mb-8">Les statuts</h2>
          
          <div className="bg-blue-50 p-8 rounded-lg">
            <div className="flex items-start space-x-4">
              <div className="bg-srh-blue text-white p-2 rounded">
                <span className="font-bold">📄</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-srh-blue mb-4">Article 1 - CONSTITUTION - DÉNOMINATION - SIÈGE :</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Il est créé entre les médecins exerçant ou ayant exercé la médecine dans les 
                  établissements hospitaliers publics et centres de santé universitaires, publics ou privés 
                  chargés d'une mission de service public/enseignement supérieur Centre de lutte contre le cancer et 
                  établissements de santé privés et établissements médico-sociaux, conformés à l'article 1131 1 du Code du Travail, ou 
                  Syndicat des médecins Radiologues Hospitaliers. Ce syndicat professionnel, sera établi selon les dispositions de décret du code du Travail. Dénomination 
                  présente et titre et qui doit être modifié selon une pratique des médecins Radiologues hospitaliers.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default QuiSommesNous;