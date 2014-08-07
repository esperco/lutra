# Compile LESS files into CSS

.PHONY: default css clean
default: css

# Content scripts and injected scripts share the same CSS rules
# because they use the same DOM.
# Currently the same CSS rules are injected regardless of the URL:
# app.esper.com, Gmail, and Google Calendar share the same CSS rules.
FILES = \
  esper

LESS = $(addsuffix .less, $(FILES))
CSS = $(addsuffix .css, $(FILES))

css: $(CSS)

$(CSS): %.css: %.less
	lessc $< $@

clean:
	rm -f *~ $(CSS)
