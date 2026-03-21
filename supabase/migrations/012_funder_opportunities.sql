-- ── Migration 012: Funder Opportunities ──────────────────────────────────────
-- Creates the funder_opportunities table for the grant discovery feature.
-- Stores publicly-available grant opportunities relevant to NGOs.

-- ── Status enum ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE funder_opportunity_status AS ENUM ('active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS funder_opportunities (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funder_name             TEXT        NOT NULL,
  opportunity_title       TEXT        NOT NULL,
  description             TEXT        NOT NULL,
  focus_areas             TEXT[]      NOT NULL DEFAULT '{}',
  eligible_geographies    TEXT[]      NOT NULL DEFAULT '{}',
  funding_range_min       NUMERIC(14, 2),
  funding_range_max       NUMERIC(14, 2),
  eligible_org_types      TEXT[]      NOT NULL DEFAULT '{}',
  application_deadline    DATE,
  external_link           TEXT,
  status                  funder_opportunity_status NOT NULL DEFAULT 'active',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_funding_range CHECK (
    funding_range_min IS NULL OR
    funding_range_max IS NULL OR
    funding_range_max >= funding_range_min
  ),
  CONSTRAINT chk_funding_min_positive CHECK (funding_range_min IS NULL OR funding_range_min >= 0),
  CONSTRAINT chk_funding_max_positive CHECK (funding_range_max IS NULL OR funding_range_max >= 0)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_funder_opps_status
  ON funder_opportunities(status);

CREATE INDEX IF NOT EXISTS idx_funder_opps_deadline
  ON funder_opportunities(application_deadline)
  WHERE application_deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_funder_opps_focus_areas
  ON funder_opportunities USING GIN(focus_areas);

CREATE INDEX IF NOT EXISTS idx_funder_opps_geographies
  ON funder_opportunities USING GIN(eligible_geographies);

CREATE INDEX IF NOT EXISTS idx_funder_opps_funder_name
  ON funder_opportunities(funder_name);

-- ── Auto-updated updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_funder_opportunities_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_funder_opportunities_updated_at ON funder_opportunities;
CREATE TRIGGER trg_funder_opportunities_updated_at
  BEFORE UPDATE ON funder_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_funder_opportunities_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Funder opportunities are public read (any authenticated user can browse).
-- Only service role can insert/update/delete (managed by admin or seed scripts).

ALTER TABLE funder_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funder_opps_read_authenticated" ON funder_opportunities;
CREATE POLICY "funder_opps_read_authenticated"
  ON funder_opportunities FOR SELECT
  TO authenticated
  USING (true);

-- ── Seed: 50 realistic grant opportunities ────────────────────────────────────
-- Deadlines are relative to 2026-03-19 (current date at time of migration).

INSERT INTO funder_opportunities (
  funder_name, opportunity_title, description,
  focus_areas, eligible_geographies,
  funding_range_min, funding_range_max,
  eligible_org_types, application_deadline, external_link, status
) VALUES

-- ── 1. Gates Foundation — Global Health ──────────────────────────────────────
(
  'Bill & Melinda Gates Foundation',
  'Grand Challenges: Innovative Approaches to Child Nutrition',
  'Funding for breakthrough innovations that address persistent challenges in child nutrition across low- and middle-income countries. Focus on cost-effective, scalable solutions that can reach the last mile.',
  ARRAY['health', 'food_security', 'nutrition'],
  ARRAY['Sub-Saharan Africa', 'South Asia', 'Southeast Asia', 'Latin America'],
  100000, 2000000,
  ARRAY['NGO', 'research_institution', 'social_enterprise'],
  '2026-06-30',
  'https://gcgh.grandchallenges.org',
  'active'
),

-- ── 2. USAID — Water & Sanitation ────────────────────────────────────────────
(
  'USAID',
  'Sanitation for All: Community-Led Total Sanitation Program',
  'Supports implementation of community-led total sanitation (CLTS) approaches to eliminate open defecation and improve hygiene practices. Projects must demonstrate a pathway to sustainability beyond grant period.',
  ARRAY['WASH', 'health', 'community_development'],
  ARRAY['Sub-Saharan Africa', 'Southeast Asia'],
  500000, 5000000,
  ARRAY['NGO', 'INGO', 'local_government_partner'],
  '2026-05-15',
  'https://www.usaid.gov/water',
  'active'
),

-- ── 3. FCDO — Education ──────────────────────────────────────────────────────
(
  'FCDO (UK Foreign, Commonwealth & Development Office)',
  'Girls'' Education Challenge Fund — Phase III',
  'Supports programmes that improve learning outcomes and increase access to quality education for marginalised girls, particularly in fragile and conflict-affected states. Applicants must demonstrate evidence of prior impact.',
  ARRAY['education', 'gender_equality', 'protection'],
  ARRAY['Sub-Saharan Africa', 'South Asia'],
  1000000, 10000000,
  ARRAY['INGO', 'NGO', 'consortium'],
  '2026-07-31',
  'https://www.gov.uk/guidance/girls-education-challenge',
  'active'
),

-- ── 4. Wellcome Trust — Health Research ──────────────────────────────────────
(
  'Wellcome Trust',
  'Infectious Disease Research in Sub-Saharan Africa',
  'Funds exploratory research into infectious diseases with high burden in sub-Saharan Africa, including malaria, tuberculosis, HIV, and neglected tropical diseases. Open to early and established career researchers.',
  ARRAY['health', 'research'],
  ARRAY['Sub-Saharan Africa', 'East Africa', 'West Africa'],
  50000, 500000,
  ARRAY['research_institution', 'university', 'NGO_with_research_arm'],
  '2026-09-01',
  'https://wellcome.org/grant-funding',
  'active'
),

-- ── 5. Comic Relief — Livelihoods ────────────────────────────────────────────
(
  'Comic Relief',
  'Power the Fight: Economic Empowerment for Women',
  'Supports programmes that create sustainable livelihoods for women living in poverty through skills training, market linkages, and access to finance. Preference for locally-led organisations with strong community roots.',
  ARRAY['livelihoods', 'gender_equality', 'economic_empowerment'],
  ARRAY['Sub-Saharan Africa', 'Latin America', 'Southeast Asia'],
  50000, 300000,
  ARRAY['local_NGO', 'community_based_organisation', 'social_enterprise'],
  '2026-05-01',
  'https://www.comicrelief.com/grants',
  'active'
),

-- ── 6. EU Humanitarian Aid (ECHO) — Emergency Response ───────────────────────
(
  'European Commission Humanitarian Aid (ECHO)',
  'WASH in Humanitarian Settings — East Africa',
  'Emergency and recovery WASH programming in displacement settings across East Africa. Targets camps, informal settlements, and host communities. Requires previous humanitarian experience and valid DG ECHO partnership.',
  ARRAY['WASH', 'humanitarian', 'displacement'],
  ARRAY['East Africa', 'Horn of Africa', 'Kenya', 'Ethiopia', 'Somalia'],
  200000, 3000000,
  ARRAY['INGO', 'NGO', 'UN_implementing_partner'],
  '2026-04-30',
  'https://civil-protection-humanitarian-aid.ec.europa.eu',
  'active'
),

-- ── 7. World Food Programme — Food Security ──────────────────────────────────
(
  'World Food Programme (WFP)',
  'Purchase for Progress: Smallholder Market Access Programme',
  'Connects smallholder farmers to institutional food procurement, building resilience and improving income. NGOs provide technical assistance, aggregation, and post-harvest loss reduction support.',
  ARRAY['food_security', 'livelihoods', 'agriculture'],
  ARRAY['Sub-Saharan Africa', 'Latin America'],
  150000, 1500000,
  ARRAY['NGO', 'INGO', 'cooperative'],
  '2026-08-15',
  'https://www.wfp.org/purchase-for-progress',
  'active'
),

-- ── 8. Open Society Foundations — Rights & Protection ────────────────────────
(
  'Open Society Foundations',
  'Strengthening Civil Society in Fragile States',
  'Supports civil society organisations working to protect human rights, strengthen accountability, and protect vulnerable populations in fragile or authoritarian environments. Emphasis on locally-led advocacy.',
  ARRAY['protection', 'human_rights', 'governance', 'civil_society'],
  ARRAY['West Africa', 'Latin America', 'Southeast Asia'],
  100000, 500000,
  ARRAY['local_NGO', 'human_rights_organisation', 'advocacy_organisation'],
  '2026-06-15',
  'https://www.opensocietyfoundations.org/grants',
  'active'
),

-- ── 9. GAVI — Immunisation ────────────────────────────────────────────────────
(
  'Gavi, the Vaccine Alliance',
  'Health Systems Strengthening Support for Routine Immunisation',
  'Civil society engagement grants to support last-mile delivery of childhood vaccines and strengthen demand for immunisation services, particularly in underserved communities.',
  ARRAY['health', 'immunisation', 'community_health'],
  ARRAY['Sub-Saharan Africa', 'South Asia', 'Southeast Asia'],
  75000, 750000,
  ARRAY['NGO', 'INGO', 'faith_based_organisation'],
  '2026-07-01',
  'https://www.gavi.org/investing-gavi/funding/civil-society-support',
  'active'
),

-- ── 10. Ford Foundation — Education & Equity ─────────────────────────────────
(
  'Ford Foundation',
  'Quality Education for Marginalised Communities in Latin America',
  'Supports inclusive education programmes for indigenous, Afro-descendant, and rural communities in Latin America. Focuses on culturally relevant pedagogy, teacher training, and community school governance.',
  ARRAY['education', 'equity', 'indigenous_rights'],
  ARRAY['Latin America', 'Brazil', 'Colombia', 'Mexico', 'Peru'],
  200000, 800000,
  ARRAY['NGO', 'community_organisation', 'university_partnership'],
  '2026-10-31',
  'https://www.fordfoundation.org/work/our-grants',
  'active'
),

-- ── 11. UNHCR — Refugee Protection ───────────────────────────────────────────
(
  'UNHCR',
  'Community-Based Protection in Refugee Settings',
  'NGO implementing partners sought for community protection programming in large refugee settlements. Activities include legal aid, psychosocial support, and case management for persons with specific needs.',
  ARRAY['protection', 'displacement', 'legal_aid', 'psychosocial'],
  ARRAY['East Africa', 'Central Africa', 'West Africa'],
  300000, 2000000,
  ARRAY['INGO', 'NGO', 'legal_aid_organisation'],
  '2026-04-15',
  'https://www.unhcr.org/partnerships/ngos',
  'active'
),

-- ── 12. Médecins Sans Frontières Foundation — Health ─────────────────────────
(
  'MSF Foundation',
  'Access to Healthcare Innovation Fund',
  'Supports applied research and pilot projects that tackle barriers to healthcare access in low-resource settings. Priority areas include diagnostics, treatment protocols, and community health worker systems.',
  ARRAY['health', 'research', 'access_to_medicines'],
  ARRAY['Sub-Saharan Africa', 'Southeast Asia', 'Latin America'],
  30000, 150000,
  ARRAY['NGO', 'research_institution', 'independent_researcher'],
  '2026-05-31',
  'https://www.fondation-medecins-sans-frontieres.org',
  'active'
),

-- ── 13. Mastercard Foundation — Youth Employment ─────────────────────────────
(
  'Mastercard Foundation',
  'Young Africa Works: Digital Skills & Entrepreneurship',
  'Seeks partners to deliver market-relevant digital skills training and entrepreneurship support to young Africans, with a focus on women and people living in rural areas.',
  ARRAY['livelihoods', 'youth', 'education', 'economic_empowerment'],
  ARRAY['Sub-Saharan Africa', 'East Africa', 'West Africa', 'Southern Africa'],
  500000, 5000000,
  ARRAY['INGO', 'NGO', 'social_enterprise', 'training_institution'],
  '2026-06-30',
  'https://mastercardfdn.org/young-africa-works',
  'active'
),

-- ── 14. DFAT Australia — Pacific WASH ────────────────────────────────────────
(
  'DFAT (Australian Department of Foreign Affairs and Trade)',
  'Pacific WASH Program — Community Water Systems',
  'Funds construction, rehabilitation, and community management of rural water supply systems in Pacific Island nations and Southeast Asia. Requires participatory design and female representation in water committees.',
  ARRAY['WASH', 'community_development', 'water'],
  ARRAY['Southeast Asia', 'Pacific', 'Myanmar', 'Timor-Leste', 'Cambodia'],
  250000, 2500000,
  ARRAY['INGO', 'NGO', 'Australian_NGO'],
  '2026-08-01',
  'https://www.dfat.gov.au/development/who-we-work-with/ngos',
  'active'
),

-- ── 15. Children's Investment Fund Foundation (CIFF) — Nutrition ─────────────
(
  'Children''s Investment Fund Foundation (CIFF)',
  'Stunting Prevention: First 1000 Days Programme',
  'Supports evidence-based interventions targeting the critical first 1000 days from conception to age two. Activities include nutrition counselling, micronutrient supplementation, and behaviour change communication.',
  ARRAY['health', 'nutrition', 'food_security', 'early_childhood'],
  ARRAY['Sub-Saharan Africa', 'South Asia', 'Southeast Asia'],
  400000, 4000000,
  ARRAY['NGO', 'INGO', 'health_organisation'],
  '2026-07-15',
  'https://ciff.org/grant-funding',
  'active'
),

-- ── 16. Aga Khan Foundation — Livelihoods ────────────────────────────────────
(
  'Aga Khan Foundation',
  'Integrated Rural Development Programme — East Africa',
  'Holistic rural development including crop productivity, market access, financial inclusion, and natural resource management. Requires community co-design and gender mainstreaming across all activities.',
  ARRAY['livelihoods', 'food_security', 'agriculture', 'financial_inclusion'],
  ARRAY['East Africa', 'Kenya', 'Tanzania', 'Uganda', 'Mozambique'],
  200000, 2000000,
  ARRAY['NGO', 'community_based_organisation', 'cooperative'],
  '2026-09-30',
  'https://www.akdn.org/akf/grants',
  'active'
),

-- ── 17. Global Fund — HIV/AIDS ────────────────────────────────────────────────
(
  'The Global Fund',
  'Community Systems Strengthening — HIV/AIDS Prevention',
  'Supports community-based HIV prevention, testing, treatment adherence, and stigma reduction. Key populations (sex workers, LGBTQ+, people who inject drugs) must be meaningfully engaged in programme design.',
  ARRAY['health', 'HIV_AIDS', 'community_health', 'key_populations'],
  ARRAY['Sub-Saharan Africa', 'Southeast Asia', 'Latin America'],
  300000, 3000000,
  ARRAY['local_NGO', 'community_based_organisation', 'key_population_organisation'],
  '2026-05-30',
  'https://www.theglobalfund.org/en/applying-for-funding',
  'active'
),

-- ── 18. UNICEF — Child Protection ────────────────────────────────────────────
(
  'UNICEF',
  'Child Protection in Humanitarian Action — West Africa',
  'Civil society partners sought to deliver child protection programming including case management, psychosocial support, family tracing, and community-based prevention in conflict-affected areas.',
  ARRAY['protection', 'child_rights', 'humanitarian', 'psychosocial'],
  ARRAY['West Africa', 'Sahel', 'Nigeria', 'Mali', 'Niger', 'Burkina Faso'],
  100000, 1000000,
  ARRAY['INGO', 'NGO', 'community_based_organisation'],
  '2026-04-30',
  'https://www.unicef.org/partnerships/civil-society',
  'active'
),

-- ── 19. Sida (Sweden) — Health Systems ───────────────────────────────────────
(
  'Swedish International Development Cooperation Agency (Sida)',
  'Strengthening Primary Health Care in Rural Areas',
  'Funds improvements to primary health care access for underserved rural populations through facility strengthening, supply chain support, and community health worker capacity building.',
  ARRAY['health', 'health_systems', 'community_health'],
  ARRAY['Sub-Saharan Africa', 'Southeast Asia', 'East Africa'],
  300000, 3000000,
  ARRAY['INGO', 'NGO', 'health_ministry_partner'],
  '2026-08-31',
  'https://www.sida.se/en/apply-for-grants',
  'active'
),

-- ── 20. Rockefeller Foundation — Food Systems ─────────────────────────────────
(
  'The Rockefeller Foundation',
  'True Cost of Food: Sustainable Agri-Food Systems Transformation',
  'Supports initiatives that shift food systems toward greater sustainability, nutrition, and equity. Activities include smallholder farmer support, supply chain transparency, and reducing food loss and waste.',
  ARRAY['food_security', 'agriculture', 'environment', 'livelihoods'],
  ARRAY['Sub-Saharan Africa', 'South Asia', 'Southeast Asia', 'Latin America'],
  250000, 2500000,
  ARRAY['NGO', 'INGO', 'research_institution', 'social_enterprise'],
  '2026-10-15',
  'https://www.rockefellerfoundation.org/grants',
  'active'
),

-- ── 21. GIZ — Vocational Training ────────────────────────────────────────────
(
  'GIZ (Deutsche Gesellschaft für Internationale Zusammenarbeit)',
  'TVET for Employment: Technical and Vocational Skills in Africa',
  'Funds technical and vocational education and training (TVET) programmes that equip young people with market-relevant skills, with particular attention to green economy and digital sectors.',
  ARRAY['education', 'livelihoods', 'youth', 'vocational_training'],
  ARRAY['Sub-Saharan Africa', 'East Africa', 'West Africa', 'Southern Africa'],
  200000, 1500000,
  ARRAY['INGO', 'NGO', 'training_institution', 'private_sector_partner'],
  '2026-06-01',
  'https://www.giz.de/en/html/4534.html',
  'active'
),

-- ── 22. IRC — Protection / GBV ────────────────────────────────────────────────
(
  'International Rescue Committee (IRC)',
  'Women''s Protection and Empowerment Sub-Grants',
  'Sub-grants for local organisations implementing gender-based violence (GBV) prevention, response, and women''s empowerment activities in crisis settings. Partners must have existing case management capacity.',
  ARRAY['protection', 'gender_equality', 'GBV', 'humanitarian'],
  ARRAY['East Africa', 'Horn of Africa', 'Democratic Republic of Congo', 'Nigeria'],
  50000, 250000,
  ARRAY['local_NGO', 'women_led_organisation', 'community_based_organisation'],
  '2026-05-15',
  'https://www.rescue.org/page/partner-with-us',
  'active'
),

-- ── 23. Bloomberg Philanthropies — Health/Tobacco ────────────────────────────
(
  'Bloomberg Philanthropies',
  'Bloomberg Initiative to Reduce Tobacco Use — Grant Awards',
  'Supports country-level civil society advocacy and implementation of evidence-based tobacco control measures, including graphic health warnings, advertising bans, and cessation services.',
  ARRAY['health', 'tobacco_control', 'advocacy', 'non_communicable_diseases'],
  ARRAY['Southeast Asia', 'Sub-Saharan Africa', 'Latin America'],
  100000, 1000000,
  ARRAY['NGO', 'advocacy_organisation', 'public_health_organisation'],
  '2026-09-15',
  'https://www.bloomberg.org/public-health/reducing-tobacco-use/grant-awards',
  'active'
),

-- ── 24. Oxfam — Food Security / Humanitarian ─────────────────────────────────
(
  'Oxfam',
  'GROW Campaign: Resilient Agriculture Sub-Grants',
  'Sub-grants for small and medium local organisations implementing climate-resilient agriculture, agroecology, and food sovereignty programmes. Emphasis on women farmers and indigenous knowledge systems.',
  ARRAY['food_security', 'agriculture', 'climate_adaptation', 'gender_equality'],
  ARRAY['West Africa', 'Southern Africa', 'Latin America'],
  25000, 150000,
  ARRAY['local_NGO', 'community_based_organisation', 'farmer_cooperative'],
  '2026-04-15',
  'https://www.oxfam.org/en/grants-civil-society-organisations',
  'active'
),

-- ── 25. MacArthur Foundation — Protection ────────────────────────────────────
(
  'MacArthur Foundation',
  '100&Change: Bold Solutions to Critical Problems',
  'A competition for a single $100M grant to fund a bold solution to a critical problem of our time. Any organisation worldwide can apply. Strong preference for measurable, evidence-based interventions.',
  ARRAY['protection', 'human_rights', 'health', 'climate', 'education'],
  ARRAY['Global', 'Sub-Saharan Africa', 'Latin America', 'Southeast Asia'],
  100000000, 100000000,
  ARRAY['NGO', 'INGO', 'social_enterprise', 'research_institution', 'university'],
  '2026-11-01',
  'https://www.macfound.org/programs/100change',
  'active'
),

-- ── 26. Norwegian Refugee Council — WASH/Education in Emergencies ─────────────
(
  'Norwegian Refugee Council (NRC)',
  'Education in Emergencies — Accelerated Learning Programme',
  'Funds accelerated education for over-age and out-of-school children in conflict and displacement contexts. Local partners with school management capacity prioritised.',
  ARRAY['education', 'humanitarian', 'displacement', 'child_rights'],
  ARRAY['Horn of Africa', 'Central Africa', 'West Africa', 'Middle East'],
  75000, 500000,
  ARRAY['local_NGO', 'INGO', 'education_organisation'],
  '2026-07-01',
  'https://www.nrc.no/what-we-do/education',
  'active'
),

-- ── 27. IFC / World Bank — SME Finance ───────────────────────────────────────
(
  'International Finance Corporation (IFC)',
  'SME Ventures: Blended Finance for Small Business Growth',
  'Blended finance facility providing technical assistance grants alongside investment for organisations building sustainable SME ecosystems, with focus on women-owned and youth-owned businesses.',
  ARRAY['livelihoods', 'financial_inclusion', 'economic_empowerment', 'private_sector_development'],
  ARRAY['Sub-Saharan Africa', 'Southeast Asia', 'Latin America'],
  100000, 1000000,
  ARRAY['social_enterprise', 'financial_institution', 'NGO_with_enterprise_arm'],
  '2026-08-15',
  'https://www.ifc.org/wps/wcm/connect/topics_ext_content/ifc_external_corporate_site/sme+ventures',
  'active'
),

-- ── 28. Conrad N. Hilton Foundation — Vulnerable Populations ─────────────────
(
  'Conrad N. Hilton Foundation',
  'Safe Water for Children: WASH in Schools and Health Facilities',
  'Supports integration of safe water, sanitation, and hygiene into primary schools and health facilities across sub-Saharan Africa. Must demonstrate government engagement and transition plans.',
  ARRAY['WASH', 'education', 'health', 'child_rights'],
  ARRAY['Sub-Saharan Africa', 'East Africa', 'West Africa'],
  200000, 2000000,
  ARRAY['INGO', 'NGO', 'local_government_partner'],
  '2026-09-01',
  'https://www.hiltonfoundation.org/grants',
  'active'
),

-- ── 29. Inter-American Development Bank — Latin America Education ─────────────
(
  'Inter-American Development Bank (IDB)',
  'Digital Futures: Technology-Enhanced Learning in LAC',
  'Grants for organisations integrating low-cost digital tools into primary and secondary education in Latin America and the Caribbean, with attention to internet-limited and rural settings.',
  ARRAY['education', 'digital', 'technology', 'youth'],
  ARRAY['Latin America', 'Caribbean', 'Brazil', 'Colombia', 'Mexico', 'Guatemala'],
  150000, 1000000,
  ARRAY['NGO', 'social_enterprise', 'edtech_organisation', 'university'],
  '2026-06-15',
  'https://www.iadb.org/en/topics/education',
  'active'
),

-- ── 30. Hewlett Foundation — Population & Reproductive Health ─────────────────
(
  'William and Flora Hewlett Foundation',
  'Reproductive Health: Contraceptive Access in Sub-Saharan Africa',
  'Supports scaling access to family planning services, particularly for adolescent girls and rural women. Partners must have experience in social behaviour change communication and supply chain strengthening.',
  ARRAY['health', 'reproductive_health', 'gender_equality', 'community_health'],
  ARRAY['Sub-Saharan Africa', 'West Africa', 'East Africa'],
  200000, 1500000,
  ARRAY['NGO', 'health_organisation', 'INGO'],
  '2026-07-31',
  'https://hewlett.org/grants',
  'active'
),

-- ── 31. AECID — Latin America ────────────────────────────────────────────────
(
  'AECID (Spanish Agency for International Development Cooperation)',
  'Food Security and Rural Development in Central America',
  'Supports food security, smallholder agriculture, and rural livelihood programmes in Central America. Emphasis on climate adaptation and indigenous and rural community engagement.',
  ARRAY['food_security', 'agriculture', 'livelihoods', 'climate_adaptation'],
  ARRAY['Latin America', 'Central America', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua'],
  100000, 800000,
  ARRAY['NGO', 'local_organisation', 'Spanish_NGO_partner'],
  '2026-05-31',
  'https://www.aecid.es/en/grants',
  'active'
),

-- ── 32. KOICA — Southeast Asia ───────────────────────────────────────────────
(
  'Korea International Cooperation Agency (KOICA)',
  'Community Health Volunteers Programme — Mekong Region',
  'Strengthens community health systems in the Mekong region through training and equipping community health volunteers, improving access to primary healthcare in remote areas.',
  ARRAY['health', 'community_health', 'capacity_building'],
  ARRAY['Southeast Asia', 'Cambodia', 'Laos', 'Vietnam', 'Myanmar'],
  100000, 1000000,
  ARRAY['INGO', 'NGO', 'Korean_NGO_partner'],
  '2026-08-31',
  'https://www.koica.go.kr/sites/koica_en',
  'active'
),

-- ── 33. ActionAid — Women & Food ─────────────────────────────────────────────
(
  'ActionAid',
  'Women''s Economic Power: Agroecology and Food Sovereignty',
  'Sub-grants for women-led organisations and cooperatives working on agroecology, feminist food systems, and women''s land rights. Must operate in ActionAid programme countries.',
  ARRAY['food_security', 'gender_equality', 'agriculture', 'land_rights'],
  ARRAY['Sub-Saharan Africa', 'South Asia', 'Latin America'],
  20000, 100000,
  ARRAY['women_led_organisation', 'local_NGO', 'farmer_cooperative'],
  '2026-05-01',
  'https://actionaid.org/partnerships',
  'active'
),

-- ── 34. Alliance for a Green Revolution in Africa (AGRA) ─────────────────────
(
  'Alliance for a Green Revolution in Africa (AGRA)',
  'Smallholder Farmer Productivity and Market Access',
  'Supports delivery of improved seeds, fertiliser, and extension services to smallholder farmers, alongside market linkage and post-harvest management to reduce food insecurity.',
  ARRAY['food_security', 'agriculture', 'livelihoods'],
  ARRAY['Sub-Saharan Africa', 'East Africa', 'West Africa', 'Southern Africa'],
  250000, 2000000,
  ARRAY['NGO', 'agricultural_organisation', 'cooperative', 'agri_social_enterprise'],
  '2026-10-01',
  'https://agra.org/grants',
  'active'
),

-- ── 35. JICA — Japan / Southeast Asia ────────────────────────────────────────
(
  'Japan International Cooperation Agency (JICA)',
  'SDGs Partnership Programme: WASH and Health in Southeast Asia',
  'Co-funding scheme for Japanese NGOs and their local partners working on water, sanitation, and community health. Projects must align with Japan''s SDG priorities and include Japanese expertise.',
  ARRAY['WASH', 'health', 'community_development'],
  ARRAY['Southeast Asia', 'Philippines', 'Indonesia', 'Cambodia', 'Myanmar'],
  100000, 1000000,
  ARRAY['INGO', 'Japanese_NGO_with_local_partner', 'local_NGO'],
  '2026-07-15',
  'https://www.jica.go.jp/english/our_work/types_of_assistance/grant',
  'active'
),

-- ── 36. Skoll Foundation — Social Entrepreneurs ──────────────────────────────
(
  'Skoll Foundation',
  'Skoll Award for Social Entrepreneurship',
  'Recognises and scales social entrepreneurs who have demonstrated ability to drive change at scale. Winners receive a three-year package of funding and support to expand their impact globally.',
  ARRAY['livelihoods', 'health', 'education', 'environment', 'food_security'],
  ARRAY['Global', 'Sub-Saharan Africa', 'Southeast Asia', 'Latin America'],
  1500000, 1500000,
  ARRAY['social_enterprise', 'NGO_with_earned_income'],
  '2026-09-15',
  'https://skoll.org/skoll-award',
  'active'
),

-- ── 37. Vodafone Foundation — Digital Health ─────────────────────────────────
(
  'Vodafone Foundation',
  'Instant Network Schools: Connected Learning in Displacement',
  'Deploys satellite-connected school-in-a-box solutions in refugee and displacement settings, enabling digital learning where internet connectivity is otherwise unavailable.',
  ARRAY['education', 'digital', 'displacement', 'humanitarian'],
  ARRAY['Sub-Saharan Africa', 'East Africa', 'West Africa'],
  50000, 300000,
  ARRAY['INGO', 'NGO', 'education_technology_organisation'],
  '2026-06-30',
  'https://www.vodafone.com/foundation',
  'active'
),

-- ── 38. Cartier Philanthropy — Women & Girls ─────────────────────────────────
(
  'Cartier Philanthropy',
  'Access to Basic Services for Women and Children',
  'Funds programmes improving access to healthcare, safe water, and education for women and children in underserved communities. Long-term partnership approach with preference for locally-rooted organisations.',
  ARRAY['health', 'WASH', 'education', 'gender_equality', 'child_rights'],
  ARRAY['Sub-Saharan Africa', 'South Asia', 'Southeast Asia', 'Latin America'],
  100000, 500000,
  ARRAY['local_NGO', 'community_based_organisation', 'small_INGO'],
  '2026-08-01',
  'https://www.cartier-philanthropy.org',
  'active'
),

-- ── 39. Mo Ibrahim Foundation — Governance / Africa ──────────────────────────
(
  'Mo Ibrahim Foundation',
  'Civil Society Strengthening: Governance and Accountability in Africa',
  'Supports African civil society organisations working on governance, rule of law, anti-corruption, and political inclusion, with emphasis on women and youth political participation.',
  ARRAY['governance', 'civil_society', 'human_rights', 'accountability'],
  ARRAY['Sub-Saharan Africa', 'Pan-African'],
  50000, 300000,
  ARRAY['African_NGO', 'advocacy_organisation', 'think_tank'],
  '2026-07-31',
  'https://mo.ibrahim.foundation/grants',
  'active'
),

-- ── 40. Packard Foundation — Population / Environment ────────────────────────
(
  'David and Lucile Packard Foundation',
  'Conservation and Science: Community Marine Resource Management',
  'Supports community-based management of marine resources in coastal communities, integrating livelihoods, food security, and environmental sustainability.',
  ARRAY['livelihoods', 'food_security', 'environment', 'community_development'],
  ARRAY['Southeast Asia', 'Philippines', 'Indonesia', 'Pacific'],
  200000, 1000000,
  ARRAY['NGO', 'INGO', 'conservation_organisation', 'fishing_cooperative'],
  '2026-11-30',
  'https://www.packard.org/what-we-fund',
  'active'
),

-- ── 41. Porticus — Education & Faith ─────────────────────────────────────────
(
  'Porticus',
  'Faith-Based Schools: Quality and Inclusion',
  'Improves quality of education in faith-based schools across Africa and Latin America through teacher training, curriculum support, and inclusive education for children with disabilities.',
  ARRAY['education', 'faith_based', 'inclusive_education', 'disability'],
  ARRAY['Sub-Saharan Africa', 'Latin America'],
  100000, 700000,
  ARRAY['faith_based_organisation', 'NGO', 'school_network'],
  '2026-09-30',
  'https://www.porticus.org/grants',
  'active'
),

-- ── 42. European Union — Food Security Africa ─────────────────────────────────
(
  'European Union External Investment Plan',
  'SWITCH to Green: Sustainable Agriculture in the Sahel',
  'Supports climate-smart agriculture, land rehabilitation, and food system resilience in Sahel countries. Projects must demonstrate cross-border collaboration or scalable regional models.',
  ARRAY['food_security', 'agriculture', 'climate_adaptation', 'environment'],
  ARRAY['Sahel', 'Mali', 'Burkina Faso', 'Niger', 'Chad', 'Senegal'],
  500000, 5000000,
  ARRAY['INGO', 'NGO', 'consortium', 'research_institution'],
  '2026-10-31',
  'https://ec.europa.eu/europeaid/funding/funding-instruments-programming/funding-instruments',
  'active'
),

-- ── 43. SIDA / Norad Joint — Myanmar Livelihoods ─────────────────────────────
(
  'Norway Ministry of Foreign Affairs (Norad)',
  'Humanitarian Response and Resilience in Myanmar',
  'Funding for humanitarian response, livelihoods recovery, and protection programming in conflict-affected areas of Myanmar. Partners must have active presence in-country.',
  ARRAY['humanitarian', 'livelihoods', 'protection', 'food_security'],
  ARRAY['Southeast Asia', 'Myanmar'],
  200000, 2000000,
  ARRAY['INGO', 'NGO', 'UN_implementing_partner'],
  '2026-05-15',
  'https://www.norad.no/en/front/funding',
  'active'
),

-- ── 44. Hewlett / OAK Foundation — Child Protection ──────────────────────────
(
  'Oak Foundation',
  'CPIT: Child Protection Integration in Humanitarian Programming',
  'Strengthens child protection mainstreaming across humanitarian sectors. Funds training, coordination mechanisms, and integrated programming between child protection and other clusters.',
  ARRAY['protection', 'child_rights', 'humanitarian', 'capacity_building'],
  ARRAY['Sub-Saharan Africa', 'East Africa', 'Latin America', 'Southeast Asia'],
  150000, 800000,
  ARRAY['INGO', 'NGO', 'child_focused_organisation'],
  '2026-08-15',
  'https://oakfnd.org/grants',
  'active'
),

-- ── 45. Standard Chartered — Health and WASH ─────────────────────────────────
(
  'Standard Chartered Foundation',
  'Futuremakers: Tackling Inequality Through Employability and Financial Inclusion',
  'Supports programmes that improve employability and financial literacy for young people from low-income communities, with strong focus on young women and people with disabilities.',
  ARRAY['livelihoods', 'financial_inclusion', 'youth', 'gender_equality', 'disability'],
  ARRAY['Sub-Saharan Africa', 'Southeast Asia', 'South Asia'],
  50000, 400000,
  ARRAY['NGO', 'social_enterprise', 'training_institution', 'microfinance_institution'],
  '2026-06-30',
  'https://www.sc.com/en/sustainability/futuremakers',
  'active'
),

-- ── 46. UNFPA — Reproductive Health / Gender ─────────────────────────────────
(
  'UNFPA',
  'Safe Motherhood Initiative: Reducing Maternal Mortality',
  'Funds skilled birth attendance, antenatal care, emergency obstetric care, and community referral systems. Priority given to countries with high maternal mortality ratios.',
  ARRAY['health', 'reproductive_health', 'gender_equality', 'maternal_health'],
  ARRAY['Sub-Saharan Africa', 'South Asia', 'Southeast Asia'],
  100000, 800000,
  ARRAY['NGO', 'health_organisation', 'midwifery_organisation'],
  '2026-07-01',
  'https://www.unfpa.org/civil-society/grants',
  'active'
),

-- ── 47. C&A Foundation — Livelihoods / Supply Chain ──────────────────────────
(
  'C&A Foundation',
  'Living Wages in Garment Supply Chains — Southeast Asia',
  'Supports multi-stakeholder programmes that drive living wages and improved working conditions for garment workers, particularly women. Requires factory or brand partner co-commitment.',
  ARRAY['livelihoods', 'labour_rights', 'gender_equality', 'economic_empowerment'],
  ARRAY['Southeast Asia', 'Bangladesh', 'Cambodia', 'Vietnam', 'Indonesia'],
  200000, 1500000,
  ARRAY['NGO', 'labour_rights_organisation', 'industry_body_partner'],
  '2026-09-01',
  'https://www.candafoundation.org/grants',
  'active'
),

-- ── 48. GAIN — Nutrition ──────────────────────────────────────────────────────
(
  'Global Alliance for Improved Nutrition (GAIN)',
  'Fortification Initiative: Staple Food Fortification in Sub-Saharan Africa',
  'Supports national-scale staple food fortification programmes including wheat flour, maize flour, rice, and vegetable oil fortification, working through government and private sector platforms.',
  ARRAY['nutrition', 'food_security', 'health'],
  ARRAY['Sub-Saharan Africa', 'East Africa', 'West Africa', 'Southern Africa'],
  300000, 3000000,
  ARRAY['INGO', 'NGO', 'private_sector_NGO_consortium'],
  '2026-10-15',
  'https://www.gainhealth.org/programs/grants',
  'active'
),

-- ── 49. HELVETAS — WASH / Livelihoods ────────────────────────────────────────
(
  'HELVETAS Swiss Intercooperation',
  'Water for All: Sustainable Rural WASH in West Africa',
  'Develops and rehabilitates sustainable rural water systems with strong community ownership models. Partners must demonstrate WASH governance experience and government coordination capacity.',
  ARRAY['WASH', 'community_development', 'governance'],
  ARRAY['West Africa', 'Burkina Faso', 'Mali', 'Ghana', 'Benin', 'Togo'],
  150000, 1200000,
  ARRAY['local_NGO', 'INGO', 'WASH_organisation'],
  '2026-08-01',
  'https://www.helvetas.org/en/grants',
  'active'
),

-- ── 50. Tides Foundation — Latin America / Social Justice ────────────────────
(
  'Tides Foundation',
  'Advancing Racial Equity in Latin America: Afro-descendant Rights',
  'Supports Afro-descendant communities and organisations across Latin America working on land rights, political representation, access to quality education, and economic empowerment.',
  ARRAY['human_rights', 'racial_equity', 'livelihoods', 'education', 'land_rights'],
  ARRAY['Latin America', 'Brazil', 'Colombia', 'Ecuador', 'Honduras', 'Guatemala'],
  50000, 300000,
  ARRAY['Afro_descendant_led_organisation', 'local_NGO', 'advocacy_organisation'],
  '2026-11-15',
  'https://www.tides.org/grants',
  'active'
);
