# Flight Deck - Real-Time Flight Board

## Description

This project is a full-stack, real-time flight board management system developed as per the interview task requirements. It features a React + TypeScript frontend and an ASP.NET Core Web API backend, supporting live updates, flight management (add, delete, filter), input validation, and a user-friendly UI with real-time feedback via SignalR.

## Features

* **Real-Time Flight Display:** Shows current flights in a table format.
* **Live Updates:** Utilizes SignalR to push real-time updates for added flights, deleted flights, and status changes (eliminating the need for polling).
* **Flight Management:**
    * Add new flights via a dedicated form with client and server-side validation.
    * Delete existing flights directly from the table.
    * Filter flights by Destination and/or Status via the API.
* **Automatic Status Calculation:** Flight status (Scheduled, Boarding, Departed, Delayed, Landed) is calculated client-side based on departure time.
* **Filtering UI:** Frontend includes inputs and buttons to filter the displayed flights based on destination and status.
* **Error Handling:** Includes UI Error Boundary and specific API error handling for better user feedback and robustness.

## Technologies Used

**Frontend:**

* React (`v18+`)
* TypeScript
* Vite (for development environment)
* Material UI (MUI) (for UI components and styling)
* Axios (for HTTP requests)
* React Hook Form (for form management)
* Zod (for client-side schema validation)
* Day.js (for date/time manipulation)
* Styled-components (for specific component styling, e.g., StatusChip)
* `@microsoft/signalr` (for real-time communication)
* `react-country-flag` (for displaying destination flags)

## Screenshots & GIFs

**[Watch: Adding a Flight](docs/media/add_flight.mp4)**

**Deleting a Flight:**
`[GIF Placeholder: Show hovering over a row, clicking the delete icon, and seeing the flight disappear]`

**Status Change Animation:**
`[GIF Placeholder: Show a flight's status changing automatically and the blinking animation appearing]`

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend # Adjust path from backend or repo root
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # OR
    yarn install
    ```
3.  **Configure Environment Variables:**
    * Create a `.env` file in the `frontend` directory by copying `.env.example` (if provided) or creating it manually.
    * Add the following variables, replacing the example URLs with the actual URLs from your running backend:
        ```dotenv
        VITE_API_BASE_URL=http://localhost:5177/api
        VITE_SIGNALR_HUB_URL=http://localhost:5177/flightHub
        ```
4.  **Run the frontend application:**
    ```bash
    npm run dev
    # OR
    yarn dev
    ```
    * The application will typically start on `http://localhost:5173` (or another port indicated by Vite). Open this URL in your browser.

## API Endpoints & Examples

Base URL: `VITE_API_BASE_URL` (e.g., `http://localhost:5177/api`)

* **GET `/flights`**
    * Description: Retrieves all current flights.
    * Example (`cURL`):
        ```bash
        curl -X GET <your-api-base-url>/flights
        ```

* **GET `/flights?destination={dest}&status={stat}`**
    * Description: Retrieves flights filtered by optional destination and/or status. Parameters are case-insensitive usually.
    * Example (`cURL` - Filter by Destination "Paris"):
        ```bash
        curl -X GET "<your-api-base-url>/flights?destination=Paris"
        ```
    * Example (`cURL` - Filter by Status "Boarding"):
        ```bash
        curl -X GET "<your-api-base-url>/flights?status=Boarding"
        ```
    * Example (`cURL` - Filter by Both):
        ```bash
        curl -X GET "<your-api-base-url>/flights?destination=Rome&status=Delayed"
        ```

* **POST `/flights`**
    * Description: Adds a new flight. Requires validation.
    * Headers: `Content-Type: application/json`
    * Example Body (`JSON`):
        ```json
        {
          "flightNumber": "LH987",
          "destination": "Frankfurt",
          "departureTime": "2025-12-01T18:30:00Z", // Use ISO 8601 format (UTC recommended)
          "gate": "C12"
        }
        ```
    * Example (`cURL`):
        ```bash
        curl -X POST <your-api-base-url>/flights \
             -H "Content-Type: application/json" \
             -d '{"flightNumber":"LH987","destination":"Frankfurt","departureTime":"2025-12-01T18:30:00Z","gate":"C12"}'
        ```
    * *Note:* Expect `400 Bad Request` for validation errors (e.g., missing field, past departure time) or `409 Conflict` if flight number already exists.

* **DELETE `/flights/{id}`**
    * Description: Deletes a flight by its unique ID (Guid string).
    * Example (`cURL` - Replace `{flight-id}` with an actual ID):
        ```bash
        curl -X DELETE <your-api-base-url>/flights/{flight-id}
        ```
    * *Note:* Expect `404 Not Found` if the ID doesn't exist.
