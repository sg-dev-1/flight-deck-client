// src/App.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, AppBar, Toolbar, Box, Snackbar,
  Alert as MuiAlert, Grid, TextField, Button, CircularProgress,
  Select, MenuItem, FormControl, InputLabel,
  Paper
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import FlightTable from './components/FlightTable';
import AddFlightForm from './components/AddFlightForm';
import { startSignalRConnection, stopSignalRConnection, onFlightAdded, onFlightDeleted, offFlightAdded, offFlightDeleted } from './services/signalrService';
import { getFlights } from './services/apiService';
import { Flight, FlightStatus } from './types/flight';
import { calculateFlightStatus } from './utils/statusCalculator';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props, ref,) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const statusOptions: FlightStatus[] = ["Scheduled", "Boarding", "Departed", "Landed", "Delayed"];


function App() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [destinationFilterInput, setDestinationFilterInput] = useState<string>('');
  const [statusFilterInput, setStatusFilterInput] = useState<string>('');
  const [appliedDestinationFilter, setAppliedDestinationFilter] = useState<string | undefined>(undefined);
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string | undefined>(undefined);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertProps['severity']>('info');

  const handleSnackbarClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  }, []);

  const showSnackbar = useCallback((message: string, severity: AlertProps['severity'] = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // --- Data Fetching Logic ---
  const fetchFlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log(`Fetching flights with Destination=${appliedDestinationFilter}, Status=${appliedStatusFilter}`);
    try {
      const data = await getFlights(appliedDestinationFilter, appliedStatusFilter);
      setFlights(data);
    } catch (err) {
      console.error("Failed to fetch flights:", err);
      setError("Failed to load flight data. Please try again later.");
      showSnackbar("Failed to load flight data.", "error");
    } finally {
      setLoading(false);
    }
  }, [appliedDestinationFilter, appliedStatusFilter, showSnackbar]);

  // --- Effect Hook for Data Fetching (runs on mount and when filters change) ---
  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]); // Runs when fetchFlights identity changes (due to filter changes)

  // --- Effect Hook for SignalR Connection and Listeners (runs only once on mount/unmount) ---
  useEffect(() => {
    let isMounted = true;

    // Define handlers inside or make sure they don't depend on state that changes
    // Note: These handlers capture the initial state of applied filters. 
    // If a new flight arrives, the check against filters uses the filters active when the handler was defined.
    // This is generally okay because fetchFlights runs on filter change anyway.
    // A more complex approach might involve refetching within handleFlightAdded if filters are active.
    const handleFlightAdded = (newFlight: Flight) => {
      if (!isMounted) return;
      console.log("SignalR: FlightAdded received in App", newFlight);
      setFlights(currentFlights => {
        if (currentFlights.some(f => f.id === newFlight.id)) return currentFlights;

        // Check if the new flight matches the filters *at the time the handler was created*
        const destinationMatch = !appliedDestinationFilter || newFlight.destination.toLowerCase().includes(appliedDestinationFilter.toLowerCase());
        const statusMatch = !appliedStatusFilter || calculateFlightStatus(newFlight.departureTime).toLowerCase() === appliedStatusFilter.toLowerCase();

        if (destinationMatch && statusMatch) {
          const updatedFlights = [...currentFlights, newFlight];
          updatedFlights.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
          return updatedFlights;
        } else {
          console.log("New flight received but doesn't match current filters (at time of handler registration).");
          return currentFlights;
        }
      });
      showSnackbar(`Flight ${newFlight.flightNumber} Added`, 'success');
    };

    const handleFlightDeleted = (deletedId: string) => {
      if (!isMounted) return;
      console.log("SignalR: FlightDeleted received in App", deletedId);
      let deletedFlightNumber: string | undefined;
      setFlights(currentFlights => {
        const flightToRemove = currentFlights.find(flight => flight.id === deletedId);
        deletedFlightNumber = flightToRemove?.flightNumber;
        return currentFlights.filter(flight => flight.id !== deletedId);
      });
      showSnackbar(`Flight ${deletedFlightNumber ?? deletedId} Deleted`, 'info');
    };

    // Start connection and register listeners
    startSignalRConnection()
      .then(connection => {
        if (connection && isMounted) {
          console.log("SignalR Connected in App component.");
          onFlightAdded(handleFlightAdded);
          onFlightDeleted(handleFlightDeleted);
          console.log("SignalR listeners registered in App.");
        }
      })
      .catch(err => {
        console.error("SignalR Connection Error in App: ", err);
        if (isMounted) showSnackbar("Could not connect to real-time server.", "error");
      });

    // Cleanup function for this effect
    return () => {
      isMounted = false;
      offFlightAdded(handleFlightAdded);
      offFlightDeleted(handleFlightDeleted);
      stopSignalRConnection();
      console.log("SignalR listeners unregistered and connection stopped.");
    };
    // *** CORRECTED Dependency array: Runs only on mount/unmount ***
    // (showSnackbar is stable due to useCallback with empty dependency array)
  }, [showSnackbar]);

  // --- Filter Handlers ---
  const handleFilter = () => {
    setAppliedDestinationFilter(destinationFilterInput || undefined);
    setAppliedStatusFilter(statusFilterInput || undefined);
  };

  const handleClearFilters = () => {
    setDestinationFilterInput('');
    setStatusFilterInput('');
    setAppliedDestinationFilter(undefined);
    setAppliedStatusFilter(undefined);
  };


  return (
    // Using React.Fragment <> to avoid unnecessary outer div
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Flight Deck
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

        <Typography variant="h5" component="h2" gutterBottom>
          Add New Flight
        </Typography>
        <AddFlightForm showSnackbar={showSnackbar} />

        {/* --- Filter Section --- */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          Filter Flights
        </Typography>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField fullWidth label="Destination" variant="outlined" size="small" value={destinationFilterInput} onChange={(e) => setDestinationFilterInput(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select labelId="status-filter-label" id="status-filter" value={statusFilterInput} label="Status" onChange={(e) => setStatusFilterInput(e.target.value)} >
                  <MenuItem value=""><em>All Statuses</em></MenuItem>
                  {statusOptions.map(status => (<MenuItem key={status} value={status}>{status}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} container spacing={1} justifyContent="flex-end">
              <Grid item><Button variant="contained" onClick={handleFilter} startIcon={<SearchIcon />} size="medium" >Filter</Button></Grid>
              <Grid item><Button variant="outlined" onClick={handleClearFilters} startIcon={<ClearIcon />} size="medium">Clear</Button></Grid>
            </Grid>
          </Grid>
        </Paper>

        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
          Live Flight Information
        </Typography>

        {/* Render loading/error/table */}
        {loading && <Box display="flex" justifyContent="center" sx={{ my: 3 }}><CircularProgress /></Box>}
        {error && !loading && <Typography color="error" align="center">{error}</Typography>}
        {!loading && <FlightTable flights={flights} showSnackbar={showSnackbar} />}

      </Container>

      {/* Global Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage} </Alert>
      </Snackbar>
    </>
  );
}

export default App;
