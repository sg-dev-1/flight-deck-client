import axios from 'axios';
import { IFlight, ICreateFlightRequest } from '../types/flight';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    console.error("Error: VITE_API_BASE_URL environment variable is not set.");
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getFlights = async (destination?: string, status?: string): Promise<IFlight[]> => {
    try {
        const params: { destination?: string; status?: string } = {};
        if (destination) {
            params.destination = destination;
        }
        if (status) {
            params.status = status;
        }
        const response = await apiClient.get<IFlight[]>('/flights', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching flights:", error);
        throw error;
    }
};

export const addFlight = async (flightData: ICreateFlightRequest): Promise<IFlight> => {
    try {
        const response = await apiClient.post<IFlight>('/flights', flightData);
        return response.data;
    } catch (error) {
        console.error("Error adding flight:", error);
        if (axios.isAxiosError(error) && error.response) {
            console.error("Validation/API Error:", error.response.data);
        }
        throw error;
    }
};

export const deleteFlight = async (id: string): Promise<void> => {
    try {
        await apiClient.delete(`/flights/${id}`);
    } catch (error) {
        console.error(`Error deleting flight with ID ${id}:`, error);
        throw error;
    }
};

export const getFlightById = async (id: string): Promise<IFlight | null> => {
    try {
        const response = await apiClient.get<IFlight>(`/flights/${id}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        console.error(`Error fetching flight with ID ${id}:`, error);
        throw error;
    }
};