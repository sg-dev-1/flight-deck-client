// src/components/AddFlightForm.tsx
import React, { useState } from 'react';
// Import Controller
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios'; // <-- Import axios
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { AlertProps } from '@mui/material/Alert';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { addFlight } from '../services/apiService';
import { ICreateFlightRequest } from '../types/flight';

export interface AddFlightFormProps {
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
}

// --- Zod Schema (remains the same) ---
const addFlightSchema = z.object({
    flightNumber: z.string().min(1, "Required").max(10, "Max 10 chars"),
    destination: z.string().min(1, "Required").max(100, "Max 100 chars"),
    departureTime: z.custom<Dayjs | null>(
        (val) => val instanceof dayjs && (val as Dayjs).isValid(),
        "Departure time is required."
    )
        .refine(val => val !== null && val.isAfter(dayjs()), {
            message: "Departure time must be in the future."
        }),
    gate: z.string().min(1, "Required").max(10, "Max 10 chars"),
});

type AddFlightFormData = z.infer<typeof addFlightSchema>;

// Define the component function
const AddFlightFormComponent: React.FC<AddFlightFormProps> = ({ showSnackbar }) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const {
        register,
        handleSubmit,
        setError, // <-- Need setError from useForm
        reset,
        control,
        formState: { errors }
    } = useForm<AddFlightFormData>({
        resolver: zodResolver(addFlightSchema),
        defaultValues: { flightNumber: '', destination: '', departureTime: null, gate: '' }
    });

    // --- Form Submission Handler ---
    const onSubmit: SubmitHandler<AddFlightFormData> = async (data) => {
        setIsSubmitting(true);

        // Basic client-side check (already present)
        if (!data.departureTime || !data.departureTime.isValid()) {
            showSnackbar("Invalid departure time selected.", "error");
            setError("departureTime", { type: "manual", message: "Invalid date." });
            setIsSubmitting(false);
            return;
        }

        const departureUtc = data.departureTime.toISOString();
        const requestData: ICreateFlightRequest = {
            flightNumber: data.flightNumber,
            destination: data.destination,
            departureTime: departureUtc,
            gate: data.gate
        };

        try {
            const newFlight = await addFlight(requestData);
            showSnackbar(`Flight ${newFlight.flightNumber} added!`, 'success');
            reset(); // Clear form on success
        } catch (error: any) {
            console.error("Error adding flight:", error);
            let userMessage = "Failed to add flight. Please try again."; // Default message
            let serverFieldErrorsSet = false; // Flag to check if we set specific field errors

            // --- Improved Error Handling ---
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    const status = error.response.status;
                    const responseData = error.response.data;
                    console.error("API Error Data:", responseData);
                    console.error("API Error Status:", status);

                    // Handle specific status codes
                    if (status === 409) { // Conflict (e.g., duplicate flight number)
                        const specificError = responseData?.errors?.FlightNumber?.[0] // Check common .NET validation format
                            || responseData?.title // Check for problem details title
                            || "Flight number might already exist.";
                        userMessage = `Conflict: ${specificError}`;
                        // Set error on the specific field if backend indicates it
                        if (responseData?.errors?.FlightNumber) {
                            setError('flightNumber', { type: 'server', message: specificError });
                            serverFieldErrorsSet = true;
                        }

                    } else if (status === 400) { // Bad Request (often validation)
                        userMessage = responseData?.title || "Invalid data submitted.";
                        if (responseData?.errors) {
                            // Attempt to set errors on specific fields based on backend response
                            const apiErrors = responseData.errors;
                            let fieldErrorText = '';
                            Object.keys(apiErrors).forEach((key) => {
                                // Attempt to map backend key (e.g., "FlightNumber") to form field name ("flightNumber")
                                const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
                                if (fieldName === 'flightNumber' || fieldName === 'destination' || fieldName === 'departureTime' || fieldName === 'gate') {
                                    const message = apiErrors[key]?.[0] ?? 'Invalid input';
                                    setError(fieldName as keyof AddFlightFormData, {
                                        type: "server",
                                        message: message
                                    });
                                    serverFieldErrorsSet = true; // Mark that we set a specific error
                                    fieldErrorText += `${key}: ${message} `; // Collect messages just in case
                                }
                            });
                            // If we set specific field errors, use a general validation message for snackbar
                            if (serverFieldErrorsSet) {
                                userMessage = "Please correct the highlighted errors.";
                            } else {
                                // If no specific fields matched, show a more generic validation error
                                userMessage = `Validation Error: ${fieldErrorText || 'Please check your input.'}`;
                            }
                        }
                    } else if (status === 401 || status === 403) {
                        userMessage = "Authorization Error: You might need to log in or lack permissions.";
                        // Optionally redirect or show login prompt
                    } else if (status >= 500) {
                        userMessage = "Server Error: Something went wrong on our end. Please try again later.";
                    } else {
                        // Handle other client errors (4xx) if necessary
                        userMessage = responseData?.title || `Client Error: ${status}`;
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    userMessage = "Network Error: Could not connect to the server.";
                    console.error("Network Error:", error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    userMessage = `Request Setup Error: ${error.message}`;
                    console.error("Axios Setup Error:", error.message);
                }
            } else {
                // Handle non-Axios errors (e.g., programming errors in the try block)
                userMessage = "An unexpected client-side error occurred.";
                console.error("Non-API Error:", error);
            }
            // --- End Improved Error Handling ---

            // Show snackbar message - only show generic message if specific field errors weren't set
            if (!serverFieldErrorsSet) {
                showSnackbar(userMessage, 'error');
            }

        } finally {
            setIsSubmitting(false);
        }
    };

    // --- JSX (remains the same) ---
    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate
            sx={{ mt: 1, mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
        >
            <Grid container spacing={2} alignItems="center">
                {/* Grid items remain the same... */}
                {/* Flight Number */}
                <Grid item xs={12} sm={6} md={3}>
                    <TextField required fullWidth id="flightNumber" label="Flight Number"
                        {...register("flightNumber")} error={!!errors.flightNumber}
                        helperText={errors.flightNumber?.message} disabled={isSubmitting} size="small" />
                </Grid>
                {/* Destination */}
                <Grid item xs={12} sm={6} md={3}>
                    <TextField required fullWidth id="destination" label="Destination"
                        {...register("destination")} error={!!errors.destination}
                        helperText={errors.destination?.message} disabled={isSubmitting} size="small" />
                </Grid>
                {/* Departure Time */}
                <Grid item xs={12} sm={6} md={3}>
                    <Controller
                        name="departureTime"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <DateTimePicker
                                label="Departure Time *"
                                // ... other DateTimePicker props ...
                                value={field.value}
                                onChange={field.onChange}
                                inputRef={field.ref}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: 'small',
                                        required: true,
                                        error: !!error,
                                        helperText: error?.message,
                                        onBlur: field.onBlur,
                                    },
                                }}
                                disablePast
                                ampm={true}
                                disabled={isSubmitting}
                            />
                        )}
                    />
                </Grid>
                {/* Gate */}
                <Grid item xs={12} sm={6} md={2}>
                    <TextField required fullWidth id="gate" label="Gate"
                        {...register("gate")} error={!!errors.gate}
                        helperText={errors.gate?.message} disabled={isSubmitting} size="small" />
                </Grid>
                {/* Submit Button */}
                <Grid item xs={12} md={1} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                    <Button type="submit" variant="contained" disabled={isSubmitting} size="medium" sx={{ height: '40px' }}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Add'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default React.memo(AddFlightFormComponent); // Keep memoized export