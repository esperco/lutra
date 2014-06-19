# Compile LESS files into CSS

.PHONY: default prod-build dev-build css clean
default: css

FILES = \
  app

LESS = $(addsuffix .less, $(FILES))
CSS = $(addsuffix .css, $(FILES))

prod-build: css
dev-build: css

css: $(CSS)

$(CSS): %.css: %.less
	lessc $< $@

clean:
	rm -f *~ $(CSS)
