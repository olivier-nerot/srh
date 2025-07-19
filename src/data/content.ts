import type { SiteContent } from '../types';

export const siteContent: SiteContent = {
  navigation: [
    {
      title: "Qui sommes-nous?",
      href: "/qui-sommes-nous",
      children: [
        { title: "Présentation", href: "/qui-sommes-nous#presentation" },
        { title: "Conseil d'administration", href: "/qui-sommes-nous#membres" },
        { title: "Les statuts", href: "/qui-sommes-nous#statuts" }
      ]
    },
    {
      title: "Nos informations",
      href: "/nos-informations",
      children: [
        { title: "Nos publications", href: "/nos-informations#publications" },
        { title: "Communiqués", href: "/nos-informations#communiques" }
      ]
    },
    {
      title: "Textes officiels",
      href: "/textes-officiels",
      children: [
        { title: "Textes du Journal Officiel", href: "/textes-officiels#jo" },
        { title: "Rapports institutionnels", href: "/textes-officiels#rapports" }
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
      title: "Newsletter Janvier 2025",
      excerpt: "Une très bonne année et surtout.. la santé ! Par le nouveau bureau du SRH.",
      content: "Une très bonne année et surtout.. la santé ! Par le nouveau bureau du SRH.",
      publishedAt: "2025-01-01",
      slug: "newsletter-janvier-2025"
    },
    {
      id: "2",
      title: "Newsletter Novembre 2024",
      excerpt: "Retour sur les élections professionnelles 2024.",
      content: "Retour sur les élections professionnelles 2024.",
      publishedAt: "2024-11-01",
      slug: "newsletter-novembre-2024"
    },
    {
      id: "3",
      title: "Newsletter JFR Septembre 2024",
      excerpt: "SRH will be present at JFR. We'll be happy to see you, especially for our AG on Friday and at our stand.",
      content: "SRH will be present at JFR. We'll be happy to see you, especially for our AG on Friday and at our stand.",
      publishedAt: "2024-09-01",
      slug: "newsletter-jfr-septembre-2024"
    },
    {
      id: "4",
      title: "LFSS 2025: pas d'économies sur la qualité !",
      excerpt: "Nos réflexions et propositions...",
      content: "LFSS 2025: pas d'économies sur la qualité ! Nos réflexions et propositions...",
      publishedAt: "2025-05-01",
      slug: "lfss-2025-economies-qualite"
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
    phone: "+33 1 XX XX XX XX",
    email: "contact@srh-info.org",
    website: "https://www.srh-info.org"
  }
};