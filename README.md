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

Vendor Files
------------
Third-party vendor libraries are installed in the [vendor](vendor) directory
with [Bower](http://bower.io/). If you want to add to this library, install
Bower with `npm install -g bower` and call `bower install [library] --save`.

Gulp Helpers
------------
The [marten-gulp-helpers](marten-gulp-helpers) package is embedded within this
one. Its [README](marten-gulp-helpers/README.md) has details.
