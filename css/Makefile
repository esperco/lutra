# Compile LESS files into CSS

default: css

FILES = \
  default \

LESS = $(addsuffix .less, $(FILES))
CSS = $(addsuffix .css, $(FILES))

css: $(CSS)

$(CSS): %.css: %.less
	lessc $< $@

clean:
	rm -f *~ $(CSS)
