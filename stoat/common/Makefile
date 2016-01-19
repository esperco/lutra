.PHONY: clean
default: DevConf.ts

# NB: Use NPM to build
# Makefile just here to set up Conf files and clean up

DevConf.ts: DevConf.ts.in ../VERSION
	sed -e "s:@@VERSION@@:`cat ../VERSION`:g" DevConf.ts.in > $@

ProdConf.ts: ProdConf.ts.in ../VERSION
	sed -e "s:@@VERSION@@:`cat ../VERSION`:g" ProdConf.ts.in > $@

clean:
	rm -f *~
	rm -rf ts/
	rm -rf js/
	rm -f DevConf.ts ProdConf.ts Conf.ts
