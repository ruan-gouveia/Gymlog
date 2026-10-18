# 🏋️‍♂️ GymLog — Diário e Planejador de Treinos Offline

O **GymLog** é um aplicativo móvel desenvolvido em **React Native com Expo** para quem quer planejar sua rotina de academia, registrar cargas e séries sem complicação e acompanhar sua evolução física ao longo do tempo — funcionando **100% offline** diretamente no dispositivo.

> 📄 **Documentação Acadêmica Completa:** Para consultar o detalhamento do modelo de dados (diagrama ER), a justificativa técnica da camada de persistência e os requisitos atendidos da disciplina de *Programação para Dispositivos Móveis (IFPB)*, acesse [**`docs/DOCUMENTACAO.md`**](./docs/DOCUMENTACAO.md).

---

## 🎯 Tema e Objetivo

Manter a constância nos treinos e aplicar a progressão de carga fica muito mais fácil quando você tem seus dados sempre à mão. O **GymLog** foi pensado para substituir as anotações improvisadas em blocos de notas por uma experiência fluida, moderna e totalmente local:

- **Planeje sua semana:** Agende seus treinos por dia, horário e grupo muscular, com opção de repetir automaticamente na semana.
- **Não deixe treinos passarem em branco:** Se um treino agendado ficou para trás, ele aparece na seção **Pendentes** da tela inicial para você reagendar para hoje com um toque ou remover da lista.
- **Registre tudo em tempo real:** Inicie um treino agendado com cronômetro ao vivo, marque os exercícios concluídos ou edite cargas e repetições a qualquer momento.
- **Visualize seu progresso real:** Veja gráficos claros de volume semanal/mensal, divisão de grupos musculares trabalhados e a curva de evolução de carga em cada exercício.

---

## ✨ Funcionalidades

- **CRUD Completo de Treinos e Exercícios:** Criação, listagem, visualização detalhada, edição de treinos/séries, reagendamento rápido e exclusão com confirmação de segurança.
- **Persistência 100% Local (Offline-First):** Todos os treinos, séries e preferências ficam salvos no banco relacional **SQLite** do aparelho, mantendo os dados intactos mesmo após fechar o aplicativo ou reiniciar o celular.
- **Listagem Inteligente no Histórico:** Filtragem combinada por **grupo muscular** (*Peito, Costas, Pernas, Ombros, Bíceps, Tríceps*) e por **período** (*Últimos 7 dias, 30 dias, 3 meses ou Todo o período*), com ordenação cronológica.
- **Validação de Formulários:** Campos validados com feedback visual imediato para evitar treinos sem nome, datas inválidas ou séries vazias.
- **Gráficos de Estatísticas e Evolução:**
  - Painel de métricas gerais (*Treinos concluídos, Volume total em kg, Tempo total e Séries*).
  - Gráfico de barras de volume de treino (*7 Dias, 4 Semanas e 6 Meses*) e ranking percentual de grupos musculares.
  - Gráfico de linha em curva de Bézier para acompanhar a progressão de **Carga**, **Volume** ou **Repetições** por exercício individual.
- **Tema Claro e Escuro:** Interface adaptável com troca instantânea no Perfil e persistência da preferência do usuário.
- **Lembretes e Notificações Locais:** Avisos automáticos antes do horário do treino agendado, com tempo de antecedência configurável (*5 a 60 minutos*).
- **Backup Local (Exportação JSON):** Exporte e compartilhe todos os seus dados em um arquivo `.json` estruturado a qualquer momento.

---

## 📱 Prints do Aplicativo

| Tela Inicial (Dashboard e Pendentes) | Agendar Novo Treino | Histórico com Filtros |
| :---: | :---: | :---: |
| ![Tela Inicial](./docs/screenshots/01-inicio-dashboard.jpeg) | ![Agendar Treino](./docs/screenshots/02-agendar-treino.jpeg) | ![Histórico](./docs/screenshots/03-historico-treinos.jpeg) |

| Estatísticas e Volume | Evolução por Exercício | Perfil e Configurações |
| :---: | :---: | :---: |
| ![Estatísticas](./docs/screenshots/04-estatisticas-volume.jpeg) | ![Evolução](./docs/screenshots/05-evolucao-exercicio.jpeg) | ![Perfil](./docs/screenshots/06-perfil-configuracoes.jpeg) |

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia | Papel no Projeto |
| :--- | :--- | :--- |
| **Framework Mobile** | [React Native](https://reactnative.dev/) (`0.83`) + [Expo SDK 55](https://expo.dev/) | Base multiplataforma (Android, iOS e Web) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) | Tipagem estática em todas as camadas de banco, rotas e UI |
| **Navegação** | [Expo Router](https://docs.expo.dev/router/introduction/) | Roteamento *file-based* com abas (`Tabs`) e pilhas (`Stack`) |
| **Banco de Dados Local** | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (`expo-sqlite`) | Persistência relacional de treinos, exercícios e metas (com transações e migrations) |
| **Preferências Locais** | [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) + [Zustand](https://zustand-demo.pmnd.rs/) | Gerenciamento e persistência do estado global de Tema Claro/Escuro |
| **Estilização** | [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS) | Estilização responsiva e suporte a variáveis de tema claro/escuro |
| **Formulários e Validação** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Controle performático de formulários e validação de esquemas |
| **Gráficos e Visualização** | `react-native-chart-kit` + `react-native-svg` | Gráficos de barras (volume) e curvas de evolução por exercício |
| **Notificações e Arquivos** | `expo-notifications`, `expo-file-system`, `expo-sharing` | Lembretes locais agendados e exportação de backup em arquivo `.json` |

---

## 📂 Arquitetura do Projeto

O código-fonte está organizado dentro de `src/` seguindo uma separação clara de responsabilidades entre interface, navegação, regras de validação e persistência de dados:

```text
Gymlog/
├── docs/
│   ├── DOCUMENTACAO.md        # Documentação técnica (Tema, Modelo de Dados, Justificativa SQLite e Prints)
│   └── screenshots/           # Capturas de tela do aplicativo em execução
├── src/
│   ├── app/                   # Rotas e telas (Expo Router)
│   │   ├── (tabs)/            # Navegação principal por abas (Início, Histórico, Novo Treino, Estatísticas, Perfil)
│   │   ├── treino-ativo/[id]  # Tela de execução de treino em tempo real com cronômetro
│   │   └── _layout.tsx        # Inicialização do SQLite, Seed, Tema e Notificações
│   ├── components/            # Componentes reutilizáveis de UI (Cards, Modais, Seletores, Toast)
│   ├── database/              # Camada de persistência SQLite
│   │   ├── conexao.ts         # Instância nativa do banco gymlog.db (e fallback Web em conexao.web.ts)
│   │   ├── initDatabase.ts    # Criação de tabelas, Foreign Keys, índices e migrações automáticas
│   │   ├── repository.ts      # Operações CRUD transacionais (treinos, exercícios e configurações)
│   │   ├── queries.ts         # Consultas analíticas para agenda, estatísticas, PRs e gráficos
│   │   └── seed.ts            # População inicial com 6 meses de histórico realista de treinos
│   ├── schemas/               # Esquemas de validação com Zod (treinoSchema.ts)
│   ├── services/              # Serviços nativos de agendamento de notificações locais
│   └── stores/                # Estado global de tema (Zustand + AsyncStorage)
├── app.json                   # Configurações do Expo e plugins nativos
└── package.json               # Dependências e scripts do projeto
```

---

## 🚀 Instruções de Execução

### Pré-requisitos
- **Node.js** (versão 18 ou superior recomendada)
- Gerenciador de pacotes **npm** (ou **Bun**)
- Aplicativo **Expo Go** instalado no seu celular Android ou iOS (ou um emulador Android Studio configurado)

### Passo a passo para rodar o projeto

1. **Clone o repositório e acesse a pasta do projeto:**
   ```bash
   git clone https://github.com/ruan-gouveia/Gymlog.git
   cd Gymlog
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento do Expo:**
   ```bash
   npx expo start
   ```

4. **Abra o aplicativo:**
   - **No celular físico (Recomendado):** Abra o aplicativo **Expo Go**, escaneie o QR Code exibido no terminal e aguarde o carregamento.
   - **No emulador Android:** Pressione a tecla **`a`** no terminal com o emulador aberto.
   - **No navegador (Web / Localhost):** Pressione a tecla **`w`** no terminal ou acesse `http://localhost:8081`.

> 💡 **Dados de demonstração inclusos:** Ao abrir o aplicativo pela primeira vez em um banco limpo, o módulo `src/database/seed.ts` popula automaticamente 6 meses de histórico realista de treinos para que você já possa explorar os filtros do histórico, os recordes e os gráficos de evolução imediatamente.

### Scripts úteis de verificação

```bash
npx tsc --noEmit   # Verifica a tipagem TypeScript em todo o projeto
npx expo lint      # Executa o linter (ESLint) seguindo os padrões do Expo
```

---

## 👥 Integrantes do Grupo

| Integrante | GitHub |
| :--- | :--- |
| **Ruan Gouveia** | [@ruan-gouveia](https://github.com/ruan-gouveia) |
| **Mateus Miranda** | [@Mateus23-silva](https://github.com/Mateus23-silva) |
| **Arthur Henrique** | [@4rthurhr](https://github.com/4rthurhr) |

---

## 📚 Documentação Adicional

- [**Documentação Técnica do Projeto (`docs/DOCUMENTACAO.md`)**](./docs/DOCUMENTACAO.md) — Contém o detalhamento do tema, diagrama Entidade-Relacionamento (ER) do banco de dados, justificativa técnica do uso do `expo-sqlite` e galeria comentada das telas.
