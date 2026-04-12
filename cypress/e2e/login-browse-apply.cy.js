describe("Lakshya End-to-End User Flow", () => {
  it("logs in, searches Cloud Engineer, opens details, analyzes, and applies", () => {
    const email = "cr7@gmail.com";
    const password = "cr7sujal";
    const jobKeyword = "Cloud Engineer";

    // 1. Login
    cy.visit("http://localhost:5173/login");

    cy.get('input[type="email"]').first().should("be.visible").clear().type(email);
    cy.get('input[type="password"]').first().should("be.visible").clear().type(password);

    cy.contains(/^login$/i).click();
    cy.url().should("not.include", "/login");

    // 2. Browse jobs
    cy.visit("http://localhost:5173/job-seeker/browse-jobs");

    // 3. Search job
    cy.get('input[placeholder*="Find"], input[placeholder*="Search"], input[type="text"]')
      .first()
      .should("be.visible")
      .clear()
      .type(jobKeyword);

    // click search button if present
    cy.get("body").then(($body) => {
      if ($body.text().match(/search|find jobs|apply filter/i)) {
        cy.contains(/search|find jobs|apply filter/i).first().click({ force: true });
      }
    });

    // 4. Confirm searched title is visible in results
    cy.contains(new RegExp(jobKeyword, "i"), { timeout: 10000 }).should("be.visible");

    // 5. Click first visible View Details from filtered results
    cy.contains(/view details/i, { timeout: 10000 })
      .should("be.visible")
      .first()
      .click({ force: true });

    // 6. Confirm correct job detail page opened
    cy.contains(new RegExp(jobKeyword, "i"), { timeout: 10000 }).should("be.visible");

    // 7. Click Analyze if present
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const text = $body.text();

      if (/analy[sz]e/i.test(text)) {
        cy.contains(/analy[sz]e/i).first().click({ force: true });
      }
    });

    // 8. Handle analysis modal / continue buttons
    cy.get("body", { timeout: 20000 }).then(($body) => {
      const text = $body.text();

      if (/resume analysis required/i.test(text)) {
        cy.contains(/resume analysis required/i).should("be.visible");
      }

      if (/continue anyway/i.test(text)) {
        cy.contains(/continue anyway/i).click({ force: true });
      } else if (/continue/i.test(text)) {
        cy.contains(/^continue$/i).click({ force: true });
      }
    });

    // 9. Final submit/apply
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const text = $body.text();

      if (/submit application/i.test(text)) {
        cy.contains(/submit application/i).click({ force: true });
      } else if (/apply now/i.test(text)) {
        cy.contains(/apply now/i).first().click({ force: true });
      } else if (/apply/i.test(text)) {
        cy.contains(/^apply$/i).first().click({ force: true });
      }
    });

    // 10. Success check
    cy.contains(/application submitted successfully|applied successfully|already applied/i, {
      timeout: 15000,
    }).should("be.visible");
  });
});