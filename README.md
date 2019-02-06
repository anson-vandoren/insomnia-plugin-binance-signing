###Binance request signing for Insomnia

All private Binance API calls require adding a timestamp and then signing the request (HMAC-SHA256) prior to submitting. Insomnia doesn't have (as far as I can find) a built-in way to do this.

This plugin (when installed) checks all outgoing requests to see if:

- The request has valid context and URL
- The request is going to [https://api.binance.com](https://api.binance.com)
- The request has a `timestamp` parameter already
- An Insomnia environment variable `api_secret` exists
- The request does not already have a `signature` parameter

If the above conditions are met, this plugin:

- Adds a `recvWindow` parameter per [Binance recommendation](https://github.com/binance-exchange/binance-official-api-docs/blob/master/rest-api.md#timing-security). The default value is 5000msec (again, per official recommendations). *A future version may allow this to be an environment variable instead.*
- Computes the HMAC signature based on the query string of the outgoing request and converts to hex.
- Appends the `signature` parameter with the computed digest.
