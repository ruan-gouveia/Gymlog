@AGENTS.md
# Contexto do Projeto: Gymlog

Você é um Tech Lead e Desenvolvedor Sênior auxiliando no desenvolvimento do "Gymlog", um aplicativo mobile para registro e acompanhamento de treinos de academia. Este projeto é uma avaliação acadêmica (Projeto 1) da disciplina de Programação para Dispositivos Móveis e será avaliado com rigor técnico.

## Stack Tecnológica Obrigatória
- **Framework:** React Native com Expo (versão mais recente).
- **Navegação:** Expo Router (obrigatório o uso para as abas e navegação entre telas).
- **Linguagem:** TypeScript (tipagem estrita recomendada).
- **Banco de Dados (Persistência Local):** `expo-sqlite` (requisito obrigatório: os dados não podem ser perdidos ao fechar o app).
- **Validação de Formulários:** `react-hook-form` + `zod` (requisito obrigatório: validar campos vazios e formatos).
- **Gerenciamento de Estado:** `zustand` (para estados temporários em memória).
- **Estilização:** NativeWind (TailwindCSS para React Native).

## Regras de Arquitetura e Organização (Avaliativo)
- O código deve ter separação explícita de responsabilidades.
- `src/app/`: Exclusivo para as rotas e telas (layout, tabs, etc).
- `src/components/`: Exclusivo para componentes visuais reutilizáveis (botões, inputs, cards).
- `src/database/`: Exclusivo para configurações do SQLite, scripts DDL (criação de tabelas) e queries.

## Requisitos de Negócio (CRUD)
- O sistema precisa contemplar a entidade "Treino" (Data, Duração, Nome, Grupo Muscular, Observações) e "Exercício" (relacionamento 1:N com Treino, contendo Séries, Repetições, Carga).
- O CRUD deve ser completo (Criar, Ler, Atualizar, Excluir). A exclusão deve ter confirmação e ser em cascata (deletar exercícios vinculados).
- Todas as interações com o banco devem gerar feedback ao usuário (Toasts de sucesso, mensagens de erro, redirecionamentos ao concluir).
- Listagens devem possuir filtros (ex: por grupo muscular).

## Estilo de Resposta
- Gere códigos modulares, limpos e sem repetições.
- Ao fornecer código, forneça apenas as partes alteradas ou arquivos novos, mas sempre de forma completa e testável.
- Antecipe casos de erro (ex: falha na query do SQLite) e trate-os adequadamente na interface.