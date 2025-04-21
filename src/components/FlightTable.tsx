// src/components/FlightTable.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios'; // <-- Import axios for error handling
// Removed styled-components imports if not used directly here
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow as MuiTableRow, CircularProgress, Typography,
    Box, Card, CardContent // Removed IconButton, Chip as they are in FlightRow/StatusDisplay
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
// Removed Icon imports as they are in FlightRow/StatusDisplay
// Removed ReactCountryFlag import as it's in FlightRow

// Types, Services, Utils, Constants
import { IFlight, FlightStatus } from '../types/flight';
import { deleteFlight } from '../services/apiService';
import { calculateFlightStatus } from '../utils/statusCalculator';
// Removed cityToCountryCode import as it's used in FlightRow

// Import the extracted components
import FlightRow from './FlightRow';
// Removed StatusDisplay import as it's used within FlightRow

// --- Interfaces --- (Keep interfaces used by this component)
interface FlightTableProps {
    flights: IFlight[];
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
}

// This type might be needed if passed to FlightRow, or defined within it
interface AnimatingStatusInfo {
    oldStatus: FlightStatus;
    newStatus: FlightStatus;
    timeoutId: NodeJS.Timeout;
}

// --- Helper Function (Keep formatDateTime here or move to utils) ---
const formatDateTime = (dateTimeString: string): string => {
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) { return "Invalid Date"; }
};


// --- Main FlightTable Component ---
const FlightTableComponent: React.FC<FlightTableProps> = ({ flights, showSnackbar }) => {
    // State and Effect remain here
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [animatingStatuses, setAnimatingStatuses] = useState<Record<string, AnimatingStatusInfo>>({});
    const prevFlightsRef = useRef<IFlight[]>(flights);

    // Animation Effect remains here
    useEffect(() => {
        // ... same animation effect logic as before...
        // Calculates which flights need animating and stores info in `animatingStatuses`
        console.log(`[FlightTable Effect RUNNING] Received ${flights.length} flights...`);
        const newAnimating: Record<string, AnimatingStatusInfo> = {};
        const changesDetected: string[] = [];
        const prevFlightsMap = new Map(prevFlightsRef.current.map(f => [f.id, f]));

        flights.forEach(currentFlight => {
            const prevFlight = prevFlightsMap.get(currentFlight.id);
            const prevPushedStatus = prevFlight?.currentStatus;
            const currPushedStatus = currentFlight.currentStatus;
            const prevCalculatedStatus = prevFlight ? calculateFlightStatus(prevFlight.departureTime) : undefined;
            const currCalculatedStatus = calculateFlightStatus(currentFlight.departureTime);
            const prevActualStatus = prevFlight ? (prevPushedStatus ?? prevCalculatedStatus) : currCalculatedStatus;
            const currentActualStatus = currPushedStatus ?? currCalculatedStatus;

            console.log(`[Effect Check ${currentFlight.id}] ... Comparing: Prev Actual='${prevActualStatus}' vs Curr Actual='${currentActualStatus}'`);

            if (prevFlight && currentActualStatus !== prevActualStatus) {
                changesDetected.push(currentFlight.id);
                console.log(`---> [FlightTable Effect] *** CHANGE DETECTED *** for ${currentFlight.id}: ${prevActualStatus} -> ${currentActualStatus}`);

                const existingAnimation = animatingStatuses[currentFlight.id];
                if (existingAnimation) {
                    clearTimeout(existingAnimation.timeoutId);
                }

                const timeoutId = setTimeout(() => {
                    console.log(`---> [FlightTable Timeout] ANIMATION ENDING for ${currentFlight.id}`);
                    setAnimatingStatuses(prev => {
                        const next = { ...prev };
                        delete next[currentFlight.id];
                        return next;
                    });
                }, 10000); // Animation duration

                newAnimating[currentFlight.id] = {
                    oldStatus: prevActualStatus ?? "Unknown",
                    newStatus: currentActualStatus ?? "Unknown",
                    timeoutId: timeoutId
                };
            }
        });

        if (changesDetected.length > 0) {
            console.log('===> [FlightTable Effect] Updating animatingStatuses state ...');
            setAnimatingStatuses(prev => ({ ...prev, ...newAnimating }));
        } else if (prevFlightsRef.current.length > 0 || flights.length > 0) {
            console.log('[FlightTable Effect] No status changes detected for animation trigger.');
        }

        prevFlightsRef.current = flights;

        return () => {
            Object.values(animatingStatuses).forEach(animInfo => clearTimeout(animInfo.timeoutId));
        };
    }, [flights, animatingStatuses]);

    // --- Delete Handler (with Improved Error Handling) ---
    const handleDelete = useCallback(async (id: string) => {
        setDeletingId(id);
        let userMessage = `Error deleting flight. Please try again.`; // Default message
        try {
            await deleteFlight(id);
            console.log(`Delete request for ${id} successful (UI update pending SignalR).`);
            // Clear animation state immediately if the deleted flight was animating
            if (animatingStatuses[id]) {
                clearTimeout(animatingStatuses[id].timeoutId);
                setAnimatingStatuses(prev => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }
        } catch (err: any) {
            console.error(`Failed to delete flight with ID ${id}:`, err);

            // --- Specific API Error Handling ---
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    const status = err.response.status;
                    const responseData = err.response.data;
                    console.error("API Error Deleting Flight - Status:", status, "Data:", responseData);
                    if (status === 404) {
                        userMessage = "Flight not found. It might have been deleted already.";
                    } else if (status === 403) {
                        userMessage = "Permission denied to delete this flight.";
                    } else if (status >= 500) {
                        userMessage = "Server error occurred while trying to delete flight.";
                    } else {
                        userMessage = responseData?.title || `Error deleting flight (${status}).`;
                    }
                } else if (err.request) {
                    userMessage = "Network Error: Could not reach server to delete flight.";
                    console.error("Network Error Deleting Flight:", err.request);
                } else {
                    userMessage = `Request Setup Error: ${err.message}`;
                    console.error("Axios Setup Error Deleting Flight:", err.message);
                }
            } else {
                userMessage = "An unexpected client-side error occurred during deletion.";
                console.error("Non-API Error Deleting Flight:", err);
            }
            // --- End Specific API Error Handling ---

            showSnackbar(userMessage, 'error'); // Show specific error message
            setDeletingId(null); // Ensure loading state stops on error

        } finally {
            // Ensure the loading state is turned off reliably
            setDeletingId(null);
        }
    }, [animatingStatuses, showSnackbar]); // Include setAnimatingStatuses if it's used inside try/catch logic that might change its behavior based on state

    // --- Style Objects ---
    const cellSx = { padding: '12px 16px', verticalAlign: 'middle' };
    const headCellSx = { ...cellSx, fontWeight: 'bold' };

    console.log('[FlightTable Render] Main table render. Animating:', Object.keys(animatingStatuses).length);

    return (
        <Card variant="outlined" sx={{ mt: 3, mb: 3 }}>
            <CardContent sx={{ padding: 0, '&:last-child': { paddingBottom: 0 } }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="enhanced flight table">
                        <TableHead>
                            {/* Table Header remains simple */}
                            <MuiTableRow sx={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid', borderColor: 'divider' }}>
                                <TableCell sx={headCellSx}>Flight No.</TableCell>
                                <TableCell sx={headCellSx}>Gate</TableCell>
                                <TableCell sx={headCellSx}>Status</TableCell>
                                <TableCell sx={headCellSx}>Destination</TableCell>
                                <TableCell sx={headCellSx}>Departure Time</TableCell>
                                <TableCell sx={headCellSx}></TableCell>{/* For Delete Button */}
                            </MuiTableRow>
                        </TableHead>
                        <TableBody>
                            {flights.length === 0 ? (
                                <MuiTableRow>
                                    <TableCell colSpan={6} align="center" sx={cellSx}>
                                        No flights to display.
                                    </TableCell>
                                </MuiTableRow>
                            ) : (
                                // Render the imported FlightRow component in the map
                                flights.map((flight) => (
                                    <FlightRow
                                        key={flight.id}
                                        flight={flight}
                                        animationInfo={animatingStatuses[flight.id]}
                                        isDeleting={deletingId === flight.id}
                                        onDelete={handleDelete} // Pass down the enhanced delete handler
                                        formatDateTime={formatDateTime} // Pass down the formatter
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

// --- Styled Components Definitions are removed (they live in FlightRow/StatusDisplay) ---


// Memoize the main export
export default React.memo(FlightTableComponent);