// Suggested location: src/utils/statusCalculator.ts

export type FlightStatus = "Scheduled" | "Boarding" | "Departed" | "Landed" | "Delayed" | "Unknown";

/**
 * Calculates the flight status based on departure time according to the exact logic
 * sequence provided in the PDF specification.
 * Performs the comparison against the current time in UTC.
 * @param departureTimeString - The departure time as an ISO 8601 string (assumed to be UTC).
 * @returns The calculated flight status string.
 */
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

        // --- Exact Logic from PDF ---
        if (diffMinutes > 30) return "Scheduled";
        if (diffMinutes > 10) return "Boarding"; // Handles (10, 30]
        if (diffMinutes >= -60) return "Departed"; // Handles [-60, 10] 

        // NOTE: The following two conditions from the PDF overlap. 
        // Because the `Departed` check (>= -60) comes first, any value 
        // between -60 and -15 will return "Departed", not "Delayed".
        // Because the `Landed` check (< -60) comes next, any value less 
        // than -60 will return "Landed", not "Delayed".
        // Therefore, with this exact sequence, "Delayed" will likely never be returned.
        if (diffMinutes < -60) return "Landed"; // Handles (-inf, -60)
        if (diffMinutes < -15) return "Delayed"; // Problematic: Will likely never be reached

        // Original PDF had a fallback 'return "Scheduled"' here, 
        // but it's unreachable as the conditions above cover all numbers.
        // Adding a fallback for safety, although it shouldn't be hit.
        return "Unknown";

    } catch (e) {
        console.error("Error calculating flight status:", departureTimeString, e);
        return "Unknown";
    }
};
