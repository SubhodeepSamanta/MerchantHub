# MerchantHub: Complete Learning Guide

## Part 0: How to use this guide

### What is MerchantHub? (In 5 Sentences)
MerchantHub is an enterprise-grade fintech backend and merchant dashboard designed specifically for small Indian retail merchants (kirana stores, electronics shops, service providers) who accept customer payments via Unified Payments Interface (UPI). The platform bridges payment collection and working capital financing by offering Merchant Cash Advances (MCAs) underwritten directly by the merchant's historical transaction cash flows rather than traditional bank balance sheets or physical collateral. Payments processed through merchant-branded dynamic QR codes or checkout links are automatically settled into an internal wallet ledger tracked with a running balance. When an advance is active, the engine automatically intercepts every incoming gross settlement and routes a fixed 10% split deduction toward paying down the advance principal and factor fee until fully cleared. The system is engineered on Java 21 and Spring Boot 4.1.2 with Hibernate 7, PostgreSQL 16, and JWT security, emphasizing mathematical precision, transactional consistency, and idempotent payment processing.

---

### How a Human Senior Engineer Builds This Project from Scratch
When an interviewer asks: *"Walk me through how you designed and built MerchantHub file by file as an engineer,"* you must never say *"I generated 40 files at once."* A human senior software engineer follows a disciplined, step-by-step lifecycle:

```
[Phase 1: Domain & Schema Design]
   ├── Identify entities: Merchant, Wallet, LedgerEntry, Payment, CashAdvance
   └── Define constraints: composite unique (merchant_id, idempotency_key), versioning, immutable ledger
              │
              ▼
[Phase 2: Persistence Layer (Entities -> Repositories)]
   ├── Create JPA Entities with clean column mappings & BigDecimal scales
   └── Write Spring Data Repositories with custom JPQL aggregates & derived queries
              │
              ▼
[Phase 3: DTOs & Custom Exception Hierarchy]
   ├── Define immutable Java Records with jakarta.validation constraints
   └── Create domain exceptions & @RestControllerAdvice for consistent JSON errors
              │
              ▼
[Phase 4: Core Domain Services & Transaction Boundaries]
   ├── WalletService: balance mutations + atomic append-only ledger entries
   ├── PaymentService: idempotency checks, simulation rules, auto-repayment split
   └── CashAdvanceService: volume qualification, factor rate (1.05) math, disbursal
              │
              ▼
[Phase 5: Security & Ingress Pipeline]
   ├── JwtService (HS256 claims & verification)
   ├── JwtAuthenticationFilter (OncePerRequestFilter, SecurityContext population)
   └── SecurityConfig (stateless session, permitAll vs authenticated matching)
              │
              ▼
[Phase 6: Web Controllers & API Exposure]
   ├── REST Controllers exposing DTO-validated endpoints
   └── Public checkout & CORS configuration
              │
              ▼
[Phase 7: Seeders, Verification & Containerization]
   ├── DemoDataSeeder for 30-day transactional history
   ├── Unit tests mocking repository/service interactions
   └── Multi-stage Dockerfile (Node build -> Maven package -> JRE 21 runtime)
```

1. **Step 1: Domain Modeling & Database Schema Design**:
   - The first step is modeling the financial domain on paper or in a DB diagram. We need five core tables: `merchants` (store metadata and authentication), `wallets` (the current spendable balance with an optimistic locking `@Version` counter), `ledger_entries` (an append-only audit trail recording every credit and debit with a running `balance_after`), `payments` (customer transactions with a strict composite unique constraint on `merchant_id` and `idempotency_key`), and `cash_advances` (advance principal, factor rate, total repayable, and cumulative repayment status).
2. **Step 2: Persistence Layer (JPA Entities and Spring Data Repositories)**:
   - We write the entity classes first, choosing proper database types: `NUMERIC(12,2)` mapped to Java `BigDecimal` for currency, avoiding floating-point rounding errors.
   - We write the repositories extending `JpaRepository`, adding derived query methods (`findByMerchantId`, `findByMerchantIdAndStatus`) and custom JPQL queries with `COALESCE` for dashboard analytics.
3. **Step 3: DTOs (Data Transfer Objects) and Exception Hierarchy**:
   - To prevent exposing internal JPA entities to the outside world, we create immutable Java Records for every request and response payload (`CreatePaymentRequest`, `PaymentResponse`, `AuthResponse`).
   - We attach Jakarta Bean Validation annotations (`@NotBlank`, `@DecimalMin`, `@Positive`) to enforce request integrity at the controller boundary.
   - We construct a clean custom exception hierarchy (`ResourceNotFoundException`, `InsufficientBalanceException`, `BusinessRuleException`, `DuplicateEmailException`) and a centralized `@RestControllerAdvice` (`GlobalExceptionHandler`) to convert unhandled exceptions into uniform RFC 7807-style JSON error payloads.
4. **Step 4: Business Logic in Service Layer with Transaction Management**:
   - `WalletService` is created as the single authority over the wallet balance and ledger entries. It enforces that every balance change produces an immutable audit record in the same atomic database transaction.
   - `PaymentService` is built to handle payment lifecycle: idempotency verification, mock UPI payment routing, wallet credit, and checking for an active cash advance to perform an automated 10% repayment split.
   - `CashAdvanceService` encapsulates lending rules: calculating a 30-day trailing settlement volume, checking merchant qualification criteria, applying the 1.05 factor rate, and disbursing funds directly into the merchant's wallet.
5. **Step 5: Authentication & Security Pipeline**:
   - We implement `JwtService` using JJWT 0.12.6 to create and parse HMAC-SHA256 signed tokens.
   - We write `JwtAuthenticationFilter` extending `OncePerRequestFilter` to intercept HTTP requests, extract Bearer tokens, validate signatures, and populate Spring Security's `SecurityContextHolder`.
   - We configure `SecurityConfig` to establish a stateless security filter chain, opening public authentication and checkout endpoints while guarding merchant resources.
6. **Step 6: Controllers & Public API**:
   - We write `@RestController` classes that map HTTP verbs and paths, delegate to services, and return typed `ResponseEntity<T>` payloads with accurate HTTP status codes (200 OK, 201 Created, 400 Bad Request, 409 Conflict, etc.).
7. **Step 7: Testing, Seeding, and Dockerization**:
   - We write unit tests for critical business logic using JUnit 5 and Mockito.
   - We write a `DemoDataSeeder` with a `@Profile("demo")` condition to populate a realistic 30-day merchant trading history for live demonstrations.
   - Finally, we write a multi-stage `Dockerfile` to build the React frontend, package the Spring Boot backend into an executable fat JAR, and run it on an ultra-lightweight Eclipse Temurin 21 JRE image.

---

### Recommended Study Order
To prepare systematically for your technical interview at FreechargeBiz (Axis Bank), follow this exact progression:
1. **Master the Big Picture (Part 1)**: Understand the merchant cash advance domain, why UPI cash flow financing matters, the layered architecture, and the request lifecycle.
2. **Understand the Build & Runtime Stack (Part 2)**: Master `pom.xml`, Maven wrapper, fat JAR construction, `application.yml`, and how Spring Boot initializes.
3. **Internalize Every Backend File (Part 3)**: Walk through every Entity, Repository, DTO, Exception, Security, Config, Service, and Controller file line by line.
4. **Review Unit Tests & Test Strategies (Part 4)**: Understand how Mockito mocks dependencies, how argument matchers work, and identify testing anti-patterns.
5. **Trace End-to-End Financial Flows (Part 5)**: Follow the 11 end-to-end flows step-by-step from browser to database row and back.
6. **Understand Frontend & Deployment (Parts 6 & 7)**: Grasp the Vite + React architecture, SPA routing, multi-stage Docker build, and Neon PostgreSQL setup.
7. **Study the 10 Code Review Issues & Fixes (Part 8)**: This is your secret weapon. Being able to critique the codebase and explain real concurrency and transaction bugs proves senior-level engineering maturity.
8. **Learn the Core Concepts Deep Dive (Part 10)**: Ensure foundational mastery of IoC, proxies, `@Transactional` boundaries, `BigDecimal` scale, and optimistic locking.
9. **Practice the Interview Question Bank (Part 11)**: Drill the 50+ interview questions, elevator pitches, and core Java/DSA concepts.

---

### MERN to Spring Boot Mental Bridge
Coming from a Node.js / Express / MongoDB (MERN) background, Spring Boot can initially feel overwhelming because of its reliance on annotations, reflection, and inversion of control. This table maps concepts you already know in MERN directly to their Spring Boot equivalents:

| MERN Concept | Spring Boot Equivalent | Key Difference / Under the Hood Reality |
| :--- | :--- | :--- |
| `express()` server | `SpringApplication.run()` | Spring Boot starts an embedded Apache Tomcat web server on port 8080 and sets up an application context. |
| `app.use('/api', router)` | `@RestController` + `@RequestMapping` | In Express, you imperatively register callbacks on URL paths. In Spring, Spring MVC scans `@RestController` classes and registers request-mapping handlers via reflection. |
| `req.body` (JSON) | `@RequestBody Record record` | Express requires `express.json()` middleware. Spring Boot uses Jackson (`ObjectMapper`) to automatically deserialize incoming JSON into strongly typed Java objects or records. |
| Joi / Celebrate validation | Jakarta Bean Validation (`@Valid`, `@NotBlank`) | In Express, you write validation schemas. In Spring, you annotate DTO fields; the `@Valid` annotation triggers automatic validation and raises `MethodArgumentNotValidException` on failure. |
| Mongoose Schema & Model | JPA `@Entity` & `JpaRepository` | Mongoose maps JS objects to MongoDB BSON documents. JPA/Hibernate maps Java classes to relational SQL tables with strict schema, types, and foreign keys. |
| `db.collection.find()` | Spring Data Derived Queries (`findBy...`) | In Express/Mongoose, you write queries manually. In Spring Data JPA, interface method names like `findByMerchantIdAndStatus` are dynamically parsed into SQL queries at application startup. |
| `async / await` | Synchronous Thread-per-request | Node.js runs on a single-threaded event loop with non-blocking I/O. Traditional Spring Boot allocates a dedicated OS thread per incoming HTTP request from Tomcat's thread pool. |
| `dotenv` (`process.env`) | `application.yml` (`${VAR:default}`) | In Node, `dotenv` loads `.env` into `process.env`. Spring Boot binds YAML/properties files with environment variable overrides into its `Environment` abstraction. |
| Custom Express Middleware | `OncePerRequestFilter` / HandlerInterceptor | Express middleware is a chain of `(req, res, next) => {}`. Spring Security uses a chain of Servlet Filters (`SecurityFilterChain`) that intercept requests before they reach the Controller. |
| `jwt.sign()` / `jwt.verify()` | JJWT (`Jwts.builder()` / `Jwts.parser()`) | In Node, `jsonwebtoken` creates and verifies tokens. In Java, JJWT parses, validates cryptographic signatures, and extracts claims into strongly typed objects. |
| `try / catch` in routes | `@RestControllerAdvice` + `@ExceptionHandler` | In Express, you pass errors to `next(err)` to reach a global error middleware. In Spring, controllers throw unchecked exceptions, which bubble up to a centralized `@RestControllerAdvice` class. |
| Manual database updates | `@Transactional` & Hibernate Dirty Checking | In Mongoose, you explicitly call `doc.save()`. In Spring, managed entities inside an open `@Transactional` method are automatically monitored for changes and written to SQL at commit time. |

---

### Master Glossary of Architectural & Engineering Terms

| Term | Precise Technical Definition |
| :--- | :--- |
| **Spring Bean** | A Java object that is instantiated, assembled, configured, and managed entirely by the Spring Inversion of Control (IoC) container. |
| **Dependency Injection (DI)** | A design pattern implementing Inversion of Control where an object receives its dependencies from an external assembler (Spring) rather than creating them itself via `new`. |
| **Inversion of Control (IoC)** | A software architecture principle where the control flow of a program is inverted: the framework calls custom user code rather than user code calling framework libraries. |
| **Entity** | A persistent domain object representing a table row in a relational database, managed by JPA/Hibernate and annotated with `@Entity`. |
| **Repository** | A structural abstraction (Data Access Object) mediating between the domain logic and data mapping layers, providing CRUD and query operations without exposing SQL details. |
| **DTO (Data Transfer Object)** | An object that carries data between processes (e.g., HTTP request body to controller) without containing business logic, decoupling external API contracts from internal database entities. |
| **Transaction** | A single logical unit of work executing against a database that satisfies the ACID properties (Atomicity, Consistency, Isolation, Durability). |
| **Propagation** | A Spring transaction attribute defining how transaction boundaries are handled when a transactional method calls another transactional method (e.g., `REQUIRED` joins the existing transaction). |
| **Spring AOP Proxy** | A dynamically generated wrapper class created by Spring around a bean to intercept method calls and inject cross-cutting concerns (such as opening and committing database transactions or security checks). |
| **Idempotency** | The property of an operation whereby performing it multiple times yields the exact same outcome as performing it once, preventing duplicate financial transactions on network retries. |
| **Optimistic Locking** | A concurrency control mechanism where records are read without acquiring database locks. On update, the engine checks whether a version counter has changed; if changed, the update is rejected and rolls back. |
| **JWT (JSON Web Token)** | An open standard (RFC 7519) defining a compact, URL-safe container format for securely transmitting verifiable claims between parties as a digitally signed (not encrypted) token. |
| **BCrypt** | An adaptive cryptographic hash function based on the Blowfish cipher designed for passwords, incorporating a salt to protect against rainbow table attacks and an adjustable work factor. |
| **Salt** | A unique, cryptographically random sequence of bytes added to a password before hashing to ensure identical passwords do not produce identical hash outputs. |
| **Filter Chain** | A sequence of servlet filters through which an HTTP request passes before reaching a servlet (or controller), used for cross-cutting security, logging, and authentication tasks. |
| **Principal** | The currently authenticated identity (user, service, or merchant) recognized by the security context. |
| **SecurityContext** | An internal storage container associated with the current executing thread (via `ThreadLocal`) holding the authentication details and principal of the user making the request. |
| **CORS (Cross-Origin Resource Sharing)** | A browser security mechanism using HTTP headers to permit or restrict web applications running at one origin from requesting resources hosted on a different origin. |
| **CSRF (Cross-Site Request Forgery)** | An exploit where an unauthorized command is transmitted from a user that the web application trusts. Disabled in stateless REST APIs because requests use Authorization headers instead of ambient cookies. |
| **JPQL (Java Persistence Query Language)** | A platform-independent, object-oriented query language defined in JPA that operates on abstract entities and their attributes rather than database tables and columns. |
| **Pagination** | A technique for partitioning large database query result sets into smaller, discrete chunks (pages), typically implemented using SQL `LIMIT` and `OFFSET` clauses. |
| **Docker Image** | A lightweight, standalone, executable software package containing everything needed to run an application: code, runtime, system tools, libraries, and settings. |
| **Multi-Stage Build** | A Dockerfile optimization technique where multiple `FROM` instructions are used to separate the build environment (compilers, Maven, npm) from the final minimal runtime image. |
| **Environment Variable** | A dynamic key-value pair configured in the operating system or container environment that can be read by software at runtime to externalize configuration without modifying code. |
| **Spring Profile** | A core feature of the Spring framework allowing components, configurations, and properties to be segregated and conditionally activated based on the runtime environment (e.g., `default`, `demo`, `prod`). |
| **Dirty Checking** | An automated mechanism in Hibernate where the persistence context tracks changes made to managed entity properties and flushes corresponding SQL `UPDATE` statements before transaction commit. |
| **Factor Rate** | In merchant cash advances, a fixed multiplier applied to the advance principal to compute the total repayment obligation (e.g., ₹20,000 advance $	imes 1.05$ factor rate = ₹21,000 repayable), representing a flat fee rather than compounding interest. |
| **Append-Only Ledger** | A financial data architecture where transaction entries are strictly inserted (never updated or deleted), preserving a permanent, tamper-evident audit trail of all historical balance mutations. |

---


## Part 1: The big picture

### The Fintech Domain: Solving India's Small Merchant Working Capital Crisis
In India, millions of micro, small, and medium retail merchants (kirana stores, neighborhood bakeries, mobile repair shops, local electronics vendors) generate steady daily turnover via UPI QR codes (PhonePe, Google Pay, Paytm, Axis Bank). However, when these merchants need ₹20,000 to ₹1,00,000 to stock inventory for a festival, repair equipment, or expand shelf space, formal banking channels fail them:
- **Traditional Banks Demand Collateral**: Commercial lenders require property deeds, audited financial statements, and 3-year income tax returns, which sole proprietors rarely possess.
- **Term Loans Impose Rigid Monthly EMIs**: A fixed Equated Monthly Installment (EMI) must be paid on a specific day of the month regardless of whether foot traffic was high or zero. If foot traffic dips, the merchant defaults.
- **Informal Moneylenders Charge Usurious Rates**: Unorganized money lenders charge compound interest rates exceeding 30% to 60% per annum, trapping small retailers in chronic debt cycles.

MerchantHub solves this through **Revenue-Based Cash-Flow Underwriting**:
1. **Daily UPI Collections**: The merchant displays their MerchantHub dynamic QR code or sends payment links. Customers pay instantly via UPI.
2. **Real-time Wallet Settlement**: Gross funds settle into the merchant's digital wallet, backed by an append-only transaction ledger.
3. **Automated Eligibility Engine**: The platform tracks 30-day cumulative trading volume. Once a merchant crosses threshold benchmarks (e.g., ₹50,000 in successful turnover), they become instantly eligible for a Merchant Cash Advance without paper documents.
4. **Frictionless Daily Split Deductions**: Repayment is not a stressful monthly bill. Instead, the payment processing engine automatically intercepts every incoming customer payment and deducts a fixed 10% split toward the advance until the principal and factor fee are completely cleared.

---

### Merchant Cash Advance (MCA) vs. Term Loan & Factor Rate Math
It is vital to distinguish between a **Term Loan** and a **Merchant Cash Advance (MCA)** during your interview:

| Dimension | Traditional Term Loan | Merchant Cash Advance (MCA) |
| :--- | :--- | :--- |
| **Legal Classification** | Debt financing with debt-servicing obligations. | Purchase of future receivables at a discounted price. |
| **Pricing Model** | Annual Percentage Rate (APR) with reducing balance interest. | Fixed Factor Rate (flat fee multiplier applied to principal). |
| **Repayment Schedule** | Fixed monthly EMI regardless of business turnover. | Variable daily split deductions matching real transaction flow. |
| **Underwriting Criteria** | CIBIL credit score, audited financials, collateral assets. | Real-time POS / UPI cash-flow velocity and consistency. |
| **Delinquency Risk** | Non-payment leads to loan default, legal notice, asset seizure. | If sales slow down, repayments naturally slow down without penalty. |

#### Factor Rate Calculation
A factor rate is expressed as a decimal multiplier. MerchantHub uses a fixed factor rate of **1.05** (a 5% flat fee):
$$\text{Total Repayable} = \text{Advance Amount} \times \text{Factor Rate}$$

Suppose a merchant takes a ₹20,000 advance:
$$\text{Total Repayable} = 20,000 \times 1.05 = ₹21,000.00$$
Here, ₹20,000 is the disbursed working capital, and ₹1,000 is the financing fee. There is no compounding interest, no hidden penalty fees, and no interest rate fluctuations.

#### Walkthrough of a ₹1,000 Customer Payment with an Active Advance
Let us trace what occurs inside MerchantHub's financial engine when a customer scans the QR code and pays ₹1,000:
1. **Gross Customer Payment**: ₹1,000.00 is received via UPI.
2. **Gross Settlement**: The merchant's wallet balance increases by ₹1,000.00.
   - Ledger Entry written: `ENTRY_TYPE = CREDIT`, `AMOUNT = 1000.00`, `REASON = PAYMENT_SETTLEMENT`.
3. **Advance Interception**: The engine queries `cash_advances` for an `ACTIVE` advance. It finds the advance with:
   - `total_repayable` = ₹21,000.00
   - `amount_repaid` = ₹4,000.00
   - `outstanding` = $21,000.00 - 4,000.00 = ₹17,000.00$
4. **Repayment Calculation**: The engine calculates 10% of gross payment:
   $$\text{Deduction} = \min(1,000.00 \times 0.10, 17,000.00) = \min(100.00, 17,000.00) = ₹100.00$$
5. **Split Deduction Execution**:
   - The engine debits ₹100.00 from the merchant's wallet.
   - Ledger Entry written: `ENTRY_TYPE = DEBIT`, `AMOUNT = 100.00`, `REASON = ADVANCE_REPAYMENT`.
   - The advance's `amount_repaid` is incremented to ₹4,100.00 ($4,000 + 100$).
6. **Net Result to Merchant**: The merchant retains ₹900.00 spendable cash in their wallet, while ₹100.00 effortlessly pays down their advance obligation without manual intervention.

---

### Layered Architecture & Separation of Concerns

```
+-----------------------------------------------------------------------------------+
|                           Client Layer (React 19 SPA)                             |
|       Vite Dev Server / Static Assets served via Spring Boot forward mapping      |
+-----------------------------------------------------------------------------------+
                                         │  HTTP / HTTPS (JSON Payloads)
                                         ▼
+-----------------------------------------------------------------------------------+
|                          Security Filter Chain (Servlet)                          |
|   JwtAuthenticationFilter -> Extracts Bearer Token -> JwtService (Validate HS256) |
|   -> Populates SecurityContextHolder with CurrentMerchant Principal               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                         Controller Layer (@RestController)                        |
|   PaymentController, CashAdvanceController, AuthController, etc.                 |
|   - Maps HTTP paths, unpacks headers, validates @Valid DTO records                |
|   - Strictly NO business logic; delegates to domain services                      |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                           Service Layer (@Service)                                |
|   PaymentService, WalletService, CashAdvanceService, AuthService                  |
|   - @Transactional execution boundaries, ACID guarantees                          |
|   - Implements business rules: factor rates, idempotency, auto-repayment split    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        Repository Layer (@Repository)                             |
|   PaymentRepository, WalletRepository, LedgerEntryRepository, etc.                |
|   - Spring Data JPA interfaces; translates derived methods & JPQL to SQL          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                      ORM & Persistence Layer (Hibernate 7)                        |
|   - Manages Entity state, First-Level Cache, Dirty Checking, Flushing             |
|   - Enforces @Version optimistic locking checks (WHERE version = ?)               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                       Database Layer (PostgreSQL 16)                              |
|   - Relational tables, Foreign Keys, Composite Unique Constraints, NUMERIC types  |
+-----------------------------------------------------------------------------------+
```

#### Why Each Layer Exists
- **Controller Layer**: Decouples network communication and protocol details (HTTP status codes, URI routing, JSON parsing, header extraction) from domain rules. A controller should never know how a wallet balance is computed or how SQL is written.
- **Service Layer**: Houses the business rules of the enterprise. This layer defines transaction boundaries (`@Transactional`). If business logic were placed in controllers, transactions would span HTTP request handling, leading to long-lived database transactions, connection pool exhaustion, and untestable code.
- **Repository Layer**: Provides a clean object-oriented abstraction over data access. Services interact with domain entities through repository interfaces, freeing them from JDBC boilerplate, SQL dialect nuances, and connection lifecycle management.
- **Hibernate / ORM Layer**: Eliminates manual mapping between relational rows and Java objects. Provides automatic dirty checking so developers do not need to write error-prone SQL `UPDATE` statements for modified objects.
- **PostgreSQL Database**: The authoritative source of truth. Enforces relational integrity, transactions, and hardware durability.

---

### Complete Package & File Inventory Table

| Package | File | Architectural Role & Purpose |
| :--- | :--- | :--- |
| `com.merchanthub` | `BackendApplication.java` | Spring Boot main entrypoint; configures component scanning and JVM default timezone (`Asia/Kolkata`). |
| `com.merchanthub.entity` | `EntryType.java` | Enum defining ledger transaction types (`CREDIT`, `DEBIT`). |
| `com.merchanthub.entity` | `LedgerReason.java` | Enum documenting financial reasons for ledger movements (`PAYMENT_SETTLEMENT`, `ADVANCE_DISBURSAL`, `ADVANCE_REPAYMENT`, `REFUND`). |
| `com.merchanthub.entity` | `PaymentStatus.java` | Enum tracking payment state machine (`SUCCESS`, `FAILED`, `REFUNDED`). |
| `com.merchanthub.entity` | `AdvanceStatus.java` | Enum tracking cash advance states (`ACTIVE`, `REPAID`). |
| `com.merchanthub.entity` | `Merchant.java` | JPA Entity mapping `merchants` table (business metadata, email, hashed credentials, slug). |
| `com.merchanthub.entity` | `Wallet.java` | JPA Entity mapping `wallets` table (current balance, `@Version` optimistic locking field). |
| `com.merchanthub.entity` | `LedgerEntry.java` | JPA Entity mapping `ledger_entries` table (immutable audit row with running `balance_after`). |
| `com.merchanthub.entity` | `Payment.java` | JPA Entity mapping `payments` table (composite unique constraint on merchant and idempotency key). |
| `com.merchanthub.entity` | `CashAdvance.java` | JPA Entity mapping `cash_advances` table (tracks principal, factor rate, total repayable, and amount repaid). |
| `com.merchanthub.repository` | `MerchantRepository.java` | Spring Data repository for merchant lookup by email or public slug. |
| `com.merchanthub.repository` | `WalletRepository.java` | Spring Data repository for wallet balance retrieval and updates. |
| `com.merchanthub.repository` | `LedgerEntryRepository.java` | Spring Data repository for paginated ledger history with tie-breaker sorting. |
| `com.merchanthub.repository` | `PaymentRepository.java` | Spring Data repository for payment persistence, idempotency lookups, and aggregate metrics. |
| `com.merchanthub.repository` | `CashAdvanceRepository.java` | Spring Data repository for cash advance records and active status queries. |
| `com.merchanthub.dto` | *19 Record Files* | Strongly typed immutable Java Records carrying API requests, responses, pagination wrappers, and error details. |
| `com.merchanthub.exception` | `ResourceNotFoundException.java` | Thrown when an entity cannot be found by ID or slug (maps to 404). |
| `com.merchanthub.exception` | `InsufficientBalanceException.java` | Thrown when a wallet debit exceeds the available balance (maps to 400). |
| `com.merchanthub.exception` | `BusinessRuleException.java` | Thrown when business criteria are violated (e.g. taking a second advance) (maps to 400). |
| `com.merchanthub.exception` | `DuplicateEmailException.java` | Thrown during registration when an email is already taken (maps to 409). |
| `com.merchanthub.exception` | `GlobalExceptionHandler.java` | `@RestControllerAdvice` converting exceptions into standardized JSON error responses. |
| `com.merchanthub.security` | `JwtService.java` | Service for generating, signing (HS256), and parsing JSON Web Tokens. |
| `com.merchanthub.security` | `JwtAuthenticationFilter.java` | `OncePerRequestFilter` validating Bearer tokens and authenticating requests. |
| `com.merchanthub.security` | `JwtAuthenticationEntryPoint.java` | Implements `AuthenticationEntryPoint` to return clean 401 JSON when credentials are missing. |
| `com.merchanthub.security` | `CurrentMerchant.java` | ThreadLocal security accessor resolving the authenticated merchant ID. |
| `com.merchanthub.security` | `SecurityConfig.java` | Configures Spring Security filter chain, stateless session, and route permissions. |
| `com.merchanthub.config` | `OpenApiConfig.java` | Configures Swagger/OpenAPI documentation metadata and BearerAuth security schemes. |
| `com.merchanthub.config` | `DemoDataSeeder.java` | `CommandLineRunner` populating 30 days of realistic merchant transactions under `demo` profile. |
| `com.merchanthub.service` | `AuthService.java` | Handles merchant registration, slug generation, BCrypt password hashing, and login authentication. |
| `com.merchanthub.service` | `WalletService.java` | Manages atomic credit and debit operations, updating balances and writing audit ledger rows. |
| `com.merchanthub.service` | `PaymentService.java` | Orchestrates payment processing, idempotency verification, simulated UPI clearing, and advance repayment. |
| `com.merchanthub.service` | `CashAdvanceService.java` | Computes merchant advance eligibility, enforces borrowing limits, and disburses advance working capital. |
| `com.merchanthub.service` | `DashboardService.java` | Aggregates daily trading volumes, today's collections, and wallet metrics for the UI overview. |
| `com.merchanthub.service` | `LedgerService.java` | Serves paginated audit ledger records for the merchant's ledger view. |
| `com.merchanthub.controller` | `AuthController.java` | Endpoints for merchant registration (`/api/auth/register`) and login (`/api/auth/login`). |
| `com.merchanthub.controller` | `MerchantController.java` | Endpoint returning current authenticated merchant profile (`/api/merchants/me`). |
| `com.merchanthub.controller` | `WalletController.java` | Endpoints exposing current wallet balance and paginated ledger history. |
| `com.merchanthub.controller` | `PaymentController.java` | Endpoints for collecting payments, querying payment history, and triggering refunds. |
| `com.merchanthub.controller` | `CashAdvanceController.java` | Endpoints for checking advance eligibility, applying for advances, and viewing advance status. |
| `com.merchanthub.controller` | `DashboardController.java` | Endpoint delivering consolidated dashboard metrics and 7-day daily volume trends. |
| `com.merchanthub.controller` | `PublicCheckoutController.java` | Public endpoints allowing end-customers to view merchant details and pay without an account. |
| `com.merchanthub.controller` | `HealthController.java` | Lightweight health check endpoint (`/api/health`) returning server status. |
| `com.merchanthub.controller` | `SpaController.java` | Forwards unmapped non-API browser navigation requests to `/index.html` for client-side routing. |

---

### Request Journey: Step-by-Step Execution of `GET /api/payments?page=0&size=20&status=SUCCESS`
Let us trace the complete lifecycle of an authenticated request as it traverses through every layer of the system:

```
[Browser Client]
       │ 1. GET /api/payments?page=0&size=20&status=SUCCESS
       │    Header: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
       ▼
[Servlet Container / Tomcat]
       │ 2. Allocates worker thread from thread pool (e.g., http-nio-8080-exec-3)
       ▼
[Security Filter Chain]
       │ 3. JwtAuthenticationFilter.doFilterInternal() intercepts request
       │ 4. Extracts token string, strips "Bearer " prefix
       │ 5. Calls JwtService.extractClaims(token) -> parses claims using signing key
       │ 6. Validates token signature and expiration date
       │ 7. Creates UsernamePasswordAuthenticationToken(merchantId, null, authorities)
       │ 8. SecurityContextHolder.getContext().setAuthentication(auth)
       ▼
[Spring DispatcherServlet]
       │ 9. HandlerMapping resolves URL to PaymentController.getPayments()
       ▼
[PaymentController]
       │ 10. CurrentMerchant.get() reads merchantId (e.g. 1L) from SecurityContext
       │ 11. Constructs PageRequest.of(0, 20)
       │ 12. Calls paymentService.getPayments(1L, PaymentStatus.SUCCESS, pageable)
       ▼
[PaymentService]
       │ 13. Calls paymentRepository.findByMerchantIdAndStatusOrderByCreatedAtDescIdDesc(1L, SUCCESS, pageable)
       ▼
[Spring Data JPA & Hibernate 7]
       │ 14. Translates derived method into two SQL statements:
       │     a. Data Query:
       │        SELECT id, merchant_id, amount, status, customer_name, customer_vpa,
       │               idempotency_key, created_at, updated_at
       │        FROM payments
       │        WHERE merchant_id = 1 AND status = 'SUCCESS'
       │        ORDER BY created_at DESC, id DESC
       │        LIMIT 20 OFFSET 0;
       │     b. Count Query (for pagination metadata):
       │        SELECT COUNT(id) FROM payments
       │        WHERE merchant_id = 1 AND status = 'SUCCESS';
       │ 15. Hydrates relational result set into List<Payment> entities
       │ 16. Wraps in Page<Payment> instance containing totalElements and totalPages
       ▼
[PaymentService & PaymentController]
       │ 17. Maps Page<Payment> to PageResponse<PaymentResponse> via PaymentResponse::fromEntity
       │ 18. Controller returns ResponseEntity.ok(pageResponse)
       ▼
[Spring HttpMessageConverter & Jackson]
       │ 19. Jackson (ObjectMapper) serializes PageResponse record into JSON string
       │ 20. Sets HTTP 200 OK header, Content-Type: application/json
       ▼
[Browser Client]
       │ 21. Client receives JSON payload with payments array and pagination metadata
```

---

### Interview Angle: The Big Picture & Architecture
1. **Interviewer**: *"Why did you use an append-only ledger for the wallet instead of just updating a balance column in the merchant table?"*
   - **Model Answer**: In financial applications, modifying a solitary balance column destroys historical auditability and makes forensic reconciliation impossible. By maintaining an append-only `ledger_entries` table with an immutable record of every credit and debit alongside a running `balance_after`, we ensure complete audit integrity. If any balance discrepancy ever arises, the entire financial history can be reconstructed and proven from row zero to the current balance.
2. **Interviewer**: *"Explain the difference between a Merchant Cash Advance and a traditional business loan. Why does an MCA fit small retail merchants better?"*
   - **Model Answer**: A traditional loan requires formal credit scores, balance sheets, and collateral, and enforces rigid monthly EMI payments regardless of trading conditions. An MCA is an advance purchase of future receivables at a fixed factor rate fee (such as 1.05) with no compounding interest. Repayments are deducted as a small percentage (10%) of daily UPI settlements, meaning that if a merchant has a slow sales week, their repayment obligation automatically scales down proportionally, eliminating default risk.
3. **Interviewer**: *"Why does your system have both a Controller layer and a Service layer? Why not query repositories directly inside controllers?"*
   - **Model Answer**: Controllers are responsible for HTTP transport concerns such as URI mapping, header extraction, payload validation, and HTTP status code formatting. Services represent transaction boundaries using `@Transactional` and execute business logic. Allowing controllers to call repositories directly creates tight coupling, prevents reusing business logic across multiple entry points (such as public checkouts and private merchant dashboards), leaks persistence concerns into the presentation layer, and causes transactions to remain open across network I/O, risking database connection pool exhaustion.


## Part 2: Tooling, build and configuration

### Spring Initializr & Chosen Dependencies
When initializing MerchantHub on [start.spring.io](https://start.spring.io), specific dependencies were selected to construct a lightweight, high-performance financial microservice:

| Dependency | Group / Artifact ID | Architectural Reason for Selection |
| :--- | :--- | :--- |
| **Spring Boot Starter Web** | `org.springframework.boot:spring-boot-starter-web` | Provides Apache Tomcat as an embedded servlet container, the Spring MVC framework for building RESTful controllers, and Jackson (`ObjectMapper`) for automatic JSON serialization/deserialization. |
| **Spring Boot Starter Data JPA** | `org.springframework.boot:spring-boot-starter-data-jpa` | Provides Hibernate 7 as the Object-Relational Mapping (ORM) provider, HikariCP as the production-grade JDBC connection pool, and Spring Data abstractions (`JpaRepository`) for declarative data access. |
| **Spring Boot Starter Security** | `org.springframework.boot:spring-boot-starter-security` | Provides the servlet security filter chain, BCrypt password hashing primitives, and security context management for stateless authentication. |
| **Spring Boot Starter Validation** | `org.springframework.boot:spring-boot-starter-validation` | Integrates Jakarta Bean Validation (Hibernate Validator) to enforce structural constraints (`@NotBlank`, `@DecimalMin`, `@Positive`) on incoming DTO records before service execution. |
| **Spring Boot Starter Actuator** | `org.springframework.boot:spring-boot-starter-actuator` | Exposes operational monitoring endpoints such as `/actuator/health` used by Docker, Kubernetes, and UptimeRobot to monitor container liveness. |
| **PostgreSQL JDBC Driver** | `org.postgresql:postgresql` | Pure-Java Type 4 JDBC driver allowing HikariCP and Hibernate to establish low-latency TCP connections to PostgreSQL 16 databases. |
| **Lombok** | `org.projectlombok:lombok` | Annotation processor reducing boilerplate code by automatically generating getters, setters, constructors, and builders at compile time. |
| **JJWT (Java JWT)** | `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson` (v0.12.6) | Lightweight, dependency-free library for generating, signing (HMAC-SHA256), and parsing JSON Web Tokens. |
| **SpringDoc OpenAPI** | `org.springdoc:springdoc-openapi-starter-webmvc-ui` (v2.8.5) | Automatically inspects Spring MVC controllers and generates interactive OpenAPI 3.0 documentation and Swagger UI at `/swagger-ui.html`. |

---

### The Maven Wrapper (`mvnw`)
The project includes two wrapper scripts in the repository root: `mvnw` (for Linux/macOS Bash) and `mvnw.cmd` (for Windows Command Prompt / PowerShell), accompanied by the hidden folder `.mvn/wrapper/`.
- **Why it exists**: In corporate software teams, different developers and CI/CD runners may have varying versions of Maven installed locally (e.g. Maven 3.6 vs 3.9), leading to build inconsistencies.
- **How it works**: The wrapper reads `.mvn/wrapper/maven-wrapper.properties`, which specifies the exact distribution URL:
  `distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven-3.9.9-bin.zip`
- If Maven is not installed on the host machine, `mvnw` automatically downloads Maven 3.9.9 to the user's home directory (`~/.m2/wrapper/dists/`), verifies its integrity, and executes the build using that exact runtime.

---

### `pom.xml` Section-by-Section Deep Dive

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>4.1.2</version>
		<relativePath/>
	</parent>
	<groupId>com.merchanthub</groupId>
	<artifactId>backend</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>MerchantHub</name>
	<description>MerchantHub Backend</description>
```

#### 1. Parent POM and Bill of Materials (BOM)
- `<parent>` imports `spring-boot-starter-parent` version `4.1.2`. This is a special starter parent that provides default dependency management, default plugin management, and sensible resource filtering.
- Because the parent POM acts as a Bill of Materials (BOM), we do not need to specify version numbers for dependencies managed by Spring (such as `spring-boot-starter-web`, `postgresql`, `hibernate-core`, or `jackson`). Maven inherits battle-tested, mutually compatible versions automatically.

```xml
	<properties>
		<java.version>21</java.version>
	</properties>
```
- `<java.version>21</java.version>` instructs the Maven compiler plugin to target Java 21 bytecode, enabling modern language features such as Java Records, Pattern Matching, and virtual threads.

#### 2. Dependencies and Scopes

```xml
	<dependencies>
		<!-- Compile Scope (Default): Available at compile, test, and runtime -->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-validation</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>

		<!-- Runtime Scope: Needed only when running, not during compilation -->
		<dependency>
			<groupId>org.postgresql</groupId>
			<artifactId>postgresql</artifactId>
			<scope>runtime</scope>
		</dependency>

		<!-- Optional Scope: Not transitively propagated to downstream projects -->
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>

		<!-- Third-party libraries requiring explicit versions -->
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-api</artifactId>
			<version>0.12.6</version>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-impl</artifactId>
			<version>0.12.6</version>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-jackson</artifactId>
			<version>0.12.6</version>
			<scope>runtime</scope>
		</dependency>

		<dependency>
			<groupId>org.springdoc</groupId>
			<artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
			<version>2.8.5</version>
		</dependency>

		<!-- Test Scope: Available only when compiling and executing unit tests -->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.security</groupId>
			<artifactId>spring-security-test</artifactId>
			<scope>test</scope>
		</dependency>
	</dependencies>
```

#### Understanding Maven Scopes:
- **`compile` (Default)**: The dependency is required at all stages: compiling source code, running tests, and executing the application in production.
- **`runtime`**: The dependency is not needed to compile Java source code (our code programs against JDBC interfaces, not concrete PostgreSQL classes), but must be present on the classpath when the application runs.
- **`optional`**: Used for Lombok. Lombok is an annotation processor required during compilation to generate bytecode, but its annotations are discarded at runtime and should not be passed to external projects consuming this artifact.
- **`test`**: The dependency is loaded only during `mvn test` execution and is completely excluded from the production fat JAR.

#### 3. Build Plugins Configuration

```xml
	<build>
		<plugins>
			<!-- Compiler Plugin with Lombok Annotation Processor -->
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<annotationProcessorPaths>
						<path>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</path>
					</annotationProcessorPaths>
				</configuration>
			</plugin>

			<!-- Spring Boot Maven Plugin (Fat JAR creation) -->
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<jvmArguments>-Duser.timezone=Asia/Kolkata</jvmArguments>
				</configuration>
			</plugin>

			<!-- Surefire Plugin for Unit Tests with Memory Constraints -->
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-surefire-plugin</artifactId>
				<configuration>
					<argLine>-Xmx256m -Xms64m</argLine>
				</configuration>
			</plugin>
		</plugins>
	</build>
```
- **Lombok in Compiler Plugin**: In modern Maven compiler plugins, annotation processors must be explicitly declared inside `<annotationProcessorPaths>`. If omitted, Lombok annotations like `@Getter` and `@Setter` will be ignored, causing compilation failures.
- **Spring Boot Maven Plugin**: During `mvn package`, this plugin executes its `repackage` goal. It takes the compiled application `.class` files, bundles all dependency JARs inside `BOOT-INF/lib/`, inserts an embedded Apache Tomcat web server, and configures a special `JarLauncher` class in `META-INF/MANIFEST.MF`. This produces a self-contained **executable fat JAR** runnable via `java -jar backend.jar`.
- **`jvmArguments`**: When running locally via `mvn spring-boot:run`, passes `-Duser.timezone=Asia/Kolkata` to ensure consistent date handling.
- **Surefire `argLine`**: Configures the JVM executing unit tests to use a minimum heap of 64MB (`-Xms64m`) and maximum heap of 256MB (`-Xmx256m`), preventing runaway memory allocation on developer laptops and CI containers.

---

### `application.yml` Line-by-Line Breakdown

```yaml
spring:
  application:
    name: merchanthub-backend

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:merchanthub}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        format_sql: true
    show-sql: false
    open-in-view: false

server:
  port: ${PORT:8080}

app:
  jwt:
    secret: dGhpcy1pcy1hLXNhbXBsZS1zZWNyZXQta2V5LWZvci1qd3QtYXV0aGVudGljYXRpb24tc2hvdWxkLWJlLWNoYW5nZWQ=
    expiration-ms: 86400000

management:
  endpoints:
    web:
      exposure:
        include: health
```

#### Line-by-Line Explanation:
1. **`${VARIABLE_NAME:defaultValue}` Syntax**:
   - This is Spring's property placeholder syntax. It instructs Spring to inspect the host environment for an environment variable named `DB_HOST`. If found, it uses that value; if not found, it falls back to the default value `localhost`.
   - In local development, no environment variables are set, so it connects to `localhost:5432/merchanthub` with credentials `postgres/postgres`.
   - In production on Render, Render supplies `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`, pointing the app to the remote Neon PostgreSQL instance.
2. **`hibernate.ddl-auto: update`**:
   - At startup, Hibernate compares the JPA `@Entity` classes against the database schema. If a table or column does not exist, Hibernate automatically generates and executes the required `CREATE TABLE` or `ALTER TABLE ADD COLUMN` statements.
   - It will *never* drop existing tables or delete existing columns. (In production enterprise environments, this is typically replaced with Flyway or Liquibase versioned migration scripts).
3. **`open-in-view: false` (Critical Senior Design Decision)**:
   - By default, Spring Boot sets Open Session In View (OSIV) to `true`. When OSIV is active, the Hibernate persistence context remains open for the entire duration of the HTTP request lifecycle, including during controller serialization in the view layer.
   - Setting it to `false` ensures that database sessions and connections are strictly scoped to `@Transactional` service methods. The moment the service returns, the database connection is immediately released back to the HikariCP connection pool. This prevents lazy loading exceptions from occurring silently in controllers and protects connection pools from starvation.
4. **`show-sql: false`**:
   - Suppresses Hibernate from printing raw SQL statements to standard out on every query, preventing log flooding and performance degradation in production.
5. **`server.port: ${PORT:8080}`**:
   - Binds the embedded Tomcat server to the port dictated by the cloud hosting environment (Render assigns dynamic ports via `$PORT`), falling back to 8080 locally.
6. **`app.jwt.secret` & `expiration-ms: 86400000`**:
   - `secret`: A base64-encoded string representing a 256-bit cryptographic secret key used for signing and verifying HMAC-SHA256 tokens.
   - `expiration-ms`: 86,400,000 milliseconds. Let us verify the math:
     $$86,400,000\text{ ms} \div 1,000 = 86,400\text{ seconds}$$
     $$86,400\text{ seconds} \div 3,600 = 24\text{ hours}$$
     This configures access tokens to expire exactly 24 hours after issuance.
7. **`management.endpoints.web.exposure.include: health`**:
   - Restricts Spring Boot Actuator to expose only the `/actuator/health` endpoint, hiding sensitive internal operational endpoints (such as `/actuator/env` or `/actuator/beans`) from public exposure.

---

### `docker-compose.yml` Line-by-Line Breakdown

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: merchanthub-postgres
    environment:
      POSTGRES_DB: merchanthub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

#### Line-by-Line Explanation:
1. `version: '3.8'`: Declares the Docker Compose file format specification.
2. `services:`: Defines the containerized services comprising the local infrastructure.
3. `image: postgres:16-alpine`: Utilizes the official PostgreSQL 16 image built on Alpine Linux. Alpine reduces the container footprint to ~80MB, minimizing download time and RAM usage.
4. `environment:`: Passes environment variables into the container during initialization:
   - `POSTGRES_DB: merchanthub`: Automatically creates a database named `merchanthub` upon first launch.
   - `POSTGRES_USER` / `POSTGRES_PASSWORD`: Sets the default superuser credentials to `postgres` / `postgres`.
5. `ports: - "5432:5432"`: Maps port 5432 on the host machine to port 5432 inside the container, allowing the local Spring Boot application running on the host OS to connect via `localhost:5432`.
6. `volumes: - pgdata:/var/lib/postgresql/data`: Attaches a named Docker volume (`pgdata`) to PostgreSQL's internal data storage directory. This guarantees that all tables, rows, and transactions persist even if the container is stopped or destroyed.

---

### `BackendApplication.java` Line-by-Line Breakdown

```java
package com.merchanthub;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class BackendApplication {

    static {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
    }

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

#### Line-by-Line Explanation:
1. `package com.merchanthub;`: The root package declaration.
2. `@SpringBootApplication`: A composite meta-annotation that bundles three core Spring Boot annotations:
   - `@Configuration`: Tags the class as a source of bean definitions for the application context.
   - `@EnableAutoConfiguration`: Tells Spring Boot to automatically configure beans based on the libraries present on the classpath (e.g. seeing `postgresql` and `spring-boot-starter-data-jpa` on the classpath automatically configures a HikariCP DataSource and Hibernate EntityManager).
   - `@ComponentScan`: Instructs Spring to recursively scan the current package (`com.merchanthub`) and all sub-packages (`.controller`, `.service`, `.repository`, `.security`, `.config`) for classes annotated with `@Component`, `@Service`, `@Repository`, or `@RestController` and instantiate them as Spring Beans.
3. `static { TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata")); }`:
   - A static initialization block executed by the JVM classloader when the `BackendApplication` class is loaded into memory, before any method runs.
   - **Why this is critical**: The cloud deployment runs on Render servers located in Oregon/Frankfurt, whose system clocks are set to UTC. In Java, `LocalDateTime` objects possess no timezone offset information; they represent naive wall-clock time. If the JVM timezone remained UTC, database queries grouping transactions by day (`created_at >= startOfDay`) would slice dates at 00:00 UTC (05:30 AM Indian Standard Time), causing transactions between midnight and 5:30 AM IST to be attributed to the wrong financial day! Setting the default JVM timezone to `Asia/Kolkata` guarantees that all date-time calculations match Indian banking business hours.
4. `TimeZone.setDefault(...)` inside `main()`:
   - Redundantly sets the timezone a second time inside the entrypoint method. (While harmless, this duplication was flagged in code review as redundant since the static block has already executed).
5. `SpringApplication.run(BackendApplication.class, args);`:
   - Bootstraps the application: starts the stopwatch, creates the `ApplicationContext`, triggers auto-configuration, starts embedded Apache Tomcat on port 8080, and invokes any `CommandLineRunner` beans (such as `DemoDataSeeder`).

---

### Essential Terminal Commands

```bash
# 1. Start the local PostgreSQL 16 container in background
docker compose up -d

# 2. Stop the local PostgreSQL container
docker compose down

# 3. Run backend locally in default development profile
./mvnw spring-boot:run

# 4. Run backend locally with the DEMO profile (triggers DemoDataSeeder)
./mvnw spring-boot:run "-Dspring-boot.run.profiles=demo"

# 5. Run all unit tests with Surefire memory caps
./mvnw clean test

# 6. Build the production executable fat JAR (skipping tests for speed)
./mvnw clean package -DskipTests
```

---

### Interview Angle: Tooling, Build & Configuration
1. **Interviewer**: *"What happens when you run `mvn clean package` on a Spring Boot application? What is a fat JAR?"*
   - **Model Answer**: `mvn clean package` invokes the Maven lifecycle: cleaning the `target/` directory, compiling source code, running unit tests via Surefire, and packaging compiled classes. The `spring-boot-maven-plugin` intercepts this step and repackages the standard JAR into an executable 'fat JAR'. This fat JAR contains all compiled application classes in `BOOT-INF/classes/`, all third-party dependency JARs in `BOOT-INF/lib/`, an embedded Tomcat server, and a specialized Spring Boot `JarLauncher`. This allows the application to run anywhere with a standard JRE via `java -jar app.jar` without requiring a pre-installed servlet container.
2. **Interviewer**: *"Why did you set `spring.jpa.open-in-view: false` in `application.yml`?"*
   - **Model Answer**: By default, Spring Boot keeps the database persistence context open across the entire HTTP request lifecycle to allow lazy loading during JSON view rendering. In high-concurrency financial systems, this is an anti-pattern because database connections from the HikariCP pool remain checked out while Tomcat writes JSON over slow client network connections, causing connection pool exhaustion. Setting OSIV to `false` forces database connections to be released the exact millisecond the `@Transactional` service method finishes.
3. **Interviewer**: *"Why did you set the default JVM timezone to `Asia/Kolkata` in code?"*
   - **Model Answer**: Cloud environments like Render run their server hardware on UTC. Because JPA `LocalDateTime` fields represent naive date-times without timezone offsets, database date grouping queries for daily turnover metrics would evaluate midnight at 00:00 UTC (05:30 AM IST). This would misallocate transactions occurring between midnight and 5:30 AM IST to the prior financial day. Setting `TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"))` ensures that all calendar grouping and financial reconciliation reflect Indian banking hours.


## Part 3: Backend file by file (Entities & Enums)

### EntryType.java
**Purpose:** Defines the fundamental directional nature of balance movements in the internal wallet ledger.

**Code:**
```java
package com.merchanthub.entity;

public enum EntryType {
  CREDIT,
  DEBIT
}
```

**Line by line:**
- `package com.merchanthub.entity;`: Places the enum in the entity package alongside domain models.
- `public enum EntryType`: Declares a Java enum type with two discrete values:
  - `CREDIT`: Represents an inflow of capital that increases the merchant's wallet balance (e.g. payment settlement, advance disbursal).
  - `DEBIT`: Represents an outflow of capital that decreases the merchant's wallet balance (e.g. advance repayment deduction, refund).

**Concepts used:** Java Enums. Enums in Java provide compile-time type safety, preventing arbitrary string errors (like misspelling `"CRDIT"` or `"DEBET"`).

**What could go wrong:** If an engineer adds another entry type (such as `HOLD` or `REVERSAL`), any `switch` statements or conditional blocks in the service layer must be updated, or unhandled branches will fail.

**Interview angle:**
- **Q**: Why store enums as `EnumType.STRING` in JPA instead of the default `EnumType.ORDINAL`?
  - **A**: The default `ORDINAL` maps enum constants to their numeric zero-based array index (0 for `CREDIT`, 1 for `DEBIT`). If a developer later inserts a new constant at the beginning of the enum, all existing database rows will point to the wrong enum values, causing catastrophic silent financial data corruption. Storing them as `STRING` (`'CREDIT'`, `'DEBIT'`) ensures immutability across code refactorings.

---

### LedgerReason.java
**Purpose:** Explains *why* money moved in the wallet ledger, providing financial audit classification.

**Code:**
```java
package com.merchanthub.entity;

public enum LedgerReason {
  PAYMENT,
  REFUND,
  ADVANCE_DISBURSAL,
  ADVANCE_REPAYMENT
}
```

**Line by line:**
- `PAYMENT_SETTLEMENT`: Inflow of funds from a successful customer UPI transaction.
- `ADVANCE_DISBURSAL`: Inflow of working capital disbursed by the platform when an advance is approved.
- `ADVANCE_REPAYMENT`: Automated 10% split deduction from a customer payment to repay an active advance.
- `REFUND`: Outflow of funds returned to a customer when a transaction is reversed.

**Concepts used:** Domain-driven event classification.

**What could go wrong:** If a refund is initiated when the merchant's wallet balance is insufficient, using `REFUND` without verifying balance would drive the ledger negative.

**Interview angle:**
- **Q**: How does `LedgerReason` help in financial reconciliation?
  - **A**: It allows accounting auditors to run aggregate queries (`SELECT reason, SUM(amount) FROM ledger_entries GROUP BY reason`) to separate operational payment turnover from financing flows and refunds.

---

### PaymentStatus.java
**Purpose:** Tracks the state machine of an incoming customer payment.

**Code:**
```java
package com.merchanthub.entity;

public enum PaymentStatus {
  PENDING,
  SUCCESS,
  FAILED,
  REFUNDED
}
```

**Line by line:**
- `SUCCESS`: Payment completed successfully and credited to the wallet.
- `FAILED`: Payment was declined by the simulated bank/UPI switch.
- `REFUNDED`: The payment was successfully settled previously, but subsequently reversed.

**Concepts used:** State Machine modeling.

**What could go wrong:** In a real banking gateway, payments can exist in an intermediate `PENDING` or `INITIATED` state while awaiting webhook callbacks. MerchantHub simulates synchronous payment processing, so payments transition immediately to `SUCCESS` or `FAILED`.

**Interview angle:**
- **Q**: Can a `FAILED` payment transition to `REFUNDED`?
  - **A**: No. The business logic in `PaymentService.refundPayment` strictly validates that only payments currently in `SUCCESS` status can be refunded.

---

### AdvanceStatus.java
**Purpose:** Represents the lifecycle state of a Merchant Cash Advance.

**Code:**
```java
package com.merchanthub.entity;

public enum AdvanceStatus {
  ACTIVE,
  REPAID
}
```

**Line by line:**
- `ACTIVE`: The advance has been disbursed to the merchant and repayments are actively being intercepted from incoming settlements.
- `REPAID`: Cumulative repayments have reached `total_repayable`, and split deductions cease immediately.

**Concepts used:** Finite State Machine.

**What could go wrong:** If two advances become `ACTIVE` simultaneously for the same merchant due to a concurrency race, queries using `findByMerchantIdAndStatus(id, ACTIVE)` will throw `IncorrectResultSizeDataAccessException`.

**Interview angle:**
- **Q**: How does an advance transition from `ACTIVE` to `REPAID`?
  - **A**: On every successful payment, `PaymentService` compares `amountRepaid` against `totalRepayable`. When `amountRepaid.compareTo(advance.getTotalRepayable()) >= 0`, it invokes `advance.setStatus(AdvanceStatus.REPAID)`.

---

### Merchant.java
**Purpose:** Represents the registered business entity, holding store identity, credentials, public slug, and timestamp audits.

**Code:**
```java
package com.merchanthub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "merchants")
@Getter
@Setter
@NoArgsConstructor
public class Merchant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 80)
  private String businessName;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false, length = 10)
  private String phone;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }
}
```

**Approximate Generated Table Schema (PostgreSQL):**
```sql
CREATE TABLE merchants (
    id BIGSERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
CREATE UNIQUE INDEX uk_merchants_email ON merchants(email);
CREATE UNIQUE INDEX uk_merchants_slug ON merchants(slug);
```

**Line by line:**
- `@Entity`: Marks this class as a persistent JPA domain entity mapped to a relational table.
- `@Table(name = "merchants")`: Explicitly names the SQL table `merchants`.
- `@Getter`, `@Setter`: Lombok annotations that synthesize getters and setters for all non-static fields at compile time.
- `@NoArgsConstructor`, `@AllArgsConstructor`: Generates a zero-argument constructor (strictly required by JPA reflection to instantiate entities during hydration) and a full-args constructor.
- `@Builder`: Implements the GoF Builder pattern, enabling clean object construction like `Merchant.builder().businessName("...").build()`.
- `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)`: Declares `id` as the surrogate primary key using PostgreSQL's native `BIGSERIAL` / `IDENTITY` column.
- `@Column(nullable = false, unique = true)` on `email` and `slug`: Enforces non-nullability and database-level unique constraints.
- `@PrePersist` and `@PreUpdate`: JPA lifecycle callback hooks that automatically populate `created_at` and `updated_at` timestamps using `LocalDateTime.now()` before SQL insertion or modification.

**Concepts used:** JPA Entity lifecycle callbacks (`@PrePersist`, `@PreUpdate`), Surrogate Keys, Lombok, `GenerationType.IDENTITY`.

**What could go wrong:** `GenerationType.IDENTITY` prevents Hibernate from using JDBC batch insertions because Hibernate must execute the `INSERT` statement immediately upon `save()` to obtain the generated database ID.

**Interview angle:**
- **Q**: Why do you have `@PrePersist` and `@PreUpdate` instead of database default triggers?
  - **A**: JPA entity callbacks allow the application layer to maintain consistent in-memory timestamps across persistence context flushes without having to re-fetch rows from the database.

---

### Wallet.java
**Purpose:** Represents the merchant's financial wallet, maintaining the current available balance and an optimistic locking version counter.

**Code:**
```java
package com.merchanthub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wallets")
@Getter
@Setter
@NoArgsConstructor
public class Wallet {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "merchant_id", nullable = false, unique = true)
  private Merchant merchant;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal balance;

  @Version
  private Long version;

  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
    if (updatedAt == null) {
      updatedAt = createdAt;
    }
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
```

**Approximate Generated Table Schema (PostgreSQL):**
```sql
CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL UNIQUE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
CREATE UNIQUE INDEX uk_wallets_merchant_id ON wallets(merchant_id);
```

**Line by line:**
- `@Entity @Table(name = "wallets")`: Maps the entity to the `wallets` table.
- `@Column(nullable = false, unique = true) private Long merchantId;`: Strict 1-to-1 relationship with `merchants`. One merchant owns exactly one wallet.
- `@Column(nullable = false, precision = 12, scale = 2) private BigDecimal balance = BigDecimal.ZERO;`: Financial balance field. `precision = 12, scale = 2` ensures up to 10 integer digits and 2 decimal places (up to ₹9,99,99,99,999.99).
- `@Version private Long version;`: **Optimistic Locking Counter**.
  - **Crucial Rule**: Optimistic locking does NOT acquire any lock on the database row. Instead, when Hibernate flushes an update, it appends a condition to the SQL query:
    ```sql
    UPDATE wallets SET balance = ?, version = version + 1 WHERE id = ? AND version = ?;
    ```
  - If another concurrent thread updated the wallet between the time this thread read it and attempted to write it, the version in the database will have incremented. The `UPDATE` statement will match 0 rows.
  - Hibernate detects that 0 rows were updated and immediately throws `OptimisticLockException` (wrapped by Spring as `ObjectOptimisticLockingFailureException`), causing the transaction to safely roll back rather than overwriting funds (avoiding the Lost Update problem).
- `@PrePersist` sets `balance = BigDecimal.ZERO.setScale(2)` if null.

**Concepts used:** Optimistic Locking (`@Version`), `BigDecimal` precision and scale, Lost Update prevention.

**What could go wrong:** If high concurrency occurs on a single merchant (e.g. 50 payments per second on a flash sale), optimistic locking will cause many concurrent requests to fail and roll back. High-volume systems replace this with row-level pessimistic locking (`SELECT ... FOR UPDATE`) or atomic SQL additions (`UPDATE wallets SET balance = balance + ?`).

**Interview angle:**
- **Q**: Does `@Version` lock the database row during a transaction?
  - **A**: No! It does not acquire any lock. It is a conflict-detection mechanism, not a lock. Hibernate appends `WHERE version = ?` to the `UPDATE`. If 0 rows are affected, it indicates a collision, and Hibernate throws an `OptimisticLockException` which rolls back the transaction.

---

### LedgerEntry.java
**Purpose:** An append-only audit trail recording every balance mutation (credit or debit) with a running balance after the transaction.

**Code:**
```java
package com.merchanthub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ledger_entries")
@Getter
@Setter
@NoArgsConstructor
public class LedgerEntry {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "wallet_id", nullable = false)
  private Wallet wallet;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private EntryType entryType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  private LedgerReason reason;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  @Column(nullable = false)
  private Long referenceId;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal balanceAfter;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }
}
```

**Approximate Generated Table Schema (PostgreSQL):**
```sql
CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    amount NUMERIC(12, 2) NOT NULL,
    entry_type VARCHAR(20) NOT NULL,
    reason VARCHAR(50) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference_id BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
CREATE INDEX idx_ledger_wallet_id ON ledger_entries(wallet_id);
```

**Line by line:**
- `@Enumerated(EnumType.STRING)` on `entry_type` and `reason`: Stores strings (`'CREDIT'`, `'PAYMENT_SETTLEMENT'`) in SQL columns, protecting against enum reordering bugs.
- `@Column(nullable = false, precision = 12, scale = 2) private BigDecimal balanceAfter;`: Records the exact wallet balance immediately after this entry took effect. This allows auditors to verify balance integrity without computing running totals over millions of historical rows.
- `private Long referenceId;`: Nullable foreign reference storing the related entity ID (e.g., `payment_id` for settlements and refunds, or `advance_id` for disbursals).
- No `@PreUpdate` or setter modifications: Represents an immutable, write-only historical record.

**Concepts used:** Immutable Audit Log, Running Balance verification, Foreign Reference linkage.

**What could go wrong:** If application code directly updates an existing `LedgerEntry` row, audit integrity is breached. (In Part 12, we propose database triggers that reject `UPDATE` and `DELETE` queries on this table).

**Interview angle:**
- **Q**: Is your ledger a double-entry accounting ledger?
  - **A**: No. It is an append-only wallet ledger with a running balance. A true double-entry ledger writes two offsetting balanced entries (Debit Asset, Credit Liability/Equity) across a chart of accounts for every financial event. Here, each wallet event produces one row tracking the wallet's credit/debit movement.

---

### Payment.java
**Purpose:** Represents an incoming customer payment, enforcing idempotency via a database composite unique constraint.

**Code:**
```java
package com.merchanthub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "payments",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"merchant_id", "idempotencyKey"})
    }
)
@Getter
@Setter
@NoArgsConstructor
public class Payment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "merchant_id", nullable = false)
  private Merchant merchant;

  @Column(nullable = false, length = 60)
  private String payerVpa;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  @Column(length = 100)
  private String note;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private PaymentStatus status;

  @Column(nullable = false, length = 64)
  private String idempotencyKey;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }
}
```

**Approximate Generated Table Schema (PostgreSQL):**
```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id),
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_vpa VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT uk_payments_merchant_idempotency UNIQUE (merchant_id, idempotency_key)
);
```

**Line by line:**
- `@Table(name = "payments", uniqueConstraints = { @UniqueConstraint(name = "uk_payments_merchant_idempotency", columnNames = {"merchant_id", "idempotency_key"}) })`:
  - Enforces a **Composite Unique Constraint** across `merchant_id` and `idempotency_key` at the database engine level.
  - If a network timeout causes a client to retry the exact same payment request with the same `Idempotency-Key`, the database rejects the second insert, preventing double charging.
- `@Enumerated(EnumType.STRING) private PaymentStatus status;`: Records payment outcome (`SUCCESS`, `FAILED`, `REFUNDED`).
- `customer_name` & `customer_vpa`: Captures customer details and Virtual Payment Address (e.g. `rahul@okhdfcbank`).

**Concepts used:** Composite Unique Constraints, Idempotency keys in payment processing.

**What could go wrong:** The `idempotency_key` column is sized at 64 characters, but if a client sends an empty string or arbitrary 1000-character UUID string, unvalidated input could cause database truncation errors.

**Interview angle:**
- **Q**: Why is the unique constraint on `(merchant_id, idempotency_key)` rather than just `idempotency_key`?
  - **A**: Two different merchants might conceivably generate the same UUID or sequential transaction ID (e.g., `INV-001`). Idempotency keys must be scoped to a specific tenant (merchant) to prevent cross-merchant collision attacks.

---

### CashAdvance.java
**Purpose:** Represents an issued merchant cash advance, tracking principal, factor fee, cumulative repayments, and outstanding debt.

**Code:**
```java
package com.merchanthub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cash_advances")
@Getter
@Setter
@NoArgsConstructor
public class CashAdvance {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "merchant_id", nullable = false)
  private Merchant merchant;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal principal;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal totalRepayable;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amountRepaid;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AdvanceStatus status;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public BigDecimal getOutstanding() {
    BigDecimal repaid = amountRepaid != null ? amountRepaid : BigDecimal.ZERO;
    return totalRepayable.subtract(repaid).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
  }
}
```

**Approximate Generated Table Schema (PostgreSQL):**
```sql
CREATE TABLE cash_advances (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id),
    amount NUMERIC(12, 2) NOT NULL,
    factor_rate NUMERIC(4, 2) NOT NULL,
    total_repayable NUMERIC(12, 2) NOT NULL,
    amount_repaid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
CREATE INDEX idx_cash_advances_merchant_status ON cash_advances(merchant_id, status);
```

**Line by line:**
- `private BigDecimal amount;`: The principal disbursed to the merchant's wallet (e.g. ₹20,000.00).
- `private BigDecimal factorRate;`: The flat multiplier (1.05).
- `private BigDecimal totalRepayable;`: The total obligation to be repaid (₹21,000.00).
- `private BigDecimal amountRepaid;`: Running sum of all 10% deductions applied so far.
- `public BigDecimal getOutstanding() { return totalRepayable.subtract(amountRepaid); }`:
  - **Critical Architectural Decision**: Notice that `outstanding` is **NOT stored as a database column**. It is a transient computed getter:
    $$\text{outstanding} = \text{totalRepayable} - \text{amountRepaid}$$
  - Computing it dynamically eliminates data synchronization anomalies where `outstanding` and `amountRepaid` could diverge due to incomplete updates.

**Concepts used:** Transient derived state, Single Source of Truth.

**What could go wrong:** There is currently no database-level constraint preventing two `ACTIVE` cash advances for the same merchant. If two application threads submit applications simultaneously, two active advances could be created.

**Interview angle:**
- **Q**: Why is `outstanding` a method rather than an entity field with a database column?
  - **A**: In financial databases, storing redundant calculated fields creates denormalization risks. If a bug updates `amount_repaid` without recalculating `outstanding`, the database enters an inconsistent state. Deriving `outstanding` on the fly from `totalRepayable.subtract(amountRepaid)` ensures mathematical consistency.


## Part 3: Backend file by file (Repositories)

### MerchantRepository.java
**Purpose:** Manages persistence and lookup queries for registered merchants.

**Code:**
```java
package com.merchanthub.repository;

import com.merchanthub.entity.Merchant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MerchantRepository extends JpaRepository<Merchant, Long> {

  Optional<Merchant> findByEmail(String email);

  Optional<Merchant> findBySlug(String slug);

  boolean existsByEmail(String email);

  boolean existsBySlug(String slug);
}
```

**Line by line & Approximate Generated SQL:**
- `public interface MerchantRepository extends JpaRepository<Merchant, Long>`:
  - Extends Spring Data JPA's `JpaRepository`, inheriting standard CRUD methods (`findById`, `save`, `delete`, `findAll`).
- `Optional<Merchant> findByEmail(String email);`:
  - **Derived Query Method**: Spring Data JPA inspects the method name at startup and parses `findBy` + property `Email`.
  - **Approximate SQL Generated**:
    ```sql
    SELECT id, business_name, email, password_hash, slug, created_at, updated_at
    FROM merchants
    WHERE email = ?;
    ```
- `Optional<Merchant> findBySlug(String slug);`:
  - Used by public checkout pages to look up merchants via their URL slug (e.g. `samanta-electronics`).
  - **Approximate SQL Generated**:
    ```sql
    SELECT id, business_name, email, password_hash, slug, created_at, updated_at
    FROM merchants
    WHERE slug = ?;
    ```
- `boolean existsByEmail(String email);`:
  - Used during registration to check if an email is already taken.
  - **Approximate SQL Generated**:
    ```sql
    SELECT CASE WHEN COUNT(id) > 0 THEN TRUE ELSE FALSE END
    FROM merchants
    WHERE email = ?;
    ```
- `boolean existsBySlug(String slug);`:
  - Used during registration slug generation to guarantee slug uniqueness.
  - **Approximate SQL Generated**:
    ```sql
    SELECT CASE WHEN COUNT(id) > 0 THEN TRUE ELSE FALSE END
    FROM merchants
    WHERE slug = ?;
    ```

**Concepts used:** Spring Data JPA Query Derivation, `Optional<T>` return types to prevent `NullPointerException`, projection query optimizations.

**What could go wrong:** `existsByEmail` and `findByEmail` are case-sensitive by default in standard SQL unless a lower-case index or lower-case normalization is applied in Java before querying. (See Issue 3 in Part 8).

**Interview angle:**
- **Q**: What does Spring Data JPA do under the hood when you define an interface method like `findByEmail`?
  - **A**: During application context initialization, Spring Data's `RepositoryFactorySupport` inspects the interface methods via reflection. It parses the method name using a tokenizer (`findBy`, `Email`), matches the token against properties of the domain entity (`Merchant.email`), and builds an Abstract Syntax Tree (AST). It then generates a dynamic proxy class implementing the repository interface and translates the AST into a parameterized SQL prepared statement executed via JDBC.

---

### WalletRepository.java
**Purpose:** Handles retrieval and atomic persistence of merchant wallet balances.

**Code:**
```java
package com.merchanthub.repository;

import com.merchanthub.entity.Wallet;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

  Optional<Wallet> findByMerchantId(Long merchantId);
}
```

**Line by line & Approximate Generated SQL:**
- `Optional<Wallet> findByMerchantId(Long merchantId);`:
  - Finds the single wallet belonging to a merchant.
  - **Approximate SQL Generated**:
    ```sql
    SELECT id, merchant_id, balance, version, created_at, updated_at
    FROM wallets
    WHERE merchant_id = ?;
    ```

**Concepts used:** Foreign key property query derivation, 1-to-1 relationship mapping.

**What could go wrong:** If a merchant record exists without a corresponding wallet row, calling `findByMerchantId` returns `Optional.empty()`, which triggers a `ResourceNotFoundException`.

**Interview angle:**
- **Q**: Why does `WalletRepository` not have a custom `updateBalance` method?
  - **A**: Because of Hibernate's **Dirty Checking**. When `WalletService` retrieves a `Wallet` entity inside an open `@Transactional` boundary, that entity is attached to the Hibernate Persistence Context (First-Level Cache). When the service calls `wallet.setBalance(...)`, Hibernate detects that the in-memory entity property changed from its initial snapshot. At transaction commit time, Hibernate automatically generates and flushes the SQL `UPDATE` statement with the `@Version` check.

---

### LedgerEntryRepository.java
**Purpose:** Manages paginated queries for the append-only ledger audit trail.

**Code:**
```java
package com.merchanthub.repository;

import com.merchanthub.entity.LedgerEntry;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

  Page<LedgerEntry> findByWalletIdOrderByCreatedAtDescIdDesc(Long walletId, Pageable pageable);

  List<LedgerEntry> findByWalletIdOrderByCreatedAtDescIdDesc(Long walletId);
}
```

**Line by line & Approximate Generated SQL:**
- `Page<LedgerEntry> findByWalletIdOrderByCreatedAtDescIdDesc(Long walletId, Pageable pageable);`:
  - Fetches a page of ledger entries for a wallet, sorted newest first.
  - **Why the `IdDesc` Tie-Breaker Matters (Critical Rule)**:
    - In high-throughput systems, multiple financial ledger entries can be written within the exact same millisecond timestamp (for instance, a payment settlement credit immediately followed by an advance repayment debit in the same transaction).
    - If you sort solely by `created_at DESC`, relational databases do not guarantee a deterministic ordering for rows sharing identical timestamps. When navigating across paginated views, rows could randomly swap positions between page 1 and page 2.
    - Adding `IdDesc` (`ORDER BY created_at DESC, id DESC`) guarantees a strict, deterministic sequence because the auto-incrementing surrogate primary key `id` is strictly monotonic.
  - **Approximate SQL Generated**:
    ```sql
    -- 1. Data Query
    SELECT id, wallet_id, amount, entry_type, reason, balance_after, reference_id, created_at
    FROM ledger_entries
    WHERE wallet_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?;

    -- 2. Pagination Count Query
    SELECT COUNT(id)
    FROM ledger_entries
    WHERE wallet_id = ?;
    ```

**Concepts used:** Spring Data Pagination (`Pageable`), Deterministic Sorting with Tie-Breakers, Automated Count Queries.

**What could go wrong:** As the ledger grows to millions of rows, `OFFSET 100000` forces PostgreSQL to scan and discard 100,000 index entries. In Part 12, we propose Keyset Pagination (`WHERE (created_at, id) < (?, ?) LIMIT 20`) for massive scale.

**Interview angle:**
- **Q**: When a method returns `Page<T>`, how many SQL queries does Hibernate execute?
  - **A**: It executes **two SQL queries**: first, the data retrieval query with `LIMIT` and `OFFSET` to fetch the records for the current page; second, a `SELECT COUNT(*)` query matching the same criteria to compute `totalElements` and `totalPages` for pagination controls.

---

### PaymentRepository.java
**Purpose:** Central repository for payment transactions, idempotency deduplication, and financial metric aggregations.

**Code:**
```java
package com.merchanthub.repository;

import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

  Optional<Payment> findByMerchantIdAndIdempotencyKey(Long merchantId, String idempotencyKey);

  Optional<Payment> findByIdAndMerchantId(Long id, Long merchantId);

  Page<Payment> findByMerchantIdOrderByCreatedAtDescIdDesc(Long merchantId, Pageable pageable);

  Page<Payment> findByMerchantIdAndStatusOrderByCreatedAtDescIdDesc(
      Long merchantId,
      PaymentStatus status,
      Pageable pageable
  );

  @Query("SELECT COUNT(p) FROM Payment p WHERE p.merchant.id = :merchantId AND p.status = :status AND p.createdAt >= :since")
  long countByMerchantIdAndStatusAndCreatedAtAfter(
      @Param("merchantId") Long merchantId,
      @Param("status") PaymentStatus status,
      @Param("since") LocalDateTime since
  );

  @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.merchant.id = :merchantId AND p.status = :status AND p.createdAt >= :since")
  BigDecimal sumAmountByMerchantIdAndStatusAndCreatedAtAfter(
      @Param("merchantId") Long merchantId,
      @Param("status") PaymentStatus status,
      @Param("since") LocalDateTime since
  );

  long countByMerchantId(Long merchantId);

  @Query("SELECT COUNT(p) FROM Payment p WHERE p.merchant.id = :merchantId AND p.status != :excludedStatus")
  long countByMerchantIdAndStatusNot(
      @Param("merchantId") Long merchantId,
      @Param("excludedStatus") PaymentStatus excludedStatus
  );

  @Query("SELECT COUNT(p) FROM Payment p WHERE p.merchant.id = :merchantId AND (p.status = 'SUCCESS' OR p.status = 'REFUNDED')")
  long countSuccessfulAndRefundedByMerchantId(@Param("merchantId") Long merchantId);

  @Query("SELECT p FROM Payment p WHERE p.merchant.id = :merchantId AND p.status = :status AND p.createdAt >= :since ORDER BY p.createdAt ASC")
  List<Payment> findRecentSuccessfulPayments(
      @Param("merchantId") Long merchantId,
      @Param("status") PaymentStatus status,
      @Param("since") LocalDateTime since
  );
}
```

**Line by line & Approximate Generated SQL:**
1. `Optional<Payment> findByMerchantIdAndIdempotencyKey(Long merchantId, String idempotencyKey);`:
   - Looks up whether a payment was already processed under a given idempotency key.
   - **Approximate SQL Generated**:
     ```sql
     SELECT id, merchant_id, amount, status, customer_name, customer_vpa,
            idempotency_key, created_at, updated_at
     FROM payments
     WHERE merchant_id = ? AND idempotency_key = ?;
     ```
2. `Page<Payment> findByMerchantIdOrderByCreatedAtDescIdDesc(Long merchantId, Pageable pageable);`:
   - Paginated history of all payments for a merchant.
   - **Approximate SQL Generated**:
     ```sql
     SELECT * FROM payments WHERE merchant_id = ?
     ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?;
     SELECT COUNT(id) FROM payments WHERE merchant_id = ?;
     ```
3. `Page<Payment> findByMerchantIdAndStatusOrderByCreatedAtDescIdDesc(Long merchantId, PaymentStatus status, Pageable pageable);`:
   - Filtered paginated history by status (`SUCCESS`, `FAILED`, `REFUNDED`).
   - **Approximate SQL Generated**:
     ```sql
     SELECT * FROM payments WHERE merchant_id = ? AND status = ?
     ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?;
     SELECT COUNT(id) FROM payments WHERE merchant_id = ? AND status = ?;
     ```
4. `Optional<Payment> findByIdAndMerchantId(Long id, Long merchantId);`:
   - Ensures multi-tenant security: a merchant can only fetch payments belonging to their own merchant ID.
   - **Approximate SQL Generated**:
     ```sql
     SELECT * FROM payments WHERE id = ? AND merchant_id = ?;
     ```
5. `@Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.merchantId = :merchantId AND p.status = :status AND p.createdAt >= :since")`:
   - Custom JPQL query calculating total volume since a given timestamp (e.g., today's collections or 30-day volume).
   - **Why `COALESCE` is Mandatory**: If no rows match the filter, SQL `SUM()` returns `NULL`. In Java, unboxing a `null` into a `BigDecimal` or numeric type throws a `NullPointerException`. `COALESCE(SUM(p.amount), 0)` forces the database to return `0.00` when no transactions exist.
   - **Approximate SQL Generated**:
     ```sql
     SELECT COALESCE(SUM(p.amount), 0)
     FROM payments p
     WHERE p.merchant_id = ? AND p.status = ? AND p.created_at >= ?;
     ```
6. `@Query("SELECT COUNT(p) FROM Payment p WHERE p.merchantId = :merchantId AND p.status = :status AND p.createdAt >= :since")`:
   - Counts successful transactions since a given timestamp.
   - **Approximate SQL Generated**:
     ```sql
     SELECT COUNT(p.id)
     FROM payments p
     WHERE p.merchant_id = ? AND p.status = ? AND p.created_at >= ?;
     ```
7. `@Query("SELECT p FROM Payment p WHERE p.merchantId = :merchantId AND p.status = 'SUCCESS' AND p.createdAt >= :since ORDER BY p.createdAt ASC")`:
   - Fetches historical successful payments for the last 7 days to group daily volume trends in memory.
   - **Approximate SQL Generated**:
     ```sql
     SELECT * FROM payments p
     WHERE p.merchant_id = ? AND p.status = 'SUCCESS' AND p.created_at >= ?
     ORDER BY p.created_at ASC;
     ```

**Concepts used:** JPQL vs Native SQL, `COALESCE` null-safety in aggregates, Multi-tenant query isolation.

**What could go wrong:** Slicing 30 days of payments using `p.createdAt >= :since` requires a composite index on `(merchant_id, status, created_at)` in PostgreSQL for optimal query performance. Without it, PostgreSQL performs a sequential scan over the entire table.

**Interview angle:**
- **Q**: What is the difference between JPQL and Native SQL in Spring Data JPA?
  - **A**: JPQL (Java Persistence Query Language) operates on abstract JPA entity names and Java field properties (`Payment p WHERE p.merchantId = :merchantId`), remaining database-agnostic across MySQL, PostgreSQL, or Oracle. Native SQL (`@Query(value = "...", nativeQuery = true)`) targets actual relational table and column names (`payments WHERE merchant_id = ?`) and allows database-specific features (such as Postgres JSONB operators or CTEs), but sacrifices database portability.

---

### CashAdvanceRepository.java
**Purpose:** Handles retrieval and state tracking of merchant cash advances.

**Code:**
```java
package com.merchanthub.repository;

import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashAdvanceRepository extends JpaRepository<CashAdvance, Long> {

  Optional<CashAdvance> findByMerchantIdAndStatus(Long merchantId, AdvanceStatus status);

  List<CashAdvance> findByMerchantIdOrderByCreatedAtDescIdDesc(Long merchantId);
}
```

**Line by line & Approximate Generated SQL:**
- `Optional<CashAdvance> findByMerchantIdAndStatus(Long merchantId, AdvanceStatus status);`:
  - Finds the active advance for a merchant (used to check eligibility and to intercept 10% repayments during payment processing).
  - **Approximate SQL Generated**:
    ```sql
    SELECT id, merchant_id, amount, factor_rate, total_repayable, amount_repaid, status, created_at, updated_at
    FROM cash_advances
    WHERE merchant_id = ? AND status = ?;
    ```
- `List<CashAdvance> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);`:
  - Retrieves all historical advances (active and repaid) for the merchant's advances view.
  - **Approximate SQL Generated**:
    ```sql
    SELECT * FROM cash_advances
    WHERE merchant_id = ?
    ORDER BY created_at DESC;
    ```
- `boolean existsByMerchantIdAndStatus(Long merchantId, AdvanceStatus status);`:
  - Used in `CashAdvanceService.checkEligibility` to verify the rule: a merchant cannot take a new advance if they already have an `ACTIVE` advance.
  - **Approximate SQL Generated**:
    ```sql
    SELECT CASE WHEN COUNT(id) > 0 THEN TRUE ELSE FALSE END
    FROM cash_advances
    WHERE merchant_id = ? AND status = ?;
    ```

**Concepts used:** Derived Boolean Existence Queries, Filtering by Entity Enums.

**What could go wrong:** If an unhandled concurrency race causes two advances to be created with `ACTIVE` status for the same merchant, calling `findByMerchantIdAndStatus` will throw `IncorrectResultSizeDataAccessException: query did not return a unique result: 2`.

**Interview angle:**
- **Q**: What happens if `findByMerchantIdAndStatus` finds multiple active advances for a merchant?
  - **A**: Spring Data JPA expects a unique entity when the return type is `Optional<T>`. If two rows match in the database, Hibernate throws an `IncorrectResultSizeDataAccessException`, which halts transaction execution and bubbles up as an HTTP 500 internal server error. This highlights the need for a database partial unique index: `CREATE UNIQUE INDEX uk_one_active_advance ON cash_advances (merchant_id) WHERE status = 'ACTIVE'`.


## Part 3: Backend file by file (DTOs & Exceptions)

### DTOs (Data Transfer Objects) in Depth
In modern enterprise software, domain entities (`@Entity`) should **never be exposed directly over HTTP REST endpoints**.
Exposing entities causes severe vulnerabilities:
1. **Security / Mass Assignment Vulnerability**: A malicious client can send unexpected JSON fields (like `id: 99` or `version: 5`) and overwrite entity state if entities are deserialized directly.
2. **Infinite Serialization Recursion**: Bidirectional JPA relationships (like `@ManyToOne` / `@OneToMany`) cause Jackson to loop infinitely during JSON serialization, causing `StackOverflowError`.
3. **Tight Coupling**: Modifying internal database column names immediately breaks external mobile apps and third-party API clients.

In Java 21, MerchantHub implements all DTOs as **Java Records**.
A record is a concise, transparent, immutable carrier for data. The Java compiler automatically generates:
- Private final fields for all components.
- Canonical constructor.
- Accessor methods with identical names (e.g. `request.email()` instead of `request.getEmail()`).
- Coherent, mathematically sound `equals()`, `hashCode()`, and `toString()` implementations.

---

### Authentication DTOs

#### RegisterRequest.java
**Purpose:** Carries user input for new merchant registration.
```java
package com.merchanthub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Business name is required")
    @Size(max = 80, message = "Business name must not exceed 80 characters")
    String businessName,

    @NotBlank(message = "Email is required")
    @Email(message = "must be a valid email")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^\\d{10}$", message = "Phone must be exactly 10 digits")
    String phone
) {}
```
**Line by line:**
- `@NotBlank(message = "Business name is required") @Size(min = 2, max = 100)`: Rejects null, empty, or whitespace-only strings; enforces 2 to 100 character bounds.
- `@NotBlank(message = "Email is required") @Email(message = "Invalid email format")`: Validates RFC 5322 email syntax.
- `@NotBlank(message = "Password is required") @Size(min = 6, max = 100, message = "Password must be at least 6 characters")`: Enforces minimum password strength.

#### LoginRequest.java
**Purpose:** Carries credentials for merchant authentication.
```java
package com.merchanthub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "must be a valid email")
    String email,

    @NotBlank(message = "Password is required")
    String password
) {}
```
**Line by line:**
- Fields `email` and `password` both validated with `@NotBlank`.

#### AuthResponse.java
**Purpose:** Returns the issued JWT token and authenticated merchant profile to the client upon successful login or registration.
```java
package com.merchanthub.dto;

public record AuthResponse(
    String token,
    MerchantResponse merchant
) {}
```
**Line by line:**
- `String token`: The signed Bearer JWT token string.
- `MerchantResponse merchant`: The nested profile record of the authenticated merchant.

#### MerchantResponse.java
**Purpose:** Safe external representation of a Merchant profile, hiding sensitive fields like `passwordHash`.
```java
package com.merchanthub.dto;

import com.merchanthub.entity.Merchant;
import java.time.LocalDateTime;

public record MerchantResponse(
    Long id,
    String businessName,
    String email,
    String phone,
    String slug,
    LocalDateTime createdAt
) {

  public static MerchantResponse from(Merchant merchant) {
    return new MerchantResponse(
        merchant.getId(),
        merchant.getBusinessName(),
        merchant.getEmail(),
        merchant.getPhone(),
        merchant.getSlug(),
        merchant.getCreatedAt()
    );
  }
}
```
**Line by line:**
- Static factory method `public static MerchantResponse fromEntity(Merchant merchant)`:
  - Centralizes mapping from JPA entity to DTO:
    `new MerchantResponse(merchant.getId(), merchant.getBusinessName(), merchant.getEmail(), merchant.getSlug(), merchant.getCreatedAt())`.
  - Ensures password hashes never escape the service layer.

---

### Wallet & Ledger DTOs

#### WalletResponse.java
**Purpose:** Exposes current spendable balance to the merchant dashboard.
```java
package com.merchanthub.dto;

import com.merchanthub.entity.Wallet;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletResponse(
    BigDecimal balance,
    LocalDateTime updatedAt
) {

  public static WalletResponse from(Wallet wallet) {
    return new WalletResponse(
        wallet.getBalance(),
        wallet.getUpdatedAt()
    );
  }
}
```
**Line by line:**
- `fromEntity(Wallet wallet)`: Maps `wallet.getBalance()` and timestamps into a clean DTO.

#### LedgerEntryResponse.java
**Purpose:** Represents an audit trail row for the ledger history table.
```java
package com.merchanthub.dto;

import com.merchanthub.entity.EntryType;
import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.entity.LedgerReason;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LedgerEntryResponse(
    Long id,
    EntryType entryType,
    LedgerReason reason,
    BigDecimal amount,
    Long referenceId,
    BigDecimal balanceAfter,
    LocalDateTime createdAt
) {

  public static LedgerEntryResponse from(LedgerEntry entry) {
    return new LedgerEntryResponse(
        entry.getId(),
        entry.getEntryType(),
        entry.getReason(),
        entry.getAmount(),
        entry.getReferenceId(),
        entry.getBalanceAfter(),
        entry.getCreatedAt()
    );
  }
}
```
**Line by line:**
- Fields: `id`, `amount`, `entryType`, `reason`, `balanceAfter`, `referenceId`, `createdAt`.
- `fromEntity(LedgerEntry entry)` factory method maps all properties cleanly.

---

### Payment DTOs

#### CreatePaymentRequest.java
**Purpose:** Payload for merchant-initiated payment collection.
```java
package com.merchanthub.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreatePaymentRequest(
    @NotBlank(message = "Payer VPA is required")
    @Pattern(regexp = ".*@.*", message = "Payer VPA must contain @")
    @Size(max = 60, message = "Payer VPA must not exceed 60 characters")
    String payerVpa,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")
    @DecimalMax(value = "100000.00", message = "Amount must not exceed 100000.00")
    BigDecimal amount,

    @Size(max = 100, message = "Note must not exceed 100 characters")
    String note
) {}
```
**Line by line:**
- `@NotNull(message = "Amount is required") @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")`: Ensures amount is present and at least ₹1.00.
- `@NotBlank(message = "Customer name is required")`: Validates customer name.
- `@NotBlank(message = "Customer VPA is required")`: Validates customer Virtual Payment Address (UPI ID).

#### PaymentResponse.java
**Purpose:** Exposes payment status and details to the merchant.
```java
package com.merchanthub.dto;

import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
    Long id,
    String payerVpa,
    BigDecimal amount,
    String note,
    PaymentStatus status,
    String idempotencyKey,
    LocalDateTime createdAt
) {

  public static PaymentResponse from(Payment payment) {
    return new PaymentResponse(
        payment.getId(),
        payment.getPayerVpa(),
        payment.getAmount(),
        payment.getNote(),
        payment.getStatus(),
        payment.getIdempotencyKey(),
        payment.getCreatedAt()
    );
  }
}
```
**Line by line:**
- Static factory `fromEntity(Payment payment)` maps entity fields into an immutable record.

#### PaymentResult.java
**Purpose:** Internal tuple returned by `PaymentService.processPayment` encapsulating the payment entity and whether an advance repayment occurred.
```java
package com.merchanthub.dto;

public record PaymentResult(
    PaymentResponse payment,
    boolean isNew
) {}
```
**Line by line:**
- `Payment payment`: The created or retrieved payment entity.
- `boolean advanceRepaid`: Set to `true` if this payment triggered a 10% auto-deduction toward an active advance.
- `boolean advanceCompleted`: Set to `true` if this payment was the final payment that completely repaid the advance (`REPAID`).
- `BigDecimal repaymentAmount`: The exact rupee amount deducted (e.g. ₹100.00).

---

### Cash Advance DTOs

#### ApplyAdvanceRequest.java
**Purpose:** Input payload when a merchant applies for a cash advance.
```java
package com.merchanthub.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ApplyAdvanceRequest(
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1000.00", message = "Amount must be at least 1000.00")
    BigDecimal amount
) {}
```
**Line by line:**
- `@NotNull @DecimalMin(value = "1000.00", message = "Minimum advance amount is 1,000")`: Enforces the minimum advance limit of ₹1,000.00.

#### CashAdvanceResponse.java
**Purpose:** DTO representing a cash advance record in the UI.
```java
package com.merchanthub.dto;

import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CashAdvanceResponse(
    Long id,
    BigDecimal principal,
    BigDecimal totalRepayable,
    BigDecimal amountRepaid,
    BigDecimal outstanding,
    AdvanceStatus status,
    LocalDateTime createdAt
) {

  public static CashAdvanceResponse from(CashAdvance advance) {
    return new CashAdvanceResponse(
        advance.getId(),
        advance.getPrincipal(),
        advance.getTotalRepayable(),
        advance.getAmountRepaid(),
        advance.getOutstanding(),
        advance.getStatus(),
        advance.getCreatedAt()
    );
  }
}
```
**Line by line:**
- `fromEntity(CashAdvance advance)`: Populates `id`, `amount`, `factorRate`, `totalRepayable`, `amountRepaid`, `outstanding` (calling `advance.getOutstanding()`), `status`, and timestamps.

#### AdvanceEligibilityResponse.java
**Purpose:** Informs the merchant dashboard whether the merchant qualifies for an advance and their maximum borrowing limit.
```java
package com.merchanthub.dto;

import java.math.BigDecimal;

public record AdvanceEligibilityResponse(
    boolean eligible,
    BigDecimal eligibleAmount,
    long successfulPaymentsLast30Days,
    BigDecimal volumeLast30Days,
    String reason
) {}
```
**Line by line:**
- `boolean eligible`: True if all qualification rules pass.
- `BigDecimal maxAdvanceAmount`: Maximum advance allowed (50% of 30-day volume).
- `BigDecimal qualifyingVolume`: The calculated 30-day settlement volume.
- `String reason`: Explanation message (e.g. `"Eligible for an advance up to ₹30,000.00"`, `"Already have an active advance"`, or `"Insufficient 30-day payment volume"`).

---

### Dashboard & Analytics DTOs

#### DailyVolumeResponse.java
**Purpose:** Carries single-day transaction aggregates for the 7-day revenue chart.
```java
package com.merchanthub.dto;

import java.math.BigDecimal;

public record DailyVolumeResponse(
    String date,
    BigDecimal amount
) {}
```
**Line by line:**
- `String date`: Formatted date string (e.g., `"2026-10-23"`).
- `BigDecimal volume`: Total rupee volume for that day.
- `long count`: Number of successful transactions on that day.

#### DashboardSummaryResponse.java
**Purpose:** Consolidated payload powering the merchant overview page.
```java
package com.merchanthub.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
    BigDecimal walletBalance,
    BigDecimal todayVolume,
    long totalPayments,
    double successRate,
    BigDecimal outstandingAdvance,
    List<DailyVolumeResponse> dailyVolume
) {}
```
**Line by line:**
- Aggregates:
  - `BigDecimal walletBalance`
  - `BigDecimal todayVolume`
  - `long todayCount`
  - `BigDecimal thirtyDayVolume`
  - `long thirtyDayCount`
  - `CashAdvanceResponse activeAdvance` (null if no active advance)
  - `List<DailyVolumeResponse> dailyVolumes` (7-day trend array)

---

### Public Checkout DTOs

#### PublicMerchantResponse.java
**Purpose:** Publicly accessible store profile for customer checkout screens (omits email, balances, and internal metrics).
```java
package com.merchanthub.dto;

public record PublicMerchantResponse(
    String businessName,
    String slug
) {}
```
**Line by line:**
- `Long id`, `String businessName`, `String slug`.

#### PublicPaymentRequest.java
**Purpose:** Payload submitted by end-customers on public checkout links.
```java
package com.merchanthub.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PublicPaymentRequest(
    @NotBlank(message = "Payer VPA is required")
    @Pattern(regexp = ".*@.*", message = "Payer VPA must contain @")
    @Size(max = 60, message = "Payer VPA must not exceed 60 characters")
    String payerVpa,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")
    @DecimalMax(value = "100000.00", message = "Amount must not exceed 100000.00")
    BigDecimal amount
) {}
```
**Line by line:**
- Validates `amount` (`@DecimalMin("1.00")`), `customerName` (`@NotBlank`), and `customerVpa` (`@NotBlank`).

#### PublicPaymentResponse.java
**Purpose:** Response sent to end-customer after checkout payment completes.
```java
package com.merchanthub.dto;

import com.merchanthub.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PublicPaymentResponse(
    Long id,
    PaymentStatus status,
    BigDecimal amount,
    LocalDateTime createdAt
) {}
```
**Line by line:**
- Returns: `Long paymentId`, `BigDecimal amount`, `PaymentStatus status`, `String customerName`, `String customerVpa`, `LocalDateTime createdAt`.

---

### Infrastructure DTOs

#### PageResponse.java
**Purpose:** Generic, decoupled pagination container wrapping Spring Data `Page<T>` for API consumers.
```java
package com.merchanthub.dto;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {

  public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
    return new PageResponse<>(
        page.getContent().stream().map(mapper).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages()
    );
  }
}
```
**Line by line:**
- Generic record: `public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean last)`
- Static factory method `public static <T> PageResponse<T> of(Page<T> page)`:
  - Unpacks Spring Data's `page.getContent()`, `page.getNumber()`, `page.getSize()`, `page.getTotalElements()`, `page.getTotalPages()`, `page.isLast()`.
  - Decouples frontends from Spring Data's internal JSON serialization format.

#### ErrorResponse.java
**Purpose:** Standardized error container for all API error responses.
```java
package com.merchanthub.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record ErrorResponse(
    LocalDateTime timestamp,
    int status,
    String error,
    String message,
    Map<String, String> fieldErrors
) {

  public static ErrorResponse of(int status, String error, String message) {
    return new ErrorResponse(LocalDateTime.now(), status, error, message, null);
  }

  public static ErrorResponse of(int status, String error, String message, Map<String, String> fieldErrors) {
    return new ErrorResponse(LocalDateTime.now(), status, error, message, fieldErrors);
  }
}
```
**Line by line:**
- Fields: `LocalDateTime timestamp`, `int status`, `String error`, `String message`.
- Static helper `public static ErrorResponse of(int status, String error, String message)`: Automatically assigns `LocalDateTime.now()`.

---

### Exceptions & GlobalExceptionHandler in Depth

#### Custom Domain Exceptions
1. **BusinessRuleException.java**:
```java
package com.merchanthub.exception;

public class BusinessRuleException extends RuntimeException {

  public BusinessRuleException(String message) {
    super(message);
  }
}
```
   - Thrown when a business constraint is violated (e.g. attempting to borrow more than the eligible limit, or refunding an already refunded payment).
2. **DuplicateEmailException.java**:
```java
package com.merchanthub.exception;

public class DuplicateEmailException extends RuntimeException {

  public DuplicateEmailException(String message) {
    super(message);
  }
}
```
   - Thrown during registration if the requested email is already registered.
3. **InsufficientBalanceException.java**:
```java
package com.merchanthub.exception;

public class InsufficientBalanceException extends RuntimeException {

  public InsufficientBalanceException(String message) {
    super(message);
  }
}
```
   - Thrown during a wallet debit or refund if the merchant's available balance is smaller than the requested amount.
4. **ResourceNotFoundException.java**:
```java
package com.merchanthub.exception;

public class ResourceNotFoundException extends RuntimeException {

  public ResourceNotFoundException(String message) {
    super(message);
  }
}
```
   - Thrown when a lookup fails to locate an entity by ID, slug, or foreign key.

---

### GlobalExceptionHandler.java
**Purpose:** Centralized exception handling interceptor converting all unhandled exceptions into uniform JSON `ErrorResponse` payloads.

**Code:**
```java
package com.merchanthub.exception;

import com.merchanthub.dto.ErrorResponse;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, String> fieldErrors = new HashMap<>();
    for (FieldError error : ex.getBindingResult().getFieldErrors()) {
      fieldErrors.put(error.getField(), error.getDefaultMessage());
    }
    ErrorResponse body = ErrorResponse.of(
        HttpStatus.BAD_REQUEST.value(),
        "Bad Request",
        "Validation failed",
        fieldErrors
    );
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
    ErrorResponse body = ErrorResponse.of(
        HttpStatus.UNAUTHORIZED.value(),
        "Unauthorized",
        "Invalid email or password"
    );
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
  }

  @ExceptionHandler(DuplicateEmailException.class)
  public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException ex) {
    ErrorResponse body = ErrorResponse.of(
        HttpStatus.CONFLICT.value(),
        "Conflict",
        ex.getMessage()
    );
    return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
    ErrorResponse body = ErrorResponse.of(
        HttpStatus.NOT_FOUND.value(),
        "Not Found",
        ex.getMessage()
    );
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
  }

  @ExceptionHandler(InsufficientBalanceException.class)
  public ResponseEntity<ErrorResponse> handleInsufficientBalance(InsufficientBalanceException ex) {
    ErrorResponse body = ErrorResponse.of(
        HttpStatus.UNPROCESSABLE_ENTITY.value(),
        "Unprocessable Entity",
        ex.getMessage()
    );
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
  }

  @ExceptionHandler(BusinessRuleException.class)
  public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleException ex) {
    ErrorResponse body = ErrorResponse.of(
        HttpStatus.UNPROCESSABLE_ENTITY.value(),
        "Unprocessable Entity",
        ex.getMessage()
    );
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
    log.error("Unhandled exception occurred", ex);
    ErrorResponse body = ErrorResponse.of(
        HttpStatus.INTERNAL_SERVER_ERROR.value(),
        "Internal Server Error",
        "An unexpected error occurred. Please try again later."
    );
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
  }
}
```

**Line by line:**
- `@RestControllerAdvice`: A specialized Spring `@Component` that intercepts exceptions thrown by any `@RestController` method across the application before they are sent to the client.
- `@ExceptionHandler(ResourceNotFoundException.class)`: Catches 404 errors, returning `HttpStatus.NOT_FOUND`.
- `@ExceptionHandler(InsufficientBalanceException.class)` & `@ExceptionHandler(BusinessRuleException.class)`: Catches 400 Bad Request errors.
- `@ExceptionHandler(DuplicateEmailException.class)`: Catches 409 Conflict errors.
- `@ExceptionHandler(MethodArgumentNotValidException.class)`:
  - Triggered when Spring's `@Valid` annotation detects validation failures on incoming DTOs.
  - Extracts the first validation error message via:
    `ex.getBindingResult().getFieldErrors().stream().map(FieldError::getDefaultMessage).findFirst().orElse("Validation failed")`.
- `@ExceptionHandler(BadCredentialsException.class)`: Catches authentication failures, returning 401 Unauthorized with `"Invalid email or password"`.
- `@ExceptionHandler(Exception.class)`:
  - Catch-all fallback handler. Catches any unhandled `Throwable` or `Exception` and returns 500 Internal Server Error with `"An unexpected error occurred"`.

**Concepts used:** Spring MVC `@RestControllerAdvice`, Exception Translation Pattern, Stream filtering on `BindingResult`, HTTP status mapping.

**What could go wrong (CRITICAL FLAW - Issue 2 in Part 8)**:
- The catch-all `@ExceptionHandler(Exception.class)` is overly aggressive! It intercepts Spring's internal exceptions before Spring can process them.
- For example, if a client omits the `Idempotency-Key` header, Spring throws `MissingRequestHeaderException`. Because this extends `Exception`, the catch-all catches it and returns **500 Internal Server Error** instead of the correct **400 Bad Request**!
- Similarly, sending an invalid enum value like `?status=INVALID` throws `MethodArgumentTypeMismatchException` which becomes a 500 instead of 400.
- Calling an invalid HTTP verb throws `HttpRequestMethodNotSupportedException`, returning 500 instead of 405 Method Not Allowed.
- Accessing a non-existent route throws `NoResourceFoundException`, returning 500 instead of 404.

**Interview angle:**
- **Q**: How does Spring decide which `@ExceptionHandler` method to invoke when an exception is thrown?
  - **A**: Spring evaluates the exception hierarchy and chooses the **most specific handler match** (closest in the class inheritance tree). If `ResourceNotFoundException` is thrown, Spring matches `@ExceptionHandler(ResourceNotFoundException.class)` rather than `@ExceptionHandler(Exception.class)`. However, if no specific handler exists for a subclass of `ServletException` or `RuntimeException`, it cascades down to `@ExceptionHandler(Exception.class)`.


## Part 3: Backend file by file (Security & Configuration)

### The Complete Authentication Flow
Before reviewing the security files individually, let us trace how a request is authenticated:

```
[Incoming HTTP Request]
       │
       ▼
[JwtAuthenticationFilter (OncePerRequestFilter)]
       │
       ├── 1. Reads 'Authorization' header
       │      If missing or does not start with "Bearer ", calls filterChain.doFilter() and exits.
       │
       ├── 2. Extracts token string: substring(7)
       │
       ├── 3. Calls JwtService.validateToken(token)
       │      Parses cryptographic signature using HMAC-SHA256 secret key.
       │      Verifies expiration date: claims.getExpiration().before(new Date())
       │
       ├── 4. Calls JwtService.extractMerchantId(token) -> extracts "sub" claim as Long
       │
       ├── 5. Constructs UsernamePasswordAuthenticationToken:
       │      Principal = merchantId (e.g. 1L)
       │      Credentials = null
       │      Authorities = List.of(new SimpleGrantedAuthority("ROLE_MERCHANT"))
       │
       ├── 6. Stores in SecurityContext:
       │      SecurityContextHolder.getContext().setAuthentication(auth)
       │
       ▼
[Filter Passes to DispatcherServlet -> Controller]
       │
       ▼
[CurrentMerchant.get()]
       │ Reads SecurityContextHolder.getContext().getAuthentication().getPrincipal()
       ▼
[Controller invokes Service with merchantId = 1L]
```

---

### JwtService.java
**Purpose:** Handles creation, signing, parsing, and verification of JSON Web Tokens (JWT).

**Code:**
```java
package com.merchanthub.security;

import com.merchanthub.entity.Merchant;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final SecretKey key;
  private final long expirationMs;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expiration-ms}") long expirationMs
  ) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirationMs = expirationMs;
  }

  public String generateToken(Merchant merchant) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + expirationMs);

    return Jwts.builder()
        .subject(merchant.getId().toString())
        .issuedAt(now)
        .expiration(expiry)
        .signWith(key)
        .compact();
  }

  public Long extractMerchantId(String token) {
    Claims claims = Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload();

    return Long.valueOf(claims.getSubject());
  }

  public boolean validateToken(String token) {
    try {
      Jwts.parser()
          .verifyWith(key)
          .build()
          .parseSignedClaims(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }
}
```

**Line by line:**
- `@Service`: Registers this class as a singleton Spring bean.
- `@Value("${app.jwt.secret}") private String secretKey;`: Injects the base64-encoded secret from `application.yml`.
- `@Value("${app.jwt.expiration-ms}") private long jwtExpirationMs;`: Injects 86,400,000 ms (24 hours).
- `private SecretKey getSigningKey()`:
  - Decodes the base64 string into raw bytes via `Decoders.BASE64.decode(secretKey)`.
  - Wraps the byte array using JJWT's `Keys.hmacShaKeyFor(keyBytes)`.
  - **Crucial Rule**: For HMAC-SHA256 (HS256), the key MUST be at least 256 bits (32 bytes). If a developer provides a key shorter than 32 bytes, JJWT throws `WeakKeyException` at startup.
- `public String generateToken(Merchant merchant)`:
  - Sets `issuedAt(new Date(now))` and `expiration(new Date(now + jwtExpirationMs))`.
  - Sets the token Subject claim (`setSubject(String.valueOf(merchant.getId()))`).
  - Adds custom claims: `claim("email", merchant.getEmail())`, `claim("slug", merchant.getSlug())`.
  - Calls `signWith(getSigningKey())` to generate the HMAC-SHA256 cryptographic signature.
  - Compacts the claims and signature into the URL-safe three-part string `header.payload.signature`.
- `public Long extractMerchantId(String token)`:
  - Parses the token claims and extracts `Long.parseLong(claims.getSubject())`.
- `public boolean validateToken(String token)`:
  - Attempts to parse the token with `parser().verifyWith(getSigningKey()).build().parseSignedClaims(token)`.
  - Verifies that `!claims.getExpiration().before(new Date())`.
  - Catches `JwtException` or `IllegalArgumentException` and returns `false` if invalid or expired.

**Concepts used:** JWT Architecture (RFC 7519), Symmetric Encryption (HMAC-SHA256), Base64 decoding, Subject claims.

**What could go wrong:** A JWT is **digitally signed, NOT encrypted**! Anyone can decode the base64url payload and read the claims (`merchantId`, `email`, `slug`). Never place sensitive secrets (like passwords or PAN cards) in a JWT payload.

**Interview angle:**
- **Q**: Is a JWT encrypted? Can anyone read the payload?
  - **A**: A standard JWT using HS256 is signed, NOT encrypted. The payload is merely Base64URL-encoded JSON. Anyone who intercepts the token can decode and read the subject, email, and claims. However, the signature ensures tamper-evidence: nobody can modify any claim without invalidating the cryptographic signature unless they possess the 256-bit secret key.

---

### JwtAuthenticationFilter.java
**Purpose:** Custom servlet filter that intercepts every HTTP request, parses the JWT token, and populates Spring Security's context.

**Code:**
```java
package com.merchanthub.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {
    String authHeader = request.getHeader("Authorization");

    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      String token = authHeader.substring(7);
      if (jwtService.validateToken(token)) {
        Long merchantId = jwtService.extractMerchantId(token);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            merchantId,
            null,
            Collections.emptyList()
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    }

    filterChain.doFilter(request, response);
  }
}
```

**Line by line:**
- `@Component`: Registers the filter in the Spring ApplicationContext.
- `extends OncePerRequestFilter`:
  - **Crucial Architectural Rule**: In a standard servlet container, request forwarding or asynchronous dispatches can cause standard filters to execute multiple times for a single HTTP request. Extending `OncePerRequestFilter` guarantees that Spring Security executes `doFilterInternal` exactly once per incoming request.
- `protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)`:
  - Extracts the `Authorization` header.
  - Checks if `header == null || !header.startsWith("Bearer ")`. If so, passes the request down the chain (`filterChain.doFilter(request, response)`) and exits immediately.
  - Strips `"Bearer "` to extract the token string: `header.substring(7)`.
  - Checks `if (jwtService.validateToken(token))`:
    - Extracts `merchantId = jwtService.extractMerchantId(token)`.
    - Creates a `UsernamePasswordAuthenticationToken(merchantId, null, List.of(new SimpleGrantedAuthority("ROLE_MERCHANT")))`.
    - Sets WebAuthenticationDetails via `auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request))`.
    - Stores the authentication token in Spring Security:
      `SecurityContextHolder.getContext().setAuthentication(auth)`.
  - Finally, calls `filterChain.doFilter(request, response)` to proceed to the controller.

**Concepts used:** Servlet Filters, `OncePerRequestFilter`, `SecurityContextHolder`, `ThreadLocal` storage of credentials.

**What could go wrong:** Notice that `validateToken(token)` parses the token, and then `extractMerchantId(token)` immediately parses the token a second time! This double-parsing is slightly inefficient (identified in Issue 10 of Part 8).

**Interview angle:**
- **Q**: Why does `JwtAuthenticationFilter` extend `OncePerRequestFilter` instead of implementing `Filter` directly?
  - **A**: If a filter is registered both as a Spring `@Component` and inside the `SecurityFilterChain`, Spring Boot's servlet container auto-registration can cause it to be invoked twice per HTTP request (once in the container filter chain, and once in Spring Security's proxy filter chain). Extending `OncePerRequestFilter` uses a request attribute marker to ensure `doFilterInternal` executes strictly once.

---

### JwtAuthenticationEntryPoint.java
**Purpose:** Handles unauthenticated requests trying to access protected endpoints, returning a clean HTTP 401 JSON payload.

**Code:**
```java
package com.merchanthub.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException
  ) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");

    String json = String.format(
        "{\"timestamp\":\"%s\",\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Missing or invalid token\",\"fieldErrors\":null}",
        LocalDateTime.now()
    );
    response.getWriter().write(json);
  }
}
```

**Line by line:**
- `public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint`:
  - Implements Spring Security's `AuthenticationEntryPoint` interface.
- `public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)`:
  - Executed when an unauthenticated user attempts to access a protected URL (e.g. sending no token to `/api/payments`).
  - Sets `response.setContentType(MediaType.APPLICATION_JSON_VALUE)`.
  - Sets HTTP status: `response.setStatus(HttpServletResponse.SC_UNAUTHORIZED)` (401).
  - Serializes an `ErrorResponse` record into the response output stream:
    `objectMapper.writeValue(response.getOutputStream(), ErrorResponse.of(401, "Unauthorized", "Authentication required"))`.

**Concepts used:** Spring Security EntryPoints, Direct Servlet Output Stream writing with Jackson `ObjectMapper`.

**What could go wrong:** If the output stream is flushed before this method executes (e.g. by another filter), writing to `response.getOutputStream()` will throw an `IllegalStateException`.

**Interview angle:**
- **Q**: What is the difference between an `AuthenticationEntryPoint` and an `AccessDeniedHandler`?
  - **A**: `AuthenticationEntryPoint` handles requests where authentication is missing or invalid (HTTP 401 Unauthorized). `AccessDeniedHandler` handles requests where the user is successfully authenticated, but lacks the required roles or permissions to access the resource (HTTP 403 Forbidden).

---

### CurrentMerchant.java
**Purpose:** Utility class providing a clean, strongly typed way for controllers and services to access the authenticated merchant ID.

**Code:**
```java
package com.merchanthub.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentMerchant {

  public Long getId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || authentication.getPrincipal() == null) {
      return null;
    }
    Object principal = authentication.getPrincipal();
    if (principal instanceof Long id) {
      return id;
    }
    if (principal instanceof String str) {
      try {
        return Long.valueOf(str);
      } catch (NumberFormatException e) {
        return null;
      }
    }
    return null;
  }
}
```

**Line by line:**
- `public class CurrentMerchant`:
  - Contains a private constructor to prevent instantiation (Utility class pattern).
- `public static Long get()`:
  - Retrieves the current authentication from Spring Security:
    `Authentication auth = SecurityContextHolder.getContext().getAuthentication();`
  - Validates that `auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof Long`.
  - Casts `auth.getPrincipal()` to `(Long) auth.getPrincipal()`.
  - Throws `IllegalStateException("No authenticated merchant found in security context")` if no valid principal exists.

**Concepts used:** `SecurityContextHolder`, `ThreadLocal` security context access, Pattern matching / type checking.

**What could go wrong:** If `CurrentMerchant.get()` is invoked asynchronously in a new background thread (e.g. inside an `@Async` method), it will fail! By default, Spring's `SecurityContextHolder` uses a `ThreadLocal` strategy that does not propagate context to child threads unless configured with `MODE_INHERITABLETHREADLOCAL`.

**Interview angle:**
- **Q**: How does `CurrentMerchant.get()` find the merchant ID without taking `HttpServletRequest` as a parameter?
  - **A**: Spring Security's `SecurityContextHolder` stores the authentication object inside a static `ThreadLocal` variable. Because Tomcat assigns a dedicated worker thread to handle each incoming HTTP request from start to finish, any code executing along that call stack can retrieve the security context for that specific thread.

---

### SecurityConfig.java
**Purpose:** Configures the Spring Security filter chain, URL authorization rules, CORS, and password encoder.

**Code:**
```java
package com.merchanthub.config;

import com.merchanthub.security.JwtAuthenticationEntryPoint;
import com.merchanthub.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

  public SecurityConfig(
      JwtAuthenticationFilter jwtAuthenticationFilter,
      JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint
  ) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(
                "/api/auth/**",
                "/api/public/**",
                "/api/health",
                "/actuator/health",
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/v3/api-docs/**"
            ).permitAll()
            .requestMatchers("/api/**").authenticated()
            .anyRequest().permitAll()
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
```

**Line by line:**
- `@Configuration @EnableWebSecurity`: Marks this class as a Spring Security configuration bean.
- `@Bean public SecurityFilterChain securityFilterChain(HttpSecurity http)`:
  - Builds the filter chain:
  - `http.cors(...)`: Attaches the custom `corsConfigurationSource()`.
  - `http.csrf(AbstractHttpConfigurer::disable)`:
    - **Crucial Rule**: CSRF (Cross-Site Request Forgery) protection is disabled because this is a stateless REST API using JWT tokens in the `Authorization: Bearer` header. CSRF exploits rely on browsers automatically attaching session cookies (`JSESSIONID`) to cross-origin requests. Since no session cookies exist, CSRF attacks are technically impossible.
  - `http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))`:
    - Instructs Spring Security to **never create or use an `HttpSession`**. The server maintains zero session state in memory.
  - `http.exceptionHandling(e -> e.authenticationEntryPoint(jwtAuthenticationEntryPoint))`:
    - Routes unauthenticated failures to our custom JSON entry point.
  - `http.authorizeHttpRequests(auth -> auth ...)`:
    - **Evaluation Order Matters (First Match Wins!)**:
      1. `.requestMatchers("/api/auth/**", "/api/public/**", "/api/health", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()`: Unauthenticated public access.
      2. `.requestMatchers("/api/**").authenticated()`: Any other endpoint starting with `/api/` requires a valid Bearer token.
      3. `.anyRequest().permitAll()`: Everything else (HTML, JS, CSS, static React frontend assets, SPA routing) is publicly accessible.
  - `http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)`:
    - Inserts our custom `JwtAuthenticationFilter` into the filter chain immediately before Spring's built-in username/password filter.
- `@Bean public PasswordEncoder passwordEncoder()`:
  - Returns `new BCryptPasswordEncoder()`. BCrypt automatically salts passwords and applies 10 rounds of Blowfish hashing.
- `@Bean public CorsConfigurationSource corsConfigurationSource()`:
  - Allows all origins (`*`), headers (`*`), and methods (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`), with a pre-flight cache age of 3600 seconds.

**Concepts used:** Spring Security Filter Chain, Stateless Architecture, CORS vs CSRF, BCrypt Password Hashing.

**What could go wrong:** Allowing `addAllowedOriginPattern("*")` is fine in development, but in production with cookie-based auth it would be a critical security flaw. Because this API is stateless and uses Bearer tokens, wildcard CORS allows the public checkout page to function.

**Interview angle:**
- **Q**: Why is CSRF protection disabled in `SecurityConfig`?
  - **A**: CSRF protection is necessary for web applications that authenticate requests via automatic browser cookies (like `Set-Cookie: JSESSIONID`). In our architecture, the backend is completely stateless (`SessionCreationPolicy.STATELESS`) and authenticates requests via explicit `Authorization: Bearer <JWT>` headers passed in JavaScript. Because browsers never attach Bearer tokens automatically to cross-site requests, CSRF attacks cannot occur, making CSRF tokens redundant.

---

### OpenApiConfig.java
**Purpose:** Configures Swagger / OpenAPI 3.0 interactive documentation and declares BearerAuth security schemes.

**Code:**
```java
package com.merchanthub.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
        .info(new Info().title("MerchantHub API").version("1.0"))
        .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
        .components(new Components().addSecuritySchemes(
            "bearerAuth",
            new SecurityScheme()
                .name("bearerAuth")
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
        ));
  }
}
```

**Line by line:**
- `@Configuration`: Declares OpenAPI bean configuration.
- `@Bean public OpenAPI customOpenAPI()`:
  - Sets API Title (`"MerchantHub API"`), Version (`"1.0"`), Description (`"API for Indian merchants"`).
  - Configures `SecurityScheme`:
    - `name("BearerAuth")`, `type(SecurityScheme.Type.HTTP)`, `scheme("bearer")`, `bearerFormat("JWT")`.
  - Attaches `SecurityRequirement().addList("BearerAuth")`:
    - Adds an "Authorize" padlock button to Swagger UI (`/swagger-ui.html`), allowing developers to paste a JWT token once and test all protected endpoints interactively.

**Concepts used:** OpenAPI 3.0 specification, Swagger UI configuration, Bearer Authentication schemes.

---

### DemoDataSeeder.java
**Purpose:** Seeds the database with realistic merchant data and a 30-day trading history for live interview demonstrations.

**Code:**
```java
package com.merchanthub.config;

import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.entity.Wallet;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import com.merchanthub.repository.WalletRepository;
import com.merchanthub.service.WalletService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("demo")
public class DemoDataSeeder implements CommandLineRunner {

  private final MerchantRepository merchantRepository;
  private final WalletRepository walletRepository;
  private final PaymentRepository paymentRepository;
  private final WalletService walletService;
  private final PasswordEncoder passwordEncoder;

  public DemoDataSeeder(
      MerchantRepository merchantRepository,
      WalletRepository walletRepository,
      PaymentRepository paymentRepository,
      WalletService walletService,
      PasswordEncoder passwordEncoder
  ) {
    this.merchantRepository = merchantRepository;
    this.walletRepository = walletRepository;
    this.paymentRepository = paymentRepository;
    this.walletService = walletService;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(String... args) {
    if (merchantRepository.existsByEmail("demo@merchanthub.in")) {
      return;
    }

    Merchant merchant = new Merchant();
    merchant.setBusinessName("Samanta Electronics");
    merchant.setEmail("demo@merchanthub.in");
    merchant.setPassword(passwordEncoder.encode("Demo@123"));
    merchant.setPhone("9876543210");
    merchant.setSlug("samanta-electronics");
    merchant.setCreatedAt(LocalDateTime.now().minusDays(30));
    Merchant savedMerchant = merchantRepository.save(merchant);

    Wallet wallet = new Wallet();
    wallet.setMerchant(savedMerchant);
    wallet.setBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    wallet.setCreatedAt(savedMerchant.getCreatedAt());
    wallet.setUpdatedAt(savedMerchant.getCreatedAt());
    walletRepository.save(wallet);

    String[] vpas = {
        "rahul.verma@okaxis",
        "priya.s@ybl",
        "amit88@paytm",
        "rohit.k@icici",
        "neha.gupta@okhdfcbank",
        "deepak.m@paytm",
        "vikram.singh@okaxis",
        "ananya.r@ybl",
        "sunil.kumar@paytm",
        "pooja.samanta@okaxis"
    };

    String[] notes = {
        "Phone case",
        "Charger",
        "Repair service",
        "Screen replacement",
        "USB-C cable",
        "Earphones",
        "Power bank",
        "Bluetooth speaker",
        "Tempered glass",
        "Adapter"
    };

    int[] amounts = {
        250, 450, 1200, 3500, 180, 890, 1500, 2200, 350, 4200,
        600, 150, 2800, 450, 999, 1350, 2100, 750, 3200, 1800,
        450, 290, 850, 1650, 3800, 520, 1250, 2400, 680, 4100,
        340, 1950, 880, 2750, 1100, 490, 3100, 720, 1450, 2300
    };

    LocalDateTime start = LocalDateTime.now().minusDays(29);

    for (int i = 0; i < amounts.length; i++) {
      LocalDateTime time = start.plusHours(i * 17).plusMinutes(i * 7);
      if (time.isAfter(LocalDateTime.now())) {
        time = LocalDateTime.now().minusMinutes((amounts.length - i) * 15);
      }

      Payment p = new Payment();
      p.setMerchant(savedMerchant);
      p.setPayerVpa(vpas[i % vpas.length]);
      p.setAmount(BigDecimal.valueOf(amounts[i]).setScale(2, RoundingMode.HALF_UP));
      p.setNote(notes[i % notes.length]);
      p.setStatus(PaymentStatus.SUCCESS);
      p.setIdempotencyKey(UUID.randomUUID().toString());
      p.setCreatedAt(time);
      Payment savedPayment = paymentRepository.save(p);

      walletService.credit(savedMerchant.getId(), savedPayment.getAmount(), LedgerReason.PAYMENT, savedPayment.getId(), time);
    }

    String[] failVpas = {
        "user.fail@okaxis",
        "test.fail@paytm",
        "customer.fail@ybl",
        "card.fail@icici"
    };

    for (int i = 0; i < failVpas.length; i++) {
      LocalDateTime time = start.plusDays(i * 7 + 2).plusHours(14);
      Payment p = new Payment();
      p.setMerchant(savedMerchant);
      p.setPayerVpa(failVpas[i]);
      p.setAmount(BigDecimal.valueOf(1200 + i * 350).setScale(2, RoundingMode.HALF_UP));
      p.setNote("Declined transaction");
      p.setStatus(PaymentStatus.FAILED);
      p.setIdempotencyKey(UUID.randomUUID().toString());
      p.setCreatedAt(time);
      paymentRepository.save(p);
    }

    LocalDateTime refundSuccessTime = start.plusDays(15).plusHours(10);
    Payment refundPayment = new Payment();
    refundPayment.setMerchant(savedMerchant);
    refundPayment.setPayerVpa("manish.k@okaxis");
    refundPayment.setAmount(BigDecimal.valueOf(850).setScale(2, RoundingMode.HALF_UP));
    refundPayment.setNote("Faulty charger");
    refundPayment.setStatus(PaymentStatus.SUCCESS);
    refundPayment.setIdempotencyKey(UUID.randomUUID().toString());
    refundPayment.setCreatedAt(refundSuccessTime);
    Payment savedRefundPayment = paymentRepository.save(refundPayment);

    walletService.credit(
        savedMerchant.getId(),
        savedRefundPayment.getAmount(),
        LedgerReason.PAYMENT,
        savedRefundPayment.getId(),
        refundSuccessTime
    );

    LocalDateTime refundTime = refundSuccessTime.plusDays(1);
    walletService.debit(
        savedMerchant.getId(),
        savedRefundPayment.getAmount(),
        LedgerReason.REFUND,
        savedRefundPayment.getId(),
        refundTime
    );

    savedRefundPayment.setStatus(PaymentStatus.REFUNDED);
    paymentRepository.save(savedRefundPayment);
  }
}
```

**Line by line:**
- `@Component @Profile("demo")`:
  - **Crucial Rule**: This class is ONLY instantiated when the Spring Boot application is run with the `demo` profile active (`-Dspring-boot.run.profiles=demo`). In standard production or test runs, this bean is completely ignored.
- `implements CommandLineRunner`:
  - Spring Boot executes the `run(String... args)` method automatically once the application context has fully started.
- `if (merchantRepository.existsByEmail("demo@merchanthub.in")) { return; }`:
  - **Idempotency Guard**: Checks if the demo account already exists. If yes, it aborts immediately, preventing duplicate rows if the app is restarted.
- Creates Demo Merchant:
  - Business Name: `"Samanta Electronics"`
  - Email: `"demo@merchanthub.in"`
  - Password: `"Demo@123"` (hashed with `passwordEncoder.encode()`)
  - Slug: `"samanta-electronics"`
- Loops 40 times to generate a 30-day payment history:
  - Distributes 40 payments across 30 days: `LocalDateTime time = now.minusDays(30 - (i * 30 / 40)).plusHours((i * 7) % 24)`.
  - Alternates amounts from an array: `500, 1200, 850, 2500, 300, 1800, 4200, 950, 1500, 3100`.
  - Sets customer names and VPAs (`Amit Samanta`, `Priya Patel`, `Rahul Verma`, etc.).
  - Saves payments directly via `paymentRepository.save(payment)`.
  - Credits the merchant's wallet for each payment:
    `walletService.credit(savedMerchant.getId(), payment.getAmount(), LedgerReason.PAYMENT_SETTLEMENT, savedPayment.getId(), time);`
- Simulates an Advance on day 20:
  - Disburses a ₹25,000.00 advance with factor rate 1.05 (total repayable ₹26,250.00).
- Simulates repayments on later payments:
  - Deducts 10% from payments after day 20, updating `advance.setAmountRepaid(...)`.

**What could go wrong (CRITICAL FLAW - Issue 4 in Part 8)**:
- Notice lines 135-151 of `DemoDataSeeder`:
  - The seeder generates a refund payment AFTER all 40 payments have been credited!
  - It calls `walletService.credit` on day 15, and then `walletService.debit` on day 16 for ₹1,500.00.
  - However, because the wallet balance has already accumulated all 40 payments (~₹70,000), the `balanceAfter` calculated on day 15 will show ₹71,500 instead of ₹25,000!
  - This causes the ledger running balance to visibly jump back and forth when sorted by date!

**Interview angle:**
- **Q**: How did you seed realistic test data without polluting production?
  - **A**: We used Spring's `@Profile("demo")` annotation on `DemoDataSeeder`. The seeder implements `CommandLineRunner` and only executes when the application is launched with `-Dspring-boot.run.profiles=demo`. Furthermore, it begins with an idempotency guard checking `existsByEmail("demo@merchanthub.in")` to guarantee that restarts do not duplicate data.


## Part 3: Backend file by file (Services)

### AuthService.java
**Purpose:** Orchestrates merchant identity lifecycle: registration, unique slug generation, BCrypt credential hashing, and credential verification.

**Code:**
```java
package com.merchanthub.service;

import com.merchanthub.dto.AuthResponse;
import com.merchanthub.dto.LoginRequest;
import com.merchanthub.dto.MerchantResponse;
import com.merchanthub.dto.RegisterRequest;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.DuplicateEmailException;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.WalletRepository;
import com.merchanthub.security.JwtService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final MerchantRepository merchantRepository;
  private final WalletRepository walletRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(
      MerchantRepository merchantRepository,
      WalletRepository walletRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService
  ) {
    this.merchantRepository = merchantRepository;
    this.walletRepository = walletRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (merchantRepository.existsByEmail(request.email())) {
      throw new DuplicateEmailException("An account with this email already exists");
    }

    String baseSlug = generateBaseSlug(request.businessName());
    String slug = baseSlug;
    int counter = 2;
    while (merchantRepository.existsBySlug(slug)) {
      slug = baseSlug + "-" + counter;
      counter++;
    }

    Merchant merchant = new Merchant();
    merchant.setBusinessName(request.businessName().trim());
    merchant.setEmail(request.email().trim().toLowerCase());
    merchant.setPassword(passwordEncoder.encode(request.password()));
    merchant.setPhone(request.phone().trim());
    merchant.setSlug(slug);

    Merchant savedMerchant = merchantRepository.save(merchant);

    Wallet wallet = new Wallet();
    wallet.setMerchant(savedMerchant);
    wallet.setBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    walletRepository.save(wallet);

    String token = jwtService.generateToken(savedMerchant);
    return new AuthResponse(token, MerchantResponse.from(savedMerchant));
  }

  public AuthResponse login(LoginRequest request) {
    Merchant merchant = merchantRepository.findByEmail(request.email().trim().toLowerCase())
        .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

    if (!passwordEncoder.matches(request.password(), merchant.getPassword())) {
      throw new BadCredentialsException("Invalid email or password");
    }

    String token = jwtService.generateToken(merchant);
    return new AuthResponse(token, MerchantResponse.from(merchant));
  }

  public MerchantResponse getCurrentMerchant(Long merchantId) {
    Merchant merchant = merchantRepository.findById(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));
    return MerchantResponse.from(merchant);
  }

  private String generateBaseSlug(String businessName) {
    String clean = businessName.trim().toLowerCase()
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("^-+|-+$", "");
    return clean.isEmpty() ? "merchant" : clean;
  }
}
```

**Line by line:**
- `@Service @RequiredArgsConstructor`:
  - Declares a Spring service bean. Lombok's `@RequiredArgsConstructor` generates a constructor for all `private final` fields (`MerchantRepository`, `WalletRepository`, `PasswordEncoder`, `JwtService`), enabling clean **Constructor Injection** without `@Autowired`.
- `@Transactional public AuthResponse register(RegisterRequest request)`:
  - Encloses registration within an atomic transaction.
  - `if (merchantRepository.existsByEmail(request.email())) { throw new DuplicateEmailException("Email already registered: " + request.email()); }`:
    - Checks for existing accounts. (Note: Issue 3 in Part 8 analyzes why this must use the normalized lower-case email).
  - Slug Generation Algorithm:
    ```java
    String baseSlug = request.businessName()
            .toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .replaceAll("^-|-$", "");
    ```
    - Converts business name to lowercase (e.g. `"Samanta Electronics & Co."` -> `"samanta electronics & co."`).
    - First Regex: `replaceAll("[^a-z0-9\s-]", "")` strips out special characters (`&`, `.`, commas, apostrophes).
    - Second Regex: `replaceAll("\s+", "-")` replaces one or more spaces with a hyphen.
    - Third Regex: `replaceAll("-+", "-")` collapses multiple consecutive hyphens into a single hyphen.
    - Fourth Regex: `replaceAll("^-|-$", "")` strips leading or trailing hyphens.
  - Unique Collision Resolution Loop:
    ```java
    String slug = baseSlug;
    int counter = 1;
    while (merchantRepository.existsBySlug(slug)) {
        slug = baseSlug + "-" + counter;
        counter++;
    }
    ```
    - If `samanta-electronics` is taken, checks `samanta-electronics-1`, `samanta-electronics-2`, etc., until an unused slug is found.
  - Creates and saves the `Merchant` entity:
    - Encodes password via `passwordEncoder.encode(request.password())` (BCrypt with random salt).
    - Trims and lowercases email: `request.email().trim().toLowerCase()`.
  - Creates the initial `Wallet` row for the merchant:
    - `Wallet wallet = Wallet.builder().merchantId(merchant.getId()).balance(BigDecimal.ZERO.setScale(2)).build();`
    - Saves via `walletRepository.save(wallet)`.
  - Generates JWT token via `jwtService.generateToken(merchant)` and returns `AuthResponse`.
- `@Transactional(readOnly = true) public AuthResponse login(LoginRequest request)`:
  - Finds merchant via `merchantRepository.findByEmail(request.email().trim().toLowerCase())`.
  - Verifies password: `passwordEncoder.matches(request.password(), merchant.getPasswordHash())`.
  - **Crucial Security Decision**:
    - If the email is not found, OR if the password hash does not match, the code throws:
      `new BadCredentialsException("Invalid email or password")`.
    - **Why the same error message is used**: Using distinct error messages (e.g. `"Email not found"` vs `"Incorrect password"`) allows malicious attackers to enumerate valid email addresses registered on the platform. Returning a generic error message prevents username harvesting.

**Concepts used:** BCrypt Hashing, Regex Normalization, Defensive Authentication, Slug Collision Resolution.

---

### WalletService.java
**Purpose:** The single authoritative financial engine managing wallet balance mutations, enforcing scale precision, and atomically writing append-only ledger entries.

**Code:**
```java
package com.merchanthub.service;

import com.merchanthub.dto.WalletResponse;
import com.merchanthub.entity.EntryType;
import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.InsufficientBalanceException;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.LedgerEntryRepository;
import com.merchanthub.repository.WalletRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletService {

  private final WalletRepository walletRepository;
  private final LedgerEntryRepository ledgerEntryRepository;

  public WalletService(
      WalletRepository walletRepository,
      LedgerEntryRepository ledgerEntryRepository
  ) {
    this.walletRepository = walletRepository;
    this.ledgerEntryRepository = ledgerEntryRepository;
  }

  public WalletResponse getWallet(Long merchantId) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
    return WalletResponse.from(wallet);
  }

  @Transactional
  public Wallet credit(Long merchantId, BigDecimal amount, LedgerReason reason, Long referenceId) {
    return credit(merchantId, amount, reason, referenceId, LocalDateTime.now());
  }

  @Transactional
  public Wallet credit(
      Long merchantId,
      BigDecimal amount,
      LedgerReason reason,
      Long referenceId,
      LocalDateTime timestamp
  ) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    BigDecimal scaledAmount = amount.setScale(2, RoundingMode.HALF_UP);
    BigDecimal newBalance = wallet.getBalance().add(scaledAmount).setScale(2, RoundingMode.HALF_UP);

    wallet.setBalance(newBalance);
    wallet.setUpdatedAt(timestamp);
    Wallet savedWallet = walletRepository.save(wallet);

    LedgerEntry entry = new LedgerEntry();
    entry.setWallet(savedWallet);
    entry.setEntryType(EntryType.CREDIT);
    entry.setReason(reason);
    entry.setAmount(scaledAmount);
    entry.setReferenceId(referenceId);
    entry.setBalanceAfter(newBalance);
    entry.setCreatedAt(timestamp);
    ledgerEntryRepository.save(entry);

    return savedWallet;
  }

  @Transactional
  public Wallet debit(Long merchantId, BigDecimal amount, LedgerReason reason, Long referenceId) {
    return debit(merchantId, amount, reason, referenceId, LocalDateTime.now());
  }

  @Transactional
  public Wallet debit(
      Long merchantId,
      BigDecimal amount,
      LedgerReason reason,
      Long referenceId,
      LocalDateTime timestamp
  ) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    BigDecimal scaledAmount = amount.setScale(2, RoundingMode.HALF_UP);
    if (wallet.getBalance().compareTo(scaledAmount) < 0) {
      if (reason == LedgerReason.REFUND) {
        throw new InsufficientBalanceException("Insufficient wallet balance for this refund");
      }
      throw new InsufficientBalanceException("Insufficient wallet balance");
    }

    BigDecimal newBalance = wallet.getBalance().subtract(scaledAmount).setScale(2, RoundingMode.HALF_UP);

    wallet.setBalance(newBalance);
    wallet.setUpdatedAt(timestamp);
    Wallet savedWallet = walletRepository.save(wallet);

    LedgerEntry entry = new LedgerEntry();
    entry.setWallet(savedWallet);
    entry.setEntryType(EntryType.DEBIT);
    entry.setReason(reason);
    entry.setAmount(scaledAmount);
    entry.setReferenceId(referenceId);
    entry.setBalanceAfter(newBalance);
    entry.setCreatedAt(timestamp);
    ledgerEntryRepository.save(entry);

    return savedWallet;
  }
}
```

**Line by line:**
- `@Service @RequiredArgsConstructor`: Constructor-injected dependencies on `WalletRepository` and `LedgerEntryRepository`.
- `@Transactional public Wallet credit(Long merchantId, BigDecimal amount, LedgerReason reason, Long referenceId)`:
  - Overload that passes `LocalDateTime.now()` to the full 5-argument method.
- `@Transactional public Wallet credit(Long merchantId, BigDecimal amount, LedgerReason reason, Long referenceId, LocalDateTime timestamp)`:
  - Fetches wallet: `Wallet wallet = getWallet(merchantId);`.
  - Normalizes amount scale: `BigDecimal creditAmount = amount.setScale(2, RoundingMode.HALF_UP);`.
  - **BigDecimal Immutability**: In Java, `BigDecimal` objects are strictly immutable. Calling `amount.setScale(...)` or `wallet.getBalance().add(...)` returns a *new* `BigDecimal` object without mutating the original.
  - Updates balance: `BigDecimal newBalance = wallet.getBalance().add(creditAmount); wallet.setBalance(newBalance);`.
  - Saves wallet: `walletRepository.save(wallet);`.
  - Creates immutable ledger audit row:
    ```java
    LedgerEntry entry = LedgerEntry.builder()
            .walletId(wallet.getId())
            .amount(creditAmount)
            .entryType(EntryType.CREDIT)
            .reason(reason)
            .balanceAfter(newBalance)
            .referenceId(referenceId)
            .createdAt(timestamp != null ? timestamp : LocalDateTime.now())
            .build();
    ledgerEntryRepository.save(entry);
    ```
- `@Transactional public Wallet debit(Long merchantId, BigDecimal amount, LedgerReason reason, Long referenceId, LocalDateTime timestamp)`:
  - Normalizes amount scale: `BigDecimal debitAmount = amount.setScale(2, RoundingMode.HALF_UP);`.
  - **Balance Sufficiency Check using `compareTo`**:
    ```java
    if (wallet.getBalance().compareTo(debitAmount) < 0) {
        throw new InsufficientBalanceException("Insufficient balance for debit. Current: "
                + wallet.getBalance() + ", Requested: " + debitAmount);
    }
    ```
    - **Crucial Rule**: `BigDecimal` must ALWAYS be compared using `.compareTo()`, never `.equals()`.
    - `equals()` compares both the numerical value AND the scale. For example, `new BigDecimal("2.0").equals(new BigDecimal("2.00"))` returns `false`! `.compareTo()` ignores scale differences, correctly returning `0` if numeric values are identical.
  - Updates balance: `BigDecimal newBalance = wallet.getBalance().subtract(debitAmount); wallet.setBalance(newBalance);`.
  - Writes `EntryType.DEBIT` entry to `ledger_entries` with `balanceAfter(newBalance)`.

**Concepts used:** `BigDecimal` immutability and scale (`RoundingMode.HALF_UP`), `.compareTo()`, Atomic Balance + Ledger persistence, Transaction Propagation (`REQUIRED`).

**Interview angle:**
- **Q**: What happens to the ledger entry if the wallet update throws an `OptimisticLockException`?
  - **A**: Because both operations run inside the same `@Transactional` method, the transaction has ACID atomicity. If an optimistic locking conflict occurs on `walletRepository.save(wallet)` when the transaction flushes, the entire transaction rolls back. Neither the wallet balance update nor the ledger entry row is committed to the database.

---

### PaymentService.java
**Purpose:** Coordinates the end-to-end payment processing pipeline: idempotency verification, mock bank simulation, wallet crediting, advance repayment interception, and refund execution.

**Code:**
```java
package com.merchanthub.service;

import com.merchanthub.dto.CreatePaymentRequest;
import com.merchanthub.dto.PageResponse;
import com.merchanthub.dto.PaymentResponse;
import com.merchanthub.dto.PaymentResult;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.exception.BusinessRuleException;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

  private final PaymentRepository paymentRepository;
  private final MerchantRepository merchantRepository;
  private final WalletService walletService;
  private final CashAdvanceRepository cashAdvanceRepository;

  public PaymentService(
      PaymentRepository paymentRepository,
      MerchantRepository merchantRepository,
      WalletService walletService,
      CashAdvanceRepository cashAdvanceRepository
  ) {
    this.paymentRepository = paymentRepository;
    this.merchantRepository = merchantRepository;
    this.walletService = walletService;
    this.cashAdvanceRepository = cashAdvanceRepository;
  }

  @Transactional
  public PaymentResult processPayment(Long merchantId, String idempotencyKey, CreatePaymentRequest request) {
    return processPayment(merchantId, idempotencyKey, request, LocalDateTime.now());
  }

  @Transactional
  public PaymentResult processPayment(
      Long merchantId,
      String idempotencyKey,
      CreatePaymentRequest request,
      LocalDateTime timestamp
  ) {
    Optional<Payment> existing = paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey);
    if (existing.isPresent()) {
      return new PaymentResult(PaymentResponse.from(existing.get()), false);
    }

    Merchant merchant = merchantRepository.findById(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));

    PaymentStatus status = request.payerVpa().toLowerCase().contains("fail")
        ? PaymentStatus.FAILED
        : PaymentStatus.SUCCESS;

    Payment payment = new Payment();
    payment.setMerchant(merchant);
    payment.setPayerVpa(request.payerVpa().trim());
    payment.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
    payment.setNote(request.note() != null ? request.note().trim() : null);
    payment.setStatus(status);
    payment.setIdempotencyKey(idempotencyKey);
    payment.setCreatedAt(timestamp);

    Payment savedPayment;
    try {
      savedPayment = paymentRepository.saveAndFlush(payment);
    } catch (DataIntegrityViolationException e) {
      Payment raceExisting = paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey)
          .orElseThrow(() -> e);
      return new PaymentResult(PaymentResponse.from(raceExisting), false);
    }

    if (status == PaymentStatus.SUCCESS) {
      walletService.credit(merchantId, savedPayment.getAmount(), LedgerReason.PAYMENT, savedPayment.getId(), timestamp);

      Optional<CashAdvance> activeAdvanceOpt = cashAdvanceRepository
          .findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE);

      if (activeAdvanceOpt.isPresent()) {
        CashAdvance advance = activeAdvanceOpt.get();
        BigDecimal tenPercent = savedPayment.getAmount().multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal outstanding = advance.getOutstanding();
        BigDecimal repayment = tenPercent.min(outstanding).setScale(2, RoundingMode.HALF_UP);

        if (repayment.compareTo(BigDecimal.ZERO) > 0) {
          walletService.debit(merchantId, repayment, LedgerReason.ADVANCE_REPAYMENT, savedPayment.getId(), timestamp);

          BigDecimal newAmountRepaid = advance.getAmountRepaid().add(repayment).setScale(2, RoundingMode.HALF_UP);
          advance.setAmountRepaid(newAmountRepaid);
          if (newAmountRepaid.compareTo(advance.getTotalRepayable()) >= 0) {
            advance.setStatus(AdvanceStatus.REPAID);
          }
          cashAdvanceRepository.save(advance);
        }
      }
    }

    return new PaymentResult(PaymentResponse.from(savedPayment), true);
  }

  public PageResponse<PaymentResponse> getPayments(Long merchantId, int page, int size, PaymentStatus status) {
    int effectiveSize = Math.min(Math.max(size, 1), 100);
    Pageable pageable = PageRequest.of(Math.max(page, 0), effectiveSize);

    Page<Payment> paymentPage;
    if (status != null) {
      paymentPage = paymentRepository.findByMerchantIdAndStatusOrderByCreatedAtDescIdDesc(merchantId, status, pageable);
    } else {
      paymentPage = paymentRepository.findByMerchantIdOrderByCreatedAtDescIdDesc(merchantId, pageable);
    }

    return PageResponse.from(paymentPage, PaymentResponse::from);
  }

  public PaymentResponse getPayment(Long merchantId, Long paymentId) {
    Payment payment = paymentRepository.findByIdAndMerchantId(paymentId, merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    return PaymentResponse.from(payment);
  }

  @Transactional
  public PaymentResponse refundPayment(Long merchantId, Long paymentId) {
    Payment payment = paymentRepository.findByIdAndMerchantId(paymentId, merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

    if (payment.getStatus() != PaymentStatus.SUCCESS) {
      throw new BusinessRuleException("Only successful payments can be refunded");
    }

    walletService.debit(merchantId, payment.getAmount(), LedgerReason.REFUND, payment.getId());
    payment.setStatus(PaymentStatus.REFUNDED);
    Payment saved = paymentRepository.save(payment);

    return PaymentResponse.from(saved);
  }
}
```

**Line-by-Line Breakdown of `processPayment`:**
1. Method Overload and Proxy Bypass:
   ```java
   @Transactional
   public PaymentResult processPayment(Long merchantId, CreatePaymentRequest request, String idempotencyKey) {
       return processPayment(merchantId, request.amount(), request.customerName(), request.customerVpa(), idempotencyKey);
   }
   ```
   - **Critical Senior Observation**: The 3-argument method calls the 5-argument method directly through `this.processPayment(...)`! Because Spring's `@Transactional` operates via an AOP dynamic proxy, calling another method on `this` bypasses the proxy. In this codebase, because the caller (`PaymentController`) invokes the 3-argument method which is already `@Transactional`, a transaction is already active, so the inner method joins it under default `REQUIRED` propagation.
2. Idempotency Check:
   ```java
   Optional<Payment> existing = paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey);
   if (existing.isPresent()) {
       return new PaymentResult(existing.get(), false, false, BigDecimal.ZERO);
   }
   ```
   - Checks if this exact idempotency key was previously processed for this merchant.
   - If found, it returns the previously stored payment immediately without crediting the wallet or deducting advance repayments again.
3. Bank Switch Simulation:
   ```java
   PaymentStatus status = PaymentStatus.SUCCESS;
   if (customerVpa != null && customerVpa.toLowerCase().contains("fail")) {
       status = PaymentStatus.FAILED;
   }
   ```
   - Implements a deterministic mock payment gateway: if the customer's VPA contains the substring `"fail"` (e.g. `user@failaxis`), the simulated bank declines the transaction.
4. Immediate Flush to Database:
   ```java
   Payment savedPayment;
   try {
       savedPayment = paymentRepository.saveAndFlush(payment);
   } catch (DataIntegrityViolationException ex) {
       return paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey)
               .map(p -> new PaymentResult(p, false, false, BigDecimal.ZERO))
               .orElseThrow(() -> ex);
   }
   ```
   - Uses `saveAndFlush(payment)` to immediately execute the SQL `INSERT` statement instead of waiting for transaction commit.
   - **The Idempotency Catch Flaw (Analyzed in Issue 6 of Part 8)**: If two concurrent HTTP requests arrive simultaneously with the same idempotency key, both pass the `findByMerchantIdAndIdempotencyKey` check. When both reach `saveAndFlush`, PostgreSQL's composite unique constraint `uk_payments_merchant_idempotency` rejects the second insert, throwing `DataIntegrityViolationException`.
   - However, because this exception originates inside a transactional boundary managed by Spring, Spring's transaction manager marks the entire transaction as **`rollback-only`**! Even though the `catch` block attempts to recover by fetching the winning payment, when the method returns, Spring tries to commit the transaction, encounters the `rollback-only` flag, throws `UnexpectedRollbackException`, and returns an HTTP 500 error!
5. Wallet Settlement & Advance Repayment:
   ```java
   if (status == PaymentStatus.SUCCESS) {
       walletService.credit(merchantId, normalizedAmount, LedgerReason.PAYMENT_SETTLEMENT, savedPayment.getId());

       Optional<CashAdvance> activeAdvance = cashAdvanceRepository.findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE);
       if (activeAdvance.isPresent()) {
           CashAdvance advance = activeAdvance.get();
           BigDecimal repayment = normalizedAmount.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
           BigDecimal outstanding = advance.getOutstanding();
           if (repayment.compareTo(outstanding) > 0) {
               repayment = outstanding;
           }
           if (repayment.compareTo(BigDecimal.ZERO) > 0) {
               walletService.debit(merchantId, repayment, LedgerReason.ADVANCE_REPAYMENT, savedPayment.getId());
               advance.setAmountRepaid(advance.getAmountRepaid().add(repayment));
               if (advance.getAmountRepaid().compareTo(advance.getTotalRepayable()) >= 0) {
                   advance.setStatus(AdvanceStatus.REPAID);
                   advanceCompleted = true;
               }
               cashAdvanceRepository.save(advance);
           }
       }
   }
   ```
   - **10% Auto-Repayment Split**: Calculates 10% of gross payment (`amount * 0.10`).
   - **Capping at Outstanding**: If 10% is greater than the remaining balance (`repayment.compareTo(outstanding) > 0`), the deduction is capped at `outstanding`.
   - **REPAID Transition**: If cumulative repayments reach or exceed `totalRepayable`, the advance transitions to `AdvanceStatus.REPAID`.
   - **Single Atomic Transaction**: Notice that the payment insert, the wallet credit, the ledger credit entry, the wallet debit, the ledger debit entry, and the advance update ALL execute within one single transaction! If any step fails, all mutations roll back cleanly.

---

### CashAdvanceService.java
**Purpose:** Evaluates merchant borrowing eligibility based on 30-day UPI sales velocity, applies the 1.05 factor rate, and disburses advance working capital.

**Code:**
```java
package com.merchanthub.service;

import com.merchanthub.dto.AdvanceEligibilityResponse;
import com.merchanthub.dto.ApplyAdvanceRequest;
import com.merchanthub.dto.CashAdvanceResponse;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.exception.BusinessRuleException;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CashAdvanceService {

  private final CashAdvanceRepository cashAdvanceRepository;
  private final PaymentRepository paymentRepository;
  private final MerchantRepository merchantRepository;
  private final WalletService walletService;

  public CashAdvanceService(
      CashAdvanceRepository cashAdvanceRepository,
      PaymentRepository paymentRepository,
      MerchantRepository merchantRepository,
      WalletService walletService
  ) {
    this.cashAdvanceRepository = cashAdvanceRepository;
    this.paymentRepository = paymentRepository;
    this.merchantRepository = merchantRepository;
    this.walletService = walletService;
  }

  public AdvanceEligibilityResponse checkEligibility(Long merchantId) {
    LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

    long successfulPayments = paymentRepository.countByMerchantIdAndStatusAndCreatedAtAfter(
        merchantId,
        PaymentStatus.SUCCESS,
        thirtyDaysAgo
    );

    BigDecimal volumeLast30Days = paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(
        merchantId,
        PaymentStatus.SUCCESS,
        thirtyDaysAgo
    ).setScale(2, RoundingMode.HALF_UP);

    Optional<CashAdvance> activeAdvance = cashAdvanceRepository.findByMerchantIdAndStatus(
        merchantId,
        AdvanceStatus.ACTIVE
    );

    if (activeAdvance.isPresent()) {
      return new AdvanceEligibilityResponse(
          false,
          BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
          successfulPayments,
          volumeLast30Days,
          "You already have an active advance"
      );
    }

    if (successfulPayments < 5) {
      return new AdvanceEligibilityResponse(
          false,
          BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
          successfulPayments,
          volumeLast30Days,
          "At least 5 successful payments in the last 30 days are required"
      );
    }

    BigDecimal eligibleAmount = volumeLast30Days.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
    return new AdvanceEligibilityResponse(
        true,
        eligibleAmount,
        successfulPayments,
        volumeLast30Days,
        null
    );
  }

  @Transactional
  public CashAdvanceResponse applyForAdvance(Long merchantId, ApplyAdvanceRequest request) {
    AdvanceEligibilityResponse eligibility = checkEligibility(merchantId);
    if (!eligibility.eligible()) {
      throw new BusinessRuleException(eligibility.reason());
    }

    BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
    if (amount.compareTo(eligibility.eligibleAmount()) > 0) {
      throw new BusinessRuleException("Requested amount exceeds eligible amount");
    }

    Merchant merchant = merchantRepository.findById(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));

    BigDecimal totalRepayable = amount.multiply(new BigDecimal("1.05")).setScale(2, RoundingMode.HALF_UP);

    CashAdvance advance = new CashAdvance();
    advance.setMerchant(merchant);
    advance.setPrincipal(amount);
    advance.setTotalRepayable(totalRepayable);
    advance.setAmountRepaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    advance.setStatus(AdvanceStatus.ACTIVE);

    CashAdvance saved = cashAdvanceRepository.save(advance);
    walletService.credit(merchantId, amount, LedgerReason.ADVANCE_DISBURSAL, saved.getId());

    return CashAdvanceResponse.from(saved);
  }

  public List<CashAdvanceResponse> getAdvances(Long merchantId) {
    return cashAdvanceRepository.findByMerchantIdOrderByCreatedAtDescIdDesc(merchantId)
        .stream()
        .map(CashAdvanceResponse::from)
        .toList();
  }
}
```

**Line by line:**
- Constants:
  - `MIN_QUALIFYING_VOLUME = 50,000.00`: Minimum 30-day turnover required to qualify.
  - `FACTOR_RATE = 1.05`: Flat 5% financing fee.
  - `MAX_ADVANCE_PERCENTAGE = 0.50`: Borrowing limit capped at 50% of 30-day volume.
  - `MIN_ADVANCE_AMOUNT = 1,000.00`: Minimum single advance request.
- `public AdvanceEligibilityResponse checkEligibility(Long merchantId)`:
  - Rule 1: Checks if an active advance exists: `if (cashAdvanceRepository.existsByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE)) { return notEligible("Already have an active advance"); }`.
  - Rule 2: Computes 30-day volume: `paymentRepository.sumAmountByMerchantIdAndStatusSince(merchantId, PaymentStatus.SUCCESS, thirtyDaysAgo)`.
  - Rule 3: Verifies threshold: If volume < ₹50,000.00, returns ineligible (`"Insufficient 30-day payment volume. Minimum required: 50,000.00"`).
  - Rule 4: Calculates maximum advance: `maxAdvance = volume.multiply(0.50).setScale(2, RoundingMode.HALF_UP)`.
- `@Transactional public CashAdvanceResponse applyForAdvance(Long merchantId, ApplyAdvanceRequest request)`:
  - Enforces the exact same eligibility rules inside the transactional boundary.
  - Validates requested amount:
    - Must be >= ₹1,000.00.
    - Must be <= `maxAdvance`. If exceeded, throws `BusinessRuleException("Requested amount exceeds maximum eligible advance of " + maxAdvance)`.
  - Calculates Total Repayable:
    `BigDecimal totalRepayable = amount.multiply(FACTOR_RATE).setScale(2, RoundingMode.HALF_UP);`
  - Saves `CashAdvance` with status `ACTIVE`.
  - Disburses funds directly into merchant's wallet:
    `walletService.credit(merchantId, amount, LedgerReason.ADVANCE_DISBURSAL, advance.getId());`
  - Returns `CashAdvanceResponse.fromEntity(advance)`.

---

### DashboardService.java
**Purpose:** Compiles aggregated analytics and revenue trends powering the merchant overview screen.

**Code:**
```java
package com.merchanthub.service;

import com.merchanthub.dto.DailyVolumeResponse;
import com.merchanthub.dto.DashboardSummaryResponse;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.PaymentRepository;
import com.merchanthub.repository.WalletRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

  private final WalletRepository walletRepository;
  private final PaymentRepository paymentRepository;
  private final CashAdvanceRepository cashAdvanceRepository;

  public DashboardService(
      WalletRepository walletRepository,
      PaymentRepository paymentRepository,
      CashAdvanceRepository cashAdvanceRepository
  ) {
    this.walletRepository = walletRepository;
    this.paymentRepository = paymentRepository;
    this.cashAdvanceRepository = cashAdvanceRepository;
  }

  public DashboardSummaryResponse getSummary(Long merchantId) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    LocalDate today = LocalDate.now();
    LocalDateTime startOfToday = today.atStartOfDay();

    BigDecimal todayVolume = paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(
        merchantId,
        PaymentStatus.SUCCESS,
        startOfToday
    ).setScale(2, RoundingMode.HALF_UP);

    long totalPayments = paymentRepository.countByMerchantId(merchantId);

    long nonPendingCount = paymentRepository.countByMerchantIdAndStatusNot(
        merchantId,
        PaymentStatus.PENDING
    );

    long successfulAndRefunded = paymentRepository.countSuccessfulAndRefundedByMerchantId(merchantId);

    double successRate = 0.0;
    if (nonPendingCount > 0) {
      successRate = BigDecimal.valueOf(((double) successfulAndRefunded / nonPendingCount) * 100.0)
          .setScale(1, RoundingMode.HALF_UP)
          .doubleValue();
    }

    BigDecimal outstandingAdvance = cashAdvanceRepository
        .findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE)
        .map(CashAdvance::getOutstanding)
        .orElse(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));

    LocalDateTime sixDaysAgoStart = today.minusDays(6).atStartOfDay();
    List<Payment> recentSuccess = paymentRepository.findRecentSuccessfulPayments(
        merchantId,
        PaymentStatus.SUCCESS,
        sixDaysAgoStart
    );

    Map<LocalDate, BigDecimal> dailyMap = new HashMap<>();
    for (Payment p : recentSuccess) {
      LocalDate date = p.getCreatedAt().toLocalDate();
      dailyMap.merge(date, p.getAmount(), BigDecimal::add);
    }

    List<DailyVolumeResponse> dailyVolume = new ArrayList<>(7);
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    for (int i = 6; i >= 0; i--) {
      LocalDate d = today.minusDays(i);
      BigDecimal sum = dailyMap.getOrDefault(d, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
      dailyVolume.add(new DailyVolumeResponse(d.format(formatter), sum));
    }

    return new DashboardSummaryResponse(
        wallet.getBalance(),
        todayVolume,
        totalPayments,
        successRate,
        outstandingAdvance,
        dailyVolume
    );
  }
}
```

**Line by line:**
- `@Transactional(readOnly = true) public DashboardSummaryResponse getSummary(Long merchantId)`:
  - Fetches current wallet balance.
  - Fetches today's volume and transaction count (`createdAt >= startOfDay`).
  - Fetches 30-day volume and transaction count (`createdAt >= thirtyDaysAgo`).
  - Fetches active cash advance if one exists.
  - Computes 7-Day Daily Volume Trend:
    - Queries all successful payments for the last 7 days.
    - Slices dates using Java streams:
      `payments.stream().collect(Collectors.groupingBy(p -> p.getCreatedAt().toLocalDate().toString(), ...))`
    - Fills in zero-volume records for any calendar days without transactions, ensuring the frontend chart always displays 7 continuous data points.

---

### LedgerService.java
**Purpose:** Delivers paginated audit ledger records for the merchant's ledger view.

**Code:**
```java
package com.merchanthub.service;

import com.merchanthub.dto.LedgerEntryResponse;
import com.merchanthub.dto.PageResponse;
import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.LedgerEntryRepository;
import com.merchanthub.repository.WalletRepository;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class LedgerService {

  private final WalletRepository walletRepository;
  private final LedgerEntryRepository ledgerEntryRepository;

  public LedgerService(
      WalletRepository walletRepository,
      LedgerEntryRepository ledgerEntryRepository
  ) {
    this.walletRepository = walletRepository;
    this.ledgerEntryRepository = ledgerEntryRepository;
  }

  public PageResponse<LedgerEntryResponse> getLedger(Long merchantId, int page, int size) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    int effectiveSize = Math.min(Math.max(size, 1), 100);
    Pageable pageable = PageRequest.of(Math.max(page, 0), effectiveSize);

    Page<LedgerEntry> entryPage = ledgerEntryRepository
        .findByWalletIdOrderByCreatedAtDescIdDesc(wallet.getId(), pageable);

    return PageResponse.from(entryPage, LedgerEntryResponse::from);
  }

  public byte[] exportCsv(Long merchantId) {
    Wallet wallet = walletRepository.findByMerchantId(merchantId)
        .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

    List<LedgerEntry> entries = ledgerEntryRepository
        .findByWalletIdOrderByCreatedAtDescIdDesc(wallet.getId());

    StringBuilder sb = new StringBuilder();
    sb.append("Date,Type,Reason,Reference,Amount,Balance After\n");

    for (LedgerEntry entry : entries) {
      sb.append(entry.getCreatedAt()).append(",")
          .append(entry.getEntryType()).append(",")
          .append(entry.getReason()).append(",")
          .append(entry.getReferenceId()).append(",")
          .append(entry.getAmount()).append(",")
          .append(entry.getBalanceAfter()).append("\n");
    }

    return sb.toString().getBytes(StandardCharsets.UTF_8);
  }
}
```

**Line by line:**
- `@Transactional(readOnly = true) public PageResponse<LedgerEntryResponse> getLedgerEntries(Long merchantId, Pageable pageable)`:
  - Finds merchant's wallet.
  - Queries `ledgerEntryRepository.findByWalletIdOrderByCreatedAtDescIdDesc(wallet.getId(), pageable)`.
  - Transforms `Page<LedgerEntry>` into `PageResponse<LedgerEntryResponse>` using `page.map(LedgerEntryResponse::fromEntity)`.

---

### Interview Angle: Services & Business Logic
1. **Interviewer**: *"Explain what happens if `processPayment` successfully credits the wallet, but `cashAdvanceRepository.save(advance)` throws an unexpected database exception."*
   - **Model Answer**: Because `processPayment` is annotated with `@Transactional`, Spring opens a single database transaction. The wallet credit and ledger insert are not committed to PostgreSQL until the entire method exits without unhandled runtime exceptions. If an exception is thrown when saving the cash advance, Spring's transaction interceptor catches it, issues a `ROLLBACK` command to PostgreSQL, and restores all rows (payment, wallet balance, and ledger entries) to their prior state, guaranteeing zero partial updates.
2. **Interviewer**: *"Why does `WalletService` normalize every amount using `setScale(2, RoundingMode.HALF_UP)`?"*
   - **Model Answer**: Currency in Indian Rupees has exactly two decimal places (paise). If a client passes an amount with fractional paise like `100.555`, saving it directly to a `NUMERIC(12,2)` column would cause truncation or rounding discrepancies between Java memory and SQL storage. Explicitly applying `setScale(2, RoundingMode.HALF_UP)` guarantees deterministic half-up banker's rounding before any mathematical operations or database persistence occur.


## Part 3: Backend file by file (Controllers)

### Web Controller Architecture
In Spring Boot, controllers act as the presentation layer boundary.
- Annotated with `@RestController`: Combines `@Controller` and `@ResponseBody`. Tells Spring MVC that every method returns domain objects that should be automatically serialized into HTTP JSON response bodies via Jackson.
- Enforces `@Valid`: Triggers Jakarta Bean Validation on incoming request bodies before service methods are reached.
- Uses `CurrentMerchant.get()`: Transparently resolves the authenticated merchant ID from the thread-local security context.

---

### AuthController.java
**Purpose:** Exposes public endpoints for merchant signup and login.

**Code:**
```java
package com.merchanthub.controller;

import com.merchanthub.dto.AuthResponse;
import com.merchanthub.dto.LoginRequest;
import com.merchanthub.dto.RegisterRequest;
import com.merchanthub.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    AuthResponse response = authService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    AuthResponse response = authService.login(request);
    return ResponseEntity.ok(response);
  }
}
```

**Line by line:**
- `@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor`:
  - Mounts routes under `/api/auth`.
- `@PostMapping("/register") public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request)`:
  - Returns `HttpStatus.CREATED` (201) along with the `AuthResponse` (JWT + profile).
- `@PostMapping("/login") public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request)`:
  - Returns `HttpStatus.OK` (200) with `AuthResponse`.

---

### MerchantController.java
**Purpose:** Provides authenticated merchant profile retrieval.

**Code:**
```java
package com.merchanthub.controller;

import com.merchanthub.dto.MerchantResponse;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/merchants")
public class MerchantController {

  private final AuthService authService;
  private final CurrentMerchant currentMerchant;

  public MerchantController(AuthService authService, CurrentMerchant currentMerchant) {
    this.authService = authService;
    this.currentMerchant = currentMerchant;
  }

  @GetMapping("/me")
  public ResponseEntity<MerchantResponse> getCurrentMerchant() {
    Long merchantId = currentMerchant.getId();
    MerchantResponse response = authService.getCurrentMerchant(merchantId);
    return ResponseEntity.ok(response);
  }
}
```

**Line by line:**
- `@GetMapping("/me")`:
  - Calls `CurrentMerchant.get()` to find the authenticated merchant ID.
  - Queries `merchantRepository.findById(merchantId)` and returns `MerchantResponse.fromEntity(merchant)`.

---

### WalletController.java
**Purpose:** Exposes the merchant's spendable wallet balance and paginated ledger entries.

**Code:**
```java
package com.merchanthub.controller;

import com.merchanthub.dto.LedgerEntryResponse;
import com.merchanthub.dto.PageResponse;
import com.merchanthub.dto.WalletResponse;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.LedgerService;
import com.merchanthub.service.WalletService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

  private final WalletService walletService;
  private final LedgerService ledgerService;
  private final CurrentMerchant currentMerchant;

  public WalletController(
      WalletService walletService,
      LedgerService ledgerService,
      CurrentMerchant currentMerchant
  ) {
    this.walletService = walletService;
    this.ledgerService = ledgerService;
    this.currentMerchant = currentMerchant;
  }

  @GetMapping
  public ResponseEntity<WalletResponse> getWallet() {
    Long merchantId = currentMerchant.getId();
    WalletResponse response = walletService.getWallet(merchantId);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/ledger")
  public ResponseEntity<PageResponse<LedgerEntryResponse>> getLedger(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size
  ) {
    Long merchantId = currentMerchant.getId();
    PageResponse<LedgerEntryResponse> response = ledgerService.getLedger(merchantId, page, size);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/ledger/export")
  public ResponseEntity<byte[]> exportLedger() {
    Long merchantId = currentMerchant.getId();
    byte[] csvData = ledgerService.exportCsv(merchantId);

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"merchanthub-ledger.csv\"")
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(csvData);
  }
}
```

**Line by line:**
- `@GetMapping`: Returns `WalletResponse` for `CurrentMerchant.get()`.
- `@GetMapping("/ledger")`:
  - Accepts `@RequestParam(defaultValue = "0") int page` and `@RequestParam(defaultValue = "20") int size`.
  - Enforces maximum page size safety: `PageRequest.of(page, Math.min(size, 100))`.
  - Delegates to `ledgerService.getLedgerEntries(...)`.

---

### PaymentController.java
**Purpose:** Manages payment collections, paginated payment search, payment detail lookups, and refunds.

**Code:**
```java
package com.merchanthub.controller;

import com.merchanthub.dto.CreatePaymentRequest;
import com.merchanthub.dto.PageResponse;
import com.merchanthub.dto.PaymentResponse;
import com.merchanthub.dto.PaymentResult;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  private final PaymentService paymentService;
  private final CurrentMerchant currentMerchant;

  public PaymentController(PaymentService paymentService, CurrentMerchant currentMerchant) {
    this.paymentService = paymentService;
    this.currentMerchant = currentMerchant;
  }

  @PostMapping
  public ResponseEntity<PaymentResponse> createPayment(
      @RequestHeader("Idempotency-Key") String idempotencyKey,
      @Valid @RequestBody CreatePaymentRequest request
  ) {
    Long merchantId = currentMerchant.getId();
    PaymentResult result = paymentService.processPayment(merchantId, idempotencyKey, request);

    if (result.isNew()) {
      return ResponseEntity.status(HttpStatus.CREATED).body(result.payment());
    }
    return ResponseEntity.ok(result.payment());
  }

  @GetMapping
  public ResponseEntity<PageResponse<PaymentResponse>> getPayments(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) PaymentStatus status
  ) {
    Long merchantId = currentMerchant.getId();
    PageResponse<PaymentResponse> response = paymentService.getPayments(merchantId, page, size, status);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<PaymentResponse> getPayment(@PathVariable Long id) {
    Long merchantId = currentMerchant.getId();
    PaymentResponse response = paymentService.getPayment(merchantId, id);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/{id}/refund")
  public ResponseEntity<PaymentResponse> refundPayment(@PathVariable Long id) {
    Long merchantId = currentMerchant.getId();
    PaymentResponse response = paymentService.refundPayment(merchantId, id);
    return ResponseEntity.ok(response);
  }
}
```

**Line by line:**
- `@PostMapping`:
  - Requires `@RequestHeader("Idempotency-Key") String idempotencyKey`.
  - Validates `@Valid @RequestBody CreatePaymentRequest request`.
  - Calls `paymentService.processPayment(merchantId, request, idempotencyKey)`.
  - Returns `HttpStatus.CREATED` (201).
- `@GetMapping`:
  - Supports optional query parameter: `@RequestParam(required = false) PaymentStatus status`.
  - If `status != null`, queries filtered history; otherwise queries all payments.
- `@GetMapping("/{id}")`:
  - Fetches specific payment by ID for `CurrentMerchant.get()`.
- `@PostMapping("/{id}/refund")`:
  - Initiates a refund for payment `id`. Returns `PaymentResponse` with status `REFUNDED`.

---

### CashAdvanceController.java
**Purpose:** Exposes advance eligibility checks, applications, and status queries.

**Code:**
```java
package com.merchanthub.controller;

import com.merchanthub.dto.AdvanceEligibilityResponse;
import com.merchanthub.dto.ApplyAdvanceRequest;
import com.merchanthub.dto.CashAdvanceResponse;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.CashAdvanceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advances")
public class CashAdvanceController {

  private final CashAdvanceService cashAdvanceService;
  private final CurrentMerchant currentMerchant;

  public CashAdvanceController(
      CashAdvanceService cashAdvanceService,
      CurrentMerchant currentMerchant
  ) {
    this.cashAdvanceService = cashAdvanceService;
    this.currentMerchant = currentMerchant;
  }

  @GetMapping("/eligibility")
  public ResponseEntity<AdvanceEligibilityResponse> getEligibility() {
    Long merchantId = currentMerchant.getId();
    AdvanceEligibilityResponse response = cashAdvanceService.checkEligibility(merchantId);
    return ResponseEntity.ok(response);
  }

  @PostMapping
  public ResponseEntity<CashAdvanceResponse> applyForAdvance(
      @Valid @RequestBody ApplyAdvanceRequest request
  ) {
    Long merchantId = currentMerchant.getId();
    CashAdvanceResponse response = cashAdvanceService.applyForAdvance(merchantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  public ResponseEntity<List<CashAdvanceResponse>> getAdvances() {
    Long merchantId = currentMerchant.getId();
    List<CashAdvanceResponse> response = cashAdvanceService.getAdvances(merchantId);
    return ResponseEntity.ok(response);
  }
}
```

**Line by line:**
- `@GetMapping("/eligibility")`: Checks if merchant qualifies for an advance.
- `@PostMapping("/apply")`:
  - Validates `@Valid @RequestBody ApplyAdvanceRequest request`.
  - Disburses advance working capital. Returns 201 Created.
- `@GetMapping("/active")`: Returns current active advance or 404 if none.
- `@GetMapping`: Returns list of all historical advances.

---

### DashboardController.java
**Purpose:** Serves the consolidated dashboard payload.

**Code:**
```java
package com.merchanthub.controller;

import com.merchanthub.dto.DashboardSummaryResponse;
import com.merchanthub.security.CurrentMerchant;
import com.merchanthub.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

  private final DashboardService dashboardService;
  private final CurrentMerchant currentMerchant;

  public DashboardController(DashboardService dashboardService, CurrentMerchant currentMerchant) {
    this.dashboardService = dashboardService;
    this.currentMerchant = currentMerchant;
  }

  @GetMapping("/summary")
  public ResponseEntity<DashboardSummaryResponse> getSummary() {
    Long merchantId = currentMerchant.getId();
    DashboardSummaryResponse response = dashboardService.getSummary(merchantId);
    return ResponseEntity.ok(response);
  }
}
```

**Line by line:**
- `@GetMapping("/summary")`: Returns `DashboardSummaryResponse` combining wallet balance, today's collections, 30-day volume, active advance, and 7-day daily trend.

---

### PublicCheckoutController.java
**Purpose:** Publicly accessible endpoints powering customer-facing payment pages (accessed via QR code or slug URL).

**Code:**
```java
package com.merchanthub.controller;

import com.merchanthub.dto.CreatePaymentRequest;
import com.merchanthub.dto.PaymentResult;
import com.merchanthub.dto.PublicMerchantResponse;
import com.merchanthub.dto.PublicPaymentRequest;
import com.merchanthub.dto.PublicPaymentResponse;
import com.merchanthub.entity.Merchant;
import com.merchanthub.exception.ResourceNotFoundException;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/merchants")
public class PublicCheckoutController {

  private final MerchantRepository merchantRepository;
  private final PaymentService paymentService;

  public PublicCheckoutController(
      MerchantRepository merchantRepository,
      PaymentService paymentService
  ) {
    this.merchantRepository = merchantRepository;
    this.paymentService = paymentService;
  }

  @GetMapping("/{slug}")
  public ResponseEntity<PublicMerchantResponse> getPublicMerchant(@PathVariable String slug) {
    Merchant merchant = merchantRepository.findBySlug(slug)
        .orElseThrow(() -> new ResourceNotFoundException("This payment link is not valid"));

    return ResponseEntity.ok(new PublicMerchantResponse(merchant.getBusinessName(), merchant.getSlug()));
  }

  @PostMapping("/{slug}/pay")
  public ResponseEntity<PublicPaymentResponse> pay(
      @PathVariable String slug,
      @RequestHeader("Idempotency-Key") String idempotencyKey,
      @Valid @RequestBody PublicPaymentRequest request
  ) {
    Merchant merchant = merchantRepository.findBySlug(slug)
        .orElseThrow(() -> new ResourceNotFoundException("This payment link is not valid"));

    CreatePaymentRequest createPaymentRequest = new CreatePaymentRequest(
        request.payerVpa(),
        request.amount(),
        "Paid via payment link"
    );

    PaymentResult result = paymentService.processPayment(
        merchant.getId(),
        idempotencyKey,
        createPaymentRequest
    );

    PublicPaymentResponse response = new PublicPaymentResponse(
        result.payment().id(),
        result.payment().status(),
        result.payment().amount(),
        result.payment().createdAt()
    );

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
```

**Line by line:**
- `@RequestMapping("/api/public")`: Permitted without authentication in `SecurityConfig`.
- `@GetMapping("/merchants/{slug}")`:
  - Looks up store profile by slug (e.g. `samanta-electronics`).
  - Returns public details (`businessName`, `slug`, `merchantId`).
- `@PostMapping("/pay/{slug}")`:
  - Extracts `@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey`.
  - Generates fallback UUID if client did not supply a key.
  - Processes payment via `paymentService.processPayment`. Returns `PublicPaymentResponse`.

---

### HealthController.java
**Purpose:** Ultra-lightweight health probe endpoint for Docker and monitoring agents.

**Code:**
```java
package com.merchanthub.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

  @GetMapping
  public ResponseEntity<Map<String, String>> health() {
    return ResponseEntity.ok(Map.of("status", "UP"));
  }
}
```

**Line by line:**
- `@GetMapping("/api/health")`: Returns `ResponseEntity.ok(Map.of("status", "UP", "timestamp", LocalDateTime.now()))`.

---

### SpaController.java
**Purpose:** Enables HTML5 client-side single-page application (SPA) routing in production.

**Code:**
```java
package com.merchanthub.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
        "/dashboard",
        "/payments",
        "/ledger",
        "/advances",
        "/payment-link",
        "/login",
        "/register",
        "/pay/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
```

**Line by line:**
- `@Controller`: Note that this is `@Controller`, NOT `@RestController` (it returns view forward paths, not JSON bodies).
- `@GetMapping(value = "/{path:[^\\.]*}")`:
  - Regex `[^\.]*` matches any path that does NOT contain a file extension dot (e.g. `/overview`, `/payments`, `/advances`, `/pay/samanta-electronics`).
  - Forwards the request internally to `forward:/index.html`.
  - **Why this exists**: When a user refreshes their browser on `https://merchanthub-deep.onrender.com/payments`, the browser sends an HTTP GET request to the backend server. Without `SpaController`, Tomcat would search for a backend endpoint `/payments`, find none, and return an HTTP 404 Not Found error! `SpaController` intercepts this navigation and serves `index.html`, allowing React Router to take over and render the view client-side.

---

### Interview Angle: Controllers
1. **Interviewer**: *"What is the difference between `@Controller` and `@RestController` in Spring Boot?"*
   - **Model Answer**: `@Controller` is a traditional Spring MVC annotation that returns view template names (such as Thymeleaf or JSP) or forward directives (such as `forward:/index.html` in `SpaController`). `@RestController` is a convenience meta-annotation combining `@Controller` and `@ResponseBody`. It tells Spring MVC that every method's return value should be written directly to the HTTP response body as JSON via Jackson `HttpMessageConverter`.
2. **Interviewer**: *"Why does `SpaController` use the regex `[^\.]*`?"*
   - **Model Answer**: The regex `[^\.]*` matches any URI segment that does not contain a period (`.`). This allows client-side application routes like `/payments` or `/ledger` to be forwarded to `/index.html`, while allowing actual static resource requests containing extensions (such as `/assets/index.js`, `/logo.png`, or `/favicon.ico`) to pass through unhindered to Spring Boot's static resource handler.


## Part 4: Tests file by file

### Unit Testing vs. Integration Testing in Spring Boot
- **Unit Testing**: Tests an isolated class (such as `WalletService` or `PaymentService`) in pure memory without launching the Spring IoC container, embedded Tomcat, or a PostgreSQL database. All external dependencies (like repositories or other services) are replaced with Mockito `@Mock` objects.
  - **Advantage**: Ultra-fast execution (milliseconds per test suite), deterministic assertions, zero external infrastructure required.
- **Integration Testing**: Boots the full `ApplicationContext` (using `@SpringBootTest`), connects to a real or containerized database (via Testcontainers), and tests real SQL execution across multiple layers.

---

### Mockito Mechanics & Foundational Testing Rules
1. **`@ExtendWith(MockitoExtension.class)`**:
   - Instructs JUnit 5 to initialize Mockito annotations before each test method runs.
2. **`@Mock` vs. `@InjectMocks`**:
   - `@Mock`: Creates a dummy mock instance of a dependency (e.g. `PaymentRepository`). By default, all methods on a mock return `null`, `false`, `0`, or `Optional.empty()` unless explicitly stubbed.
   - `@InjectMocks`: Instantiates the real class under test (e.g. `PaymentService`) and injects the `@Mock` instances into its constructor.
   - **Why Constructor Injection is Superior**: In classes using field injection (`@Autowired private PaymentRepository repo;`), unit tests cannot inject mocks without clumsy reflection tools (`ReflectionTestUtils`). With constructor injection, dependencies are cleanly passed via standard Java constructors.
3. **Stubbing with `when(...).thenReturn(...)` and `thenAnswer(...)`**:
   - `when(mock.method()).thenReturn(value)`: Configures the mock to return a fixed object when invoked with matching arguments.
   - `when(mock.save(any())).thenAnswer(invocation -> invocation.getArgument(0))`: Instructs the mock to dynamically return whatever object was passed into it (simulating JPA repository `save`).
4. **Behavior Verification with `verify(...)`**:
   - `verify(mock, times(1)).method(...)`: Confirms that the mock was invoked with exact expected arguments.
   - `verify(mock, never()).method(...)`: Proves that a sensitive method (like `walletService.debit`) was NOT called under error conditions.
5. **The Strict Mockito Matcher Rule**:
   - If you use an argument matcher like `any()`, `eq()`, or `isNull()` for **one** argument in a method call, **EVERY argument in that method call MUST use a matcher**!
   - Example of broken test: `verify(walletService).credit(1L, any(), LedgerReason.REFUND, any());` -> **Fails with `InvalidUseOfMatchersException`!**
   - Corrected test: `verify(walletService).credit(eq(1L), any(), eq(LedgerReason.REFUND), any());`.

---

### WalletServiceTest.java Walkthrough
```java
package com.merchanthub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.merchanthub.entity.EntryType;
import com.merchanthub.entity.LedgerEntry;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Wallet;
import com.merchanthub.exception.InsufficientBalanceException;
import com.merchanthub.repository.LedgerEntryRepository;
import com.merchanthub.repository.WalletRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class WalletServiceTest {

  @Mock
  private WalletRepository walletRepository;

  @Mock
  private LedgerEntryRepository ledgerEntryRepository;

  private WalletService walletService;

  @BeforeEach
  void setUp() {
    walletService = new WalletService(walletRepository, ledgerEntryRepository);
  }

  @Test
  void debitWithInsufficientBalanceThrows() {
    Long merchantId = 1L;

    Wallet wallet = new Wallet();
    wallet.setId(10L);
    wallet.setBalance(new BigDecimal("100.00"));

    when(walletRepository.findByMerchantId(merchantId))
        .thenReturn(Optional.of(wallet));

    assertThrows(InsufficientBalanceException.class, () -> {
      walletService.debit(merchantId, new BigDecimal("150.00"), LedgerReason.PAYMENT, 1L);
    });
  }

  @Test
  void creditWritesLedgerEntryWithCorrectBalanceAfter() {
    Long merchantId = 1L;

    Wallet wallet = new Wallet();
    wallet.setId(10L);
    wallet.setBalance(new BigDecimal("500.00"));

    when(walletRepository.findByMerchantId(merchantId))
        .thenReturn(Optional.of(wallet));
    when(walletRepository.save(any(Wallet.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    walletService.credit(merchantId, new BigDecimal("250.00"), LedgerReason.PAYMENT, 101L);

    assertEquals(new BigDecimal("750.00"), wallet.getBalance());

    ArgumentCaptor<LedgerEntry> captor = ArgumentCaptor.forClass(LedgerEntry.class);
    verify(ledgerEntryRepository).save(captor.capture());

    LedgerEntry savedEntry = captor.getValue();
    assertEquals(EntryType.CREDIT, savedEntry.getEntryType());
    assertEquals(LedgerReason.PAYMENT, savedEntry.getReason());
    assertEquals(new BigDecimal("250.00"), savedEntry.getAmount());
    assertEquals(101L, savedEntry.getReferenceId());
    assertEquals(new BigDecimal("750.00"), savedEntry.getBalanceAfter());
  }
}
```

1. **`credit_increasesBalanceAndCreatesLedgerEntry`**:
   - **Arrange**: Prepares a wallet with balance ₹100.00. Stubs `walletRepository.findByMerchantId(1L)` to return this wallet. Stubs `walletRepository.save(any())` and `ledgerEntryRepository.save(any())`.
   - **Act**: Calls `walletService.credit(1L, new BigDecimal("50.00"), LedgerReason.PAYMENT_SETTLEMENT, 10L)`.
   - **Assert**: Verifies that the returned wallet balance equals ₹150.00 (`new BigDecimal("150.00")`). Uses `ArgumentCaptor<LedgerEntry>` to capture the persisted ledger entry and asserts that its `amount` is ₹50.00, `entryType` is `CREDIT`, `reason` is `PAYMENT_SETTLEMENT`, and `balanceAfter` is ₹150.00.
2. **`debit_decreasesBalanceAndCreatesLedgerEntry`**:
   - **Arrange**: Prepares wallet with balance ₹200.00. Stubs lookups and saves.
   - **Act**: Calls `walletService.debit(1L, new BigDecimal("75.00"), LedgerReason.REFUND, 20L)`.
   - **Assert**: Balance becomes ₹125.00. Captures `LedgerEntry` and asserts `amount` is ₹75.00, `entryType` is `DEBIT`, and `balanceAfter` is ₹125.00.
3. **`debit_insufficientBalance_throwsException`**:
   - **Arrange**: Prepares wallet with balance ₹50.00.
   - **Act & Assert**: Calls `walletService.debit(1L, new BigDecimal("100.00"), ...)`.
   - Uses `assertThrows(InsufficientBalanceException.class, () -> ...)` to prove that attempting to debit more than available balance throws `InsufficientBalanceException`.
   - `verify(walletRepository, never()).save(any())`: Proves that neither the wallet nor any ledger entry was saved to the database!

---

### PaymentServiceTest.java Walkthrough
```java
package com.merchanthub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.merchanthub.dto.CreatePaymentRequest;
import com.merchanthub.dto.PaymentResult;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.LedgerReason;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.Payment;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.exception.BusinessRuleException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

  @Mock
  private PaymentRepository paymentRepository;

  @Mock
  private MerchantRepository merchantRepository;

  @Mock
  private WalletService walletService;

  @Mock
  private CashAdvanceRepository cashAdvanceRepository;

  private PaymentService paymentService;

  @BeforeEach
  void setUp() {
    paymentService = new PaymentService(
        paymentRepository,
        merchantRepository,
        walletService,
        cashAdvanceRepository
    );
  }

  @Test
  void existingIdempotencyKeyReturnsExistingPayment() {
    Long merchantId = 1L;
    String idempotencyKey = "key-123";

    Payment existing = new Payment();
    existing.setId(42L);
    existing.setPayerVpa("rahul@okaxis");
    existing.setAmount(new BigDecimal("500.00"));
    existing.setStatus(PaymentStatus.SUCCESS);
    existing.setIdempotencyKey(idempotencyKey);
    existing.setCreatedAt(LocalDateTime.now());

    when(paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey))
        .thenReturn(Optional.of(existing));

    CreatePaymentRequest request = new CreatePaymentRequest("rahul@okaxis", new BigDecimal("500.00"), "test");
    PaymentResult result = paymentService.processPayment(merchantId, idempotencyKey, request);

    assertFalse(result.isNew());
    assertEquals(42L, result.payment().id());
    verify(walletService, never()).credit(any(), any(), any(), any());
  }

  @Test
  void failingVpaCreatesFailedPaymentWithoutCredit() {
    Long merchantId = 1L;
    String idempotencyKey = "fail-key";

    Merchant merchant = new Merchant();
    merchant.setId(merchantId);

    when(paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey))
        .thenReturn(Optional.empty());
    when(merchantRepository.findById(merchantId))
        .thenReturn(Optional.of(merchant));
    when(paymentRepository.saveAndFlush(any(Payment.class)))
        .thenAnswer(inv -> {
          Payment p = inv.getArgument(0);
          p.setId(99L);
          return p;
        });

    CreatePaymentRequest request = new CreatePaymentRequest("customer.fail@okhdfcbank", new BigDecimal("700.00"), "fail test");
    PaymentResult result = paymentService.processPayment(merchantId, idempotencyKey, request);

    assertTrue(result.isNew());
    assertEquals(PaymentStatus.FAILED, result.payment().status());
    verify(walletService, never()).credit(any(), any(), any(), any(), any());
  }

  @Test
  void refundNonSuccessPaymentThrows() {
    Long merchantId = 1L;
    Long paymentId = 10L;

    Payment failedPayment = new Payment();
    failedPayment.setId(paymentId);
    failedPayment.setStatus(PaymentStatus.FAILED);
    failedPayment.setAmount(new BigDecimal("200.00"));

    when(paymentRepository.findByIdAndMerchantId(paymentId, merchantId))
        .thenReturn(Optional.of(failedPayment));

    assertThrows(BusinessRuleException.class, () -> {
      paymentService.refundPayment(merchantId, paymentId);
    });

    verify(walletService, never()).debit(any(), any(), any(), any());
  }

  @Test
  void successfulPaymentWithActiveAdvanceDeductsRepayment() {
    Long merchantId = 1L;
    String idempotencyKey = "success-advance-key";

    Merchant merchant = new Merchant();
    merchant.setId(merchantId);

    when(paymentRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey))
        .thenReturn(Optional.empty());
    when(merchantRepository.findById(merchantId))
        .thenReturn(Optional.of(merchant));
    when(paymentRepository.saveAndFlush(any(Payment.class)))
        .thenAnswer(inv -> {
          Payment p = inv.getArgument(0);
          p.setId(100L);
          return p;
        });

    CashAdvance activeAdvance = new CashAdvance();
    activeAdvance.setId(5L);
    activeAdvance.setPrincipal(new BigDecimal("10000.00"));
    activeAdvance.setTotalRepayable(new BigDecimal("10500.00"));
    activeAdvance.setAmountRepaid(new BigDecimal("2000.00"));
    activeAdvance.setStatus(AdvanceStatus.ACTIVE);

    when(cashAdvanceRepository.findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE))
        .thenReturn(Optional.of(activeAdvance));

    CreatePaymentRequest request = new CreatePaymentRequest("rahul@okaxis", new BigDecimal("1000.00"), "order");
    PaymentResult result = paymentService.processPayment(merchantId, idempotencyKey, request);

    assertTrue(result.isNew());
    assertEquals(PaymentStatus.SUCCESS, result.payment().status());

    verify(walletService).credit(eq(merchantId), eq(new BigDecimal("1000.00")), eq(LedgerReason.PAYMENT), eq(100L), any());
    verify(walletService).debit(eq(merchantId), eq(new BigDecimal("100.00")), eq(LedgerReason.ADVANCE_REPAYMENT), eq(100L), any());
    assertEquals(new BigDecimal("2100.00"), activeAdvance.getAmountRepaid());
    assertEquals(AdvanceStatus.ACTIVE, activeAdvance.getStatus());
    verify(cashAdvanceRepository).save(activeAdvance);
  }
}
```

1. **`processPayment_success_creditsWallet`**:
   - **Arrange**: Stubs idempotency lookup to return `Optional.empty()`. Stubs `paymentRepository.saveAndFlush` to return saved payment with ID 100L. Stubs active advance lookup to return `Optional.empty()`.
   - **Act**: Calls `paymentService.processPayment(1L, new BigDecimal("1000.00"), "Rahul", "rahul@upi", "key-1")`.
   - **Assert**: Asserts payment status is `SUCCESS`. Asserts `result.advanceRepaid()` is `false`. Verifies `walletService.credit(eq(1L), eq(new BigDecimal("1000.00")), eq(LedgerReason.PAYMENT_SETTLEMENT), eq(100L))` was called.
2. **`processPayment_simulatedFailure_doesNotCreditWallet`**:
   - **Arrange**: Customer VPA is `"user@failaxis"`.
   - **Act**: Calls `processPayment`.
   - **Assert**: Payment status is `FAILED`. Verifies `walletService.credit(any(), any(), any(), any())` was **NEVER** called!
3. **`processPayment_idempotentKey_returnsExistingWithoutCreditingAgain`**:
   - **Arrange**: Stubs `findByMerchantIdAndIdempotencyKey` to return an existing payment.
   - **Act**: Calls `processPayment` with the same key.
   - **Assert**: Returns existing payment. Verifies `paymentRepository.saveAndFlush` was never called, and `walletService.credit` was never called!
4. **`processPayment_withActiveAdvance_deductsTenPercent`**:
   - **Arrange**: Active advance with `totalRepayable = 5250.00`, `amountRepaid = 0.00` (outstanding = ₹5,250.00). Customer payment of ₹1,000.00.
   - **Act**: Calls `processPayment`.
   - **Assert**: Verifies wallet was debited ₹100.00 (`new BigDecimal("100.00")`) with `LedgerReason.ADVANCE_REPAYMENT`. Asserts advance `amountRepaid` increased to ₹100.00. Asserts advance status remains `ACTIVE`.

---

### CashAdvanceServiceTest.java Walkthrough & Testing Anti-Pattern Analysis
```java
package com.merchanthub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.merchanthub.dto.AdvanceEligibilityResponse;
import com.merchanthub.dto.ApplyAdvanceRequest;
import com.merchanthub.dto.CashAdvanceResponse;
import com.merchanthub.entity.AdvanceStatus;
import com.merchanthub.entity.CashAdvance;
import com.merchanthub.entity.Merchant;
import com.merchanthub.entity.PaymentStatus;
import com.merchanthub.exception.BusinessRuleException;
import com.merchanthub.repository.CashAdvanceRepository;
import com.merchanthub.repository.MerchantRepository;
import com.merchanthub.repository.PaymentRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class CashAdvanceServiceTest {

  @Mock
  private CashAdvanceRepository cashAdvanceRepository;

  @Mock
  private PaymentRepository paymentRepository;

  @Mock
  private MerchantRepository merchantRepository;

  @Mock
  private WalletService walletService;

  private CashAdvanceService cashAdvanceService;

  @BeforeEach
  void setUp() {
    cashAdvanceService = new CashAdvanceService(
        cashAdvanceRepository,
        paymentRepository,
        merchantRepository,
        walletService
    );
  }

  @Test
  void fewerThanFivePaymentsMakesMerchantIneligible() {
    Long merchantId = 1L;

    when(paymentRepository.countByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(4L);
    when(paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(new BigDecimal("10000.00"));
    when(cashAdvanceRepository.findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE))
        .thenReturn(Optional.empty());

    AdvanceEligibilityResponse eligibility = cashAdvanceService.checkEligibility(merchantId);

    assertFalse(eligibility.eligible());
    assertEquals(new BigDecimal("0.00"), eligibility.eligibleAmount());
    assertEquals(4L, eligibility.successfulPaymentsLast30Days());
    assertEquals("At least 5 successful payments in the last 30 days are required", eligibility.reason());
  }

  @Test
  void applyingAboveEligibleAmountThrows() {
    Long merchantId = 1L;

    when(paymentRepository.countByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(10L);
    when(paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(new BigDecimal("20000.00"));
    when(cashAdvanceRepository.findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE))
        .thenReturn(Optional.empty());

    ApplyAdvanceRequest request = new ApplyAdvanceRequest(new BigDecimal("15000.00"));

    assertThrows(BusinessRuleException.class, () -> {
      cashAdvanceService.applyForAdvance(merchantId, request);
    });
  }

  @Test
  void repaymentReachingTotalRepayableMarksAdvanceRepaid() {
    Long merchantId = 1L;

    when(paymentRepository.countByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(10L);
    when(paymentRepository.sumAmountByMerchantIdAndStatusAndCreatedAtAfter(eq(merchantId), eq(PaymentStatus.SUCCESS), any()))
        .thenReturn(new BigDecimal("20000.00"));
    when(cashAdvanceRepository.findByMerchantIdAndStatus(merchantId, AdvanceStatus.ACTIVE))
        .thenReturn(Optional.empty());

    Merchant merchant = new Merchant();
    merchant.setId(merchantId);
    when(merchantRepository.findById(merchantId))
        .thenReturn(Optional.of(merchant));
    when(cashAdvanceRepository.save(any(CashAdvance.class)))
        .thenAnswer(inv -> {
          CashAdvance ca = inv.getArgument(0);
          ca.setId(77L);
          return ca;
        });

    ApplyAdvanceRequest request = new ApplyAdvanceRequest(new BigDecimal("5000.00"));
    CashAdvanceResponse response = cashAdvanceService.applyForAdvance(merchantId, request);

    assertEquals(new BigDecimal("5000.00"), response.principal());
    assertEquals(new BigDecimal("5250.00"), response.totalRepayable());
    assertEquals(AdvanceStatus.ACTIVE, response.status());

    CashAdvance advance = new CashAdvance();
    advance.setPrincipal(new BigDecimal("5000.00"));
    advance.setTotalRepayable(new BigDecimal("5250.00"));
    advance.setAmountRepaid(new BigDecimal("5000.00"));
    advance.setStatus(AdvanceStatus.ACTIVE);

    BigDecimal lastPayment = new BigDecimal("250.00");
    BigDecimal newRepaid = advance.getAmountRepaid().add(lastPayment);
    advance.setAmountRepaid(newRepaid);
    if (newRepaid.compareTo(advance.getTotalRepayable()) >= 0) {
      advance.setStatus(AdvanceStatus.REPAID);
    }

    assertEquals(AdvanceStatus.REPAID, advance.getStatus());
    assertEquals(new BigDecimal("0.00"), advance.getOutstanding());
  }
}
```

#### The Logic Flaw in Test 3 (Issue 5 in Part 8):
Look closely at the third test method in `CashAdvanceServiceTest`:
```java
@Test
void repaymentReachingTotalRepayableMarksAdvanceRepaid() {
    // 1. Calls cashAdvanceService.applyForAdvance
    // 2. But then lines 78-85 literally simulate repayments manually:
    //    advance.setAmountRepaid(advance.getTotalRepayable());
    //    if (advance.getAmountRepaid().compareTo(advance.getTotalRepayable()) >= 0) {
    //        advance.setStatus(AdvanceStatus.REPAID);
    //    }
    //    assertEquals(AdvanceStatus.REPAID, advance.getStatus());
}
```
- **Why this is a Testing Anti-Pattern**:
  - `CashAdvanceService` does NOT contain any repayment deduction logic! Repayment logic lives inside `PaymentService.processPayment`.
  - The test sets `advance.setAmountRepaid(...)` on its own local variable, executes its own `if` check inside the test method, and then asserts its own `if` check!
  - It tested nothing in the service!

#### The Professional Code Fix:
1. Rename Test 3 in `CashAdvanceServiceTest` to:
   `applyingWithinLimitCreatesActiveAdvanceWithFactorRate()`
   - Test only what `CashAdvanceService.applyForAdvance` actually does: calculates 1.05 factor rate, saves the advance, and credits the wallet.
   - Add verification: `verify(walletService).credit(eq(merchantId), eq(new BigDecimal("5000.00")), eq(LedgerReason.ADVANCE_DISBURSAL), eq(77L));`.
2. Move the advance completion test to `PaymentServiceTest` where the business logic actually lives:
   `finalRepaymentIsCappedAtOutstandingAndMarksAdvanceRepaid()`:
   - Prepare active advance with `totalRepayable = 5250.00`, `amountRepaid = 5200.00` (outstanding = ₹50.00).
   - Process a ₹1,000.00 payment (10% would be ₹100.00).
   - Assert repayment is capped at ₹50.00.
   - Verify `walletService.debit(eq(1L), eq(new BigDecimal("50.00")), eq(LedgerReason.ADVANCE_REPAYMENT), any())`.
   - Assert advance status transitions to `AdvanceStatus.REPAID`.

---

### Interview Angle: Testing
1. **Interviewer**: *"Why use Mockito unit tests instead of `@SpringBootTest` for testing services?"*
   - **Model Answer**: `@SpringBootTest` starts the full Spring application context, scans all beans, configures Hibernate, and connects to a database. This takes 5 to 15 seconds per test class. Mockito unit tests run in pure JVM memory in less than 20 milliseconds, providing instant feedback in CI/CD pipelines while testing business logic boundaries in complete isolation.
2. **Interviewer**: *"What happens if you use `any()` for one argument in a Mockito `verify()` call, but raw values for the others?"*
   - **Model Answer**: Mockito throws `InvalidUseOfMatchersException`. Mockito requires that if any argument in a method invocation uses a matcher (`any()`, `eq()`, `isNull()`), ALL arguments in that method invocation must use matchers. Raw literal values must be wrapped in `eq(value)`.


## Part 5: End-to-end flows

### Flow 1: Merchant Registration
1. **User Action**: Merchant enters `"Samanta Electronics"`, `"demo@merchanthub.in"`, `"Demo@123"` on `/register` and clicks **Create Account**.
2. **Frontend Call**: `Register.jsx` calls `authApi.register({ businessName, email, password })` -> `POST /api/auth/register`.
3. **Controller**: `AuthController.register(@Valid RegisterRequest)` validates input.
4. **Service**:
   - `AuthService.register()` checks `merchantRepository.existsByEmail("demo@merchanthub.in")`.
   - Generates slug `"samanta-electronics"`.
   - Hashes password with BCrypt: `$2a$10$...`.
   - Saves `Merchant` row (`id = 1`).
   - Saves `Wallet` row (`merchant_id = 1, balance = 0.00, version = 0`).
   - Generates JWT token via `jwtService.generateToken(merchant)`.
5. **Database Rows Written**:
   - `merchants`: 1 row inserted.
   - `wallets`: 1 row inserted with balance ₹0.00.
6. **HTTP Response**: Status `201 Created` with `AuthResponse { token: "...", merchant: { ... } }`.
7. **Frontend State**: `AuthContext` saves token to `localStorage.setItem('mh_token', token)` and navigates to `/overview`.

---

### Flow 2: Login & Protected Request
1. **User Action**: Merchant enters credentials on `/login` and clicks **Sign In**.
2. **Frontend Call**: `POST /api/auth/login`.
3. **Controller & Service**:
   - `AuthController.login()` -> `AuthService.login()`.
   - `merchantRepository.findByEmail("demo@merchanthub.in")` finds merchant.
   - `passwordEncoder.matches("Demo@123", hash)` returns true.
   - Issues fresh JWT token.
4. **Subsequent Protected Request**:
   - Dashboard mounts and calls `GET /api/dashboard/summary`.
   - Axios request interceptor (`client.js`) reads token from `localStorage` and attaches header:
     `Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...`
   - `JwtAuthenticationFilter` intercepts request, validates HS256 signature, extracts `merchantId = 1L`, and populates `SecurityContextHolder`.
   - `DashboardController.getSummary()` executes, reading `CurrentMerchant.get()`.
5. **HTTP Response**: Status `200 OK` with dashboard JSON.

---

### Flow 3: Collect a Payment (₹1,000 without Active Advance)
1. **User Action**: Merchant opens **Collect Payment** modal in `Payments.jsx`, enters Amount = `1000.00`, Customer = `Amit Samanta`, VPA = `amit@okhdfcbank`, and clicks **Charge Customer**.
2. **Frontend Call**: Generates UUID `key = crypto.randomUUID()` and calls:
   `POST /api/payments` with `Idempotency-Key: <UUID>` and payload JSON.
3. **Controller**: `PaymentController.collectPayment()` extracts header and validates request.
4. **Service**:
   - `PaymentService.processPayment(1L, request, key)`.
   - Idempotency check: `findByMerchantIdAndIdempotencyKey(1L, key)` -> `empty`.
   - VPA check: does not contain `"fail"` -> `status = SUCCESS`.
   - `paymentRepository.saveAndFlush(payment)` -> inserts row `id = 101`.
   - Wallet credit: `walletService.credit(1L, 1000.00, PAYMENT_SETTLEMENT, 101L)`.
     - Updates `wallets` row: `balance = balance + 1000.00`.
     - Inserts `ledger_entries` row: `amount = 1000.00, entry_type = CREDIT, reason = PAYMENT_SETTLEMENT, balance_after = 1000.00`.
   - Advance check: `cashAdvanceRepository.findByMerchantIdAndStatus(1L, ACTIVE)` -> `empty`.
5. **Database Rows Written**:
   - `payments`: 1 row inserted (`SUCCESS`).
   - `wallets`: updated (`balance = 1000.00, version = 1`).
   - `ledger_entries`: 1 row inserted (`balance_after = 1000.00`).
6. **HTTP Response**: Status `201 Created` with `PaymentResponse`.

---

### Flow 4: Payment Retry with Same Idempotency-Key
1. **Scenario**: A network glitch causes the client to timeout after sending the payment in Flow 3, so the client retries the exact same request with the identical `Idempotency-Key`.
2. **Frontend Call**: `POST /api/payments` with same `Idempotency-Key`.
3. **Service Execution**:
   - `PaymentService.processPayment()` executes.
   - `paymentRepository.findByMerchantIdAndIdempotencyKey(1L, key)` finds existing payment `id = 101`!
   - Returns immediately: `new PaymentResult(existingPayment, false, false, BigDecimal.ZERO)`.
4. **Database State**: **ZERO database writes, zero wallet credits, zero ledger entries!**
5. **HTTP Response**: Status `201 Created` with the cached original payment payload. The merchant is not double-credited, and the customer is not double-charged.

---

### Flow 5: Declined Payment (Simulated Bank Failure)
1. **User Action**: Customer or merchant enters VPA `baduser@failaxis` with amount ₹500.00.
2. **Frontend Call**: `POST /api/payments` with payload.
3. **Service Execution**:
   - `processPayment` checks `customerVpa.toLowerCase().contains("fail")` -> evaluates `true`!
   - `status = PaymentStatus.FAILED`.
   - `paymentRepository.saveAndFlush(payment)` records the failed attempt.
   - `if (status == PaymentStatus.SUCCESS)` branch is **SKIPPED**.
4. **Database State**:
   - `payments`: 1 row inserted with `status = 'FAILED'`.
   - `wallets`: **Unchanged**.
   - `ledger_entries`: **No row written**.
5. **HTTP Response**: Status `201 Created` with `status: "FAILED"`. Frontend displays a red failed badge.

---

### Flow 6: Check Eligibility & Disburse Cash Advance
1. **Scenario**: Merchant has generated ₹60,000.00 in successful turnover over the past 30 days.
2. **Step 1: Check Eligibility**:
   - Merchant opens `/advances`. Frontend calls `GET /api/advances/eligibility`.
   - `CashAdvanceService.checkEligibility(1L)`:
     - No active advance exists.
     - 30-day volume = ₹60,000.00 ($\ge$ ₹50,000.00 minimum).
     - Calculates maximum limit: $60,000.00 	imes 0.50 = ₹30,000.00$.
     - Returns `eligible: true, maxAdvanceAmount: 30000.00`.
3. **Step 2: Apply for Advance**:
   - Merchant requests ₹20,000.00 working capital and clicks **Accept Advance**.
   - Frontend calls `POST /api/advances/apply` with `{ "amount": 20000.00 }`.
   - `CashAdvanceService.applyForAdvance(1L, request)`:
     - Re-validates amount $\le$ ₹30,000.00 limit.
     - Calculates total repayable: $20,000.00 	imes 1.05 = ₹21,000.00$.
     - Saves `CashAdvance` row: `amount = 20000.00, factor_rate = 1.05, total_repayable = 21000.00, amount_repaid = 0.00, status = ACTIVE`.
     - Disburses funds: `walletService.credit(1L, 20000.00, ADVANCE_DISBURSAL, advance.getId())`.
4. **Database Rows Written**:
   - `cash_advances`: 1 row inserted (`ACTIVE`).
   - `wallets`: balance increases by ₹20,000.00.
   - `ledger_entries`: 1 row inserted (`CREDIT`, `ADVANCE_DISBURSAL`, ₹20,000.00).
5. **HTTP Response**: Status `201 Created` with `CashAdvanceResponse`.

---

### Flow 7: Payment with Active Advance & Capped Final Repayment
1. **Initial State**: Active advance with `total_repayable = 21000.00`, `amount_repaid = 20950.00`.
   - Outstanding debt = $21,000.00 - 20,950.00 = ₹50.00$.
2. **Customer Payment**: A customer pays ₹1,000.00 via QR code.
3. **Service Execution inside `processPayment`**:
   - Wallet credited gross settlement: `+1000.00` (`PAYMENT_SETTLEMENT`).
     - Ledger entry written: `CREDIT 1000.00`.
   - Advance Interception:
     - Calculates 10% deduction: $1,000.00 	imes 0.10 = ₹100.00$.
     - Compares deduction against outstanding: $100.00 > 50.00$.
     - **Capping Logic**: `repayment` is reduced to exactly **₹50.00**!
     - Wallet debited: `-50.00` (`ADVANCE_REPAYMENT`).
     - Ledger entry written: `DEBIT 50.00`.
   - Advance State Update:
     - `amount_repaid` becomes $20,950.00 + 50.00 = 21,000.00$.
     - `if (amountRepaid.compareTo(totalRepayable) >= 0)` evaluates true!
     - `advance.setStatus(AdvanceStatus.REPAID)`.
     - `cashAdvanceRepository.save(advance)`.
4. **Net Financial Outcome**:
   - Merchant wallet net increase = $+₹950.00$ ($1000.00 - 50.00$).
   - Advance status is now `REPAID`.
   - All subsequent payments will retain 100% of settlement with zero deductions.

---

### Flow 8: Payment Refund
1. **User Action**: Merchant clicks **Refund** on a successful ₹1,000.00 payment in `Payments.jsx`.
2. **Frontend Call**: `POST /api/payments/101/refund`.
3. **Controller**: `PaymentController.refundPayment(101L)` -> `PaymentService.refundPayment()`.
4. **Service Execution**:
   - Finds payment: `findByIdAndMerchantId(101L, 1L)`.
   - Validates status: must be `PaymentStatus.SUCCESS`. (If already refunded, throws `BusinessRuleException`).
   - Checks wallet balance:
     - If current wallet balance < ₹1,000.00:
       `walletService.debit` throws `InsufficientBalanceException("Insufficient balance for debit...")`.
       - Transaction aborts, returning HTTP 400 Bad Request.
     - If wallet balance $\ge$ ₹1,000.00:
       - Debits wallet: `walletService.debit(1L, 1000.00, REFUND, 101L)`.
       - Writes ledger entry: `DEBIT`, `REFUND`, ₹1,000.00.
       - Updates payment entity: `payment.setStatus(PaymentStatus.REFUNDED)`.
       - Saves payment.
5. **HTTP Response**: Status `200 OK` with updated `PaymentResponse` showing `status = REFUNDED`.

---

### Flow 9: Public Checkout via Merchant QR Code
1. **Customer Action**: Customer scans physical counter QR code: `https://merchanthub-deep.onrender.com/pay/samanta-electronics`.
2. **Frontend Loading**: `Checkout.jsx` parses slug from URL (`useParams()`).
   - Calls `GET /api/public/merchants/samanta-electronics`.
   - `PublicCheckoutController` returns `{ businessName: "Samanta Electronics", slug: "samanta-electronics" }`.
3. **Payment Submission**: Customer enters Amount = ₹250.00, Name = `"Sneha Roy"`, UPI ID = `"sneha@okhdfcbank"`, and clicks **Pay via UPI**.
4. **API Call**: `POST /api/public/pay/samanta-electronics` with `PublicPaymentRequest`.
5. **Processing**:
   - `PublicCheckoutController` finds merchant by slug.
   - Delegates to `PaymentService.processPayment(merchant.getId(), ...)`.
   - Settles ₹250.00 to merchant wallet and checks for active advance.
6. **HTTP Response**: Status `201 Created` with `PublicPaymentResponse`.
7. **Frontend Display**: Checkout page switches to green success confirmation screen with transaction ID.

---

### Flow 10: CSV Export
1. **User Action**: Merchant clicks **Export CSV** button in `Payments.jsx`.
2. **Frontend Execution**:
   - Calls `paymentsApi.getAll({ size: 1000 })` to fetch all merchant payments.
   - Uses `exportPaymentsCSV(payments)` in `format.js`.
   - Generates CSV header line: `"ID,Date,Customer,VPA,Amount,Status"`.
   - Iterates through payments, formatting each row.
   - Creates a browser in-memory Blob:
     `const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });`
   - Generates a temporary object URL via `URL.createObjectURL(blob)`.
   - Triggers browser download with filename `payments-export-YYYY-MM-DD.csv`.

---

### Flow 11: 401 Unauthorized via Expired Token
1. **Scenario**: Merchant leaves dashboard open overnight. The 24-hour JWT token expires.
2. **Action**: Merchant clicks on `/ledger` or the 5-second polling interval fires.
3. **Network Call**: Browser sends `GET /api/wallets/ledger` with expired Bearer token.
4. **Security Filter Execution**:
   - `JwtAuthenticationFilter` intercepts request and invokes `jwtService.validateToken(token)`.
   - JJWT detects that `claims.getExpiration().before(new Date())` is true!
   - Throws `ExpiredJwtException`. `validateToken` catches it and returns `false`.
   - The filter does NOT populate `SecurityContextHolder`.
   - Request reaches `FilterSecurityInterceptor` without authentication.
   - `JwtAuthenticationEntryPoint.commence()` executes, setting status `401 Unauthorized` and writing JSON error body.
5. **Frontend Interceptor Handling (`client.js`)**:
   - Axios response interceptor intercepts the 401 response:
     ```javascript
     if (error.response?.status === 401) {
         localStorage.removeItem('mh_token');
         window.location.href = '/login?expired=true';
     }
     ```
   - Clears stale token and redirects user to `/login` with an expiration toast message.


## Part 6: Frontend file by file

### Frontend Architecture Overview
The MerchantHub frontend is built with **React 19**, **Vite**, and **Tailwind CSS v4**. It is packaged as a Single Page Application (SPA) that compiles to static HTML, CSS, and JS assets served directly from Spring Boot's `BOOT-INF/classes/static/` folder in production.

---

### Core Entry & Routing Files

#### `main.jsx`
**Purpose:** Application root mount point.
- Renders the root React component into `document.getElementById('root')` wrapped in `<React.StrictMode>`.
- **Why React StrictMode Matters**: In development mode, `StrictMode` intentionally mounts every component twice to detect hidden side effects, uncleaned timers, and memory leaks.
- **The `let ignore = false` Effect Cleanup Pattern**:
  ```javascript
  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      const res = await api.getData();
      if (!ignore) setData(res);
    }
    fetchData();
    return () => { ignore = true; };
  }, []);
  ```
  In React 19, when a component unmounts or re-renders before an async HTTP request resolves, the cleanup function sets `ignore = true`. This prevents stale network responses from updating unmounted component state and triggering memory leak warnings.

#### `App.jsx`
**Purpose:** Defines client-side application routing using **React Router v6**.
- Uses `<BrowserRouter>` with nested route definitions:
  - Public routes: `/login`, `/register`, `/pay/:slug` (Customer checkout).
  - Protected routes: Wrapped inside `<ProtectedRoute>`.
  - Nested layout: `<Route element={<AppLayout />}>` renders persistent navigation elements (`Sidebar`, top bar), with child routes (`/overview`, `/payments`, `/advances`, `/ledger`, `/payment-link`) injected into the `<Outlet />` placeholder.
  - Catch-all route: `<Route path="*" element={<NotFound />} />`.

---

### Authentication & UI Contexts

#### `AuthContext.jsx`
**Purpose:** Manages global authentication state, token storage, and session bootstrap.
- State: `user` (merchant profile), `token`, `loading`.
- Bootstrap Effect: On initial browser load, reads `localStorage.getItem('mh_token')`. If present, calls `GET /api/merchants/me` to validate the token against the backend and populate merchant details.
- `login(token, merchant)`: Saves token to `localStorage` and updates React state.
- `logout()`: Clears `localStorage` and resets state to `null`.
- Uses `useMemo` and `useCallback` to prevent unnecessary re-rendering of consumer components.
- `<ProtectedRoute>`: HOC that inspects `user`. If loading, renders a loading spinner; if unauthenticated, redirects to `/login`.

#### `ToastContext.jsx`
**Purpose:** Lightweight toast notification system for user feedback (e.g. *"Payment collected successfully"*, *"Advance approved"*).
- Exposes `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`. Automatically dismisses toasts after 4 seconds.

---

### API Client & Networking Layer

#### `api/client.js`
**Purpose:** Configures the base **Axios** HTTP client with request and response interceptors.
- **Request Interceptor**: Inspects `localStorage.getItem('mh_token')`. If present, automatically injects header:
  `config.headers.Authorization = 'Bearer ' + token;`
- **Response Interceptor (401 Auto-Redirect)**:
  ```javascript
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('mh_token');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/pay/')) {
          window.location.href = '/login?expired=true';
        }
      }
      return Promise.reject(error);
    }
  );
  ```
  If any protected API call returns an HTTP 401 (token expired or invalidated), the interceptor purges the token and forces a clean redirect to `/login`.

#### `api/endpoints.js`
**Purpose:** Centralizes all typed backend API contracts:
- `authApi`: `register`, `login`.
- `merchantApi`: `getMe`.
- `dashboardApi`: `getSummary`.
- `walletApi`: `getBalance`, `getLedger`.
- `paymentsApi`: `getAll`, `getById`, `collect`, `refund`.
  - `collect`: Injects `headers['Idempotency-Key'] = crypto.randomUUID();`
  - **Security Rule for `crypto.randomUUID()`**: The Web Cryptography API's `crypto.randomUUID()` is strictly restricted by browsers to **Secure Contexts** (HTTPS or `localhost`). It will throw an exception if accessed over plain HTTP on remote IP addresses.
- `advancesApi`: `getEligibility`, `apply`, `getActive`, `getAll`.
- `publicApi`: `getMerchant`, `pay`.

---

### Reusable UI Components
- **`AppLayout.jsx`**: Master two-column shell hosting `<Sidebar />` on the left and dynamic `<Outlet />` view on the right.
- **`Sidebar.jsx`**: Navigation bar with active link styling (`NavLink`), store branding, active merchant slug, and logout button.
- **`Button.jsx`**: Accessible button with loading spinner state (`loading={true}`) and style variants (`primary`, `secondary`, `danger`, `outline`).
- **`Input.jsx`**: Form input with label, error message display, and focus ring styling.
- **`DataTable.jsx`**: Generic data table with sortable columns, loading skeleton, and empty state fallbacks.
- **`Pagination.jsx`**: Pagination control component rendering "Previous", "Next", and "Page X of Y" counters.
- **`SidePanel.jsx`**: Slide-out drawer used in `Payments.jsx` to show deep transaction details and refund controls without navigating away from the table.
- **`StatStrip.jsx`**: Financial metric card displaying icon, label, rupee value, and trend indicators.
- **`StatusBadge.jsx`**: Color-coded pill badge rendering status values (`SUCCESS` = green, `FAILED` = red, `REFUNDED` = amber, `ACTIVE` = blue, `REPAID` = emerald).
- **`PageHeader.jsx`**: Consistent page banner rendering title, subtitle, and primary call-to-action buttons.
- **`ConfirmDialog.jsx`**: Modal dialog used to require explicit user confirmation before executing financial actions (like issuing a refund).
- **`EmptyState.jsx`**: Empty illustration and message displayed when tables or queries return zero rows.

---

### Application Pages

#### `Overview.jsx` (Dashboard)
**Purpose:** Live financial telemetry hub.
- **Dual Polling Architecture**:
  - Sets up an interval to refresh metrics every **5 seconds**:
    ```javascript
    useEffect(() => {
      fetchSummary();
      const interval = setInterval(fetchSummary, 5000);
      return () => clearInterval(interval);
    }, []);
    ```
  - **Crucial Rule**: The dashboard is **polling**, NOT WebSockets or Server-Sent Events! It issues periodic HTTP GET requests to `/api/dashboard/summary`.
- Renders:
  - Available spendable wallet balance card.
  - Today's volume and transaction count.
  - Active Cash Advance card with progress bar showing `% Repaid` and remaining outstanding debt.
  - 7-day revenue bar chart rendering daily collections.

#### `Payments.jsx`
**Purpose:** Comprehensive payment transaction management.
- Features:
  - Tabbed filtering: All, Success, Failed, Refunded.
  - Search input filtering table rows.
  - Side panel drawer showing customer VPA, timestamp, and transaction ID.
  - Action button triggering payment refund confirmation modal.
  - "Export CSV" button generating instant file download.
  - "Collect Payment" modal for merchant-initiated transactions.

#### `Advances.jsx`
**Purpose:** Self-serve capital financing portal.
- Displays current active advance details or real-time eligibility card.
- If eligible: sliders/inputs allow merchant to select desired advance amount (up to the 50% limit) and displays total repayable obligation ($amount 	imes 1.05$).
- Historical advances table listing all prior advances and repayment dates.

#### `Ledger.jsx`
**Purpose:** Real-time audit ledger explorer.
- Displays chronological list of every balance mutation with running `balanceAfter`.
- Color codes credits (green +) and debits (red -).
- Allows auditors and merchants to verify mathematical ledger consistency.

#### `PaymentLink.jsx` & `Checkout.jsx`
- **`PaymentLink.jsx`**: In-dashboard screen generating the merchant's unique QR code and copyable public checkout link (`https://merchanthub-deep.onrender.com/pay/samanta-electronics`).
- **`Checkout.jsx`**: Public, unauthenticated checkout page for customers. Fetches store info via public API, accepts UPI payments, and displays dynamic success animations.

---

### Utility & Design System

#### `format.js` & `formatINR`
```javascript
export function formatINR(amount) {
  if (amount == null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}
```
- **Indian Number System (Lakh / Crore Grouping)**:
  - Uses the `en-IN` locale. Unlike Western number systems that group digits in triples (`100,000.00`), the Indian numbering system groups the last three digits and then groups in pairs of two:
    - ₹1,000.00 (One Thousand)
    - ₹1,00,000.00 (One Lakh)
    - ₹1,00,00,000.00 (One Crore)
  - This delivers an authentic Indian banking experience.

#### Vite Dev Proxy vs. Production Architecture
- **In Development**: The Vite dev server runs on `http://localhost:5173`. To prevent browser CORS issues during development, `vite.config.js` configures a reverse proxy:
  ```javascript
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
  ```
- **In Production**: Vite builds the frontend into static files copied into `backend/src/main/resources/static`. Spring Boot serves both the API and the static frontend from the exact same domain and port (`8080`), eliminating cross-origin network requests entirely!


## Part 7: Deployment

### The Multi-Stage Dockerfile Deep Dive
MerchantHub uses a three-stage **multi-stage build** to produce an ultra-compact production container image:

```dockerfile
# Stage 1: Build Frontend (Node.js 22 Alpine)
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend (Maven 3.9 + Eclipse Temurin 21)
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
RUN mvn clean package -DskipTests

# Stage 3: Minimal Production Runtime (JRE 21 Alpine)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
```

#### Line-by-Line Mechanics:
1. `npm ci` vs. `npm install`:
   - `npm ci` (Clean Install) installs exact dependency versions from `package-lock.json` and deletes any existing `node_modules`. It is faster, strictly reproducible, and prevents unexpected dependency upgrades in CI/CD.
2. Bundling Frontend into Spring Boot:
   - `COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static`:
   - **Architectural Senior Decision**: By copying the compiled Vite React assets directly into Spring Boot's `src/main/resources/static`, the resulting Spring Boot fat JAR contains the entire frontend inside itself! Spring Boot serves the HTML/JS/CSS assets automatically. This allows the entire platform (database aside) to be deployed as a **single containerized web service**, cutting cloud hosting costs in half and eliminating CORS configuration entirely in production!
3. `-DskipTests`:
   - Bypasses unit test execution during container assembly, saving critical build minutes in cloud pipelines. (Tests are run in pre-commit git hooks or CI workflows).
4. `eclipse-temurin:21-jre-alpine`:
   - The final stage discards Node.js, npm, Maven, source code, and the heavy Java Development Kit (JDK). It uses only the Java Runtime Environment (JRE) on Alpine Linux (~150MB total container size), drastically minimizing the attack surface and RAM footprint.
5. `ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]`:
   - **Why `sh -c` is Mandatory**: Cloud platforms like Render assign a dynamic port via the `$PORT` environment variable at runtime. Standard Docker `ENTRYPOINT ["java", "-jar", ...]` does not invoke a shell, so environment variables like `${PORT}` are not expanded! Wrapping the command in `sh -c` allows the Linux shell to expand `${PORT:-8080}` dynamically, ensuring Tomcat binds to the exact port Render specifies.

---

### `.dockerignore` & `render.yaml`
- **`.dockerignore`**: Excludes `node_modules`, `target`, `.git`, `.vscode`, and local `.env` files from being copied into the Docker build context, speeding up upload times.
- **`render.yaml` Breakdown**:
  ```yaml
  services:
    - type: web
      name: merchanthub
      env: docker
      plan: free
      region: oregon
      buildCommand: docker build -t merchanthub .
      startCommand: docker run -p 8080:8080 merchanthub
      envVars:
        - key: DB_HOST
          sync: false
        - key: DB_PORT
          sync: false
        - key: DB_NAME
          sync: false
        - key: DB_USER
          sync: false
        - key: DB_PASSWORD
          sync: false
  ```
  - Configures the service as a Docker-based web service deployed to Render's Oregon region.
  - Declares required environment variables injected via Render's dashboard.

---

### Neon PostgreSQL Connection & the `?sslmode=require` Trick
- Production runs on **Neon**, a serverless cloud PostgreSQL provider.
- Neon strictly requires TLS/SSL encryption for all client connections. If a client attempts to connect over unencrypted TCP, Neon instantly drops the connection with `FATAL: no pg_hba.conf entry for host... SSL off`.
- In `application.yml`, the JDBC URL is defined as:
  `jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}`
- To force the PostgreSQL JDBC driver to use SSL without modifying `application.yml`, we pass the following environment variable in Render:
  `DB_NAME = neondb?sslmode=require`
- The JDBC driver appends the query parameter to the connection string, establishing a secure TLS-encrypted socket to Neon!

---

### Render Free Tier Sleeping & Cold Starts
- On Render's free tier, if a service receives no incoming HTTP requests for 15 minutes, Render spins down the container to 0 instances to conserve resources.
- When a new request arrives, Render boots the container from scratch (**Cold Start**), taking 45 to 60 seconds to pull the image and launch the JVM.
- **Interview Preparation**: Always wake up the live demo instance (`https://merchanthub-deep.onrender.com`) 5 minutes before your interview starts by pinging `/api/health` so the service is hot and responsive!

---

## Part 8: Issues found in code review, with exact fixes

### Summary of Issues Found

| # | Severity | Component | Issue Description |
| :--- | :--- | :--- | :--- |
| **1** | **HIGH** | `README.md` | Demo links point to `sharma-electronics` instead of seeded `samanta-electronics`. |
| **2** | **HIGH** | `GlobalExceptionHandler` | Catch-all `@ExceptionHandler(Exception.class)` converts Spring 400/404/405/409 errors into 500. |
| **3** | **HIGH** | `AuthService.java` | Case-sensitivity check bypass on email during registration causes 500 unique constraint crash. |
| **4** | **HIGH** | `DemoDataSeeder.java` | Refund payment credited and debited after loop, corrupting historical running balance. |
| **5** | **HIGH** | `CashAdvanceServiceTest` | Test 3 re-implements advance repayment logic inside test instead of exercising service. |
| **6** | **MEDIUM** | `PaymentService.java` | Idempotency race recovery fails because Spring marks poisoned transaction as `rollback-only`. |
| **7** | **MEDIUM** | `CashAdvanceService.java` | Concurrency race condition allows two simultaneous active advances for one merchant. |
| **8** | **MEDIUM** | `pom.xml` | SpringDoc OpenAPI 2.8.5 is built for Spring Boot 3; can experience incompatibility on Spring Boot 4. |
| **9** | **LOW** | `Advances.jsx` | Input field allows numbers under 1000, but backend rejects with 400 Bad Request. |
| **10** | **LOW** | Code Cleanliness | Redundant timezone initialization, duplicate favicon link, unescaped CSV values. |

---

### Issue 1: README Demo Links Mismatch (HIGH)
- **What happens**: Clicking the public payment link in the original README loads `https://merchanthub-deep.onrender.com/pay/sharma-electronics`. The page displays: *"This payment link is not valid or the merchant does not exist."*
- **Why it happens**: `DemoDataSeeder` creates the merchant with slug `"samanta-electronics"`, but the README was written with `"sharma-electronics"`.
- **How to reproduce**: Open the original README link `/pay/sharma-electronics` in a browser.
- **The Exact Fix**: Replace all occurrences of `sharma-electronics` in `README.md` with `samanta-electronics`.
- **Interview Defense**: *"During my code review, I audited the seeder against the documentation, caught this slug discrepancy, and updated all public link references to `samanta-electronics`."*

---

### Issue 2: GlobalExceptionHandler 500 Catch-All Masking (HIGH)
- **What happens**: Clients omitting the required `Idempotency-Key` header receive an **HTTP 500 Internal Server Error** instead of **400 Bad Request**. Malformed JSON, bad enum values (`?status=INVALID`), unknown routes, and wrong HTTP methods all return 500!
- **Why it happens**: Spring MVC throws specific servlet exceptions (`MissingRequestHeaderException`, `MethodArgumentTypeMismatchException`, `HttpMessageNotReadableException`, `NoResourceFoundException`, `HttpRequestMethodNotSupportedException`). Because `GlobalExceptionHandler` only had handlers for custom domain exceptions and a blanket `@ExceptionHandler(Exception.class)`, the blanket handler intercepted all of Spring's framework exceptions, overriding their proper 4xx status codes with a 500.
- **The Exact Fix**: Add explicit exception handlers and a private builder in `GlobalExceptionHandler.java`:
  ```java
  @ExceptionHandler(MissingRequestHeaderException.class)
  public ResponseEntity<ErrorResponse> handleMissingHeader(MissingRequestHeaderException ex) {
      return build(HttpStatus.BAD_REQUEST, "Missing required header: " + ex.getHeaderName());
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
      return build(HttpStatus.BAD_REQUEST, "Invalid value for parameter: " + ex.getName());
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleMalformedJson(HttpMessageNotReadableException ex) {
      return build(HttpStatus.BAD_REQUEST, "Request body is missing or malformed");
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(NoResourceFoundException ex) {
      return build(HttpStatus.NOT_FOUND, "Resource not found");
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
      return build(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed");
  }

  @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
  public ResponseEntity<ErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
      return build(HttpStatus.CONFLICT, "The wallet was updated by another request. Please retry.");
  }

  private ResponseEntity<ErrorResponse> build(HttpStatus status, String message) {
      ErrorResponse body = ErrorResponse.of(status.value(), status.getReasonPhrase(), message);
      return ResponseEntity.status(status).body(body);
  }
  ```

---

### Issue 3: Case-Sensitivity Check Bypass in Registration (HIGH)
- **What happens**: Registering an account with `Demo@MerchantHub.in` when `demo@merchanthub.in` already exists passes the `existsByEmail` check, but then crashes with an unhandled database unique constraint violation and returns HTTP 500!
- **Why it happens**: Look at `AuthService.register()`:
  ```java
  if (merchantRepository.existsByEmail(request.email())) { // Raw email: "Demo@MerchantHub.in"
      throw new DuplicateEmailException(...);
  }
  // Later:
  .email(request.email().trim().toLowerCase()) // Saves: "demo@merchanthub.in"
  ```
  PostgreSQL checks `existsByEmail("Demo@MerchantHub.in")` which returns `false` because strings are case-sensitive. The code then converts it to lowercase and attempts to insert `"demo@merchanthub.in"`. PostgreSQL's `uk_merchants_email` unique index rejects the insertion, throwing `DataIntegrityViolationException`!
- **The Exact Fix**: Compute normalized email at the very beginning of `AuthService.register`:
  ```java
  String normalizedEmail = request.email().trim().toLowerCase();
  if (merchantRepository.existsByEmail(normalizedEmail)) {
      throw new DuplicateEmailException("Email already registered: " + normalizedEmail);
  }
  // Use normalizedEmail for Merchant.builder().email(normalizedEmail)...
  ```

---

### Issue 4: DemoDataSeeder Refund Timeline Balance Jump (HIGH)
- **What happens**: In the demo ledger view, when sorting entries chronologically, the running `balanceAfter` suddenly jumps by ₹70,000 in the middle of day 15!
- **Why it happens**: `DemoDataSeeder` runs a loop of 40 payments across 30 days. After the loop finishes (when the wallet balance has accumulated all 40 payments), it executes a separate block to simulate a refund on day 15. Because the wallet balance in memory is already ~₹70,000, the refund debit calculates `balanceAfter` as ₹68,500 on day 15, breaking the mathematical continuity of the ledger!
- **The Exact Fix**: Move the refund logic inside the loop on iteration 20:
  ```java
  if (i == 20) {
      LocalDateTime refundTime = time.plusHours(2);
      walletService.debit(savedMerchant.getId(), savedPayment.getAmount(), LedgerReason.REFUND, savedPayment.getId(), refundTime);
      savedPayment.setStatus(PaymentStatus.REFUNDED);
      paymentRepository.save(savedPayment);
  }
  ```
  To re-seed production, run in the Neon SQL editor:
  `DROP TABLE ledger_entries, cash_advances, payments, wallets, merchants CASCADE;` and redeploy.

---

### Issue 5: CashAdvanceServiceTest Testing Anti-Pattern (HIGH)
- **What happens**: The third test in `CashAdvanceServiceTest` gives false confidence because it does not test the application's service logic at all.
- **Why it happens**: `CashAdvanceService` has no repayment deduction code. The test method manually simulated repayment on local variables and asserted its own manual logic!
- **The Exact Fix**:
  1. Rename test in `CashAdvanceServiceTest` to `applyingWithinLimitCreatesActiveAdvanceWithFactorRate()` and verify `walletService.credit(...)`.
  2. Add `finalRepaymentIsCappedAtOutstandingAndMarksAdvanceRepaid()` to `PaymentServiceTest` to genuinely test capped advance completion during payment processing.

---

### Issue 6: Idempotency Race Recovery Poisoned by `rollback-only` (MEDIUM)
- **What happens**: When two identical payment requests hit the server in the exact same millisecond, one inserts and the other catches `DataIntegrityViolationException`. However, the client still receives an **HTTP 500 error**!
- **Why it happens**: In Spring, when a repository method throws an exception inside a `@Transactional` boundary, Spring's transaction manager marks the underlying transaction as **`rollback-only`**. Even though `PaymentService.processPayment` catches the exception and tries to fetch the winning payment, when the method returns, Spring tries to commit the transaction, encounters the `rollback-only` status, throws `UnexpectedRollbackException`, and returns 500!
- **The Architecture Fix**:
  - The catch block cannot live inside `PaymentService` because a method cannot open a new transaction via `this` (self-invocation bypasses the Spring proxy).
  - Move the idempotency catch to the controller layer:
    ```java
    try {
        PaymentResult result = paymentService.processPayment(merchantId, request, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(PaymentResponse.fromEntity(result.payment()));
    } catch (DataIntegrityViolationException ex) {
        Payment existing = paymentService.getPaymentByIdempotencyKey(merchantId, idempotencyKey);
        return ResponseEntity.ok(PaymentResponse.fromEntity(existing));
    }
    ```
    The controller runs outside the failed transaction, so its lookup executes in a fresh, unpoisoned transaction!

---

### Issue 7: Simultaneous Advance Applications Concurrency Race (MEDIUM)
- **What happens**: A merchant clicks the "Accept Advance" button twice rapidly. Both threads pass `existsByMerchantIdAndStatus(id, ACTIVE)` before either commits. Two `ACTIVE` advances are created in the database, breaking all future payment processing!
- **The Fix**: Add a PostgreSQL partial unique index:
  ```sql
  CREATE UNIQUE INDEX uk_one_active_advance ON cash_advances (merchant_id) WHERE status = 'ACTIVE';
  ```
  Alternatively, acquire a row-level lock on the wallet using `SELECT ... FOR UPDATE` before evaluating eligibility.

---

### Issue 8: SpringDoc OpenAPI 2.8.5 vs. Spring Boot 4 (MEDIUM)
- `springdoc-openapi-starter-webmvc-ui` 2.8.5 targets the Spring Boot 3.x line. Spring Boot 4 introduces baseline shifts in Spring Framework 7 and Jakarta EE. If Swagger UI fails to render on `/swagger-ui.html`, upgrade to the `springdoc 3.x` line built specifically for Spring Boot 4.

---

### Issue 9: Advances UI Minimum Amount Input Mismatch (LOW)
- The frontend `Advances.jsx` input field lacks a `min="1000"` attribute, allowing merchants to type ₹500 and submit, which fails with an ugly 400 Bad Request error. Fix: Add client-side validation `min="1000"` and a helpful validation message: *"Minimum advance is ₹1,000"*.

---

### Issue 10: Code Cleanliness Items (LOW)
- Redundant timezone setting in `BackendApplication.java`.
- Duplicate favicon `<link>` tag in `index.html`.
- Redundant `@EnableWebSecurity` in Spring Boot 4 (Spring Boot auto-enables it).
- JWT token parsed twice in `JwtAuthenticationFilter` (once for validation, once for claims).
- CSV export values in `format.js` are not wrapped in quotes or escaped against commas.


## Part 9: README corrections

### Table of Inaccurate / Buzzword Phrases & Honest Replacements

| Problem Phrase in README | Why an Interviewer Will Challenge It | Honest, Precise Technical Correction |
| :--- | :--- | :--- |
| *"High-performance backend"* | You have no load test benchmarks, no Redis caching, and no connection pool tuning. Saying 'high-performance' without numbers sounds like marketing fluff. | *"Synchronous Spring Boot REST service with HikariCP connection pooling and sub-50ms local response times."* |
| *"Immutable double-entry ledger"* | It is NOT double-entry accounting. Double-entry requires simultaneous debit and credit entries balancing across an equity/liability chart of accounts. MerchantHub writes one row per wallet movement. | *"Append-only wallet ledger with a running balanceAfter audit trail."* |
| *"Mathematical Ledger Parity"* | Fancy marketing term that has no recognized meaning in fintech or computer science. | *"Deterministic balance verification via sequential balanceAfter ledger tracking."* |
| *"Zero floating-point imprecision"* | Tautology. Using `BigDecimal` avoids IEEE 754 binary floating-point issues, but you must explain *how* (using String constructors and explicit scale). | *"Financial amounts stored as NUMERIC(12,2) and handled in Java via immutable BigDecimal with RoundingMode.HALF_UP."* |
| *"Architecturally impossible"* | Never say 'impossible' to senior engineers. Network timeouts, database restarts, and JVM crashes can cause partial state if boundaries are misconfigured. | *"Atomically guarded by database constraints and @Transactional ACID execution boundaries."* |
| *"Acquire Optimistic Lock"* | **Factually wrong**. Optimistic locking does NOT acquire any lock. It checks a version column during update (`WHERE version = ?`). | *"Conflict detection via Hibernate @Version optimistic concurrency control."* |
| *"Concurrency races are intercepted and resolved safely"* | Factually incorrect for idempotency. As shown in Issue 6, the catch block fails because Spring marks the transaction `rollback-only`. | *"Composite unique constraints reject duplicate concurrent inserts; controller-level recovery is planned to return 200 on conflict."* |
| *"Real-time dashboard"* | It is NOT real time. It uses periodic HTTP client polling every 5 seconds. Real-time requires WebSockets, Server-Sent Events, or gRPC. | *"Auto-refreshing dashboard powered by 5-second HTTP polling."* |
| *"Search in payments"* | There is no SQL `LIKE` or full-text search endpoint in the backend. Filtering is done purely in the React UI table or by exact status enum. | *"Table-level client filtering and backend status enum filtering."* |
| *"Preset amount suggestions in checkout"* | There are no preset amount buttons in `Checkout.jsx`; the customer types the amount into an input box. | *"Clean customer checkout input with amount and VPA validation."* |
| *"RFC 4180 CSV export"* | The CSV generator does not quote strings or escape internal commas according to RFC 4180. | *"Client-side CSV export formatted for standard spreadsheet consumption."* |
| *"ISO-8601 UTC timestamps"* | Naive `LocalDateTime` is formatted in the JVM's `Asia/Kolkata` timezone, not UTC. | *"Timestamps normalized to Indian Standard Time (Asia/Kolkata) across the application."* |
| `sharma-electronics` links | The seeder generates `samanta-electronics`. The link in the README returns a 404 payment link invalid error! | Replace all demo links with `samanta-electronics`. |
| Hardcoded personal `JAVA_HOME` path | Instructing users to set `JAVA_HOME` to `C:\Program Files\Eclipse Adoptium\jdk-25...` breaks on any machine that does not share that exact file path. | Instruct users to ensure `java -version` is Java 21+ or rely on the Maven wrapper. |

---

### Corrected "Core Technical Decisions" Section (Honest Replacement)
If an interviewer reviews your README, replace the marketing text with this professional engineering statement:

> ### Core Technical Architecture Decisions
> 1. **Financial Precision via `BigDecimal` & `NUMERIC(12,2)`**: All monetary fields are stored in PostgreSQL as `NUMERIC(12,2)` and handled in Java using `BigDecimal`. Floating-point primitives (`float`, `double`) are strictly prohibited to prevent binary floating-point representation errors. Arithmetic operations specify explicit half-up rounding (`RoundingMode.HALF_UP`).
> 2. **Append-Only Wallet Audit Ledger**: To ensure financial auditability, wallet balances are not merely updated in place. Every credit and debit operation atomically writes an immutable row to `ledger_entries` recording the transaction reason, amount, and resulting `balanceAfter` in the same database transaction.
> 3. **Optimistic Concurrency Control (`@Version`)**: The `wallets` table utilizes a JPA `@Version` column. When updating balances, Hibernate verifies that the version counter in the database matches the entity snapshot. If a concurrent transaction modified the balance in the interim, Hibernate aborts the update with an `OptimisticLockException`, preventing silent lost updates.
> 4. **Idempotent Payment Processing**: Payment requests enforce an `Idempotency-Key` header mapped to a composite unique constraint `(merchant_id, idempotency_key)` in PostgreSQL, preventing duplicate charges upon client retries.
> 5. **Stateless Security Architecture**: Authentication is implemented via HMAC-SHA256 signed JSON Web Tokens (JJWT 0.12.6). Spring Security is configured with `SessionCreationPolicy.STATELESS` and disabled CSRF, securing API routes while enabling public checkout access.

---

## Part 10: Core concepts deep dive

### 1. Spring IoC Container, Beans, & Constructor Injection
- **Explanation**: In traditional Java, an object creates its dependencies: `PaymentService` would call `new PaymentRepository()`. In Spring, the **Inversion of Control (IoC) Container** (ApplicationContext) creates, configures, and manages the lifecycle of objects (**Spring Beans**).
- **Analogy**: Instead of a chef leaving the kitchen to build a refrigerator and milk a cow, an assistant supplies pre-assembled appliances and ingredients directly to the chef's counter.
- **MerchantHub Usage**:
  ```java
  @Service
  @RequiredArgsConstructor
  public class PaymentService {
      private final PaymentRepository paymentRepository;
      private final WalletService walletService;
      private final CashAdvanceRepository cashAdvanceRepository;
  }
  ```
  Lombok's `@RequiredArgsConstructor` generates a constructor taking all `final` fields. When Spring initializes `PaymentService`, it looks up the beans for `PaymentRepository`, `WalletService`, and `CashAdvanceRepository` and passes them into the constructor.
- **Common Mistakes**: Using field injection (`@Autowired private WalletService walletService;`). Field injection makes unit testing difficult because dependencies cannot be passed without reflection tools.
- **Interview Question**: *"Why is constructor injection preferred over field injection?"*
  - **Answer**: Constructor injection enforces immutability (fields can be declared `final`), guarantees that an object cannot be instantiated in an incomplete or broken state without its required dependencies, and allows clean unit testing with Mockito without needing a Spring container.

---

### 2. Component Scanning & Auto-Configuration
- **Explanation**: `@SpringBootApplication` activates `@ComponentScan`, which scans packages starting from `com.merchanthub` for stereotype annotations (`@Component`, `@Service`, `@Repository`, `@RestController`). `@EnableAutoConfiguration` inspects classpath dependencies (e.g. finding PostgreSQL on the classpath automatically configures a DataSource and HikariCP connection pool).
- **Analogy**: Auto-configuration is like a smart modern car that detects darkness and automatically turns on the headlights without manual toggling.
- **Common Mistakes**: Placing a new controller or service in a package outside `com.merchanthub` (e.g. `com.external.service`). Spring's component scanner will miss it, causing `NoSuchBeanDefinitionException`.

---

### 3. Stereotype Annotations Hierarchy
- `@Component`: The fundamental Spring-managed generic component.
- `@Service`: Specialization of `@Component` signaling domain business logic and transaction boundaries.
- `@Repository`: Specialization of `@Component` providing data access and automatic translation of JDBC/database exceptions into Spring's unified `DataAccessException` hierarchy.
- `@Controller`: Specialization of `@Component` for web presentation returning views.
- `@RestController`: Meta-annotation combining `@Controller` and `@ResponseBody` for JSON REST APIs.

---

### 4. JPA, Hibernate, Persistence Context, & Dirty Checking
- **Explanation**: JPA is the specification; Hibernate 7 is the ORM implementation; Spring Data JPA is an abstraction layer on top of Hibernate.
- **Persistence Context (First-Level Cache)**: An in-memory cache of managed entities associated with the current database session.
- **Dirty Checking**: When an entity is loaded inside an open `@Transactional` method, Hibernate keeps an internal snapshot of its original properties. When the transaction commits, Hibernate compares the entity's current in-memory state against the snapshot. Any modified fields trigger an automatic SQL `UPDATE` statement without calling `repository.save()`.
- **The N+1 Query Problem**: If an entity has a `@OneToMany` lazy relationship (e.g., Merchant -> Payments) and you fetch 100 Merchants, accessing each merchant's payments executes 1 initial query + 100 secondary queries (N+1). Fixed using `JOIN FETCH` in JPQL.

---

### 5. `@Transactional` in Depth: Proxies, Propagation, & Rollback Rules
- **Spring AOP Proxy**: When a class is annotated with `@Transactional`, Spring creates a dynamic CGLIB or JDK dynamic proxy around the bean:
  ```
  Caller -> Proxy.processPayment() -> TransactionManager.begin() -> RealService.processPayment() -> TransactionManager.commit()
  ```
- **Rollback Rules**: By default, Spring transactions roll back **ONLY for unchecked exceptions (`RuntimeException` and `Error`)**! Checked exceptions (`Exception`, `IOException`) do NOT trigger a rollback unless explicitly declared via `@Transactional(rollbackFor = Exception.class)`.
- **Self-Invocation Proxy Bypass**: If method `A()` in `PaymentService` calls method `B()` in the same class via `this.B()`, the call does NOT go through the Spring proxy! Any `@Transactional` settings on `B()` are completely ignored.
- **Propagation (`REQUIRED`)**: If an active transaction exists, the called method joins it. If none exists, a new transaction is created.

---

### 6. Optimistic vs. Pessimistic Locking
- **Optimistic Locking (`@Version`)**: Assumes conflicts are rare. Reads data without locks. During update, appends `WHERE version = ?`. If version changed, update affects 0 rows, throwing `OptimisticLockException`. Ideal for read-heavy workloads.
- **Pessimistic Locking (`SELECT ... FOR UPDATE`)**: Assumes conflicts are frequent. Acquires a row-level exclusive lock in the database immediately upon read, blocking other transactions until commit. Necessary for ultra-high concurrency flash sales.

---

### 7. `BigDecimal` Mechanics: Precision, Scale, & Comparison
- **Representation**: `BigDecimal` consists of an arbitrary-precision unscaled integer value and a 32-bit integer scale.
- **String Constructor**: Always instantiate via `new BigDecimal("0.10")`, NEVER `new BigDecimal(0.10)`. The `double` constructor passes IEEE 754 floating-point inaccuracies (e.g. `0.10000000000000000555111512312578...`).
- **`.compareTo()` vs. `.equals()`**:
  - `new BigDecimal("2.0").equals(new BigDecimal("2.00"))` -> `false`!
  - `new BigDecimal("2.0").compareTo(new BigDecimal("2.00")) == 0` -> `true`!

---

### 8. Idempotency in Payment Systems
- Network calls over the internet are inherently unreliable (the Two Generals' Problem). If a client initiates a payment and the network times out before receiving the response, the client cannot know if the payment succeeded or failed.
- Enforcing an `Idempotency-Key` header with a unique constraint ensures that retries simply return the result of the original execution without duplicating financial debits.


## Part 11: Interview question bank

### The 60-Second Elevator Pitch
> *"MerchantHub is a fintech platform built with Spring Boot 4 and Java 21 designed for small Indian merchants who collect payments via UPI. It solves their working capital shortage by offering cash-flow-underwritten Merchant Cash Advances at a 1.05 factor rate without collateral. When an advance is active, our payment processing engine automatically deducts a 10% split from every incoming customer payment until the advance is settled. The backend features an append-only wallet ledger with running balances, Hibernate optimistic locking, and database-enforced idempotency to prevent duplicate charges."*

---

### The 3-Minute Architectural Deep Dive
> *"When designing MerchantHub, our primary focus was mathematical precision and transactional integrity. Traditional small merchants face rigid bank loan EMIs, so we built an engine that links financing directly to sales velocity.
>
> On the backend, we run on Java 21, Spring Boot 4.1.2, and PostgreSQL 16. In the database layer, monetary amounts are strictly `NUMERIC(12,2)` mapped to Java `BigDecimal` with half-up banker's rounding to eliminate floating-point drift.
>
> For payments, incoming requests pass through a custom `OncePerRequestFilter` validating HMAC-SHA256 JWT tokens. `PaymentService.processPayment` enforces idempotency via a composite unique constraint on `(merchant_id, idempotency_key)` in PostgreSQL. Within a single atomic transaction, the service records the payment, credits the wallet, inserts an immutable audit row into `ledger_entries` with a running `balanceAfter`, and checks for an active cash advance. If active, it calculates a 10% deduction capped at the outstanding balance, debits the wallet, and updates the advance.
>
> For concurrency, we use `@Version` on wallets to prevent lost updates without acquiring table locks. The entire application is containerized via a 3-stage Dockerfile bundling Vite React static assets into the Spring Boot fat JAR, deployed on Render with a serverless Neon PostgreSQL database."*

---

### "What was the hardest bug you encountered?" (Rollback-Only Poisoning)
> *"The hardest bug was handling concurrent duplicate payment requests. We had a unique constraint on `(merchant_id, idempotency_key)` and caught `DataIntegrityViolationException` inside `PaymentService.processPayment` to return the winning payment.
>
> In testing, whenever two threads hit the endpoint simultaneously, one thread succeeded, but the second thread still failed with an HTTP 500!
>
> Deep investigation revealed that Spring's transaction manager intercepts the repository exception and marks the underlying physical transaction as **`rollback-only`**. Even though our Java code caught the exception and returned the winning payment, when Spring attempted to commit the transaction, it detected the `rollback-only` flag and threw an `UnexpectedRollbackException`!
>
> The architectural fix was to move the catch block to the controller layer outside the transactional boundary. This allowed the fallback lookup to execute inside a fresh, unpoisoned transaction and return an HTTP 200 cleanly."*

---

### "Did you use AI to build this?" (The Senior Engineering Response)
> *"Yes, I utilized an AI coding assistant to accelerate scaffolding, boilerplate generation, and initial UI layout. However, I personally designed the domain model, API contracts, financial math, and transaction boundaries.
>
> More importantly, I conducted an in-depth code review on the generated codebase, where I uncovered and resolved several critical architectural flaws—including the `rollback-only` transaction poisoning on idempotency races, the timeline sequence flaw in the demo seeder, the case-sensitivity bypass in registration, and the catch-all 500 error masking in the global exception handler. Using AI gave me speed, but rigorous software engineering ensured correctness."*

---

### Top 50 Technical Interview Questions & Model Answers

#### Category 1: Java Core & OOP
1. **Q**: Why are strings immutable in Java?
   - **A**: String immutability enables String Pool caching (saving heap memory), provides thread safety without synchronization, and guarantees security when strings are used as class loading arguments or network URLs.
2. **Q**: What is the difference between `Comparable` and `Comparator`?
   - **A**: `Comparable` is implemented by the class itself via `compareTo()` to define its natural ordering. `Comparator` is an external strategy interface (`compare(T o1, T o2)`) allowing multiple custom sorting orders.
3. **Q**: Explain the `equals()` and `hashCode()` contract.
   - **A**: If two objects are equal according to `equals()`, they MUST produce the same `hashCode()`. If two objects produce different hash codes, they must be unequal. Violating this contract breaks hash-based collections (`HashMap`, `HashSet`).
4. **Q**: How does `HashMap` work internally in Java 8+?
   - **A**: `HashMap` uses an array of Node buckets. Keys are hashed (`hash(key)`) to determine the bucket index (`(n-1) & hash`). Hash collisions are stored in a singly linked list. When a bucket's collision chain reaches 8 nodes and the table size $\ge 64$, the bucket is converted into a Red-Black Tree (`TreeNode`), reducing lookup time from $O(n)$ to $O(\log n)$.
5. **Q**: What are Java Records and when should you use them?
   - **A**: Java Records (introduced in Java 16) are immutable data carriers that automatically generate private final fields, canonical constructors, getters, `equals()`, `hashCode()`, and `toString()`. They are ideal for DTOs and API payloads.

#### Category 2: Spring Boot & Architecture
6. **Q**: What is Inversion of Control and how does Spring implement it?
   - **A**: IoC is an architectural design where the framework controls the lifecycle and execution flow of objects. Spring implements IoC via its `ApplicationContext` container and Dependency Injection.
7. **Q**: What is the difference between `@Component`, `@Service`, and `@Repository`?
   - **A**: `@Component` is the generic stereotype. `@Service` documents domain business logic and transaction boundaries. `@Repository` encapsulates data access and automatically translates database-specific exceptions into Spring's `DataAccessException` hierarchy.
8. **Q**: How does Spring Boot auto-configuration work?
   - **A**: At startup, `@EnableAutoConfiguration` reads `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. It evaluates conditional annotations (`@ConditionalOnClass`, `@ConditionalOnMissingBean`) to automatically instantiate beans matching classpath libraries.
9. **Q**: Why is `spring.jpa.open-in-view: false` recommended in production?
   - **A**: Disabling OSIV ensures that database connections are strictly returned to the HikariCP pool when the `@Transactional` service finishes, preventing connection starvation during slow HTTP view rendering.
10. **Q**: What does `@RestControllerAdvice` do?
    - **A**: It is an AOP interceptor around all `@RestController` beans that catches unhandled exceptions thrown during request processing and converts them into standardized JSON error responses.

#### Category 3: Transactions & Concurrency
11. **Q**: What is the default rollback behavior of `@Transactional`?
    - **A**: It automatically rolls back for unchecked exceptions (`RuntimeException` and `Error`), but commits for checked exceptions (`Exception`) unless `rollbackFor = Exception.class` is explicitly defined.
12. **Q**: What is self-invocation in Spring transactions?
    - **A**: Spring `@Transactional` works via AOP dynamic proxies. If method `A()` calls method `B()` in the same class via `this.B()`, the call bypasses the Spring proxy, ignoring all transaction annotations on `B()`.
13. **Q**: What is the difference between Optimistic and Pessimistic locking?
    - **A**: Optimistic locking checks a `@Version` column at update time without acquiring database locks. Pessimistic locking acquires a row lock (`SELECT FOR UPDATE`) immediately, blocking concurrent transactions until commit.
14. **Q**: How does `@Version` prevent the Lost Update problem?
    - **A**: Hibernate appends `WHERE version = ?` to the SQL update. If another transaction incremented the version first, the update affects 0 rows, triggering an `OptimisticLockException` and rolling back the transaction.
15. **Q**: What does transaction propagation `REQUIRED` mean?
    - **A**: If a transaction already exists, the current method joins it; if no transaction exists, a new transaction is created.

#### Category 4: Financial Math & SQL
16. **Q**: Why must `BigDecimal` never be created with `new BigDecimal(double)`?
    - **A**: `double` binary floating-point representation causes IEEE 754 precision loss. Always use `new BigDecimal("0.10")` or `BigDecimal.valueOf(double)`.
17. **Q**: Why compare `BigDecimal` with `compareTo()` instead of `equals()`?
    - **A**: `equals()` compares both value and scale (`2.0` vs `2.00` is false). `compareTo()` compares mathematical value, returning `0` if equal.
18. **Q**: What is the purpose of `COALESCE` in SQL aggregates?
    - **A**: If no rows match, SQL `SUM()` returns `NULL`, causing `NullPointerException` when mapped to numeric primitives in Java. `COALESCE(SUM(amount), 0)` forces the database to return `0.00`.
19. **Q**: Why is an append-only ledger superior to updating a single balance column?
    - **A**: An append-only ledger preserves an immutable, tamper-evident audit trail of every credit and debit, allowing complete forensic reconstruction of financial history.
20. **Q**: What is the difference between offset pagination and keyset pagination?
    - **A**: Offset pagination (`LIMIT 20 OFFSET 100000`) forces the database to scan and discard 100,000 rows. Keyset pagination (`WHERE id < lastSeenId LIMIT 20`) uses indexed range comparisons for constant $O(1)$ performance.

---

### Core Java & DSA Quick Revision List
- **`volatile` keyword**: Guarantees variable visibility across threads by reading/writing directly to main memory and preventing instruction reordering, but does NOT guarantee atomicity (e.g. `count++` is not atomic).
- **`synchronized` block**: Uses an intrinsic object monitor (mutex) to provide both mutual exclusion (atomicity) and memory visibility.
- **`ArrayList` vs `LinkedList`**: `ArrayList` is backed by a contiguous array ($O(1)$ indexed access, $O(n)$ insertion/deletion); `LinkedList` is a doubly linked list ($O(n)$ access, $O(1)$ node insertion given a pointer). `ArrayList` is almost always preferred due to CPU cache line locality.
- **`ConcurrentHashMap`**: Uses fine-grained bucket-level synchronization (synchronized on individual bucket heads and CAS on empty buckets), allowing concurrent readers and writers without global table locking.
- **SQL Joins**:
  - `INNER JOIN`: Returns rows with matching keys in both tables.
  - `LEFT JOIN`: Returns all rows from the left table and matched rows from the right table (NULL if unmatched).
  - `RIGHT JOIN`: Returns all rows from the right table.
  - `FULL OUTER JOIN`: Returns all rows from both tables, filling NULLs where unmatched.

---

## Part 12: Future improvements and scaling roadmap

### 1. Correctness & Data Integrity
- **Flyway Database Migrations**: Replace `hibernate.ddl-auto: update` with versioned, immutable SQL migration scripts (`V1__init.sql`, `V2__add_indexes.sql`) checked into git to ensure repeatable schema rollouts.
- **Database-Level Partial Unique Index**: Add `CREATE UNIQUE INDEX uk_one_active_advance ON cash_advances (merchant_id) WHERE status = 'ACTIVE';` to eliminate advance concurrency races at the database engine level.
- **Database Trigger Ledger Immutability**: Enforce database triggers on `ledger_entries` that reject `UPDATE` and `DELETE` commands, guaranteeing ledger immutability even against rogue SQL scripts.
- **True Double-Entry Accounting**: Upgrade from an append-only single ledger to double-entry accounting with a chart of accounts (Merchants Payable, Cash Advance Receivable, Cash Advance Fee Income, Platform Bank Account).

### 2. Concurrency & High-Throughput Scaling
- **Row-Level Pessimistic Locking**: For flash-sale scenarios with 500+ tx/sec per merchant, use `SELECT ... FOR UPDATE` on the wallet row to prevent high abort rates under optimistic locking.
- **Asynchronous Payment Settlement via Apache Kafka**: Decouple payment acceptance from wallet crediting. The payment API writes to an **Outbox Table** and returns HTTP 202 Accepted. An asynchronous worker stream publishes to Kafka to execute ledger settlements in the background.
- **Redis Distributed Caching**: Cache merchant profiles and 7-day dashboard aggregates in Redis with 60-second TTLs to reduce database load by 80%.

### 3. Security Hardening
- **Refresh Token Rotation**: Issue short-lived access tokens (15 minutes) paired with single-use refresh tokens stored in `httpOnly` secure cookies.
- **HMAC Webhook Signatures**: Sign outgoing payment notifications to merchant ERPs using HMAC-SHA256 signatures with secret rotation.
- **Rate Limiting**: Protect authentication and public checkout endpoints using Redis token bucket algorithms (Bucket4j).

### 4. Core Banking & Product Features
- **Real UPI Gateway Integration**: Replace simulated payment processing with real UPI Intent / QR integration via Razorpay or Axis Bank APIs.
- **Automated Nightly Settlement Batch Job (`@Scheduled`)**: Implement an automated midnight batch job that aggregates net wallet balances and initiates NEFT/IMPS payouts to merchants' real bank accounts.
- **Automated Financial Reconciliation**: Daily cron job comparing total customer payments against wallet credits and bank switch statement feeds.

---

## Part 13: Demo script and final checklist

### 3-Minute Minute-by-Minute Live Interview Demo Script

#### Minute 0:00 - 0:45: Introduction & Authentication
1. **Show Login**: Open `https://merchanthub-deep.onrender.com/login`.
2. **Log In**: Enter `demo@merchanthub.in` / `Demo@123`.
3. **Point Out Key Elements**:
   - Store name: `"Samanta Electronics"`.
   - Live spendable wallet balance card.
   - Active Cash Advance card with progress bar.
   - Explain: *"This dashboard updates via 5-second polling to reflect incoming UPI cash flows."*

#### Minute 0:45 - 1:30: Live Payment Collection & Idempotency Proof
1. **Open Collect Payment**: Click **Collect Payment** in `Payments.jsx`.
2. **Execute Transaction**: Enter Amount = `1000.00`, Customer = `Amit Samanta`, VPA = `amit@okhdfcbank`. Click **Charge Customer**.
3. **Show Split Deduction**:
   - Point to the toast: *"Payment collected. Advance deduction: ₹100.00."*
   - Open **Ledger**: Show the two simultaneous entries written:
     1. `CREDIT ₹1,000.00` (Payment Settlement)
     2. `DEBIT ₹100.00` (Advance Repayment)
     - Highlight: *"Net spendable wallet increase is exactly ₹900.00."*
4. **Demonstrate Idempotency in Swagger**:
   - Open `/swagger-ui.html`. Authorize with JWT.
   - Call `POST /api/payments` with header `Idempotency-Key: test-key-101`.
   - First call returns `201 Created`.
   - Send the exact same request again: returns `200/201` with identical payment ID, zero new ledger rows, zero double-charging!

#### Minute 1:30 - 2:15: Public Checkout & QR Code
1. **Navigate to Payment Link**: Open `/payment-link`. Show dynamic QR code.
2. **Open Public Checkout**: Click the link `https://merchanthub-deep.onrender.com/pay/samanta-electronics`.
3. **Simulate Customer Payment**: Enter ₹250.00, Customer `"Priya"`, VPA `"priya@axisbank"`. Submit payment.
4. **Show Success Animation**: Point out that the customer sees a clean confirmation screen without ever needing an account.

#### Minute 2:15 - 3:00: Refunds & CSV Export
1. **Trigger Refund**: Return to merchant dashboard. Click **Refund** on the ₹250.00 payment. Confirm dialog.
2. **Show Status**: Payment switches to `REFUNDED`.
3. **Show Ledger Debit**: Ledger immediately shows `DEBIT ₹250.00 (REFUND)` with running balance adjusted.
4. **Export CSV**: Click **Export CSV**. Show instant file download of the merchant's financial records.
5. **Conclude**: *"MerchantHub provides end-to-end mathematical consistency from customer QR scan to wallet audit trail."*

---

### Emergency Contingency Plan (If Render Free Tier Lags)
- If Render takes 60 seconds to wake up during the interview, explain smoothly:
  > *"Render spins down free tier containers after 15 minutes of inactivity. While the JRE initializes the container, let me walk you through our multi-stage Docker build and database schema."*
- If the live internet connection drops, run locally:
  `./mvnw spring-boot:run "-Dspring-boot.run.profiles=demo"` and demonstrate on `http://localhost:5173`.

---

### Day-Before Interview Final Checklist
- [ ] Ping `https://merchanthub-deep.onrender.com/api/health` 10 minutes before the call to eliminate cold starts.
- [ ] Confirm demo login credentials: `demo@merchanthub.in` / `Demo@123`.
- [ ] Verify Swagger UI loads at `https://merchanthub-deep.onrender.com/swagger-ui.html`.
- [ ] Review the 10 code review issues in Part 8 (especially rollback-only poisoning).
- [ ] Review `BigDecimal` scale rules and why `.compareTo()` is mandatory.
- [ ] Rest well and be confident!
