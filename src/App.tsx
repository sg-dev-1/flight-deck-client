// src/App.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Container, Typography, AppBar, Toolbar, Box, Snackbar,
  Alert as MuiAlert, Grid, TextField, Button, CircularProgress,
  Select, MenuItem, FormControl, InputLabel,
  Paper
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// Components
import FlightTable from './components/FlightTable';
import AddFlightForm from './components/AddFlightForm';
// Hooks
import { useSnackbar } from './hooks/useSnackbar';
import { useFlightsData } from './hooks/useFlightsData';
// Services & Types
import {
  startSignalRConnection, stopSignalRConnection,
  onFlightAdded, offFlightAdded,
  onFlightDeleted, offFlightDeleted,
  onFlightStatusChanged, offFlightStatusChanged
} from './services/signalrService';
import { IFlight, FlightStatus } from './types/flight';
import { calculateFlightStatus } from './utils/statusCalculator';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props, ref,) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const statusOptions: FlightStatus[] = ["Scheduled", "Boarding", "Departed", "Landed", "Delayed", "Unknown"];

function App() {
  // Filter State
  const [destinationFilterInput, setDestinationFilterInput] = useState<string>('');
  const [statusFilterInput, setStatusFilterInput] = useState<string>('');
  const [appliedDestinationFilter, setAppliedDestinationFilter] = useState<string | undefined>(undefined);
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string | undefined>(undefined);

  // Custom Hooks
  const snackbar = useSnackbar();
  // Pass applied string filters to the hook
  const { flights, loading, error, setFlights, refetchFlights } = useFlightsData(appliedDestinationFilter, appliedStatusFilter);

  // Show fetch error in snackbar
  useEffect(() => {
    if (error) {
      snackbar.show(error, "error");
    }
  }, [error, snackbar]); // snackbar includes stable show function

  // --- SignalR Effect ---
  useEffect(() => {
    let isMounted = true;

    // Handler for newly added flights
    const handleFlightAdded = (newFlight: IFlight) => {
      if (!isMounted) return;
      console.log("SignalR: FlightAdded received in App", newFlight);
      // Important: Calculate and add initial status when flight is added via SignalR
      const initialStatus = calculateFlightStatus(newFlight.departureTime);
      const flightWithStatus = { ...newFlight, currentStatus: initialStatus };

      setFlights(currentFlights => {
        if (currentFlights.some(f => f.id === flightWithStatus.id)) return currentFlights;
        const updatedFlights = [...currentFlights, flightWithStatus];
        updatedFlights.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
        return updatedFlights;
      });
      snackbar.show(`Flight ${flightWithStatus.flightNumber} Added`, 'success');
      // Note: Animation state is handled within FlightTable based on prop changes now
    };

    // Handler for deleted flights
    const handleFlightDeleted = (deletedFlight: IFlight) => {
      if (!isMounted) return;
      console.log("SignalR: FlightDeleted received in App", deletedFlight);
      setFlights(currentFlights => currentFlights.filter(flight => flight.id !== deletedFlight.id));
      snackbar.show(`Flight ${deletedFlight.flightNumber} Deleted`, 'info');
    };

    // Handler for status updates pushed from backend
    const handleFlightStatusChanged = (flightId: string, newStatus: FlightStatus) => {
      if (!isMounted) return;
      console.log(`SignalR: FlightStatusChanged received in App: ${flightId} -> ${newStatus}`);
      setFlights(currentFlights =>
        currentFlights.map(flight =>
          flight.id === flightId
            // Update the status field; FlightTable's effect will detect this change
            ? { ...flight, currentStatus: newStatus }
            : flight
        )
      );
    };

    // --- Connect and Register Listeners ---
    startSignalRConnection()
      .then(connection => {
        if (connection && isMounted) {
          console.log("SignalR Connected in App component.");
          onFlightAdded(handleFlightAdded);
          onFlightDeleted(handleFlightDeleted);
          onFlightStatusChanged(handleFlightStatusChanged); // Register status listener
          console.log("SignalR listeners registered (Add, Delete, StatusChange).");
        }
      })
      .catch(err => {
        console.error("SignalR Connection Error in App: ", err);
        if (isMounted) snackbar.show("Could not connect to real-time server.", "error");
      });

    // --- Cleanup ---
    return () => {
      isMounted = false;
      offFlightAdded(handleFlightAdded);
      offFlightDeleted(handleFlightDeleted);
      offFlightStatusChanged(handleFlightStatusChanged); // Unregister status listener
      stopSignalRConnection();
      console.log("SignalR listeners unregistered and connection stopped.");
    };
  }, [setFlights, snackbar.show]); // Dependencies

  // --- Filter Handlers ---
  const handleFilter = () => {
    const newDest = destinationFilterInput.trim() || undefined;
    const newStatus = statusFilterInput || undefined;
    setAppliedDestinationFilter(newDest);
    setAppliedStatusFilter(newStatus);
  };

  const handleClearFilters = () => {
    setDestinationFilterInput('');
    setStatusFilterInput('');
    setAppliedDestinationFilter(undefined);
    setAppliedStatusFilter(undefined);
  };

  // --- Calculate button disabled states ---
  const isFilterApplied = appliedDestinationFilter !== undefined || appliedStatusFilter !== undefined;
  const isFilterButtonDisabled =
    (destinationFilterInput.trim() || undefined) === appliedDestinationFilter &&
    (statusFilterInput || undefined) === appliedStatusFilter;
  const isClearButtonDisabled = !isFilterApplied;


  return (
    <>
      <AppBar position="static">
        <Toolbar><Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Flight Deck</Typography></Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

        <Typography variant="h5" component="h2" gutterBottom>Add New Flight</Typography>
        <AddFlightForm showSnackbar={snackbar.show} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>Filter Flights</Typography>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Updated Grid syntax */}
            <Grid xs={12} sm={5}><TextField fullWidth label="Destination" variant="outlined" size="small" value={destinationFilterInput} onChange={(e) => setDestinationFilterInput(e.target.value)} /></Grid>
            <Grid xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select labelId="status-filter-label" id="status-filter" value={statusFilterInput} label="Status" onChange={(e) => setStatusFilterInput(e.target.value)} >
                  <MenuItem value=""><em>All Statuses</em></MenuItem>
                  {statusOptions.map(status => (<MenuItem key={status} value={status}>{status}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={3} container spacing={1} justifyContent="flex-end">
              <Grid><Button variant="contained" onClick={handleFilter} startIcon={<SearchIcon />} size="medium" disabled={isFilterButtonDisabled}>Filter</Button></Grid>
              <Grid><Button variant="outlined" onClick={handleClearFilters} startIcon={<ClearIcon />} size="medium" disabled={isClearButtonDisabled}>Clear</Button></Grid>
            </Grid>
          </Grid>
        </Paper>

        {isFilterApplied && (<Typography variant="caption" display="block" sx={{ mb: 2 }}>Applied Filters: {appliedDestinationFilter && ` Destination="${appliedDestinationFilter}"`} {appliedStatusFilter && ` Status="${appliedStatusFilter}"`}</Typography>)}

        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>Live Flight Information</Typography>

        {loading && <Box display="flex" justifyContent="center" sx={{ my: 3 }}><CircularProgress /></Box>}
        {error && !loading && <Typography color="error" align="center">{error}</Typography>}
        {/* Remove recentlyUpdatedIds prop - animation state is internal to FlightTable now */}
        {!loading && <FlightTable flights={flights} showSnackbar={snackbar.show} />}

      </Container>

      {/* Global Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={snackbar.handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={snackbar.handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}

export default App;