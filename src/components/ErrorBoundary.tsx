import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error: error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo: errorInfo });
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Paper sx={{ p: 3, m: { xs: 1, sm: 2, md: 3 }, textAlign: 'center', border: '1px solid', borderColor: 'error.main' }}>

                    <Typography variant="h5" color="error" gutterBottom>
                        Oops! Something Went Wrong
                    </Typography>

                    <Typography variant="body1" gutterBottom>
                        An unexpected error occurred while rendering this part of the application. Please try clicking "Try Again". If the problem continues, please contact support.
                    </Typography>

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
        return this.props.children;
    }
}

export default ErrorBoundary;