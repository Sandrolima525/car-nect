# Car-Nect — evolução para SaaS completo

Primeiro já corrigi um erro que estava quebrando a página pública de agendamento.

O banco de dados, o login, a separação por empresa e as regras de acesso continuam exatamente como estão. Vou reaproveitar as tabelas existentes (empresas, clientes, veículos, serviços, atendimentos, itens do atendimento, pagamentos, funcionários e perfis) e só acrescentar o que faltar.

## O que já existe hoje
Painel, Clientes, Serviços, Agenda, Financeiro, Configurações e a página pública de agendamento de cada empresa.

## O que vou construir

### 1. Veículos (novo)
Página própria com lista e busca por placa, cliente, modelo. Cada cliente pode ter vários veículos: placa, marca, modelo, ano, cor e observações. Ao abrir um veículo, aparece o histórico de atendimentos dele.

### 2. Ordens de serviço (novo)
Página para criar e acompanhar atendimentos: escolher cliente e veículo, adicionar vários serviços (com valor e duração), observações, valor total e situação (Pendente, Em andamento, Concluído, Entregue, Cancelado). Cada mudança de situação fica registrada no histórico, com data e hora. Filtros por situação, período e cliente.

### 3. Clientes (completar)
Ficha do cliente com dados de contato, veículos, histórico de atendimentos e total gasto. Aba de "Clientes inativos" (sem atendimento há mais de X dias, ajustável) com botão de recuperação por WhatsApp.

### 4. Painel (completar)
Indicadores de faturamento do dia, da semana e do mês, agendamentos de hoje, serviços realizados, clientes novos e clientes inativos; lista dos atendimentos recentes e atalhos rápidos para criar cliente, veículo, atendimento e serviço.

### 5. WhatsApp
Botões prontos em cada atendimento e ficha de cliente, com mensagem já escrita: confirmação de agendamento, aviso de "veículo pronto" e mensagem de retorno para cliente inativo. Abrem o WhatsApp do cliente numa nova aba.

### 6. Usuários e permissões
Página para o proprietário convidar/gerenciar a equipe com três níveis: proprietário, gerente e atendente. O que cada nível pode fazer fica valendo também no banco, não só na tela:
- Proprietário: tudo, incluindo configurações e equipe.
- Gerente: tudo do dia a dia, sem mexer na equipe nem em faturamento sensível.
- Atendente: clientes, veículos, agenda e atendimentos.

### 7. Configurações da empresa
Logo, nome, contato, endereço, horários de funcionamento, cores da identidade visual e link da página pública — reunidos em abas e com prévia.

### 8. Agenda e página pública
Bloqueios de horário (feriados, manutenção), visão de calendário por dia e semana, e a página pública mostrando os serviços da empresa com a identidade visual dela.

## Como fica organizado
Menu lateral: Painel, Agenda, Ordens de serviço, Clientes, Veículos, Serviços, Financeiro, Equipe, Configurações — responsivo em celular, tablet e computador.

## Detalhes técnicos
- Nenhuma tabela existente é recriada. Acréscimos previstos: coluna/registro de bloqueios de agenda (`schedule_blocks`), histórico de situação da ordem (`service_order_events`) e, se necessário, colunas de observação em `vehicles`. Todas com company_id, índices e políticas de acesso por empresa, seguindo o padrão atual.
- Permissões aplicadas nas políticas do banco usando a função `has_role` já existente, além do controle na interface.
- Componentes reutilizados de `src/components/common` (cartões, selos de situação, estados vazios/erro, tabela) para evitar duplicação.
- Entrega em etapas, começando por Ordens de serviço + Veículos, depois Clientes/Painel/WhatsApp, e por fim Equipe/Configurações/Agenda.
