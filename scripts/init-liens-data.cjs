const { getDb } = require('../api/lib/turso');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

// Define liens table schema
const liens = sqliteTable('liens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  icon: text('icon').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  url: text('url').notNull(),
  logo: text('logo'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

// Liens data extracted from NosLiens.tsx
const liensData = [
  // Organisations professionnelles et syndicats
  {
    icon: "Users",
    title: "Association Française des Ingénieurs Biomédicaux (AFIB)",
    description: "Association des ingénieurs biomédicaux",
    category: "Organisations professionnelles et syndicats",
    url: "https://afib.asso.fr/",
    logo: "../assets/images/partner-logos/afib.png"
  },
  {
    icon: "Users",
    title: "Association Française du Personnel Paramédical d'Électroradiologie (AFPPE)",
    description: "Association du personnel paramédical d'électroradiologie",
    category: "Organisations professionnelles et syndicats",
    url: "https://www.afppe.com/",
    logo: "../assets/images/partner-logos/afppe.png"
  },
  {
    icon: "Users",
    title: "Association Parisienne des Internes en Radiologie (APIR)",
    description: "Association des internes en radiologie de Paris",
    category: "Organisations professionnelles et syndicats",
    url: "https://www.apir-radio.com/",
    logo: "../assets/images/partner-logos/apir.png"
  },
  {
    icon: "Users",
    title: "Association pour les Praticiens Hospitaliers et Assimilés (APPA)",
    description: "Association des praticiens hospitaliers",
    category: "Organisations professionnelles et syndicats",
    url: "https://www.appa-asso.org/appa",
    logo: "../assets/images/partner-logos/appa.jpg"
  },
  {
    icon: "Users",
    title: "Centre National de Gestion (CNG)",
    description: "Gestion des carrières des praticiens hospitaliers",
    category: "Organisations professionnelles et syndicats",
    url: "https://www.cng.sante.fr/",
    logo: "../assets/images/partner-logos/cng.png"
  },
  {
    icon: "Users",
    title: "Centre National d'Expertise Hospitalière (CNEH)",
    description: "Centre d'expertise hospitalière",
    category: "Organisations professionnelles et syndicats",
    url: "https://www.cneh.fr/",
    logo: "../assets/images/partner-logos/cneh.png"
  },
  {
    icon: "Users",
    title: "Collège des Enseignants de Radiologie de France (CERF)",
    description: "Collège universitaire de radiologie",
    category: "Organisations professionnelles et syndicats",
    url: "https://cerf.radiologie.fr/",
    logo: "../assets/images/partner-logos/cerf.png"
  },
  {
    icon: "Users",
    title: "Collégiale des Radiologues de l'AP-HP",
    description: "Collégiale des radiologues de l'Assistance Publique - Hôpitaux de Paris",
    category: "Organisations professionnelles et syndicats",
    url: "https://www.radiologues-aphp.fr/",
    logo: "../assets/images/partner-logos/aphp.png"
  },
  {
    icon: "Users",
    title: "Conseil National Professionnel de Médecine d'Urgence (CNPMEM)",
    description: "Conseil national professionnel de médecine d'urgence",
    category: "Organisations professionnelles et syndicats",
    url: "https://www.cnpmem.fr/",
    logo: "../assets/images/partner-logos/cnpmem.png"
  },
  {
    icon: "Users",
    title: "Conseil National de l'Ordre des Médecins (CNOM)",
    description: "Instance ordinale des médecins en France",
    category: "Organisations professionnelles et syndicats",
    url: "https://www.conseil-national.medecin.fr/",
    logo: "../assets/images/partner-logos/cnom.png"
  },

  // Sociétés savantes et formations
  {
    icon: "GraduationCap",
    title: "Centre National Professionnel de Gérontologie 4 (CNPG4)",
    description: "Centre national professionnel de gérontologie",
    category: "Sociétés savantes et formations",
    url: "https://www.cnpg4-radiologie.fr/",
    logo: "../assets/images/partner-logos/cnpg4.png"
  },
  {
    icon: "GraduationCap",
    title: "Fédération de Médecine Continue et de Recherche en Imagerie Médicale (FMCRIM)",
    description: "Fédération de médecine continue en imagerie médicale",
    category: "Sociétés savantes et formations",
    url: "http://www.fmcrim.fr/#accueil",
    logo: "../assets/images/partner-logos/fmcrim.png"
  },
  {
    icon: "GraduationCap",
    title: "Fédération Hospitalière de France (FHF)",
    description: "Fédération des établissements hospitaliers publics",
    category: "Sociétés savantes et formations",
    url: "https://www.fhf.fr/",
    logo: "../assets/images/partner-logos/fhf.png"
  },
  {
    icon: "GraduationCap",
    title: "Fédération Nationale de Médecine du Travail et de Radioprotection (FNMR)",
    description: "Fédération nationale de médecine du travail",
    category: "Sociétés savantes et formations",
    url: "https://www.fnmr.org/",
    logo: "../assets/images/partner-logos/fnmr.png"
  },
  {
    icon: "GraduationCap",
    title: "Intersyndicat National des Spécialités Médicales",
    description: "Intersyndicat des spécialités médicales",
    category: "Sociétés savantes et formations",
    url: "http://www.specialitesmedicales.org/",
    logo: "../assets/images/partner-logos/specialites-medicales.png"
  },
  {
    icon: "GraduationCap",
    title: "Les Entreprises Hospitalières (LEH)",
    description: "Association des entreprises hospitalières",
    category: "Sociétés savantes et formations",
    url: "https://www.leh.fr/",
    logo: "../assets/images/partner-logos/leh.png"
  },
  {
    icon: "GraduationCap",
    title: "Société Française de Radiologie (SFR)",
    description: "Société savante de radiologie française",
    category: "Sociétés savantes et formations",
    url: "http://www.sfrnet.org/",
    logo: "../assets/images/partner-logos/sfr.jpeg"
  },
  {
    icon: "GraduationCap",
    title: "Syndicat National des Médecins Hospitaliers Praticiens (SNAMHP)",
    description: "Syndicat des médecins hospitaliers praticiens",
    category: "Sociétés savantes et formations",
    url: "https://www.snamhp.org/",
    logo: "../assets/images/partner-logos/snamhp.png"
  },
  {
    icon: "GraduationCap",
    title: "Union Nationale des Internes et Jeunes Radiologues (UNIR)",
    description: "Union des internes et jeunes radiologues",
    category: "Sociétés savantes et formations",
    url: "https://unir-radio.fr/",
    logo: "../assets/images/partner-logos/unir.png"
  },

  // Partenaires industriels
  {
    icon: "Building",
    title: "Bracco",
    description: "Entreprise spécialisée en produits de contraste et imagerie diagnostique",
    category: "Partenaires industriels",
    url: "https://www.bracco.com/en",
    logo: "../assets/images/partner-logos/bracco.png"
  },
  {
    icon: "Building",
    title: "Fujifilm Healthcare",
    description: "Solutions d'imagerie médicale et de diagnostic",
    category: "Partenaires industriels",
    url: "https://www.fujifilm.com/uk/en/healthcare",
    logo: "../assets/images/partner-logos/fujifilm.png"
  },
  {
    icon: "Building",
    title: "GE Healthcare",
    description: "Technologies médicales et solutions d'imagerie",
    category: "Partenaires industriels",
    url: "https://www.gehealthcare.fr/",
    logo: "../assets/images/partner-logos/ge-healthcare.png"
  },
  {
    icon: "Building",
    title: "Guerbet",
    description: "Spécialiste mondial des produits de contraste",
    category: "Partenaires industriels",
    url: "https://www.guerbet.com/fr",
    logo: "../assets/images/partner-logos/guerbet.png"
  },
  {
    icon: "Building",
    title: "Siemens Healthineers",
    description: "Technologies médicales avancées",
    category: "Partenaires industriels",
    url: "https://www.siemens-healthineers.com/fr",
    logo: "../assets/images/partner-logos/siemens.png"
  },
  {
    icon: "Building",
    title: "Terumo Europe",
    description: "Dispositifs médicaux et solutions interventionnelles",
    category: "Partenaires industriels",
    url: "http://terumo-europe.com/",
    logo: "../assets/images/partner-logos/terumo.png"
  },
  {
    icon: "Building",
    title: "Toshiba Medical",
    description: "Systèmes d'imagerie médicale",
    category: "Partenaires industriels",
    url: "https://www.toshiba-medical.eu/fr/",
    logo: "../assets/images/partner-logos/toshiba.png"
  }
];

async function initializeLiensData() {
  try {
    const db = await getDb();
    
    // Check if data already exists
    const existingData = await db.select({ count: sql`COUNT(*)` }).from(liens);
    const count = Number(existingData[0].count);
    
    if (count > 0) {
      console.log(`Database already has ${count} liens. Skipping initialization.`);
      return;
    }

    console.log('Initializing liens data...');
    
    // Insert all liens at once
    const liensToInsert = liensData.map(lien => ({
      icon: lien.icon,
      title: lien.title,
      description: lien.description,
      category: lien.category,
      url: lien.url,
      logo: lien.logo,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.insert(liens).values(liensToInsert);
    
    console.log(`Successfully inserted ${liensData.length} liens into the database.`);
    
  } catch (error) {
    console.error('Error initializing liens data:', error);
  }
}

// Run the initialization
initializeLiensData();