.PHONY: default pp clean dev-conf prod-conf
default: pp

SOURCES = \
  Esper \
  Types \
  Conf \
  List \
  Util \
  Watchable \
  Deferred \
  XDate \
  Log \
  LRU \
  EsperStorage \
  Message \
  Login \
  JsonHttp \
  ApiT \
  Api

# Paths to .ts source files
TS_SRC = \
  $(addsuffix .ts,$(SOURCES))

# Paths to .ts preprocessed files
TS = \
  $(addprefix ts/,$(TS_SRC))

DevConf.ts: DevConf.ts.in ../VERSION
	sed -e "s:@@VERSION@@:`cat ../VERSION`:g" DevConf.ts.in > $@

ProdConf.ts: ProdConf.ts.in ../VERSION
	sed -e "s:@@VERSION@@:`cat ../VERSION`:g" ProdConf.ts.in > $@

conf-pp: DevConf.ts ProdConf.ts

# Use localhost for API calls
dev-conf:
	$(MAKE) conf-pp
	if ! `cmp -s DevConf.ts Conf.ts`; then cp DevConf.ts Conf.ts; fi

# Use app.esper.com for API calls
prod-conf:
	$(MAKE) conf-pp
	if ! `cmp -s ProdConf.ts Conf.ts`; then cp ProdConf.ts Conf.ts; fi

# Allow a local 'make' after a 'make clean' for dev purposes
Conf.ts: DevConf.ts
	cp DevConf.ts Conf.ts

pp: $(TS)

ts/%.ts: %.ts
	@mkdir -p ts
	../setup/bin/oblivion $< -o $@

clean:
	rm -f *~
	rm -rf ts/
	rm -rf js/
	rm -f DevConf.ts ProdConf.ts Conf.ts
