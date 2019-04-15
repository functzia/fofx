# How to write plugins for `fofx`

Let's write an awesome plugin. Our plugin will have both input and output capabilities, and is really awesome. It stands to reason we'll call our new plugin `fofx-awwesome` (**a plugin is a simple node module**).

Our plugin's input function will trigger every X seconds. If the nano's execution was not succefull, we'll log the incident.

Our plugin's output function will log the result with a log level specified by the plugin's main parameters.

So far, this is how the `fofx.plugins` section of a user of our plugin should look:

```json
[
  {
    "name": "fofx-awesome",
    "params": {
      "loglevel": "debug"
    }
  }
]
```

And this is a prospective `fofx.nanos` of a nano that relies on our plugin:

```json
{
  "input": {
    "type": "awesome",
    "intervl": 10
  },
  "output": {
    "type": "awesome"
  }
}
```

Now it's time to implement our plugin!

```js
// index.js

export default async function({ loglevel = 'info' }, log) {
  return {
    // this corresponds to the "type" key in the nano.json
    type: 'awesome',
    input({ interval }, execute) {
      setInterval(async () => {
        // execution always resolves.
        // if there's no error, it resolves with
        // { ok: true, value: ExecutionResultValue }
        // else:
        // { ok: false, error: Error }
        const boxedResult = await execute();
        if (!boxedResult.ok) {
          log.error('Some boo boo happened :(');
        }
      }, interval * 1000);
    },
    output() {
      // this would have accepted any output parameters,
      // but we don't use any.

      // This will be called for every successful execution value
      return value => log[loglevel](value);
    },
  };
}
```

And there you have it - a basic plugin for `fofx`!
