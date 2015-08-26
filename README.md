marten
======
A marten is not a Martin.

This module contains refactored helper code for Otter, Stoat, etc.

Gulp Helpers
------------
The [marten-gulp-helpers](marten-gulp-helpers) package is embedded within this
one. Its [README](marten-gulp-helpers/README.md) has details.

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
Most of the TypeScript code live in their own modules, each of which are within
the `Esper` namespace. Some of these modules depend oncertain vendor helpers
such as jQuery or Lodash / Underscore being added to the Esper namespace (see
below on how that works);

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
by [marten-gulp-helpers/vendor.js](marten-gulp-helpers/vendor.js).

Production Code
---------------
The TypeScript uses the `__ESPER_PRODUCTION__` global variable to control
which code is run in production vs. development modes. While you can change
this in the `config.js` file, a lot of the TypeScript modules implicitly assume
this is the variable used. In production, this variable isn't set but rather
replaced with `true` using a simple regular expression.
This lets the minimizer remove unused production code. Because the regex for
this isn't very smart, be careful of putting anything that looks like
`__ESPER_PRODUCTION__` in your TypeScript code if you don't want it
automatically replaced during minimization.

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
