# Create Ride API Specification

**For:** Frontend AI agent consuming the ride-sharing (carpool) API.
**As of:** 2026-05-30

---

## 1. Endpoint

```
POST /api/v1/carpool/
```

---

## 2. Authentication

This endpoint requires an active session. The user must be logged in via the standard login flow before calling this endpoint. Authentication is enforced server-side using a session cookie.

- If no valid session exists, the server returns `401 Unauthorized`.
- There are no API keys or tokens passed in request headers for this endpoint.

---

## 3. Request

**Content-Type:** `application/json`

### Body Fields

| Field            | Type   | Required | Description                              |
|------------------|--------|----------|------------------------------------------|
| `pickupLocation` | string | Yes      | The starting pickup location for the ride |
| `whereTo`        | string | Yes      | The destination of the ride              |
| `time`           | string | Yes      | The scheduled departure time             |
| `availableSeats` | number | Yes      | Number of seats the driver is offering   |

### Example Request Body

```json
{
  "pickupLocation": "Al Barsha, Dubai",
  "whereTo": "Dubai Mall",
  "time": "08:30 AM",
  "availableSeats": 3
}
```

---

## 4. Response — Success

**Status:** `201 Created`

```json
{
  "success": true,
  "data": {
    "pool": {
      "_id": "<ObjectId>",
      "pickupLocation": "Al Barsha, Dubai",
      "whereTo": "Dubai Mall",
      "time": "08:30 AM",
      "availableSeats": 3,
      "user": "<ObjectId of the creator>",
      "rideStarted": false,
      "rideEnded": false,
      "existingUsers": [],
      "droppedOffUsers": [],
      "createdAt": "2026-05-30T07:00:00.000Z",
      "updatedAt": "2026-05-30T07:00:00.000Z"
    }
  }
}
```

### Pool Object Fields

| Field             | Type       | Description                                          |
|-------------------|------------|------------------------------------------------------|
| `_id`             | string     | Unique MongoDB identifier for this pool              |
| `pickupLocation`  | string     | Pickup location as provided in the request           |
| `whereTo`         | string     | Destination as provided in the request               |
| `time`            | string     | Departure time as provided in the request            |
| `availableSeats`  | number     | Seats available as provided in the request           |
| `user`            | string     | ObjectId of the user who created this pool           |
| `rideStarted`     | boolean    | Always `false` at creation                           |
| `rideEnded`       | boolean    | Always `false` at creation                           |
| `existingUsers`   | array      | Empty array at creation; populated as users join     |
| `droppedOffUsers` | array      | Empty array at creation                              |
| `createdAt`       | string     | ISO 8601 timestamp of when the pool was created      |
| `updatedAt`       | string     | ISO 8601 timestamp of the last update                |

---

## 5. Response — Error: Daily Limit Reached

**Status:** `429 Too Many Requests`

Returned when the authenticated user has already created 2 or more rides within the last 24 hours.

```json
{
  "success": false,
  "message": "You've reached your daily ride limit. Please try again after 24 hours."
}
```

---

## 6. Response — Other Errors

### 401 Unauthorized — Not logged in

Returned when the request is made without a valid session.

```json
{
  "success": false,
  "message": "Not logged in"
}
```

### 409 Conflict — Active pool already exists

Returned when the user already has an active (non-ended) pool. Only one active pool is allowed per user at a time.

```json
{
  "success": false,
  "message": "Can't create more than one active pool."
}
```

### 429 Too Many Requests — Rate limit (request throttle)

Returned when the user fires more than 5 requests to this endpoint within 60 seconds (separate from the daily limit).

> **Note:** The response body for this rate limit may differ from the daily limit 429 above — confirm shape with backend team.

### 500 Internal Server Error

Returned on unexpected server-side failures.

```json
{
  "success": false,
  "message": "<error detail>"
}
```

---

## 7. Notes

- **Daily limit:** A user may create a maximum of **2 rides per 24-hour rolling window**. The window starts from the time each ride was created — it does not reset at midnight. After a ride ages past 24 hours, it no longer counts toward the limit.
- **One active pool at a time:** Separate from the daily limit, a user cannot have more than one non-ended pool active simultaneously. Attempting to create a second while one is still active returns `409`.
- **Both limits can apply:** A user could be blocked by either the 24-hour count limit (429) or the active-pool uniqueness constraint (409). The daily limit is checked first.
- **`time` field format:** The `time` field is stored as a plain string. There is no server-side format enforcement — the frontend controls formatting (confirm with backend team if a standard format is required).
- **`existingUsers` and `droppedOffUsers`:** These arrays are managed by separate join/drop-off endpoints, not by this create endpoint.
