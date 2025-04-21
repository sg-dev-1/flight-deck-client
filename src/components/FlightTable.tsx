import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow as MuiTableRow,
    Card, CardContent
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import { IFlight, FlightStatus } from '../types/flight';
import { deleteFlight } from '../services/apiService';
import { calculateFlightStatus } from '../utils/statusCalculator';
import FlightRow from './FlightRow';
interface FlightTableProps {
    flights: IFlight[];
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
}

interface AnimatingStatusInfo {
    oldStatus: FlightStatus;
    newStatus: FlightStatus;
    timeoutId: NodeJS.Timeout;
}

const formatDateTime = (dateTimeString: string): string => {
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) { return "Invalid Date"; }
};


const FlightTableComponent: React.FC<FlightTableProps> = ({ flights, showSnackbar }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [animatingStatuses, setAnimatingStatuses] = useState<Record<string, AnimatingStatusInfo>>({});
    const prevFlightsRef = useRef<IFlight[]>(flights);

    useEffect(() => {
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

            if (prevFlight && currentActualStatus !== prevActualStatus) {
                changesDetected.push(currentFlight.id);

                const existingAnimation = animatingStatuses[currentFlight.id];
                if (existingAnimation) {
                    clearTimeout(existingAnimation.timeoutId);
                }

                const timeoutId = setTimeout(() => {
                    setAnimatingStatuses(prev => {
                        const next = { ...prev };
                        delete next[currentFlight.id];
                        return next;
                    });
                }, 10000);

                newAnimating[currentFlight.id] = {
                    oldStatus: prevActualStatus ?? "Unknown",
                    newStatus: currentActualStatus ?? "Unknown",
                    timeoutId: timeoutId
                };
            }
        });

        if (changesDetected.length > 0) {
            setAnimatingStatuses(prev => ({ ...prev, ...newAnimating }));
        } else if (prevFlightsRef.current.length > 0 || flights.length > 0) {
        }

        prevFlightsRef.current = flights;

        return () => {
            Object.values(animatingStatuses).forEach(animInfo => clearTimeout(animInfo.timeoutId));
        };
    }, [flights, animatingStatuses]);

    const handleDelete = useCallback(async (id: string) => {
        setDeletingId(id);
        let userMessage = `Error deleting flight. Please try again.`;
        try {
            await deleteFlight(id);
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

            showSnackbar(userMessage, 'error');
            setDeletingId(null);

        } finally {
            setDeletingId(null);
        }
    }, [animatingStatuses, showSnackbar]);

    const cellSx = { padding: '12px 16px', verticalAlign: 'middle' };
    const headCellSx = { ...cellSx, fontWeight: 'bold' };

    return (
        <Card variant="outlined" sx={{ mt: 3, mb: 3 }}>
            <CardContent sx={{ padding: 0, '&:last-child': { paddingBottom: 0 } }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="enhanced flight table">
                        <TableHead>
                            <MuiTableRow sx={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid', borderColor: 'divider' }}>
                                <TableCell sx={headCellSx}>Flight No.</TableCell>
                                <TableCell sx={headCellSx}>Gate</TableCell>
                                <TableCell sx={headCellSx}>Status</TableCell>
                                <TableCell sx={headCellSx}>Destination</TableCell>
                                <TableCell sx={headCellSx}>Departure Time</TableCell>
                                <TableCell sx={headCellSx}></TableCell>
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
                                flights.map((flight) => (
                                    <FlightRow
                                        key={flight.id}
                                        flight={flight}
                                        animationInfo={animatingStatuses[flight.id]}
                                        isDeleting={deletingId === flight.id}
                                        onDelete={handleDelete}
                                        formatDateTime={formatDateTime}
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

export default React.memo(FlightTableComponent);