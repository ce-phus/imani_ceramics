import { ACTION_TYPES } from '../actions';

const initialState = {
    packages: [],
    selectedPackage: null,
    packageDetails: null,
    availability: null,
    loading: false,
    error: null,
    filters: {
        packageType: null,
        requiresWheel: null,
        minPrice: null,
        maxPrice: null
    }
};

export const packageReducer = (state = initialState, action) => {
    switch (action.type) {
        // Fetch Packages
        case ACTION_TYPES.FETCH_PACKAGES_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.FETCH_PACKAGES_SUCCESS:
            return {
                ...state,
                loading: false,
                packages: action.payload.results || action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_PACKAGES_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Fetch Package Details
        case ACTION_TYPES.FETCH_PACKAGE_DETAILS_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.FETCH_PACKAGE_DETAILS_SUCCESS:
            return {
                ...state,
                loading: false,
                packageDetails: action.payload,
                error: null
            };
            
        case ACTION_TYPES.FETCH_PACKAGE_DETAILS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Check Package Availability
        case ACTION_TYPES.CHECK_PACKAGE_AVAILABILITY_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case ACTION_TYPES.CHECK_PACKAGE_AVAILABILITY_SUCCESS:
            return {
                ...state,
                loading: false,
                availability: action.payload,
                error: null
            };
            
        case ACTION_TYPES.CHECK_PACKAGE_AVAILABILITY_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
            
        // Clear Availability Data
        case ACTION_TYPES.CLEAR_AVAILABILITY_DATA:
            return {
                ...state,
                availability: null
            };
            
        // Select Package
        case ACTION_TYPES.SELECT_PACKAGE:
            return {
                ...state,
                selectedPackage: action.payload
            };
            
        // Update Package Filters
        case ACTION_TYPES.UPDATE_PACKAGE_FILTERS:
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