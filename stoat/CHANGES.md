Stoat / Marten Changes
======================

This version of Stoat integrates in code from the Marten repo. The purpose of
this document is to list major changes as a result of this integration.


Setup
-----
Running `make setup` will install the Marten repo in a sibling directory to
Stoat and make it accessible via symlink. You should run `make setup` after
pulling in the new, Marten-integrated version of Stoat for the first time.
Note that Marten uses its own version of various dependencies like LESS and
TypeScript. It is no longer necessary to install those packages globally.


Build Tooling
-------------
Most of the make targets have been preserved. However, the bulk of the build
logic now resides in Marten's gulp-helpers repository (which is loaded via
the [gulpfile](gulpfile.js)).

`make` and `make release` still work as expected, but you can also now run
`npm run watch` to continuously monitor your filesystem and rebuild on save.
One other nice effect of the changes is that the build process no longer leaves
intermediate TS, JS, and CSS files scatted around your folder tree. The
injected files (e.g. [manifest.json.in](manifest.json.in) and
[DevConf.ts.in](common/DevConf.ts.in)) are still processed
using their old behavior though.

Note that `make` will not rebuild vendor files (see below) by default because
processing those files can take some time. If you make changes to your vendor
files, you will need to run `make rebuild`.


Third Party Vendor Files
------------------------
Third-party vendor libraries are now provided via Marten rather than the
`mink-libs` repository. The [vendor.js](vendor.js) defines which libraries
are included. Marten uses Browserify to wrap NodeJS-style requires for the
web and insert them into the Esper module. This means that Esper is now the
only global inserted by our injected scripts. Use `Esper.$` to refer to
jQuery, as before.

Third-party vendor CSS is bundled into a single vendor.css file and placed
in the `pub/css` directory.


Initialization
--------------
Because of how the vendor files are created, we need to wait until the
vendor files are fully loaded before we run any code dependent on them.
Vendor-dependent code should be inserted into an initialization block and
called when the vendor files are ready like so:

```javascript
if (Esper.vendorReady) {
  // Vendor file already loaded -- just run init
  Esper.Main.init();
} else {
  // Vendor files are not loaded. Assign our init function to the onVendorReady
  // variable, which will be called when the vendor files are loaded
  Esper.onVendorReady = Esper.Main.init;
}
```


Gmail.js
--------
As part of the Vendor file changes, `esperGmail` is no longer a defined
global. You can access this with Esper.GmailJs (which is distinct from
`Esper.Gmail`).


TypeScript 1.6
--------------
Marten uses a pre-release version of TypeScript 1.6 Please check the
[TypeScript roadmap](https://github.com/Microsoft/TypeScript/wiki/Roadmap)
for changes.


Deprecated Libraries (For Discussion)
-------------------------------------
[Lodash](https://lodash.com/) has been assigned to `Esper._`. If you have
used Underscore.js, it's basically the same thing. Lodash should be used
in lieu of the `Esper.List` module for functional programming helpers.

TypeScript 1.6 brings support the JSX syntax used by
[Facebook's React](http://facebook.github.io/react/). React can be used as an
alternative to our current Oblivion pre-processor, although it is not
exactly a drop-in replacement.

This list will grow as refactoring continues.


TypeScript Dependencies
-----------------------
Rather than using a Makefile to control which TypeScript files are loaded,
use the `globs` variable in the [config.js](config.js) file to define the
entire relevant universe of TypeScript files for a given project (each
"project" compiles to a single output file), and then use the `devIn` and
`prodIn` variables to define "entry points" for that project. An entry point
should use TypeScript's reference path syntax to define relative paths
to any other files a given TypeScript file depends on, like so:

```
/// <reference path="path/to/my/file.ts" />
/// <reference path="../path/from/parent/dir.ts" />
```


The TypeScript compiler will sort all of the TypeScript files in an order that
best preserves how the dependencies are listed. If you find that a given
TypeScript file should be listed after another, try inserting a reference
from the "after" file to the "before" file.


TypeScript Definitions
----------------------
TypeScript definitions for third party libraries can be found in the
`typings` directory in Marten. You should use reference paths to the relevant
`ts.d` files, as appropriate.


TypeScript Modules
------------------
Marten contains various helper modules for TypeScript in its `ts` directory.
Currently, there aren't that many and they aren't being used, but the plan is
to add to them over time and link them from Stoat.

Marten modules should be relatively well-tested and safe to use in Otter
and Honeybadger, as necessary.
