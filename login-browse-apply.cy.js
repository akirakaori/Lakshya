describe('Lakshya User Flow', () => {

  it('Logs in, searches jobs, views details, and applies', () => {

    // 1. Visit Login Page
    cy.visit('http://localhost:5173/login');

    // 2. Enter Credentials
    cy.get('input[type="email"]').should('be.visible').type('aayu@gmail.com');
    cy.get('input[type="password"]').should('be.visible').type('aayu1234');

    // 3. Click Login Button
    cy.contains('button', /login/i).click();

    // 4. Verify Login Success (URL change)
    cy.url().should('not.include', '/login');

    // 5. Navigate to Browse Jobs
    cy.visit('http://localhost:5173/job-seeker/browse-jobs');

    // 6. Search for Job
    cy.get('input[placeholder*="Find"]')
      .should('be.visible')
      .clear()
      .type('full stack developer');

    // 7. Wait for search results
    cy.wait(1000); // optional (replace with intercept if API)

    // 8. Click "View Details" (first job)
    cy.contains('View Details')
      .should('be.visible')
      .first()
      .click();

    // 9. Verify Job Details Page Opened
    cy.url().should('include', '/jobs');

    // 10. Click Apply Button
    cy.contains('Apply')
      .should('be.visible')
      .click();

    // 11. Optional: Verify Application Success Message
    cy.contains(/applied|success/i).should('exist');

  });

});