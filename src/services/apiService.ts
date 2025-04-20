// Suggested location: src/services/apiService.ts
import axios from 'axios';
// Import the types we defined earlier
import { Flight, CreateFlightRequest } from '../types/flight';

// --- Configuration ---

// Get the base URL for the API from environment variables
// Make sure you have VITE_API_BASE_URL=http://localhost:5177/api (or similar) in your .env file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    console.error("Error: VITE_API_BASE_URL environment variable is not set.");
    // Optionally throw an error or provide a default for local development,
    // but failing fast is often better.
    // throw new Error("VITE_API_BASE_URL is not defined"); 
}

// Create an Axios instance with the base URL pre-configured
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- API Service Functions ---

/**
 * Fetches flights from the API, optionally filtering by destination and status.
 * @param destination - Optional destination filter.
 * @param status - Optional status filter.
 * @returns A promise resolving to an array of Flight objects.
 */
export const getFlights = async (destination?: string, status?: string): Promise<Flight[]> => {
    try {
        // Build query parameters object, only including defined values
        const params: { destination?: string; status?: string } = {};
        if (destination) {
            params.destination = destination;
        }
        if (status) {
            params.status = status;
        }

        // Make GET request to /flights with optional query parameters
        const response = await apiClient.get<Flight[]>('/flights', { params });
        // Axios automatically parses JSON response, response.data contains the array
        return response.data;
    } catch (error) {
        console.error("Error fetching flights:", error);
        // Re-throw the error or return an empty array / handle appropriately
        throw error;
    }
};

/**
 * Adds a new flight via the API.
 * @param flightData - The data for the new flight.
 * @returns A promise resolving to the newly created Flight object.
 */
export const addFlight = async (flightData: CreateFlightRequest): Promise<Flight> => {
    try {
        // Make POST request to /flights with the flight data in the body
        const response = await apiClient.post<Flight>('/flights', flightData);
        return response.data; // Return the created flight object from the response
    } catch (error) {
        console.error("Error adding flight:", error);
        // Check if it's an Axios error with response data (like validation errors)
        if (axios.isAxiosError(error) && error.response) {
            console.error("Validation/API Error:", error.response.data);
            // You might want to throw a specific error type or the response data here
        }
        throw error;
    }
};

/**
 * Deletes a flight by its ID via the API.
 * @param id - The unique identifier (Guid string) of the flight to delete.
 * @returns A promise that resolves when the deletion is successful.
 */
export const deleteFlight = async (id: string): Promise<void> => {
    try {
        // Make DELETE request to /flights/{id}
        await apiClient.delete(`/flights/${id}`);
        // DELETE requests typically don't return content on success (204 No Content)
    } catch (error) {
        console.error(`Error deleting flight with ID ${id}:`, error);
        throw error;
    }
};

/**
 * Fetches a single flight by its ID. (Good practice to have)
 * @param id - The unique identifier (Guid string) of the flight.
 * @returns A promise resolving to the Flight object or null if not found.
 */
export const getFlightById = async (id: string): Promise<Flight | null> => {
    try {
        const response = await apiClient.get<Flight>(`/flights/${id}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            // Handle 404 Not Found specifically
            return null;
        }
        console.error(`Error fetching flight with ID ${id}:`, error);
        throw error;
    }
};

// You can add other API functions here as needed (e.g., updateFlight if required later)

