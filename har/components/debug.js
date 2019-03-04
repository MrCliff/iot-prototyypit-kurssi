const FORCE_DEBUG = false;

function debug(message, ...optionalParams) {
    if (module.exports.isDebug || FORCE_DEBUG) {
        console.log("DEBUG: " + message, ...optionalParams);
    }
}

module.exports.d = debug;
module.exports.isDebug = false;
