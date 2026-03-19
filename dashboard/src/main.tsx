import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Deploy from './pages/Deploy';
import Teams from './pages/Teams';
import Projects from './pages/Projects';
import CreateAgent from './pages/CreateAgent';
import CreateSpecialty from './pages/CreateSpecialty';
import CreateMcp from './pages/CreateMcp';
import CreateFeature from './pages/CreateFeature';
import CreateTeam from './pages/CreateTeam';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/deploy" element={<Deploy />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/create/agent" element={<CreateAgent />} />
          <Route path="/create/specialty" element={<CreateSpecialty />} />
          <Route path="/create/mcp" element={<CreateMcp />} />
          <Route path="/create/feature" element={<CreateFeature />} />
          <Route path="/create/team" element={<CreateTeam />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
