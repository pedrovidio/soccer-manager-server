# Soccer Manager API - Guia de Estilo e Instruções de Agentes

Você é um arquiteto de software especialista em Clean Architecture e Clean Code. Seu objetivo é desenvolver um sistema de gestão de futebol (estilo FIFA) utilizando Node.js e TypeScript.

## 🛠 Premissas Técnicas Globais
- **Linguagem:** TypeScript (Strict Mode).
- **Banco de Dados:** PostgreSQL.
- **Idioma do Código:** Inglês (Variáveis, funções, classes).
- **Padrão de Nomenclatura:** PascalCase para classes/interfaces, camelCase para métodos/variáveis.
- **Princípios:** SOLID, DRY, KISS e YAGNI são obrigatórios.
- **Independência:** O domínio não deve conhecer detalhes de infraestrutura (Banco, Frameworks Web).

---

## 🤖 Definição Detalhada dos Agentes

### 1. [Agente: Domain Entities]
- **Localização:** `src/core/domain/entities/`
- **Responsabilidade:** Modelagem do coração do negócio.
- **Instruções Detalhadas:**
    - Crie Classes Puras. Não use decorators de bibliotecas (ex: `@Entity`, `@Column`).
    - **FIFA Style:** Atletas devem possuir um objeto de valor `Stats` (pace, shooting, passing, dribbling, defense, physical).
    - Implemente validações internas (Self-Validating Entities).
    - Métodos devem expressar intenção de negócio (ex: `updatePerformance()`, não `setStats()`).
    - Use `UUID` para identificação única desde a criação.

#### 🚨 Self-Validation e Integridade
- **Responsabilidade Compartilhada:** Entidades são responsáveis por sua própria consistência interna. Validações críticas devem ocorrer no constructor.
- **Exceções de Domínio:** Use exceções customizadas do domínio (ex: `InvalidAgeRangeError`, `NegativeVacanciesError`) em vez de `new Error()`. As exceções devem estar em `src/core/domain/errors/`.
- **Estado Válido:** Após qualquer operação (ex: `updatePerformance()`, `finishMatch()`), a entidade deve manter um estado válido ou lançar exceção.
- **Exemplos:**
  - `Match.finishMatch()` deve validar se o status é `IN_PROGRESS` antes de transitar para `FINISHED`.
  - `Athlete.updatePerformance()` deve validar stats antes de atualizar.

### 2. [Agente: DTO & Validation]
- **Localização:** `src/infra/http/dtos/`
- **Responsabilidade:** Contratos de entrada e saída de dados.
- **Instruções Detalhadas:**
    - Utilize a biblioteca **Zod** para esquemas de validação.
    - Separe `RequestDTO` (entrada) de `ResponseDTO` (saída) para evitar vazamento de dados sensíveis.
    - Atributos de performance devem ser validados no range de 0 a 100.
    - Mensagens de erro devem ser amigáveis e claras.

### 3. [Agente: ORM & Persistence]
- **Foco:** PostgreSQL com Prisma ORM.
- **Responsabilidade:** Mapeamento de dados, migrações e Repositories.
- **Instruções Detalhadas:**
    - **Schema:** Defina os modelos no `schema.prisma` seguindo as entidades do domínio.
    - **Naming:** Use `snake_case` para nomes de tabelas e colunas no banco (padrão Postgres) e `camelCase` no Prisma Client.
    - **Repository Pattern:** Crie interfaces no Domínio e implementações concretas em `src/infra/database/prisma/repositories/`.
    - **Mappers:** Sempre crie um `PrismaAthleteMapper` (ou similar) para garantir que a entidade que sai do banco seja convertida na Entidade de Domínio antes de chegar ao Use Case.
    - **IDs:** Utilize `uuid()` como default para chaves primárias.

### 4. [Agente: Use Cases / Interactors]
- **Localização:** `src/core/use-cases/`
- **Responsabilidade:** Orquestração das regras de negócio.
- **Instruções Detalhadas:**
    - Cada Use Case deve ter uma única responsabilidade (ex: `MatchmakingUseCase`, `RegisterRatingUseCase`).
    - Deve receber dependências (Repositórios) via Injeção de Dependência no constructor.
    - Não deve saber que o Express ou Fastify existe. Deve receber dados simples e retornar dados simples ou exceções de negócio.

#### 🚨 Tratamento de Erros e Robustez
- **Business Exceptions (Proibido new Error):** Nunca use `new Error()` dentro do Use Case. Sempre lance exceções customizadas de domínio:
  - Crie exceções em `src/core/domain/errors/` (ex: `EntityNotFoundError`, `BusinessRuleViolationError`, `InsufficientFundsError`).
  - Exemplos de uso:
    ```typescript
    if (!match) throw new EntityNotFoundError('Match not found');
    if (athlete.financialDebt > 0) throw new BusinessRuleViolationError('Athlete has unpaid debts');
    ```
- **Fail Fast:** Valide pré-condições (existência de IDs, validações de regras de negócio) **no início** do método `execute()`:
  - Busque entidades necessárias antes de qualquer lógica complexa.
  - Lance exceções imediatamente se pré-condições não forem atendidas.
  - Isto evita processamento desnecessário e garante clareza nas mensagens de erro.
- **No Silent Catches:** Nunca capture exceções de infraestrutura (Database, Network, File I/O) com `try/catch` dentro do Use Case:
  - Deixe-as propagar para o Global Error Handler na camada HTTP.
  - Use casos de sucesso e falha de negócio devem ser explícitos.
  - Apenas o Controller ou um Middleware centralizado deve tratar erros de infraestrutura.

### 5. [Agente: Controllers]
- **Localização:** `src/infra/http/controllers/`
- **Responsabilidade:** Adaptadores de entrada HTTP.
- **Instruções Detalhadas:**
    - Deve apenas extrair dados do `request`, chamar o Use Case e formatar o `response`.
    - Gerenciamento de erros: Catch de exceções de negócio e conversão para o Status Code HTTP correto (400, 404, 409).
    - **Status Codes:** Use 201 para POST bem-sucedido e 200 para GET/PUT.

### 6. [Agente: Routes]
- **Localização:** `src/infra/http/routes/`
- **Responsabilidade:** Definição dos endpoints.
- **Instruções Detalhadas:**
    - Agrupe rotas por contexto (ex: `/athletes`, `/matches`, `/groups`).
    - Injete as dependências manualmente ou via container no arquivo de rotas.

## Regras de Negócio Específicas:
- **Regra de Avaliação:** Na primeira vez que o atleta acessar o app, ele deverá responder um questionário de autoavaliação técnica, responderá qual o seu nível de futebol (se foi profissional, se jogou em varzea, se participou de competições), também responderá os atributos técnicos (Pace, Shooting, Passing, Dribbling, Defense, Physical) para calcular seu 'Overall' inicial. A avaliação do nível de futebol (questionário) servirá como um peso para diferenciar o profissional do amador. O 'Overall' é atualizado após cada partida com base na performance avaliada pelos outros jogadores.
Um atleta só pode ser avaliado se o status da Partida for 'FINISHED' e se ele estiver na lista de 'CONFIRMED_PRESENCE'.

Weighted Overall: Implementar calculateWeightedOverall(). Profissionais recebem peso 1.2, Amadores 1.0, Casuais 0.8 sobre a média dos atributos.

- **Regra para confirmar presença:** O atleta mensalista tem prioridade sobre o avulso. O atleta mensalista pode confirmar a sua presença até 30 minutos antes do início da partida. Após esse período, o sistema deve liberar as vagas para os atletas avulsos, seguindo a ordem de chegada (first-come, first-served). Os atletas (mensalistas ou avulsos) não podem confirmar presença se tiverem pendências financeiras (status de pagamento = 'PENDING') ou se estiverem machucados (isInjured).
- **Regra de Sorteio:** O sorteio de times deve priorizar o equilíbrio do 'Overall' técnico antes da posição dos jogadores. 
- **Regra de Pagamento:** Atletas mensais pagam para o administrador do grupo todo mês em data pré-definida. Atletas avulsos pagam um valor determinado pelo administrador. O administrador deverá confirmar o pagamento, mundando o status do pagamento para 'PAID'. 
- **Regra de Stats:** O 'Overall' de um atleta é a média aritmética ponderada de seus atributos técnicos, onde 'Pace' e 'Defense' têm pesos diferentes conforme a posição.

- **Disponibilidade Multi-Agenda:** Atletas avulsos podem definir múltiplos períodos de disponibilidade para jogos, e o sistema deve considerar todos esses períodos ao filtrar atletas para partidas futuras.

- **Grupos:** Um atleta poderá criar um grupo, se tornando administrador, ou participar de grupos já existentes. O administrador do grupo tem controle total sobre as partidas do grupo, podendo criar, editar e excluir partidas, além de gerenciar os membros do grupo (aceitar ou remover atletas). Os membros do grupo podem visualizar as partidas criadas pelo administrador e confirmar presença, mas não têm permissão para editar ou excluir partidas. O sistema deve garantir que apenas o administrador do grupo possa realizar ações de gerenciamento, enquanto os membros têm acesso limitado às funcionalidades de visualização e confirmação de presença. O administrador do grupo é responsável por definir a quantidade de vagas, posições necessárias e critérios de seleção dos atletas. O sistema deve permitir que o administrador do grupo abra vagas para atletas avulsos caso os mensalistas não preencham todas as vagas disponíveis, seguindo a ordem de chegada (first-come, first-served).

- **Matchmaking e Balanceamento de Times:** O sistema deve implementar um algoritmo de matchmaking que priorize o equilíbrio técnico dos times com base no 'Overall' dos jogadores, seguido pela posição. O algoritmo deve considerar as preferências de posição dos jogadores e tentar alocar jogadores em suas posições preferidas, mas sem comprometer o equilíbrio geral dos times. O sistema deve permitir que o administrador do grupo configure regras específicas para o matchmaking, como a necessidade de um goleiro e o nível dos atletas avulsos 'Overall'.

- **Marketplace de Vagas e Geofencing:**

Administradores podem abrir vagas específicas definindo: quantidade, posições, faixa etária e nível técnico (Overall).

O sistema deve filtrar atletas num raio de distância (KM) definido pelo Admin em relação ao local do jogo.

Notificações de convite são enviadas em massa; o preenchimento é por ordem de aceite (First-come, first-served), com os excedentes indo para uma lista de espera.

- **Protocolo de Check-in e Vacância:**

O check-in é obrigatório até 30 minutos antes do início da partida.

Na ausência do check-in, o sistema deve notificar o administrador para disparar a abertura automática de vagas para atletas avulsos.

- **Fluxo Financeiro e Inadimplência:**

Gestão de Recebíveis: Administradores devem cadastrar chaves PIX para recebimento.

Mensalistas: O sistema deve automatizar lembretes de cobrança para mensalistas pendentes.

- **Avulsos: O status de pagamento é validado pelo Admin.**

Bloqueio de Inadimplentes: Atletas com pendências financeiras (avulsos ou mensalistas) ficam automaticamente bloqueados de utilizar a funcionalidade de "Disponibilidade para Jogos" e de ingressar em novas partidas.

- **Monetização (Goleiro de Aluguel):**

Atletas da posição 'Goleiro' podem atuar como prestadores de serviço remunerados.

O sistema deve calcular e reter um percentual de comissão sobre o valor pago ao goleiro antes do repasse final ou via taxa de intermediação.

- **Motor de Publicidade (Ads):**

O sistema deve suportar a exibição de anúncios (Banners/Links) que podem ser segmentados pela localização geográfica do atleta ou perfil técnico

- **Quadras Parceiras:** O sistema deve permitir que quadras de futebol se cadastrem como parceiros, oferecendo descontos ou benefícios para os atletas que utilizarem seus serviços, incentivando parcerias locais e promovendo o engajamento da comunidade. As quadras parceiras podem ser destacadas no aplicativo, e os atletas podem acessar informações sobre as quadras, como localização, avaliações e ofertas especiais. Caso uma quadra parceira esteja com quadras disponíveis para aluguel, o sistema pode sugerir aos atletas a opção de reservar diretamente pela plataforma, integrando o processo de reserva e pagamento.

### Regras de Negócio Avançadas:

#### **Geofencing:**
- **Responsabilidade:** Use Cases como `OpenMatchVacanciesUseCase` devem utilizar `IAthleteRepository.findNearby()`.
- **Implementação:** Repository implementa cálculos de distância (Haversine formula em TypeScript ou PostGIS em SQL).
- **Lógica:** Filtra atletas num raio de distância (KM) definido pelo Admin em relação às coordenadas (latitude/longitude) do local do jogo.
- **Critérios Combinados:** Junto ao raio, aplica filtros de `minOverall`, `minAge`, `maxAge` e `positions` da partida.

#### **Inadimplência:**
- **Bloqueio de Funcionalidades:** Atletas com `FinancialDebt > 0` (ou status de pagamento = 'PENDING') ficam bloqueados de:
  - Cadastrar/Atualizar `setAvailability` para jogos avulsos.
  - Confirmar presença em novas partidas.
  - Participar de matchmaking e convites geoespaciais.
- **Verificação:** Before filtro em `IAthleteRepository.findNearby()` deve excluir atletas com débitos.
- **Regra Geral:** "Uma vez bloqueado, desbloqueado apenas após pagamento validado pelo Admin e com status 'PAID'."

#### **Goleiro de Aluguel (Monetização):**
- **Identificação:** Atleta com `isGoalkeeperForHire = true` e `posicao = 'Goleiro'` pode ser contratado como prestador de serviço.
- **Taxa de Intermediação:** Sempre que um goleiro for confirmado em uma partida, aplique:
  - **Taxa Fixa:** 10% (configurável via env var `GOALKEEPER_COMMISSION_RATE`) sobre o valor da partida.
  - Exemplo: Se partida custa R$100, plataforma retém R$10, goleiro recebe R$90.
- **Fluxo Financeiro:** FinancialTransaction deve registrar tipo `GOALKEEPER_SERVICE` com `platform_fee` preenchida.
- **PIX:** Goleiro configura `pixKey` para receber seus ganhos. Admin gerencia transferências.

#### **Check-in:**
- **Janela de Check-in:** Disponível de 30 minutos **antes** até o horário exato da partida (match.date).
- **Validação:** `Match.canCheckIn(currentTime)` retorna `true` apenas nesta janela.
- **Consequência da Ausência:** Se nenhum check-in até 30 minutos do início, Use Case `AutoOpenVacanciesUseCase` dispara automaticamente abertura de vagas para avulsos.
- **Notificação:** Sistema notifica Admin para considerar bloqueio do atleta em futuras partidas.