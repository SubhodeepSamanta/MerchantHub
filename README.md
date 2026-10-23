# MerchantHub

[![Live Deployment](https://img.shields.io/badge/Live%20Demo-merchanthub--deep.onrender.com-00C49F?style=for-the-badge&logo=render&logoColor=white)](https://merchanthub-deep.onrender.com)
[![Java 21](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://adoptium.net)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)

A high-performance, full-stack digital payments and working capital platform engineered specifically for Indian retail merchants and micro-enterprises.

---

## Live Deployment & Demo Access

- Production URL: [https://merchanthub-deep.onrender.com](https://merchanthub-deep.onrender.com)
- Public Checkout Demo: [https://merchanthub-deep.onrender.com/pay/samanta-electronics](https://merchanthub-deep.onrender.com/pay/samanta-electronics)
- Interactive API Documentation: [https://merchanthub-deep.onrender.com/swagger-ui.html](https://merchanthub-deep.onrender.com/swagger-ui.html)
- Demo Account Email: `demo@merchanthub.in`
- Demo Account Password: `Demo@123`

The demo profile automatically provisions "Samanta Electronics" with 30 days of real-world payment activity, wallet ledger audit trails, and pre-evaluated cash advance eligibility.

---

## The Business Problem

Small retail businesses in India generate steady daily cash flow through digital UPI collections, yet remain underserved by traditional commercial banks:

1. Working Capital Friction: Conventional bank loans require formal collateral, weeks of paperwork, and fixed monthly EMIs that do not adapt to seasonal or weekly revenue dips.
2. Fragmented Bookkeeping: Merchants use disparate QR codes, manual ledger notebooks, and third-party settlement apps, leading to untracked fees, unverified refunds, and reconciliation errors.
3. Lack of Transparent Capital Recovery: When merchants do obtain external financing, fixed monthly debits risk bouncing during slow sales cycles, damaging their credit profiles.

### The MerchantHub Solution

MerchantHub consolidates payment acceptance, immutable ledger accounting, and revenue-based working capital into a unified system:

- Instant UPI Collections: Branded QR codes and web checkout links with idempotency safeguards against network timeouts and duplicate customer taps.
- Mathematical Ledger Parity: An immutable double-entry ledger where every credit and debit tracks before and after wallet balances with zero floating-point imprecision.
- Dynamic Revenue-Based Repayment: Merchant Cash Advances (MCA) calculate eligibility directly from recent transaction history. Rather than fixed monthly loans, repayments automatically deduct a frictionless 10% slice of incoming payments until the balance is retired.

---

## Visual Product Tour

### 1. Executive Analytics Dashboard
Real-time financial command center tracking total wallet balance, today's gross collection volume, payment success rates, outstanding capital advances, and 7-day revenue velocity.

![Dashboard Preview](docs/screenshots/dashboard.png)

---

### 2. Transaction Management with Idempotency & Instant Refunds
Real-time payment audit table with search, status filtering (SUCCESS, FAILED, REFUNDED), and one-click refund initiation backed by wallet balance validation.

![Payments Preview](docs/screenshots/payments.png)

---

### 3. Immutable Double-Entry Wallet Ledger & CSV Auditing
Complete financial trail recording every balance credit, debit, disbursal, and loan deduction with running balances and one-click CSV export for external bookkeeping.

![Ledger Preview](docs/screenshots/ledger.png)

---

### 4. Factor-Rate Working Capital & Automated Repayments
Zero-collateral merchant advance module featuring automated 30-day volume underwriting, transparent 1.05x factor-rate calculation, and real-time split repayment tracking.

![Advances Preview](docs/screenshots/advances.png)

---

### 5. Branded QR Code & Payment Link Generator
Instant customer-facing payment link creation with dynamic QR generation for counter displays, WhatsApp sharing, and digital billing.

![Payment Link Preview](docs/screenshots/payment_link.png)

---

### 6. Public Customer Checkout Experience
Frictionless payer interface with UPI ID validation, preset amount suggestions, and real-time settlement simulation.

![Public Checkout Preview](docs/screenshots/public_checkout.png)

---

## Transaction & Lifecycle Flows

### Flow 1: Customer Payment Collection & 10% Auto-Repayment

The following diagram illustrates how incoming payments are validated, credited, and split-deducted to repay outstanding cash advances:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Payer
    participant PublicAPI as Public Checkout API
    participant PayService as PaymentService
    participant DB as PostgreSQL
    participant Wallet as WalletService
    participant Adv as CashAdvanceService
    actor Merchant as Merchant

    Customer->>PublicAPI: Submit Payment (Payer VPA, Amount, Idempotency-Key)
    PublicAPI->>PayService: processPayment(request, idempotencyKey)
    PayService->>DB: Check (merchant_id, idempotency_key)
    alt Key already exists
        DB-->>PayService: Return existing payment record
        PayService-->>PublicAPI: 200 OK (Deduplicated response)
    else New transaction
        PayService->>DB: Persist Payment (status: SUCCESS)
        PayService->>Wallet: credit(merchantId, amount, PAYMENT, paymentId)
        Wallet->>DB: Update Wallet balance & append CREDIT LedgerEntry
        opt Merchant has ACTIVE CashAdvance
            PayService->>Adv: getActiveAdvance(merchantId)
            Adv-->>PayService: CashAdvance (outstanding > 0)
            PayService->>PayService: repayment = min(10% of amount, outstanding)
            PayService->>Wallet: debit(merchantId, repayment, ADVANCE_REPAYMENT, paymentId)
            Wallet->>DB: Update Wallet balance & append DEBIT LedgerEntry
            PayService->>Adv: recordRepayment(advanceId, repayment)
            Adv->>DB: Update amountRepaid (mark REPAID if completed)
        end
        PayService-->>PublicAPI: 201 Created (Payment response)
        PublicAPI-->>Customer: Display Success Receipt
        PayService-->>Merchant: Real-time Wallet & Dashboard Update
    end
```

---

### Flow 2: Merchant Cash Advance (MCA) Underwriting & Lifecycle

```mermaid
flowchart TD
    Start([Merchant requests Advance Eligibility]) --> QueryDB[Query SUCCESS payments over last 30 days]
    QueryDB --> CheckCount{Successful payments >= 5?}
    
    CheckCount -- No --> Ineligible1[Ineligible: Minimum 5 payments required]
    CheckCount -- Yes --> CheckActive{Active Advance exists?}
    
    CheckActive -- Yes --> Ineligible2[Ineligible: Active advance already running]
    CheckActive -- No --> Eligible[Eligible: Max amount = 50% of 30-day volume]
    
    Eligible --> Apply[Merchant applies for Amount <= Max Amount]
    Apply --> Calc[Calculate Total Repayable = Principal * 1.05]
    Calc --> Disburse[Disburse Principal to Wallet via CREDIT LedgerEntry]
    Disburse --> ActiveState[Cash Advance Status: ACTIVE]
    
    ActiveState --> Inflow[Incoming SUCCESS Payment]
    Inflow --> Split[Deduct 10% of Payment Amount via DEBIT LedgerEntry]
    Split --> UpdateRepaid[amountRepaid = amountRepaid + deduction]
    UpdateRepaid --> CheckDone{amountRepaid >= totalRepayable?}
    
    CheckDone -- No --> ActiveState
    CheckDone -- Yes --> RepaidState([Cash Advance Status: REPAID])
```

---

### Flow 3: Double-Entry Wallet Ledger Consistency

```mermaid
flowchart LR
    subgraph Trigger Events
        E1[Customer Payment]
        E2[Advance Disbursal]
        E3[Advance 10% Split]
        E4[Customer Refund]
    end

    subgraph Wallet Service Transaction Boundary
        Lock[Acquire Optimistic Lock @Version]
        Compute[Validate Sufficient Balance & Calculate New Balance]
        UpdateWallet[Persist Wallet State]
        InsertLedger[Create Immutable LedgerEntry with balanceAfter]
    end

    subgraph Ledger Entry Audit Types
        CR1[CREDIT: PAYMENT]
        CR2[CREDIT: ADVANCE_DISBURSAL]
        DR1[DEBIT: ADVANCE_REPAYMENT]
        DR2[DEBIT: REFUND]
    end

    E1 --> Lock
    E2 --> Lock
    E3 --> Lock
    E4 --> Lock

    Lock --> Compute --> UpdateWallet --> InsertLedger

    InsertLedger -.-> CR1
    InsertLedger -.-> CR2
    InsertLedger -.-> DR1
    InsertLedger -.-> DR2
```

---

## System Architecture

```mermaid
graph TD
    Client["Browser / Mobile Client (React 19 SPA)"]
    PublicPayer["Customer / Public Payer (/pay/:slug)"]

    subgraph Container ["MerchantHub Docker Container (Single Service)"]
        SPAStatic["Static Assets (/index.html, JS, CSS)"]
        SpaCtrl["SpaController (Forwarder)"]
        
        subgraph SecurityLayer ["Spring Security 7 Filter Chain"]
            JwtFilter["JwtAuthenticationFilter"]
            AuthEntry["JwtAuthenticationEntryPoint"]
        end

        subgraph Controllers ["Spring MVC REST Controllers"]
            AuthCtrl["AuthController"]
            MerchCtrl["MerchantController"]
            PayCtrl["PaymentController"]
            PubCtrl["PublicCheckoutController"]
            WallCtrl["WalletController"]
            AdvCtrl["CashAdvanceController"]
            DashCtrl["DashboardController"]
            HealthCtrl["HealthController & Actuator"]
        end

        subgraph Services ["Service Layer (@Transactional)"]
            AuthSvc["AuthService (BCrypt & Slug Engine)"]
            PaySvc["PaymentService (Idempotency & Auto-Repayment)"]
            WallSvc["WalletService (Optimistic Locking & Ledger Engine)"]
            AdvSvc["CashAdvanceService (Underwriting & Factor Rate)"]
            DashSvc["DashboardService (Rolling 7-Day Analytics)"]
            LedgSvc["LedgerService (RFC 4180 CSV Generator)"]
            JwtSvc["JwtService (HS256 HMAC Engine)"]
        end

        subgraph DataLayer ["Spring Data JPA & Hibernate 7"]
            Repos["Repositories (Merchant, Wallet, LedgerEntry, Payment, CashAdvance)"]
        end
    end

    subgraph Persistence ["Relational Storage"]
        PG[("PostgreSQL 16 / NeonDB Cloud")]
    end

    Client -->|Static Assets| SPAStatic
    Client -->|Bearer JWT /api/**| JwtFilter
    PublicPayer -->|Public /pay/:slug| SpaCtrl
    PublicPayer -->|Public API /api/public/**| PubCtrl

    SpaCtrl --> SPAStatic
    JwtFilter --> Controllers
    Controllers --> Services
    Services --> DataLayer
    DataLayer --> PG
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    MERCHANT ||--|| WALLET : owns
    MERCHANT ||--o{ PAYMENT : receives
    MERCHANT ||--o{ CASH_ADVANCE : takes
    WALLET ||--o{ LEDGER_ENTRY : records

    MERCHANT {
        bigint id PK "Identity Autoincrement"
        varchar business_name "Max 80 chars"
        varchar email UK "Normalized, unique"
        varchar password "BCrypt Hash"
        varchar phone "10 digits"
        varchar slug UK "URL safe identifier"
        timestamp created_at "ISO-8601 UTC"
    }

    WALLET {
        bigint id PK "Identity Autoincrement"
        bigint merchant_id FK,UK "One-to-One with Merchant"
        numeric balance "Precision 19, Scale 2"
        bigint version "Optimistic Locking Version"
        timestamp updated_at "Last mutation timestamp"
        timestamp created_at "Creation timestamp"
    }

    LEDGER_ENTRY {
        bigint id PK "Identity Autoincrement"
        bigint wallet_id FK "Many-to-One with Wallet"
        varchar entry_type "CREDIT or DEBIT"
        varchar reason "PAYMENT, REFUND, ADVANCE_DISBURSAL, ADVANCE_REPAYMENT"
        numeric amount "Precision 19, Scale 2"
        bigint reference_id "Payment ID or Advance ID"
        numeric balance_after "Precision 19, Scale 2"
        timestamp created_at "Chronological timestamp"
    }

    PAYMENT {
        bigint id PK "Identity Autoincrement"
        bigint merchant_id FK "Many-to-One with Merchant"
        varchar payer_vpa "UPI identifier"
        numeric amount "Precision 19, Scale 2"
        varchar note "Optional memo"
        varchar status "PENDING, SUCCESS, FAILED, REFUNDED"
        varchar idempotency_key UK "Unique composite with merchant_id"
        timestamp created_at "ISO-8601 UTC"
    }

    CASH_ADVANCE {
        bigint id PK "Identity Autoincrement"
        bigint merchant_id FK "Many-to-One with Merchant"
        numeric principal "Borrowed amount"
        numeric total_repayable "Principal * 1.05 factor"
        numeric amount_repaid "Accumulated 10% deductions"
        varchar status "ACTIVE or REPAID"
        timestamp created_at "ISO-8601 UTC"
    }
```

---

## Core Technical Innovations & Engineering Decisions

### 1. Robust Idempotency Engine
Duplicate web requests or customer double-taps can lead to catastrophic double-crediting. MerchantHub implements idempotency at the database and application layers:
- The payment request demands an `Idempotency-Key` HTTP header.
- A composite unique index on `(merchant_id, idempotency_key)` guarantees atomicity.
- In-flight duplicate requests return the original transaction record without re-crediting the wallet or re-triggering loan deductions.
- Concurrency races are intercepted via `DataIntegrityViolationException` and resolved safely.

### 2. High-Precision Financial Math
All financial calculations use Java's `BigDecimal` set to scale 2 with `RoundingMode.HALF_UP`. Floating-point types (`double` and `float`) are prohibited across entities, DTOs, and calculations to eradicate IEEE 754 precision drift.

### 3. @Transactional Ledger Consistency & Audit Parity
Every single rupee that enters or leaves a merchant wallet is guarded by `@Transactional` boundaries. Modifying a wallet balance without appending an immutable `LedgerEntry` recording the exact `balanceAfter` is architecturally impossible.

### 4. Optimistic Locking with JPA @Version
High-frequency payments and simultaneous refund operations on a merchant's wallet are protected by optimistic locking. The `@Version` column prevents lost updates and dirty writes without incurring long-lived database row locks.

### 5. Factor-Rate Cash Advance Engine
Unlike compound interest or variable APR, MerchantHub uses a fixed 1.05 factor rate (5% fixed flat fee) common in modern micro-lending. The system dynamically enforces:
- Minimum 5 successful payments in the past 30 days.
- Maximum borrowing limit capped at 50% of 30-day gross volume.
- Only one active cash advance allowed simultaneously.
- Automatic 10% split deductions on subsequent collections until `amountRepaid >= totalRepayable`.

### 6. Single-Service Multi-Stage Docker Architecture
Rather than deploying frontend and backend as detached services with CORS overhead and cross-domain cookies, MerchantHub compiles into a single multi-stage Docker container:
- Stage 1: Builds the React 19 SPA using Node 22 Alpine.
- Stage 2: Injects frontend static assets into Spring Boot's classpath (`src/main/resources/static`) and compiles the JAR using Eclipse Temurin 21.
- Stage 3: Executes the packaged application using minimal Eclipse Temurin 21 JRE, with client-side SPA routing managed by `SpaController`.

---

## API Reference

### Authentication & Profile
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register new merchant with unique slug & initial zero-balance wallet | No |
| POST | `/api/auth/login` | Authenticate merchant via email/password and issue HS256 JWT | No |
| GET | `/api/merchants/me` | Fetch authenticated merchant profile | Yes |

### Wallet & Ledger Auditing
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/wallet` | Fetch current wallet balance and updated timestamp | Yes |
| GET | `/api/wallet/ledger?page=0&size=20` | Paginated double-entry ledger history (newest first) | Yes |
| GET | `/api/wallet/ledger/export` | Download full ledger audit trail as RFC 4180 CSV | Yes |

### Payments & Refunds
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/payments` | Process simulated UPI payment (Requires `Idempotency-Key` header) | Yes |
| GET | `/api/payments?page=0&size=20&status=SUCCESS` | Paginated payment history with optional status filter | Yes |
| GET | `/api/payments/{id}` | Fetch payment transaction detail by ID | Yes |
| POST | `/api/payments/{id}/refund` | Refund a successful payment and debit merchant wallet | Yes |

### Merchant Cash Advance
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/advances/eligibility` | Evaluate 30-day payment volume and maximum advance limit | Yes |
| POST | `/api/advances` | Apply for eligible working capital advance and credit wallet | Yes |
| GET | `/api/advances` | List all historical cash advances and repayment status | Yes |

### Analytics Dashboard
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Fetch wallet balance, today's volume, success rate, and 7-day volume series | Yes |

### Public Payer Checkout
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/public/merchants/{slug}` | Validate payment link and return merchant business name | No |
| POST | `/api/public/merchants/{slug}/pay` | Public checkout simulated UPI payment (Requires `Idempotency-Key`) | No |

### Monitoring & Documentation
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/actuator/health` | Health check endpoint for Docker / Render orchestrators | No |
| GET | `/api/health` | Application status endpoint | No |
| GET | `/swagger-ui.html` | Swagger OpenAPI visual documentation interface | No |

---

## Local Development Setup

### Prerequisites
- Java 21 (Eclipse Adoptium OpenJDK 21)
- Node.js 20+ & npm
- Docker Desktop

### 1. Launch PostgreSQL Database
```powershell
docker compose up -d
```

### 2. Run Backend with Demo Profile
```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\mvnw spring-boot:run "-Dspring-boot.run.profiles=demo"
```
The application starts on `http://localhost:8080`.

### 3. Run Frontend Development Server
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Execute Backend Unit Tests
```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\mvnw clean test
```

---

## Deployment on Render

### Blueprint Deployment
MerchantHub contains an automated `render.yaml` blueprint defining the Docker web service and database configuration:

1. Push your repository to GitHub.
2. Sign in to your Render dashboard and click **New > Blueprint**.
3. Select your repository.
4. Render automatically parses `render.yaml`, provisions the environment, links the database credentials, and starts the container.

### Persistent Cloud Storage with NeonDB
If you wish to host your database permanently on [Neon](https://neon.tech) (serverless PostgreSQL):

1. Create a free PostgreSQL project on Neon.
2. Retrieve your connection details from the Neon dashboard.
3. In your Render Web Service settings, define the following Environment Variables:
   - `DB_HOST`: `ep-your-subdomain.region.aws.neon.tech`
   - `DB_PORT`: `5432`
   - `DB_NAME`: `neondb?sslmode=require`
   - `DB_USER`: `your_neon_username`
   - `DB_PASSWORD`: `your_neon_password`
   - `PORT`: `8080`
   - `SPRING_PROFILES_ACTIVE`: `demo`
   - `SHOW_SQL`: `false`
   - `JWT_SECRET`: `<64-character-random-secret>`

Spring Boot connects directly using SSL and retains all merchant data across container deployments.

---

## Future Roadmap

- Real-Time Webhooks: Signed HMAC-SHA256 webhook notifications sent to merchant ERPs upon payment success, failure, or refund.
- Kafka Event Pipeline: Decoupled asynchronous event ingestion to process thousands of concurrent payment callbacks without blocking web threads.
- Distributed Redis Rate-Limiting: Sliding-window rate limiters guarding public payment links against automated card testing and bot attacks.
- UPI AutoPay e-Mandates: Recurring collection infrastructure supporting subscription billing and automated daily merchant settlements.
