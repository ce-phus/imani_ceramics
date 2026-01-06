import { combineReducers } from 'redux';
import { packageReducer } from './packageReducer';
import { bookingReducer } from './bookingReducer';
import { studioReducer } from './studioReducer';

export const rootReducer = combineReducers({
    packages: packageReducer,
    bookings: bookingReducer,
    studio: studioReducer
});