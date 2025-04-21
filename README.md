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
* **Status Animation:** Flight status changes are visually indicated with an animation in the table.
* **Filtering UI:** Frontend includes inputs and buttons to filter the displayed flights based on destination and status.
* **Error Handling:** Includes UI Error Boundary and specific API error handling for better user feedback and robustness.

*(Add any other implemented Bonus Features here, e.g., Persistent Database, Logging)*

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

**Backend:**

* ASP.NET Core Web API (.NET 6/7/8 - *Specify Version*)
* C#
* SignalR (for real-time communication)
* *(Mention Storage: In-Memory List / EF Core + SQLite / etc.)*
* *(Mention Testing Frameworks if used: xUnit / NUnit)*

## Screenshots & GIFs

*(Optional but Recommended)*

**Main View:**
![Flight Deck Main UI](placeholder_for_main_ui.png)
*(Replace `placeholder_for_main_ui.png` with a link to your actual screenshot)*

**Adding a Flight:**
`[GIF Placeholder: Show opening the form, filling details, submitting, and seeing the new flight appear]`

**Filtering Flights:**
`[GIF Placeholder: Show entering filter criteria, clicking filter, and seeing the table update]`

**Deleting a Flight:**
`[GIF Placeholder: Show hovering over a row, clicking the delete icon, and seeing the flight disappear]`

**Status Change Animation:**
`[GIF Placeholder: Show a flight's status changing automatically and the blinking animation appearing]`

## Setup Instructions

### Prerequisites

* Node.js (v18 or later recommended) & npm / yarn
* .NET SDK (Specify version used, e.g., .NET 7.0 SDK)
* Git

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-name>/backend # Adjust path to your backend folder
    ```
2.  **Restore dependencies:**
    ```bash
    dotnet restore
    ```
3.  **(If using EF Core Database)** Configure Database:
    * Ensure connection string in `appsettings.Development.json` (or relevant config) is correct for your environment (e.g., SQLite file path).
    * Apply migrations:
        ```bash
        dotnet ef database update
        ```
4.  **Run the backend API:**
    ```bash
    dotnet run
    ```
    * The API will typically start on `https://localhost:7XXX` or `http://localhost:5XXX`. Note the exact URL from the console output (e.g., `http://localhost:5177`). This is your `VITE_API_BASE_URL`.
    * The SignalR hub URL will usually be `<your-api-base-url>/flightHub` (e.g., `http://localhost:5177/flightHub`). This is your `VITE_SIGNALR_HUB_URL`.

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

## Third-Party Libraries (Frontend)

* **React:** Core UI library.
* **TypeScript:** Language for static typing.
* **Vite:** Build tool and development server.
* **@mui/material:** Material UI component library.
* **@mui/x-date-pickers:** Date/Time picker components.
* **@mui/icons-material:** Material Icons.
* **axios:** Promise-based HTTP client for API requests.
* **react-hook-form:** Form state management and validation.
* **@hookform/resolvers:** Resolver for using Zod with React Hook Form.
* **zod:** TypeScript-first schema declaration and validation.
* **dayjs:** Date/time parsing, manipulation, and formatting.
* **styled-components:** CSS-in-JS library for component styling (used for StatusChip etc.).
* **@microsoft/signalr:** Client library for SignalR real-time communication.
* **react-country-flag:** For displaying country flags based on destination.
* **uuid:** (If used client-side for optimistic updates - check `AddFlightForm`) For generating unique IDs.

*(Add any key backend libraries here if applicable, e.g., Microsoft.EntityFrameworkCore.Sqlite)*

## Folder Structure (Frontend Overview)

src/├── App.tsx             # Main application component (layout, routing, providers)├── main.tsx            # Application entry point├── index.css           # Global styles│├── assets/             # Static assets│├── components/         # Reusable UI components│   ├── AddFlightForm.tsx│   ├── ErrorBoundary.tsx│   ├── FilterPanel.tsx│   ├── FlightDashboard.tsx # Main view logic container│   ├── FlightRow.tsx       # Individual table row component│   ├── FlightTable.tsx     # Table structure & state management│   └── StatusDisplay.tsx   # Status chip/animation component│├── config/             # (Optional) Configuration files│├── contexts/           # (Optional) React Context definitions│├── features/           # (Optional) Feature-based modules│├── hooks/              # Custom React Hooks (e.g., useFlightsData, useSnackbar)│   ├── useFlightsData.ts│   └── useSnackbar.ts│├── lib/                # (Optional) External library setup/wrappers│├── services/           # API interaction layer, SignalR setup│   ├── apiService.ts│   └── signalrService.ts│├── store/              # (Optional) State management (Redux/Zustand) setup│├── types/              # TypeScript type definitions│   └── flight.ts│└── utils/              # Utility functions, constants├── constants.ts└── statusCalculator.ts
## Potential Future Improvements

* Implement table column sorting.
* Add pagination for large datasets.
* Enhance filter UI feedback (e.g., showing active filters).
* Refine real-time update animations/indicators.
* Implement comprehensive unit and integration tests.
* Further performance optimization (e.g., row memoization profiling).
* Add flight editing functionality.

