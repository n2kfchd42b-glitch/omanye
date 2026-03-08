export const globalStats = [
  {
    id: 1,
    label: 'People Lacking Basic Health Services',
    value: '4.5B',
    description: "Nearly half the world's population lacks access to essential health services",
    icon: '🏥',
    color: 'blue',
  },
  {
    id: 2,
    label: 'Deaths from Preventable Diseases (Yearly)',
    value: '7M+',
    description: 'Over 7 million people die annually from preventable or treatable conditions',
    icon: '❤️',
    color: 'red',
  },
  {
    id: 3,
    label: 'Child Deaths Under Age 5 (Yearly)',
    value: '5M',
    description: 'Five million children under the age of five die each year, mostly from preventable causes',
    icon: '🌱',
    color: 'green',
  },
  {
    id: 4,
    label: 'Countries with Critical Health Worker Shortage',
    value: '55',
    description: '55 countries face critical shortages of doctors, nurses, and midwives',
    icon: '👩‍⚕️',
    color: 'purple',
  },
];

export const healthInitiatives = [
  {
    id: 1,
    title: 'Universal Health Coverage',
    description:
      'Ensuring all people can access quality health services without financial hardship. Our programs support governments in building resilient health systems.',
    icon: '🌍',
    link: '#uhc',
  },
  {
    id: 2,
    title: 'Infectious Disease Control',
    description:
      'Monitoring and responding to outbreaks of malaria, tuberculosis, HIV/AIDS, and emerging pathogens. Data-driven strategies save lives.',
    icon: '🔬',
    link: '#disease',
  },
  {
    id: 3,
    title: 'Maternal & Child Health',
    description:
      'Reducing maternal mortality and improving child survival through antenatal care, skilled birth attendance, and immunization programs.',
    icon: '👶',
    link: '#maternal',
  },
  {
    id: 4,
    title: 'Mental Health Programs',
    description:
      'Destigmatizing mental health disorders and expanding access to counseling, community support, and evidence-based treatments worldwide.',
    icon: '🧠',
    link: '#mental',
  },
  {
    id: 5,
    title: 'Nutrition & Food Security',
    description:
      'Addressing malnutrition in all its forms — from hunger in low-income regions to diet-related chronic diseases globally.',
    icon: '🥗',
    link: '#nutrition',
  },
  {
    id: 6,
    title: 'Climate & Health',
    description:
      'Mitigating the health impacts of climate change including heatwaves, air pollution, and the spread of vector-borne diseases.',
    icon: '🌿',
    link: '#climate',
  },
];

export const diseaseData = [
  {
    name: 'Malaria',
    cases: '249M',
    deaths: '608K',
    region: 'Sub-Saharan Africa',
    trend: 'stable',
    color: '#ef4444',
  },
  {
    name: 'Tuberculosis',
    cases: '10.6M',
    deaths: '1.3M',
    region: 'South-East Asia & Africa',
    trend: 'declining',
    color: '#f97316',
  },
  {
    name: 'HIV/AIDS',
    cases: '39M (living)',
    deaths: '630K',
    region: 'Global',
    trend: 'declining',
    color: '#a855f7',
  },
  {
    name: 'Dengue',
    cases: '390M',
    deaths: '40K',
    region: 'Tropical regions',
    trend: 'rising',
    color: '#eab308',
  },
  {
    name: 'Cholera',
    cases: '1-4M',
    deaths: '21-143K',
    region: 'Africa & Asia',
    trend: 'rising',
    color: '#3b82f6',
  },
];

export const resources = [
  {
    id: 1,
    category: 'Report',
    title: 'World Health Statistics 2024',
    description:
      "The annual compilation of health-related data for WHO's 194 Member States, covering key indicators and progress toward health-related SDGs.",
    source: 'World Health Organization',
    url: 'https://www.who.int/data/gho/publications/world-health-statistics',
    date: '2024',
  },
  {
    id: 2,
    category: 'Guide',
    title: 'Global Health Security Index',
    description:
      'An assessment of national preparedness against infectious disease outbreaks, epidemics, and pandemics across 195 countries.',
    source: 'GHS Index',
    url: 'https://www.ghsindex.org',
    date: '2024',
  },
  {
    id: 3,
    category: 'Data',
    title: 'Our World in Data – Health',
    description:
      'Interactive charts and data on life expectancy, disease burden, mental health, healthcare access, and more.',
    source: 'Our World in Data',
    url: 'https://ourworldindata.org/health-meta',
    date: '2024',
  },
  {
    id: 4,
    category: 'Report',
    title: 'Global Burden of Disease Study',
    description:
      'A comprehensive quantification of health loss across 204 countries from diseases, injuries, and risk factors.',
    source: 'IHME',
    url: 'https://www.healthdata.org/gbd',
    date: '2023',
  },
  {
    id: 5,
    category: 'Toolkit',
    title: 'WHO Health Emergency Preparedness',
    description:
      'Resources, frameworks, and toolkits to help countries prepare for and respond to health emergencies.',
    source: 'World Health Organization',
    url: 'https://www.who.int/emergencies/preparedness',
    date: '2024',
  },
  {
    id: 6,
    category: 'Data',
    title: 'UNICEF Global Health Dashboard',
    description:
      'Live dashboard tracking child health indicators, immunization coverage, and nutrition statistics worldwide.',
    source: 'UNICEF',
    url: 'https://data.unicef.org',
    date: '2024',
  },
];

export const partners = [
  { name: 'World Health Organization', abbr: 'WHO', url: 'https://www.who.int' },
  { name: 'UNICEF', abbr: 'UNICEF', url: 'https://www.unicef.org' },
  { name: 'Médecins Sans Frontières', abbr: 'MSF', url: 'https://www.msf.org' },
  { name: 'The Global Fund', abbr: 'Global Fund', url: 'https://www.theglobalfund.org' },
  { name: 'Gavi, the Vaccine Alliance', abbr: 'GAVI', url: 'https://www.gavi.org' },
  { name: 'Bill & Melinda Gates Foundation', abbr: 'BMGF', url: 'https://www.gatesfoundation.org' },
];
