import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Fetch all packages
export const fetchPackages = () => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_PACKAGES_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/packages/`);
        dispatch({ type: 'FETCH_PACKAGES_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_PACKAGES_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Fetch single package details
export const fetchPackageDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: 'FETCH_PACKAGE_DETAILS_REQUEST' });

        const { data } = await axios.get(`${API_URL}/api/booking/packages/${id}/`);
        dispatch({ type: 'FETCH_PACKAGE_DETAILS_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'FETCH_PACKAGE_DETAILS_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Check package availability slots
export const checkPackageAvailability = (packageId, date, people = 1) => async (dispatch) => {
    try {
        dispatch({ type: 'CHECK_PACKAGE_AVAILABILITY_REQUEST' });

        const { data } = await axios.get(
            `${API_URL}/api/booking/packages/${packageId}/slots/`,
            { params: { date, people } }
        );
        dispatch({ type: 'CHECK_PACKAGE_AVAILABILITY_SUCCESS', payload: data });
    } catch (error) {
        dispatch({ 
            type: 'CHECK_PACKAGE_AVAILABILITY_FAILURE', 
            payload: error.response?.data || error.message 
        });
    }
}

// Clear availability data
export const clearAvailabilityData = () => (dispatch) => {
    dispatch({ type: 'CLEAR_AVAILABILITY_DATA' });
}

// Select a package
export const selectPackage = (packageId) => (dispatch) => {
    dispatch({ type: 'SELECT_PACKAGE', payload: packageId });
}

// Update package filters
export const updatePackageFilters = (filters) => (dispatch) => {
    dispatch({ type: 'UPDATE_PACKAGE_FILTERS', payload: filters });
}