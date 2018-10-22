# **F of X** _( or `fofx`, for short)_

## What is this?

`fofx` aims to be a way for solo developers or teams to develop tiny pieces of software that is easily deployed, powerful enough to do stuff and easily pluginable.

Basically, think of `fofx` as a sort of _serverless_ (OMG, buzzword alert) product you can use as easy as `npm install`.

## Installation

Installing the main cli tool (this is the repo of the main cli tool, BTW) is as easy as `npm install --global fofx`. However, you're probably going to want to run some code with that nifty `fofx` you've heard so much about. Read on, then.

## Abstract

A good `fofx` setup is composed of two kinds of entities:

- **Plugins** are the components that let `fofx` know when to trigger your services, and how to handle their output. An _Input Plugin_ produces the parameter that is passed to your service. An _Output Plugin_ is called with your service's result value.
- **Nanos** are your bits of code, named so since they are basically nanoservices (is this a buzzword yet?). Your nanos should export a single function (async, or not) and may return a value. These functions will run on every input event, and pass their results to their respective outputs.

## Setup

Once you've installed the cli, you should create a new directory. Lets call ours _demo_.
In it, create 2 JSON files: _plugins.json_ and _nanos.json_. These serve as your "package.json"s, as we shall soon see. Recap:

```
demo/
|--plugins.json
|--nanos.json
```

Now, go into _plugins.json_. This is where you list your plugins (duh). A plugin can either be listed as its package name (if `npm install` accets it, `fofx` accepts it, as a rule), or as a more complex object:

```json
[
  {
    "name": "fofx-web",
    "params": {
      "port": 5000
    }
  },
  "fofx-cron"
]
```

As you may have noticed, the complex form accepts a `params` key, which is an object passed to the plugin's factory function. You can read more on these on individual plugins' READMEs.

We'll skip _nanos.json_ for now. First, let's create our first nano.

### Our first nano

Open a new terminal tab. Create a new node project, however you like. It should have a _package.json_ and main file (usually, _index.js_). Make sure the packe name is unique - this is your nano's name! Now, go ahead and create a _nano.json_ file, too. Recap:

```
nano-test/
|--package.json
|--index.js
|--nano.json
```

We'll disregard the _package.json_ for now, and start with our _nano.json_ file:

```json
{
  "input": {
    "type": "cron",
    "cron": "*/20 * * * * *"
  },
  "output": {
    "type": "web",
    "method": "POST",
    "url": "http://localhost:5000/api/bar"
  }
}
```

This file must have a hash with the `input` key, and may also have an `output` key. These represent the plugins that feed/accept data from your nano. In our example, our nano is triggered by the Crontab Plugin (`fofx-cron`), as indicated by the `type` key (every plugin has a declared, unique type) This plugin also needs a valid `cron` key in order to succefully schedule tasks. In our example, this nano will run every 20 seconds.
By the `output` key, we can tell that the result of the nano will be sent as a POST request to the url `http://localhost:5000/api/bar`, via the Web Plugin (`fofx-web`).

This is all we need to write in order to create a schduled task that sends HTTP requests.

As to our _index.js_:

```js
/* our function accepts no arguments, since crontab delivers no valuable info.
Other plugins, such as web input, might pass one argument (e.g. a web request object).
*/
module.exports = function() {
  // We were called!

  // every nano can hook into fofx log :)
  // available methods are: doc, debug, info, warn, error and fatal
  this.log.info('I have a dedicated log! Yay!');
  return {
    timestamp: Date.now(),
  };
};
```

And we have our first nano! Now we just have to make sure it's installable (you can publish to npm, store it on a git server or even just `npm link` it).

### Back to our nanos.json

Now we can simply list our nanos by their instabllable names (just like with the plugins file - if `npm install` accepts it, so should `fofx`). No complex forms this time:

```json
["nano-test"]
```

Setup is done!

## Run

Assuming your CWD is our demo directory, run:
`fofx`

This should install your plugins and nanos in a directory named _modules_ under _demo_:

```
demo/
|--plugins.json
|--nanos.json
|--modules/
|----plugins/
|------package-lock.json
|------node_modules/
|----nanos/
|------package-lock.json
|------node_modules/
|----cache/
```

If and when you use git to manage your `fofx` setup, you should set the _.gitignore_ to ignore the _modules_ directory.

And there you have it - a running platform for your nanoservices.

You can view a demo setup [here](https://github.com/functzia/demo).

## Official Plugins

- [fofx-web](https://github.com/functzia/fofx-web) - An input/output plugin for HTTP requests
- [fofx-cron](https://github.com/functzia/fofx-cron) - An input plugin for crontab-flavoured scheduled tasks

## Roadmap

- [ ] Scalable/distributed
- [ ] Watch changes to plugins/nanos and reload
