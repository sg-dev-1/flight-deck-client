import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { IFlight } from '../types/flight';
import { getFlights } from '../services/apiService';

export function useFlightsData(destination?: string, status?: string) {
    const [flights, setFlights] = useState<IFlight[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getFlights(destination, status);
            data.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
            setFlights(data);
        } catch (err: any) {
            console.error("Failed to fetch flights:", err);
            let errorMsg: string | null = "Failed to load flight data. Please try again later.";

            if (axios.isAxiosError(err)) {
                if (err.response) {
                    const status = err.response.status;
                    const responseData = err.response.data;
                    console.error("API Error Fetching Flights - Status:", status, "Data:", responseData);

                    if (status === 404) {
                        errorMsg = null;
                        setFlights([]);
                    } else if (status === 401 || status === 403) {
                        errorMsg = "Authorization failed. Please check your login or permissions.";
                    } else if (status >= 500) {
                        errorMsg = "Server Error: Unable to fetch flight data at this time.";
                    } else {
                        errorMsg = responseData?.title || `Error fetching flights (${status}).`;
                    }
                } else if (err.request) {
                    errorMsg = "Network Error: Unable to connect to the server.";
                    console.error("Network Error Fetching Flights:", err.request);
                } else {
                    errorMsg = `Request Setup Error: ${err.message}`;
                    console.error("Axios Setup Error Fetching Flights:", err.message);
                }
            } else {
                errorMsg = "An unexpected client-side error occurred while fetching data.";
                console.error("Non-API Error Fetching Flights:", err);
            }

            setError(errorMsg);

            if (errorMsg !== null) {
                setFlights([]);
            }

        } finally {
            setLoading(false);
        }
    }, [destination, status]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { flights, loading, error, setFlights, refetchFlights: fetchData };
}