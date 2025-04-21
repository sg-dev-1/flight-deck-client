import React, { JSX } from 'react';
import styled from 'styled-components';
import { Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { FlightStatus } from '../types/flight';

interface StatusDisplayProps {
    displayStatus: FlightStatus;
}

const getStatusColors = (status: FlightStatus): { backgroundColor: string; color: string; } => {
    switch (status) {
        case "Scheduled": return { backgroundColor: '#e0e0e0', color: '#616161' };
        case "Boarding": return { backgroundColor: '#64b5f6', color: '#ffffff' };
        case "Departed": return { backgroundColor: '#81c784', color: '#ffffff' };
        case "Landed": return { backgroundColor: '#ba68c8', color: '#ffffff' };
        case "Delayed": return { backgroundColor: '#ffb74d', color: '#ffffff' };
        default: return { backgroundColor: '#f5f5f5', color: '#bdbdbd' };
    }
};
const getStatusIcon = (status: FlightStatus): JSX.Element | null => {
    const iconStyle = { fontSize: '1rem', marginRight: '4px', paddingRight: '2px', verticalAlign: 'middle' };
    switch (status) {
        case "Scheduled": return <AccessTimeIcon sx={iconStyle} />;
        case "Boarding": return <ConnectingAirportsIcon sx={iconStyle} />;
        case "Departed": return <FlightTakeoffIcon sx={iconStyle} />;
        case "Landed": return <FlightLandIcon sx={iconStyle} />;
        case "Delayed": return <WarningAmberIcon sx={iconStyle} />;
        default: return null;
    }
};

interface StatusChipProps {
    $flightStatus: FlightStatus;
}

const StatusChip = styled(Chip) <StatusChipProps>`
    background-color: ${props => getStatusColors(props.$flightStatus).backgroundColor};
    color: ${props => getStatusColors(props.$flightStatus).color};
    font-weight: ${props => (props.$flightStatus === 'Boarding' || props.$flightStatus === 'Delayed' ? 'bold' : 'normal')};
    transition: background-color 0.3s ease-out, color 0.3s ease-out;
    height: 28px;
    font-size: 0.8125rem;
    min-width: 90px;
    padding-left: ${props => getStatusIcon(props.$flightStatus) ? '6px' : '10px'};
    padding-right: ${props => getStatusIcon(props.$flightStatus) ? '6px' : '10px'};
    vertical-align: middle;

    & .MuiChip-icon { color: inherit; margin-left: 5px; margin-right: 2px; width: 18px; height: 18px; vertical-align: middle; }
    & .MuiChip-label { color: inherit; padding-left: ${props => getStatusIcon(props.$flightStatus) ? '0px' : '4px'}; padding-right: 8px; line-height: 1.5; display: inline-block; vertical-align: middle; }
`;


const StatusDisplayComponent: React.FC<StatusDisplayProps> = ({ displayStatus }) => {
    return (
        <StatusChip
            icon={getStatusIcon(displayStatus)}
            label={displayStatus}
            $flightStatus={displayStatus}
            size="small"
        />
    );
};

export default React.memo(StatusDisplayComponent);
