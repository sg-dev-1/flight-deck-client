// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material'; // Using MUI for fallback UI

interface Props {
    children?: ReactNode; // Make children optional so fallback can be used alone if needed
    fallback?: ReactNode; // Optional custom fallback UI prop
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    // Initialize state
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    // This lifecycle method is invoked after an error has been thrown by a descendant component.
    // It receives the error that was thrown as a parameter and should return a value to update state.
    public static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error: error };
    }

    // This lifecycle method is invoked after an error has been thrown by a descendant component.
    // It receives two parameters: the error that was thrown, and an object with a componentStack key
    // containing information about which component threw the error.
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo: errorInfo });
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        // --- Optional: Send error details to a logging service ---
        // Example: logErrorToService(error, errorInfo);
        // Replace with your actual error logging service call if you have one
        // e.g., Sentry.captureException(error, { extra: { errorInfo } });
    }

    // Method to attempt resetting the error state
    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        // Note: This only resets the boundary's state.
        // It won't fix the underlying cause of the error in the child component.
        // A hard refresh might be needed if the error state is persistent in children.
        // You could optionally trigger a refresh: window.location.reload();
        // Or trigger a specific state reset function passed down via context if needed.
    };

    public render() {
        if (this.state.hasError) {
            // Render custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Render default fallback UI
            return (
                <Paper sx={{ p: 3, m: { xs: 1, sm: 2, md: 3 }, textAlign: 'center', border: '1px solid', borderColor: 'error.main' }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        Oops! Something Went Wrong
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        An unexpected error occurred while rendering this part of the application. Please try clicking "Try Again". If the problem continues, please contact support.
                    </Typography>
                    {/* Display more details during development */}
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <Box sx={{ mt: 2, textAlign: 'left', maxHeight: '200px', overflowY: 'auto', background: '#fdecea', p: 1, borderRadius: 1 }}>
                            <Typography variant="subtitle2" component="div">Error Details (Dev Mode):</Typography>
                            <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {this.state.error.message}
                            </Typography>
                            {this.state.errorInfo && (
                                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', mt: 1 }}>
                                    {this.state.errorInfo.componentStack}
                                </Typography>
                            )}
                        </Box>
                    )}
                    <Button variant="contained" onClick={this.handleReset} sx={{ mt: 2 }}>
                        Try Again
                    </Button>
                </Paper>
            );
        }

        // If no error, render children normally
        return this.props.children;
    }
}

export default ErrorBoundary;