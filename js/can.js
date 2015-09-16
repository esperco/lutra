// Temporary shim for old CanJS old until Page is up and running

/*!
 * CanJS - 2.2.7
 * http://canjs.com/
 * Copyright (c) 2015 Bitovi
 * Thu, 06 Aug 2015 20:40:09 GMT
 * Licensed MIT

 * Includes: can/construct/construct,can/map/map,can/list/list,can/control/control,can/route/route,can/control/route/route
 * Download from: http://bitbuilder.herokuapp.com/can.custom.js?configuration=jquery&plugins=can%2Fconstruct%2Fconstruct&plugins=can%2Fmap%2Fmap&plugins=can%2Flist%2Flist&plugins=can%2Fcontrol%2Fcontrol&plugins=can%2Froute%2Froute&plugins=can%2Fcontrol%2Froute%2Froute
 */
/*[global-shim-start]*/
(function (exports, global){
  var origDefine = global.define;

  var get = function(name){
    var parts = name.split("."),
      cur = global,
      i;
    for(i = 0 ; i < parts.length; i++){
      if(!cur) {
        break;
      }
      cur = cur[parts[i]];
    }
    return cur;
  };
  var modules = (global.define && global.define.modules) ||
    (global._define && global._define.modules) || {};
  var ourDefine = global.define = function(moduleName, deps, callback){
    var module;
    if(typeof deps === "function") {
      callback = deps;
      deps = [];
    }
    var args = [],
      i;
    for(i =0; i < deps.length; i++) {
      args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
    }
    // CJS has no dependencies but 3 callback arguments
    if(!deps.length && callback.length) {
      module = { exports: {} };
      var require = function(name) {
        return exports[name] ? get(exports[name]) : modules[name];
      };
      args.push(require, module.exports, module);
    }
    // Babel uses only the exports objet
    else if(!args[0] && deps[0] === "exports") {
      module = { exports: {} };
      args[0] = module.exports;
    }

    global.define = origDefine;
    var result = callback ? callback.apply(null, args) : undefined;
    global.define = ourDefine;

    // Favor CJS module.exports over the return value
    modules[moduleName] = module && module.exports ? module.exports : result;
  };
  global.define.orig = origDefine;
  global.define.modules = modules;
  global.define.amd = true;
  global.System = {
    define: function(__name, __code){
      global.define = origDefine;
      eval("(function() { " + __code + " \n }).call(global);");
      global.define = ourDefine;
    },
    orig: global.System
  };
})({},window)
/*can/util/can*/
define('can/util/can', [], function () {
    var glbl = typeof window !== 'undefined' ? window : global;
    var can = {};
    if (typeof GLOBALCAN === 'undefined' || GLOBALCAN !== false) {
        glbl.can = can;
    }
    can.global = glbl;
    can.k = function () {
    };
    can.isDeferred = can.isPromise = function (obj) {
        return obj && typeof obj.then === 'function' && typeof obj.pipe === 'function';
    };
    can.isMapLike = function (obj) {
        return can.Map && (obj instanceof can.Map || obj && obj.__get);
    };
    var cid = 0;
    can.cid = function (object, name) {
        if (!object._cid) {
            cid++;
            object._cid = (name || '') + cid;
        }
        return object._cid;
    };
    can.VERSION = '@EDGE';
    can.simpleExtend = function (d, s) {
        for (var prop in s) {
            d[prop] = s[prop];
        }
        return d;
    };
    can.last = function (arr) {
        return arr && arr[arr.length - 1];
    };
    var protoBind = Function.prototype.bind;
    if (protoBind) {
        can.proxy = function (fn, context) {
            return protoBind.call(fn, context);
        };
    } else {
        can.proxy = function (fn, context) {
            return function () {
                return fn.apply(context, arguments);
            };
        };
    }
    can.frag = function (item) {
        var frag;
        if (!item || typeof item === 'string') {
            frag = can.buildFragment(item == null ? '' : '' + item, document.body);
            if (!frag.childNodes.length) {
                frag.appendChild(document.createTextNode(''));
            }
            return frag;
        } else if (item.nodeType === 11) {
            return item;
        } else if (typeof item.nodeType === 'number') {
            frag = document.createDocumentFragment();
            frag.appendChild(item);
            return frag;
        } else if (typeof item.length === 'number') {
            frag = document.createDocumentFragment();
            can.each(item, function (item) {
                frag.appendChild(can.frag(item));
            });
            return frag;
        } else {
            frag = can.buildFragment('' + item, document.body);
            if (!frag.childNodes.length) {
                frag.appendChild(document.createTextNode(''));
            }
            return frag;
        }
    };
    can.scope = can.viewModel = function (el, attr, val) {
        el = can.$(el);
        var scope = can.data(el, 'scope') || can.data(el, 'viewModel');
        if (!scope) {
            scope = new can.Map();
            can.data(el, 'scope', scope);
            can.data(el, 'viewModel', scope);
        }
        switch (arguments.length) {
        case 0:
        case 1:
            return scope;
        case 2:
            return scope.attr(attr);
        default:
            scope.attr(attr, val);
            return el;
        }
    };
    can['import'] = function (moduleName) {
        var deferred = new can.Deferred();
        if (typeof window.System === 'object' && can.isFunction(window.System['import'])) {
            window.System['import'](moduleName).then(can.proxy(deferred.resolve, deferred), can.proxy(deferred.reject, deferred));
        } else if (window.define && window.define.amd) {
            window.require([moduleName], function (value) {
                deferred.resolve(value);
            });
        } else if (window.steal) {
            steal.steal(moduleName, function (value) {
                deferred.resolve(value);
            });
        } else if (window.require) {
            deferred.resolve(window.require(moduleName));
        } else {
            deferred.resolve();
        }
        return deferred.promise();
    };
    can.__observe = function () {
    };
    return can;
});
/*can/util/attr/attr*/
define('can/util/attr/attr', ['can/util/can'], function (can) {
    var setImmediate = can.global.setImmediate || function (cb) {
            return setTimeout(cb, 0);
        }, attr = {
            MutationObserver: can.global.MutationObserver || can.global.WebKitMutationObserver || can.global.MozMutationObserver,
            map: {
                'class': 'className',
                'value': 'value',
                'innertext': 'innerText',
                'textcontent': 'textContent',
                'checked': true,
                'disabled': true,
                'readonly': true,
                'required': true,
                src: function (el, val) {
                    if (val == null || val === '') {
                        el.removeAttribute('src');
                        return null;
                    } else {
                        el.setAttribute('src', val);
                        return val;
                    }
                },
                style: function (el, val) {
                    return el.style.cssText = val || '';
                }
            },
            defaultValue: [
                'input',
                'textarea'
            ],
            set: function (el, attrName, val) {
                attrName = attrName.toLowerCase();
                var oldValue;
                if (!attr.MutationObserver) {
                    oldValue = attr.get(el, attrName);
                }
                var tagName = el.nodeName.toString().toLowerCase(), prop = attr.map[attrName], newValue;
                if (typeof prop === 'function') {
                    newValue = prop(el, val);
                } else if (prop === true) {
                    newValue = el[attrName] = true;
                    if (attrName === 'checked' && el.type === 'radio') {
                        if (can.inArray(tagName, attr.defaultValue) >= 0) {
                            el.defaultChecked = true;
                        }
                    }
                } else if (prop) {
                    newValue = val;
                    if (el[prop] !== val) {
                        el[prop] = val;
                    }
                    if (prop === 'value' && can.inArray(tagName, attr.defaultValue) >= 0) {
                        el.defaultValue = val;
                    }
                } else {
                    el.setAttribute(attrName, val);
                    newValue = val;
                }
                if (!attr.MutationObserver && newValue !== oldValue) {
                    attr.trigger(el, attrName, oldValue);
                }
            },
            trigger: function (el, attrName, oldValue) {
                if (can.data(can.$(el), 'canHasAttributesBindings')) {
                    attrName = attrName.toLowerCase();
                    return setImmediate(function () {
                        can.trigger(el, {
                            type: 'attributes',
                            attributeName: attrName,
                            target: el,
                            oldValue: oldValue,
                            bubbles: false
                        }, []);
                    });
                }
            },
            get: function (el, attrName) {
                attrName = attrName.toLowerCase();
                var prop = attr.map[attrName];
                if (typeof prop === 'string' && el[prop]) {
                    return el[prop];
                }
                return el.getAttribute(attrName);
            },
            remove: function (el, attrName) {
                attrName = attrName.toLowerCase();
                var oldValue;
                if (!attr.MutationObserver) {
                    oldValue = attr.get(el, attrName);
                }
                var setter = attr.map[attrName];
                if (typeof setter === 'function') {
                    setter(el, undefined);
                }
                if (setter === true) {
                    el[attrName] = false;
                } else if (typeof setter === 'string') {
                    el[setter] = '';
                } else {
                    el.removeAttribute(attrName);
                }
                if (!attr.MutationObserver && oldValue != null) {
                    attr.trigger(el, attrName, oldValue);
                }
            },
            has: function () {
                var el = can.global.document && document.createElement('div');
                if (el && el.hasAttribute) {
                    return function (el, name) {
                        return el.hasAttribute(name);
                    };
                } else {
                    return function (el, name) {
                        return el.getAttribute(name) !== null;
                    };
                }
            }()
        };
    return attr;
});
/*can/event/event*/
define('can/event/event', ['can/util/can'], function (can) {
    can.addEvent = function (event, handler) {
        var allEvents = this.__bindEvents || (this.__bindEvents = {}), eventList = allEvents[event] || (allEvents[event] = []);
        eventList.push({
            handler: handler,
            name: event
        });
        return this;
    };
    can.listenTo = function (other, event, handler) {
        var idedEvents = this.__listenToEvents;
        if (!idedEvents) {
            idedEvents = this.__listenToEvents = {};
        }
        var otherId = can.cid(other);
        var othersEvents = idedEvents[otherId];
        if (!othersEvents) {
            othersEvents = idedEvents[otherId] = {
                obj: other,
                events: {}
            };
        }
        var eventsEvents = othersEvents.events[event];
        if (!eventsEvents) {
            eventsEvents = othersEvents.events[event] = [];
        }
        eventsEvents.push(handler);
        can.bind.call(other, event, handler);
    };
    can.stopListening = function (other, event, handler) {
        var idedEvents = this.__listenToEvents, iterIdedEvents = idedEvents, i = 0;
        if (!idedEvents) {
            return this;
        }
        if (other) {
            var othercid = can.cid(other);
            (iterIdedEvents = {})[othercid] = idedEvents[othercid];
            if (!idedEvents[othercid]) {
                return this;
            }
        }
        for (var cid in iterIdedEvents) {
            var othersEvents = iterIdedEvents[cid], eventsEvents;
            other = idedEvents[cid].obj;
            if (!event) {
                eventsEvents = othersEvents.events;
            } else {
                (eventsEvents = {})[event] = othersEvents.events[event];
            }
            for (var eventName in eventsEvents) {
                var handlers = eventsEvents[eventName] || [];
                i = 0;
                while (i < handlers.length) {
                    if (handler && handler === handlers[i] || !handler) {
                        can.unbind.call(other, eventName, handlers[i]);
                        handlers.splice(i, 1);
                    } else {
                        i++;
                    }
                }
                if (!handlers.length) {
                    delete othersEvents.events[eventName];
                }
            }
            if (can.isEmptyObject(othersEvents.events)) {
                delete idedEvents[cid];
            }
        }
        return this;
    };
    can.removeEvent = function (event, fn, __validate) {
        if (!this.__bindEvents) {
            return this;
        }
        var events = this.__bindEvents[event] || [], i = 0, ev, isFunction = typeof fn === 'function';
        while (i < events.length) {
            ev = events[i];
            if (__validate ? __validate(ev, event, fn) : isFunction && ev.handler === fn || !isFunction && (ev.cid === fn || !fn)) {
                events.splice(i, 1);
            } else {
                i++;
            }
        }
        return this;
    };
    can.dispatch = function (event, args) {
        var events = this.__bindEvents;
        if (!events) {
            return;
        }
        if (typeof event === 'string') {
            event = { type: event };
        }
        var eventName = event.type, handlers = (events[eventName] || []).slice(0), passed = [event];
        if (args) {
            passed.push.apply(passed, args);
        }
        for (var i = 0, len = handlers.length; i < len; i++) {
            handlers[i].handler.apply(this, passed);
        }
        return event;
    };
    can.one = function (event, handler) {
        var one = function () {
            can.unbind.call(this, event, one);
            return handler.apply(this, arguments);
        };
        can.bind.call(this, event, one);
        return this;
    };
    can.event = {
        on: function () {
            if (arguments.length === 0 && can.Control && this instanceof can.Control) {
                return can.Control.prototype.on.call(this);
            } else {
                return can.addEvent.apply(this, arguments);
            }
        },
        off: function () {
            if (arguments.length === 0 && can.Control && this instanceof can.Control) {
                return can.Control.prototype.off.call(this);
            } else {
                return can.removeEvent.apply(this, arguments);
            }
        },
        bind: can.addEvent,
        unbind: can.removeEvent,
        delegate: function (selector, event, handler) {
            return can.addEvent.call(this, event, handler);
        },
        undelegate: function (selector, event, handler) {
            return can.removeEvent.call(this, event, handler);
        },
        trigger: can.dispatch,
        one: can.one,
        addEvent: can.addEvent,
        removeEvent: can.removeEvent,
        listenTo: can.listenTo,
        stopListening: can.stopListening,
        dispatch: can.dispatch
    };
    return can.event;
});
/*can/util/array/each*/
define('can/util/array/each', ['can/util/can'], function (can) {
    var isArrayLike = function (obj) {
        var length = 'length' in obj && obj.length;
        return typeof arr !== 'function' && (length === 0 || typeof length === 'number' && length > 0 && length - 1 in obj);
    };
    can.each = function (elements, callback, context) {
        var i = 0, key, len, item;
        if (elements) {
            if (isArrayLike(elements)) {
                if (can.List && elements instanceof can.List) {
                    for (len = elements.attr('length'); i < len; i++) {
                        item = elements.attr(i);
                        if (callback.call(context || item, item, i, elements) === false) {
                            break;
                        }
                    }
                } else {
                    for (len = elements.length; i < len; i++) {
                        item = elements[i];
                        if (callback.call(context || item, item, i, elements) === false) {
                            break;
                        }
                    }
                }
            } else if (typeof elements === 'object') {
                if (can.Map && elements instanceof can.Map || elements === can.route) {
                    var keys = can.Map.keys(elements);
                    for (i = 0, len = keys.length; i < len; i++) {
                        key = keys[i];
                        item = elements.attr(key);
                        if (callback.call(context || item, item, key, elements) === false) {
                            break;
                        }
                    }
                } else {
                    for (key in elements) {
                        if (elements.hasOwnProperty(key) && callback.call(context || elements[key], elements[key], key, elements) === false) {
                            break;
                        }
                    }
                }
            }
        }
        return elements;
    };
    return can;
});
/*can/util/inserted/inserted*/
define('can/util/inserted/inserted', ['can/util/can'], function (can) {
    can.inserted = function (elems) {
        elems = can.makeArray(elems);
        var inDocument = false, doc = can.$(document.contains ? document : document.body), children;
        for (var i = 0, elem; (elem = elems[i]) !== undefined; i++) {
            if (!inDocument) {
                if (elem.getElementsByTagName) {
                    if (can.has(doc, elem).length) {
                        inDocument = true;
                    } else {
                        return;
                    }
                } else {
                    continue;
                }
            }
            if (inDocument && elem.getElementsByTagName) {
                children = can.makeArray(elem.getElementsByTagName('*'));
                can.trigger(elem, 'inserted', [], false);
                for (var j = 0, child; (child = children[j]) !== undefined; j++) {
                    can.trigger(child, 'inserted', [], false);
                }
            }
        }
    };
    can.appendChild = function (el, child) {
        var children;
        if (child.nodeType === 11) {
            children = can.makeArray(child.childNodes);
        } else {
            children = [child];
        }
        el.appendChild(child);
        can.inserted(children);
    };
    can.insertBefore = function (el, child, ref) {
        var children;
        if (child.nodeType === 11) {
            children = can.makeArray(child.childNodes);
        } else {
            children = [child];
        }
        el.insertBefore(child, ref);
        can.inserted(children);
    };
});
/*can/util/jquery/jquery*/
define('can/util/jquery/jquery', [
    'jquery/dist/jquery',
    'can/util/can',
    'can/util/attr/attr',
    'can/event/event',
    'can/util/array/each',
    'can/util/inserted/inserted'
], function ($, can, attr, event) {
    var isBindableElement = function (node) {
        return node.nodeName && (node.nodeType === 1 || node.nodeType === 9) || node == window;
    };
    $ = $ || window.jQuery;
    $.extend(can, $, {
        trigger: function (obj, event, args, bubbles) {
            if (isBindableElement(obj)) {
                $.event.trigger(event, args, obj, !bubbles);
            } else if (obj.trigger) {
                obj.trigger(event, args);
            } else {
                if (typeof event === 'string') {
                    event = { type: event };
                }
                event.target = event.target || obj;
                if (args) {
                    if (args.length && typeof args === 'string') {
                        args = [args];
                    } else if (!args.length) {
                        args = [args];
                    }
                }
                if (!args) {
                    args = [];
                }
                can.dispatch.call(obj, event, args);
            }
        },
        event: can.event,
        addEvent: can.addEvent,
        removeEvent: can.removeEvent,
        buildFragment: function (elems, context) {
            var ret;
            elems = [elems];
            context = context || document;
            context = !context.nodeType && context[0] || context;
            context = context.ownerDocument || context;
            ret = $.buildFragment(elems, context);
            return ret.cacheable ? $.clone(ret.fragment) : ret.fragment || ret;
        },
        $: $,
        each: can.each,
        bind: function (ev, cb) {
            if (this.bind && this.bind !== can.bind) {
                this.bind(ev, cb);
            } else if (isBindableElement(this)) {
                $.event.add(this, ev, cb);
            } else {
                can.addEvent.call(this, ev, cb);
            }
            return this;
        },
        unbind: function (ev, cb) {
            if (this.unbind && this.unbind !== can.unbind) {
                this.unbind(ev, cb);
            } else if (isBindableElement(this)) {
                $.event.remove(this, ev, cb);
            } else {
                can.removeEvent.call(this, ev, cb);
            }
            return this;
        },
        delegate: function (selector, ev, cb) {
            if (this.delegate) {
                this.delegate(selector, ev, cb);
            } else if (isBindableElement(this)) {
                $(this).delegate(selector, ev, cb);
            } else {
                can.bind.call(this, ev, cb);
            }
            return this;
        },
        undelegate: function (selector, ev, cb) {
            if (this.undelegate) {
                this.undelegate(selector, ev, cb);
            } else if (isBindableElement(this)) {
                $(this).undelegate(selector, ev, cb);
            } else {
                can.unbind.call(this, ev, cb);
            }
            return this;
        },
        proxy: can.proxy,
        attr: attr
    });
    can.on = can.bind;
    can.off = can.unbind;
    $.each([
        'append',
        'filter',
        'addClass',
        'remove',
        'data',
        'get',
        'has'
    ], function (i, name) {
        can[name] = function (wrapped) {
            return wrapped[name].apply(wrapped, can.makeArray(arguments).slice(1));
        };
    });
    var oldClean = $.cleanData;
    $.cleanData = function (elems) {
        $.each(elems, function (i, elem) {
            if (elem) {
                can.trigger(elem, 'removed', [], false);
            }
        });
        oldClean(elems);
    };
    var oldDomManip = $.fn.domManip, cbIndex;
    $.fn.domManip = function (args, cb1, cb2) {
        for (var i = 1; i < arguments.length; i++) {
            if (typeof arguments[i] === 'function') {
                cbIndex = i;
                break;
            }
        }
        return oldDomManip.apply(this, arguments);
    };
    $(document.createElement('div')).append(document.createElement('div'));
    $.fn.domManip = cbIndex === 2 ? function (args, table, callback) {
        return oldDomManip.call(this, args, table, function (elem) {
            var elems;
            if (elem.nodeType === 11) {
                elems = can.makeArray(elem.childNodes);
            }
            var ret = callback.apply(this, arguments);
            can.inserted(elems ? elems : [elem]);
            return ret;
        });
    } : function (args, callback) {
        return oldDomManip.call(this, args, function (elem) {
            var elems;
            if (elem.nodeType === 11) {
                elems = can.makeArray(elem.childNodes);
            }
            var ret = callback.apply(this, arguments);
            can.inserted(elems ? elems : [elem]);
            return ret;
        });
    };
    if (!can.attr.MutationObserver) {
        var oldAttr = $.attr;
        $.attr = function (el, attrName) {
            var oldValue, newValue;
            if (arguments.length >= 3) {
                oldValue = oldAttr.call(this, el, attrName);
            }
            var res = oldAttr.apply(this, arguments);
            if (arguments.length >= 3) {
                newValue = oldAttr.call(this, el, attrName);
            }
            if (newValue !== oldValue) {
                can.attr.trigger(el, attrName, oldValue);
            }
            return res;
        };
        var oldRemove = $.removeAttr;
        $.removeAttr = function (el, attrName) {
            var oldValue = oldAttr.call(this, el, attrName), res = oldRemove.apply(this, arguments);
            if (oldValue != null) {
                can.attr.trigger(el, attrName, oldValue);
            }
            return res;
        };
        $.event.special.attributes = {
            setup: function () {
                can.data(can.$(this), 'canHasAttributesBindings', true);
            },
            teardown: function () {
                $.removeData(this, 'canHasAttributesBindings');
            }
        };
    } else {
        $.event.special.attributes = {
            setup: function () {
                var self = this;
                var observer = new can.attr.MutationObserver(function (mutations) {
                        mutations.forEach(function (mutation) {
                            var copy = can.simpleExtend({}, mutation);
                            can.trigger(self, copy, []);
                        });
                    });
                observer.observe(this, {
                    attributes: true,
                    attributeOldValue: true
                });
                can.data(can.$(this), 'canAttributesObserver', observer);
            },
            teardown: function () {
                can.data(can.$(this), 'canAttributesObserver').disconnect();
                $.removeData(this, 'canAttributesObserver');
            }
        };
    }
    (function () {
        var text = '<-\n>', frag = can.buildFragment(text, document);
        if (text !== frag.childNodes[0].nodeValue) {
            var oldBuildFragment = can.buildFragment;
            can.buildFragment = function (content, context) {
                var res = oldBuildFragment(content, context);
                if (res.childNodes.length === 1 && res.childNodes[0].nodeType === 3) {
                    res.childNodes[0].nodeValue = content;
                }
                return res;
            };
        }
    }());
    $.event.special.inserted = {};
    $.event.special.removed = {};
    return can;
});
/*can/util/util*/
define('can/util/util', ['can/util/jquery/jquery'], function (can) {
    return can;
});
/*can/util/string/string*/
define('can/util/string/string', ['can/util/util'], function (can) {
    var strUndHash = /_|-/, strColons = /\=\=/, strWords = /([A-Z]+)([A-Z][a-z])/g, strLowUp = /([a-z\d])([A-Z])/g, strDash = /([a-z\d])([A-Z])/g, strReplacer = /\{([^\}]+)\}/g, strQuote = /"/g, strSingleQuote = /'/g, strHyphenMatch = /-+(.)?/g, strCamelMatch = /[a-z][A-Z]/g, getNext = function (obj, prop, add) {
            var result = obj[prop];
            if (result === undefined && add === true) {
                result = obj[prop] = {};
            }
            return result;
        }, isContainer = function (current) {
            return /^f|^o/.test(typeof current);
        }, convertBadValues = function (content) {
            var isInvalid = content === null || content === undefined || isNaN(content) && '' + content === 'NaN';
            return '' + (isInvalid ? '' : content);
        };
    can.extend(can, {
        esc: function (content) {
            return convertBadValues(content).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(strQuote, '&#34;').replace(strSingleQuote, '&#39;');
        },
        getObject: function (name, roots, add) {
            var parts = name ? name.split('.') : [], length = parts.length, current, r = 0, i, container, rootsLength;
            roots = can.isArray(roots) ? roots : [roots || window];
            rootsLength = roots.length;
            if (!length) {
                return roots[0];
            }
            for (r; r < rootsLength; r++) {
                current = roots[r];
                container = undefined;
                for (i = 0; i < length && isContainer(current); i++) {
                    container = current;
                    current = getNext(container, parts[i]);
                }
                if (container !== undefined && current !== undefined) {
                    break;
                }
            }
            if (add === false && current !== undefined) {
                delete container[parts[i - 1]];
            }
            if (add === true && current === undefined) {
                current = roots[0];
                for (i = 0; i < length && isContainer(current); i++) {
                    current = getNext(current, parts[i], true);
                }
            }
            return current;
        },
        capitalize: function (s, cache) {
            return s.charAt(0).toUpperCase() + s.slice(1);
        },
        camelize: function (str) {
            return convertBadValues(str).replace(strHyphenMatch, function (match, chr) {
                return chr ? chr.toUpperCase() : '';
            });
        },
        hyphenate: function (str) {
            return convertBadValues(str).replace(strCamelMatch, function (str, offset) {
                return str.charAt(0) + '-' + str.charAt(1).toLowerCase();
            });
        },
        underscore: function (s) {
            return s.replace(strColons, '/').replace(strWords, '$1_$2').replace(strLowUp, '$1_$2').replace(strDash, '_').toLowerCase();
        },
        sub: function (str, data, remove) {
            var obs = [];
            str = str || '';
            obs.push(str.replace(strReplacer, function (whole, inside) {
                var ob = can.getObject(inside, data, remove === true ? false : undefined);
                if (ob === undefined || ob === null) {
                    obs = null;
                    return '';
                }
                if (isContainer(ob) && obs) {
                    obs.push(ob);
                    return '';
                }
                return '' + ob;
            }));
            return obs === null ? obs : obs.length <= 1 ? obs[0] : obs;
        },
        replacer: strReplacer,
        undHash: strUndHash
    });
    return can;
});
/*can/construct/construct*/
define('can/construct/construct', ['can/util/string/string'], function (can) {
    var initializing = 0;
    var canGetDescriptor;
    try {
        Object.getOwnPropertyDescriptor({});
        canGetDescriptor = true;
    } catch (e) {
        canGetDescriptor = false;
    }
    var getDescriptor = function (newProps, name) {
            var descriptor = Object.getOwnPropertyDescriptor(newProps, name);
            if (descriptor && (descriptor.get || descriptor.set)) {
                return descriptor;
            }
            return null;
        }, inheritGetterSetter = function (newProps, oldProps, addTo) {
            addTo = addTo || newProps;
            var descriptor;
            for (var name in newProps) {
                if (descriptor = getDescriptor(newProps, name)) {
                    this._defineProperty(addTo, oldProps, name, descriptor);
                } else {
                    can.Construct._overwrite(addTo, oldProps, name, newProps[name]);
                }
            }
        }, simpleInherit = function (newProps, oldProps, addTo) {
            addTo = addTo || newProps;
            for (var name in newProps) {
                can.Construct._overwrite(addTo, oldProps, name, newProps[name]);
            }
        };
    can.Construct = function () {
        if (arguments.length) {
            return can.Construct.extend.apply(can.Construct, arguments);
        }
    };
    can.extend(can.Construct, {
        constructorExtends: true,
        newInstance: function () {
            var inst = this.instance(), args;
            if (inst.setup) {
                args = inst.setup.apply(inst, arguments);
            }
            if (inst.init) {
                inst.init.apply(inst, args || arguments);
            }
            return inst;
        },
        _inherit: canGetDescriptor ? inheritGetterSetter : simpleInherit,
        _defineProperty: function (what, oldProps, propName, descriptor) {
            Object.defineProperty(what, propName, descriptor);
        },
        _overwrite: function (what, oldProps, propName, val) {
            what[propName] = val;
        },
        setup: function (base, fullName) {
            this.defaults = can.extend(true, {}, base.defaults, this.defaults);
        },
        instance: function () {
            initializing = 1;
            var inst = new this();
            initializing = 0;
            return inst;
        },
        extend: function (name, staticProperties, instanceProperties) {
            var fullName = name, klass = staticProperties, proto = instanceProperties;
            if (typeof fullName !== 'string') {
                proto = klass;
                klass = fullName;
                fullName = null;
            }
            if (!proto) {
                proto = klass;
                klass = null;
            }
            proto = proto || {};
            var _super_class = this, _super = this.prototype, Constructor, parts, current, _fullName, _shortName, propName, shortName, namespace, prototype;
            prototype = this.instance();
            can.Construct._inherit(proto, _super, prototype);
            if (fullName) {
                parts = fullName.split('.');
                shortName = parts.pop();
            }
            if (typeof constructorName === 'undefined') {
                Constructor = function () {
                    return init.apply(this, arguments);
                };
            }
            function init() {
                if (!initializing) {
                    return this.constructor !== Constructor && arguments.length && Constructor.constructorExtends ? Constructor.extend.apply(Constructor, arguments) : Constructor.newInstance.apply(Constructor, arguments);
                }
            }
            for (propName in _super_class) {
                if (_super_class.hasOwnProperty(propName)) {
                    Constructor[propName] = _super_class[propName];
                }
            }
            can.Construct._inherit(klass, _super_class, Constructor);
            if (fullName) {
                current = can.getObject(parts.join('.'), window, true);
                namespace = current;
                _fullName = can.underscore(fullName.replace(/\./g, '_'));
                _shortName = can.underscore(shortName);
                current[shortName] = Constructor;
            }
            can.extend(Constructor, {
                constructor: Constructor,
                prototype: prototype,
                namespace: namespace,
                _shortName: _shortName,
                fullName: fullName,
                _fullName: _fullName
            });
            if (shortName !== undefined) {
                Constructor.shortName = shortName;
            }
            Constructor.prototype.constructor = Constructor;
            var t = [_super_class].concat(can.makeArray(arguments)), args = Constructor.setup.apply(Constructor, t);
            if (Constructor.init) {
                Constructor.init.apply(Constructor, args || t);
            }
            return Constructor;
        }
    });
    can.Construct.prototype.setup = function () {
    };
    can.Construct.prototype.init = function () {
    };
    return can.Construct;
});
/*can/util/bind/bind*/
define('can/util/bind/bind', ['can/util/util'], function (can) {
    can.bindAndSetup = function () {
        can.addEvent.apply(this, arguments);
        if (!this._init) {
            if (!this._bindings) {
                this._bindings = 1;
                if (this._bindsetup) {
                    this._bindsetup();
                }
            } else {
                this._bindings++;
            }
        }
        return this;
    };
    can.unbindAndTeardown = function (event, handler) {
        var handlers = this.__bindEvents[event] || [];
        var handlerCount = handlers.length;
        can.removeEvent.apply(this, arguments);
        if (this._bindings === null) {
            this._bindings = 0;
        } else {
            this._bindings = this._bindings - (handlerCount - handlers.length);
        }
        if (!this._bindings && this._bindteardown) {
            this._bindteardown();
        }
        return this;
    };
    return can;
});
/*can/map/bubble*/
define('can/map/bubble', ['can/util/util'], function (can) {
    var bubble = can.bubble = {
            event: function (map, boundEventName) {
                return map.constructor._bubbleRule(boundEventName, map);
            },
            childrenOf: function (parentMap, eventName) {
                parentMap._each(function (child, prop) {
                    if (child && child.bind) {
                        bubble.toParent(child, parentMap, prop, eventName);
                    }
                });
            },
            teardownChildrenFrom: function (parentMap, eventName) {
                parentMap._each(function (child) {
                    bubble.teardownFromParent(parentMap, child, eventName);
                });
            },
            toParent: function (child, parent, prop, eventName) {
                can.listenTo.call(parent, child, eventName, function () {
                    var args = can.makeArray(arguments), ev = args.shift();
                    args[0] = (can.List && parent instanceof can.List ? parent.indexOf(child) : prop) + (args[0] ? '.' + args[0] : '');
                    ev.triggeredNS = ev.triggeredNS || {};
                    if (ev.triggeredNS[parent._cid]) {
                        return;
                    }
                    ev.triggeredNS[parent._cid] = true;
                    can.trigger(parent, ev, args);
                });
            },
            teardownFromParent: function (parent, child, eventName) {
                if (child && child.unbind) {
                    can.stopListening.call(parent, child, eventName);
                }
            },
            isBubbling: function (parent, eventName) {
                return parent._bubbleBindings && parent._bubbleBindings[eventName];
            },
            bind: function (parent, eventName) {
                if (!parent._init) {
                    var bubbleEvents = bubble.event(parent, eventName), len = bubbleEvents.length, bubbleEvent;
                    if (!parent._bubbleBindings) {
                        parent._bubbleBindings = {};
                    }
                    for (var i = 0; i < len; i++) {
                        bubbleEvent = bubbleEvents[i];
                        if (!parent._bubbleBindings[bubbleEvent]) {
                            parent._bubbleBindings[bubbleEvent] = 1;
                            bubble.childrenOf(parent, bubbleEvent);
                        } else {
                            parent._bubbleBindings[bubbleEvent]++;
                        }
                    }
                }
            },
            unbind: function (parent, eventName) {
                var bubbleEvents = bubble.event(parent, eventName), len = bubbleEvents.length, bubbleEvent;
                for (var i = 0; i < len; i++) {
                    bubbleEvent = bubbleEvents[i];
                    if (parent._bubbleBindings) {
                        parent._bubbleBindings[bubbleEvent]--;
                    }
                    if (parent._bubbleBindings && !parent._bubbleBindings[bubbleEvent]) {
                        delete parent._bubbleBindings[bubbleEvent];
                        bubble.teardownChildrenFrom(parent, bubbleEvent);
                        if (can.isEmptyObject(parent._bubbleBindings)) {
                            delete parent._bubbleBindings;
                        }
                    }
                }
            },
            add: function (parent, child, prop) {
                if (child instanceof can.Map && parent._bubbleBindings) {
                    for (var eventName in parent._bubbleBindings) {
                        if (parent._bubbleBindings[eventName]) {
                            bubble.teardownFromParent(parent, child, eventName);
                            bubble.toParent(child, parent, prop, eventName);
                        }
                    }
                }
            },
            removeMany: function (parent, children) {
                for (var i = 0, len = children.length; i < len; i++) {
                    bubble.remove(parent, children[i]);
                }
            },
            remove: function (parent, child) {
                if (child instanceof can.Map && parent._bubbleBindings) {
                    for (var eventName in parent._bubbleBindings) {
                        if (parent._bubbleBindings[eventName]) {
                            bubble.teardownFromParent(parent, child, eventName);
                        }
                    }
                }
            },
            set: function (parent, prop, value, current) {
                if (can.Map.helpers.isObservable(value)) {
                    bubble.add(parent, value, prop);
                }
                if (can.Map.helpers.isObservable(current)) {
                    bubble.remove(parent, current);
                }
                return value;
            }
        };
    return bubble;
});
/*can/util/batch/batch*/
define('can/util/batch/batch', ['can/util/can'], function (can) {
    var batchNum = 1, transactions = 0, batchEvents = [], stopCallbacks = [], currentBatchEvents = null;
    can.batch = {
        start: function (batchStopHandler) {
            transactions++;
            if (batchStopHandler) {
                stopCallbacks.push(batchStopHandler);
            }
        },
        stop: function (force, callStart) {
            if (force) {
                transactions = 0;
            } else {
                transactions--;
            }
            if (transactions === 0) {
                if (currentBatchEvents !== null) {
                    return;
                }
                currentBatchEvents = batchEvents.slice(0);
                var callbacks = stopCallbacks.slice(0), i, len;
                batchEvents = [];
                stopCallbacks = [];
                can.batch.batchNum = batchNum;
                batchNum++;
                if (callStart) {
                    can.batch.start();
                }
                for (i = 0; i < currentBatchEvents.length; i++) {
                    can.dispatch.apply(currentBatchEvents[i][0], currentBatchEvents[i][1]);
                }
                currentBatchEvents = null;
                for (i = 0, len = callbacks.length; i < callbacks.length; i++) {
                    callbacks[i]();
                }
                can.batch.batchNum = undefined;
            }
        },
        trigger: function (item, event, args) {
            if (!item._init) {
                event = typeof event === 'string' ? { type: event } : event;
                if (currentBatchEvents) {
                    currentBatchEvents.push([
                        item,
                        [
                            event,
                            args
                        ]
                    ]);
                } else if (transactions === 0) {
                    return can.dispatch.call(item, event, args);
                } else {
                    event.batchNum = batchNum;
                    batchEvents.push([
                        item,
                        [
                            event,
                            args
                        ]
                    ]);
                }
            }
        },
        afterPreviousEvents: function (handler) {
            if (currentBatchEvents) {
                var obj = {};
                can.bind.call(obj, 'ready', handler);
                currentBatchEvents.push([
                    obj,
                    [
                        { type: 'ready' },
                        []
                    ]
                ]);
            } else {
                handler();
            }
        }
    };
});
/*can/map/map*/
define('can/map/map', [
    'can/util/util',
    'can/util/bind/bind',
    'can/map/bubble',
    'can/construct/construct',
    'can/util/batch/batch'
], function (can, bind, bubble) {
    var madeMap = null;
    var teardownMap = function () {
        for (var cid in madeMap) {
            if (madeMap[cid].added) {
                delete madeMap[cid].obj._cid;
            }
        }
        madeMap = null;
    };
    var getMapFromObject = function (obj) {
        return madeMap && madeMap[obj._cid] && madeMap[obj._cid].instance;
    };
    var serializeMap = null;
    var Map = can.Map = can.Construct.extend({
            setup: function () {
                can.Construct.setup.apply(this, arguments);
                if (can.Map) {
                    if (!this.defaults) {
                        this.defaults = {};
                    }
                    this._computes = [];
                    for (var prop in this.prototype) {
                        if (prop !== 'define' && prop !== 'constructor' && (typeof this.prototype[prop] !== 'function' || this.prototype[prop].prototype instanceof can.Construct)) {
                            this.defaults[prop] = this.prototype[prop];
                        } else if (this.prototype[prop].isComputed) {
                            this._computes.push(prop);
                        }
                    }
                    if (this.helpers.define) {
                        this.helpers.define(this);
                    }
                }
                if (can.List && !(this.prototype instanceof can.List)) {
                    this.List = Map.List.extend({ Map: this }, {});
                }
            },
            _bubble: bubble,
            _bubbleRule: function (eventName) {
                return eventName === 'change' || eventName.indexOf('.') >= 0 ? ['change'] : [];
            },
            _computes: [],
            bind: can.bindAndSetup,
            on: can.bindAndSetup,
            unbind: can.unbindAndTeardown,
            off: can.unbindAndTeardown,
            id: 'id',
            helpers: {
                define: null,
                attrParts: function (attr, keepKey) {
                    if (keepKey) {
                        return [attr];
                    }
                    return typeof attr === 'object' ? attr : ('' + attr).split('.');
                },
                addToMap: function (obj, instance) {
                    var teardown;
                    if (!madeMap) {
                        teardown = teardownMap;
                        madeMap = {};
                    }
                    var hasCid = obj._cid;
                    var cid = can.cid(obj);
                    if (!madeMap[cid]) {
                        madeMap[cid] = {
                            obj: obj,
                            instance: instance,
                            added: !hasCid
                        };
                    }
                    return teardown;
                },
                isObservable: function (obj) {
                    return obj instanceof can.Map || obj && obj === can.route;
                },
                canMakeObserve: function (obj) {
                    return obj && !can.isDeferred(obj) && (can.isArray(obj) || can.isPlainObject(obj));
                },
                serialize: function (map, how, where) {
                    var cid = can.cid(map), firstSerialize = false;
                    if (!serializeMap) {
                        firstSerialize = true;
                        serializeMap = {
                            attr: {},
                            serialize: {}
                        };
                    }
                    serializeMap[how][cid] = where;
                    map.each(function (val, name) {
                        var result, isObservable = Map.helpers.isObservable(val), serialized = isObservable && serializeMap[how][can.cid(val)];
                        if (serialized) {
                            result = serialized;
                        } else {
                            if (how === 'serialize') {
                                result = Map.helpers._serialize(map, name, val);
                            } else {
                                result = Map.helpers._getValue(map, name, val, how);
                            }
                        }
                        if (result !== undefined) {
                            where[name] = result;
                        }
                    });
                    can.__observe(map, '__keys');
                    if (firstSerialize) {
                        serializeMap = null;
                    }
                    return where;
                },
                _serialize: function (map, name, val) {
                    return Map.helpers._getValue(map, name, val, 'serialize');
                },
                _getValue: function (map, name, val, how) {
                    if (Map.helpers.isObservable(val)) {
                        return val[how]();
                    } else {
                        return val;
                    }
                }
            },
            keys: function (map) {
                var keys = [];
                can.__observe(map, '__keys');
                for (var keyName in map._data) {
                    keys.push(keyName);
                }
                return keys;
            }
        }, {
            setup: function (obj) {
                if (obj instanceof can.Map) {
                    obj = obj.serialize();
                }
                this._data = {};
                can.cid(this, '.map');
                this._init = 1;
                this._computedBindings = {};
                var defaultValues = this._setupDefaults(obj);
                this._setupComputes(defaultValues);
                var teardownMapping = obj && can.Map.helpers.addToMap(obj, this);
                var data = can.extend(can.extend(true, {}, defaultValues), obj);
                this.attr(data);
                if (teardownMapping) {
                    teardownMapping();
                }
                this.bind('change', can.proxy(this._changes, this));
                delete this._init;
            },
            _setupComputes: function () {
                var computes = this.constructor._computes;
                for (var i = 0, len = computes.length, prop; i < len; i++) {
                    prop = computes[i];
                    this[prop] = this[prop].clone(this);
                    this._computedBindings[prop] = { count: 0 };
                }
            },
            _setupDefaults: function () {
                return this.constructor.defaults || {};
            },
            _bindsetup: function () {
            },
            _bindteardown: function () {
            },
            _changes: function (ev, attr, how, newVal, oldVal) {
                can.batch.trigger(this, {
                    type: attr,
                    batchNum: ev.batchNum,
                    target: ev.target
                }, [
                    newVal,
                    oldVal
                ]);
            },
            _triggerChange: function (attr, how, newVal, oldVal) {
                if (bubble.isBubbling(this, 'change')) {
                    can.batch.trigger(this, {
                        type: 'change',
                        target: this
                    }, [
                        attr,
                        how,
                        newVal,
                        oldVal
                    ]);
                } else {
                    can.batch.trigger(this, attr, [
                        newVal,
                        oldVal
                    ]);
                }
                if (how === 'remove' || how === 'add') {
                    can.batch.trigger(this, {
                        type: '__keys',
                        target: this
                    });
                }
            },
            _each: function (callback) {
                var data = this.__get();
                for (var prop in data) {
                    if (data.hasOwnProperty(prop)) {
                        callback(data[prop], prop);
                    }
                }
            },
            attr: function (attr, val) {
                var type = typeof attr;
                if (type !== 'string' && type !== 'number') {
                    return this._attrs(attr, val);
                } else if (arguments.length === 1) {
                    return this._get(attr);
                } else {
                    this._set(attr, val);
                    return this;
                }
            },
            each: function () {
                return can.each.apply(undefined, [this].concat(can.makeArray(arguments)));
            },
            removeAttr: function (attr) {
                var isList = can.List && this instanceof can.List, parts = can.Map.helpers.attrParts(attr), prop = parts.shift(), current = isList ? this[prop] : this._data[prop];
                if (parts.length && current) {
                    return current.removeAttr(parts);
                } else {
                    if (typeof attr === 'string' && !!~attr.indexOf('.')) {
                        prop = attr;
                    }
                    this._remove(prop, current);
                    return current;
                }
            },
            _remove: function (prop, current) {
                if (prop in this._data) {
                    delete this._data[prop];
                    if (!(prop in this.constructor.prototype)) {
                        delete this[prop];
                    }
                    this._triggerChange(prop, 'remove', undefined, current);
                }
            },
            _get: function (attr) {
                attr = '' + attr;
                var dotIndex = attr.indexOf('.');
                if (dotIndex >= 0) {
                    var value = this.__get(attr);
                    if (value !== undefined) {
                        return value;
                    }
                    var first = attr.substr(0, dotIndex), second = attr.substr(dotIndex + 1);
                    can.__observe(this, first);
                    var current = this.__get(first);
                    return current && current._get ? current._get(second) : undefined;
                } else {
                    can.__observe(this, attr);
                    return this.__get(attr);
                }
            },
            __get: function (attr) {
                if (attr) {
                    if (this._computedBindings[attr]) {
                        return this[attr]();
                    } else {
                        return this._data[attr];
                    }
                } else {
                    return this._data;
                }
            },
            __type: function (value, prop) {
                if (!(value instanceof can.Map) && can.Map.helpers.canMakeObserve(value)) {
                    var cached = getMapFromObject(value);
                    if (cached) {
                        return cached;
                    }
                    if (can.isArray(value)) {
                        var List = can.List;
                        return new List(value);
                    } else {
                        var Map = this.constructor.Map || can.Map;
                        return new Map(value);
                    }
                }
                return value;
            },
            _set: function (attr, value, keepKey) {
                attr = '' + attr;
                var dotIndex = attr.indexOf('.'), current;
                if (!keepKey && dotIndex >= 0) {
                    var first = attr.substr(0, dotIndex), second = attr.substr(dotIndex + 1);
                    current = this._init ? undefined : this.__get(first);
                    if (Map.helpers.isObservable(current)) {
                        current._set(second, value);
                    } else {
                        throw 'can.Map: Object does not exist';
                    }
                } else {
                    if (this.__convert) {
                        value = this.__convert(attr, value);
                    }
                    current = this._init ? undefined : this.__get(attr);
                    this.__set(attr, this.__type(value, attr), current);
                }
            },
            __set: function (prop, value, current) {
                if (value !== current) {
                    var changeType = current !== undefined || this.__get().hasOwnProperty(prop) ? 'set' : 'add';
                    this.___set(prop, this.constructor._bubble.set(this, prop, value, current));
                    if (!this._computedBindings[prop]) {
                        this._triggerChange(prop, changeType, value, current);
                    }
                    if (current) {
                        this.constructor._bubble.teardownFromParent(this, current);
                    }
                }
            },
            ___set: function (prop, val) {
                if (this._computedBindings[prop]) {
                    this[prop](val);
                } else {
                    this._data[prop] = val;
                }
                if (typeof this.constructor.prototype[prop] !== 'function' && !this._computedBindings[prop]) {
                    this[prop] = val;
                }
            },
            bind: function (eventName, handler) {
                var computedBinding = this._computedBindings && this._computedBindings[eventName];
                if (computedBinding) {
                    if (!computedBinding.count) {
                        computedBinding.count = 1;
                        var self = this;
                        computedBinding.handler = function (ev, newVal, oldVal) {
                            can.batch.trigger(self, {
                                type: eventName,
                                batchNum: ev.batchNum,
                                target: self
                            }, [
                                newVal,
                                oldVal
                            ]);
                        };
                        this[eventName].bind('change', computedBinding.handler);
                    } else {
                        computedBinding.count++;
                    }
                }
                this.constructor._bubble.bind(this, eventName);
                return can.bindAndSetup.apply(this, arguments);
            },
            unbind: function (eventName, handler) {
                var computedBinding = this._computedBindings && this._computedBindings[eventName];
                if (computedBinding) {
                    if (computedBinding.count === 1) {
                        computedBinding.count = 0;
                        this[eventName].unbind('change', computedBinding.handler);
                        delete computedBinding.handler;
                    } else {
                        computedBinding.count--;
                    }
                }
                this.constructor._bubble.unbind(this, eventName);
                return can.unbindAndTeardown.apply(this, arguments);
            },
            serialize: function () {
                return can.Map.helpers.serialize(this, 'serialize', {});
            },
            _attrs: function (props, remove) {
                if (props === undefined) {
                    return Map.helpers.serialize(this, 'attr', {});
                }
                props = can.simpleExtend({}, props);
                var prop, self = this, newVal;
                can.batch.start();
                this.each(function (curVal, prop) {
                    if (prop === '_cid') {
                        return;
                    }
                    newVal = props[prop];
                    if (newVal === undefined) {
                        if (remove) {
                            self.removeAttr(prop);
                        }
                        return;
                    }
                    if (self.__convert) {
                        newVal = self.__convert(prop, newVal);
                    }
                    if (Map.helpers.isObservable(newVal)) {
                        self.__set(prop, self.__type(newVal, prop), curVal);
                    } else if (Map.helpers.isObservable(curVal) && Map.helpers.canMakeObserve(newVal)) {
                        curVal.attr(newVal, remove);
                    } else if (curVal !== newVal) {
                        self.__set(prop, self.__type(newVal, prop), curVal);
                    }
                    delete props[prop];
                });
                for (prop in props) {
                    if (prop !== '_cid') {
                        newVal = props[prop];
                        this._set(prop, newVal, true);
                    }
                }
                can.batch.stop();
                return this;
            },
            compute: function (prop) {
                if (can.isFunction(this.constructor.prototype[prop])) {
                    return can.compute(this[prop], this);
                } else {
                    var reads = prop.split('.'), last = reads.length - 1, options = { args: [] };
                    return can.compute(function (newVal) {
                        if (arguments.length) {
                            can.compute.read(this, reads.slice(0, last)).value.attr(reads[last], newVal);
                        } else {
                            return can.compute.read(this, reads, options).value;
                        }
                    }, this);
                }
            }
        });
    Map.prototype.on = Map.prototype.bind;
    Map.prototype.off = Map.prototype.unbind;
    return Map;
});
/*can/list/list*/
define('can/list/list', [
    'can/util/util',
    'can/map/map',
    'can/map/bubble'
], function (can, Map, bubble) {
    var splice = [].splice, spliceRemovesProps = function () {
            var obj = {
                    0: 'a',
                    length: 1
                };
            splice.call(obj, 0, 1);
            return !obj[0];
        }();
    var list = Map.extend({ Map: Map }, {
            setup: function (instances, options) {
                this.length = 0;
                can.cid(this, '.map');
                this._init = 1;
                this._computedBindings = {};
                this._setupComputes();
                instances = instances || [];
                var teardownMapping;
                if (can.isDeferred(instances)) {
                    this.replace(instances);
                } else {
                    teardownMapping = instances.length && can.Map.helpers.addToMap(instances, this);
                    this.push.apply(this, can.makeArray(instances || []));
                }
                if (teardownMapping) {
                    teardownMapping();
                }
                this.bind('change', can.proxy(this._changes, this));
                can.simpleExtend(this, options);
                delete this._init;
            },
            _triggerChange: function (attr, how, newVal, oldVal) {
                Map.prototype._triggerChange.apply(this, arguments);
                var index = +attr;
                if (!~('' + attr).indexOf('.') && !isNaN(index)) {
                    if (how === 'add') {
                        can.batch.trigger(this, how, [
                            newVal,
                            index
                        ]);
                        can.batch.trigger(this, 'length', [this.length]);
                    } else if (how === 'remove') {
                        can.batch.trigger(this, how, [
                            oldVal,
                            index
                        ]);
                        can.batch.trigger(this, 'length', [this.length]);
                    } else {
                        can.batch.trigger(this, how, [
                            newVal,
                            index
                        ]);
                    }
                }
            },
            __get: function (attr) {
                if (attr) {
                    if (this[attr] && this[attr].isComputed && can.isFunction(this.constructor.prototype[attr])) {
                        return this[attr]();
                    } else {
                        return this[attr];
                    }
                } else {
                    return this;
                }
            },
            __set: function (prop, value, current) {
                prop = isNaN(+prop) || prop % 1 ? prop : +prop;
                if (typeof prop === 'number' && prop > this.length - 1) {
                    var newArr = new Array(prop + 1 - this.length);
                    newArr[newArr.length - 1] = value;
                    this.push.apply(this, newArr);
                    return newArr;
                }
                return can.Map.prototype.__set.call(this, '' + prop, value, current);
            },
            ___set: function (attr, val) {
                this[attr] = val;
                if (+attr >= this.length) {
                    this.length = +attr + 1;
                }
            },
            _remove: function (prop, current) {
                if (isNaN(+prop)) {
                    delete this[prop];
                    this._triggerChange(prop, 'remove', undefined, current);
                } else {
                    this.splice(prop, 1);
                }
            },
            _each: function (callback) {
                var data = this.__get();
                for (var i = 0; i < data.length; i++) {
                    callback(data[i], i);
                }
            },
            serialize: function () {
                return Map.helpers.serialize(this, 'serialize', []);
            },
            splice: function (index, howMany) {
                var args = can.makeArray(arguments), added = [], i, len, listIndex, allSame = args.length > 2;
                index = index || 0;
                for (i = 0, len = args.length - 2; i < len; i++) {
                    listIndex = i + 2;
                    args[listIndex] = this.__type(args[listIndex], listIndex);
                    added.push(args[listIndex]);
                    if (this[i + index] !== args[listIndex]) {
                        allSame = false;
                    }
                }
                if (allSame && this.length <= added.length) {
                    return added;
                }
                if (howMany === undefined) {
                    howMany = args[1] = this.length - index;
                }
                var removed = splice.apply(this, args);
                if (!spliceRemovesProps) {
                    for (i = this.length; i < removed.length + this.length; i++) {
                        delete this[i];
                    }
                }
                can.batch.start();
                if (howMany > 0) {
                    bubble.removeMany(this, removed);
                    this._triggerChange('' + index, 'remove', undefined, removed);
                }
                if (args.length > 2) {
                    for (i = 0, len = added.length; i < len; i++) {
                        bubble.set(this, i, added[i]);
                    }
                    this._triggerChange('' + index, 'add', added, removed);
                }
                can.batch.stop();
                return removed;
            },
            _attrs: function (items, remove) {
                if (items === undefined) {
                    return Map.helpers.serialize(this, 'attr', []);
                }
                items = can.makeArray(items);
                can.batch.start();
                this._updateAttrs(items, remove);
                can.batch.stop();
            },
            _updateAttrs: function (items, remove) {
                var len = Math.min(items.length, this.length);
                for (var prop = 0; prop < len; prop++) {
                    var curVal = this[prop], newVal = items[prop];
                    if (Map.helpers.isObservable(curVal) && Map.helpers.canMakeObserve(newVal)) {
                        curVal.attr(newVal, remove);
                    } else if (curVal !== newVal) {
                        this._set(prop, newVal);
                    } else {
                    }
                }
                if (items.length > this.length) {
                    this.push.apply(this, items.slice(this.length));
                } else if (items.length < this.length && remove) {
                    this.splice(items.length);
                }
            }
        }), getArgs = function (args) {
            return args[0] && can.isArray(args[0]) ? args[0] : can.makeArray(args);
        };
    can.each({
        push: 'length',
        unshift: 0
    }, function (where, name) {
        var orig = [][name];
        list.prototype[name] = function () {
            var args = [], len = where ? this.length : 0, i = arguments.length, res, val;
            while (i--) {
                val = arguments[i];
                args[i] = bubble.set(this, i, this.__type(val, i));
            }
            res = orig.apply(this, args);
            if (!this.comparator || args.length) {
                this._triggerChange('' + len, 'add', args, undefined);
            }
            return res;
        };
    });
    can.each({
        pop: 'length',
        shift: 0
    }, function (where, name) {
        list.prototype[name] = function () {
            if (!this.length) {
                return undefined;
            }
            var args = getArgs(arguments), len = where && this.length ? this.length - 1 : 0;
            var res = [][name].apply(this, args);
            this._triggerChange('' + len, 'remove', undefined, [res]);
            if (res && res.unbind) {
                bubble.remove(this, res);
            }
            return res;
        };
    });
    can.extend(list.prototype, {
        indexOf: function (item, fromIndex) {
            this.attr('length');
            return can.inArray(item, this, fromIndex);
        },
        join: function () {
            return [].join.apply(this.attr(), arguments);
        },
        reverse: function () {
            var list = [].reverse.call(can.makeArray(this));
            this.replace(list);
        },
        slice: function () {
            var temp = Array.prototype.slice.apply(this, arguments);
            return new this.constructor(temp);
        },
        concat: function () {
            var args = [];
            can.each(can.makeArray(arguments), function (arg, i) {
                args[i] = arg instanceof can.List ? arg.serialize() : arg;
            });
            return new this.constructor(Array.prototype.concat.apply(this.serialize(), args));
        },
        forEach: function (cb, thisarg) {
            return can.each(this, cb, thisarg || this);
        },
        replace: function (newList) {
            if (can.isDeferred(newList)) {
                newList.then(can.proxy(this.replace, this));
            } else {
                this.splice.apply(this, [
                    0,
                    this.length
                ].concat(can.makeArray(newList || [])));
            }
            return this;
        },
        filter: function (callback, thisArg) {
            var filteredList = new can.List(), self = this, filtered;
            this.each(function (item, index, list) {
                filtered = callback.call(thisArg | self, item, index, self);
                if (filtered) {
                    filteredList.push(item);
                }
            });
            return filteredList;
        }
    });
    can.List = Map.List = list;
    return can.List;
});
/*can/control/control*/
define('can/control/control', [
    'can/util/util',
    'can/construct/construct'
], function (can) {
    var bind = function (el, ev, callback) {
            can.bind.call(el, ev, callback);
            return function () {
                can.unbind.call(el, ev, callback);
            };
        }, isFunction = can.isFunction, extend = can.extend, each = can.each, slice = [].slice, paramReplacer = /\{([^\}]+)\}/g, special = can.getObject('$.event.special', [can]) || {}, delegate = function (el, selector, ev, callback) {
            can.delegate.call(el, selector, ev, callback);
            return function () {
                can.undelegate.call(el, selector, ev, callback);
            };
        }, binder = function (el, ev, callback, selector) {
            return selector ? delegate(el, can.trim(selector), ev, callback) : bind(el, ev, callback);
        }, basicProcessor;
    var Control = can.Control = can.Construct({
            setup: function () {
                can.Construct.setup.apply(this, arguments);
                if (can.Control) {
                    var control = this, funcName;
                    control.actions = {};
                    for (funcName in control.prototype) {
                        if (control._isAction(funcName)) {
                            control.actions[funcName] = control._action(funcName);
                        }
                    }
                }
            },
            _shifter: function (context, name) {
                var method = typeof name === 'string' ? context[name] : name;
                if (!isFunction(method)) {
                    method = context[method];
                }
                return function () {
                    context.called = name;
                    return method.apply(context, [this.nodeName ? can.$(this) : this].concat(slice.call(arguments, 0)));
                };
            },
            _isAction: function (methodName) {
                var val = this.prototype[methodName], type = typeof val;
                return methodName !== 'constructor' && (type === 'function' || type === 'string' && isFunction(this.prototype[val])) && !!(special[methodName] || processors[methodName] || /[^\w]/.test(methodName));
            },
            _action: function (methodName, options) {
                paramReplacer.lastIndex = 0;
                if (options || !paramReplacer.test(methodName)) {
                    var convertedName = options ? can.sub(methodName, this._lookup(options)) : methodName;
                    if (!convertedName) {
                        return null;
                    }
                    var arr = can.isArray(convertedName), name = arr ? convertedName[1] : convertedName, parts = name.split(/\s+/g), event = parts.pop();
                    return {
                        processor: processors[event] || basicProcessor,
                        parts: [
                            name,
                            parts.join(' '),
                            event
                        ],
                        delegate: arr ? convertedName[0] : undefined
                    };
                }
            },
            _lookup: function (options) {
                return [
                    options,
                    window
                ];
            },
            processors: {},
            defaults: {}
        }, {
            setup: function (element, options) {
                var cls = this.constructor, pluginname = cls.pluginName || cls._fullName, arr;
                this.element = can.$(element);
                if (pluginname && pluginname !== 'can_control') {
                    this.element.addClass(pluginname);
                }
                arr = can.data(this.element, 'controls');
                if (!arr) {
                    arr = [];
                    can.data(this.element, 'controls', arr);
                }
                arr.push(this);
                this.options = extend({}, cls.defaults, options);
                this.on();
                return [
                    this.element,
                    this.options
                ];
            },
            on: function (el, selector, eventName, func) {
                if (!el) {
                    this.off();
                    var cls = this.constructor, bindings = this._bindings, actions = cls.actions, element = this.element, destroyCB = can.Control._shifter(this, 'destroy'), funcName, ready;
                    for (funcName in actions) {
                        if (actions.hasOwnProperty(funcName)) {
                            ready = actions[funcName] || cls._action(funcName, this.options, this);
                            if (ready) {
                                bindings.control[funcName] = ready.processor(ready.delegate || element, ready.parts[2], ready.parts[1], funcName, this);
                            }
                        }
                    }
                    can.bind.call(element, 'removed', destroyCB);
                    bindings.user.push(function (el) {
                        can.unbind.call(el, 'removed', destroyCB);
                    });
                    return bindings.user.length;
                }
                if (typeof el === 'string') {
                    func = eventName;
                    eventName = selector;
                    selector = el;
                    el = this.element;
                }
                if (func === undefined) {
                    func = eventName;
                    eventName = selector;
                    selector = null;
                }
                if (typeof func === 'string') {
                    func = can.Control._shifter(this, func);
                }
                this._bindings.user.push(binder(el, eventName, func, selector));
                return this._bindings.user.length;
            },
            off: function () {
                var el = this.element[0], bindings = this._bindings;
                if (bindings) {
                    each(bindings.user || [], function (value) {
                        value(el);
                    });
                    each(bindings.control || {}, function (value) {
                        value(el);
                    });
                }
                this._bindings = {
                    user: [],
                    control: {}
                };
            },
            destroy: function () {
                if (this.element === null) {
                    return;
                }
                var Class = this.constructor, pluginName = Class.pluginName || Class._fullName, controls;
                this.off();
                if (pluginName && pluginName !== 'can_control') {
                    this.element.removeClass(pluginName);
                }
                controls = can.data(this.element, 'controls');
                controls.splice(can.inArray(this, controls), 1);
                can.trigger(this, 'destroyed');
                this.element = null;
            }
        });
    var processors = can.Control.processors;
    basicProcessor = function (el, event, selector, methodName, control) {
        return binder(el, event, can.Control._shifter(control, methodName), selector);
    };
    each([
        'change',
        'click',
        'contextmenu',
        'dblclick',
        'keydown',
        'keyup',
        'keypress',
        'mousedown',
        'mousemove',
        'mouseout',
        'mouseover',
        'mouseup',
        'reset',
        'resize',
        'scroll',
        'select',
        'submit',
        'focusin',
        'focusout',
        'mouseenter',
        'mouseleave',
        'touchstart',
        'touchmove',
        'touchcancel',
        'touchend',
        'touchleave',
        'inserted',
        'removed'
    ], function (v) {
        processors[v] = basicProcessor;
    });
    return Control;
});
/*can/util/string/deparam/deparam*/
define('can/util/string/deparam/deparam', [
    'can/util/util',
    'can/util/string/string'
], function (can) {
    var digitTest = /^\d+$/, keyBreaker = /([^\[\]]+)|(\[\])/g, paramTest = /([^?#]*)(#.*)?$/, prep = function (str) {
            return decodeURIComponent(str.replace(/\+/g, ' '));
        };
    can.extend(can, {
        deparam: function (params) {
            var data = {}, pairs, lastPart;
            if (params && paramTest.test(params)) {
                pairs = params.split('&');
                can.each(pairs, function (pair) {
                    var parts = pair.split('='), key = prep(parts.shift()), value = prep(parts.join('=')), current = data;
                    if (key) {
                        parts = key.match(keyBreaker);
                        for (var j = 0, l = parts.length - 1; j < l; j++) {
                            if (!current[parts[j]]) {
                                current[parts[j]] = digitTest.test(parts[j + 1]) || parts[j + 1] === '[]' ? [] : {};
                            }
                            current = current[parts[j]];
                        }
                        lastPart = parts.pop();
                        if (lastPart === '[]') {
                            current.push(value);
                        } else {
                            current[lastPart] = value;
                        }
                    }
                });
            }
            return data;
        }
    });
    return can;
});
/*can/route/route*/
define('can/route/route', [
    'can/util/util',
    'can/map/map',
    'can/list/list',
    'can/util/string/deparam/deparam'
], function (can) {
    var matcher = /\:([\w\.]+)/g, paramsMatcher = /^(?:&[^=]+=[^&]*)+/, makeProps = function (props) {
            var tags = [];
            can.each(props, function (val, name) {
                tags.push((name === 'className' ? 'class' : name) + '="' + (name === 'href' ? val : can.esc(val)) + '"');
            });
            return tags.join(' ');
        }, matchesData = function (route, data) {
            var count = 0, i = 0, defaults = {};
            for (var name in route.defaults) {
                if (route.defaults[name] === data[name]) {
                    defaults[name] = 1;
                    count++;
                }
            }
            for (; i < route.names.length; i++) {
                if (!data.hasOwnProperty(route.names[i])) {
                    return -1;
                }
                if (!defaults[route.names[i]]) {
                    count++;
                }
            }
            return count;
        }, location = window.location, wrapQuote = function (str) {
            return (str + '').replace(/([.?*+\^$\[\]\\(){}|\-])/g, '\\$1');
        }, each = can.each, extend = can.extend, stringify = function (obj) {
            if (obj && typeof obj === 'object') {
                if (obj instanceof can.Map) {
                    obj = obj.attr();
                } else {
                    obj = can.isFunction(obj.slice) ? obj.slice() : can.extend({}, obj);
                }
                can.each(obj, function (val, prop) {
                    obj[prop] = stringify(val);
                });
            } else if (obj !== undefined && obj !== null && can.isFunction(obj.toString)) {
                obj = obj.toString();
            }
            return obj;
        }, removeBackslash = function (str) {
            return str.replace(/\\/g, '');
        }, timer, curParams, lastHash, changingData, changedAttrs = [], onRouteDataChange = function (ev, attr, how, newval) {
            changingData = 1;
            changedAttrs.push(attr);
            clearTimeout(timer);
            timer = setTimeout(function () {
                changingData = 0;
                var serialized = can.route.data.serialize(), path = can.route.param(serialized, true);
                can.route._call('setURL', path, changedAttrs);
                can.batch.trigger(eventsObject, '__url', [
                    path,
                    lastHash
                ]);
                lastHash = path;
                changedAttrs = [];
            }, 10);
        }, eventsObject = can.extend({}, can.event);
    can.route = function (url, defaults) {
        var root = can.route._call('root');
        if (root.lastIndexOf('/') === root.length - 1 && url.indexOf('/') === 0) {
            url = url.substr(1);
        }
        defaults = defaults || {};
        var names = [], res, test = '', lastIndex = matcher.lastIndex = 0, next, querySeparator = can.route._call('querySeparator'), matchSlashes = can.route._call('matchSlashes');
        while (res = matcher.exec(url)) {
            names.push(res[1]);
            test += removeBackslash(url.substring(lastIndex, matcher.lastIndex - res[0].length));
            next = '\\' + (removeBackslash(url.substr(matcher.lastIndex, 1)) || querySeparator + (matchSlashes ? '' : '|/'));
            test += '([^' + next + ']' + (defaults[res[1]] ? '*' : '+') + ')';
            lastIndex = matcher.lastIndex;
        }
        test += url.substr(lastIndex).replace('\\', '');
        can.route.routes[url] = {
            test: new RegExp('^' + test + '($|' + wrapQuote(querySeparator) + ')'),
            route: url,
            names: names,
            defaults: defaults,
            length: url.split('/').length
        };
        return can.route;
    };
    extend(can.route, {
        param: function (data, _setRoute) {
            var route, matches = 0, matchCount, routeName = data.route, propCount = 0;
            delete data.route;
            each(data, function () {
                propCount++;
            });
            each(can.route.routes, function (temp, name) {
                matchCount = matchesData(temp, data);
                if (matchCount > matches) {
                    route = temp;
                    matches = matchCount;
                }
                if (matchCount >= propCount) {
                    return false;
                }
            });
            if (can.route.routes[routeName] && matchesData(can.route.routes[routeName], data) === matches) {
                route = can.route.routes[routeName];
            }
            if (route) {
                var cpy = extend({}, data), res = route.route.replace(matcher, function (whole, name) {
                        delete cpy[name];
                        return data[name] === route.defaults[name] ? '' : encodeURIComponent(data[name]);
                    }).replace('\\', ''), after;
                each(route.defaults, function (val, name) {
                    if (cpy[name] === val) {
                        delete cpy[name];
                    }
                });
                after = can.param(cpy);
                if (_setRoute) {
                    can.route.attr('route', route.route);
                }
                return res + (after ? can.route._call('querySeparator') + after : '');
            }
            return can.isEmptyObject(data) ? '' : can.route._call('querySeparator') + can.param(data);
        },
        deparam: function (url) {
            var root = can.route._call('root');
            if (root.lastIndexOf('/') === root.length - 1 && url.indexOf('/') === 0) {
                url = url.substr(1);
            }
            var route = { length: -1 }, querySeparator = can.route._call('querySeparator'), paramsMatcher = can.route._call('paramsMatcher');
            each(can.route.routes, function (temp, name) {
                if (temp.test.test(url) && temp.length > route.length) {
                    route = temp;
                }
            });
            if (route.length > -1) {
                var parts = url.match(route.test), start = parts.shift(), remainder = url.substr(start.length - (parts[parts.length - 1] === querySeparator ? 1 : 0)), obj = remainder && paramsMatcher.test(remainder) ? can.deparam(remainder.slice(1)) : {};
                obj = extend(true, {}, route.defaults, obj);
                each(parts, function (part, i) {
                    if (part && part !== querySeparator) {
                        obj[route.names[i]] = decodeURIComponent(part);
                    }
                });
                obj.route = route.route;
                return obj;
            }
            if (url.charAt(0) !== querySeparator) {
                url = querySeparator + url;
            }
            return paramsMatcher.test(url) ? can.deparam(url.slice(1)) : {};
        },
        data: new can.Map({}),
        map: function (data) {
            var appState;
            if (data.prototype instanceof can.Map) {
                appState = new data();
            } else {
                appState = data;
            }
            can.route.data = appState;
        },
        routes: {},
        ready: function (val) {
            if (val !== true) {
                can.route._setup();
                can.route.setState();
            }
            return can.route;
        },
        url: function (options, merge) {
            if (merge) {
                options = can.extend({}, can.route.deparam(can.route._call('matchingPartOfURL')), options);
            }
            return can.route._call('root') + can.route.param(options);
        },
        link: function (name, options, props, merge) {
            return '<a ' + makeProps(extend({ href: can.route.url(options, merge) }, props)) + '>' + name + '</a>';
        },
        current: function (options) {
            can.__observe(eventsObject, '__url');
            return this._call('matchingPartOfURL') === can.route.param(options);
        },
        bindings: {
            hashchange: {
                paramsMatcher: paramsMatcher,
                querySeparator: '&',
                matchSlashes: false,
                bind: function () {
                    can.bind.call(window, 'hashchange', setState);
                },
                unbind: function () {
                    can.unbind.call(window, 'hashchange', setState);
                },
                matchingPartOfURL: function () {
                    return location.href.split(/#!?/)[1] || '';
                },
                setURL: function (path) {
                    if (location.hash !== '#' + path) {
                        location.hash = '!' + path;
                    }
                    return path;
                },
                root: '#!'
            }
        },
        defaultBinding: 'hashchange',
        currentBinding: null,
        _setup: function () {
            if (!can.route.currentBinding) {
                can.route._call('bind');
                can.route.bind('change', onRouteDataChange);
                can.route.currentBinding = can.route.defaultBinding;
            }
        },
        _teardown: function () {
            if (can.route.currentBinding) {
                can.route._call('unbind');
                can.route.unbind('change', onRouteDataChange);
                can.route.currentBinding = null;
            }
            clearTimeout(timer);
            changingData = 0;
        },
        _call: function () {
            var args = can.makeArray(arguments), prop = args.shift(), binding = can.route.bindings[can.route.currentBinding || can.route.defaultBinding], method = binding[prop];
            if (method.apply) {
                return method.apply(binding, args);
            } else {
                return method;
            }
        }
    });
    each([
        'bind',
        'unbind',
        'on',
        'off',
        'delegate',
        'undelegate',
        'removeAttr',
        'compute',
        '_get',
        '__get',
        'each'
    ], function (name) {
        can.route[name] = function () {
            if (!can.route.data[name]) {
                return;
            }
            return can.route.data[name].apply(can.route.data, arguments);
        };
    });
    can.route.attr = function (attr, val) {
        var type = typeof attr, newArguments;
        if (val === undefined) {
            newArguments = arguments;
        } else if (type !== 'string' && type !== 'number') {
            newArguments = [
                stringify(attr),
                val
            ];
        } else {
            newArguments = [
                attr,
                stringify(val)
            ];
        }
        return can.route.data.attr.apply(can.route.data, newArguments);
    };
    var setState = can.route.setState = function () {
            var hash = can.route._call('matchingPartOfURL');
            var oldParams = curParams;
            curParams = can.route.deparam(hash);
            if (!changingData || hash !== lastHash) {
                can.batch.start();
                recursiveClean(oldParams, curParams, can.route.data);
                can.route.attr(curParams);
                can.batch.trigger(eventsObject, '__url', [
                    hash,
                    lastHash
                ]);
                can.batch.stop();
            }
        };
    var recursiveClean = function (old, cur, data) {
        for (var attr in old) {
            if (cur[attr] === undefined) {
                data.removeAttr(attr);
            } else if (Object.prototype.toString.call(old[attr]) === '[object Object]') {
                recursiveClean(old[attr], cur[attr], data.attr(attr));
            }
        }
    };
    return can.route;
});
/*can/control/route/route*/
define('can/control/route/route', [
    'can/util/util',
    'can/route/route',
    'can/control/control'
], function (can) {
    can.Control.processors.route = function (el, event, selector, funcName, controller) {
        selector = selector || '';
        if (!can.route.routes[selector]) {
            if (selector[0] === '/') {
                selector = selector.substring(1);
            }
            can.route(selector);
        }
        var batchNum, check = function (ev, attr, how) {
                if (can.route.attr('route') === selector && (ev.batchNum === undefined || ev.batchNum !== batchNum)) {
                    batchNum = ev.batchNum;
                    var d = can.route.attr();
                    delete d.route;
                    if (can.isFunction(controller[funcName])) {
                        controller[funcName](d);
                    } else {
                        controller[controller[funcName]](d);
                    }
                }
            };
        can.route.bind('change', check);
        return function () {
            can.route.unbind('change', check);
        };
    };
    return can;
});
/*[global-shim-end]*/
(function (){
  window._define = window.define;
  window.define = window.define.orig;
  window.System = window.System.orig;
})();