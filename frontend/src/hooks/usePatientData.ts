/**
 * Patient data hook — fetches and persists data via backend API.
 * Data is stored server-side in data/patients.json, keyed by wallet address.
 * Works across devices — same wallet address = same data everywhere.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface PatientRecord {
  id: string;
  type: 'lab' | 'prescription' | 'diagnosis' | 'imaging' | 'visit';
  date: string;
  content: string;
  source: string;
  walrusBlobId?: string;
  sealKeyId?: string;
  significance?: 'routine' | 'notable' | 'critical';
  uploadedAt: number;
}

export interface AIAnalysis {
  summary: string;
  urgentFlags: string[];
  interactions: Array<{ drug1: string; drug2: string; severity: string; description: string }>;
  trialMatches: Array<{ studyId: string; title: string; sponsor: string; compensation: string; matchReason: string }>;
  generatedAt: number;
}

export interface PatientStore {
  address: string;
  name: string;
  records: PatientRecord[];
  analysis: AIAnalysis | null;
  updatedAt: number;
}

const API = '';
const EMPTY: PatientStore = { address: '', name: '', records: [], analysis: null, updatedAt: 0 };

export function usePatientData() {
  const { address } = useAuth();
  const [store, setStore] = useState<PatientStore>(EMPTY);
  const [loading, setLoading] = useState(false);

  // Fetch from backend whenever address changes
  useEffect(() => {
    if (!address) { setStore(EMPTY); return; }
    setLoading(true);
    fetch(`${API}/api/patient/${address}`)
      .then(r => r.json())
      .then(data => setStore(data))
      .catch(() => setStore({ ...EMPTY, address }))
      .finally(() => setLoading(false));
  }, [address]);

  const addRecord = useCallback(async (record: Omit<PatientRecord, 'id' | 'uploadedAt'>) => {
    if (!address) return;
    const res = await fetch(`${API}/api/patient/${address}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    const data = await res.json();
    setStore(data);
    return data;
  }, [address]);

  const setName = useCallback(async (name: string) => {
    if (!address) return;
    const res = await fetch(`${API}/api/patient/${address}/name`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setStore(data);
  }, [address]);

  const runAnalysis = useCallback(async () => {
    if (!address) return;
    const res = await fetch(`${API}/api/patient/${address}/analyze`, { method: 'POST' });
    const data = await res.json();
    setStore(data);
    return data;
  }, [address]);

  const deleteRecord = useCallback(async (id: string) => {
    if (!address) return;
    const res = await fetch(`${API}/api/patient/${address}/records/${id}`, { method: 'DELETE' });
    const data = await res.json();
    setStore(data);
  }, [address]);

  return {
    records: store.records,
    analysis: store.analysis,
    name: store.name,
    loading,
    addRecord,
    setName,
    runAnalysis,
    deleteRecord,
    hasData: store.records.length > 0,
  };
}
