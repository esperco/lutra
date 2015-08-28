Marten Gulp Helpers
====================
This package contains Gulp boilerplate for common tasks given a config object
similar to that in [Marten's config.js](../config.js). It's not a hosted NPM package
though, and you should call [link.sh](link.sh)
to `npm link` the helpers to your NPM package after running `npm install`.
You can also just add that command as a `postinstall` script (see
[Marten's package.json](../package.json) for an example).

The Gulp Helpers use Gulp v4 and require access to the actual `gulp` module
installed for a given NPM package. To pass it to the Gulp Helpers, be
sure to import the Gulp Helpers like so:

```javascript
helpers = require("marten-gulp-helpers")(gulp);
```

You can then call the various helpers based on their individual submodules:

```javascript
// TypeScript helpers
helpers.tsc.build("build-ts", config);
helpers.tsc.watch("watch-ts", config);

// LESS helpers
helpers.less.build("build-less", config);
helpers.less.watch("watch-less", config);

// Live-reload server helpers
helpers.servers.httpServer("http-server", config);
helpers.servers.liveReload("live-reload", config);
```

See [Marten's gulpfile](../gulpfile.js) for an example.
