// src/utils/constants.ts
import { FlightStatus } from '../types/flight'; // Assuming FlightStatus is in types

export const validStatusOptions: FlightStatus[] = ["Scheduled", "Boarding", "Departed", "Landed", "Delayed"];

export const cityToCountryCode: { [key: string]: string } = {
    "London": "GB", "Paris": "FR", "New York": "US", "Tokyo": "JP",
    "Dubai": "AE", "Singapore": "SG", "Frankfurt": "DE", "Amsterdam": "NL",
    "Los Angeles": "US", "Chicago": "US", "Rome": "IT", "Madrid": "ES"
    // Add other cities as needed
};

// Add any other app-wide constants here