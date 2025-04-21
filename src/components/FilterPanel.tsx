import React from 'react';
import {
    Grid, TextField, Button, Select, MenuItem,
    FormControl, InputLabel, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { FlightStatus } from '../types/flight';

interface FilterPanelProps {
    destinationFilterInput: string;
    statusFilterInput: string;
    statusOptions: FlightStatus[];
    onDestinationChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onFilter: () => void;
    onClearFilters: () => void;
    isFilterButtonDisabled: boolean;
    isClearButtonDisabled: boolean;
}

const FilterPanelComponent: React.FC<FilterPanelProps> = ({
    destinationFilterInput,
    statusFilterInput,
    statusOptions,
    onDestinationChange,
    onStatusChange,
    onFilter,
    onClearFilters,
    isFilterButtonDisabled,
    isClearButtonDisabled
}) => {
    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">

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

                <Grid xs={12} sm={4} md={3}>
                    <FormControl fullWidth size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                            labelId="status-filter-label"
                            id="status-filter"
                            value={statusFilterInput}
                            label="Status"
                            onChange={(e) => onStatusChange(e.target.value)}
                        >
                            {statusOptions.map(status => (
                                <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid xs={12} md={4} container spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center">
                    <Grid item>
                        <Button
                            variant="contained"
                            onClick={onFilter}
                            startIcon={<SearchIcon />}
                            size="medium"
                            disabled={isFilterButtonDisabled}
                            sx={{ height: '40px' }}
                        >
                            Filter
                        </Button>
                    </Grid>

                    <Grid item>
                        <Button
                            variant="outlined"
                            onClick={onClearFilters}
                            startIcon={<ClearIcon />}
                            size="medium"
                            disabled={isClearButtonDisabled}
                            sx={{ height: '40px' }}
                        >
                            Clear
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default React.memo(FilterPanelComponent);