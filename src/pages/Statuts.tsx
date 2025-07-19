import React from 'react';

const Statuts: React.FC = () => {
  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Les statuts</h1>
          <p className="text-xl opacity-90">Le cadre juridique du Syndicat des Radiologues Hospitaliers</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Statuts Section - Complete 11 Articles */}
        <section id="statuts" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-srh-blue mb-4">Statuts du SRH</h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">
              Les statuts du Syndicat des Radiologues Hospitaliers définissent le cadre juridique et organisationnel 
              de notre syndicat, créé en 1994 et régi par la loi du 1er juillet 1901.
            </p>
          </div>
          
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

          {/* Legal Notice */}
          <div className="mt-12 bg-gray-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Information légale</h3>
            <p className="text-gray-700 text-sm">
              Ces statuts sont régis par la loi du 1er juillet 1901 et ses textes d'application. 
              Toute modification des présents statuts doit être approuvée par l'Assemblée générale extraordinaire 
              à la majorité des deux tiers des membres présents ou représentés.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default Statuts;