// src/components/FilterPanel.tsx
import React from 'react';
import {
    Grid, TextField, Button, Select, MenuItem,
    FormControl, InputLabel, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { FlightStatus } from '../types/flight'; // Import FlightStatus type

// Define props required by this component
interface FilterPanelProps {
    destinationFilterInput: string;
    statusFilterInput: string;
    statusOptions: FlightStatus[]; // Receive filtered options
    onDestinationChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onFilter: () => void;
    onClearFilters: () => void;
    isFilterButtonDisabled: boolean;
    isClearButtonDisabled: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    destinationFilterInput,
    statusFilterInput,
    statusOptions, // Use the passed-in options
    onDestinationChange,
    onStatusChange,
    onFilter,
    onClearFilters,
    isFilterButtonDisabled,
    isClearButtonDisabled
}) => {
    return (
        <Paper sx={{ p: 2, mb: 3 }}> {/* Added mb for spacing */}
            <Grid container spacing={2} alignItems="center">
                {/* Destination Input - Made wider (sm={6}) */}
                <Grid xs={12} sm={6} md={5}>
                    <TextField
                        fullWidth
                        label="Destination"
                        variant="outlined"
                        size="small"
                        value={destinationFilterInput}
                        onChange={(e) => onDestinationChange(e.target.value)}
                    />
                </Grid>
                {/* Status Select - Made slightly wider (sm={4} -> md={3}) */}
                <Grid xs={12} sm={4} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                            labelId="status-filter-label"
                            id="status-filter"
                            value={statusFilterInput} // Controlled by parent state
                            label="Status" // Connects to InputLabel
                            onChange={(e) => onStatusChange(e.target.value)}
                        >
                            {/* Placeholder functionality provided by empty value MenuItem */}
                            <MenuItem value="">
                                <em>All Statuses</em>
                            </MenuItem>
                            {/* Map over the filtered statusOptions prop */}
                            {statusOptions.map(status => (
                                <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                {/* Buttons - Adjusted grid size */}
                <Grid xs={12} sm={2} md={4} container spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} alignItems="center">
                    <Grid> {/* Use default Grid item behavior */}
                        <Button
                            variant="contained"
                            onClick={onFilter}
                            startIcon={<SearchIcon />}
                            size="medium"
                            disabled={isFilterButtonDisabled}
                            sx={{ height: '40px' }} // Match TextField height
                        >
                            Filter
                        </Button>
                    </Grid>
                    <Grid> {/* Use default Grid item behavior */}
                        <Button
                            variant="outlined"
                            onClick={onClearFilters}
                            startIcon={<ClearIcon />}
                            size="medium"
                            disabled={isClearButtonDisabled}
                            sx={{ height: '40px' }} // Match TextField height
                        >
                            Clear
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default FilterPanel;