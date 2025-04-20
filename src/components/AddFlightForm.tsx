// Suggested location: src/components/AddFlightForm.tsx
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form'; // Removed Controller as it wasn't used
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { AlertProps } from '@mui/material/Alert';
import { addFlight } from '../services/apiService';
import { CreateFlightRequest } from '../types/flight';

// Define props, including the snackbar callback
export interface AddFlightFormProps {
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
}

// --- Validation Schema using Zod ---
const addFlightSchema = z.object({
    flightNumber: z.string()
        .min(1, { message: "Flight number is required." })
        .max(10, { message: "Flight number cannot exceed 10 characters." }),
    destination: z.string()
        .min(1, { message: "Destination is required." })
        .max(100, { message: "Destination cannot exceed 100 characters." }),
    // Use string for datetime-local input, then refine
    departureTime: z.string()
        .min(1, { message: "Departure time is required." })
        // Ensure it parses as a valid date
        .refine(val => !isNaN(Date.parse(val)), { message: "Invalid date/time format." })
        // Ensure the parsed date is in the future
        .refine(val => {
            try {
                return new Date(val) > new Date();
            } catch {
                return false; // Invalid date string cannot be in the future
            }
        }, { message: "Departure time must be in the future." }),
    gate: z.string()
        .min(1, { message: "Gate is required." })
        .max(10, { message: "Gate cannot exceed 10 characters." }),
});

// Infer the type from the schema
type AddFlightFormData = z.infer<typeof addFlightSchema>;


const AddFlightForm: React.FC<AddFlightFormProps> = ({ showSnackbar }) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors }
    } = useForm<AddFlightFormData>({
        resolver: zodResolver(addFlightSchema),
        defaultValues: {
            flightNumber: '',
            destination: '',
            departureTime: '',
            gate: ''
        }
    });

    // --- Form Submission Handler ---
    const onSubmit: SubmitHandler<AddFlightFormData> = async (data) => {
        setIsSubmitting(true);
        console.log("Form data submitted:", data);

        let departureUtc = '';
        try {
            // Convert the local datetime string from input to UTC ISO string
            const localDate = new Date(data.departureTime);
            if (isNaN(localDate.getTime())) throw new Error("Invalid date value");
            departureUtc = localDate.toISOString();
        } catch (e) {
            console.error("Error parsing date for submission:", e);
            showSnackbar("Invalid date/time format entered.", "error");
            setError("departureTime", { type: "manual", message: "Invalid date format." });
            setIsSubmitting(false);
            return;
        }

        const requestData: CreateFlightRequest = {
            flightNumber: data.flightNumber,
            destination: data.destination,
            departureTime: departureUtc, // Use the converted UTC string
            gate: data.gate
        };

        try {
            const newFlight = await addFlight(requestData);
            showSnackbar(`Flight ${newFlight.flightNumber} added successfully!`, 'success');
            reset();
        } catch (error: any) {
            console.error("Error adding flight:", error);
            const errorMessage = error?.response?.data?.title
                || error?.message
                || "Failed to add flight.";

            if (error?.response?.data?.errors) {
                const apiErrors = error.response.data.errors;
                Object.keys(apiErrors).forEach((key) => {
                    // Match API error keys (like 'FlightNumber') to form field names (like 'flightNumber')
                    const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
                    if (fieldName in data) { // Check if it's a valid form field name
                        setError(fieldName as keyof AddFlightFormData, {
                            type: "server",
                            message: apiErrors[key]?.[0] ?? 'Server validation failed'
                        });
                    }
                });
            }

            showSnackbar(`Error: ${errorMessage}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
        >
            {/* Grid container */}
            <Grid container spacing={2}>
                {/* Grid item for Flight Number */}
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        required
                        fullWidth
                        id="flightNumber"
                        label="Flight Number"
                        {...register("flightNumber")}
                        error={!!errors.flightNumber}
                        helperText={errors.flightNumber?.message}
                        disabled={isSubmitting}
                    />
                </Grid>
                {/* Grid item for Destination */}
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        required
                        fullWidth
                        id="destination"
                        label="Destination"
                        {...register("destination")}
                        error={!!errors.destination}
                        helperText={errors.destination?.message}
                        disabled={isSubmitting}
                    />
                </Grid>
                {/* Grid item for Departure Time */}
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        required
                        fullWidth
                        id="departureTime"
                        label="Departure Time"
                        type="datetime-local"
                        InputLabelProps={{ shrink: true }}
                        {...register("departureTime")}
                        error={!!errors.departureTime}
                        helperText={errors.departureTime?.message}
                        disabled={isSubmitting}
                    />
                </Grid>
                {/* Grid item for Gate */}
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        required
                        fullWidth
                        id="gate"
                        label="Gate"
                        {...register("gate")}
                        error={!!errors.gate}
                        helperText={errors.gate?.message}
                        disabled={isSubmitting}
                    />
                </Grid>
                {/* Grid item for Button */}
                <Grid item xs={12} sx={{ textAlign: 'right' }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Flight'}
                    </Button>
                </Grid>
            </Grid> {/* End Grid container */}
        </Box>
    );
};

export default AddFlightForm;
