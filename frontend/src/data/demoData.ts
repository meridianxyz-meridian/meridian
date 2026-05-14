/**
 * Synthetic patient data for demo — Zarah, 12 years of records across 6 hospitals.
 */
export const DEMO_PATIENT = {
  name: 'Zarah Mitchell',
  dob: '1988-03-14',
  address: '0x7f3a...b2c1',
  conditions: ['Type 2 Diabetes', 'Hypertension', 'Hypothyroidism'],
  currentMedications: ['Metformin 1000mg', 'Lisinopril 10mg', 'Levothyroxine 50mcg', 'Ibuprofen 400mg (PRN)'],
};

export const DEMO_RECORDS = [
  { type: 'diagnosis', date: '2013-04-12', content: 'Diagnosis: Type 2 Diabetes (active)', source: 'St. Mary\'s Hospital' },
  { type: 'prescription', date: '2013-04-12', content: 'Prescribed: Metformin 500mg — twice daily with meals', source: 'Dr. Chen, St. Mary\'s' },
  { type: 'lab', date: '2013-06-20', content: 'HbA1c: 8.2%', source: 'LabCorp' },
  { type: 'lab', date: '2014-01-15', content: 'HbA1c: 7.8%', source: 'LabCorp' },
  { type: 'diagnosis', date: '2015-09-03', content: 'Diagnosis: Hypertension (active)', source: 'Riverside Medical Center' },
  { type: 'prescription', date: '2015-09-03', content: 'Prescribed: Lisinopril 10mg — once daily', source: 'Dr. Patel, Riverside' },
  { type: 'lab', date: '2016-03-22', content: 'eGFR: 78 mL/min/1.73m²', source: 'Quest Diagnostics' },
  { type: 'imaging', date: '2017-11-08', content: 'Chest X-Ray: No acute cardiopulmonary process', source: 'City Radiology' },
  { type: 'diagnosis', date: '2018-02-14', content: 'Diagnosis: Hypothyroidism (active)', source: 'Northside Clinic' },
  { type: 'prescription', date: '2018-02-14', content: 'Prescribed: Levothyroxine 50mcg — once daily on empty stomach', source: 'Dr. Williams, Northside' },
  { type: 'lab', date: '2019-07-30', content: 'TSH: 3.2 mIU/L', source: 'LabCorp' },
  { type: 'lab', date: '2019-07-30', content: 'HbA1c: 7.1%', source: 'LabCorp' },
  { type: 'prescription', date: '2020-05-18', content: 'Prescribed: Metformin 1000mg — twice daily (dose increase)', source: 'Dr. Chen, St. Mary\'s' },
  { type: 'lab', date: '2021-02-10', content: 'eGFR: 71 mL/min/1.73m²', source: 'Quest Diagnostics' },
  { type: 'lab', date: '2021-02-10', content: 'Serum Creatinine: 1.1 mg/dL', source: 'Quest Diagnostics' },
  { type: 'visit', date: '2022-08-25', content: 'Annual physical — BP 138/88, weight 172 lbs', source: 'Valley Health Partners' },
  { type: 'prescription', date: '2022-08-25', content: 'Prescribed: Ibuprofen 400mg — as needed for pain', source: 'Dr. Torres, Valley Health' },
  { type: 'lab', date: '2023-03-14', content: 'HbA1c: 7.4%', source: 'LabCorp' },
  { type: 'lab', date: '2023-03-14', content: 'eGFR: 65 mL/min/1.73m²', source: 'LabCorp' },
  { type: 'lab', date: '2024-01-22', content: 'HbA1c: 7.6%', source: 'LabCorp' },
  { type: 'lab', date: '2024-01-22', content: 'eGFR: 61 mL/min/1.73m²', source: 'LabCorp' },
];

export const DEMO_AI_RESULT = {
  summary: "Zarah has well-documented Type 2 Diabetes, Hypertension, and Hypothyroidism managed across 6 providers over 12 years. Her HbA1c has been trending upward since 2019, and her kidney function (eGFR) has declined from 78 to 61 over 8 years — a pattern that warrants close monitoring.",
  urgentFlags: [
    "⚠️ CRITICAL: Ibuprofen (NSAIDs) is contraindicated with Lisinopril and can accelerate kidney disease — eGFR already declining",
    "⚠️ CRITICAL: Metformin should be used with caution when eGFR < 60 — currently at 61 and trending down",
    "📈 NOTABLE: eGFR declined 17 points over 8 years (78 → 61) — nephrology referral recommended",
  ],
  interactions: [
    {
      drug1: 'Ibuprofen',
      drug2: 'Lisinopril',
      severity: 'severe',
      description: 'NSAIDs reduce the antihypertensive effect of ACE inhibitors and can cause acute kidney injury, especially with existing CKD.',
    },
    {
      drug1: 'Metformin',
      drug2: 'Kidney Function (eGFR 61)',
      severity: 'moderate',
      description: 'Metformin is contraindicated when eGFR < 30 and requires dose review when eGFR < 60. Current eGFR is borderline.',
    },
    {
      drug1: 'Levothyroxine',
      drug2: 'Metformin',
      severity: 'mild',
      description: 'Metformin may reduce levothyroxine absorption. Take levothyroxine 4 hours apart from Metformin.',
    },
  ],
  trialMatches: [
    {
      studyId: 'NCT05234891',
      title: 'SGLT2 Inhibitor Kidney Protection in T2D with Mild CKD',
      sponsor: 'AstraZeneca',
      compensation: '$450',
      matchReason: 'T2D + eGFR 45-75 + Hypertension — exact match',
    },
    {
      studyId: 'NCT04891234',
      title: 'Continuous Glucose Monitoring in Hypothyroid-Diabetic Patients',
      sponsor: 'Dexcom Research',
      compensation: '$350',
      matchReason: 'T2D + Hypothyroidism combination — rare co-morbidity study',
    },
  ],
  timeline: DEMO_RECORDS.map((r, i) => ({
    ...r,
    title: r.content.split(':')[0],
    significance: i === 16 ? 'critical' : (i % 4 === 0 ? 'notable' : 'routine'),
  })),
};
