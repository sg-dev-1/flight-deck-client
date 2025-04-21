import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import axios from 'axios';

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
import { deleteFlight } from '../services/apiService';
import { IFlight, FlightStatus } from '../types/flight';

interface FlightDashboardProps {
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
    statusOptions: FlightStatus[];
}

const FlightDashboard: React.FC<FlightDashboardProps> = ({ showSnackbar, statusOptions }) => {
    const [destinationFilterInput, setDestinationFilterInput] = useState<string>('');
    const [statusFilterInput, setStatusFilterInput] = useState<string>('');
    const [appliedDestinationFilter, setAppliedDestinationFilter] = useState<string | undefined>(undefined);
    const [appliedStatusFilter, setAppliedStatusFilter] = useState<string | undefined>(undefined);

    const { flights, loading, error, setFlights } = useFlightsData(
        appliedDestinationFilter,
        appliedStatusFilter
    );

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const animationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

    useEffect(() => {
        if (error) {
            if (error !== "No flights match the current criteria.") {
                showSnackbar(error, "error");
            }
        }
    }, [error, showSnackbar]);

    const clearAnimationFlag = useCallback((flightId: string) => {
        setFlights(current => current.map(f =>
            f.id === flightId ? { ...f, isAnimating: false } : f
        ));
        delete animationTimeoutsRef.current[flightId];
    }, [setFlights]);

    const triggerAnimation = useCallback((flightId: string) => {
        if (animationTimeoutsRef.current[flightId]) {
            clearTimeout(animationTimeoutsRef.current[flightId]);
        }
        animationTimeoutsRef.current[flightId] = setTimeout(() => {
            clearAnimationFlag(flightId);
        }, 3000);
    }, [clearAnimationFlag]);

    useEffect(() => {
        let isMounted = true;

        const handleFlightAdded = (newFlight: IFlight) => {
            if (!isMounted) return;
            const flightWithAnimation = { ...newFlight, isAnimating: true };
            setFlights(current => {
                if (current.some(f => f.id === flightWithAnimation.id)) {
                    return current;
                }
                const updated = [...current, flightWithAnimation];
                updated.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
                return updated;
            });
            triggerAnimation(flightWithAnimation.id);
            showSnackbar(`Flight ${newFlight.flightNumber} Added`, 'success');
        };

        const handleFlightDeleted = (deletedFlight: IFlight) => {
            if (!isMounted) return;
            const deletedId = deletedFlight.id;
            setFlights(current => current.filter(flight => flight.id !== deletedId));
            if (animationTimeoutsRef.current[deletedId]) {
                clearTimeout(animationTimeoutsRef.current[deletedId]);
                delete animationTimeoutsRef.current[deletedId];
            }
            if (deletingId === deletedId) {
                setDeletingId(null);
            }
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
                            return { ...f, currentStatus: newStatus, isAnimating: true };
                        }
                    }
                    return f;
                })
            );
            if (flightUpdated) {
                triggerAnimation(flightId);
            }
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

        const timeouts = animationTimeoutsRef.current;
        return () => {
            isMounted = false;
            offFlightAdded(handleFlightAdded);
            offFlightDeleted(handleFlightDeleted);
            offFlightStatusChanged(handleFlightStatusChanged);
            stopSignalRConnection();
            Object.values(timeouts).forEach(clearTimeout);
        };
    }, [setFlights, showSnackbar, deletingId, triggerAnimation, clearAnimationFlag]);

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

    const handleDeleteFlight = useCallback(async (id: string) => {
        setDeletingId(id);
        let userMessage = `Error deleting flight. Please try again.`;
        try {
            await deleteFlight(id);
            if (animationTimeoutsRef.current[id]) {
                clearTimeout(animationTimeoutsRef.current[id]);
                delete animationTimeoutsRef.current[id];
            }
        } catch (err: any) {
            console.error(`[FlightDashboard handleDelete] Failed to delete flight with ID ${id}:`, err);
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    const status = err.response.status;
                    if (status === 404) userMessage = "Flight not found (already deleted?).";
                    else if (status === 403) userMessage = "Permission denied.";
                    else if (status >= 500) userMessage = "Server error deleting flight.";
                    else userMessage = err.response.data?.title || `Error deleting (${status}).`;
                } else if (err.request) userMessage = "Network error deleting flight.";
                else userMessage = `Request setup error: ${err.message}`;
            } else userMessage = "Unexpected error during deletion.";
            showSnackbar(userMessage, 'error');
            setDeletingId(null);
        } finally {
        }
    }, [showSnackbar]);

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
                    deletingId={deletingId}
                    onDelete={handleDeleteFlight}
                />
            )}
            {!loading && flights.length === 0 && !error && (
                <Typography align="center" sx={{ my: 3 }}>No flights match the current criteria.</Typography>
            )}
        </>
    );
};

export default FlightDashboard;
