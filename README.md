## 🚀 Alert Management System - API Documentation

This Spring Boot application manages alerts, drivers, vehicles, and transitions in a monitoring system.  
Below is a detailed explanation of each endpoint and repository method with their purpose, response, and complexity.

## Here i have tell about the end point, Tech Stack  and for more detail refer to moveinsyn_documentation.pdf above

---

## ⚙️ Tech Stack

| **Category**        | **Technology Used**                 | **Purpose / Description** |
|----------------------|-------------------------------------|----------------------------|
| **Backend**          | Java Spring Boot                    | Provides RESTful APIs, business logic, and server-side processing. |
| **Frontend**         | React.js + Bootstrap                | Builds the user interface with responsive design and dynamic components. |
| **Database**         | MySQL                               | Stores alerts, drivers, vehicles, admins, and rule data. |
| **ORM Layer**        | Spring Data JPA (Hibernate)         | Simplifies database CRUD operations through repository interfaces. |
| **Security**         | JWT (JSON Web Token) Authentication | Ensures secure access and authorization for users and admins. |
| **Build Tool**       | Maven                               | Manages dependencies and project builds for the backend. |
| **UI Styling**       | Bootstrap                           | Provides responsive and consistent design for React components. |
| **Logging**          | SLF4J + Logback                     | Used for logging API calls, exceptions, and system activity. |
| **API Testing Tool** | Insomnia / cURL                      | For testing and validating API endpoints. |
| **Version Control**  | Git + GitHub                        | Source code management and collaboration. |
| **Runtime Environment** | JDK 17 (Recommended)             | Java version required to run the backend application. |
| **Optional Monitoring** | Prometheus + Grafana (via Docker) | Used for monitoring Spring Boot metrics and system performance. |

---

### ⚡ AutoCloseJob (Scheduler)
- **Purpose:** Automatically closes alerts older than the defined auto-close time (default 1 hour).  
- **Runs Every:** 2 minutes.  
- **Complexity:** O(n) — iterates over all active alerts.

---

### 🔔 AlertController (`/api/alerts`)
1. **POST `/api/alerts`**  
   - **Purpose:** Create or update an alert based on driver, vehicle, and source type.  
   - **Input:** `AlertRequest` (JSON with driverId, vehicleId, type, sourceType, metadata).  
   - **Response:** Returns created or updated `Alert` object.  
   - **Complexity:** O(1) average (DB insert or update).

2. **GET `/api/alerts`**  
   - **Purpose:** Fetch the latest 20 alerts sorted by creation time.  
   - **Response:** List of top 20 `Alert` objects.  
   - **Complexity:** O(20) ≈ O(1).

3. **GET `/api/alerts/trends`**  
   - **Purpose:** Get daily alert trends for the past 7 days including totals, escalations, and auto-closed counts.  
   - **Response:** List of maps containing `{date, totalAlerts, escalations, autoClosed}`.  
   - **Complexity:** O(n) for number of trend days.

4. **GET `/api/alerts/trends/weekly`**  
   - **Purpose:** Get weekly aggregated alert data for last 4 weeks.  
   - **Response:** List of `{week, totalAlerts, escalations, autoClosed}`.  
   - **Complexity:** O(n) for number of weeks.

5. **GET `/api/alerts/{alertId}`**  
   - **Purpose:** Fetch details of a specific alert by ID.  
   - **Response:** Single `Alert` object.  
   - **Complexity:** O(1).

6. **PUT `/api/alerts/{alertId}/resolve`**  
   - **Purpose:** Resolve an alert manually (update status to "RESOLVED").  
   - **Response:** `ResponseEntity<String>` message “Success” or error.  
   - **Complexity:** O(1).

7. **GET `/api/alerts/{alertId}/history`**  
   - **Purpose:** Fetch full transition history (status changes) for a specific alert.  
   - **Response:** List of `AlertTransition` objects sorted by timestamp.  
   - **Complexity:** O(k), where k = transitions per alert.

8. **GET `/api/alerts/auto-close`**  
   - **Purpose:** Retrieve all alerts that were auto-closed by system rules.  
   - **Response:** List of `Alert` objects.  
   - **Complexity:** O(n), where n = number of closed alerts.

---

### 📊 DashboardController (`/api/dashboard`)
1. **GET `/api/dashboard/stats`**  
   - **Purpose:** Get total counts of alerts by severity (`CRITICAL`, `WARNING`, `INFO`).  
   - **Response:** `StatsDto` object `{critical, warning, info}`.  
   - **Complexity:** O(n), where n = total alerts.

2. **GET `/api/dashboard/top`**  
   - **Purpose:** Retrieve top 5 drivers with the highest number of unresolved alerts.  
   - **Response:** List of `DriverAlertStatsDTO`.  
   - **Complexity:** O(5) ≈ O(1).

---

### ⚙️ RulesController (`/api/rules`)
1. **GET `/api/rules`**  
   - **Purpose:** Fetch all alert rules (from DB or file).  
   - **Response:** JSON of all rules.  
   - **Complexity:** O(n), where n = number of rule entries.

2. **POST `/api/rules/reload`**  
   - **Purpose:** Reloads rule configurations from JSON file to memory.  
   - **Response:** String `"reloaded"`.  
   - **Complexity:** O(n), where n = rule count in file.

---

### 👤 UserController
1. **POST `/login`**  
   - **Purpose:** Authenticate admin user and generate JWT token.  
   - **Input:** `{userName, password}`.  
   - **Response:** `{authToken}` if valid; error otherwise.  
   - **Complexity:** O(1) for authentication check.

---
### 🔹 1. `AlertRepository`
Handles CRUD and analytics operations related to Alerts.

#### ➤ `findByAlertId(Integer alertId)`
- **Description:** Fetches a single alert using its unique alert ID.
- **Response:** Returns an `Alert` object or `null` if not found.
- **Time Complexity:** `O(1)` (Indexed lookup by primary key)
- **Space Complexity:** `O(1)`

#### ➤ `findBySourceTypeAndDriverIdAndCreatedAtAfter(String sourceType, String driverId, LocalDateTime after)`
- **Description:** Returns all alerts for a given driver and source type created after a specific date.
- **Response:** `List<Alert>`
- **Time Complexity:** `O(n)` (depends on number of matching alerts)
- **Space Complexity:** `O(n)`

#### ➤ `findByStatusNot(String status)`
- **Description:** Retrieves all alerts whose status is **not** the given value.
- **Response:** `List<Alert>`
- **Time Complexity:** `O(n)` (table scan with filter)
- **Space Complexity:** `O(n)`

#### ➤ `findFirstBySourceTypeAndTypeAndDriverIdAndStatusNotInAndCreatedAtAfter(...)`
- **Description:** Fetches the most recent alert of a specific type and source for a driver, excluding given statuses.
- **Response:** `Optional<Alert>`
- **Time Complexity:** `O(log n)` 
- **Space Complexity:** `O(1)`

#### ➤ `findTopOffenders()`
- **Description:** Aggregates alerts per driver to find the **top 5 drivers** with the highest number of unresolved alerts.
- **Response:** `List<DriverAlertStatsDTO>` (driver ID, name, total alerts, counts by severity)
- **Time Complexity:** `O(n)` (aggregation + grouping)
- **Space Complexity:** `O(k)` (where `k` = number of drivers)

#### ➤ `findRecentAutoClosed()`
- **Description:** Retrieves the **50 most recent alerts** that were automatically closed.
- **Response:** `List<Alert>`
- **Time Complexity:** `O(log n)` (uses `ORDER BY` + `LIMIT`)
- **Space Complexity:** `O(1)`

#### ➤ `findTop20ByOrderByCreatedAtDesc()`
- **Description:** Returns the **20 latest alerts** sorted by creation time.
- **Response:** `List<Alert>`
- **Time Complexity:** `O(log n)` (sorted query + limit)
- **Space Complexity:** `O(1)`

#### ➤ `getTotalAlertsByDate()`
- **Description:** Counts alerts per day for the **last 7 days**.
- **Response:** `List<Object[]>` → `[date, totalAlerts]`
- **Time Complexity:** `O(n)` (grouping operation)
- **Space Complexity:** `O(d)` (d = days in range)

#### ➤ `getTotalAlertsByWeek()`
- **Description:** Returns total alert counts per week for the **past 4 weeks**.
- **Response:** `List<Object[]>` → `[week, totalAlerts]`
- **Time Complexity:** `O(n)`
- **Space Complexity:** `O(w)` (w = number of weeks)

#### ➤ `findByStatus(String status)`
- **Description:** Retrieves all alerts with a specific status (e.g., `RESOLVED`, `ESCALATED`).
- **Response:** `List<Alert>`
- **Time Complexity:** `O(n)`
- **Space Complexity:** `O(n)`

---

### 🔹 2. `TransitionRepository`
Handles the lifecycle changes (status transitions) of alerts.

#### ➤ `findByAlertIdOrderByTimestampAsc(Integer alertId)`
- **Description:** Fetches all transitions for an alert ordered by timestamp.
- **Response:** `List<AlertTransition>`
- **Time Complexity:** `O(m log m)` 
- **Space Complexity:** `O(m)`

#### ➤ `getEscalationsAndAutoClosedByDate()`
- **Description:** Returns daily counts of **escalated** and **auto-closed** alerts for the past 7 days.
- **Response:** `List<Object[]>` → `[date, escalations, autoClosed]`
- **Time Complexity:** `O(n)`
- **Space Complexity:** `O(d)`

#### ➤ `getEscalationsAndAutoClosedByWeek()`
- **Description:** Aggregates weekly escalations and auto-closed alerts for the past 4 weeks.
- **Response:** `List<Object[]>` → `[week, escalations, autoClosed]`
- **Time Complexity:** `O(n)`
- **Space Complexity:** `O(w)`

---

### 🔹 3. `RepoAdmin`
Handles authentication and admin-related data.

#### ➤ `findByUserName(String userName)`
- **Description:** Fetches admin details by username (used during login).
- **Response:** `Admin`
- **Time Complexity:** `O(1)` (indexed lookup)
- **Space Complexity:** `O(1)`

---

### 🔹 4. `RuleRepository`
Handles alert rule configurations.

#### ➤ `findByAlertType(String alertType)`
- **Description:** Retrieves configuration details of a specific alert rule.
- **Response:** `Optional<AlertRule>`
- **Time Complexity:** `O(1)`
- **Space Complexity:** `O(1)`

---

### 🔹 5. `VehicleRepository`
Handles vehicle-related operations.

#### ➤ Inherits all `JpaRepository` methods
- **Description:** Standard CRUD operations for vehicle entities.
- **Response:** `Vehicle` or `List<Vehicle>`
- **Time Complexity:**  
  - `findById`: `O(1)`  
  - `findAll`: `O(n)`  
  - `save`: `O(1)`  
- **Space Complexity:**  
  - `O(1)` for single ops  
  - `O(n)` for list retrieval

---

### 📊 Summary
- Simple CRUD endpoints: `O(1)` or `O(n)`
- Aggregation & analytics queries: `O(n)`
- Sorting or grouped queries: `O(n log n)`
- Space usage grows linearly with number of records fetched.

---

### 🧩 Example Usage

```bash
GET /api/alerts/top-offenders
# → Returns top 5 drivers with most unresolved alerts

GET /api/alerts/recent-auto-closed
# → Returns last 50 auto-closed alerts

GET /api/transitions/weekly-stats
# → Returns weekly escalation and auto-closed counts
