import React from 'react';
import {
  Container, Typography, AppBar, Toolbar, Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import FlightDashboard from './components/FlightDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { useSnackbar } from './hooks/useSnackbar';
import { validStatusOptions } from './utils/constants';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props, ref,) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const App = () => {
  const snackbar = useSnackbar();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Flight Deck
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <ErrorBoundary>
          <FlightDashboard
            showSnackbar={snackbar.show}
            statusOptions={validStatusOptions}
          />
        </ErrorBoundary>
      </Container>

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