// Suggested location: src/types/flight.ts

/**
 * Represents the structure of flight data received from the backend API.
 */
export interface Flight {
    /** * Unique identifier for the flight (maps to Guid on backend, string in JSON/TS). 
     */
    id: string;

    /** * The flight number (e.g., "BA123"). 
     */
    flightNumber: string;

    /** * The destination city or airport code.
     */
    destination: string;

    /** * The scheduled departure time (received as an ISO 8601 string from backend).
     */
    departureTime: string;

    /** * The assigned departure gate.
     */
    gate: string;

    /** * The calculated flight status (e.g., "Scheduled", "Boarding", "Departed").
     * This might be calculated on the backend (as in our Flight model) or frontend.
     */
    status: FlightStatus;
}

/**
 * Represents the data needed to create a new flight via the API.
 * (Matching the CreateFlightRequest DTO on the backend)
 */
export interface CreateFlightRequest {
    flightNumber: string;
    destination: string;
    departureTime: string; // Send as ISO 8601 string
    gate: string;
}

export type FlightStatus = 'Scheduled' | 'Boarding' | 'Departed' | 'Landed' | 'Delayed';