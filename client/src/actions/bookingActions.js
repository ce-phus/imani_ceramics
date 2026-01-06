import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create new booking
export const createBooking = (bookingData) => async (dispatch) => {
    try {
        dispatch({ type: 'CREATE_BOOKING_REQUEST' });

        const { data } = await axios.post(
            `${API_URL}/api/booking/bookings/`,
            bookingData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        dispatch({ type: 'CREATE_BOOKING_SUCCESS', payload: data });
        return data;
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        dispatch({ type: 'CREATE_BOOKING_FAILURE', payload: errorMessage });
        throw errorMessage;
    }
}

// Quick booking
export const quickBooking = (bookingData) => async (dispatch) => {
    try {
        dispatch({ type: 'QUICK_BOOKING_REQUEST' });

        const { data } = await axios.post(
            `${API_URL}/api/booking/quick-booking/`,
            bookingData
        );
        dispatch({ type: 'QUICK_BOOKING_SUCCESS', payload: data });
        return data;
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        dispatch({ type: 'QUICK_BOOKING_FAILURE', payload: errorMessage });
        throw errorMessage;
    }
}

// Fetch booking by ID
export const fetchBooking = (id) => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_BOOKING_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/bookings/${id}/`);
        dispatch({ type: 'FETCH_BOOKING_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_BOOKING_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Fetch booking history by phone
export const fetchBookingHistory = (phone) => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_BOOKING_HISTORY_REQUEST' });

        const { data } = await axios.get(
            `${API_URL}/api/booking/bookings/history/`,
            { params: { phone } }
        );
        dispatch({ type: 'FETCH_BOOKING_HISTORY_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_BOOKING_HISTORY_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Reschedule booking
export const rescheduleBooking = (bookingId, newDate, newTime) => async (dispatch) => {
    try {
        dispatch({ type: 'RESCHEDULE_BOOKING_REQUEST' });

        const { data } = await axios.post(
            `${API_URL}/api/booking/bookings/${bookingId}/reschedule/`,
            { new_date: newDate, new_time: newTime }
        );
        dispatch({ type: 'RESCHEDULE_BOOKING_SUCCESS', payload: data });
        return data;
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        dispatch({ type: 'RESCHEDULE_BOOKING_FAILURE', payload: errorMessage });
        throw errorMessage;
    }
}

// Cancel booking
export const cancelBooking = (bookingId, reason = '') => async (dispatch) => {
    try {
        dispatch({ type: 'CANCEL_BOOKING_REQUEST' });

        const { data } = await axios.post(
            `${API_URL}/api/booking/bookings/${bookingId}/cancel/`,
            { reason }
        );
        dispatch({ type: 'CANCEL_BOOKING_SUCCESS', payload: data });
        return data;
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        dispatch({ type: 'CANCEL_BOOKING_FAILURE', payload: errorMessage });
        throw errorMessage;
    }
}

// Check availability for specific time
export const checkAvailability = (date, time, packageId, people = 1) => async (dispatch) => {
    try {
        dispatch({ type: 'CHECK_AVAILABILITY_REQUEST' });

        const { data } = await axios.get(
            `${API_URL}/api/booking/check-availability/`,
            { params: { date, time, package: packageId, people } }
        );
        dispatch({ type: 'CHECK_AVAILABILITY_SUCCESS', payload: data });
        return data;
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        dispatch({ type: 'CHECK_AVAILABILITY_FAILURE', payload: errorMessage });
        throw errorMessage;
    }
}

// Fetch upcoming bookings
export const fetchUpcomingBookings = () => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_UPCOMING_BOOKINGS_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/bookings/upcoming/`);
        dispatch({ type: 'FETCH_UPCOMING_BOOKINGS_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_UPCOMING_BOOKINGS_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Clear booking data
export const clearBookingData = () => (dispatch) => {
    dispatch({ type: 'CLEAR_BOOKING_DATA' });
}

// Update booking form data
export const updateBookingForm = (formData) => (dispatch) => {
    dispatch({ type: 'UPDATE_BOOKING_FORM', payload: formData });
}