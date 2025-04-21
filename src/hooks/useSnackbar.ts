// src/hooks/useSnackbar.ts
import { useState, useCallback } from 'react';
import { AlertProps } from '@mui/material/Alert';

export function useSnackbar() {
    const [open, setOpen] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [severity, setSeverity] = useState<AlertProps['severity']>('info');

    const handleClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    }, []);

    const show = useCallback((msg: string, sev: AlertProps['severity'] = 'info') => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    }, []);

    return { open, message, severity, show, handleClose };
}