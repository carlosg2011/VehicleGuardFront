import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Proprietarios from './pages/Proprietarios';
import Veiculos from './pages/Veiculos';
import Propostas from './pages/Propostas';
import PropostaDetalhe from './pages/PropostaDetalhe';
import Vistorias from './pages/Vistorias';
import Termos from './pages/Termos';
import TermoDetalhe from './pages/TermoDetalhe';
import PropostasAdmin from './pages/PropostasAdmin';
import Relatorios from './pages/Relatorios';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="proprietarios" element={<Proprietarios />} />
            <Route path="veiculos" element={<Veiculos />} />
            <Route path="propostas" element={<Propostas />} />
            <Route path="propostas/:id" element={<PropostaDetalhe />} />
            <Route path="vistorias" element={<Vistorias />} />
            <Route path="termos" element={<Termos />} />
            <Route path="termos/:id" element={<TermoDetalhe />} />
            <Route path="propostas-admin" element={<PropostasAdmin />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
