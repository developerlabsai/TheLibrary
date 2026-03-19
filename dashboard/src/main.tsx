import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Deploy from './pages/Deploy';
import Packages from './pages/Packages';
import Projects from './pages/Projects';
import CreateAgent from './pages/CreateAgent';
import CreateSkill from './pages/CreateSkill';
import CreateMcp from './pages/CreateMcp';
import CreateFeature from './pages/CreateFeature';
import CreatePackage from './pages/CreatePackage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/deploy" element={<Deploy />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/create/agent" element={<CreateAgent />} />
          <Route path="/create/skill" element={<CreateSkill />} />
          <Route path="/create/mcp" element={<CreateMcp />} />
          <Route path="/create/feature" element={<CreateFeature />} />
          <Route path="/create/package" element={<CreatePackage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
