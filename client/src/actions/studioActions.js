import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Fetch studio configuration
export const fetchStudioConfig = () => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_STUDIO_CONFIG_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/studio-config/`);
        console.log('Fetched studio config:', data);
        dispatch({ type: 'FETCH_STUDIO_CONFIG_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_STUDIO_CONFIG_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Fetch studio status
export const fetchStudioStatus = () => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_STUDIO_STATUS_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/studio-status/`);
        dispatch({ type: 'FETCH_STUDIO_STATUS_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_STUDIO_STATUS_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Fetch daily schedule
export const fetchDailySchedule = (date) => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_DAILY_SCHEDULE_REQUEST' });

        const { data } = await axios.get(
            `${API_URL}/api/booking/daily-schedule/`,
            { params: { date } }
        );
        dispatch({ type: 'FETCH_DAILY_SCHEDULE_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_DAILY_SCHEDULE_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Fetch firing charges
export const fetchFiringCharges = () => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_FIRING_CHARGES_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/firing-charges/`);
        dispatch({ type: 'FETCH_FIRING_CHARGES_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_FIRING_CHARGES_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Fetch painting options
export const fetchPaintingOptions = () => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_PAINTING_OPTIONS_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/painting-options/`);
        dispatch({ type: 'FETCH_PAINTING_OPTIONS_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_PAINTING_OPTIONS_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Fetch extra services
export const fetchExtraServices = () => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_EXTRA_SERVICES_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/extra-services/`);
        dispatch({ type: 'FETCH_EXTRA_SERVICES_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_EXTRA_SERVICES_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Fetch booking rules
export const fetchBookingRules = () => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_BOOKING_RULES_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/booking-rules/`);
        dispatch({ type: 'FETCH_BOOKING_RULES_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_BOOKING_RULES_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Update studio filters
export const updateStudioFilters = (filters) => (dispatch) => {
    dispatch({ type: 'UPDATE_STUDIO_FILTERS', payload: filters });
}