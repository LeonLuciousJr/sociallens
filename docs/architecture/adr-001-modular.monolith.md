#### ADR-001: Use a Modular Monolith with a Three-Tier Client-Server Architecture

**Status:** Accepted

##### Context

*SocialLens* is a one-semester course project. A team of two will build it incrementally. The project already uses React, Django, PostgreSQL.

We need an architecture that is easy to build. It should support incremental development throughout the course. It should also avoid unnecessary complexity. It is not expected to be maintained after this semester. However, for best practice, it should allow the system to grow in the future if needed.

##### Decision

*SocialLens* will use a **three-tier client-server architecture**.

- **Presentation tier:** A React single-page application.
- **Logic tier:** A single Django server organized as a **modular monolith** with three layers:
    - Views/controllers
    - Services
    - Repositories
- **Data tier:** A PostgreSQL database accessed by the Django application through the Repository layer using the Django ORM.

The React client and Django server can be deployed separately. However, the server remains a single application.

##### Alternatives Considered

**Microservices**

- Rejected because they add unnecessary complexity.
- They slow down development.
- Their scalability benefits are not needed for a project of this size.

**Server-rendered Monolith**

- Rejected because the server would generate the web pages.
- A client-server architecture would give our team clearer boundaries so we can more easily work in parallel
- A React frontend can reduce repeated full-page reloads and provide more responsive interactions given we expect frequent user input.

**Pipe-and-Filter or Event-Driven Architecture**

- Rejected as the main architecture.
- *SocialLens* mainly handles user requests and server responses.
- It is not a data-processing pipeline.

##### Consequences

**Positive**

- Supports fast and incremental development.
- Keeps the code organized and easier to maintain.
- Makes it easier to separate features, such as search or notifications, into their own services if the project grows.

**Negative**

- The Django server is a single deployment.
- If the server crashes, all API features become unavailable.
- This is an acceptable trade-off for this project.
- We can revisit this decision if the system later requires higher availability.