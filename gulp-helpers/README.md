Gulp Helpers
============
This directory contains Gulp boilerplate for common tasks given a config
object. The Gulp Helpers use Gulp v4 and require a reference to the actual
`gulp` module be passed to it. To pass it to the Gulp Helpers, be sure to
import the Gulp Helpers like so:

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
