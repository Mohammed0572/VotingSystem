# Prajatantra - Functional and Non-Functional Requirements

### Functional Requirements

**Core voting flow (authentication → vote → confirmation)**
- The system must allow registered voters to authenticate, securely cast exactly one vote, and receive visual confirmation of their successful transaction.
- **Component:** Frontend / Face Auth API / Smart Contract
- **Status:** ✅ Implemented

**Admin management (candidates, election lifecycle)**
- Administrators must be able to add new candidates with their respective parties and manage the start and end dates of the election cycle.
- **Component:** Frontend / Smart Contract
- **Status:** ✅ Implemented

**Blockchain interaction (cast vote, check vote, get results)**
- The system must communicate with the Ethereum network to record vote transactions immutably, verify voting status to prevent double votes, and retrieve real-time candidate tallies.
- **Component:** Frontend / Smart Contract
- **Status:** ✅ Implemented

**Face recognition (enrollment, verification, liveness)**
- The system must capture facial geometry for voter enrollment and subsequently verify identities via webcam streams while detecting active blinking (liveness) to prevent spoofing.
- **Component:** Frontend / Face Auth API
- **Status:** ✅ Implemented *(EAR-based blink detection thresholds are configured and enforced in the backend during auth).*

**Session management (login, logout, refresh, `/auth/me`)**
- The system must maintain secure user and admin sessions using `httpOnly` JWT cookies with endpoints to check session state, refresh tokens, and securely log out.
- **Component:** Face Auth API / Frontend
- **Status:** ✅ Implemented

**Multilingual support**
- The user interface must dynamically translate into English, Hindi, Kannada, and Tamil based on user preference to ensure broad accessibility across target demographics.
- **Component:** Frontend
- **Status:** ✅ Implemented

**Accessibility**
- The user interface must be navigable and usable by individuals with varying abilities, providing clear status updates, readable typography, and contrast.
- **Component:** Frontend
- **Status:** ✅ Implemented *(ARIA live regions, semantic fieldsets, and proper contrast have been applied to meet WCAG 2.1 AA standards).*

---

### Non-Functional Requirements

**Security (auth, transport, rate limiting, smart contract access control)**
- The system must protect endpoints against abuse via IP-based rate limiting, secure cookies against XSS, hash admin passwords with bcrypt, and restrict smart contract administrative functions to the deployer.
- **Component:** Face Auth API / Smart Contract / Frontend
- **Status:** ✅ Implemented

**Performance (response times, blockchain confirmation, face recognition latency)**
- Facial verification must process within seconds, and blockchain transactions must provide UI feedback while waiting for block confirmations on the Sepolia testnet.
- **Component:** Face Auth API / Smart Contract
- **Status:** ✅ Implemented *(Optimistic UI state updates provide instant feedback while Sepolia blockchain confirmation resolves in the background).*

**Scalability (single-node vs multi-worker)**
- The system infrastructure must support handling concurrent requests using Redis for shared rate-limiting states across multiple worker processes.
- **Component:** Face Auth API / Docker Compose
- **Status:** ✅ Implemented *(Redis rate-limiting is implemented. The SQLite backend with WAL mode provides sufficient concurrent read performance for the prototype's multi-worker scope).*

**Reliability (graceful shutdown, error handling, Redis fallback)**
- The backend must gracefully fall back to an in-memory rate limiter if the Redis instance fails, and return standardized HTTP error codes to the client.
- **Component:** Face Auth API
- **Status:** ✅ Implemented

**Maintainability (repo structure, config management, test coverage)**
- The codebase must be modular, rely on `.env` files for configuration injection, and include automated tests for critical smart contract and API logic.
- **Component:** All Components
- **Status:** ✅ Implemented

**Compliance (WCAG 2.1 AA, Election Commission of India design standards)**
- The application design must adhere to recognized accessibility guidelines (WCAG 2.1 AA) and align aesthetically with official government digital standards.
- **Component:** Frontend
- **Status:** ✅ Implemented *(Strict usage of India-themed design tokens—Saffron, Green, Navy—alongside semantic HTML).*
