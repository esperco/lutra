# Compile LESS files into CSS

.PHONY: default css clean
default: css

FILES = \
  content-script \
  injected-script

LESS = $(addsuffix .less, $(FILES))
CSS = $(addsuffix .css, $(FILES))

css: $(CSS)

$(CSS): %.css: %.less
	lessc $< $@

clean:
	rm -f *~ $(CSS)
