import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

const Dashboard    = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const UploadRecords = lazy(() => import('./pages/UploadRecords').then(m => ({ default: m.UploadRecords })));
const Timeline     = lazy(() => import('./pages/Timeline').then(m => ({ default: m.Timeline })));
const ShareAccess  = lazy(() => import('./pages/ShareAccess').then(m => ({ default: m.ShareAccess })));
const Marketplace  = lazy(() => import('./pages/Marketplace').then(m => ({ default: m.Marketplace })));
const AgentChat    = lazy(() => import('./pages/AgentChat').then(m => ({ default: m.AgentChat })));

export default function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<UploadRecords />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="share" element={<ShareAccess />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="chat" element={<AgentChat />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
