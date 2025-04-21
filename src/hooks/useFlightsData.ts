// src/hooks/useFlightsData.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // <-- Import axios
import { IFlight } from '../types/flight';
import { getFlights } from '../services/apiService';

export function useFlightsData(destination?: string, status?: string) {
    const [flights, setFlights] = useState<IFlight[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    // The error state will hold the message to be potentially displayed in the UI
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null); // Clear previous errors before fetching
        console.log(`Workspaceing flights with Destination=${destination}, Status=${status}`);
        try {
            const data = await getFlights(destination, status);
            // Sort data immediately after fetching
            data.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
            setFlights(data);
            // No error if fetch is successful, even if data is empty
        } catch (err: any) {
            console.error("Failed to fetch flights:", err);
            let errorMsg = "Failed to load flight data. Please try again later."; // Default error message

            // --- Improved Error Handling ---
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    // The server responded with a status code outside the 2xx range
                    const status = err.response.status;
                    const responseData = err.response.data;
                    console.error("API Error Fetching Flights - Status:", status, "Data:", responseData);

                    if (status === 404) {
                        // Treat 404 as "no results found" rather than a critical error.
                        // The UI can show "No flights match" based on the empty flights array.
                        errorMsg = null; // Don't set an error message in the hook state for 404
                        setFlights([]); // Ensure flights are empty
                    } else if (status === 401 || status === 403) {
                        errorMsg = "Authorization failed. Please check your login or permissions.";
                        // You might want to trigger a logout action here in a real app
                    } else if (status >= 500) {
                        errorMsg = "Server Error: Unable to fetch flight data at this time.";
                    } else {
                        // Handle other client errors (e.g., 400 Bad Request on filters?)
                        errorMsg = responseData?.title || `Error fetching flights (${status}).`;
                    }
                } else if (err.request) {
                    // The request was made but no response was received
                    errorMsg = "Network Error: Unable to connect to the server.";
                    console.error("Network Error Fetching Flights:", err.request);
                } else {
                    // Something happened setting up the request
                    errorMsg = `Request Setup Error: ${err.message}`;
                    console.error("Axios Setup Error Fetching Flights:", err.message);
                }
            } else {
                // Handle non-Axios errors (e.g., programming errors in the try block)
                errorMsg = "An unexpected client-side error occurred while fetching data.";
                console.error("Non-API Error Fetching Flights:", err);
            }
            // --- End Improved Error Handling ---

            setError(errorMsg); // Set the error message state for the UI to potentially use
            // Only clear flights if there was a real error (not a 404 treated as empty)
            if (errorMsg !== null) {
                setFlights([]);
            }

        } finally {
            setLoading(false);
        }
    }, [destination, status]); // Dependencies for useCallback

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Effect runs when fetchData identity changes (due to filter changes)

    // Return state and refetch function
    return { flights, loading, error, setFlights, refetchFlights: fetchData };
}