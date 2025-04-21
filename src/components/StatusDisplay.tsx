// src/components/StatusDisplay.tsx
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Box, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { FlightStatus } from '../types/flight'; // Assuming type location

// Define Props Interface directly referencing the type from FlightTable
interface AnimatingStatusInfo {
    oldStatus: FlightStatus;
    newStatus: FlightStatus;
    timeoutId?: NodeJS.Timeout; // timeoutId might not be needed here
}

interface StatusDisplayProps {
    animationInfo: AnimatingStatusInfo | undefined;
    displayStatus: FlightStatus;
}

// --- Styled Components needed for StatusDisplay ---

// Animation for status change indication
const simpleBlink = keyframes`
  0%, 100% { background-color: transparent; }
  50% { background-color: yellow; } /* Or use theme palette: theme.palette.warning.light */
`;

// Box that applies the blinking animation
const BlinkingBox = styled(Box)`
  display: inline-block;
  animation: ${simpleBlink} 1.5s linear infinite;
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
`;

// Arrow symbol between old and new status during animation
const ArrowSpan = styled.span`
  margin: 0 8px;
  font-weight: bold;
  vertical-align: middle;
`;

// Helper functions for StatusChip styling (kept internal to this component's scope)
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

// Interface for StatusChip props
interface StatusChipProps { $flightStatus: FlightStatus; }

// Status Chip component definition
const StatusChip = styled(Chip) <StatusChipProps>`
    background-color: ${props => getStatusColors(props.$flightStatus).backgroundColor};
    color: ${props => getStatusColors(props.$flightStatus).color};
    font-weight: ${props => (props.$flightStatus === 'Boarding' || props.$flightStatus === 'Delayed' ? 'bold' : 'normal')};
    transition: background-color 0.5s ease-in-out, color 0.5s ease-in-out;
    height: 28px;
    font-size: 0.8125rem;
    min-width: 90px;
    padding-left: ${props => getStatusIcon(props.$flightStatus) ? '6px' : '10px'};
    padding-right: ${props => getStatusIcon(props.$flightStatus) ? '6px' : '10px'};
    vertical-align: middle;

    & .MuiChip-icon { color: inherit; margin-left: 5px; margin-right: 2px; width: 18px; height: 18px; vertical-align: middle; }
    & .MuiChip-label { color: inherit; padding-left: ${props => getStatusIcon(props.$flightStatus) ? '0px' : '4px'}; padding-right: 8px; line-height: 1.5; display: inline-block; vertical-align: middle; }
`;


// --- StatusDisplay Component ---
const StatusDisplayComponent: React.FC<StatusDisplayProps> = ({ animationInfo, displayStatus }) => {
    // Helper to render a single chip
    const renderChip = (status: FlightStatus) => (
        <StatusChip icon={getStatusIcon(status)} label={status} $flightStatus={status} size="small" />
    );

    if (animationInfo) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <BlinkingBox>{renderChip(animationInfo.oldStatus)}</BlinkingBox>
                <ArrowSpan>→</ArrowSpan>
                <BlinkingBox>{renderChip(animationInfo.newStatus)}</BlinkingBox>
            </Box>
        );
    } else {
        return renderChip(displayStatus);
    }
};

// Optional: Memoize if needed, though likely simple enough not to require it unless props change unnecessarily often
export default React.memo(StatusDisplayComponent);
// export default StatusDisplayComponent; // Without memo