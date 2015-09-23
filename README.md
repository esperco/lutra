marten
======
A marten is not a Martin.

![Pine marten](https://farm3.staticflickr.com/2804/4361362178_edb7a73df0_n.jpg)

This repo contains refactored helper code for Otter, Stoat, etc.

Test App
--------
The [app](app) folder contains a sample app that links to and relies on
various parts of Marten. You can build it by calling `make` inside the app
directory.

Gulp Helpers
------------
The [gulp-helpers](gulp-helpers) package is embedded within this
one. Its [README](gulp-helpers/README.md) has details.

TypeScript Definitions
----------------------
The [typings](typings) directory contains various type defitions imported
from [our fork of the DefinitelyTyped library](https://github.com/esperco/DefinitelyTyped).
To add to these typings, you should download [tsd](http://definitelytyped.org/tsd/)
with `npm install -g tsd` and call `tsd install [library] --save`.

If you want to write new definitions for open-source projects, please add to
our fork of the DefinitelyTyped repo and consider opening a pull request to the
main (borisyankov) DefinitelyTyped repo.

TypeScript Modules
------------------
Most of the TypeScript code live in their own internal module namepsaces,
each of which are within the `Esper` namespace. Some of these modules depend
on certain vendor helpers such as jQuery or Lodash / Underscore being added to
the Esper namespace (see below on how that works).

The TypeScript build process uses globs to determine which TypeScript files
get concatenated together and allows for separate globs for development and
production (see [app/config.js](app/config.js) for an example).
We don't use a CommonJS- or AMD- style require
for TypeScripts (although that may change in future versions), but rely
upon references (`/// <reference path="./MyModule.ts"/>`) to control ordering.

Vendor Files
------------
Third-party vendor libraries are installed in the [vendor](vendor) directory
with [Bower](http://bower.io/). If you want to add to this library, install
Bower with `npm install -g bower` and call `bower install [library] --save`.
You can also use `npm install [library] --save` for libraries that aren't
available on Bower and which will be Browserified for the client.

This package contains helpers for bundling vendor files in a way that doesn't
overly pollute the global namespace. See the [vendor index file](js/vendor.js)
for an example of how to construct an index file that Browserify can use
as an entry point. The Browserify code and necessary plugins are handled
by [gulp-helpers/vendor.js](gulp-helpers/vendor.js).

LESS Bootstrap
--------------
The [`less/_custom_bootstrap`](less/_custom_bootstrap.less) partial can be
imported to get Bootstrap but overriden with Esper-specific style variables.
You can import this inside a class block to create a namespace of sorts (
although CSS code with the `!important` declaration may still be able
to override it):

```
.esper {
  @import "_custom_bootstrap";
  font-family: @font-family-base;
  background: @body-bg;
  color: @text-color;
}
```
