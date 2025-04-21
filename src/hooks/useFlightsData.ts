// src/hooks/useFlightsData.ts
import { useState, useEffect, useCallback } from 'react';
import { IFlight } from '../types/flight';
import { getFlights } from '../services/apiService';

export function useFlightsData(destination?: string, status?: string) {
    const [flights, setFlights] = useState<IFlight[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log(`Workspaceing flights with Destination=${destination}, Status=${status}`);
        try {
            const data = await getFlights(destination, status);
            // Sort data after fetching before setting state
            data.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
            setFlights(data);
        } catch (err) {
            console.error("Failed to fetch flights:", err);
            const errorMsg = "Failed to load flight data. Please try again later.";
            setError(errorMsg);
            // We return the error state; the component using the hook can show the snackbar
        } finally {
            setLoading(false);
        }
    }, [destination, status]); // Dependencies ensure fetch runs when filters change

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Effect runs when fetchData identity changes

    // Return state and state setter for SignalR updates, plus refetch function
    return { flights, loading, error, setFlights, refetchFlights: fetchData };
}