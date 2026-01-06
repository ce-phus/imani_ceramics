import { ACTION_TYPES } from '../actions';

const initialState = {
    bookings: [],
    bookingHistory: [],
    upcomingBookings: [],
    currentBooking: null,
    loading: false,
    error: null,
    formData: {
        package: null,
        number_of_people: 1,
        booked_date: '',
        session_start: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        special_requests: ''
    },
    availabilityCheck: null
};

export const bookingReducer = (state = initialState, action) => {
    switch (action.type) {
        // Create Booking
        case ACTION_TYPES.CREATE_BOOKING_REQUEST:
        case ACTION_TYPES.QUICK_BOOKING_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.CREATE_BOOKING_SUCCESS:
        case ACTION_TYPES.QUICK_BOOKING_SUCCESS:
            return {
                ...state,
                loading: false,
                currentBooking: action.payload,
                error: null
            };
            
        case ACTION_TYPES.CREATE_BOOKING_FAILURE:
        case ACTION_TYPES.QUICK_BOOKING_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Fetch Booking
        case ACTION_TYPES.FETCH_BOOKING_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.FETCH_BOOKING_SUCCESS:
            return {
                ...state,
                loading: false,
                currentBooking: action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_BOOKING_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Fetch Booking History
        case ACTION_TYPES.FETCH_BOOKING_HISTORY_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.FETCH_BOOKING_HISTORY_SUCCESS:
            return {
                ...state,
                loading: false,
                bookingHistory: action.payload.results || action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_BOOKING_HISTORY_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Fetch Upcoming Bookings
        case ACTION_TYPES.FETCH_UPCOMING_BOOKINGS_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.FETCH_UPCOMING_BOOKINGS_SUCCESS:
            return {
                ...state,
                loading: false,
                upcomingBookings: action.payload.results || action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_UPCOMING_BOOKINGS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Reschedule Booking
        case ACTION_TYPES.RESCHEDULE_BOOKING_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.RESCHEDULE_BOOKING_SUCCESS:
            return {
                ...state,
                loading: false,
                currentBooking: action.payload.booking,
                error: null
            };
            
        case ACTION_TYPES.RESCHEDULE_BOOKING_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Cancel Booking
        case ACTION_TYPES.CANCEL_BOOKING_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.CANCEL_BOOKING_SUCCESS:
            return {
                ...state,
                loading: false,
                currentBooking: action.payload.booking,
                error: null
            };
            
        case ACTION_TYPES.CANCEL_BOOKING_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Check Availability
        case ACTION_TYPES.CHECK_AVAILABILITY_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.CHECK_AVAILABILITY_SUCCESS:
            return {
                ...state,
                loading: false,
                availabilityCheck: action.payload,
                error: null
            };
            
        case ACTION_TYPES.CHECK_AVAILABILITY_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Clear Booking Data
        case ACTION_TYPES.CLEAR_BOOKING_DATA:
            return {
                ...initialState,
                bookings: state.bookings,
                bookingHistory: state.bookingHistory,
                upcomingBookings: state.upcomingBookings
            };
            
        // Update Booking Form
        case ACTION_TYPES.UPDATE_BOOKING_FORM:
            return {
                ...state,
                formData: {
                    ...state.formData,
                    ...action.payload
                }
            };
            
        default:
            return state;
    }
};