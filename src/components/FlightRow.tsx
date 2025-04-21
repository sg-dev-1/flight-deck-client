import React from 'react';
import styled from 'styled-components';
import {
    TableRow as MuiTableRow, TableCell, CircularProgress,
    Box, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactCountryFlag from 'react-country-flag';

import { IFlight, FlightStatus } from '../types/flight';
import { cityToCountryCode } from '../utils/constants';
import { calculateFlightStatus } from '../utils/statusCalculator';


import StatusDisplay from './StatusDisplay';
interface AnimatingStatusInfo {
    oldStatus: FlightStatus;
    newStatus: FlightStatus;
    timeoutId?: NodeJS.Timeout;
}

interface FlightRowProps {
    flight: IFlight;
    animationInfo: AnimatingStatusInfo | undefined;
    isDeleting: boolean;
    onDelete: (id: string) => void;
    formatDateTime: (dateTimeString: string) => string;
}

const StyledTableRow = styled(MuiTableRow)`
  transition: background-color 0.15s ease-in-out;
  .delete-button {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  &:hover {
    background-color: #f9f9f9;
    .delete-button {
        opacity: 1;
    }
  }
`;

const FlightRowComponent: React.FC<FlightRowProps> = ({
    flight,
    animationInfo,
    isDeleting,
    onDelete,
    formatDateTime
}) => {
    const displayStatus = flight.currentStatus ?? calculateFlightStatus(flight.departureTime);
    const countryCode = cityToCountryCode[flight.destination];
    const formattedDepartureTime = formatDateTime(flight.departureTime);
    const cellSx = { padding: '12px 16px', verticalAlign: 'middle' };

    return (
        <StyledTableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell component="th" scope="row" sx={{ ...cellSx, fontWeight: '600' }}>
                {'#' + flight.flightNumber}
            </TableCell>
            <TableCell sx={cellSx}>{flight.gate}</TableCell>
            <TableCell sx={cellSx}>
                <StatusDisplay animationInfo={animationInfo} displayStatus={displayStatus} />
            </TableCell>
            <TableCell sx={cellSx}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {countryCode && <ReactCountryFlag countryCode={countryCode} svg style={{ width: '1.5em', height: 'auto', marginRight: '8px', verticalAlign: 'middle' }} title={countryCode} />}
                    {flight.destination}
                </Box>
            </TableCell>
            <TableCell sx={cellSx}>{formattedDepartureTime}</TableCell>
            <TableCell sx={{ ...cellSx }}>
                <IconButton
                    className="delete-button"
                    aria-label="delete flight"
                    onClick={() => onDelete(flight.id)}
                    disabled={isDeleting}
                    size="small"
                >
                    {isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon fontSize="small" />}
                </IconButton>
            </TableCell>
        </StyledTableRow>
    );
};

export default React.memo(FlightRowComponent);