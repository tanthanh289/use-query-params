"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serialize_query_params_1 = require("serialize-query-params");
/**
 * Creates a new location object containing the specified query changes.
 * If replaceIn or pushIn are used as the updateType, then parameters
 * not specified in queryReplacements are retained. If replace or push
 * are used, only the values in queryReplacements will be available.
 * The default is pushIn.
 */
function createLocationWithChanges(queryReplacements, location, updateType, stringifyOptions) {
    if (updateType === void 0) { updateType = 'replaceIn'; }
    switch (updateType) {
        case 'replace':
        case 'push':
            return serialize_query_params_1.updateLocation(queryReplacements, location, stringifyOptions);
        case 'replaceIn':
        case 'pushIn':
        default:
            return serialize_query_params_1.updateInLocation(queryReplacements, location, stringifyOptions);
    }
}
exports.createLocationWithChanges = createLocationWithChanges;
/**
 * Updates the URL to the new location.
 */
function updateUrlQuery(history, location, updateType) {
    if (updateType === void 0) { updateType = 'replaceIn'; }
    switch (updateType) {
        case 'pushIn':
        case 'push':
            history.push(location);
            break;
        case 'replaceIn':
        case 'replace':
        default:
            history.replace(location);
            break;
    }
}
exports.updateUrlQuery = updateUrlQuery;
