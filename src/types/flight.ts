export type FlightStatus = "Scheduled" | "Boarding" | "Departed" | "Landed" | "Delayed" | "Unknown";

export interface IFlight {
    id: string;
    flightNumber: string;
    destination: string;
    departureTime: string; // (ISO format from backend)
    gate: string;
    currentStatus?: FlightStatus;  // <-- To store status pushed by SignalR
}
export interface ICreateFlightRequest {
    flightNumber: string;
    destination: string;
    departureTime: string; // Expect UTC ISO string
    gate: string;
}

export interface IFlightStatusUpdatePayload {
    flightId: string;
    newStatus: FlightStatus;
}