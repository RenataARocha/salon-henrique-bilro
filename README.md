# 💇‍♀️ Henrique Bilro Cabeleireiros — Sistema de Agendamento Online

> Sistema completo de agendamento para salão de beleza, com painel administrativo, gestão de funcionários, cupons, combos, backup automático e bot de WhatsApp.

🌐 **Site em produção:** [salon-henrique-bilro.vercel.app](https://salon-henrique-bilro.vercel.app)  
📍 **Localização:** Av. Rio Doce, 3101 – Potengi, Natal/RN  
📱 **WhatsApp:** (84) 98881-4965  
📷 **Instagram:** [@rosebilro](https://www.instagram.com/rosebilro/)

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Banco de Dados](#banco-de-dados)
- [Bot de WhatsApp](#bot-de-whatsapp)
- [Sistema de Backup](#sistema-de-backup)
- [Deploy](#deploy)
- [Painel Administrativo](#painel-administrativo)
- [Scripts Disponíveis](#scripts-disponíveis)

---

## 📖 Sobre o Projeto

O **Henrique Bilro Cabeleireiros** é um sistema web completo desenvolvido para modernizar o atendimento do salão, substituindo agendamentos manuais por uma plataforma digital intuitiva.

O sistema permite que clientes agendem serviços online 24h, que a equipe administrativa gerencie tudo através de um painel completo, e que o WhatsApp do salão seja atendido automaticamente por um bot inteligente que guia o cliente até o agendamento ou repassa para a equipe humana.

---

## ✅ Funcionalidades

### 👥 Área do Cliente

- Cadastro e login com autenticação segura
- Visualização de serviços com fotos e preços
- Agendamento de **serviço simples**, **múltiplos serviços** ou **combo promocional**
- Aplicação de cupons de desconto no agendamento
- Reagendamento e cancelamento de horários
- Histórico completo de agendamentos
- Sistema de avaliações pós-atendimento
- Notificações no sistema
- Recuperação de senha por e-mail

### 🛠️ Painel Administrativo

- Dashboard com visão geral do negócio
- Gestão completa de agendamentos (confirmar, cancelar, remarcar)
- Cadastro e edição de serviços com upload de fotos
- Criação de combos promocionais com desconto configurável
- Gestão de cupons de desconto (valor fixo ou percentual, por dia da semana, por horário, limite de uso)
- Gestão de funcionários com comissão configurável
- Sistema de comanda por funcionário
- Relatórios mensais de comissão por funcionário
- Controle de horários bloqueados (férias, folgas, feriados)
- Metas financeiras mensais
- Gerenciamento de avaliações
- Exportação de dados em PDF e Excel

### 📅 Agendamento Inteligente

- Horários disponíveis em tempo real
- Bloqueio automático de horários já ocupados
- Suporte a múltiplos serviços no mesmo agendamento
- Cálculo automático de duração total e preço final
- Aplicação de desconto via cupom

### 🤖 Bot de WhatsApp

- Atendimento automático 24h via WhatsApp
- Menu interativo com 4 opções
- Direcionamento para agendamento online
- Informações de serviços, preços, localização e horários
- Passagem para atendimento humano (opção 4)
- Sessões persistentes via Redis (não perde estado com deploys)

---

## 🚀 Tecnologias Utilizadas

### Frontend

| Tecnologia          | Versão | Uso                              |
| ------------------- | ------ | -------------------------------- |
| **Next.js**         | 16     | Framework principal (App Router) |
| **React**           | 19     | Interface do usuário             |
| **TypeScript**      | 5      | Tipagem estática                 |
| **Tailwind CSS**    | 4      | Estilização                      |
| **Framer Motion**   | 12     | Animações                        |
| **Swiper**          | 12     | Carrossel de imagens             |
| **Recharts**        | 3      | Gráficos no dashboard            |
| **Lucide React**    | 0.554  | Ícones                           |
| **React Hook Form** | 7      | Gerenciamento de formulários     |
| **Zod**             | 4      | Validação de dados               |
| **React Hot Toast** | 2      | Notificações                     |

### Backend / Banco de Dados

| Tecnologia     | Versão | Uso                          |
| -------------- | ------ | ---------------------------- |
| **Prisma ORM** | 5      | Acesso ao banco de dados     |
| **PostgreSQL** | —      | Banco de dados relacional    |
| **Supabase**   | —      | Hosting do PostgreSQL        |
| **Next Auth**  | 4      | Autenticação e sessões       |
| **BcryptJS**   | 3      | Hash de senhas               |
| **JWT**        | 9      | Tokens de autenticação       |
| **BullMQ**     | 5      | Filas de tarefas assíncronas |
| **IORedis**    | 5      | Cliente Redis                |

### Serviços Externos

| Serviço           | Uso                                                   |
| ----------------- | ----------------------------------------------------- |
| **Cloudinary**    | Upload e hospedagem de imagens dos serviços           |
| **Resend**        | Envio de e-mails (recuperação de senha, confirmações) |
| **Firebase**      | Notificações push em tempo real                       |
| **Redis**         | Cache, filas BullMQ e sessões do bot WhatsApp         |
| **Evolution API** | Integração com WhatsApp para o bot                    |

### Infraestrutura

| Serviço          | Uso                                  |
| ---------------- | ------------------------------------ |
| **Vercel**       | Deploy e hospedagem do Next.js       |
| **Supabase**     | Banco de dados PostgreSQL na nuvem   |
| **Google Drive** | Sincronização automática dos backups |

### Exportação de Dados

| Biblioteca                  | Uso                               |
| --------------------------- | --------------------------------- |
| **jsPDF + jsPDF-AutoTable** | Geração de PDFs                   |
| **XLSX**                    | Exportação para Excel             |
| **html2canvas**             | Captura de tela para PDF          |
| **file-saver**              | Download de arquivos no navegador |

---

## 📁 Estrutura do Projeto

```
salon-henrique-bilro/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rotas de autenticação
│   │   ├── login/
│   │   └── register/
│   ├── (client)/                 # Área do cliente
│   │   ├── dashboard/
│   │   ├── agendamentos/
│   │   └── perfil/
│   ├── (admin)/                  # Painel administrativo
│   │   └── admin/
│   │       ├── agendamentos/
│   │       ├── servicos/
│   │       ├── combos/
│   │       ├── cupons/
│   │       ├── funcionarios/
│   │       ├── financeiro/
│   │       └── avaliacoes/
│   └── api/                      # API Routes (Next.js)
│       ├── auth/
│       ├── appointments/
│       ├── services/
│       ├── combos/
│       ├── coupons/
│       └── webhook/
│           └── whatsapp/         # Bot de WhatsApp
│               └── route.ts
├── hooks/                        # React hooks customizados
├── prisma/
│   ├── schema.prisma             # Schema do banco de dados
│   ├── migrations/               # Migrações do banco
│   └── seed.ts                   # Dados iniciais
├── public/                       # Arquivos estáticos
├── scripts/                      # Scripts utilitários
│   ├── backup-completo-REAL.js   # Backup completo do banco
│   ├── restaurar-backup.js       # Restauração de backup
│   ├── backup.js                 # Backup do .env + pg_dump
│   ├── make-admin.js             # Promover usuário a admin
│   └── cleanup-admin.js          # Remover privilégios de admin
├── src/                          # Código fonte principal
├── configurar-backup-automatico.bat  # Configurar agendamento Windows
├── executar-backup.bat           # Executar backup manualmente
├── .env.local                    # Variáveis de ambiente (não commitado)
└── package.json
```

---

## 🔐 Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# ============================================
# BANCO DE DADOS - SUPABASE
# ============================================
DATABASE_URL="postgresql://..."        # URL com connection pooler
DIRECT_URL="postgresql://..."          # URL direta (para migrações)

# ============================================
# AUTENTICAÇÃO - NEXT AUTH
# ============================================
NEXTAUTH_URL="http://localhost:3000"   # Em produção: URL do Vercel
NEXTAUTH_SECRET="sua-chave-secreta"   # Gere com: openssl rand -base64 32

# ============================================
# CLOUDINARY - IMAGENS
# ============================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="sua-api-key"
CLOUDINARY_API_SECRET="seu-api-secret"

# ============================================
# RESEND - E-MAILS
# ============================================
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@seudominio.com"

# ============================================
# FIREBASE - NOTIFICAÇÕES PUSH
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
FIREBASE_ADMIN_PROJECT_ID="..."
FIREBASE_ADMIN_CLIENT_EMAIL="..."
FIREBASE_ADMIN_PRIVATE_KEY="..."

# ============================================
# REDIS - FILAS E SESSÕES DO BOT
# ============================================
REDIS_URL="redis://..."

# ============================================
# EVOLUTION API - BOT WHATSAPP
# ============================================
EVOLUTION_API_URL="https://sua-evolution-api.com"
EVOLUTION_API_KEY="sua-api-key"
EVOLUTION_INSTANCE="salon-bilro"
```

---

## 💻 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Conta no Cloudinary
- Conta no Resend

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/salon-henrique-bilro.git
cd salon-henrique-bilro

# 2. Instale as dependências
npm install

# 3. Configure o .env.local
cp .env.example .env.local
# Preencha todas as variáveis

# 4. Gere o Prisma Client
npx prisma generate

# 5. Execute as migrações
npx prisma migrate dev

# 6. (Opcional) Rode o seed com dados iniciais
npm run db:seed

# 7. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Criar primeiro admin

```bash
# Crie uma conta pelo site normalmente, depois rode:
node scripts/make-admin.js
# Siga as instruções para informar o e-mail do usuário
```

---

## 🗄️ Banco de Dados

### Tabelas principais

| Tabela                       | Descrição                                      |
| ---------------------------- | ---------------------------------------------- |
| `users`                      | Clientes e administradores                     |
| `services`                   | Serviços do salão com preços e fotos           |
| `service_combos`             | Combos promocionais                            |
| `combo_services`             | Serviços vinculados a cada combo               |
| `appointments`               | Agendamentos                                   |
| `appointment_services`       | Múltiplos serviços por agendamento             |
| `appointment_status_history` | Histórico de mudanças de status                |
| `available_slots`            | Horários disponíveis por dia da semana         |
| `blocked_times`              | Horários bloqueados (férias, folgas)           |
| `coupons`                    | Cupons de desconto                             |
| `coupon_usage`               | Histórico de uso de cupons                     |
| `reviews`                    | Avaliações dos clientes                        |
| `staff`                      | Funcionários do salão                          |
| `staff_services`             | Comandas — serviços executados por funcionário |
| `staff_monthly_reports`      | Relatórios mensais de comissão                 |
| `financial_goals`            | Metas financeiras mensais                      |
| `notifications`              | Notificações dos usuários                      |
| `password_resets`            | Tokens de recuperação de senha                 |

### Comandos úteis do Prisma

```bash
npm run db:generate    # Gera o Prisma Client
npm run db:migrate     # Executa migrações pendentes
npm run db:studio      # Abre o Prisma Studio (GUI do banco)
npm run db:seed        # Popula o banco com dados iniciais
```

---

## 🤖 Bot de WhatsApp

O salão conta com um bot de atendimento automático integrado ao WhatsApp via **Evolution API**.

### Como funciona

```
Cliente manda qualquer mensagem
        ↓
Bot responde com boas-vindas + menu
        ↓
┌─────────────────────────────────┐
│  1️⃣ Agendamento                 │ → Link para o site
│  2️⃣ Serviços e preços           │ → Link para serviços
│  3️⃣ Localização e horários      │ → Endereço + Google Maps
│  4️⃣ Falar com a equipe          │ → Encerra o bot
└─────────────────────────────────┘
        ↓
Cliente digita "menu" para voltar
```

### Arquivo

```
app/api/webhook/whatsapp/route.ts
```

### Sessões com Redis

As sessões de cada cliente são salvas no Redis com TTL de 1 hora:

```
session:{telefone} → { step: "menu" }
```

Isso garante que o estado não se perde com deploys ou quando a função serverless da Vercel "dorme" — problema que ocorreria se usássemos apenas um `Map` em memória.

### Variáveis necessárias

```env
EVOLUTION_API_URL="https://sua-evolution-api.com"
EVOLUTION_API_KEY="sua-chave"
EVOLUTION_INSTANCE="salon-bilro"
REDIS_URL="redis://..."
```

### Configurar webhook na Evolution API

Após o deploy na Vercel, configure o webhook na Evolution API apontando para:

```
https://salon-henrique-bilro.vercel.app/api/webhook/whatsapp
```

### Verificar se o webhook está ativo

```
GET https://salon-henrique-bilro.vercel.app/api/webhook/whatsapp
→ { "status": "Webhook WhatsApp ativo ✅" }
```

---

## 💾 Sistema de Backup

O projeto possui um sistema de backup automático completo que salva **todos os dados do banco** em arquivos JSON locais e sincroniza com o Google Drive.

### O que é salvo no backup

| Tabela                             | Incluído |
| ---------------------------------- | -------- |
| Usuários                           | ✅       |
| Serviços                           | ✅       |
| Horários disponíveis               | ✅       |
| Combos com serviços vinculados     | ✅       |
| Cupons                             | ✅       |
| Agendamentos                       | ✅       |
| Múltiplos serviços por agendamento | ✅       |
| Histórico de status                | ✅       |
| Uso de cupons                      | ✅       |
| Avaliações                         | ✅       |
| Horários bloqueados                | ✅       |
| Funcionários                       | ✅       |
| Comandas                           | ✅       |
| Relatórios mensais                 | ✅       |
| Metas financeiras                  | ✅       |

### Localização dos backups

```
C:\MeusBACKUPS\salon-bilro\
├── dados-completos-LATEST.json        # Backup mais recente
├── dados-completos-2026-03-19_09h00.json
├── dados-completos-2026-03-18_09h00.json
├── env-backup-LATEST.txt              # .env mais recente
└── env-backup-2026-03-19_09h00.txt
```

### Fazer backup manual

```bash
# ⚠️ Pare o servidor antes (Ctrl+C no npm run dev)
node scripts/backup-completo-REAL.js
```

### Restaurar backup

```bash
# ⚠️ ATENÇÃO: Substitui TODOS os dados do banco pelo backup
node scripts/restaurar-backup.js
```

### Configurar backup automático (Windows)

Execute como **Administrador** via CMD:

```cmd
# Backup diário às 9h
schtasks /create /tn "Salon Bilro - Backup Diario" /tr "node C:\Projetos\salon-henrique-bilro\scripts\backup-completo-REAL.js" /sc daily /st 09:00 /f

# Verificar se está ativo
schtasks /query /fo LIST | findstr /i "salon"

# Remover agendamento
schtasks /delete /tn "Salon Bilro - Backup Diario" /f
```

### Google Drive

A pasta `C:\MeusBACKUPS\salon-bilro\` está sincronizada com o **Google Drive Desktop** automaticamente. Todo backup criado sobe para a nuvem sem ação manual.

> ⚠️ **Importante:** O backup automático diário é 100% seguro — ele apenas **lê e salva** os dados, nunca apaga nada. A restauração (`restaurar-backup.js`) é a única operação que substitui dados, e deve ser usada apenas em caso de emergência.

---

## 🚀 Deploy

O projeto está hospedado na **Vercel** com deploy automático a partir da branch `main`.

### Variáveis de ambiente na Vercel

Configure todas as variáveis do `.env.local` no painel da Vercel em:
`Settings → Environment Variables`

> ⚠️ `NEXTAUTH_URL` deve ser a URL de produção em produção e `http://localhost:3000` localmente.

### Build de produção

```bash
npm run build    # Gera o Prisma Client e faz o build do Next.js
npm run start    # Inicia em modo produção
```

---

## 🛠️ Painel Administrativo

### Acesso

- URL: `/admin`
- Requer conta com `role: ADMIN`
- Para criar o primeiro admin: `node scripts/make-admin.js`

### Seções do painel

**Dashboard** — Resumo diário, faturamento do mês, gráficos e meta financeira

**Agendamentos** — Listagem com filtros, confirmação, cancelamento, remarcação e exportação PDF/Excel

**Serviços** — Cadastro com fotos (Cloudinary), preço, duração, destaque

**Combos Promocionais** — Pacotes com múltiplos serviços e desconto percentual

**Cupons de Desconto** — Valor fixo ou percentual, limite de uso, validade, restrição por dia/horário

**Funcionários** — Cadastro, comanda, relatório mensal de comissão, controle de pagamento

**Horários** — Slots disponíveis por dia da semana, bloqueios pontuais ou recorrentes

**Avaliações** — Moderação, aprovação, destaque e solicitação por e-mail

---

## 📜 Scripts Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Servidor de produção
npm run lint             # Verificação de código

npm run db:generate      # Gera Prisma Client
npm run db:migrate       # Executa migrações
npm run db:studio        # Abre Prisma Studio
npm run db:seed          # Popula banco com dados iniciais

npm run backup           # Executa backup completo dos dados
npm run make-admin       # Promove usuário a administrador
npm run cleanup-admin    # Remove privilégios de admin
```

---

## ⚠️ Observações Importantes

**Supabase — limite de conexões**
O plano gratuito limita conexões simultâneas. O script de backup usa consultas sequenciais e deve ser rodado com o servidor parado para evitar conflitos.

**Imagens**
As imagens dos serviços ficam no Cloudinary e não são incluídas no backup local — estão seguras independentemente.

**Sessões do bot WhatsApp**
Salvas no Redis com TTL de 1 hora. Se o Redis não estiver disponível, o bot ainda funciona mas sem memória de sessão entre mensagens.

**Segurança**
Senhas com hash bcrypt, autenticação NextAuth com JWT, rotas administrativas protegidas por middleware, variáveis sensíveis apenas no servidor.

---

## 👩‍💻 Desenvolvimento

Projeto desenvolvido por **Renata Rocha**

---

_Última atualização: Março 2026_
