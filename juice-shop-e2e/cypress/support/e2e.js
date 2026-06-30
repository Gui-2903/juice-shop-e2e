// cypress/support/e2e.js

Cypress.Commands.add('loginAs', (email, password) => {
  cy.request('POST', '/rest/user/login', { email, password }).then((resp) => {
    window.localStorage.setItem('token', resp.body.authentication.token)
  })
})

Cypress.Commands.add('registerUser', (email, password) => {
  cy.request({
    method: 'POST',
    url: '/api/Users/',
    body: {
      email,
      password,
      passwordRepeat: password,
      securityQuestion: { id: 1 },
      securityAnswer: 'resposta',
    },
    failOnStatusCode: false,
  })
})

/**
 * Fecha o banner de boas-vindas e o cookie banner do Juice Shop v20
 * Tenta múltiplos seletores para garantir compatibilidade
 */
Cypress.Commands.add('dismissWelcomeBanner', () => {
  cy.wait(1500)

  cy.get('body').then(($body) => {
    // Botão "Dismiss" do welcome banner (Juice Shop v20 usa texto "Dismiss")
    if ($body.find('button:contains("Dismiss")').length > 0) {
      cy.contains('button', 'Dismiss').click({ force: true })
      cy.wait(500)
    }

    // Fallback: botão com mat-icon "close" dentro de um dialog
    if ($body.find('mat-dialog-container').length > 0) {
      cy.get('mat-dialog-container')
        .find('button')
        .last()
        .click({ force: true })
      cy.wait(500)
    }
  })

  // Cookie consent — botão "Me want it!"
  cy.get('body').then(($body) => {
    if ($body.find('.cc-btn').length > 0) {
      cy.get('.cc-btn').last().click({ force: true })
      cy.wait(300)
    }
  })
})

// Ignora erros JS do Juice Shop (ele é intencionalmente bugado)
Cypress.on('uncaught:exception', () => false)
