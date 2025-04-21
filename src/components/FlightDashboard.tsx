import React, { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import AddFlightForm from './AddFlightForm';
import FilterPanel from './FilterPanel';
import FlightTable from './FlightTable';
import { useFlightsData } from '../hooks/useFlightsData';
import {
    startSignalRConnection, stopSignalRConnection,
    onFlightAdded, offFlightAdded,
    onFlightDeleted, offFlightDeleted,
    onFlightStatusChanged, offFlightStatusChanged
} from '../services/signalrService';
import { IFlight, FlightStatus } from '../types/flight';

interface FlightDashboardProps {
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
    statusOptions: FlightStatus[];
}

const FlightDashboard: React.FC<FlightDashboardProps> = ({ showSnackbar, statusOptions }) => {
    // --- State for Filters ---
    const [destinationFilterInput, setDestinationFilterInput] = useState<string>('');
    const [statusFilterInput, setStatusFilterInput] = useState<string>('');

    // --- State for Applied Filters ---
    const [appliedDestinationFilter, setAppliedDestinationFilter] = useState<string | undefined>(undefined);
    const [appliedStatusFilter, setAppliedStatusFilter] = useState<string | undefined>(undefined);

    // --- Data Fetching Hook ---
    const { flights, loading, error, setFlights } = useFlightsData(
        appliedDestinationFilter,
        appliedStatusFilter
    );

    useEffect(() => {
        if (error) {
            if (error !== "No flights match the current criteria.") {
                showSnackbar(error, "error");
            }
        }
    }, [error, showSnackbar]);

    useEffect(() => {
        let isMounted = true;

        const handleFlightAdded = (newFlight: IFlight) => {
            if (!isMounted) return;
            setFlights(current => {
                if (current.some(f => f.id === newFlight.id)) {
                    console.warn(`[SignalR] Duplicate FlightAdded event ignored for ID: ${newFlight.id}`);
                    return current;
                }
                const updated = [...current, newFlight];
                updated.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
                return updated;
            });
            showSnackbar(`Flight ${newFlight.flightNumber} Added`, 'success');
        };

        const handleFlightDeleted = (deletedFlight: IFlight) => {
            if (!isMounted) return;
            setFlights(current => current.filter(flight => flight.id !== deletedFlight.id));
            showSnackbar(`Flight ${deletedFlight.flightNumber} Deleted`, 'info');
        };

        const handleFlightStatusChanged = (flightId: string, newStatus: FlightStatus) => {
            if (!isMounted) return;
            let flightUpdated = false;
            setFlights(current =>
                current.map(f => {
                    if (f.id === flightId) {
                        if (f.currentStatus !== newStatus) {
                            flightUpdated = true;
                            return { ...f, currentStatus: newStatus };
                        } else {
                            console.warn(`[SignalR] FlightStatusChanged event ignored for ID: ${flightId}, status already ${newStatus}`);
                        }
                    }
                    return f;
                })
            );
        };

        startSignalRConnection()
            .then(connection => {
                if (connection && isMounted) {
                    onFlightAdded(handleFlightAdded);
                    onFlightDeleted(handleFlightDeleted);
                    onFlightStatusChanged(handleFlightStatusChanged);
                } else if (isMounted) {
                    console.warn("SignalR connection attempt finished, but component unmounted or connection failed.");
                }
            })
            .catch(err => {
                console.error("SignalR Connection Error:", err);
                if (isMounted) {
                    showSnackbar("Could not connect to real-time server.", "error");
                }
            });

        return () => {
            isMounted = false;
            offFlightAdded(handleFlightAdded);
            offFlightDeleted(handleFlightDeleted);
            offFlightStatusChanged(handleFlightStatusChanged);
            stopSignalRConnection();
        };
    }, [setFlights, showSnackbar]);

    const handleApplyFilter = useCallback(() => {
        const newDest = destinationFilterInput.trim() || undefined;
        const newStatus = statusFilterInput || undefined;
        setAppliedDestinationFilter(newDest);
        setAppliedStatusFilter(newStatus);
    }, [destinationFilterInput, statusFilterInput]);

    const handleClearFilters = useCallback(() => {
        setDestinationFilterInput('');
        setStatusFilterInput('');
        setAppliedDestinationFilter(undefined);
        setAppliedStatusFilter(undefined);
    }, []);

    const isFilterApplied = appliedDestinationFilter !== undefined || appliedStatusFilter !== undefined;
    const hasFilterChanged = (destinationFilterInput.trim() || undefined) !== appliedDestinationFilter ||
        (statusFilterInput || undefined) !== appliedStatusFilter;

    const isApplyButtonDisabled = loading || !hasFilterChanged;
    const isClearButtonDisabled = loading || !isFilterApplied;

    return (
        <>
            <Typography variant="h5" component="h2" gutterBottom>Add New Flight</Typography>
            <AddFlightForm showSnackbar={showSnackbar} />

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>Filter Flights</Typography>
            <FilterPanel
                destinationFilterInput={destinationFilterInput}
                statusFilterInput={statusFilterInput}
                statusOptions={statusOptions}
                onDestinationChange={setDestinationFilterInput}
                onStatusChange={setStatusFilterInput}
                onFilter={handleApplyFilter}
                onClearFilters={handleClearFilters}
                isFilterButtonDisabled={isApplyButtonDisabled}
                isClearButtonDisabled={isClearButtonDisabled}
            />

            <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>Live Flight Information</Typography>

            {loading && (
                <Box display="flex" justifyContent="center" sx={{ my: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && flights.length > 0 && (
                <FlightTable
                    flights={flights}
                    showSnackbar={showSnackbar}
                />
            )}
            {!loading && flights.length === 0 && !error && (
                <Typography align="center" sx={{ my: 3 }}>No flights match the current criteria.</Typography>
            )}
        </>
    );
};

export default FlightDashboard;