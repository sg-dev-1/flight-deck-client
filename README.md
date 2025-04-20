# FlightDeck Client (Frontend)

This is the React + TypeScript frontend for the FlightDeck real-time flight board management system. It interacts with the [FlightDeck Backend](link/to/your/backend/repo/if/separate) to display, add, delete, and filter flight information with real-time updates via SignalR.

## Technologies Used

* React 18+
* TypeScript
* Vite (Build Tool / Dev Server)
* Material UI (MUI v5) (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)
* `styled-components`
* Axios (for HTTP requests)
* `@microsoft/signalr` (SignalR client)
* `react-hook-form` (for form handling)
* `zod` & `@hookform/resolvers` (for form validation)

## Setup Instructions

1.  **Prerequisites:**
    * Node.js (LTS version recommended, e.g., v18 or v20+)
    * npm or yarn package manager
    * The [FlightDeck Backend](link/to/your/backend/repo/if/separate) must be running simultaneously for the client to function correctly.

2.  **Clone Repository:** Clone the repository containing this client project.
    ```bash
    # Example if in a monorepo, otherwise just clone the client repo
    git clone <your-repo-url>
    cd <your-repo-name>/flight-deck-client 
    ```
    *(Adjust `cd` command based on your folder structure)*

3.  **Install Dependencies:** Navigate to the client project directory (`flight-deck-client/`) in your terminal and run:
    ```bash
    # Using npm
    npm install

    # OR using yarn
    yarn install
    ```

4.  **Configure Environment Variables:**
    * Create a file named `.env` in the root of the `flight-deck-client` directory.
    * Add the following lines, replacing the URLs/ports if your backend runs differently:
        ```plaintext
        # .env
        VITE_API_BASE_URL=http://localhost:5177/api
        VITE_SIGNALR_HUB_URL=http://localhost:5177/flightHub
        ```
    * *(Note: The `VITE_` prefix is required by Vite to expose these variables to the frontend code.)*

5.  **Run Development Server:** Start the Vite development server:
    ```bash
    # Using npm
    npm run dev

    # OR using yarn
    yarn dev
    ```
    * The application should automatically open in your browser, typically at `http://localhost:5173`.

## Features Implemented

* Displays flight information in a table.
* Calculates flight status client-side based on departure time.
* Updates flight statuses automatically via an internal timer.
* Styles status display based on the current status with animations on change.
* Receives real-time updates for added/deleted flights via SignalR.
* Allows adding new flights via an inline form with client-side validation.
* Allows deleting flights via buttons on each table row (visible on hover).
* Allows filtering flights by Destination and Status.
* Uses MUI for UI components.
* Uses `styled-components` for specific component styling (e.g., StatusChip).

## Third-Party Libraries Used

* `react` / `react-dom`
* `@mui/material`
* `@mui/icons-material`
* `@emotion/react`
* `@emotion/styled`
* `styled-components`
* `@microsoft/signalr`
* `axios`
* `react-hook-form`
* `zod`
* `@hookform/resolvers`

*(You might have other dependencies like `@types/*`, `eslint`, etc. - list the main functional ones)*

