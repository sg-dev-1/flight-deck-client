import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
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

const AddFlightFormComponent: React.FC<AddFlightFormProps> = ({ showSnackbar }) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const {
        register,
        handleSubmit,
        setError,
        reset,
        control,
        formState: { errors }
    } = useForm<AddFlightFormData>({
        resolver: zodResolver(addFlightSchema),
        defaultValues: { flightNumber: '', destination: '', departureTime: null, gate: '' }
    });

    const onSubmit: SubmitHandler<AddFlightFormData> = async (data) => {
        setIsSubmitting(true);

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
            reset();
        } catch (error: any) {
            console.error("Error adding flight:", error);
            let userMessage = "Failed to add flight. Please try again.";
            let serverFieldErrorsSet = false;

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    const status = error.response.status;
                    const responseData = error.response.data;
                    console.error("API Error Data:", responseData);
                    console.error("API Error Status:", status);

                    if (status === 409) {
                        const specificError = responseData?.errors?.FlightNumber?.[0]
                            || responseData?.title
                            || "Flight number might already exist.";
                        userMessage = `Conflict: ${specificError}`;

                        if (responseData?.errors?.FlightNumber) {
                            setError('flightNumber', { type: 'server', message: specificError });
                            serverFieldErrorsSet = true;
                        }

                    } else if (status === 400) {
                        userMessage = responseData?.title || "Invalid data submitted.";
                        if (responseData?.errors) {
                            const apiErrors = responseData.errors;
                            let fieldErrorText = '';
                            Object.keys(apiErrors).forEach((key) => {

                                const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
                                if (fieldName === 'flightNumber' || fieldName === 'destination' || fieldName === 'departureTime' || fieldName === 'gate') {
                                    const message = apiErrors[key]?.[0] ?? 'Invalid input';
                                    setError(fieldName as keyof AddFlightFormData, {
                                        type: "server",
                                        message: message
                                    });
                                    serverFieldErrorsSet = true;
                                    fieldErrorText += `${key}: ${message} `;
                                }
                            });

                            if (serverFieldErrorsSet) {
                                userMessage = "Please correct the highlighted errors.";
                            } else {
                                userMessage = `Validation Error: ${fieldErrorText || 'Please check your input.'}`;
                            }
                        }
                    } else if (status === 401 || status === 403) {
                        userMessage = "Authorization Error: You might need to log in or lack permissions.";
                    } else if (status >= 500) {
                        userMessage = "Server Error: Something went wrong on our end. Please try again later.";
                    } else {
                        userMessage = responseData?.title || `Client Error: ${status}`;
                    }
                } else if (error.request) {
                    userMessage = "Network Error: Could not connect to the server.";
                    console.error("Network Error:", error.request);
                } else {
                    userMessage = `Request Setup Error: ${error.message}`;
                    console.error("Axios Setup Error:", error.message);
                }
            } else {
                userMessage = "An unexpected client-side error occurred.";
                console.error("Non-API Error:", error);
            }
            if (!serverFieldErrorsSet) {
                showSnackbar(userMessage, 'error');
            }

        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate
            sx={{ mt: 1, mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
        >
            <Grid container spacing={2} alignItems="center">

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

export default React.memo(AddFlightFormComponent);