// cypress/e2e/01_acesso_listagem_cadastro.cy.js
// ETAPA 1 — Acesso às páginas, listagem e inserção de registros
//
// REVISADO: os seletores foram conferidos diretamente no código-fonte atual
// do frontend (Angular) do juice-shop/juice-shop no GitHub, pois a versão
// instalada não batia mais com os seletores antigos. Principais mudanças:
//
//  - O card de produto não usa mais <mat-card-title>; o nome agora fica em
//    uma <div class="name"> dentro de <section>. Trocamos o teste por essa div.
//  - O campo de busca (#searchQuery) é o componente <app-mat-search-bar>; o
//    <input> interno NÃO tem mais name="searchQuery" nem id próprio. Por isso
//    buscamos o input dentro do wrapper: '#searchQuery input[type="text"]'.
//  - O dialog de review/avaliação não tem mais o aria-label "Submit a review";
//    agora o botão tem aria-label="Send the review" e id="submitButton", e o
//    textarea tem aria-label="Text field to review a product".

import testData from '../fixtures/testData.json'
const { testUser } = testData

const closeBanner = () => {
  cy.wait(1000)
  cy.get('body').then(($body) => {
    // Banner de boas-vindas (Welcome Banner) — botão com aria-label fixo
    if ($body.find('button[aria-label="Close Welcome Banner"]').length > 0) {
      cy.get('button[aria-label="Close Welcome Banner"]').click({ force: true })
    } else if ($body.find('button:contains("Dismiss")').length > 0) {
      cy.contains('button', 'Dismiss').click({ force: true })
    }
  })
  cy.wait(500)
  cy.get('body').then(($body) => {
    // Banner de cookies (cookieconsent lib) — classe fixa .cc-btn
    if ($body.find('.cc-btn').length > 0) {
      cy.get('.cc-btn').last().click({ force: true })
    }
  })
  cy.wait(300)
}

// ============================================================
describe('Etapa 1 — Acesso e Listagem de Páginas', () => {
  beforeEach(() => {
    cy.visit('/')
    closeBanner()
  })

  it('deve carregar a página inicial com produtos listados', () => {
    cy.get('mat-card').should('have.length.greaterThan', 0)
    cy.get('mat-toolbar').should('be.visible')
  })

  it('deve exibir nome dos produtos na listagem', () => {
    // FIX: produto não usa mais mat-card-title; nome fica em div.name
    cy.get('mat-card').first().within(() => {
      cy.get('div.name').should('not.be.empty')
    })
  })

  it('deve buscar produtos pelo campo de pesquisa', () => {
    // FIX: clicar no ícone para abrir a busca, depois localizar o input
    // dentro do wrapper #searchQuery (o input não tem mais name/id próprio)
    cy.get('#searchQuery').click()
    cy.get('#searchQuery input[type="text"]').should('be.visible').type('apple{enter}')
    cy.url().should('include', 'search')
    cy.get('mat-card').should('have.length.greaterThan', 0)
  })

  it('deve abrir o detalhe do produto ao clicar no card', () => {
    cy.get('mat-card').first().click()
    cy.get('mat-dialog-container').should('be.visible')
    cy.get('button[aria-label="Close Dialog"]').click({ force: true })
  })

  it('deve navegar para a página de login', () => {
    cy.visit('/#/login')
    cy.url().should('include', '/login')
    cy.get('#email').should('be.visible')
    cy.get('#password').should('be.visible')
  })

  it('deve navegar para a página de registro', () => {
    cy.visit('/#/register')
    cy.url().should('include', '/register')
    cy.get('#emailControl').should('be.visible')
  })
})

// ============================================================
describe('Etapa 1 — Inserção: Login e Adição ao Carrinho', () => {
  beforeEach(() => {
    cy.request({
      method: 'POST', url: '/api/Users/',
      body: {
        email: testUser.email, password: testUser.password,
        passwordRepeat: testUser.password,
        securityQuestion: { id: 1 }, securityAnswer: testUser.securityAnswer,
      },
      failOnStatusCode: false,
    })
    cy.visit('/#/login')
    closeBanner()
    cy.get('#email').type(testUser.email)
    cy.get('#password').type(testUser.password)
    cy.get('#loginButton').click()
    cy.url().should('not.include', '/login')
  })

  it('deve confirmar que está logado', () => {
    cy.get('#navbarAccount').should('be.visible')
  })

  it('deve adicionar produto ao carrinho', () => {
    cy.visit('/')
    cy.get('button[aria-label^="Add to Basket"]').first().click({ force: true })
    cy.get('.mat-mdc-snack-bar-container, mat-snack-bar-container, snack-bar-container')
      .should('be.visible')
  })

  it('deve visualizar itens no carrinho após adição', () => {
    cy.visit('/')
    cy.get('button[aria-label^="Add to Basket"]').first().click({ force: true })
    cy.wait(1000)
    cy.get('[aria-label="Show the shopping cart"]').click()
    cy.url().should('include', '/basket')
    cy.get('mat-table').should('exist')
  })

  
})

// ============================================================
describe('Etapa 1 — Inserção: Avaliação de Produto', () => {
  beforeEach(() => {
    cy.request({
      method: 'POST', url: '/api/Users/',
      body: {
        email: testUser.email, password: testUser.password,
        passwordRepeat: testUser.password,
        securityQuestion: { id: 1 }, securityAnswer: testUser.securityAnswer,
      },
      failOnStatusCode: false,
    })
    cy.visit('/#/login')
    closeBanner()
    cy.get('#email').type(testUser.email)
    cy.get('#password').type(testUser.password)
    cy.get('#loginButton').click()
    cy.url().should('not.include', '/login')
  })

  it('deve enviar avaliação em um produto', () => {
    cy.visit('/')
    cy.get('mat-card').first().click()
    cy.get('mat-dialog-container').should('be.visible')

    cy.contains('mat-expansion-panel-header', 'Reviews').click({ force: true })
    cy.wait(500)

    // FIX: o textarea de nova avaliação tem aria-label próprio e estável
    cy.get('textarea[aria-label="Text field to review a product"]')
      .click({ force: true })
      .type('Produto excelente! Teste automatizado.', { force: true })

    // FIX: o botão de envio agora tem aria-label="Send the review" (não mais
    // "Submit a review") e também id="submitButton" dentro do dialog
    cy.get('button[aria-label="Send the review"]').click({ force: true })

    cy.get('.mat-mdc-snack-bar-container, snack-bar-container, mat-snack-bar-container')
      .should('be.visible')
  })
})
