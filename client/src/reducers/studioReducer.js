import { ACTION_TYPES } from '../actions';

const initialState = {
    studioConfig: null,
    studioStatus: null,
    dailySchedule: null,
    firingCharges: [],
    paintingOptions: [],
    extraServices: [],
    bookingRules: [],
    loading: false,
    error: null,
    filters: {
        date: null,
        time: null,
        people: 1
    }
};

export const studioReducer = (state = initialState, action) => {
    switch (action.type) {
        // Fetch Studio Config
        case ACTION_TYPES.FETCH_STUDIO_CONFIG_REQUEST:
        case ACTION_TYPES.FETCH_STUDIO_STATUS_REQUEST:
        case ACTION_TYPES.FETCH_DAILY_SCHEDULE_REQUEST:
        case ACTION_TYPES.FETCH_FIRING_CHARGES_REQUEST:
        case ACTION_TYPES.FETCH_PAINTING_OPTIONS_REQUEST:
        case ACTION_TYPES.FETCH_EXTRA_SERVICES_REQUEST:
        case ACTION_TYPES.FETCH_BOOKING_RULES_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.FETCH_STUDIO_CONFIG_SUCCESS:
            return {
                ...state,
                loading: false,
                studioConfig: action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_STUDIO_STATUS_SUCCESS:
            return {
                ...state,
                loading: false,
                studioStatus: action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_DAILY_SCHEDULE_SUCCESS:
            return {
                ...state,
                loading: false,
                dailySchedule: action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_FIRING_CHARGES_SUCCESS:
            return {
                ...state,
                loading: false,
                firingCharges: action.payload.results || action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_PAINTING_OPTIONS_SUCCESS:
            return {
                ...state,
                loading: false,
                paintingOptions: action.payload.results || action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_EXTRA_SERVICES_SUCCESS:
            return {
                ...state,
                loading: false,
                extraServices: action.payload.results || action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_BOOKING_RULES_SUCCESS:
            return {
                ...state,
                loading: false,
                bookingRules: action.payload.results || action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_STUDIO_CONFIG_FAILURE:
        case ACTION_TYPES.FETCH_STUDIO_STATUS_FAILURE:
        case ACTION_TYPES.FETCH_DAILY_SCHEDULE_FAILURE:
        case ACTION_TYPES.FETCH_FIRING_CHARGES_FAILURE:
        case ACTION_TYPES.FETCH_PAINTING_OPTIONS_FAILURE:
        case ACTION_TYPES.FETCH_EXTRA_SERVICES_FAILURE:
        case ACTION_TYPES.FETCH_BOOKING_RULES_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Update Studio Filters
        case ACTION_TYPES.UPDATE_STUDIO_FILTERS:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.payload
                }
            };
            
        default:
            return state;
    }
};