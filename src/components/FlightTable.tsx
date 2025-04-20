// Suggested location: src/components/FlightTable.tsx
import React, { useState } from 'react'; // Removed useEffect, useCallback as they are less needed now
import styled from 'styled-components';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow as MuiTableRow, Paper, CircularProgress, Typography,
    Box, IconButton, Chip
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import DeleteIcon from '@mui/icons-material/Delete';

import { Flight, FlightStatus } from '../types/flight';
// Removed getFlights import
import { deleteFlight } from '../services/apiService';
// Removed SignalR service imports
import { calculateFlightStatus } from '../utils/statusCalculator';

// Define props for the component, including flights array
interface FlightTableProps {
    flights: Flight[]; // Receive flights as a prop
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
}

// --- Styled Components (remain the same) ---
interface StatusChipProps { flightStatus: FlightStatus; }
const getStatusColors = (status: FlightStatus): { backgroundColor: string; color: string; } => {
    switch (status) {
        case "Scheduled": return { backgroundColor: '#e0e0e0', color: '#616161' };
        case "Boarding": return { backgroundColor: '#64b5f6', color: '#ffffff' };
        case "Departed": return { backgroundColor: '#81c784', color: '#ffffff' };
        case "Landed": return { backgroundColor: '#ba68c8', color: '#ffffff' };
        case "Delayed": return { backgroundColor: '#ffb74d', color: '#ffffff' };
        case "Unknown":
        default: return { backgroundColor: '#f5f5f5', color: '#bdbdbd' };
    }
}
const StatusChip = styled(Chip) <StatusChipProps>` 
  background-color: ${props => getStatusColors(props.flightStatus).backgroundColor};
  color: ${props => getStatusColors(props.flightStatus).color};
  font-weight: ${props => (props.flightStatus === 'Boarding' || props.flightStatus === 'Delayed' ? 'bold' : 'normal')};
  transition: background-color 0.5s ease-in-out, color 0.5s ease-in-out;
  height: 24px; 
  font-size: 0.8125rem; 
  min-width: 80px; 
  & .MuiChip-label {
    color: ${props => getStatusColors(props.flightStatus).color};
    padding-left: 10px; 
    padding-right: 10px;
  }
`;
const StyledTableRow = styled(MuiTableRow)` 
  .delete-button { opacity: 0; transition: opacity 0.2s ease-in-out; }
  &:hover .delete-button { opacity: 1; }
`;


// Accept props: flights array and showSnackbar function
const FlightTable: React.FC<FlightTableProps> = ({ flights, showSnackbar }) => {
    // Removed flights, loading, error state management from here
    // Keep deletingId state local to the table for button loading indicator
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // Removed tick state and status update timer logic
    // Removed useEffect for data fetching and listeners

    // --- Delete Handler (Updated to use showSnackbar prop) ---
    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await deleteFlight(id);
            console.log(`Delete request sent for flight ID: ${id}`);
            // Success feedback (snackbar & list update) is handled by App via SignalR
        } catch (err) {
            console.error(`Failed to delete flight with ID ${id}:`, err);
            // Use prop function for error notification
            showSnackbar(`Error deleting flight ${id}. Please try again.`, 'error');
            setDeletingId(null); // Reset loading state on error
        } finally {
            // Reset deleting state if SignalR doesn't update quickly (optional safeguard)
            // setTimeout(() => setDeletingId(currentId => currentId === id ? null : currentId), 2000); 
        }
    };

    // --- Helper Function for Date Formatting ---
    const formatDateTime = (dateTimeString: string): string => {
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return "Invalid Date";
            return date.toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        } catch (e) {
            console.error("Error formatting date:", dateTimeString, e);
            return "Invalid Date";
        }
    };

    // --- Render Logic ---
    // No need for loading/error checks here, handled by parent (App)

    return (
        // Removed outer Box wrapper
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="flight table">
                <TableHead>
                    <MuiTableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell>Flight No.</TableCell>
                        <TableCell>Destination</TableCell>
                        <TableCell>Departure Time</TableCell>
                        <TableCell>Gate</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right"></TableCell>
                    </MuiTableRow>
                </TableHead>
                <TableBody>
                    {/* Render based on the flights prop */}
                    {flights.length === 0 ? (
                        <MuiTableRow>
                            <TableCell colSpan={6} align="center">
                                No flights match the current criteria.
                            </TableCell>
                        </MuiTableRow>
                    ) : (
                        // Map through flights prop
                        flights.map((flight) => {
                            // Calculate status for display
                            const currentStatus = calculateFlightStatus(flight.departureTime);
                            return (
                                <StyledTableRow key={flight.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component="th" scope="row">{flight.flightNumber}</TableCell>
                                    <TableCell>{flight.destination}</TableCell>
                                    <TableCell>{formatDateTime(flight.departureTime)}</TableCell>
                                    <TableCell>{flight.gate}</TableCell>
                                    <TableCell align="center">
                                        <StatusChip label={currentStatus} flightStatus={currentStatus} size="small" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton className="delete-button" aria-label="delete flight" onClick={() => handleDelete(flight.id)} disabled={deletingId === flight.id} size="small" color="error" >
                                            {deletingId === flight.id ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon fontSize="small" />}
                                        </IconButton>
                                    </TableCell>
                                </StyledTableRow>
                            );
                        }) // End map
                    )}
                </TableBody>
            </Table>
        </TableContainer>
        // Removed Snackbar component from here
    );
};

export default FlightTable;
