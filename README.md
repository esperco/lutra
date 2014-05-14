Otter
====

Web client for the assistant

Setup
-----

Requirements:
* UglifyJS (JavaScript minifier)
* `gawk` (GNU awk)
* LESS (CSS preprocessor)

Ubuntu:
```
sudo apt-get install node-uglify gawk node-less
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

Clone next to `badger` (`badger` and `otter` must be in the same directory):
```
git clone git@github.com:timeco/otter.git
```

```
cd otter
make setup  # fetches and unpacks libraries
make prod   # use 'make dev' or just 'make' for development
```

Public assets are now in `otter/pub` and the http server will find them.
