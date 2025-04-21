import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow as MuiTableRow,
    Card, CardContent,
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import { IFlight } from '../types/flight';
import FlightRow from './FlightRow';

interface FlightTableProps {
    flights: IFlight[];
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
    deletingId: string | null;
    onDelete: (id: string) => void;
}

const formatDateTime = (dateTimeString: string): string => {
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) { return "Invalid Date"; }
};


const FlightTableComponent: React.FC<FlightTableProps> = ({
    flights,
    deletingId,
    onDelete
}) => {

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
                                flights.map((flight) => {
                                    const isAnimating = flight.isAnimating ?? false;
                                    const isDeleting = deletingId === flight.id;
                                    return (
                                        <FlightRow
                                            key={flight.id}
                                            flight={flight}
                                            isAnimating={isAnimating}
                                            isDeleting={isDeleting}
                                            onDelete={onDelete}
                                            formatDateTime={formatDateTime}
                                        />
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default React.memo(FlightTableComponent);
