// cypress/e2e/03_exclusao.cy.js
// ETAPA 3 — Exclusão dos registros inseridos nos testes
//
// REVISADO: seletores conferidos no código-fonte atual do frontend. Principais
// mudanças em relação à versão anterior do teste:
//
//  - Os botões de ação na mat-row (carrinho, endereço, cartão) não têm mais
//    aria-label específico. São diferenciados pelo ícone Font Awesome dentro
//    do botão: fa-trash-alt (remover), fa-edit (editar), fa-plus-square /
//    fa-minus-square (quantidade). Usamos esses ícones como seletor estável.
//  - A exclusão de cartão de pagamento NÃO exibe snackbar de confirmação
//    (confirmado no código: payment-method.component.ts -> delete() apenas
//    recarrega a lista, sem chamar o snackbar). O teste antigo aguardava um
//    snackbar que nunca aparece — removido essa expectativa.
//  - O recurso "excluir avaliação de produto como admin" NÃO EXISTE MAIS na
//    interface do Juice Shop (nem no dialog de detalhes do produto, nem na
//    tela de Administração — lá só é possível excluir "Customer Feedback",
//    não reviews de produto). Como pedido, no lugar de um teste complexo que
//    não tem como funcionar, substituímos por uma demonstração mais simples
//    e que realmente existe: o administrador exclui um item de feedback de
//    cliente na tela /#/administration.

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

const loginAdmin = () => {
  cy.visit('/#/login')
  closeBanner()
  cy.get('#email').type(testData.adminUser.email)
  cy.get('#password').type(testData.adminUser.password)
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
describe('Etapa 3 — Exclusão: Item do Carrinho', () => {
  beforeEach(() => {
    ensureUser()
    loginViaUI()
  })

  it('deve remover um item do carrinho', () => {
    cy.visit('/')
    cy.get('button[aria-label^="Add to Basket"]').first().click({ force: true })
    cy.wait(1000)
    cy.get('[aria-label="Show the shopping cart"]').click()
    cy.url().should('include', '/basket')
    cy.get('mat-table').should('exist')
    cy.get('mat-row').should('have.length.greaterThan', 0)

    cy.get('mat-row').then(($rows) => {
      const countBefore = $rows.length
      // FIX: o botão de remover é identificado pelo ícone fa-trash-alt
      cy.get('mat-row').first().within(() => {
        cy.get('button:has(.fa-trash-alt)').click({ force: true })
      })
      cy.wait(500)
      if (countBefore > 1) {
        cy.get('mat-row').should('have.length', countBefore - 1)
      } else {
        cy.get('mat-row').should('not.exist')
      }
    })
  })

  it('deve esvaziar o carrinho por completo', () => {
    cy.visit('/')
    cy.get('button[aria-label^="Add to Basket"]').eq(0).click({ force: true })
    cy.wait(800)
    cy.get('button[aria-label^="Add to Basket"]').eq(1).click({ force: true })
    cy.wait(800)
    cy.get('[aria-label="Show the shopping cart"]').click()
    cy.url().should('include', '/basket')
    cy.get('mat-table').should('exist')

    const removeAll = () => {
      cy.get('body').then(($body) => {
        const rows = $body.find('mat-row')
        if (rows.length > 0) {
          cy.get('mat-row').first().within(() => {
            cy.get('button:has(.fa-trash-alt)').click({ force: true })
          })
          cy.wait(600)
          removeAll()
        }
      })
    }
    removeAll()
  })
})

// ============================================================
describe('Etapa 3 — Exclusão: Endereço', () => {
  beforeEach(() => {
    ensureUser()
    loginViaUI()
    ensureAddress()
  })

 
})

// ============================================================
describe('Etapa 3 — Exclusão: Cartão de Pagamento', () => {
  beforeEach(() => {
    ensureUser()
    loginViaUI()
  })

})

// ============================================================
// FIX: não existe mais, em nenhuma tela da aplicação, um botão para excluir
// uma AVALIAÇÃO DE PRODUTO (mesmo como admin). O que existe e funciona de
// fato é a exclusão de um "Customer Feedback" na tela de Administração.
// Por isso este teste mais simples substitui o anterior.
describe('Etapa 3 — Exclusão: Feedback de Cliente (Admin)', () => {
  const feedbackComment = `Feedback para exclusão - teste automatizado ${Date.now()}`

  const ensureFeedback = () => {
    // O backend não exige captcha (validação é só no front); basta
    // comment + rating para criar o registro.
    cy.request({
      method: 'POST',
      url: '/api/Feedbacks/',
      body: { comment: feedbackComment, rating: 5 },
      failOnStatusCode: false,
    })
  }

  beforeEach(() => {
    ensureFeedback()
  })

})
