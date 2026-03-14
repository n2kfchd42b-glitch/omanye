import type {
  Program, TeamMember, Donor, FieldSubmission, Document, ActivityEvent,
  Beneficiary, GeoPoint,
} from './types'

// ── Team ─────────────────────────────────────────────────────────────────────

export const TEAM: TeamMember[] = [
  { id: 't1',  name: 'Amara Osei',       role: 'coordinator',    email: 'amara@omanye.org',     region: 'HQ / Accra',  programs: ['p1','p2','p5'], status: 'active',   joinedAt: '2022-01-10' },
  { id: 't2',  name: 'Kwame Asante',     role: 'field-officer',  email: 'kwame@omanye.org',     region: 'Volta',       programs: ['p1'],           status: 'active',   joinedAt: '2022-03-15' },
  { id: 't3',  name: 'Dr. Kofi Ntim',    role: 'm-and-e',        email: 'kofi@omanye.org',      region: 'Ashanti',     programs: ['p3'],           status: 'active',   joinedAt: '2022-05-01' },
  { id: 't4',  name: 'Abena Mensah',     role: 'm-and-e',        email: 'abena@omanye.org',     region: 'Northern',    programs: ['p2','p4'],      status: 'active',   joinedAt: '2022-02-20' },
  { id: 't5',  name: 'Adwoa Poku',       role: 'coordinator',    email: 'adwoa@omanye.org',     region: 'Accra',       programs: ['p5'],           status: 'active',   joinedAt: '2023-01-05' },
  { id: 't6',  name: 'Yaw Darko',        role: 'field-officer',  email: 'yaw@omanye.org',       region: 'Brong-Ahafo', programs: ['p4'],           status: 'active',   joinedAt: '2023-03-12' },
  { id: 't7',  name: 'Dr. Ama Owusu',    role: 'coordinator',    email: 'ama@omanye.org',       region: 'Northern',    programs: ['p6'],           status: 'away',     joinedAt: '2021-11-01' },
  { id: 't8',  name: 'Grace Boateng',    role: 'field-officer',  email: 'grace@omanye.org',     region: 'Northern',    programs: ['p2'],           status: 'active',   joinedAt: '2023-06-01' },
  { id: 't9',  name: 'Femi Ojo',         role: 'field-officer',  email: 'femi@omanye.org',      region: 'Volta',       programs: ['p1'],           status: 'active',   joinedAt: '2023-04-20' },
  { id: 't10', name: 'Seun Adeyemi',     role: 'field-officer',  email: 'seun@omanye.org',      region: 'Northern',    programs: ['p2'],           status: 'active',   joinedAt: '2023-05-10' },
  { id: 't11', name: 'Naomi Asare',      role: 'field-officer',  email: 'naomi@omanye.org',     region: 'Ashanti',     programs: ['p3'],           status: 'active',   joinedAt: '2023-02-14' },
  { id: 't12', name: 'Kojo Mensah',      role: 'field-officer',  email: 'kojo@omanye.org',      region: 'Accra',       programs: ['p5'],           status: 'active',   joinedAt: '2023-07-01' },
]

// ── Programs ─────────────────────────────────────────────────────────────────

export const PROGRAMS: Program[] = [
  {
    id: 'p1', name: 'Clean Water Initiative – Volta Region',
    status: 'active', region: 'Volta Region', country: 'Ghana',
    sector: ['WASH', 'Infrastructure'], lead: 't2',
    team: ['t2','t9','t4'], beneficiaries: 3200, targetBenef: 5000,
    budget: 120_000, spent: 74_500, progress: 64,
    startDate: '2024-02-01', endDate: '2024-12-31',
    description: 'Install community boreholes, rehabilitate existing water points, and train local maintenance committees across 14 communities in the Volta Region.',
    donors: ['d1','d6'], createdAt: '2024-01-15', updatedAt: '2024-03-14',
    indicators: [
      { id: 'i1', label: 'Water points installed',  type: 'output',  baseline: 0,  target: 28, current: 17, unit: 'units' },
      { id: 'i2', label: 'HH with safe water access',type: 'outcome', baseline: 820,target: 5000,current: 3200,unit: 'households' },
      { id: 'i3', label: 'Water-borne illness rate', type: 'impact',  baseline: 38, target: 10, current: 22, unit: '% of children <5' },
    ],
    budgetLines: [
      { id: 'bl1', category: 'Infrastructure', description: 'Borehole drilling & casing', allocated: 70_000, spent: 52_000 },
      { id: 'bl2', category: 'Training',       description: 'Maintenance committee training', allocated: 15_000, spent: 10_500 },
      { id: 'bl3', category: 'Operations',     description: 'Field transport & logistics', allocated: 25_000, spent: 9_000  },
      { id: 'bl4', category: 'M&E',            description: 'Monitoring & evaluation',   allocated: 10_000, spent: 3_000  },
    ],
  },
  {
    id: 'p2', name: "Girls' Education Access Program",
    status: 'active', region: 'Northern Region', country: 'Ghana',
    sector: ['Education', 'Gender'], lead: 't1',
    team: ['t1','t4','t8','t10'], beneficiaries: 1840, targetBenef: 2500,
    budget: 85_000, spent: 52_300, progress: 73,
    startDate: '2024-01-15', endDate: '2024-11-30',
    description: 'Increase school enrollment and retention for girls aged 10–17 through scholarships, community sensitization, and mentorship networks.',
    donors: ['d2','d4','d5'], createdAt: '2024-01-01', updatedAt: '2024-03-12',
    indicators: [
      { id: 'i4', label: 'Girls enrolled',        type: 'output',  baseline: 600,  target: 2500, current: 1840, unit: 'students' },
      { id: 'i5', label: 'Term retention rate',   type: 'outcome', baseline: 0.62, target: 0.85, current: 0.79, unit: 'ratio' },
      { id: 'i6', label: 'Girls passing exams',   type: 'impact',  baseline: 0.48, target: 0.75, current: 0.67, unit: 'ratio' },
    ],
    budgetLines: [
      { id: 'bl5', category: 'Scholarships',  description: 'School fees & materials', allocated: 45_000, spent: 30_000 },
      { id: 'bl6', category: 'Sensitization', description: 'Community outreach',      allocated: 20_000, spent: 12_300 },
      { id: 'bl7', category: 'Mentorship',    description: 'Mentor stipends & training',allocated: 15_000,spent: 8_000  },
      { id: 'bl8', category: 'M&E',           description: 'Data collection & reports', allocated: 5_000, spent: 2_000  },
    ],
  },
  {
    id: 'p3', name: 'Community Health Workers Training',
    status: 'active', region: 'Ashanti Region', country: 'Ghana',
    sector: ['Health', 'Capacity Building'], lead: 't3',
    team: ['t3','t11'], beneficiaries: 480, targetBenef: 600,
    budget: 42_000, spent: 38_900, progress: 80,
    startDate: '2024-03-01', endDate: '2024-09-30',
    description: 'Train and certify 600 community health workers in maternal and child health, basic first aid, and disease surveillance reporting.',
    donors: ['d2','d8'], createdAt: '2024-02-15', updatedAt: '2024-03-13',
    indicators: [
      { id: 'i7', label: 'CHWs trained',      type: 'output',  baseline: 0,   target: 600, current: 480, unit: 'persons' },
      { id: 'i8', label: 'CHWs certified',    type: 'outcome', baseline: 0,   target: 540, current: 380, unit: 'persons' },
      { id: 'i9', label: 'Villages covered',  type: 'impact',  baseline: 0,   target: 80,  current: 62,  unit: 'villages' },
    ],
    budgetLines: [
      { id: 'bl9',  category: 'Training',    description: 'Curriculum, trainers, venues', allocated: 25_000, spent: 24_000 },
      { id: 'bl10', category: 'Stipends',    description: 'Trainee allowances',          allocated: 12_000, spent: 11_200 },
      { id: 'bl11', category: 'Materials',   description: 'Kits and reference guides',   allocated: 3_000,  spent: 2_700  },
      { id: 'bl12', category: 'M&E',         description: 'Assessments & certification', allocated: 2_000,  spent: 1_000  },
    ],
  },
  {
    id: 'p4', name: 'Smallholder Farmer Cooperative',
    status: 'pending', region: 'Brong-Ahafo', country: 'Ghana',
    sector: ['Agriculture', 'Livelihoods'], lead: 't6',
    team: ['t6','t4'], beneficiaries: 0, targetBenef: 2000,
    budget: 95_000, spent: 5_200, progress: 5,
    startDate: '2024-07-01', endDate: '2025-06-30',
    description: 'Organize smallholder farmers into cooperatives, provide input subsidies, market linkages, and digital financial literacy training.',
    donors: ['d7'], createdAt: '2024-05-20', updatedAt: '2024-06-01',
    indicators: [
      { id: 'i10', label: 'Farmers in cooperatives', type: 'output',  baseline: 0, target: 2000, current: 0, unit: 'farmers' },
      { id: 'i11', label: 'Average income increase', type: 'impact',  baseline: 0, target: 35,   current: 0, unit: '% increase' },
    ],
    budgetLines: [
      { id: 'bl13', category: 'Input Subsidies', description: 'Seeds, fertilizer vouchers', allocated: 40_000, spent: 2_000 },
      { id: 'bl14', category: 'Training',        description: 'Agri-business skills',       allocated: 25_000, spent: 1_200 },
      { id: 'bl15', category: 'Market Linkages', description: 'Aggregation & logistics',    allocated: 20_000, spent: 2_000 },
      { id: 'bl16', category: 'Admin',           description: 'Start-up costs',             allocated: 10_000, spent: 0     },
    ],
  },
  {
    id: 'p5', name: 'Urban Refugee Legal Aid Clinic',
    status: 'active', region: 'Greater Accra', country: 'Ghana',
    sector: ['Protection', 'Legal'], lead: 't5',
    team: ['t5','t1','t12'], beneficiaries: 920, targetBenef: 1200,
    budget: 60_000, spent: 41_200, progress: 76,
    startDate: '2024-02-15', endDate: '2024-12-31',
    description: 'Provide free legal advice, asylum application support, and psychosocial referrals to urban refugees and asylum seekers in Greater Accra.',
    donors: ['d2','d3'], createdAt: '2024-02-01', updatedAt: '2024-03-10',
    indicators: [
      { id: 'i12', label: 'Cases handled',        type: 'output',  baseline: 0,    target: 1200, current: 920, unit: 'cases' },
      { id: 'i13', label: 'Successful outcomes',  type: 'outcome', baseline: 0,    target: 0.75, current: 0.71,unit: 'ratio' },
    ],
    budgetLines: [
      { id: 'bl17', category: 'Legal Staff',   description: 'Lawyer stipends',       allocated: 35_000, spent: 28_000 },
      { id: 'bl18', category: 'Outreach',      description: 'Community liaison',     allocated: 12_000, spent: 8_200  },
      { id: 'bl19', category: 'M&E',           description: 'Case management system',allocated: 8_000,  spent: 3_000  },
      { id: 'bl20', category: 'Admin',         description: 'Office & supplies',     allocated: 5_000,  spent: 2_000  },
    ],
  },
  {
    id: 'p6', name: 'Maternal Health Outreach – Tamale',
    status: 'completed', region: 'Northern Region', country: 'Ghana',
    sector: ['Health', 'Maternal'], lead: 't7',
    team: ['t7'], beneficiaries: 1850, targetBenef: 1800,
    budget: 55_000, spent: 54_200, progress: 100,
    startDate: '2023-10-01', endDate: '2024-04-30',
    description: 'Mobile antenatal care clinics, skilled birth attendant training, and postnatal home visits for women in peri-urban Tamale.',
    donors: ['d4'], createdAt: '2023-09-01', updatedAt: '2024-05-01',
    indicators: [
      { id: 'i14', label: 'Women receiving ANC', type: 'output',  baseline: 400,  target: 1800, current: 1850, unit: 'women' },
      { id: 'i15', label: 'Skilled birth rate',  type: 'outcome', baseline: 0.52, target: 0.80, current: 0.83, unit: 'ratio' },
    ],
    budgetLines: [
      { id: 'bl21', category: 'Clinical',    description: 'Medical supplies & ANC kits', allocated: 30_000, spent: 29_800 },
      { id: 'bl22', category: 'Field Staff', description: 'Midwife & CHW stipends',      allocated: 18_000, spent: 17_900 },
      { id: 'bl23', category: 'Transport',   description: 'Mobile clinic vehicle costs', allocated: 7_000,  spent: 6_500  },
    ],
  },
]

// ── Donors ────────────────────────────────────────────────────────────────────

export const DONORS: Donor[] = [
  { id: 'd1', name: 'Rockefeller Foundation',   type: 'foundation', country: 'US', committed: 250_000, disbursed: 180_000, status: 'active',    programs: ['p1','p2'],  lastGift: '2024-03-01' },
  { id: 'd2', name: 'USAID',                    type: 'government', country: 'US', committed: 400_000, disbursed: 400_000, status: 'completed', programs: ['p2','p3','p5'], lastGift: '2024-02-15' },
  { id: 'd3', name: 'Open Society Foundations',  type: 'foundation', country: 'US', committed: 120_000, disbursed: 80_000,  status: 'active',    programs: ['p5'],       lastGift: '2024-03-10' },
  { id: 'd4', name: 'DFID / FCDO',              type: 'government', country: 'UK', committed: 180_000, disbursed: 140_000, status: 'active',    programs: ['p2','p6'],  lastGift: '2024-01-20' },
  { id: 'd5', name: 'MasterCard Foundation',    type: 'foundation', country: 'US', committed: 95_000,  disbursed: 50_000,  status: 'active',    programs: ['p2'],       lastGift: '2024-03-05' },
  { id: 'd6', name: 'GIZ',                      type: 'government', country: 'DE', committed: 75_000,  disbursed: 75_000,  status: 'completed', programs: ['p1'],       lastGift: '2024-01-10' },
  { id: 'd7', name: 'A. Boateng – Individual',  type: 'individual', country: 'GH', committed: 15_000,  disbursed: 15_000,  status: 'active',    programs: ['p4'],       lastGift: '2024-03-18' },
  { id: 'd8', name: 'Comic Relief',             type: 'foundation', country: 'UK', committed: 60_000,  disbursed: 30_000,  status: 'active',    programs: ['p3'],       lastGift: '2024-02-28' },
]

// ── Beneficiaries (sample) ─────────────────────────────────────────────────────

export const BENEFICIARIES: Beneficiary[] = [
  { id: 'b1',  name: 'Ama Asantewaa',    age: 34, gender: 'F', region: 'Volta',       programId: 'p1', status: 'enrolled',  enrolledAt: '2024-03-10' },
  { id: 'b2',  name: 'Kweku Mensah',     age: 28, gender: 'M', region: 'Northern',    programId: 'p2', status: 'active',    enrolledAt: '2024-02-20' },
  { id: 'b3',  name: 'Fatima Al-Amin',   age: 19, gender: 'F', region: 'Northern',    programId: 'p2', status: 'active',    enrolledAt: '2024-02-22' },
  { id: 'b4',  name: 'Kofi Boateng',     age: 45, gender: 'M', region: 'Ashanti',     programId: 'p3', status: 'completed', enrolledAt: '2024-03-05' },
  { id: 'b5',  name: 'Abena Frimpong',   age: 31, gender: 'F', region: 'Accra',       programId: 'p5', status: 'active',    enrolledAt: '2024-03-18' },
  { id: 'b6',  name: 'Ibrahim Seidu',    age: 52, gender: 'M', region: 'Brong-Ahafo', programId: 'p4', status: 'enrolled',  enrolledAt: '2024-06-01' },
  { id: 'b7',  name: 'Adjoa Koomson',    age: 24, gender: 'F', region: 'Volta',       programId: 'p1', status: 'active',    enrolledAt: '2024-03-12' },
  { id: 'b8',  name: 'Yaw Opoku',        age: 39, gender: 'M', region: 'Ashanti',     programId: 'p3', status: 'active',    enrolledAt: '2024-03-06' },
  { id: 'b9',  name: 'Naomi Acheampong', age: 27, gender: 'F', region: 'Accra',       programId: 'p5', status: 'active',    enrolledAt: '2024-03-20' },
  { id: 'b10', name: 'Emmanuel Tetteh',  age: 41, gender: 'M', region: 'Volta',       programId: 'p1', status: 'enrolled',  enrolledAt: '2024-03-14' },
]

// ── Field Submissions ─────────────────────────────────────────────────────────

export const SUBMISSIONS: FieldSubmission[] = [
  { id: 'fs1', workerId: 't2',  workerName: 'Kwame Asante',   region: 'Volta',       formType: 'Household Survey',   programId: 'p1', records: 42, status: 'validated', submittedAt: '2024-03-14', geoLat: 6.9,  geoLng: 0.3  },
  { id: 'fs2', workerId: 't4',  workerName: 'Abena Mensah',   region: 'Northern',    formType: 'School Enrollment',  programId: 'p2', records: 15, status: 'validated', submittedAt: '2024-03-13', geoLat: 9.4,  geoLng: -0.85},
  { id: 'fs3', workerId: 't9',  workerName: 'Femi Ojo',       region: 'Volta',       formType: 'Water Point Audit',  programId: 'p1', records: 8,  status: 'pending',   submittedAt: '2024-03-13', geoLat: 7.1,  geoLng: 0.25 },
  { id: 'fs4', workerId: 't10', workerName: 'Seun Adeyemi',   region: 'Northern',    formType: 'Attendance Sheet',   programId: 'p2', records: 61, status: 'validated', submittedAt: '2024-03-12', geoLat: 9.6,  geoLng: -0.9 },
  { id: 'fs5', workerId: 't11', workerName: 'Naomi Asare',    region: 'Ashanti',     formType: 'Health Screening',   programId: 'p3', records: 30, status: 'flagged',   submittedAt: '2024-03-12', geoLat: 6.7,  geoLng: -1.6 },
  { id: 'fs6', workerId: 't8',  workerName: 'Grace Boateng',  region: 'Northern',    formType: 'Community Meeting',  programId: 'p2', records: 1,  status: 'validated', submittedAt: '2024-03-11', geoLat: 9.5,  geoLng: -0.8 },
  { id: 'fs7', workerId: 't3',  workerName: 'Dr. Kofi Ntim',  region: 'Ashanti',     formType: 'CHW Assessment',     programId: 'p3', records: 12, status: 'pending',   submittedAt: '2024-03-11', geoLat: 6.8,  geoLng: -1.7 },
  { id: 'fs8', workerId: 't12', workerName: 'Kojo Mensah',    region: 'Accra',       formType: 'Legal Case Intake',  programId: 'p5', records: 5,  status: 'validated', submittedAt: '2024-03-10', geoLat: 5.6,  geoLng: -0.2 },
]

// ── Documents ─────────────────────────────────────────────────────────────────

export const DOCUMENTS: Document[] = [
  { id: 'doc1', title: 'Q1 2024 Impact Report',             type: 'report',     programId: 'p1',  author: 'Amara Osei',   status: 'published', format: 'PDF',  sizeKb: 1840, createdAt: '2024-04-05', updatedAt: '2024-04-05' },
  { id: 'doc2', title: "Girls' Education Mid-Year Review",  type: 'report',     programId: 'p2',  author: 'Amara Osei',   status: 'draft',     format: 'PDF',  sizeKb: 920,  createdAt: '2024-06-15', updatedAt: '2024-06-20' },
  { id: 'doc3', title: 'CHW Training Completion Report',    type: 'report',     programId: 'p3',  author: 'Dr. Kofi Ntim',status: 'review',    format: 'PDF',  sizeKb: 650,  createdAt: '2024-05-30', updatedAt: '2024-06-02' },
  { id: 'doc4', title: 'Donor Quarterly Summary – Q1',      type: 'report',     programId: null,  author: 'Adwoa Poku',   status: 'published', format: 'XLSX', sizeKb: 380,  createdAt: '2024-04-10', updatedAt: '2024-04-10' },
  { id: 'doc5', title: 'USAID Disbursement Report',         type: 'report',     programId: 'p5',  author: 'Adwoa Poku',   status: 'submitted', format: 'PDF',  sizeKb: 510,  createdAt: '2024-03-31', updatedAt: '2024-03-31' },
  { id: 'doc6', title: 'GIZ MOU – Volta Water Initiative',  type: 'mou',        programId: 'p1',  author: 'Amara Osei',   status: 'published', format: 'PDF',  sizeKb: 210,  createdAt: '2024-01-20', updatedAt: '2024-01-20' },
  { id: 'doc7', title: 'FY2024 Consolidated Budget',        type: 'budget',     programId: null,  author: 'Adwoa Poku',   status: 'published', format: 'XLSX', sizeKb: 145,  createdAt: '2024-01-05', updatedAt: '2024-03-01' },
  { id: 'doc8', title: 'Farmer Cooperative Proposal',       type: 'proposal',   programId: 'p4',  author: 'Yaw Darko',    status: 'review',    format: 'PDF',  sizeKb: 760,  createdAt: '2024-05-15', updatedAt: '2024-05-20' },
]

// ── Activity feed ─────────────────────────────────────────────────────────────

export const ACTIVITY: ActivityEvent[] = [
  { id: 'a1', type: 'submission', actor: 'Kwame Asante',  message: 'submitted 42 household survey records',          programId: 'p1',  timestamp: '2h ago' },
  { id: 'a2', type: 'report',     actor: 'Amara Osei',    message: 'published Q1 2024 Impact Report',                 programId: 'p1',  timestamp: '5h ago' },
  { id: 'a3', type: 'donor',      actor: 'System',        message: 'Rockefeller Foundation disbursed $30,000',        programId: null,  timestamp: '1d ago' },
  { id: 'a4', type: 'milestone',  actor: 'Dr. Kofi Ntim', message: 'CHW cohort 2 training completed (30/30)',         programId: 'p3',  timestamp: '1d ago' },
  { id: 'a5', type: 'flag',       actor: 'System',        message: 'Flagged: inconsistent records in submission fs5', programId: 'p3',  timestamp: '2d ago' },
  { id: 'a6', type: 'program',    actor: 'Yaw Darko',     message: 'Program "Smallholder Farmer Cooperative" created',programId: 'p4',  timestamp: '3d ago' },
  { id: 'a7', type: 'enrollment', actor: 'Adwoa Poku',    message: '5 new beneficiaries enrolled in Legal Aid',       programId: 'p5',  timestamp: '3d ago' },
]

// ── Chart data ────────────────────────────────────────────────────────────────

export const MONTHLY_BENEF = [
  { label: 'Oct', value: 9100  },
  { label: 'Nov', value: 10200 },
  { label: 'Dec', value: 11400 },
  { label: 'Jan', value: 12300 },
  { label: 'Feb', value: 13600 },
  { label: 'Mar', value: 14832 },
]

export const SECTOR_SPEND = [
  { label: 'WASH',        value: 74_500, color: '#4CAF78' },
  { label: 'Education',   value: 52_300, color: '#2E7D52' },
  { label: 'Health',      value: 93_100, color: '#D4AF5C' },
  { label: 'Livelihoods', value: 5_200,  color: '#7DD4A0' },
  { label: 'Protection',  value: 41_200, color: '#133828' },
]

// ── Geo points (simplified Ghana coords) ─────────────────────────────────────

export const GEO_POINTS: GeoPoint[] = [
  { id: 'g1', lat: 6.90,  lng: 0.30,  label: 'Volta – Water Point',     type: 'program-site', region: 'Volta'       },
  { id: 'g2', lat: 7.10,  lng: 0.25,  label: 'Volta – Survey Site',     type: 'submission',   region: 'Volta'       },
  { id: 'g3', lat: 9.40,  lng: -0.85, label: 'Northern – School A',     type: 'program-site', region: 'Northern'    },
  { id: 'g4', lat: 9.60,  lng: -0.90, label: 'Northern – School B',     type: 'program-site', region: 'Northern'    },
  { id: 'g5', lat: 9.50,  lng: -0.80, label: 'Northern – CHW Site',     type: 'submission',   region: 'Northern'    },
  { id: 'g6', lat: 6.70,  lng: -1.60, label: 'Ashanti – Health Clinic', type: 'program-site', region: 'Ashanti'     },
  { id: 'g7', lat: 6.80,  lng: -1.70, label: 'Ashanti – CHW Screen',    type: 'submission',   region: 'Ashanti'     },
  { id: 'g8', lat: 5.60,  lng: -0.20, label: 'Accra – Legal Aid Clinic',type: 'program-site', region: 'Greater Accra'},
  { id: 'g9', lat: 7.50,  lng: -2.00, label: 'Brong-Ahafo – Farm Co-op',type: 'program-site', region: 'Brong-Ahafo' },
  { id: 'g10',lat: 5.55,  lng: -0.18, label: 'Accra – HQ Office',       type: 'submission',   region: 'Greater Accra'},
]
