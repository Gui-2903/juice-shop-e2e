// cypress/e2e/02_edicao.cy.js
// ETAPA 2 — Edição de registros existentes
//
// REVISADO: seletores conferidos no código-fonte atual do frontend. Principais
// mudanças em relação à versão anterior do teste:
//
//  - A tela de edição de "username" (/#/profile) NÃO EXISTE MAIS nesta versão
//    do Juice Shop (não há mais essa rota no app.routing.ts). Substituímos por
//    um teste de edição que realmente existe: "Trocar senha"
//    (/#/privacy-security/change-password).
//  - Na linha do carrinho, a quantidade NÃO é mais um <input>; é um <span>
//    de texto. Os botões de "+" e "-" não têm aria-label e são distinguidos
//    pelo ícone (fa-plus-square / fa-minus-square). Reescrevemos os testes
//    de quantidade lendo o texto do span em vez de invoke('val').
//  - No endereço, o botão de editar é identificado pelo ícone fa-edit (não
//    havia aria-label "Edit") e o botão de salvar mudou de
//    [aria-label="Apply address changes."] para #submitButton.
//  - No cartão de pagamento, os campos não têm mais placeholder algum; agora
//    são localizados pelo texto do <mat-label> do mat-form-field. Mês/Ano
//    viraram <select> nativos, não mais inputs de texto.

import testData from '../fixtures/testData.json'
const { testUser, newAddress } = testData

const closeBanner = () => {
  cy.wait(1000)
  cy.get('body').then(($body) => {
    if ($body.find('button[aria-label="Close Welcome Banner"]').length > 0) {
      cy.get('button[aria-label="Close Welcome Banner"]').click({ force: true })
    } else if ($body.find('button:contains("Dismiss")').length > 0) {
      cy.contains('button', 'Dismiss').click({ force: true })
    }
  })
  cy.wait(500)
  cy.get('body').then(($body) => {
    if ($body.find('.cc-btn').length > 0) {
      cy.get('.cc-btn').last().click({ force: true })
    }
  })
  cy.wait(300)
}

const loginViaUI = () => {
  cy.visit('/#/login')
  closeBanner()
  cy.get('#email').type(testUser.email)
  cy.get('#password').type(testUser.password)
  cy.get('#loginButton').click()
  cy.url().should('not.include', '/login')
}

const ensureUser = () => {
  cy.request({
    method: 'POST', url: '/api/Users/',
    body: {
      email: testUser.email, password: testUser.password,
      passwordRepeat: testUser.password,
      securityQuestion: { id: 1 }, securityAnswer: testUser.securityAnswer,
    },
    failOnStatusCode: false,
  })
}

const ensureAddress = () => {
  cy.request({
    method: 'GET', url: '/api/Addresss/',
    headers: { Authorization: `Bearer ${window.localStorage.getItem('token')}` },
    failOnStatusCode: false,
  }).then((resp) => {
    if (!resp.body.data || resp.body.data.length === 0) {
      cy.request({
        method: 'POST', url: '/api/Addresss/',
        headers: { Authorization: `Bearer ${window.localStorage.getItem('token')}` },
        body: {
          country: newAddress.country,
          fullName: newAddress.fullName,
          mobileNum: 1199999999,
          zipCode: '01310100',
          streetAddress: newAddress.address,
          city: newAddress.city,
          state: newAddress.state,
        },
        failOnStatusCode: false,
      })
    }
  })
}

// ============================================================
// FIX: a antiga tela de "Perfil"/edição de username (/#/profile) foi removida
// desta versão do Juice Shop. No lugar, testamos a edição que de fato existe:
// troca de senha do usuário.
describe('Etapa 2 — Edição: Troca de Senha', () => {
  beforeEach(() => {
    ensureUser()
    loginViaUI()
  })

  it('deve acessar a página de troca de senha', () => {
    cy.visit('/#/privacy-security/change-password')
    cy.get('#currentPassword').should('be.visible')
    cy.get('#newPassword').should('be.visible')
  })

  it('deve trocar a senha do usuário com sucesso', () => {
    const novaSenha = 'NovaSenha123!'
    cy.visit('/#/privacy-security/change-password')
    cy.get('#currentPassword').type(testUser.password)
    cy.get('#newPassword').type(novaSenha)
    cy.get('#newPasswordRepeat').type(novaSenha)
    cy.get('#changeButton').click()
    // A tela exibe uma mensagem de confirmação de senha alterada
    cy.contains('.confirmation', /./).should('be.visible')
  })
})

// ============================================================
describe('Etapa 2 — Edição: Endereço de Entrega', () => {
  beforeEach(() => {
    ensureUser()
    loginViaUI()
    ensureAddress()
  })

  it('deve listar os endereços cadastrados', () => {
    cy.visit('/#/address/select')
    cy.get('mat-row').should('have.length.greaterThan', 0)
  })

  it('deve editar o endereço existente', () => {
    cy.visit('/#/address/select')
    cy.get('mat-row').should('have.length.greaterThan', 0)
    // FIX: o botão de editar é identificado pelo ícone fa-edit (não há
    // aria-label "Edit" no DOM atual)
    cy.get('mat-row').first().within(() => {
      cy.get('button:has(.fa-edit)').click({ force: true })
    })
    cy.url().should('include', '/address/edit')
    cy.get('input[placeholder="Please provide a city."]').clear().type('Rio de Janeiro')
    // FIX: botão de salvar agora é #submitButton (mesmo form do cadastro)
    cy.get('#submitButton').click()
    cy.url().should('include', '/address/select')
  })
})

// ============================================================
describe('Etapa 2 — Edição: Quantidade no Carrinho', () => {
  beforeEach(() => {
    ensureUser()
    loginViaUI()
  })

  const addProductAndGoToBasket = () => {
    cy.visit('/')
    cy.get('button[aria-label^="Add to Basket"]').first().click({ force: true })
    cy.wait(1000)
    cy.get('[aria-label="Show the shopping cart"]').click()
    cy.url().should('include', '/basket')
    cy.get('mat-table').should('exist')
    cy.get('mat-row').should('have.length.greaterThan', 0)
  }

  it('deve aumentar a quantidade de um produto no carrinho', () => {
    addProductAndGoToBasket()

    // FIX: a quantidade não é mais um <input>, é um <span class="cell-initial-font">
    cy.get('mat-row').first().find('span.cell-initial-font').invoke('text').then((textBefore) => {
      const before = parseInt(textBefore.trim())

      cy.get('mat-row').first().within(() => {
        cy.get('button:has(.fa-plus-square)').click({ force: true })
      })
      cy.wait(500)

      cy.get('mat-row').first().find('span.cell-initial-font').invoke('text').should((textAfter) => {
        expect(parseInt(textAfter.trim())).to.be.greaterThan(before)
      })
    })
  })

  it('deve diminuir a quantidade de um produto no carrinho', () => {
    addProductAndGoToBasket()

    // Incrementa primeiro para garantir que dá pra decrementar com segurança
    cy.get('mat-row').first().within(() => {
      cy.get('button:has(.fa-plus-square)').click({ force: true })
    })
    cy.wait(500)

    cy.get('mat-row').first().find('span.cell-initial-font').invoke('text').then((textAfterInc) => {
      const afterInc = parseInt(textAfterInc.trim())

      cy.get('mat-row').first().within(() => {
        cy.get('button:has(.fa-minus-square)').click({ force: true })
      })
      cy.wait(500)

      cy.get('mat-row').first().find('span.cell-initial-font').invoke('text').should((textAfterDec) => {
        const afterDec = parseInt(textAfterDec.trim())
        expect(afterDec).to.be.lessThan(afterInc)
        expect(afterDec).to.be.at.least(1)
      })
    })
  })
})

// ============================================================
describe('Etapa 2 — Edição: Cartão de Pagamento', () => {
  beforeEach(() => {
    ensureUser()
    loginViaUI()
  })

  it('deve adicionar novo cartão de pagamento', () => {
    cy.intercept('GET', '/api/Cards').as('getCards')
    cy.visit('/#/payment/shop')
    cy.wait('@getCards')

    cy.get('mat-expansion-panel').should('have.length.greaterThan', 0)
    cy.get('mat-expansion-panel').contains('Add new card').click()

    // FIX: não há mais placeholder nos campos; localizamos pelo texto do
    // mat-label dentro de cada mat-form-field. Mês/Ano agora são <select>.
    cy.contains('mat-form-field', 'Card Number').find('input')
      .should('be.visible').type('4111111111111111')
    cy.contains('mat-form-field', 'Expiry Month').find('select').select('12')
    cy.contains('mat-form-field', 'Expiry Year').find('select').select('2099')

    // FIX: o botão de envio não tem mais aria-label="Submit"; agora é #submitButton
    cy.get('#submitButton').click({ force: true })
    cy.get('.mat-mdc-snack-bar-container, snack-bar-container').should('be.visible')
  })
})
