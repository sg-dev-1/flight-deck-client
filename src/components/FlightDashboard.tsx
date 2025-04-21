// src/components/FlightDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import {
    Box, CircularProgress, Typography, Grid, Paper,
    TextField, Button, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// Components
import AddFlightForm from './AddFlightForm';
import FilterPanel from './FilterPanel';
import FlightTable from './FlightTable';
// Hooks
import { useFlightsData } from '../hooks/useFlightsData';
// Services & Types
import {
    startSignalRConnection, stopSignalRConnection,
    onFlightAdded, offFlightAdded,
    onFlightDeleted, offFlightDeleted,
    onFlightStatusChanged, offFlightStatusChanged
} from '../services/signalrService';
import { IFlight, FlightStatus } from '../types/flight';
// utils (statusCalculator not needed here anymore)

// Props that FlightDashboard will receive from App.tsx
interface FlightDashboardProps {
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
    statusOptions: FlightStatus[]; // Receive status options from App
}

const FlightDashboard: React.FC<FlightDashboardProps> = ({ showSnackbar, statusOptions }) => {
    // --- State for Filters ---
    const [destinationFilterInput, setDestinationFilterInput] = useState<string>('');
    const [statusFilterInput, setStatusFilterInput] = useState<string>('');

    // --- State for Applied Filters ---
    const [appliedDestinationFilter, setAppliedDestinationFilter] = useState<string | undefined>(undefined);
    const [appliedStatusFilter, setAppliedStatusFilter] = useState<string | undefined>(undefined);

    // --- Data Fetching Hook ---
    const { flights, loading, error, setFlights /*, refetchFlights */ } = useFlightsData(
        appliedDestinationFilter,
        appliedStatusFilter
    );

    // --- Effect to show fetch errors via Snackbar ---
    useEffect(() => {
        if (error) {
            // Example: Adjust condition based on how your API indicates "not found" vs actual error
            if (error !== "No flights match the current criteria.") {
                showSnackbar(error, "error");
            }
        }
    }, [error, showSnackbar]);

    // --- SignalR Effect ---
    useEffect(() => {
        let isMounted = true; // Flag to prevent state updates on unmounted component

        // Define handlers for SignalR events
        const handleFlightAdded = (newFlight: IFlight) => {
            if (!isMounted) return;
            console.log("[SignalR] Flight Added Received:", newFlight);
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
            console.log("[SignalR] Flight Deleted Received:", deletedFlight);
            setFlights(current => current.filter(flight => flight.id !== deletedFlight.id));
            showSnackbar(`Flight ${deletedFlight.flightNumber} Deleted`, 'info');
        };

        const handleFlightStatusChanged = (flightId: string, newStatus: FlightStatus) => {
            if (!isMounted) return;
            console.log("[SignalR] Flight Status Changed Received:", { flightId, newStatus });
            let flightUpdated = false;
            setFlights(current =>
                current.map(f => {
                    if (f.id === flightId) {
                        if (f.currentStatus !== newStatus) {
                            console.log(`Updating flight ${flightId} status from ${f.currentStatus} to ${newStatus}`);
                            flightUpdated = true;
                            return { ...f, currentStatus: newStatus };
                        } else {
                            console.warn(`[SignalR] FlightStatusChanged event ignored for ID: ${flightId}, status already ${newStatus}`);
                        }
                    }
                    return f;
                })
            );
            // if (flightUpdated) showSnackbar(`Flight ${flightId} status updated to ${newStatus}`, 'info');
        };

        // Start connection and register listeners
        console.log("Attempting to start SignalR connection...");
        startSignalRConnection()
            .then(connection => {
                if (connection && isMounted) {
                    console.log("SignalR Connected, registering listeners in FlightDashboard...");
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

        // Cleanup function
        return () => {
            isMounted = false;
            console.log("Cleaning up SignalR listeners in FlightDashboard...");
            offFlightAdded(handleFlightAdded);
            offFlightDeleted(handleFlightDeleted);
            offFlightStatusChanged(handleFlightStatusChanged);
            stopSignalRConnection();
            console.log("SignalR cleanup complete in FlightDashboard.");
        };
    }, [setFlights, showSnackbar]); // Dependencies


    // --- Filter Handlers (Wrapped in useCallback) ---
    const handleApplyFilter = useCallback(() => {
        const newDest = destinationFilterInput.trim() || undefined;
        const newStatus = statusFilterInput || undefined;
        setAppliedDestinationFilter(newDest);
        setAppliedStatusFilter(newStatus);
    }, [destinationFilterInput, statusFilterInput]); // Dependencies: values read inside callback

    const handleClearFilters = useCallback(() => {
        setDestinationFilterInput('');
        setStatusFilterInput('');
        setAppliedDestinationFilter(undefined);
        setAppliedStatusFilter(undefined);
    }, []); // No dependencies, safe to use empty array

    // --- Calculate Button Disabled States ---
    const isFilterApplied = appliedDestinationFilter !== undefined || appliedStatusFilter !== undefined;
    const hasFilterChanged = (destinationFilterInput.trim() || undefined) !== appliedDestinationFilter ||
        (statusFilterInput || undefined) !== appliedStatusFilter;

    const isApplyButtonDisabled = loading || !hasFilterChanged;
    const isClearButtonDisabled = loading || !isFilterApplied;

    return (
        <>
            {/* --- Add Flight Form --- */}
            <Typography variant="h5" component="h2" gutterBottom>Add New Flight</Typography>
            {/* Pass stable showSnackbar prop */}
            <AddFlightForm showSnackbar={showSnackbar} />

            {/* --- Filter Panel Section --- */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>Filter Flights</Typography>
            {/* Pass stable handlers wrapped in useCallback */}
            <FilterPanel
                destinationFilterInput={destinationFilterInput}
                statusFilterInput={statusFilterInput}
                statusOptions={statusOptions} // Prop from App
                onDestinationChange={setDestinationFilterInput} // useState setter is stable
                onStatusChange={setStatusFilterInput} // useState setter is stable
                onFilter={handleApplyFilter} // Pass memoized handler
                onClearFilters={handleClearFilters} // Pass memoized handler
                isFilterButtonDisabled={isApplyButtonDisabled}
                isClearButtonDisabled={isClearButtonDisabled}
            />

            {/* --- Flight Table Section --- */}
            <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>Live Flight Information</Typography>

            {/* Loading Indicator */}
            {loading && (
                <Box display="flex" justifyContent="center" sx={{ my: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Table or No Flights Message */}
            {!loading && flights.length > 0 && (
                // Pass stable showSnackbar prop
                <FlightTable
                    flights={flights} // This prop changes often, causing re-render
                    showSnackbar={showSnackbar}
                />
            )}
            {!loading && flights.length === 0 && !error && (
                <Typography align="center" sx={{ my: 3 }}>No flights match the current criteria.</Typography>
            )}
            {/* Error state is handled by the snackbar useEffect */}
        </>
    );
};

// Usually no need to memoize the main page/dashboard component itself
export default FlightDashboard;