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

We currently use Node.js's LTS branch (v4.x).
OS X users can install Node with the installer on https://nodejs.org.

Linux distros using Debian-based package managers (e.g. Ubuntu) can run the following:

```
$ wget -qO- https://deb.nodesource.com/setup_4.x | sudo bash -
$ sudo apt-get install --yes nodejs
```

RPM-based distros should run:

```
$ curl -sL https://rpm.nodesource.com/setup_4.x | bash -
$ sudo yum install nodejs
```

To check your Node.js version:

```
$ nodejs --version
v4.2.6
```

You should also have NPM installed:

```
$ npm -v
3.7.1
```

If you don't have NPM installed, tryin running `sudo apt-get install npm` or
`sudo yum install npm` as appropriate.

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
