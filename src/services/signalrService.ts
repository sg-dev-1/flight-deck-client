// Suggested location: src/services/signalrService.ts
import * as signalR from "@microsoft/signalr";
import { Flight } from "../types/flight"; // Import the Flight type

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
        .configureLogging(signalR.LogLevel.Information) // Adjust log level as needed (e.g., Debug for more detail)
        .build();

    // --- Connection Event Handlers (Optional but useful for debugging) ---
    connection.onreconnecting((error) => {
        console.warn(`SignalR connection lost. Attempting to reconnect... Error: ${error?.message}`);
        // You could update UI state here to show a "reconnecting" status
    });

    connection.onreconnected((connectionId) => {
        console.log(`SignalR connection re-established. Connection ID: ${connectionId}`);
        // You could update UI state here
    });

    connection.onclose((error) => {
        console.error(`SignalR connection closed. Error: ${error?.message}`);
        // You might want to attempt restarting the connection after a delay here,
        // although withAutomaticReconnect handles many cases.
        // Or update UI state to show "disconnected".
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
 * Registers a callback function to be invoked when a 'FlightAdded' message is received.
 * IMPORTANT: Ensure the connection is started before calling this.
 * @param callback - The function to call with the new Flight data.
 */
export const onFlightAdded = (callback: (flight: Flight) => void) => {
    if (!connection) {
        console.error("SignalR connection not established. Cannot register 'FlightAdded' listener.");
        return;
    }
    // Register listener for the "FlightAdded" message from the server
    connection.on("FlightAdded", callback);
};

/**
 * Registers a callback function to be invoked when a 'FlightDeleted' message is received.
 * IMPORTANT: Ensure the connection is started before calling this.
 * @param callback - The function to call with the ID (string) of the deleted flight.
 */
export const onFlightDeleted = (callback: (id: string) => void) => {
    if (!connection) {
        console.error("SignalR connection not established. Cannot register 'FlightDeleted' listener.");
        return;
    }
    // Register listener for the "FlightDeleted" message from the server
    connection.on("FlightDeleted", callback);
};

/**
 * Removes a previously registered listener for 'FlightAdded'.
 * Useful for cleanup in component unmounts.
 * @param callback - The specific callback function to remove.
 */
export const offFlightAdded = (callback: (flight: Flight) => void) => {
    if (!connection) return;
    connection.off("FlightAdded", callback);
};

/**
 * Removes a previously registered listener for 'FlightDeleted'.
 * Useful for cleanup in component unmounts.
 * @param callback - The specific callback function to remove.
 */
export const offFlightDeleted = (callback: (id: string) => void) => {
    if (!connection) return;
    connection.off("FlightDeleted", callback);
};


// Note: This service manages a single global connection.
// You would typically call startSignalRConnection once when your app loads
// (e.g., in App.tsx's useEffect) and register/unregister listeners
// in components that need real-time updates.

