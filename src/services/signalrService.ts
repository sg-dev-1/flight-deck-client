// Suggested location: src/services/signalrService.ts
import * as signalR from "@microsoft/signalr";
import { Flight, FlightStatus, IFlightStatusUpdatePayload } from "../types/flight"; // Import Flight and FlightStatus types

// --- Configuration ---
const SIGNALR_HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL;

if (!SIGNALR_HUB_URL) {
    console.error("Error: VITE_SIGNALR_HUB_URL environment variable is not set.");
    // Optionally throw an error or handle appropriately
}

// --- SignalR Connection Management ---

let connection: signalR.HubConnection | null = null;

/**
 * Creates and starts the SignalR connection if it doesn't exist or isn't connected.
 * Configures automatic reconnection.
 */
export const startSignalRConnection = async (): Promise<signalR.HubConnection> => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        console.log("SignalR connection already established.");
        return connection;
    }

    if (!SIGNALR_HUB_URL) {
        throw new Error("SignalR Hub URL is not configured in environment variables.");
    }

    // Build the connection
    connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL)
        .withAutomaticReconnect() // Automatically try to reconnect if the connection is lost
        .configureLogging(signalR.LogLevel.Information) // Adjust log level as needed
        .build();

    // --- Connection Event Handlers ---
    connection.onreconnecting((error) => {
        console.warn(`SignalR connection lost. Attempting to reconnect... Error: ${error?.message}`);
    });

    connection.onreconnected((connectionId) => {
        console.log(`SignalR connection re-established. Connection ID: ${connectionId}`);
    });

    connection.onclose((error) => {
        console.error(`SignalR connection closed. Error: ${error?.message}`);
        connection = null; // Clear the connection variable
    });

    // --- Start the connection ---
    try {
        await connection.start();
        console.log(`SignalR connection started successfully. Connection ID: ${connection.connectionId}`);
        return connection;
    } catch (err) {
        console.error("Error starting SignalR connection:", err);
        connection = null; // Clear on failed start
        throw err; // Re-throw error to be handled by caller
    }
};

/**
 * Stops the SignalR connection if it exists and is connected.
 */
export const stopSignalRConnection = async (): Promise<void> => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        try {
            await connection.stop();
            console.log("SignalR connection stopped.");
        } catch (err) {
            console.error("Error stopping SignalR connection:", err);
        } finally {
            connection = null; // Ensure connection variable is cleared
        }
    }
};

// --- Message Listener Registration ---

/**
 * Registers a callback function for 'FlightAdded' messages.
 * @param callback - The function to call with the new Flight data.
 */
export const onFlightAdded = (callback: (flight: Flight) => void) => {
    if (!connection) {
        console.error("SignalR connection not established. Cannot register 'FlightAdded' listener.");
        return;
    }
    connection.on("FlightAdded", callback);
};

/**
 * Registers a callback function for 'FlightDeleted' messages.
 * @param callback - The function to call with the ID (string) or the deleted Flight object (check backend implementation).
 * Assuming backend now sends the full object based on previous changes.
 */
export const onFlightDeleted = (callback: (deletedFlight: Flight) => void) => { // Updated type to expect Flight object
    if (!connection) {
        console.error("SignalR connection not established. Cannot register 'FlightDeleted' listener.");
        return;
    }
    connection.on("FlightDeleted", callback);
};

/**
 * Registers a callback function for 'FlightStatusChanged' messages.
 * Expects payload: { flightId: string, newStatus: FlightStatus }
 * @param callback - The function to call with the flight ID and the new status.
 */
export const onFlightStatusChanged = (callback: (flightId: string, newStatus: FlightStatus) => void) => {
    if (!connection) return console.error("SignalR not connected: onFlightStatusChanged");

    connection.on("FlightStatusChanged", (payload: IFlightStatusUpdatePayload) => {
        // *** ADD THIS LOG ***
        console.log("[signalrService] Received FlightStatusChanged RAW PAYLOAD:", payload);
        // *** END ADD ***

        if (payload && typeof payload.flightId === 'string' && typeof payload.newStatus === 'string') {
            callback(payload.flightId, payload.newStatus);
        } else {
            console.warn("Invalid FlightStatusChanged payload received in service:", payload);
        }
    });
};


// --- Listener Unregistration ---

/**
 * Removes a previously registered listener for 'FlightAdded'.
 * @param callback - The specific callback function to remove.
 */
export const offFlightAdded = (callback: (flight: Flight) => void) => {
    if (!connection) return;
    connection.off("FlightAdded", callback);
};

/**
 * Removes a previously registered listener for 'FlightDeleted'.
 * @param callback - The specific callback function to remove.
 */
export const offFlightDeleted = (callback: (deletedFlight: Flight) => void) => { // Updated type
    if (!connection) return;
    connection.off("FlightDeleted", callback);
};

/**
 * Removes a previously registered listener for 'FlightStatusChanged'.
 * @param callback - The specific callback function to remove.
 */
export const offFlightStatusChanged = (callback: (flightId: string, newStatus: FlightStatus) => void) => {
    if (!connection) return;
    connection.off("FlightStatusChanged", callback); // Use the same callback reference passed to 'on'
};