import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UploadRecords } from './pages/UploadRecords';
import { Timeline } from './pages/Timeline';
import { ShareAccess } from './pages/ShareAccess';
import { Marketplace } from './pages/Marketplace';
import { AgentChat } from './pages/AgentChat';

export default function App() {
  return (
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
  );
}
