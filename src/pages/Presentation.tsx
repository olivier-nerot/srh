import React from 'react';

const Presentation: React.FC = () => {
  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Présentation</h1>
          <p className="text-xl opacity-90">Découvrez le Syndicat des Radiologues Hospitaliers</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Presentation Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-srh-blue mb-6">Pourquoi rejoindre le SRH ?</h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">
              Créé en 1994, le Syndicat des Radiologues Hospitaliers - SRH - est un syndicat régi par la loi du 1er juillet 1901. 
              Il représente l'ensemble des radiologues des hôpitaux publics regroupant hospitaliers et hospitalo-universitaires, 
              temps pleins et temps partiels.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
            <div>
              <h3 className="text-2xl font-semibold text-srh-blue mb-4">Objectif du SRH et avantages concurrentiels</h3>
              <p className="text-gray-700 mb-4">
                Le syndicat a pour objectif d'assurer la défense des intérêts professionnels de la discipline et de ses membres.
              </p>
              <p className="text-gray-700 mb-4">
                Une grande partie des radiologues hospitaliers sont cotisants au SRH, ce qui lui confère parmi les syndicats 
                médicaux l'une des plus importante, sinon la plus importante représentativité.
              </p>
              <p className="text-gray-700">
                Outre son excellente représentativité, le SRH se distingue par le fait qu'il fédère la totalité de la Radiologie 
                Hospitalière car il n'existe aucun autre syndicat représentatif dans la discipline.
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

          {/* Detailed Presentation */}
          <div className="bg-gray-50 p-8 rounded-lg">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Présentation détaillée</h3>
            <div className="space-y-6 text-gray-700">
              <p className="text-lg">
                Le Syndicat des Radiologues Hospitaliers (SRH) a été fondé en 1994. C'est un syndicat régi par la loi du 1er juillet 1901.
              </p>
              <p className="text-lg">
                Le SRH représente les radiologues des hôpitaux publics (temps plein et temps partiel, hospitaliers et hospitalo-universitaires).
              </p>
              
              <div className="mt-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Nos objectifs</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Défendre les intérêts professionnels de la discipline et de ses membres</li>
                  <li>Représenter l'ensemble de la Radiologie Hospitalière</li>
                  <li>Améliorer l'organisation des soins radiologiques pour les patients</li>
                  <li>Contribuer à la formation et à l'information de ses membres</li>
                  <li>Représenter la profession auprès des tutelles et des instances nationales</li>
                </ul>
              </div>

              <div className="mt-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Nos missions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-srh-blue mb-3">Défense des intérêts</h5>
                    <p className="text-sm">
                      Assurer la défense des intérêts professionnels, économiques et sociaux de nos membres.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-srh-blue mb-3">Organisation des soins</h5>
                    <p className="text-sm">
                      Œuvrer pour une meilleure organisation de la radiologie hospitalière et l'amélioration des conditions de prise en charge.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-srh-blue mb-3">Coordination</h5>
                    <p className="text-sm">
                      Contribuer à l'organisation et à la coordination régionale, nationale et européenne de l'exercice de la radiologie.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-srh-blue mb-3">Formation</h5>
                    <p className="text-sm">
                      Contribuer à la formation et à l'information de nos membres dans les domaines administratif, juridique et scientifique.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-srh-blue text-white p-8 rounded-lg">
          <h3 className="text-2xl font-bold mb-4">Rejoignez le SRH</h3>
          <p className="text-lg mb-6 opacity-90">
            Faites partie de la plus grande représentation syndicale des radiologues hospitaliers en France.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/jadhere-au-srh"
              className="bg-white text-srh-blue hover:bg-gray-100 px-8 py-3 rounded-md font-medium transition-colors"
            >
              J'adhère au SRH
            </a>
            <a
              href="/contactez-nous"
              className="border border-white text-white hover:bg-white hover:text-srh-blue px-8 py-3 rounded-md font-medium transition-colors"
            >
              Nous contacter
            </a>
          </div>
        </section>
      </div>
    </>
  );
};

export default Presentation;