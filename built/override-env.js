"use strict";

// We must do this since prop-types only really does anything if NODE_ENV isn't production
// As to why this is an import, check https://stackoverflow.com/questions/51729775/node-programmatically-set-process-environment-variables-not-available-to-importe
process.env.NODE_ENV = undefined;