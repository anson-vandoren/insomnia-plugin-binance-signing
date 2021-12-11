/* eslint-disable no-prototype-builtins, new-cap */

const CryptoJS = require('crypto-js');

const binanceUrls = [
  'https://api.binance.com',
  'https://api.binance.us',
  'https://api.binance.me',
  'https://testnet.binance.vision'
];
const recvWindow = 5000;

function encodeURL(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_');
}

function computeHttpSignature(msg, key) {
  const hash = CryptoJS.HmacSHA256(msg, key);
  const hashInHex = encodeURL(CryptoJS.enc.Hex.stringify(hash));
  return hashInHex;
}

function computeSigningBase(req) {
  // Get all parameters from the request and generate a query string
  const paramObj = req.getParameters();

  var params = [];
  for (const p of paramObj) {
    params.push(`${p.name}=${p.value}`);
  }
  query_string = params.join('&');

  return query_string;
}

// A request hook will be run before sending the request to API, but after everything else is finalized
module.exports.requestHooks = [
  (context) => {
    // Validate context
    if (context === null || context === undefined) {
      console.log('Invalid context');
      return;
    }
    // Validate request
    if (
      !context.hasOwnProperty('request') ||
      context['request'] === null ||
      context['request'] === undefined ||
      context['request'].constructor.name != 'Object'
    ) {
      console.log('Invalid request');
      return;
    }
    const req = context.request;
    // Validate URL
    if (
      !req.hasOwnProperty('getUrl') ||
      req['getUrl'] == null ||
      req['getUrl'].constructor.name != 'Function' ||
      !binanceUrls.some((binanceUrl) => req.getUrl().startsWith(binanceUrl))
    ) {
      console.log('Not a Binance API URL');
      return;
    }

    // Check if a timestamp parameter is present. If so, it likely needs to be signed.
    if (!req.hasParameter('timestamp')) {
      console.log('No timestamp parameter, not signing.');
      return;
    }

    // Check for a valid api key
    const key = req.getEnvironmentVariable('api_secret');
    if (key == null) {
      console.log(
        'Could not find environment variable "api_secret". Cannot sign message'
      );
      throw new Error(
        "Message should be signed, but cannot find 'api_secret' environment variable."
      );
    }

    // Make sure there is not already a signature parameter
    if (req.hasParameter('signature')) {
      throw new Error(
        'This message should be signed, but signature parameter is already filled in!'
      );
    }

    console.log(
      'Looks like a signed Binance request. Appending recvWindow and signature parameters'
    );

    // Set the receive window
    req.setParameter('recvWindow', recvWindow);
    console.log(`Set receive window to ${recvWindow} milliseconds.`);

    // Get the parameter string
    const message = computeSigningBase(req);
    // Generate the signature
    const signature = computeHttpSignature(message, key);
    // Set the signature
    req.setParameter('signature', signature);

    console.log('Done signing');
  }
];
