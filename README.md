Otter
====

Web client for the assistant

Setup
-----

Requirements:
* UglifyJS (JavaScript minifier): follow instructions given for
  https://github.com/esperco/stoat
* `gawk` (GNU awk)
* LESS (CSS preprocessor): follow instructions given for
  https://github.com/esperco/stoat
* TypeScript (`tsc`): follow instructions given for
  https://github.com/esperco/stoat

Ubuntu:
```
sudo apt-get install gawk
```

Mac:
```
brew install gawk
brew install npm
npm install -g less
npm install -g uglify-js
```

Build instructions
------------------

Clone next to `wolverine` (`wolverine` and `otter` must be in the same directory):
```
git clone git@github.com:esperco/otter.git
```

```
cd otter
make setup  # fetches and unpacks libraries
make prod   # use 'make dev' or just 'make' for development
```

Public assets are now in `otter/pub` and the http server will find them.

In you're working on TypeScript development, you can also call `npm run watch` 
to start the TypeScript compiler in watch mode. This will cause TypeScript
to recompile the files whenever you save. A LiveReload server will start
listening as well on port 35729 (this can be changed in`config.js`). LiveReload
will automatically refresh your browser whenever files in the `pub` folder
change if you have the appropriate 
[browser extension](http://livereload.com/extensions/) installed.
