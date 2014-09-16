# Compile LESS files into CSS

.PHONY: default prod-build dev-build css clean
default: css

FILES = \
  custom-bootstrap \
  app \
  guest-app \
  datepicker \
  executive-preferences

LESS = $(addsuffix .less, $(FILES))
CSS = $(addsuffix .css, $(FILES))

prod-build: css
dev-build: css

css: $(CSS)

$(CSS): %.css: %.less
	lessc $< $@

clean:
	rm -f *~ $(CSS)
