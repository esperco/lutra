zorilla
=======
Time Stats Frontend

![Zorilla](https://c2.staticflickr.com/6/5512/11209330935_d388e10008.jpg)

Getting Started
---------------
Recent-ish versions of Node.js and NPM are required. See
https://github.com/esperco/stoat for instructions on installing those. You'll
also need a working version of [Wolverine](https://github.com/esperco/wolverine)
at http://localhost.

Once you have Node.js and NPM installed, run `make setup` to initialize the
linked [Marten](https://github.com/esperco/marten) repo. Then run `make build`
or `make` to build a development version of the front-end.

Run `npm run watch` to set up a file watcher that rebuilds. `npm run watch`
will also launch a development server on http://localhost:5000.

If you edit the vendor.js file or update the vendor files in Marten, you may
have to rebuild the vendor file. Run `make clean` to remove the old vendor
file and `make` again to build a new one

Testing
-------
In development mode, you can access tests at http://localhost:5000/test.html.
Tests are currently scant, but we'll (hopefully) be adding more

Production
----------
Run the following commands to build a production version of Zorilla and deploy
to S3.

```
make setup
make install # automatically calls make prod
```


