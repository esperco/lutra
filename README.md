# lutra
Merges several previously separate repositories for front-end code:
* [Marten](https://github.com/esperco/marten) - Shared library code between different front-end components
* [Otter](https://github.com/esperco/otter) - Settings page at app.esper.com
* [Zorilla](https://github.com/esperco/zorilla) - Time Stats
* [Grison](https://github.com/esperco/grison) - Directory
* [Stoat](https://github.com/esperco/stoat) - Chrome extension
* [Honeybadger](https://github.com/esperco/stoat) - Static esper.com website


Setup
=====

We current use Node.js at v0.10.37. Newer versions of Node.js will (probably)
work as well.

OS X users can install Node with an installer

Ubuntu 14.04 can run the following:

```
$ sudo add-apt-repository ppa:chris-lea/node.js
$ sudo apt-get update
$ sudo apt-get install python-software-properties python g++ make nodejs
```

Linux users should see the following URL for details on how to install
nodejs and and npm with a package anager:
https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager

To check your Node.js version:

```
$ nodejs --version
v0.10.37
```

Everyone
--------

Avoid having to use `sudo` for `npm`:
```
npm config set prefix ~/npm
```

And then add `~/npm/bin` to your `PATH` environment variable.

Once Node is properly installed, run `make setup`.

See readme files from within the individual repos for instructions on building
and deploying.


Vendor Files
------------
We use NPM as our package manager because this works well with Browserify (we
previously used Bower for some non-JS assets, but an increasing number of
libraries are bundling non-JS assets in their NPM packages, so we're just 
defaulting to using NPM).

`npm install <package> --save` to add a new dependency. Depenencies are saved
in `node_modules` (or via the symlink `vendor`).


Typings
-------
TypeScript typings are installed via the Typings definition manager.
[Typings](https://github.com/typings/typings). To use, install Typings
globally with `npm install typings -g` or use the binary in the
`node_modules/.bin` directory created after `make setup`.

Do not modify d.ts files in the `typings` directory directly. Either modify
typings in https://github.com/esperco/DefinitelyTyped (`typings.json` uses
definitions from there instead of the official DefinitelyTyped repo), or
fork or use definitions in a separate repo. This makes it easier for us to
merge upstream later if we want to open-source our definitions.
