// src/components/AddFlightForm.tsx
import React, { useState } from 'react';
// Import Controller
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs, { Dayjs } from 'dayjs'; // Import dayjs and Dayjs type
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid'; // Use MUI Grid v2 syntax
import { AlertProps } from '@mui/material/Alert';
// Import DateTimePicker
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { addFlight } from '../services/apiService';
import { ICreateFlightRequest } from '../types/flight';

export interface AddFlightFormProps {
    showSnackbar: (message: string, severity?: AlertProps['severity']) => void;
}

// --- Updated Validation Schema ---
const addFlightSchema = z.object({
    flightNumber: z.string().min(1, "Required").max(10, "Max 10 chars"),
    destination: z.string().min(1, "Required").max(100, "Max 100 chars"),
    // Use z.custom or z.instanceof for Dayjs object, ensure it's not null
    departureTime: z.custom<Dayjs | null>(
        (val) => val instanceof dayjs && (val as Dayjs).isValid(), // Check if it's a valid Dayjs object
        "Departure time is required." // Error if null or invalid
    )
        .refine(val => val !== null && val.isAfter(dayjs()), { // Check if date is in the future
            message: "Departure time must be in the future."
        }),
    gate: z.string().min(1, "Required").max(10, "Max 10 chars"),
});

// Infer the type - departureTime is now Dayjs | null
type AddFlightFormData = z.infer<typeof addFlightSchema>;


const AddFlightForm: React.FC<AddFlightFormProps> = ({ showSnackbar }) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const {
        register,
        handleSubmit,
        setError,
        reset,
        control, // Get control object from useForm
        formState: { errors }
    } = useForm<AddFlightFormData>({
        resolver: zodResolver(addFlightSchema),
        // Default departureTime to null for the picker
        defaultValues: { flightNumber: '', destination: '', departureTime: null, gate: '' }
    });

    // --- Form Submission Handler ---
    const onSubmit: SubmitHandler<AddFlightFormData> = async (data) => {
        setIsSubmitting(true);
        // Ensure departureTime is a valid Dayjs object before formatting
        if (!data.departureTime || !data.departureTime.isValid()) {
            showSnackbar("Invalid departure time selected.", "error");
            setError("departureTime", { type: "manual", message: "Invalid date." });
            setIsSubmitting(false);
            return;
        }

        // Convert valid Dayjs object to UTC ISO string for the API
        const departureUtc = data.departureTime.toISOString();

        const requestData: ICreateFlightRequest = {
            flightNumber: data.flightNumber,
            destination: data.destination,
            departureTime: departureUtc, // Send UTC ISO string
            gate: data.gate
        };

        try {
            const newFlight = await addFlight(requestData);
            showSnackbar(`Flight ${newFlight.flightNumber} added!`, 'success');
            reset(); // Clear form on success
        } catch (error: any) {
            console.error("Error adding flight:", error);
            const errorMessage = error?.response?.data?.title || error?.message || "Failed to add flight.";

            if (error?.response?.data?.errors) {
                const apiErrors = error.response.data.errors;
                Object.keys(apiErrors).forEach((key) => {
                    const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
                    // Ensure the fieldName is one of the keys in AddFlightFormData
                    if (fieldName === 'flightNumber' || fieldName === 'destination' || fieldName === 'departureTime' || fieldName === 'gate') {
                        setError(fieldName, {
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
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate
            sx={{ mt: 1, mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
        >
            {/* Using Grid v2 syntax */}
            <Grid container spacing={2} alignItems="center">
                {/* Flight Number */}
                <Grid xs={12} sm={6} md={3}>
                    <TextField required fullWidth id="flightNumber" label="Flight Number"
                        {...register("flightNumber")} error={!!errors.flightNumber}
                        helperText={errors.flightNumber?.message} disabled={isSubmitting} size="small" />
                </Grid>
                {/* Destination */}
                <Grid xs={12} sm={6} md={3}>
                    <TextField required fullWidth id="destination" label="Destination"
                        {...register("destination")} error={!!errors.destination}
                        helperText={errors.destination?.message} disabled={isSubmitting} size="small" />
                </Grid>

                {/* --- Departure Time using Controller & DateTimePicker --- */}
                <Grid xs={12} sm={6} md={3}>
                    <Controller
                        name="departureTime"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <DateTimePicker
                                label="Departure Time *" // Indicate required
                                // Pass field props
                                value={field.value} // Controlled value (Dayjs | null)
                                onChange={field.onChange} // RHF's onChange handler
                                inputRef={field.ref} // Pass ref
                                // Configure appearance and error display using slotProps
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: 'small',
                                        required: true,
                                        error: !!error,
                                        helperText: error?.message,
                                        onBlur: field.onBlur, // Ensure RHF knows about interaction
                                    },
                                }}
                                disablePast // Prevent selecting past dates/times
                                ampm={true} // Use AM/PM format
                                disabled={isSubmitting}
                            />
                        )}
                    />
                </Grid>
                {/* --- End Departure Time --- */}

                {/* Gate */}
                <Grid xs={12} sm={6} md={2}>
                    <TextField required fullWidth id="gate" label="Gate"
                        {...register("gate")} error={!!errors.gate}
                        helperText={errors.gate?.message} disabled={isSubmitting} size="small" />
                </Grid>
                {/* Submit Button */}
                <Grid xs={12} md={1} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                    <Button type="submit" variant="contained" disabled={isSubmitting} size="medium" sx={{ height: '40px' }}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Add'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AddFlightForm;