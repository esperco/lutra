.PHONY: clean dev-conf tikhon-conf prod-conf
default: Conf.ts

# NB: Use NPM to build
# Makefile just here to set up Conf files and clean up

TikhonConf.ts: TikhonConf.ts.in ../VERSION
	sed -e "s:@@VERSION@@:`cat ../VERSION`:g" TikhonConf.ts.in > $@

DevConf.ts: DevConf.ts.in ../VERSION
	sed -e "s:@@VERSION@@:`cat ../VERSION`:g" DevConf.ts.in > $@

ProdConf.ts: ProdConf.ts.in ../VERSION
	sed -e "s:@@VERSION@@:`cat ../VERSION`:g" ProdConf.ts.in > $@

conf-pp: TikhonConf.ts DevConf.ts ProdConf.ts

# Use localhost for API calls
dev-conf:
	$(MAKE) conf-pp
	if ! `cmp -s DevConf.ts Conf.ts`; then cp DevConf.ts Conf.ts; fi

# Use Tikhon's EC2 machine for API calls
tikhon-conf:
	$(MAKE) conf-pp
	if ! `cmp -s TikhonConf.ts Conf.ts`; then cp TikhonConf.ts Conf.ts; fi

# Use app.esper.com for API calls
prod-conf:
	$(MAKE) conf-pp
	if ! `cmp -s ProdConf.ts Conf.ts`; then cp ProdConf.ts Conf.ts; fi

# Allow a local 'make' after a 'make clean' for dev purposes
Conf.ts: DevConf.ts
	cp DevConf.ts Conf.ts

clean:
	rm -f *~
	rm -rf ts/
	rm -rf js/
	rm -f DevConf.ts ProdConf.ts Conf.ts
