import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { usePatientData } from '../hooks/usePatientData';
import { useAuth } from '../hooks/useAuth';

interface UploadedFile {
  name: string;
  size: number;
  status: 'uploading' | 'done' | 'error';
  blobId?: string;
  error?: string;
}

const API = '';

export function UploadRecords() {
  const { address } = useAuth();
  const { addRecord } = usePatientData();
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const uploadFile = useCallback(async (file: File) => {
    setFiles(prev => [...prev, { name: file.name, size: file.size, status: 'uploading' }]);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('patientAddress', address ?? '0xdemo');
      form.append('recordType', file.name.endsWith('.json') ? 'fhir' : 'document');

      const res = await fetch(`${API}/api/records/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Save parsed FHIR records individually, or fall back to single record
      if (data.parsedRecords?.length > 0) {
        await Promise.all(data.parsedRecords.map((r: any) => addRecord({
          type: r.type,
          date: r.date,
          content: r.content,
          source: r.source,
          walrusBlobId: data.blobId,
          sealKeyId: data.sealKeyId,
          significance: 'routine',
        })));
      } else {
        await addRecord({
          type: detectType(file.name),
          date: new Date().toISOString().slice(0, 10),
          content: `Uploaded: ${file.name}`,
          source: 'Patient upload',
          walrusBlobId: data.blobId,
          sealKeyId: data.sealKeyId,
          significance: 'routine',
        });
      }

      setFiles(prev => prev.map(f =>
        f.name === file.name ? { ...f, status: 'done', blobId: data.blobId } : f
      ));
    } catch (err: any) {
      setFiles(prev => prev.map(f =>
        f.name === file.name ? { ...f, status: 'error', error: err.message } : f
      ));
    }
  }, [address, addRecord]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((accepted: File[]) => accepted.forEach(uploadFile), [uploadFile]),
    accept: { 'application/pdf': ['.pdf'], 'application/json': ['.json'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    multiple: true,
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Upload Medical Records</h1>
        <p className="text-slate-400 mt-1">Encrypted with Seal before upload to Walrus. Only you can decrypt.</p>
      </div>

      <div
        {...getRootProps()}
        className={`glass rounded-xl p-12 text-center cursor-pointer transition-all border-2 border-dashed
          ${isDragActive ? 'border-teal-400 bg-teal-500/10' : 'border-slate-600 hover:border-teal-500/50'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto text-teal-400 mb-4" size={40} />
        <p className="text-lg font-medium">{isDragActive ? 'Drop files here...' : 'Drag & drop medical records'}</p>
        <p className="text-slate-400 text-sm mt-2">PDF, FHIR JSON, or images · Up to 50MB each</p>
        <button className="mt-4 px-6 py-2 bg-teal-500/20 text-teal-400 rounded-lg text-sm hover:bg-teal-500/30 transition-colors">
          Browse Files
        </button>
      </div>

      <div className="glass rounded-xl p-4">
        <p className="text-sm font-medium text-slate-300 mb-2">Supported formats</p>
        <div className="flex gap-3 flex-wrap">
          {['PDF reports', 'FHIR R4 JSON', 'Lab result images', 'Prescription scans', 'Imaging reports'].map(f => (
            <span key={f} className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-400">{f}</span>
          ))}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">Uploaded Files</h2>
          {files.map((f, i) => (
            <div key={i} className="glass rounded-lg p-4 flex items-center gap-3">
              <FileText className="text-slate-400 shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                {f.blobId && <p className="text-xs text-slate-500 truncate font-mono">Walrus: {f.blobId}</p>}
                {f.error && <p className="text-xs text-red-400">{f.error}</p>}
              </div>
              {f.status === 'uploading' && <Loader2 className="text-teal-400 animate-spin shrink-0" size={18} />}
              {f.status === 'done' && <CheckCircle className="text-green-400 shrink-0" size={18} />}
              {f.status === 'error' && <AlertCircle className="text-red-400 shrink-0" size={18} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function detectType(filename: string): 'lab' | 'prescription' | 'diagnosis' | 'imaging' | 'visit' {
  const lower = filename.toLowerCase();
  if (lower.includes('lab') || lower.includes('blood') || lower.includes('test')) return 'lab';
  if (lower.includes('rx') || lower.includes('prescription') || lower.includes('med')) return 'prescription';
  if (lower.includes('xray') || lower.includes('mri') || lower.includes('scan') || lower.includes('imaging')) return 'imaging';
  if (lower.includes('visit') || lower.includes('note') || lower.includes('discharge')) return 'visit';
  return 'visit';
}
