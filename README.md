marten
======
A marten is not a Martin.

This module contains refactored helper code for Otter, Stoat, etc.

Typescript Definitions
----------------------
The [typings](typings) directory contains various type defitions imported
from [our fork of the DefinitelyTyped library](https://github.com/esperco/DefinitelyTyped).
To add to these typings, you should download [tsd](http://definitelytyped.org/tsd/)
with `npm install -g tsd` and call `tsd install [library] --save`.

If you want to write new definitions for open-source projects, please add to
our fork of the DefinitelyTyped repo and consider opening a pull request to the
main (borisyankov) DefinitelyTyped repo.

Gulp Helpers
------------
The [marten-gulp-helpers](marten-gulp-helpers) package is embedded within this
one. Its [README](marten-gulp-helpers/README.md) has details.

Vendor Files
------------
Third-party vendor libraries are installed in the [vendor](vendor) directory
with [Bower](http://bower.io/). If you want to add to this library, install
Bower with `npm install -g bower` and call `bower install [library] --save`.
You can also use `npm install [library] --save` for libraries that aren't
available on Bower and which will be Browserified for the client.

This package contains helpers for bundling vendor files in a way that doesn't
overly pollute the global namespace. See the [vendor/index.js](vendor/index.js)
file for an example of how to construct an index file that Browserify can use
as an entry point. The Browserify code and necessary plugins are handled
by [marten-gulp-helpers/vendor.js](marten-gulp-helpers/vendor.js).
