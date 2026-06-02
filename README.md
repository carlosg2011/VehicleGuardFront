# Vehicle Guard — Frontend

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

Interface web do sistema **Vehicle Guard** — plataforma de gestão de veículos, propostas de seguro, vistorias e termos de adesão.

---

## Sobre o projeto

O frontend se comunica com a [VehicleGuard API](../vehicle_guard_back/Veiculo_gestao/) via REST + JWT. Cada usuário autenticado visualiza apenas seus próprios dados (propostas, vistorias e termos). Administradores têm acesso a painéis adicionais de consulta global e relatórios agregados.

---

## Tecnologias

| Dependência | Versão | Finalidade |
|---|---|---|
| React | 19.2 | UI declarativa |
| TypeScript | 6.0 | Tipagem estática |
| Vite | 8 | Bundler / dev server |
| Tailwind CSS | 4.3 | Estilização utilitária |
| React Router DOM | 7.15 | Roteamento SPA |
| Axios | 1.16 | Requisições HTTP |
| React Hook Form | 7.76 | Formulários |
| JWT Decode | 4.0 | Leitura de claims do token |
| Lucide React | 1.16 | Ícones |

---

## Pré-requisitos

- **Node.js** 18+ e **npm** 9+
- Backend da API em execução (local ou remoto)

---

## Instalação e execução local

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd vehicle_guard_front

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com a URL da API

# Inicie o servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:5173`.

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:5128/api
```

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_URL` | URL base da VehicleGuard API | `http://localhost:5128/api` |

> Em produção, aponte para a URL do backend hospedado (ex.: Render).

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Compila TypeScript e gera o bundle de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente para validação |
| `npm run lint` | Executa o ESLint em todos os arquivos |

---

## Estrutura de pastas

```
src/
├── api/                  # Módulos de chamada à API
│   ├── axios.ts          # Instância Axios com interceptors JWT
│   ├── auth.ts           # Login / logout
│   ├── dashboard.ts      # Resumo do dashboard
│   ├── propostas.ts      # CRUD de propostas
│   ├── vistorias.ts      # CRUD de vistorias
│   ├── termos.ts         # CRUD de termos
│   ├── usuarios.ts       # CRUD de usuários
│   ├── veiculos.ts       # CRUD de veículos
│   └── proprietarios.ts  # CRUD de proprietários
│
├── components/           # Componentes reutilizáveis
│   ├── Layout.tsx         # Wrapper com sidebar
│   ├── Sidebar.tsx        # Navegação lateral
│   ├── ProtectedRoute.tsx # Guard de rotas autenticadas
│   ├── Pagination.tsx     # Navegação de páginas
│   ├── Modal.tsx          # Modal genérico
│   ├── MaskedInput.tsx    # Input com máscara (CPF, telefone)
│   └── StatusBadge.tsx    # Badge colorido de status
│
├── contexts/
│   └── AuthContext.tsx    # Contexto de autenticação global
│
├── pages/                # Páginas da aplicação
│   ├── Login.tsx
│   ├── Dashboard.tsx      # Resumo pessoal do usuário
│   ├── Propostas.tsx      # Lista de propostas do usuário
│   ├── PropostaDetalhe.tsx
│   ├── PropostasAdmin.tsx # Consulta global (admin)
│   ├── Vistorias.tsx
│   ├── Termos.tsx
│   ├── TermoDetalhe.tsx
│   ├── Relatorios.tsx     # Estatísticas globais (admin)
│   ├── Usuarios.tsx
│   ├── Proprietarios.tsx
│   └── Veiculos.tsx
│
├── types/
│   └── index.ts          # Interfaces e tipos TypeScript
│
├── App.tsx               # Definição de rotas
└── main.tsx              # Entry point
```

---

## Funcionalidades

### Usuário comum
- Login com e-mail e senha (JWT, 8h de expiração)
- **Dashboard pessoal** — cards com total de veículos, propostas, vistorias e termos
- **Propostas** — listagem paginada das próprias propostas com filtro de status
- **Vistorias** — listagem paginada das próprias vistorias
- **Termos** — listagem paginada dos próprios termos de adesão com detalhe completo
- Logout com limpeza de sessão

### Administrador (role `Admin`)
Tudo acima, mais:
- **Consulta Geral** — busca propostas de qualquer usuário com filtros avançados (nome, CPF, placa, status)
- **Usuários** — CRUD completo de contas
- **Relatórios** — painel com estatísticas globais: contadores, barras de progresso por status de propostas, vistorias e termos, taxa de aprovação e taxa de assinatura

---

## Fluxo de autenticação

1. `POST /api/auth/login` → recebe `{ token, expiracao }`
2. Token armazenado em `localStorage`
3. `AuthContext` decodifica o JWT com `jwt-decode` para extrair `id`, `nome`, `email`, `role`
4. O interceptor do Axios injeta `Authorization: Bearer <token>` em todas as requisições
5. Resposta `401` (exceto no login) redireciona para `/login` automaticamente

---

## Filtro por usuário

Todas as páginas pessoais (Dashboard, Propostas, Vistorias, Termos) enviam `?userId=<id>` na query string. A página de Relatórios **não** envia esse parâmetro, retornando dados globais de todos os usuários.

---

## Build para produção

```bash
npm run build
```

Os arquivos finais ficam em `dist/`. Podem ser servidos por qualquer CDN ou plataforma de hospedagem estática (Vercel, Netlify, GitHub Pages, etc.).

---

## Integrantes

- Andrey Yan
- Felipe Biver
- Carlos Gabriel
