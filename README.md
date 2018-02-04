# aws-endpoint

A utility for making mock servers to handle AWS requests.

If you're writing a mock for testing purposes to handle calls that would normally go to AWS, this package makes it slightly easier.

It's basically just a thin shim over [express](https://www.npmjs.com/package/express), to add CORS and parsing of the
`x-amz-target` header.

## Usage

Install:

```
yarn add -D aws-endpoint
```

Import:

```js
import { AwsEndpoint } from 'aws-endpoint';
```

Instantiate:

```js
const endpoint = new AwsEndpoint('AWSServiceOfSomeKind', {
  AnAction(request, response) {
    // handle the AWSServiceOfSomeKind.AnAction request
  },

  async AnAsyncAction(request, response) {
    // promises are supported too
  }
});
```

Start:

```js
// start on a specific port
await endpoint.start(8080);

// or let it pick a free one
const port = await endpoint.start()
```

Then make AWS requests using e.g. the AWS SDK as normal, but use the started server as the endpoint rather than the normal one.

Finally, stop the server:

```js
endpoint.stop();
```

## Notes

It's pretty basic to support a specific use case, but if there's something obvious missing for your particular needs,
I'm open to pull requests.
