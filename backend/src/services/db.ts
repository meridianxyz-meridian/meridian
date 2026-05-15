/**
 * Simple JSON file database for patient data.
 * Persists to data/patients.json — survives server restarts.
 * In production, replace with a real DB (Postgres, MongoDB, etc.)
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DB_FILE = join(DATA_DIR, 'patients.json');

export interface PatientRecord {
  id: string;
  type: string;
  date: string;
  content: string;
  source: string;
  walrusBlobId?: string;
  sealKeyId?: string;
  significance?: string;
  uploadedAt: number;
}

export interface AIAnalysis {
  summary: string;
  urgentFlags: string[];
  interactions: any[];
  trialMatches: any[];
  generatedAt: number;
}

export interface PatientData {
  address: string;
  name: string;
  records: PatientRecord[];
  analysis: AIAnalysis | null;
  updatedAt: number;
}

type DB = Record<string, PatientData>;

function readDB(): DB {
  if (!existsSync(DB_FILE)) return {};
  try {
    return JSON.parse(readFileSync(DB_FILE, 'utf-8')) as DB;
  } catch {
    return {};
  }
}

function writeDB(db: DB): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function getPatient(address: string): PatientData {
  const db = readDB();
  return db[address] ?? { address, name: '', records: [], analysis: null, updatedAt: Date.now() };
}

export function savePatient(data: PatientData): void {
  const db = readDB();
  db[data.address] = { ...data, updatedAt: Date.now() };
  writeDB(db);
}

export function addRecord(address: string, record: PatientRecord): PatientData {
  const patient = getPatient(address);
  patient.records = [record, ...patient.records.filter(r => r.id !== record.id)];
  savePatient(patient);
  return patient;
}

export function updateAnalysis(address: string, analysis: AIAnalysis): PatientData {
  const patient = getPatient(address);
  patient.analysis = analysis;
  savePatient(patient);
  return patient;
}

export function updateName(address: string, name: string): PatientData {
  const patient = getPatient(address);
  patient.name = name;
  savePatient(patient);
  return patient;
}
