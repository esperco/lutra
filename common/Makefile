.PHONY: default pp clean
default: pp

SOURCES = \
  Util \
  Log

# Paths to .ts source files
TS_SRC = \
  $(addsuffix .ts,$(SOURCES))

# Paths to .ts preprocessed files
TS = \
  $(addprefix ts/,$(TS_SRC))

pp: $(TS)

ts/%.ts: %.ts
	@mkdir -p ts
	../setup/bin/oblivion $< -o $@

clean:
	rm -f *~
	rm -rf ts/
	rm -rf js/
