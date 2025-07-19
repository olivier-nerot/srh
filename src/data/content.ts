import type { SiteContent } from '../types';

export const siteContent: SiteContent = {
  navigation: [
    {
      title: "Qui sommes-nous?",
      href: "/qui-sommes-nous",
      children: [
        { title: "Présentation", href: "/presentation" },
        { title: "Bureau", href: "/bureau" },
        { title: "Les statuts", href: "/statuts" }
      ]
    },
    {
      title: "Nos informations",
      href: "/nos-informations",
      children: [
        { title: "Nos publications", href: "/publications" },
        { title: "Communiqués", href: "/communiques" }
      ]
    },
    {
      title: "Textes officiels",
      href: "/textes-officiels",
      children: [
        { title: "Textes du Journal Officiel", href: "/jo" },
        { title: "Rapports institutionnels", href: "/rapports" }
      ]
    },
    {
      title: "Nos liens",
      href: "/nos-liens"
    },
    {
      title: "Contactez-nous",
      href: "/contactez-nous"
    }
  ],
  hero: {
    title: "Syndicat des Radiologues Hospitaliers",
    subtitle: "SRH",
    description: "Le SRH, présent depuis plus de 25 ans, fédère la totalité de la Radiologie Hospitalière"
  },
  news: [
    {
      id: "1",
      title: "Arrêté du 8 juillet 2025 portant diverses dispositions relatives à l'organisation et à l'indemnisation de la permanence des soins",
      excerpt: "Nouvelles dispositions relatives à l'organisation et à l'indemnisation de la permanence des soins dans les établissements publics de santé.",
      content: "Arrêté du 8 juillet 2025 portant diverses dispositions relatives à l'organisation et à l'indemnisation de la permanence des soins dans les établissements publics de santé.",
      publishedAt: "2025-07-08",
      slug: "arrete-juillet-2025-permanence-soins",
      image: "news-article-1.jpg",
      pdf:"1.pdf",
    },
    {
      id: "2", 
      title: "LFSS 2025 : pas d'économies sur la qualité !",
      excerpt: "Nos réflexions et propositions pour des mesures rapides et concrètes dans le cadre de la loi de financement de la sécurité sociale.",
      content: "LFSS 2025 : pas d'économies sur la qualité ! Nos réflexions et propositions pour des mesures rapides et concrètes.",
      publishedAt: "2024-11-28",
      slug: "lfss-2025-economies-qualite",
      image: "news-article-2.jpg",
      pdf:"2.pdf",
    },
    {
      id: "3",
      title: "Appel à une grève illimitée de la permanence des soins",
      excerpt: "Grèves de mai. Appel à une grève illimitée de la permanence des soins des praticiens des hôpitaux, dès le 1er Mai 2025.",
      content: "Grèves de mai. Appel à une grève illimitée de la permanence des soins des praticiens des hôpitaux, dès le 1er Mai 2025.",
      publishedAt: "2025-04-15",
      slug: "greve-permanence-soins-mai-2025",
      image: "news-article-3.jpg",
      pdf:"3.pdf",
    },
    {
      id: "4",
      title: "Des économies OK mais pas de bouts de chandelles !",
      excerpt: "L'adoption définitive du PLFSS 2025 impose la recherche de 300 Millions d'économies pour l'imagerie médicale.",
      content: "Communiqué. Des économies OK mais pas de bouts de chandelles ! L'adoption définitive du PLFSS 2025 impose la recherche de 300 Millions d'économies pour l'imagerie.",
      publishedAt: "2025-01-03",
      slug: "economies-plfss-2025-imagerie",
      image: "news-article-4.jpg",
      pdf: "4.pdf",
    },
    {
      id: "5",
      title: "Newsletter Flash janvier 2025",
      excerpt: "Une très bonne année et surtout.. la santé ! Par le nouveau bureau du SRH.",
      content: "NewsLetter Flash janvier 2025. Une très bonne année et surtout.. la santé ! Par le nouveau bureau du SRH.",
      publishedAt: "2025-01-01",
      slug: "newsletter-flash-janvier-2025",
      image: "news-article-5.jpg",
      pdf: "5.pdf",
    },
    {
      id: "6",
      title: "Permanence des Soins : Merci l'hôpital !",
      excerpt: "Le SRH a examiné avec attention le rapport de la DGOS sur la permanence des soins hospitaliers.",
      content: "Communiqué. Permanence des Soins : Merci l'hôpital ! Le SRH a examiné avec attention le rapport de la DGOS sur la permanence des soins.",
      publishedAt: "2025-01-28",
      slug: "permanence-soins-rapport-dgos",
      image: "news-article-6.jpg",
      pdf: "6.pdf",
    }
  ],
  jobs: [
    {
      id: "1",
      title: "Praticien Hospitalier - Radiologie",
      location: "Tours de recrutement CNG",
      type: "Praticien Hospitalier",
      description: "Consultez les offres de postes sur le site du CNG pour les praticiens hospitaliers et praticiens enseignants hospitaliers.",
      requirements: ["Diplôme de radiologie", "Inscription au CNG", "Expérience hospitalière"],
      publishedAt: "2024-01-15"
    }
  ],
  documents: [
    {
      id: "1",
      title: "Décret n° 2024-940 modifiant les dispositions statutaires relatives au personnel hospitalier-universitaire",
      type: "pdf",
      url: "#",
      category: "Journal Officiel",
      publishedAt: "2024-10-01"
    },
    {
      id: "2",
      title: "Rapport de la Cour des comptes sur la formation continue des médecins",
      type: "pdf",
      url: "#",
      category: "Rapports institutionnels",
      publishedAt: "2024-01-01"
    }
  ],
  contact: {
    address: "15 rue Ferdinand Duval, 75004 PARIS",
    email: "contact@srh-info.org",
    website: "https://www.srh-info.org"
  }
};