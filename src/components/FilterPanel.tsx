// src/components/FilterPanel.tsx
import React from 'react'; // Import React
import {
    Grid, TextField, Button, Select, MenuItem,
    FormControl, InputLabel, Paper // Removed SelectChangeEvent as it's not used in your version
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { FlightStatus } from '../types/flight'; // Import FlightStatus type

// Define props required by this component (Your interface is correct)
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

// Define the component function using your exact code
const FilterPanelComponent: React.FC<FilterPanelProps> = ({
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
                {/* Your Grid structure */}
                <Grid xs={12} sm={6} md={5}>
                    <TextField
                        fullWidth
                        label="Destination"
                        variant="outlined"
                        size="small"
                        value={destinationFilterInput}
                        onChange={(e) => onDestinationChange(e.target.value)}
                    // Removed the optional disable here to match your code
                    />
                </Grid>
                {/* Status Select - Made slightly wider (sm={4} -> md={3}) */}
                {/* Your Grid structure */}
                <Grid xs={12} sm={4} md={3}>
                    {/* Your sx prop */}
                    <FormControl fullWidth size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                            labelId="status-filter-label"
                            id="status-filter"
                            value={statusFilterInput} // Controlled by parent state
                            label="Status" // Connects to InputLabel
                            onChange={(e) => onStatusChange(e.target.value)}
                        // Removed the optional disable here
                        >
                            {/* Map over the filtered statusOptions prop - YOURS DID NOT HAVE "All Statuses" */}
                            {statusOptions.map(status => (
                                <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                {/* Buttons - Adjusted grid size */}
                {/* Your Grid structure */}
                <Grid xs={12} md={4} container spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center">
                    {/* Your Grid item structure */}
                    <Grid item> {/* Changed back to item-less Grid to match yours */}
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
                    {/* Your Grid item structure */}
                    <Grid item> {/* Changed back to item-less Grid */}
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

// Wrap the export in React.memo
export default React.memo(FilterPanelComponent);