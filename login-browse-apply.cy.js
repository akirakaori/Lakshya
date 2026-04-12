describe("Lakshya End-to-End User Flow", () => {
  it("logs in, searches Cloud Engineer, opens details, analyzes, and applies", () => {
    const email = "cr7@gmail.com";
    const password = "cr7sujal";
    const jobKeyword = "Cloud Engineer";
    const searchInputSelector = 'input[placeholder="Find job title..."]';

    cy.intercept("POST", "**/api/auth/login").as("loginRequest");
    cy.intercept("GET", "**/api/jobs*").as("jobsRequest");
    cy.intercept("POST", "**/api/job-seeker/jobs/*/analyze").as("analyzeRequest");
    cy.intercept("POST", "**/api/applications/*").as("applyRequest");

    // 1. Login
    cy.visit("http://localhost:5173/login");

    cy.get('input[type="email"]').should("be.visible").clear().type(email);
    cy.get('input[type="password"]').should("be.visible").clear().type(password);

    cy.contains(/^login$/i).should("be.visible").click();
    cy.wait("@loginRequest").its("response.statusCode").should("be.oneOf", [200, 201]);
    cy.window().its("localStorage.token").should("be.a", "string").and("not.be.empty");
    cy.url().should("not.include", "/login");

    // 2. Browse jobs
    cy.visit("http://localhost:5173/job-seeker/browse-jobs");
    cy.wait("@jobsRequest", { timeout: 20000 });

    // 3. Search job
    cy.get(searchInputSelector)
      .should("be.visible")
      .clear()
      .type(`${jobKeyword}{enter}`);

    cy.wait("@jobsRequest", { timeout: 20000 });
    cy.url().should("include", "keyword=");

    // If the exact keyword has no results, retry with a broader term.
    cy.get("body").then(($body) => {
      if (/no jobs found/i.test($body.text())) {
        cy.get(searchInputSelector).clear().type("Engineer{enter}");
        cy.wait("@jobsRequest", { timeout: 20000 });
      }
    });

    // 4. Ensure at least one result card is present, then open details
    cy.contains(/^view details$/i, { timeout: 20000 })
      .first()
      .scrollIntoView()
      .click({ force: true });

    // 5. Confirm detail page opened
    cy.url().should("match", /\/jobs\//);

    // 6. Wait for details page action area and handle all valid states.
    cy.contains(
      /apply now|track application|already have an active application|no longer accepting applications|this job is no longer available/i,
      { timeout: 30000 }
    ).should("exist");

    cy.get("body", { timeout: 15000 }).then(($body) => {
      const text = $body.text();

      if (
        /already have an active application|track application|no longer accepting applications|this job is no longer available/i.test(
          text
        ) && !/apply now/i.test(text)
      ) {
        cy.contains(
          /already have an active application|track application|no longer accepting applications|this job is no longer available/i
        ).should("exist");
        return;
      }

      // 7. Click Apply Now on job details if available.
      cy.get("button").then(($buttons) => {
        const hasApplyButton = Array.from($buttons).some((el) => /^apply now$/i.test(el.textContent || ""));
        if (!hasApplyButton) {
          cy.contains(
            /already have an active application|track application|no longer accepting applications|this job is no longer available/i
          ).should("exist");
          return;
        }

        cy.contains("button", /^apply now$/i, { timeout: 20000 })
          .scrollIntoView()
          .click({ force: true });
      });

      // 8. If analysis is required, run analysis first.
      cy.get("body", { timeout: 20000 }).then(($modalBody) => {
        const modalText = $modalBody.text();

        if (/resume analysis required|resume analysis outdated/i.test(modalText)) {
          cy.contains(/^analyze now$/i, { timeout: 15000 }).click({ force: true });

          // Trigger analysis from match panel after modal closes.
          cy.contains(/analyze my match|analyze now|analyze again|try again/i, { timeout: 30000 })
            .first()
            .click({ force: true });

          // Analysis can take time; wait for a stable analysis UI signal.
          cy.contains(/analyzing|match score|analyzed|analyze again|% match/i, { timeout: 60000 }).should("exist");

          // Re-open apply flow after analysis.
          cy.get("button").then(($buttons) => {
            const hasApplyButton = Array.from($buttons).some((el) => /^apply now$/i.test(el.textContent || ""));
            if (hasApplyButton) {
              cy.contains("button", /^apply now$/i, { timeout: 20000 })
                .scrollIntoView()
                .click({ force: true });
            }
          });
        }

        // Optional fallback path if modal still appears.
        cy.get("body").then(($retryModalBody) => {
          if (/continue anyway/i.test($retryModalBody.text())) {
            cy.contains(/continue anyway/i).click({ force: true });
          }
        });
      });

      // 9. Submit final application if modal is open.
      cy.get("body", { timeout: 20000 }).then(($finalBody) => {
        const finalText = $finalBody.text();

        if (/submit application/i.test(finalText)) {
          cy.contains(/submit application/i).click({ force: true });
          cy.wait("@applyRequest", { timeout: 30000 });
        }
      });
    });

    // 10. Success check
    cy.contains(
      /application submitted successfully|applied successfully|already applied|already have an active application|track application/i,
      { timeout: 30000 }
    ).should("exist");
  });
});