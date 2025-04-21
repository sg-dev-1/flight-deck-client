// src/components/FlightTable.tsx
import React, { JSX, useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow as MuiTableRow, CircularProgress, Typography,
    Box, IconButton, Chip, Card, CardContent
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
// Flag Component
import ReactCountryFlag from 'react-country-flag';

import { IFlight, FlightStatus } from '../types/flight';
import { deleteFlight } from '../services/apiService';
import { calculateFlightStatus } from '../utils/statusCalculator';

interface FlightTableProps {
    flights: IFlight[];
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
}

interface AnimatingStatusInfo {
    oldStatus: FlightStatus;
    newStatus: FlightStatus;
    timeoutId: NodeJS.Timeout;
}

// --- Simple Animation for Debugging ---
const simpleBlink = keyframes`
  0%, 100% { background-color: transparent; }
  50% { background-color: yellow; } /* Very obvious yellow blink */
`;

const BlinkingBox = styled(Box)`
  display: inline-block;
  /* Apply simpler animation */
  animation: ${simpleBlink} 1s linear infinite;
  padding: 2px 4px; /* Add slight padding so background is visible */
  border-radius: 4px;
`;


const ArrowSpan = styled.span`
  margin: 0 8px;
  font-weight: bold;
  vertical-align: middle;
`;

interface StatusChipProps { $flightStatus: FlightStatus; }
const getStatusColors = (status: FlightStatus): { backgroundColor: string; color: string; } => { /* ... same ... */
    switch (status) {
        case "Scheduled": return { backgroundColor: '#e0e0e0', color: '#616161' };
        case "Boarding": return { backgroundColor: '#64b5f6', color: '#ffffff' };
        case "Departed": return { backgroundColor: '#81c784', color: '#ffffff' };
        case "Landed": return { backgroundColor: '#ba68c8', color: '#ffffff' };
        case "Delayed": return { backgroundColor: '#ffb74d', color: '#ffffff' };
        default: return { backgroundColor: '#f5f5f5', color: '#bdbdbd' };
    }
}
const getStatusIcon = (status: FlightStatus): JSX.Element | null => { /* ... same ... */
    const iconStyle = { fontSize: '1rem', marginRight: '4px', paddingRight: '2px', verticalAlign: 'middle' };
    switch (status) {
        case "Scheduled": return <AccessTimeIcon sx={iconStyle} />;
        case "Boarding": return <ConnectingAirportsIcon sx={iconStyle} />;
        case "Departed": return <FlightTakeoffIcon sx={iconStyle} />;
        case "Landed": return <FlightLandIcon sx={iconStyle} />;
        case "Delayed": return <WarningAmberIcon sx={iconStyle} />;
        default: return null;
    }
}

const StatusChip = styled(Chip) <StatusChipProps>`/* ... same styles using $flightStatus ... */
    background-color: ${props => getStatusColors(props.$flightStatus).backgroundColor};
    color: ${props => getStatusColors(props.$flightStatus).color};
    font-weight: ${props => (props.$flightStatus === 'Boarding' || props.$flightStatus === 'Delayed' ? 'bold' : 'normal')};
    transition: background-color 0.5s ease-in-out, color 0.5s ease-in-out;
    height: 28px;
    font-size: 0.8125rem;
    min-width: 90px;
    padding-left: ${props => getStatusIcon(props.$flightStatus) ? '6px' : '10px'};
    padding-right: ${props => getStatusIcon(props.$flightStatus) ? '6px' : '10px'};

    & .MuiChip-icon { color: inherit; margin-left: 5px; margin-right: -4px; width: 18px; height: 18px; }
     & .MuiChip-label { color: inherit; padding-left: ${props => getStatusIcon(props.$flightStatus) ? '0px' : '4px'}; padding-right: 8px; line-height: 1.5; display: inline-block; }
`;

const StyledTableRow = styled(MuiTableRow)` /* ... same styles, no animation here ... */
  transition: background-color 0.15s ease-in-out;
  .delete-button { opacity: 0; transition: opacity 0.2s ease-in-out; }
  &:hover { background-color: #f9f9f9; .delete-button { opacity: 1; } }
`;

const cityToCountryCode: { [key: string]: string } = { /* ... same mapping ... */
    "London": "GB", "Paris": "FR", "New York": "US", "Tokyo": "JP",
    "Dubai": "AE", "Singapore": "SG", "Frankfurt": "DE", "Amsterdam": "NL",
    "Los Angeles": "US", "Chicago": "US", "Rome": "IT", "Madrid": "ES"
};

const FlightTable: React.FC<FlightTableProps> = ({ flights, showSnackbar }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [animatingStatuses, setAnimatingStatuses] = useState<Record<string, AnimatingStatusInfo>>({});
    const prevFlightsRef = useRef<IFlight[]>(flights);

    // --- Effect for Animation ---
    useEffect(() => {
        console.log(`[FlightTable Effect RUNNING] Received ${flights.length} flights. Comparing against ${prevFlightsRef.current.length} previous flights.`);
        const newAnimating: Record<string, AnimatingStatusInfo> = {};
        const changesDetected: string[] = [];

        // Create a map of previous flights for faster lookup
        const prevFlightsMap = new Map(prevFlightsRef.current.map(f => [f.id, f]));

        flights.forEach(currentFlight => {
            const prevFlight = prevFlightsMap.get(currentFlight.id);

            // --- DETAILED LOGGING ---
            const prevPushedStatus = prevFlight?.currentStatus;
            const currPushedStatus = currentFlight.currentStatus;
            const prevCalculatedStatus = prevFlight ? calculateFlightStatus(prevFlight.departureTime) : undefined;
            const currCalculatedStatus = calculateFlightStatus(currentFlight.departureTime);

            // Determine the actual status used in the PREVIOUS render
            const prevActualStatus = prevFlight ? (prevPushedStatus ?? prevCalculatedStatus) : currCalculatedStatus;
            // Determine the actual status for the CURRENT render
            const currentActualStatus = currPushedStatus ?? currCalculatedStatus;

            console.log(`[Effect Check ${currentFlight.id}] Prev Prop Status: ${prevPushedStatus}, Curr Prop Status: ${currPushedStatus}. Prev Calc: ${prevCalculatedStatus}, Curr Calc: ${currCalculatedStatus}. || COMPARING: Prev Actual='${prevActualStatus}' vs Curr Actual='${currentActualStatus}'`);
            // --- END DETAILED LOGGING ---


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
                }, 10000);

                newAnimating[currentFlight.id] = {
                    oldStatus: prevActualStatus ?? "Unknown",

                    newStatus: currentActualStatus ?? "Unknown",
                    timeoutId: timeoutId
                };
            }
        });

        if (changesDetected.length > 0) {
            console.log('===> [FlightTable Effect] Updating animatingStatuses state with flights:', Object.keys(newAnimating));
            setAnimatingStatuses(prev => ({ ...prev, ...newAnimating }));
        } else if (prevFlightsRef.current.length > 0 || flights.length > 0) { // Avoid logging on initial empty renders
            console.log('[FlightTable Effect] No status changes detected for animation trigger.');
        }

        // IMPORTANT: Update the ref *after* all comparisons are done
        prevFlightsRef.current = flights;

        // Cleanup function (seems correct)
        return () => {
            Object.values(animatingStatuses).forEach(animInfo => clearTimeout(animInfo.timeoutId));
        };
    }, [flights, animatingStatuses]); // Only re-run when flights prop changes


    const handleDelete = async (id: string) => { /* ... same ... */
        setDeletingId(id);
        try {
            await deleteFlight(id);
            if (animatingStatuses[id]) {
                clearTimeout(animatingStatuses[id].timeoutId);
                setAnimatingStatuses(prev => { const next = { ...prev }; delete next[id]; return next; });
            }
        } catch (err) {
            console.error(`Failed to delete flight with ID ${id}:`, err);
            showSnackbar(`Error deleting flight ${id}. Please try again.`, 'error');
            setDeletingId(null);
        }
    };
    const formatDateTime = (dateTimeString: string): string => { /* ... same ... */
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return "Invalid Date";
            return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) { return "Invalid Date"; }
    };

    const cellSx = { padding: '12px 16px', verticalAlign: 'middle' };
    const headCellSx = { ...cellSx, fontWeight: 'bold' };

    const renderStatusChip = (status: FlightStatus) => (<StatusChip icon={getStatusIcon(status)} label={status} $flightStatus={status} size="small" />);

    console.log('[FlightTable Render] Current animatingStatuses:', animatingStatuses); // Log state on each render

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
                            {flights.length === 0 ? (<MuiTableRow><TableCell colSpan={6} align="center" sx={cellSx}>No flights to display.</TableCell></MuiTableRow>
                            ) : (
                                flights.map((flight) => {
                                    const animationInfo = animatingStatuses[flight.id];
                                    const displayStatus = flight.currentStatus ?? calculateFlightStatus(flight.departureTime);
                                    const countryCode = cityToCountryCode[flight.destination];

                                    // Add log inside map
                                    // console.log(`[FlightTable Render Row] ID: ${flight.id}, Animating: ${!!animationInfo}`);

                                    return (
                                        <StyledTableRow key={flight.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row" sx={{ ...cellSx, fontWeight: '600' }}>{'#' + flight.flightNumber}</TableCell>
                                            <TableCell sx={cellSx}>{flight.gate}</TableCell>

                                            {/* STATUS CELL - Conditional Rendering */}
                                            <TableCell sx={cellSx}>
                                                {animationInfo ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                                        <BlinkingBox>{renderStatusChip(animationInfo.oldStatus)}</BlinkingBox>
                                                        <ArrowSpan>→</ArrowSpan>
                                                        <BlinkingBox>{renderStatusChip(animationInfo.newStatus)}</BlinkingBox>
                                                    </Box>
                                                ) : (
                                                    renderStatusChip(displayStatus)
                                                )}
                                            </TableCell>

                                            <TableCell sx={cellSx}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {countryCode && <ReactCountryFlag countryCode={countryCode} svg style={{ width: '1.5em', height: 'auto', marginRight: '8px', verticalAlign: 'middle' }} title={countryCode} />}
                                                    {flight.destination}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={cellSx}>{formatDateTime(flight.departureTime)}</TableCell>

                                            <TableCell sx={{ ...cellSx }}>
                                                <IconButton className="delete-button" aria-label="delete flight" onClick={() => handleDelete(flight.id)} disabled={deletingId === flight.id} size="small">
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
            </CardContent>
        </Card>
    );
};

export default FlightTable;