// src/App.tsx
import React from 'react';
import {
  Container, Typography, AppBar, Toolbar, Box, Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';

// Components
import FlightDashboard from './components/FlightDashboard';
import ErrorBoundary from './components/ErrorBoundary'; // <-- Import ErrorBoundary

// Hooks
import { useSnackbar } from './hooks/useSnackbar';
// Constants
import { validStatusOptions } from './utils/constants';

// Alert component for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props, ref,) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function App() {
  const snackbar = useSnackbar();

  return (
    <>
      {/* --- Navigation Bar --- */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Flight Deck
          </Typography>
        </Toolbar>
      </AppBar>

      {/* --- Main Content Area --- */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>

        {/* Wrap the main dashboard content in the Error Boundary */}
        {/* If an error occurs during rendering inside FlightDashboard, */}
        {/* the ErrorBoundary will catch it and display its fallback UI. */}
        <ErrorBoundary>
          <FlightDashboard
            showSnackbar={snackbar.show}
            statusOptions={validStatusOptions}
          />
        </ErrorBoundary>

      </Container>

      {/* --- Global Snackbar Component --- */}
      {/* Kept outside the main ErrorBoundary, so Snackbar can still show errors from the boundary if needed */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={snackbar.handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={snackbar.handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;