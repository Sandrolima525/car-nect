# Car Care Hub

Quero iniciar a construção de um sistema SaaS profissional para lava-jatos e empresas de estética automotiva.

IMPORTANTE: neste primeiro passo, NÃO construa todos os módulos do sistema. Quero primeiro criar uma fundação técnica sólida, organizada e escalável, principalmente o banco de dados, autenticação, estrutura multiempresa e segurança.

A aplicação deve ser preparada para posteriormente receber módulos de clientes, veículos, serviços, ordens de serviço, agenda, funcionários, financeiro, relatórios e histórico dos veículos.

OBJETIVO PRINCIPAL

O sistema será MULTI-TENANT / MULTIEMPRESA.

Uma única aplicação deverá atender várias empresas diferentes.

Cada empresa terá seus próprios:

usuários

clientes

veículos

funcionários

serviços

ordens de serviço

pagamentos

demais dados

Uma empresa NUNCA poderá visualizar, editar ou excluir dados pertencentes a outra empresa.

Essa separação deve ser garantida principalmente no banco de dados através do Supabase Row Level Security (RLS), e não apenas através da interface.

TECNOLOGIA

Utilize a integração existente com:

Supabase

Supabase Auth

PostgreSQL

Row Level Security (RLS)

Mantenha a estrutura compatível com o ambiente atual do Lovable e organizada para futura integração com GitHub e deploy em Vercel.

Não crie soluções improvisadas ou dados fictícios permanentes para substituir o banco de dados.

ESTRUTURA MULTIEMPRESA

Crie uma tabela principal:

companies

Campos sugeridos:

id

name

trade_name

document

phone

email

address

city

state

zip_code

logo_url

active

created_at

updated_at

Cada registro representa uma empresa cliente do SaaS.

USUÁRIOS

Utilize o Supabase Auth para autenticação.

Crie uma estrutura de perfil vinculada ao usuário autenticado, por exemplo:

profiles

Campos:

id

user_id

company_id

full_name

email

role

active

created_at

updated_at

O usuário deve estar vinculado a uma empresa através de company_id.

Prepare a estrutura para diferentes níveis de acesso, inicialmente:

owner

admin

manager

employee

Não precisa implementar todas as permissões visuais agora, mas a arquitetura deve permitir isso futuramente.

TABELAS PRINCIPAIS

Crie também a estrutura inicial das seguintes tabelas:

customers

Campos:

id

company_id

name

phone

email

document

notes

created_at

updated_at

vehicles

Campos:

id

company_id

customer_id

plate

brand

model

year

color

current_mileage

notes

created_at

updated_at

Relacionamento:

customers 1:N vehicles

Um cliente pode possuir vários veículos.

employees

Campos:

id

company_id

name

phone

email

role

commission_percentage

active

created_at

updated_at

services

Campos:

id

company_id

name

description

category

price

estimated_duration

active

created_at

updated_at

Cada empresa deve poder cadastrar seus próprios serviços e preços.

service_orders

Campos:

id

company_id

customer_id

vehicle_id

employee_id

status

subtotal

discount

total

mileage

notes

started_at

completed_at

created_at

updated_at

Status inicialmente:

pending

in_progress

completed

delivered

cancelled

service_order_items

Campos:

id

company_id

service_order_id

service_id

quantity

unit_price

total

created_at

Relacionamentos:

service_orders 1:N service_order_items

services 1:N service_order_items

PAYMENTS

Crie também:

payments

Campos:

id

company_id

service_order_id

amount

payment_method

status

paid_at

notes

created_at

updated_at

Formas de pagamento inicialmente:

cash

pix

debit_card

credit_card

other

SEGURANÇA

Esta é uma parte CRÍTICA.

Configure Row Level Security (RLS) nas tabelas que possuem company_id.

Usuários autenticados devem conseguir acessar somente registros da própria empresa.

A regra deve ser baseada na empresa vinculada ao usuário autenticado.

Não confie somente em filtros no frontend.

Crie policies de SELECT, INSERT, UPDATE e DELETE adequadas.

Evite qualquer possibilidade de um usuário alterar manualmente um company_id para acessar dados de outra empresa.

Sempre que possível, utilize funções auxiliares ou uma estrutura segura para identificar a company_id do usuário autenticado.

RELACIONAMENTOS

Configure corretamente as foreign keys entre as tabelas.

Estrutura principal:

companies
├── profiles
├── customers
│    └── vehicles
├── employees
├── services
└── service_orders
├── service_order_items
│    └── services
└── payments

Todos os dados operacionais devem estar associados à empresa através de company_id.

INTEGRIDADE

Configure:

primary keys

foreign keys

timestamps

índices necessários

constraints básicas

valores padrão apropriados

A placa do veículo deve ser tratada de maneira consistente para evitar duplicidades acidentais dentro da mesma empresa.

Os valores financeiros devem utilizar um tipo apropriado para dinheiro/valores monetários no PostgreSQL, evitando problemas de precisão.

AUTENTICAÇÃO

Crie o fluxo básico de:

Login

Logout

Usuário autenticado

Recuperação de senha

Após o login, o sistema deverá identificar:

usuário autenticado

perfil

empresa vinculada

nível de acesso

Se não houver empresa vinculada, o sistema deve tratar essa situação de maneira segura.

INTERFACE INICIAL

Neste primeiro passo, crie somente uma estrutura inicial simples da aplicação para validar que a autenticação e a arquitetura estão funcionando.

Crie:

página de login

layout autenticado básico

sidebar

página inicial/dashboard placeholder

identificação da empresa e usuário logado

botão de logout

Não implemente ainda todas as telas de clientes, veículos, serviços, agenda ou financeiro.

ARQUITETURA DO CÓDIGO

Organize o projeto de maneira limpa e escalável.

Evite duplicação de código.

Separe adequadamente:

componentes

páginas

serviços

tipos

hooks

autenticação

acesso ao Supabase

Não coloque regras importantes de segurança exclusivamente no frontend.

IMPORTANTE SOBRE O BANCO

Antes de criar qualquer coisa desnecessária, verifique a estrutura atual do Supabase conectado a este projeto.

Se já existirem tabelas ou configurações relacionadas a este projeto, não duplique estruturas sem necessidade.

Faça as alterações necessárias de maneira organizada.

CRITÉRIO DE CONCLUSÃO

Ao terminar este primeiro passo, quero ter:

Banco de dados estruturado.

Relacionamentos configurados.

Supabase Auth funcionando.

Perfil do usuário funcionando.

Estrutura multiempresa funcionando.

RLS configurado.

Usuário vinculado à empresa.

Login e logout funcionando.

Layout autenticado inicial.

Projeto preparado para receber os próximos módulos.

NÃO avance para funcionalidades que não foram solicitadas neste prompt.

Ao finalizar, apresente um resumo objetivo do que foi criado, incluindo:

tabelas criadas

relacionamentos

políticas RLS

autenticação

estrutura multiempresa

eventuais decisões técnicas importantes

qualquer problema ou configuração que eu precise fazer manualmente no Supabase.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://car-nect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1122ebb2-c86d-4001-bce3-bc5f512160bf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
