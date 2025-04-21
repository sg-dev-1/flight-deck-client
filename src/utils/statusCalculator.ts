import { FlightStatus } from "../types/flight"; // Import the consolidated type

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

        // Initialize status based on C# logic
        let status: FlightStatus = "Scheduled"; // Default

        // Apply C# if/else if chain
        if (diffMinutes > 30) {
            status = "Scheduled";
        } else if (diffMinutes > 10) {
            status = "Boarding";
        } else if (diffMinutes >= -60) {
            status = "Departed";
        }

        // Apply subsequent C# if conditions (these can override previous statuses)
        if (diffMinutes < -15) {
            status = "Delayed"; // Overrides Departed if diff is between -15 and -60
        }

        if (diffMinutes < -60) {
            status = "Landed"; // Overrides Departed and Delayed if diff < -60
        }

        // Validate if the resulting status is actually part of our defined FlightStatus type
        // This is a safety check in case the logic produces an unexpected string
        const validStatuses: FlightStatus[] = ["Scheduled", "Boarding", "Departed", "Landed", "Delayed"];
        if (validStatuses.includes(status)) {
            return status;
        } else {
            console.warn(`Calculated status "${status}" is not a recognized FlightStatus. Defaulting to Unknown.`);
            return "Unknown"; // Fallback if something unexpected happened
        }
    } catch (e) {
        console.error("Error calculating flight status:", departureTimeString, e);
        return "Unknown";
    }
};