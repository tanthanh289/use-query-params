"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var serialize_query_params_1 = require("serialize-query-params");
var helpers_1 = require("./helpers");
var LocationProvider_1 = require("./LocationProvider");
var memoizedQueryParser_1 = require("./memoizedQueryParser");
var shallowEqual_1 = require("./shallowEqual");
/**
 * Helper to get the latest decoded values with smart caching.
 * Abstracted into its own function to allow re-use in a functional setter (#26)
 */
function getLatestDecodedValues(location, paramConfigMap, paramConfigMapRef, parsedQueryRef, encodedValuesCacheRef, decodedValuesCacheRef) {
    // check if we have a new param config
    var hasNewParamConfigMap = !shallowEqual_1.default(paramConfigMapRef.current, paramConfigMap);
    // read in the parsed query
    var parsedQuery = memoizedQueryParser_1.sharedMemoizedQueryParser(helpers_1.getSSRSafeSearchString(location) // get the latest location object
    );
    // check if new encoded values are around (new parsed query).
    // can use triple equals since we already cache this value
    var hasNewParsedQuery = parsedQueryRef.current !== parsedQuery;
    // if nothing has changed, use existing.. so long as we have existing.
    if (!hasNewParsedQuery &&
        !hasNewParamConfigMap &&
        encodedValuesCacheRef.current !== undefined) {
        return {
            encodedValues: encodedValuesCacheRef.current,
            decodedValues: decodedValuesCacheRef.current,
        };
    }
    var encodedValuesCache = encodedValuesCacheRef.current || {};
    var decodedValuesCache = decodedValuesCacheRef.current || {};
    var encodedValues = {};
    // we have new encoded values, so let's get new decoded values.
    // recompute new values but only for those that changed
    var paramNames = Object.keys(paramConfigMap);
    var decodedValues = {};
    for (var _i = 0, paramNames_1 = paramNames; _i < paramNames_1.length; _i++) {
        var paramName = paramNames_1[_i];
        // do we have a new encoded value?
        var paramConfig = paramConfigMap[paramName];
        var hasNewEncodedValue = !shallowEqual_1.default(encodedValuesCache[paramName], parsedQuery[paramName]);
        // if we have a new encoded value, re-decode. otherwise reuse cache
        var encodedValue = void 0;
        var decodedValue = void 0;
        if (hasNewEncodedValue || encodedValuesCache[paramName] === undefined) {
            encodedValue = parsedQuery[paramName];
            decodedValue = paramConfig.decode(encodedValue);
        }
        else {
            encodedValue = encodedValuesCache[paramName];
            decodedValue = decodedValuesCache[paramName];
        }
        encodedValues[paramName] = encodedValue;
        decodedValues[paramName] = decodedValue;
    }
    // keep referential equality for decoded valus if we didn't actually change anything
    var hasNewDecodedValues = !shallowEqual_1.shallowEqualMap(decodedValuesCacheRef.current, decodedValues, paramConfigMap);
    return {
        encodedValues: encodedValues,
        decodedValues: hasNewDecodedValues
            ? decodedValues
            : decodedValuesCacheRef.current,
    };
}
/**
 * Given a query parameter configuration (mapping query param name to { encode, decode }),
 * return an object with the decoded values and a setter for updating them.
 */
exports.useQueryParams = function (paramConfigMap) {
    var _a = LocationProvider_1.useLocationContext(), location = _a.location, getLocation = _a.getLocation, setLocation = _a.setLocation;
    // read in the raw query
    var parsedQuery = memoizedQueryParser_1.sharedMemoizedQueryParser(helpers_1.getSSRSafeSearchString(location));
    // make caches
    var paramConfigMapRef = React.useRef(paramConfigMap);
    var parsedQueryRef = React.useRef(parsedQuery);
    var encodedValuesCacheRef = React.useRef(undefined); // undefined for initial check
    var decodedValuesCacheRef = React.useRef({});
    // memoize paramConfigMap to make the API nicer for consumers.
    // otherwise we'd have to useQueryParams(useMemo(() => { foo: NumberParam }, []))
    paramConfigMap = shallowEqual_1.default(paramConfigMap, paramConfigMapRef.current)
        ? paramConfigMapRef.current
        : paramConfigMap;
    // decode all the values if we have changes
    var _b = getLatestDecodedValues(location, paramConfigMap, paramConfigMapRef, parsedQueryRef, encodedValuesCacheRef, decodedValuesCacheRef), encodedValues = _b.encodedValues, decodedValues = _b.decodedValues;
    // update cached values in useEffects
    helpers_1.useUpdateRefIfShallowNew(parsedQueryRef, parsedQuery);
    helpers_1.useUpdateRefIfShallowNew(paramConfigMapRef, paramConfigMap);
    helpers_1.useUpdateRefIfShallowNew(encodedValuesCacheRef, encodedValues);
    helpers_1.useUpdateRefIfShallowNew(decodedValuesCacheRef, decodedValues, function (a, b) {
        return shallowEqual_1.shallowEqualMap(a, b, paramConfigMap);
    });
    // create a setter for updating multiple query params at once
    var setQuery = React.useCallback(function (changes, updateType) {
        var encodedChanges;
        if (typeof changes === 'function') {
            // get latest decoded value to pass as a fresh arg to the setter fn
            var latestValues = getLatestDecodedValues(getLocation(), paramConfigMap, paramConfigMapRef, parsedQueryRef, encodedValuesCacheRef, decodedValuesCacheRef).decodedValues;
            decodedValuesCacheRef.current = latestValues; // keep cache in sync
            encodedChanges = changes(latestValues);
        }
        else {
            // encode as strings for the URL
            encodedChanges = serialize_query_params_1.encodeQueryParams(paramConfigMap, changes);
        }
        // update the URL
        setLocation(encodedChanges, updateType);
    }, [paramConfigMap, setLocation, getLocation]);
    // no longer Partial
    return [decodedValues, setQuery];
};
exports.default = exports.useQueryParams;
