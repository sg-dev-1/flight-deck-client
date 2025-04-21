import { FlightStatus } from "../types/flight";
import { validStatusOptions } from "./constants";

export const calculateFlightStatus = (departureTimeString: string): FlightStatus => {
    try {
        const departureTime = new Date(departureTimeString);
        if (isNaN(departureTime.getTime())) {
            console.error("Invalid departure time string:", departureTimeString);
            return "Unknown";
        }

        const nowUtcMillis = Date.now();
        const departureUtcMillis = departureTime.getTime();
        const diffMinutes = (departureUtcMillis - nowUtcMillis) / 60000;

        let status: FlightStatus = "Scheduled"; // Default

        if (diffMinutes > 30) {
            status = "Scheduled";
        } else if (diffMinutes > 10) {
            status = "Boarding";
        } else if (diffMinutes >= -60) {
            status = "Departed";
        }
        if (diffMinutes < -15) {
            status = "Delayed";
        }
        if (diffMinutes < -60) {
            status = "Landed";
        }

        const validStatuses: FlightStatus[] = validStatusOptions;

        if (validStatuses.includes(status)) {
            return status;
        } else {
            console.warn(`Calculated status "${status}" is not a recognized FlightStatus. Defaulting to Unknown.`);
            return "Unknown";
        }
    } catch (e) {
        console.error("Error calculating flight status:", departureTimeString, e);
        return "Unknown";
    }
};