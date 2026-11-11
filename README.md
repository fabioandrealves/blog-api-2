# Blog API

API REST para um blog educacional, desenvolvida com **Node.js, TypeScript, Express 5 e MySQL** e consumida pelo aplicativo `blog_mobile`. Possui autenticação por JWT e autorização baseada nos papéis `admin`, `teacher` e `student`.

## Funcionalidades

- Cadastro e autenticação de usuários.
- Cadastro e gerenciamento de professores por administradores.
- Cadastro público e gerenciamento de estudantes por professores.
- Publicação e gerenciamento de posts por professores.
- Comentários em posts por professores e estudantes.
- Proteção de endpoints com autenticação e verificação de papéis.
- Endpoint de health check.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| Node.js + TypeScript | Execução e tipagem da aplicação |
| Express `^5.3.0` | Servidor HTTP e roteamento |
| MySQL2 `^3.24.6` | Integração com MySQL |
| JSON Web Token `^9.0.3` | Autenticação JWT |
| bcryptjs `^3.0.3` | Biblioteca de hash de senhas |
| Zod `^4.6.7` | Biblioteca de validação |
| cors `^2.8.6` | Middleware CORS |
| dotenv `^18.0.9` | Carregamento de variáveis de ambiente |
| tsx `^4.23.15` | Execução TypeScript em desenvolvimento |
| TypeScript `^7.0.2` | Compilação para JavaScript |
| Jest `^30.5.2` | Dependência de testes (script ainda não configurado) |

As versões acima correspondem às faixas declaradas no `package.json`, não necessariamente às versões efetivamente instaladas.

## Pré-requisitos

- Node.js e npm compatíveis com as dependências do projeto.
- Instância de MySQL acessível à aplicação.
- Variáveis de ambiente necessárias à conexão com o banco e à autenticação, conforme os módulos de configuração e controllers.

## Instalação e execução

Clone o repositório e, na pasta `blog-api`, instale as dependências:

```bash
npm install
```

Configure o ambiente antes de iniciar. O `server.ts` carrega `dotenv/config` e reconhece estas variáveis:

| Variável | Descrição | Padrão |
| --- | --- | --- |
| `HOST` | Interface em que o servidor escuta | `0.0.0.0` |
| `PORT` | Porta HTTP | `3333` |
| `DB_HOST` | Host do MySQL | `127.0.0.1` |
| `DB_PORT` | Porta do MySQL | `3306` |
| `DB_USER` | Usuário MySQL | `root` |
| `DB_PASSWORD` | Senha MySQL | string vazia |
| `DB_NAME` | Nome do banco MySQL | sem padrão definido |

Exemplo de `.env` (substitua o segredo por um valor aleatório e privado):

```dotenv
HOST=0.0.0.0
PORT=3333
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=blog
JWT_SECRET=substitua-por-um-segredo-aleatorio-com-mais-de-32-caracteres
JWT_EXPIRES_IN=1h
# DB_NAME=blog é apenas um exemplo; crie o banco com o nome escolhido.
```

> `JWT_SECRET` é obrigatório e deve ter **pelo menos 32 caracteres**; caso contrário, `getJwtSecret()` lança um erro ao ser chamado. `JWT_EXPIRES_IN` é opcional e usa `1h` por padrão. Seu valor deve ser aceito pela biblioteca `jsonwebtoken` (por exemplo, `1h` ou `7d`). Não versione segredos nem arquivos `.env`.

### Desenvolvimento

```bash
npm run dev
```

Executa `tsx watch src/server.ts`, reiniciando o servidor quando o código mudar.

### Compilação e execução do build

```bash
npm run build
npm start
```

O script `build` executa `tsc` e o script `start` executa `node dist/server.js`. O `tsconfig.json` confirma que os arquivos TypeScript em `src/` são compilados para `dist/`, incluindo `src/server.ts` → `dist/server.js`.

### Configuração TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts"]
}
```

- **`target: ES2022`**: gera JavaScript compatível com os recursos da edição ES2022.
- **`module` e `moduleResolution: NodeNext`**: usam as regras de módulos e resolução do Node.js, em conjunto com `"type": "module"` no `package.json`.
- **`rootDir: src` e `outDir: dist`**: mantêm a estrutura de diretórios na saída compilada.
- **`strict: true`**: habilita verificações estritas de tipos.
- **`esModuleInterop: true`**: facilita a interoperabilidade com módulos CommonJS.
- **`skipLibCheck: true`**: não verifica tipos declarados em arquivos `.d.ts` de dependências.
- **`forceConsistentCasingInFileNames: true`**: exige consistência de maiúsculas e minúsculas nos caminhos importados.
- **`include: ["src/**/*.ts"]`**: compila os arquivos TypeScript de `src/`; os testes `.cjs` em `tests/api/` não entram no build do TypeScript.

O `tsconfig.json` não define `noEmit`, portanto a compilação emite arquivos JavaScript por padrão. A configuração foi documentada conforme fornecida; a execução do build não foi verificada aqui.

**Atenção para produção:** `dotenv` está listado em `devDependencies`, embora `server.ts` importe `dotenv/config` em tempo de execução. Se instalar somente dependências de produção, o módulo poderá faltar. Avalie movê-lo para `dependencies` antes de publicar.

### Testes de integração (Jest)

O repositório contém testes de integração em `tests/api/`, escritos em CommonJS (`.cjs`) e executados contra **uma API HTTP real em funcionamento**. Eles não simulam o banco de dados: criam posts e comentários e verificam persistência, validação, autenticação e autorização.

O script `npm test` do `package.json` compartilhado **ainda não está configurado** e falha intencionalmente. Para executar os testes existentes, é necessário configurar o Jest e seu arquivo de inicialização. Exemplo de configuração, **sugerida e não confirmada como existente no projeto**:

```js
// jest.config.cjs
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/api/**/*.test.cjs'],
  setupFiles: ['<rootDir>/tests/api/setup-env.cjs'],
  testTimeout: 20000,
};
```

O exemplo acima encontra arquivos terminados em `.test.cjs`. Renomeie `list-comments.tst.cjs` para `list-comments.test.cjs` e `list-posts.cjs` para `list-posts.test.cjs` para incluí-los na descoberta padrão. A configuração sugerida pode ser executada com `npx jest --runInBand` após iniciar a API e preparar um banco de testes. Alternativamente, altere o script `test` do `package.json` para `jest --runInBand` depois de confirmar a configuração.

#### Ambiente de testes

`tests/api/setup-env.cjs` carrega `.env.test` da raiz do projeto e exige `API_TEST_URL` e `API_TEST_LOGIN_PATH`. O helper de autenticação também exige credenciais reais de dois professores e um estudante. Exemplo de `.env.test` **com valores ilustrativos**:

```dotenv
API_TEST_URL=http://127.0.0.1:3333
API_TEST_LOGIN_PATH=/api/v1/auth/login
API_TEST_TEACHER_EMAIL=professor-a@example.com
API_TEST_TEACHER_PASSWORD=senha-de-teste
API_TEST_OTHER_TEACHER_EMAIL=professor-b@example.com
API_TEST_OTHER_TEACHER_PASSWORD=senha-de-teste
API_TEST_STUDENT_EMAIL=estudante@example.com
API_TEST_STUDENT_PASSWORD=senha-de-teste
```

Essas três contas devem **existir no banco acessado pela API** e possuir os papéis corretos (`teacher`, `teacher` e `student`). Não versionar `.env.test` com credenciais reais. Recomenda-se utilizar um banco exclusivo para testes, pois as suítes executam operações de escrita e exclusão.

#### Helpers disponíveis

| Arquivo | Responsabilidade |
| --- | --- |
| `helpers/api-client.cjs` | Cliente `fetch` com base URL, JSON, Bearer token, timeout de 10 segundos e extratores de posts |
| `helpers/auth-helper.cjs` | Login real via API, cache de tokens por tipo de usuário e limpeza do cache |
| `helpers/comment-fixture.cjs` | Criação de comentários com conteúdo único, rastreamento do token do autor e limpeza posterior |
| `helpers/post-fixture.cjs` | Geração de posts com dados únicos, criação via API com JWT de professor, rastreamento dos IDs, exclusão e limpeza dos posts criados |
| `setup-env.cjs` | Carregamento e verificação das variáveis obrigatórias do `.env.test` |

O helper `auth-helper.cjs` **não usa tokens fabricados**: chama o endpoint de login, extrai o JWT de `data.token` (ou formatos alternativos) e o reutiliza. O `api-client.cjs` retorna `{ status, ok, data, headers }` e interrompe chamadas que excedam 10 segundos.

#### Suítes compartilhadas

| Arquivo | Cobertura principal |
| --- | --- |
| `auth-check.test.cjs` | Login real, acesso de professores a `/posts/me`, rejeição de estudante e ausência de JWT |
| `create-post.test.cjs` | Criação, persistência, validação e bloqueio de estudante ou usuário anônimo |
| `get-post-by-id.test.cjs` | Consulta pública e post inexistente |
| `list-posts.cjs` | Listagem pública de posts |
| `list-my-posts.test.cjs` | Listagem do professor autenticado e restrições de acesso |
| `update-post.test.cjs` | Atualização pelo autor, persistência e rejeição de terceiros |
| `delete-post.test.cjs` | Exclusão pelo autor, confirmação de remoção e bloqueio de terceiros |
| `create-comment.test.cjs` | Comentários de professor/estudante, persistência, validação e IDs inválidos |
| `get-comment-by-id.test.cjs` | Consulta pública, ID inválido e comentário inexistente |
| `list-comments.tst.cjs` | Lista vazia, listagem de comentários, post inexistente e ID inválido |
| `update-comment.test.cjs` | Atualização pelo autor, persistência, validação e restrições de autoria |
| `delete-comment.test.cjs` | Exclusão por professor/estudante autores, rejeição de terceiros e confirmação de remoção |

#### Fixture de posts (`tests/api/helpers/post-fixture.cjs`)

A fixture foi conferida no código compartilhado e exporta quatro funções:

| Função | Comportamento |
| --- | --- |
| `makePostInput()` | Gera `title` e `content` válidos e exclusivos, combinando `Date.now()` com uma sequência aleatória |
| `createTestPost(token?)` | Obtém um JWT de professor quando nenhum token é fornecido, faz `POST /api/v1/posts`, exige HTTP `201`, valida o ID retornado e registra o post para limpeza; retorna `{ post, input, token }` |
| `deleteTestPost(id, token?)` | Faz `DELETE /api/v1/posts/:id` com o token informado ou o JWT do professor padrão; remove o ID do controle local em respostas `200`, `204` ou `404` |
| `cleanupTestPosts()` | Percorre os IDs ainda registrados em um `Set`, tenta excluir cada post e lança um erro consolidado se alguma remoção falhar |

O controle de posts criados usa um `Set` em memória, compartilhado pelas chamadas que importam o módulo no mesmo processo de testes. A fixture gera dados únicos para reduzir colisões, mas não cria uma transação de banco nem isola automaticamente os testes.

**Cuidados:** a limpeza sem token explícito usa o professor padrão (`getTeacherToken()`); portanto, posts criados com um token de outro professor podem não ser removidos por `cleanupTestPosts()`. Além disso, posts com comentários associados devem ter seus comentários removidos antes, conforme as regras de integridade do banco. As suítes de comentários já chamam `cleanupTestComments()` antes de `cleanupTestPosts()` no `afterAll`.

**Exemplo de uso em um teste:**

```js
const { createTestPost, cleanupTestPosts } = require('./helpers/post-fixture.cjs');

afterAll(async () => {
  await cleanupTestPosts();
});

it('cria um post para teste', async () => {
  const { post, input } = await createTestPost();
  expect(post.title).toBe(input.title);
});
```


**Observação sobre isolamento:** algumas suítes dependem de operações em ordem (por exemplo, atualizar e depois verificar o mesmo comentário). Para evitar interferência entre arquivos e no banco de testes, `--runInBand` é uma opção conservadora. Não é uma garantia de isolamento completo; idealmente, cada caso deveria preparar e limpar seus próprios dados.

### Geração manual de tokens de teste

O repositório também inclui `scripts/generate-test-tokens.cjs`, um utilitário CommonJS que carrega as variáveis do `.env` com `dotenv` e assina JWTs usando `jsonwebtoken`.

Execute a partir da raiz do projeto, após configurar `JWT_SECRET`:

```bash
node scripts/generate-test-tokens.cjs
```

O script imprime três linhas no formato `NOME_DA_VARIAVEL=TOKEN`, que podem ser copiadas para um ambiente de testes:

| Variável gerada | `sub` (ID fixo) | Expiração |
| --- | --- | --- |
| `API_TEST_TEACHER_TOKEN` | `1` | `1h` |
| `API_TEST_OTHER_TEACHER_TOKEN` | `2` | `1h` |
| `API_TEST_STUDENT_TOKEN` | `3` | `1h` |

**Limitações importantes:**

- Os IDs são fixos e **não são verificados no MySQL**. Antes de utilizar os tokens, confirme que os usuários existem e têm os papéis esperados.
- Os tokens gerados possuem o `sub`, mas **não incluem a claim `role`**. O login real da API, por outro lado, assina um token contendo `sub` e `role`. O middleware atual valida a assinatura e o `sub`, consulta o usuário no banco e obtém o papel diretamente da tabela `users`; portanto, não exige uma claim `role` no token. Ainda assim, os IDs fixos precisam corresponder a usuários reais.
- O utilitário valida apenas se `JWT_SECRET` está definido; ele **não aplica a exigência mínima de 32 caracteres** de `getJwtSecret()` nem utiliza `JWT_EXPIRES_IN` (a duração é sempre `1h`).
- Não publique tokens nem os adicione ao controle de versão. O script é uma conveniência local, **não substitui os testes de autenticação e autorização**.

Para testes de integração, a abordagem recomendada é criar ou utilizar contas reais de teste, chamar `POST /api/v1/auth/login` e empregar os JWTs retornados, evitando IDs presumidos.

## Endereço base e monitoramento

Por padrão, a API escuta na porta `3333`:

```text
http://localhost:3333
```

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/` | Retorna `{"message":"Blog API funcionando!"}` |
| `GET` | `/api/v1/health` | Verifica a disponibilidade HTTP da API |

Exemplo:

```bash
curl http://localhost:3333/api/v1/health
```

Resposta HTTP `200`:

```json
{
  "status": "ok",
  "message": "API disponível"
}
```

Esse health check confirma que o servidor responde; o código apresentado **não verifica a conexão com o MySQL**.

## Autenticação e autorização

Os endpoints protegidos usam o middleware `authenticate`. Quando aplicável, o middleware `requireRole(...)` limita o acesso por papel.

### Funcionamento dos middlewares (`src/middlewares/auth.middleware.ts`)

O middleware **`authenticate`**:

1. Exige o cabeçalho `Authorization` iniciado exatamente por `Bearer `; se ausente ou com outro esquema, responde `401` (`Token de autenticação não informado.`).
2. Remove espaços do token recebido e rejeita token vazio com `401` (`Token de autenticação inválido.`).
3. Verifica a assinatura e a validade do JWT usando `jwt.verify(token, getJwtSecret())`; tokens inválidos ou expirados recebem `401` (`Token inválido ou expirado.`).
4. Exige que o payload seja um objeto com `sub` do tipo string, convertível para um inteiro positivo seguro; caso contrário, responde `401`.
5. Consulta `SELECT id, role FROM users WHERE id = ? LIMIT 1` no MySQL. Se o usuário não existir, retorna `401` (`Usuário não encontrado.`); falhas de banco retornam `500` (`Erro interno ao validar autenticação.`).
6. Define `res.locals.authUser = { id, role }` e chama `next()`.

**O papel é obtido do banco de dados a cada requisição autenticada**, e não da claim `role` do JWT. Isso permite refletir mudanças de papel e a exclusão de contas sem depender do papel gravado no token. A consulta ao banco também significa que as rotas autenticadas dependem da disponibilidade do MySQL.

O middleware **`requireRole(...allowedRoles)`** consulta `res.locals.authUser`:

- Se não houver usuário autenticado, responde `401` (`Autenticação necessária.`).
- Se o papel atual não estiver entre os permitidos, responde `403` (`Você não tem permissão para realizar esta ação.`).
- Se autorizado, chama `next()`.

`requireRole` deve ser usado após `authenticate` nas rotas protegidas. As verificações de **autoria** de posts e comentários continuam sendo responsabilidade dos respectivos controllers, além da verificação de papel.

Para enviar o JWT:

```http
Authorization: Bearer SEU_TOKEN_JWT
```

### Perfis

- **`admin`**: cadastra, lista, atualiza e exclui professores.
- **`teacher`**: cria e gerencia posts, comenta e gerencia estudantes.
- **`student`**: pode comentar em posts e acessar conteúdo público.
- **Visitante**: pode acessar endpoints públicos e se cadastrar.

Os controllers confirmam que somente o autor pode editar ou excluir seus próprios posts e comentários; tentativas por outro usuário retornam HTTP `403`.

## Endpoints da API

Todos os endpoints abaixo usam o prefixo `/api/v1`.

### Autenticação — `/api/v1/auth`

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Público | Cadastro de usuário (fluxo de estudante) |
| `POST` | `/api/v1/auth/login` | Público | Autenticação |
| `GET` | `/api/v1/auth/me` | Autenticado | Dados do usuário autenticado |
| `POST` | `/api/v1/auth/teachers` | `admin` | Cadastro de professor |

Exemplo de chamada ao login:

```bash
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@exemplo.com","password":"SENHA_DE_EXEMPLO"}'
```

> O login retorna `data.user` e `data.token`; o JWT contém `sub` (ID do usuário) e `role`.

### Posts — `/api/v1/posts`

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/v1/posts` | Público | Lista posts |
| `GET` | `/api/v1/posts/:id` | Público | Consulta um post por ID |
| `GET` | `/api/v1/posts/me` | `teacher` autenticado | Lista os posts do professor autenticado |
| `POST` | `/api/v1/posts` | `teacher` autenticado | Cria um post |
| `PUT` | `/api/v1/posts/:id` | `teacher` autenticado | Atualiza um post |
| `DELETE` | `/api/v1/posts/:id` | `teacher` autenticado | Exclui um post |

O controller verifica a autoria: edição e exclusão são permitidas **somente nos próprios posts**, com `403` quando outro professor tenta alterá-los. A rota `/me` está declarada antes de `/:id`, evitando que `me` seja interpretado como ID.

Exemplos:

```bash
# Lista pública
curl http://localhost:3333/api/v1/posts

# Posts do professor autenticado
curl http://localhost:3333/api/v1/posts/me \
  -H 'Authorization: Bearer SEU_TOKEN_JWT'
```

### Comentários

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/v1/posts/:postId/comments` | Público | Lista comentários de um post |
| `GET` | `/api/v1/comments/:id` | Público | Consulta um comentário por ID |
| `POST` | `/api/v1/posts/:postId/comments` | `teacher` ou `student` autenticado | Cria comentário em um post |
| `PUT` | `/api/v1/comments/:id` | `teacher` ou `student` autenticado | Atualiza comentário |
| `DELETE` | `/api/v1/comments/:id` | `teacher` ou `student` autenticado | Exclui comentário |

O controller confirma que apenas o **autor** pode atualizar ou excluir seu comentário. Caso contrário, retorna HTTP `403`. A listagem é ordenada por criação (mais antigos primeiro).

Exemplo:

```bash
curl http://localhost:3333/api/v1/posts/1/comments
```

### Gerenciamento de professores

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/v1/teachers` | `admin` | Lista professores |
| `PUT` | `/api/v1/teachers/:id` | `admin` | Atualiza professor |
| `DELETE` | `/api/v1/teachers/:id` | `admin` | Exclui professor |

Exemplo:

```bash
curl http://localhost:3333/api/v1/teachers \
  -H 'Authorization: Bearer TOKEN_DO_ADMIN'
```

### Gerenciamento de estudantes

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/v1/students` | `teacher` | Lista estudantes |
| `PUT` | `/api/v1/students/:id` | `teacher` | Atualiza estudante |
| `DELETE` | `/api/v1/students/:id` | `teacher` | Exclui estudante |

Exemplo:

```bash
curl http://localhost:3333/api/v1/students \
  -H 'Authorization: Bearer TOKEN_DO_PROFESSOR'
```

### Exemplos de atualização de usuário

O contrato de gerenciamento de usuários utilizado na integração mobile prevê atualização de `name` e/ou `email`:

```bash
curl -X PUT http://localhost:3333/api/v1/teachers/1 \
  -H 'Authorization: Bearer TOKEN_DO_ADMIN' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Professora Maria","email":"maria@exemplo.com"}'
```

```bash
curl -X PUT http://localhost:3333/api/v1/students/1 \
  -H 'Authorization: Bearer TOKEN_DO_PROFESSOR' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Estudante João","email":"joao@exemplo.com"}'
```

## Formato de resposta do gerenciamento de usuários

O contrato usado pelo aplicativo mobile prevê as estruturas abaixo. Os valores são ilustrativos; confira o controller para confirmar campos opcionais e mensagens exatas.

### Listagem

```json
{
  "message": "Usuários listados",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Maria Oliveira",
        "email": "maria@exemplo.com",
        "role": "teacher",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Atualização

```json
{
  "message": "Usuário atualizado",
  "data": {
    "user": {
      "id": 1,
      "name": "Maria Oliveira",
      "email": "maria@exemplo.com",
      "role": "teacher"
    }
  }
}
```

### Exclusão

O controller retorna um objeto com `message`. A exclusão é realizada em transação e é **bloqueada com HTTP `409 Conflict`** se o usuário possui posts ou comentários vinculados. O registro do usuário é bloqueado com `SELECT ... FOR UPDATE` durante a operação.

## Tratamento de requisições e erros

O `server.ts` aplica, nesta ordem:

1. `cors()` — CORS habilitado sem restrição explícita de origem nesse arquivo.
2. `express.json()` — leitura de corpos JSON.
3. Middleware de log de método, URL e status final.
4. Endpoints `/` e `/api/v1/health`.
5. Rotas de autenticação, posts, comentários e gerenciamento de usuários.
6. Fallback HTTP `404` para rotas não encontradas.

Exemplo de resposta para rota inexistente:

```json
{
  "message": "Rota não encontrada."
}
```

Os controllers fornecidos confirmam os códigos `400` (validação/ID inválido), `401` (credenciais inválidas), `403` (não é autor), `404` (recurso ausente), `409` (e-mail duplicado ou exclusão impedida), `500` (erro interno), além de `200` e `201`. As respostas específicas de autenticação e autorização estão documentadas na seção dos middlewares, com base no `auth.middleware.ts` fornecido.

## Estrutura principal do projeto

Os arquivos abaixo foram confirmados pelos imports e trechos fornecidos:

```text
blog-api/
├── src/
│   ├── server.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── post.routes.ts
│   │   ├── comment.routes.ts
│   │   └── user-management.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── post.controller.ts
│   │   ├── comment.controller.ts
│   │   └── user-management.controller.ts
│   ├── middlewares/
│   │   └── auth.middleware.ts
│   ├── config/
│   │   ├── database.ts
│   │   └── jwt.ts
│   └── validators/
│       ├── post.validator.ts
│       ├── comment.validator.ts
│       └── user-management.validator.ts
├── scripts/
│   └── generate-test-tokens.cjs
├── tests/
│   └── api/
│       ├── helpers/
│       │   ├── api-client.cjs
│       │   ├── auth-helper.cjs
│       │   ├── comment-fixture.cjs
│       │   └── post-fixture.cjs
│       ├── setup-env.cjs
│       └── *.test.cjs (além de list-posts.cjs e list-comments.tst.cjs)
├── package.json
└── README.md
```

Essa árvore é **parcial** e não representa todos os arquivos do repositório.

## Contratos detalhados dos controllers

### Cadastro e login

`POST /api/v1/auth/register` cadastra **sempre um estudante**. `POST /api/v1/auth/teachers` cadastra um **professor** e exige JWT de administrador. Ambos recebem:

```json
{"name":"Maria Oliveira","email":"maria@example.com","password":"senhaSegura123"}
```

Validação confirmada pelo Zod: `name` é aparado e deve ter **2 a 120 caracteres**; `email` é aparado, deve ser válido e ter no máximo **255 caracteres**; `password` deve ter **8 a 72 caracteres**. O e-mail é convertido para minúsculas antes do armazenamento. A senha é transformada em hash com **bcrypt, custo 12**. Sucesso: HTTP `201` e `data.user`; e-mail duplicado: `409`; entrada inválida: `400` com `errors` por campo.

`POST /api/v1/auth/login` recebe `email` e `password` (de **1 a 72 caracteres** para a senha). Credenciais incorretas retornam `401`; payload inválido retorna `400`. Resposta de sucesso (valores ilustrativos):

```json
{
  "message": "Login realizado com sucesso.",
  "data": {
    "user": {"id": 1, "name": "Maria Oliveira", "email": "maria@example.com", "role": "teacher", "createdAt": "2026-11-11T10:00:00.000Z", "updatedAt": "2026-11-11T10:00:00.000Z"},
    "token": "JWT_RETORNADO_PELO_SERVIDOR"
  }
}
```

`GET /api/v1/auth/me` exige autenticação e retorna `data.user` sem hash de senha; se o usuário autenticado não existir no banco, retorna `404`. O tempo de expiração e a chave de assinatura são obtidos pelas funções `getJwtExpiresIn()` e `getJwtSecret()` em `config/jwt.ts`.

### Estrutura de post

As respostas de listagem e detalhe usam, respectivamente, `data.posts` e `data.post`. Cada post possui os campos `id`, `title`, `content`, `userId`, `authorName`, `createdAt` e `updatedAt`. A listagem pública e `/posts/me` são ordenadas por `createdAt` decrescente.

Exemplo de criação (professor autenticado):

```bash
curl -X POST http://localhost:3333/api/v1/posts \
  -H 'Authorization: Bearer TOKEN_DO_PROFESSOR' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Introdução ao TypeScript","content":"Conteúdo do artigo"}'
```

`POST` retorna `201` com `data.post`. `PUT /posts/:id` utiliza `title` e `content`, retorna `200` com `data.post`, e `DELETE /posts/:id` retorna `200` com `message`. Para atualização e exclusão, `404` indica post inexistente e `403` indica que o professor autenticado não é o autor. Tanto na criação quanto na atualização, **`title` e `content` são obrigatórios**. Após `trim()`, `title` deve ter **3 a 255 caracteres** e `content` deve ter **pelo menos 10 caracteres** (sem limite máximo explícito no validador). O ID da rota deve ser uma string decimal positiva sem zero inicial, conforme a expressão `^[1-9]\d*$`.

### Estrutura de comentário

As respostas usam `data.comments` para a lista e `data.comment` para detalhe, criação e atualização. Cada comentário inclui `id`, `postId`, `userId`, `content`, `authorName`, `createdAt` e `updatedAt`.

Exemplo de criação (professor ou estudante autenticado):

```bash
curl -X POST http://localhost:3333/api/v1/posts/1/comments \
  -H 'Authorization: Bearer SEU_TOKEN_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"content":"Ótima explicação!"}'
```

Para atualizar: `PUT /api/v1/comments/:id` com JSON `{"content":"Texto atualizado"}`. Criação retorna `201`; atualização, `200`; exclusão, `200` com `message`. Um post inexistente impede listar ou criar comentários (`404`). Comentários inexistentes retornam `404`; tentativa de alterar comentário de outra pessoa retorna `403`. O campo `content` é obrigatório, sofre `trim()` e deve conter **pelo menos um caractere**; não há limite máximo explícito no validador. Os IDs `:id` e `:postId` são convertidos para números e precisam ser inteiros positivos.

### Gerenciamento de usuários

`GET /api/v1/teachers` e `GET /api/v1/students` retornam `data.users` ordenados por nome e ID, em ordem crescente. `PUT /api/v1/teachers/:id` e `PUT /api/v1/students/:id` aceitam `name` e/ou `email` conforme `updateManagedUserSchema`, preservando os valores não enviados. Sucesso: `200` com `data.user`; e-mail duplicado: `409`; usuário inexistente: `404`.

A listagem de estudantes não está filtrada por professor: **qualquer professor autenticado pode gerenciar os estudantes** conforme as rotas atuais. Administradores gerenciam professores. Exclusões de usuários com conteúdo associado retornam `409`, preservando posts e comentários.

#### Comportamento confirmado em `user-management.controller.ts`

- **Listagem:** consulta a tabela `users` com filtro por `role` (`teacher` ou `student`) e ordenação por `name ASC, id ASC`. A resposta contém `data.users` com `id`, `name`, `email`, `role`, `createdAt` e `updatedAt`; não expõe `password_hash`.
- **Atualização parcial:** valida `:id` com `managedUserIdSchema` e o corpo com `updateManagedUserSchema`. Aceita os campos validados `name` e/ou `email`, preservando o valor atual quando um campo é omitido. O `UPDATE` restringe simultaneamente `id` e `role`, impedindo que a rota de professores modifique um estudante, ou vice-versa.
- **E-mail duplicado:** quando o MySQL devolve `ER_DUP_ENTRY`, a API responde `409` com `{"message":"Este e-mail já está cadastrado."}`.
- **Exclusão:** obtém uma conexão do pool, inicia transação e seleciona o usuário com `FOR UPDATE`. Verifica quantos registros em `posts` e `comments` referenciam seu `id`. Se houver qualquer conteúdo associado, executa `ROLLBACK` e devolve `409`; caso contrário, executa `DELETE` e `COMMIT`. A conexão é liberada no bloco `finally`.
- **Erros:** IDs ou dados inválidos retornam `400`; usuário inexistente, `404`; conflito de e-mail ou conteúdo vinculado, `409`; erros internos tratados, `500`.

**Exemplo de conflito na exclusão (`409`):**

```json
{
  "message": "Este usuário possui posts ou comentários vinculados. Não é possível excluí-lo enquanto houver conteúdo associado."
}
```

**Exemplo de atualização parcial de professor:**

```bash
curl -X PUT http://localhost:3333/api/v1/teachers/12 \
  -H 'Authorization: Bearer TOKEN_ADMIN' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Maria Silva"}'
```

O corpo de atualização deve conter **pelo menos um** dos campos `name` e `email`; ambos são opcionais individualmente, mas **campos adicionais são rejeitados** (`.strict()`). `name` é aparado e aceita **2 a 120 caracteres**. `email` é aparado, deve ter formato válido, no máximo **255 caracteres**, e é convertido para minúsculas. O ID é convertido para número e deve ser inteiro positivo.

### Banco de dados

A configuração usa `mysql2/promise` e um pool de conexões com `connectionLimit: 10`, `waitForConnections: true` e `queueLimit: 0`. As consultas usam parâmetros preparados (`?`). As tabelas referenciadas nos controllers são `users`, `posts` e `comments`. A criação das tabelas, chaves estrangeiras e índices depende do schema SQL/migrations, ainda não fornecidos.

## Cobertura de testes e melhorias futuras

As suítes fornecidas já verificam autenticação, posts e comentários, inclusive autorização por autoria e respostas `400`, `401`, `403` e `404`. Ainda é recomendável acrescentar testes específicos para cadastro de estudantes, criação de professores por administradores, gerenciamento de professores/estudantes, e-mails duplicados, exclusão com conteúdo associado (`409`) e expiração de JWT. A existência desses testes adicionais não foi confirmada.

## Integração com o `blog_mobile`

O aplicativo mobile utiliza a API para autenticação, posts, comentários e gerenciamento de usuários. A URL-base de desenvolvimento padrão é `http://localhost:3333/api/v1` **quando o cliente HTTP roda na mesma máquina do servidor**. Em emuladores ou dispositivos físicos, `localhost` pode apontar para o próprio dispositivo; ajuste a URL conforme o ambiente de execução.

A interface pode ocultar funcionalidades por papel, mas **a autorização definitiva deve permanecer no backend**.

## Segurança e implantação

- Use HTTPS em produção e mantenha o segredo JWT fora do repositório.
- Não publique `.env` com credenciais.
- Restrinja CORS às origens necessárias no ambiente de produção, quando aplicável.
- Valide entradas e mantenha verificações de autoria no servidor.
- Não retorne senhas ou hashes de senha em respostas HTTP.
- Configure um processo de implantação que execute o build e garanta a presença das dependências de runtime.
- Considere logs estruturados e tratamento centralizado de erros para produção.

## Referência de validações Zod

| Operação | Campo | Regra |
| --- | --- | --- |
| Cadastro de estudante/professor | `name` | Obrigatório, `trim()`, 2–120 caracteres |
| Cadastro de estudante/professor | `email` | Obrigatório, `trim()`, formato de e-mail, até 255 caracteres; armazenado em minúsculas |
| Cadastro de estudante/professor | `password` | Obrigatório, 8–72 caracteres |
| Login | `email` | Obrigatório, formato de e-mail, até 255 caracteres |
| Login | `password` | Obrigatório, 1–72 caracteres |
| Criar/atualizar post | `title` | Obrigatório, `trim()`, 3–255 caracteres |
| Criar/atualizar post | `content` | Obrigatório, `trim()`, mínimo de 10 caracteres |
| Criar/atualizar comentário | `content` | Obrigatório, `trim()`, mínimo de 1 caractere |
| Atualizar professor/estudante | `name` | Opcional, `trim()`, 2–120 caracteres |
| Atualizar professor/estudante | `email` | Opcional, `trim()`, e-mail válido, até 255 caracteres, convertido para minúsculas |
| Atualizar professor/estudante | Corpo JSON | Pelo menos um entre `name` e `email`; propriedades extras rejeitadas |
| IDs de comentários, posts associados e usuários gerenciados | Parâmetro de rota | Convertido para número inteiro positivo |
| ID do post | `:id` | Apenas dígitos decimais, sem zero à esquerda, valor positivo |

As regras acima foram verificadas nos validadores e no controller de autenticação fornecidos. Não há limite máximo explícito para o texto de posts ou comentários nesses validadores.

## Informações pendentes de confirmação

- [x] Variáveis de ambiente MySQL e padrões de conexão.
- [x] Nomes e validações das variáveis de JWT (`config/jwt.ts`).
- [ ] Estrutura e inicialização do banco de dados.
- [x] Contratos principais de autenticação, posts, comentários e gerenciamento de usuários.
- [x] Limites detalhados dos validadores de posts, comentários e atualização de usuários.
- [x] Confirmação das verificações de autoria em posts e comentários.
- [x] Funcionamento de `authenticate` e `requireRole` confirmado pelo middleware.
- [x] Configuração de compilação (`tsconfig.json`) e saída em `dist/` documentadas.
- [x] Utilitário manual de geração de tokens de teste documentado.
- [x] Estrutura e suítes de testes de integração documentadas.
- [ ] Configurar `npm test` e confirmar a configuração efetiva do Jest.
- [x] Conferir a implementação de `post-fixture.cjs`.
- [ ] Ajuste de `dotenv` para ambientes com instalação apenas de dependências de produção.

---

**Projeto:** `blog-api` · **Versão declarada:** `1.0.0` · **Licença declarada:** ISC.
