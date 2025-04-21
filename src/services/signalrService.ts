import * as signalR from "@microsoft/signalr";
import { IFlight, FlightStatus, IFlightStatusUpdatePayload } from "../types/flight";

const SIGNALR_HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL;

if (!SIGNALR_HUB_URL) {
    console.error("Error: VITE_SIGNALR_HUB_URL environment variable is not set.");
}

let connection: signalR.HubConnection | null = null;

export const startSignalRConnection = async (): Promise<signalR.HubConnection> => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        return connection;
    }

    if (!SIGNALR_HUB_URL) {
        throw new Error("SignalR Hub URL is not configured in environment variables.");
    }

    connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    connection.onreconnecting((error) => {
        console.warn(`SignalR connection lost. Attempting to reconnect... Error: ${error?.message}`);
    });

    connection.onclose((error) => {
        console.error(`SignalR connection closed. Error: ${error?.message}`);
        connection = null;
    });

    try {
        await connection.start();
        return connection;
    } catch (err) {
        console.error("Error starting SignalR connection:", err);
        connection = null;
        throw err;
    }
};

export const stopSignalRConnection = async (): Promise<void> => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        try {
            await connection.stop();
        } catch (err) {
            console.error("Error stopping SignalR connection:", err);
        } finally {
            connection = null;
        }
    }
};


export const onFlightAdded = (callback: (flight: IFlight) => void) => {
    if (!connection) {
        console.error("SignalR connection not established. Cannot register 'FlightAdded' listener.");
        return;
    }
    connection.on("FlightAdded", callback);
};

export const onFlightDeleted = (callback: (deletedFlight: IFlight) => void) => {
    if (!connection) {
        console.error("SignalR connection not established. Cannot register 'FlightDeleted' listener.");
        return;
    }
    connection.on("FlightDeleted", callback);
};

export const onFlightStatusChanged = (callback: (flightId: string, newStatus: FlightStatus) => void) => {
    if (!connection) {
        console.error("SignalR not connected: onFlightStatusChanged");
        return;
    }

    connection.on("FlightStatusChanged", (payload: IFlightStatusUpdatePayload) => {
        if (payload && typeof payload.flightId === 'string' && typeof payload.newStatus === 'string') {
            callback(payload.flightId, payload.newStatus);
        } else {
            console.warn("Invalid FlightStatusChanged payload received in service:", payload);
        }
    });
};


export const offFlightAdded = (callback: (flight: IFlight) => void) => {
    if (!connection) return;
    connection.off("FlightAdded", callback);
};

export const offFlightDeleted = (callback: (deletedFlight: IFlight) => void) => {
    if (!connection) return;
    connection.off("FlightDeleted", callback);
};

export const offFlightStatusChanged = (callback: (flightId: string, newStatus: FlightStatus) => void) => {
    if (!connection) return;
    connection.off("FlightStatusChanged", callback);
};
