.PHONY: default pp clean dev-conf prod-conf
default: pp

SOURCES = \
  Esper \
  Conf \
  List \
  Util \
  Watchable \
  XDate \
  Log \
  EsperStorage \
  EsperMessage \
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

# Use localhost for API calls
dev-conf:
	if ! `cmp -s DevConf.ts Conf.ts`; then cp DevConf.ts Conf.ts; fi

# Use app.esper.com for API calls
prod-conf:
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
	rm -f Conf.ts
