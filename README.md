# 🍹 Juice Shop E2E Tests

Este repositório contém testes End-to-End (E2E) desenvolvidos com **Cypress** para a aplicação **OWASP Juice Shop**.

## 📋 Pré-requisitos

Antes de executar os testes, é necessário ter instalado:

- Node.js (versão 18 ou superior recomendada)
- npm
- Docker Desktop

---

# 🚀 Executando o OWASP Juice Shop

Os testes foram desenvolvidos para serem executados contra uma instância local do Juice Shop utilizando Docker.

## 1. Instale o Docker

Caso ainda não possua, faça o download e instale:

https://www.docker.com/products/docker-desktop/

---

## 2. Baixe a imagem do Juice Shop

```bash
docker pull bkimminich/juice-shop
```

---

## 3. Execute o container

```bash
docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```

---

## 4. Acesse a aplicação

Abra o navegador em:

```
http://localhost:3000
```

> **Observação**
>
> Caso esteja utilizando **docker-machine** (macOS ou Windows), utilize:
>
> ```
> http://192.168.99.100:3000
> ```

---

# 🧪 Executando os testes

Após iniciar o Juice Shop, abra outro terminal na pasta deste projeto.
abra a pasta de teste e execute:

## Instale as dependências

```bash
npm install
```

---

## Execute o Cypress

```bash
npm run test:open
```

O Cypress será aberto e permitirá executar os testes disponíveis na interface gráfica.

---

# 📂 Estrutura do projeto

```
.
├── cypress
│   ├── e2e
│   ├── fixtures
│   └── support
├── package.json
├── cypress.config.js
└── README.md
```

---

# ✅ Fluxo de execução

1. Inicie o Docker.
2. Execute o container do Juice Shop.
3. Verifique se a aplicação está disponível em `http://localhost:3000`.
4. Execute:

```bash
npm install
```

5. Abra o Cypress:

```bash
npm run test:open
```

6. Selecione o teste desejado para execução.

---

# 🛠 Tecnologias utilizadas

- Cypress
- JavaScript
- Node.js
- Docker
- OWASP Juice Shop

---

# 📌 Observações

- Os testes assumem que o Juice Shop está sendo executado localmente na porta **3000**.
- Caso altere a porta da aplicação, será necessário atualizar a configuração (`baseUrl`) do Cypress.