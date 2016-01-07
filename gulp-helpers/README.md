Gulp Helpers
============
This directory contains Gulp v4 boilerplate for common tasks given a config
object. Use like so:

```javascript
var helpers = require("gulp-helpers");

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
