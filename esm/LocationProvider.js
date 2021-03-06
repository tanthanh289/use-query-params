import * as React from 'react';
import { updateUrlQuery, createLocationWithChanges } from './updateUrlQuery';
export var LocationContext = React.createContext({
    location: {},
    getLocation: function () { return ({}); },
    setLocation: function () { },
});
export function useLocationContext() {
    var context = React.useContext(LocationContext);
    if (process.env.NODE_ENV === 'development' && context === undefined) {
        throw new Error('useQueryParams must be used within a QueryParamProvider');
    }
    return context;
}
/**
 * An internal-only context provider which provides down the most
 * recent location object and a callback to update the history.
 */
export function LocationProvider(_a) {
    var history = _a.history, location = _a.location, children = _a.children, stringifyOptions = _a.stringifyOptions;
    var locationRef = React.useRef(location);
    React.useEffect(function () {
        locationRef.current = location;
    }, [location]);
    // TODO: we can probably simplify this now that we are reading location from history
    var getLocation = React.useCallback(function () { return locationRef.current; }, [
        locationRef,
    ]);
    var setLocation = React.useCallback(function (queryReplacements, updateType) {
        // A ref is needed here to stop setLocation updating constantly (see #46)
        locationRef.current = createLocationWithChanges(queryReplacements, history == null || history.location == null
            ? locationRef.current
            : history.location, updateType, stringifyOptions);
        if (history) {
            updateUrlQuery(history, locationRef.current, updateType);
        }
    }, [history, stringifyOptions]);
    return (React.createElement(LocationContext.Provider, { value: { location: location, getLocation: getLocation, setLocation: setLocation } }, children));
}
