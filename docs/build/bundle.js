
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Fields.svelte generated by Svelte v3.46.4 */

    const file$6 = "src\\Fields.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[7] = list;
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (16:1) {#each game.fields as _, i}
    function create_each_block(ctx) {
    	let div;
    	let input;
    	let input_disabled_value;
    	let input_class_value;
    	let input_placeholder_value;
    	let i = /*i*/ ctx[8];
    	let t;
    	let mounted;
    	let dispose;
    	const assign_input = () => /*input_binding*/ ctx[4](input, i);
    	const unassign_input = () => /*input_binding*/ ctx[4](null, i);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			input.disabled = input_disabled_value = /*i*/ ctx[8] != /*game*/ ctx[0].guesses;
    			attr_dev(input, "class", input_class_value = "" + (/*game*/ ctx[0].statuses[/*i*/ ctx[8]] + " bg-transparent border focus:outline outline-2 outline-white placeholder:text-neutral-200 select-none p-1.5 text-xl w-full" + " svelte-1pz73f6"));

    			attr_dev(input, "placeholder", input_placeholder_value = /*i*/ ctx[8] == /*game*/ ctx[0].guesses
    			? "Search for a song..."
    			: "");

    			add_location(input, file$6, 22, 3, 439);
    			attr_dev(div, "class", "bg-gradient-to-t from-primary2-500/20 to-secondary2-500/70 w-full h-10 mt-2");
    			set_style(div, "background-size", "100% " + /*bgHeight*/ ctx[1] + "px");
    			set_style(div, "background-position", "0 -" + /*i*/ ctx[8] * 100 + "%");
    			add_location(div, file$6, 16, 2, 245);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			assign_input();
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(input, "keydown", /*kd*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*game*/ 1 && input_disabled_value !== (input_disabled_value = /*i*/ ctx[8] != /*game*/ ctx[0].guesses)) {
    				prop_dev(input, "disabled", input_disabled_value);
    			}

    			if (dirty & /*game*/ 1 && input_class_value !== (input_class_value = "" + (/*game*/ ctx[0].statuses[/*i*/ ctx[8]] + " bg-transparent border focus:outline outline-2 outline-white placeholder:text-neutral-200 select-none p-1.5 text-xl w-full" + " svelte-1pz73f6"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*game*/ 1 && input_placeholder_value !== (input_placeholder_value = /*i*/ ctx[8] == /*game*/ ctx[0].guesses
    			? "Search for a song..."
    			: "")) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}

    			if (i !== /*i*/ ctx[8]) {
    				unassign_input();
    				i = /*i*/ ctx[8];
    				assign_input();
    			}

    			if (dirty & /*bgHeight*/ 2) {
    				set_style(div, "background-size", "100% " + /*bgHeight*/ ctx[1] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			unassign_input();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(16:1) {#each game.fields as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let div_resize_listener;
    	let each_value = /*game*/ ctx[0].fields;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_render_callback(() => /*div_elementresize_handler*/ ctx[5].call(div));
    			add_location(div, file$6, 14, 0, 177);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[5].bind(div));
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*bgHeight, game, kd*/ 7) {
    				each_value = /*game*/ ctx[0].fields;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			div_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Fields', slots, []);
    	let { game } = $$props;
    	let { submit } = $$props;

    	function kd(e) {
    		if (e.key === "Enter") {
    			submit();
    			e.preventDefault();
    		}
    	}

    	let bgHeight;
    	const writable_props = ['game', 'submit'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Fields> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			game.fields[i] = $$value;
    			$$invalidate(0, game);
    		});
    	}

    	function div_elementresize_handler() {
    		bgHeight = this.clientHeight;
    		$$invalidate(1, bgHeight);
    	}

    	$$self.$$set = $$props => {
    		if ('game' in $$props) $$invalidate(0, game = $$props.game);
    		if ('submit' in $$props) $$invalidate(3, submit = $$props.submit);
    	};

    	$$self.$capture_state = () => ({ game, submit, kd, bgHeight });

    	$$self.$inject_state = $$props => {
    		if ('game' in $$props) $$invalidate(0, game = $$props.game);
    		if ('submit' in $$props) $$invalidate(3, submit = $$props.submit);
    		if ('bgHeight' in $$props) $$invalidate(1, bgHeight = $$props.bgHeight);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [game, bgHeight, kd, submit, input_binding, div_elementresize_handler];
    }

    class Fields extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { game: 0, submit: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fields",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*game*/ ctx[0] === undefined && !('game' in props)) {
    			console.warn("<Fields> was created without expected prop 'game'");
    		}

    		if (/*submit*/ ctx[3] === undefined && !('submit' in props)) {
    			console.warn("<Fields> was created without expected prop 'submit'");
    		}
    	}

    	get game() {
    		throw new Error("<Fields>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set game(value) {
    		throw new Error("<Fields>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get submit() {
    		throw new Error("<Fields>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submit(value) {
    		throw new Error("<Fields>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Player.svelte generated by Svelte v3.46.4 */

    const file$5 = "src\\Player.svelte";

    function create_fragment$5(ctx) {
    	let div7;
    	let div1;
    	let div0;
    	let div0_class_value;
    	let t0;
    	let div2;
    	let t1;
    	let div3;
    	let t2;
    	let div4;
    	let t3;
    	let div5;
    	let t4;
    	let div6;
    	let div7_resize_listener;
    	let t5;
    	let div10;
    	let div8;
    	let t6;
    	let t7_value = /*formatNum1*/ ctx[5](/*secPos*/ ctx[3]) + "";
    	let t7;
    	let t8;
    	let button;
    	let button_disabled_value;
    	let t9;
    	let div9;
    	let t10_value = /*formatNum2*/ ctx[6](/*secDur*/ ctx[2]) + "";
    	let t10;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			t1 = space();
    			div3 = element("div");
    			t2 = space();
    			div4 = element("div");
    			t3 = space();
    			div5 = element("div");
    			t4 = space();
    			div6 = element("div");
    			t5 = space();
    			div10 = element("div");
    			div8 = element("div");
    			t6 = text("0:");
    			t7 = text(t7_value);
    			t8 = space();
    			button = element("button");
    			t9 = space();
    			div9 = element("div");
    			t10 = text(t10_value);
    			set_style(div0, "width", /*secPos*/ ctx[3] / /*secDur*/ ctx[2] * 100 + "%");
    			set_style(div0, "background-size", /*barWidth*/ ctx[4] + "px 100%");

    			attr_dev(div0, "class", div0_class_value = "h-full border-r box-content border-skipped-900 bg-gradient-to-r f " + (!/*status*/ ctx[0].paused
    			? 'from-correct-500 via-incorrect-500 to-incorrect-500'
    			: 'from-correct-500/50 via-incorrect-500/50 to-incorrect-500/50'));

    			add_location(div0, file$5, 27, 8, 704);
    			attr_dev(div1, "class", "h-full absolute bg-white/30 overflow-hidden");
    			set_style(div1, "width", /*secDur*/ ctx[2] / 16 * 100 + "%");
    			add_location(div1, file$5, 23, 4, 576);
    			attr_dev(div2, "class", "w-px h-full absolute bg-white left-1/16");
    			add_location(div2, file$5, 36, 4, 1123);
    			attr_dev(div3, "class", "w-px h-full absolute bg-white left-2/16");
    			add_location(div3, file$5, 37, 4, 1184);
    			attr_dev(div4, "class", "w-px h-full absolute bg-white left-4/16");
    			add_location(div4, file$5, 38, 4, 1245);
    			attr_dev(div5, "class", "w-px h-full absolute bg-white left-7/16");
    			add_location(div5, file$5, 39, 4, 1306);
    			attr_dev(div6, "class", "w-px h-full absolute bg-white left-11/16");
    			add_location(div6, file$5, 40, 4, 1367);
    			attr_dev(div7, "class", "border border-2 h-5 relative overflow-hidden");
    			add_render_callback(() => /*div7_elementresize_handler*/ ctx[7].call(div7));
    			add_location(div7, file$5, 19, 0, 472);
    			attr_dev(div8, "class", "left-0 top-0 absolute");
    			add_location(div8, file$5, 44, 4, 1485);
    			attr_dev(button, "class", "animation svelte-12tsr5v");
    			button.disabled = button_disabled_value = !/*status*/ ctx[0].ready;
    			toggle_class(button, "playing", !/*status*/ ctx[0].paused);
    			add_location(button, file$5, 47, 4, 1570);
    			attr_dev(div9, "class", "right-0 top-0 absolute");
    			add_location(div9, file$5, 53, 4, 1719);
    			attr_dev(div10, "class", "mt-4 text-xl relative h-[74px]");
    			add_location(div10, file$5, 43, 0, 1435);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div1);
    			append_dev(div1, div0);
    			append_dev(div7, t0);
    			append_dev(div7, div2);
    			append_dev(div7, t1);
    			append_dev(div7, div3);
    			append_dev(div7, t2);
    			append_dev(div7, div4);
    			append_dev(div7, t3);
    			append_dev(div7, div5);
    			append_dev(div7, t4);
    			append_dev(div7, div6);
    			div7_resize_listener = add_resize_listener(div7, /*div7_elementresize_handler*/ ctx[7].bind(div7));
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div8);
    			append_dev(div8, t6);
    			append_dev(div8, t7);
    			append_dev(div10, t8);
    			append_dev(div10, button);
    			append_dev(div10, t9);
    			append_dev(div10, div9);
    			append_dev(div9, t10);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*toggle*/ ctx[1])) /*toggle*/ ctx[1].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*secPos, secDur*/ 12) {
    				set_style(div0, "width", /*secPos*/ ctx[3] / /*secDur*/ ctx[2] * 100 + "%");
    			}

    			if (dirty & /*barWidth*/ 16) {
    				set_style(div0, "background-size", /*barWidth*/ ctx[4] + "px 100%");
    			}

    			if (dirty & /*status*/ 1 && div0_class_value !== (div0_class_value = "h-full border-r box-content border-skipped-900 bg-gradient-to-r f " + (!/*status*/ ctx[0].paused
    			? 'from-correct-500 via-incorrect-500 to-incorrect-500'
    			: 'from-correct-500/50 via-incorrect-500/50 to-incorrect-500/50'))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*secDur*/ 4) {
    				set_style(div1, "width", /*secDur*/ ctx[2] / 16 * 100 + "%");
    			}

    			if (dirty & /*secPos*/ 8 && t7_value !== (t7_value = /*formatNum1*/ ctx[5](/*secPos*/ ctx[3]) + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*status*/ 1 && button_disabled_value !== (button_disabled_value = !/*status*/ ctx[0].ready)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*status*/ 1) {
    				toggle_class(button, "playing", !/*status*/ ctx[0].paused);
    			}

    			if (dirty & /*secDur*/ 4 && t10_value !== (t10_value = /*formatNum2*/ ctx[6](/*secDur*/ ctx[2]) + "")) set_data_dev(t10, t10_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			div7_resize_listener();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div10);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Player', slots, []);
    	let { status } = $$props;
    	let { toggle } = $$props;
    	let secDur = 0;
    	let secPos = 0;
    	const formatNum1 = n => n > 9 ? Math.floor(n) : "0" + Math.floor(n);

    	const formatNum2 = n => {
    		let min = Math.floor(Math.floor(n) / 60);
    		let s = Math.floor(Math.floor(n)) % 60;
    		return `${min}:${formatNum1(s)}`;
    	};

    	let barWidth;
    	const writable_props = ['status', 'toggle'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Player> was created with unknown prop '${key}'`);
    	});

    	function div7_elementresize_handler() {
    		barWidth = this.clientWidth;
    		$$invalidate(4, barWidth);
    	}

    	$$self.$$set = $$props => {
    		if ('status' in $$props) $$invalidate(0, status = $$props.status);
    		if ('toggle' in $$props) $$invalidate(1, toggle = $$props.toggle);
    	};

    	$$self.$capture_state = () => ({
    		status,
    		toggle,
    		secDur,
    		secPos,
    		formatNum1,
    		formatNum2,
    		barWidth
    	});

    	$$self.$inject_state = $$props => {
    		if ('status' in $$props) $$invalidate(0, status = $$props.status);
    		if ('toggle' in $$props) $$invalidate(1, toggle = $$props.toggle);
    		if ('secDur' in $$props) $$invalidate(2, secDur = $$props.secDur);
    		if ('secPos' in $$props) $$invalidate(3, secPos = $$props.secPos);
    		if ('barWidth' in $$props) $$invalidate(4, barWidth = $$props.barWidth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*status*/ 1) {
    			$$invalidate(2, secDur = status.dur / 1000);
    		}

    		if ($$self.$$.dirty & /*status*/ 1) {
    			$$invalidate(3, secPos = status.pos / 1000);
    		}
    	};

    	return [
    		status,
    		toggle,
    		secDur,
    		secPos,
    		barWidth,
    		formatNum1,
    		formatNum2,
    		div7_elementresize_handler
    	];
    }

    class Player extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { status: 0, toggle: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Player",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*status*/ ctx[0] === undefined && !('status' in props)) {
    			console.warn("<Player> was created without expected prop 'status'");
    		}

    		if (/*toggle*/ ctx[1] === undefined && !('toggle' in props)) {
    			console.warn("<Player> was created without expected prop 'toggle'");
    		}
    	}

    	get status() {
    		throw new Error("<Player>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set status(value) {
    		throw new Error("<Player>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<Player>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<Player>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Buttons.svelte generated by Svelte v3.46.4 */

    const file$4 = "src\\Buttons.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let button0;
    	let t0;

    	let t1_value = (/*addSeconds*/ ctx[3]
    	? ` (+${/*addSeconds*/ ctx[3]}s)`
    	: "") + "";

    	let t1;
    	let t2;
    	let button1;
    	let button1_resize_listener;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text("Skip");
    			t1 = text(t1_value);
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Submit";
    			attr_dev(button0, "class", "mr-2 w-full h-full text-xl p-5 bg-neutral-500/50 touch:active:bg-neutral-500/70 mouse:hover:bg-neutral-500/70");
    			add_location(button0, file$4, 8, 4, 145);
    			attr_dev(button1, "class", "ml-2 w-full h-full text-xl p-5 bg-submit-700/50 touch:active:bg-submit-700/70 mouse:hover:bg-submit-700/70");
    			add_render_callback(() => /*button1_elementresize_handler*/ ctx[4].call(button1));
    			add_location(button1, file$4, 17, 4, 395);
    			attr_dev(div, "class", "flex");
    			add_location(div, file$4, 7, 0, 121);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(button0, t1);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			button1_resize_listener = add_resize_listener(button1, /*button1_elementresize_handler*/ ctx[4].bind(button1));

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*skip*/ ctx[2])) /*skip*/ ctx[2].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*submit*/ ctx[1])) /*submit*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*addSeconds*/ 8 && t1_value !== (t1_value = (/*addSeconds*/ ctx[3]
    			? ` (+${/*addSeconds*/ ctx[3]}s)`
    			: "") + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			button1_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Buttons', slots, []);
    	let { submit } = $$props;
    	let { skip } = $$props;
    	let { addSeconds } = $$props;
    	let { height } = $$props;
    	const writable_props = ['submit', 'skip', 'addSeconds', 'height'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Buttons> was created with unknown prop '${key}'`);
    	});

    	function button1_elementresize_handler() {
    		height = this.clientHeight;
    		$$invalidate(0, height);
    	}

    	$$self.$$set = $$props => {
    		if ('submit' in $$props) $$invalidate(1, submit = $$props.submit);
    		if ('skip' in $$props) $$invalidate(2, skip = $$props.skip);
    		if ('addSeconds' in $$props) $$invalidate(3, addSeconds = $$props.addSeconds);
    		if ('height' in $$props) $$invalidate(0, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({ submit, skip, addSeconds, height });

    	$$self.$inject_state = $$props => {
    		if ('submit' in $$props) $$invalidate(1, submit = $$props.submit);
    		if ('skip' in $$props) $$invalidate(2, skip = $$props.skip);
    		if ('addSeconds' in $$props) $$invalidate(3, addSeconds = $$props.addSeconds);
    		if ('height' in $$props) $$invalidate(0, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [height, submit, skip, addSeconds, button1_elementresize_handler];
    }

    class Buttons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			submit: 1,
    			skip: 2,
    			addSeconds: 3,
    			height: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttons",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*submit*/ ctx[1] === undefined && !('submit' in props)) {
    			console.warn("<Buttons> was created without expected prop 'submit'");
    		}

    		if (/*skip*/ ctx[2] === undefined && !('skip' in props)) {
    			console.warn("<Buttons> was created without expected prop 'skip'");
    		}

    		if (/*addSeconds*/ ctx[3] === undefined && !('addSeconds' in props)) {
    			console.warn("<Buttons> was created without expected prop 'addSeconds'");
    		}

    		if (/*height*/ ctx[0] === undefined && !('height' in props)) {
    			console.warn("<Buttons> was created without expected prop 'height'");
    		}
    	}

    	get submit() {
    		throw new Error("<Buttons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submit(value) {
    		throw new Error("<Buttons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skip() {
    		throw new Error("<Buttons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skip(value) {
    		throw new Error("<Buttons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addSeconds() {
    		throw new Error("<Buttons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addSeconds(value) {
    		throw new Error("<Buttons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Buttons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Buttons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Credits.svelte generated by Svelte v3.46.4 */

    const file$3 = "src\\Credits.svelte";

    function create_fragment$3(ctx) {
    	let div3;
    	let div2;
    	let a;
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1_value = /*song*/ ctx[1].name.split(" - ")[1] + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*song*/ ctx[1].name.split(" - ")[0] + "";
    	let t3;
    	let t4;
    	let svg0;
    	let defs;
    	let linearGradient;
    	let stop0;
    	let stop1;
    	let path0;
    	let t5;
    	let svg1;
    	let path1;
    	let a_href_value;
    	let a_title_value;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			a = element("a");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			svg0 = svg_element("svg");
    			defs = svg_element("defs");
    			linearGradient = svg_element("linearGradient");
    			stop0 = svg_element("stop");
    			stop1 = svg_element("stop");
    			path0 = svg_element("path");
    			t5 = space();
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t6 = space();
    			button = element("button");
    			button.textContent = "Retry";
    			if (!src_url_equal(img.src, img_src_value = /*artwork*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*song*/ ctx[1].name);
    			set_style(img, "height", "calc(100% - 1px)");
    			add_location(img, file$3, 15, 16, 437);
    			add_location(p0, file$3, 17, 20, 582);
    			attr_dev(p1, "class", "text-sm ");
    			add_location(p1, file$3, 18, 20, 638);
    			attr_dev(div0, "class", "flex-1 mx-3 text-white");
    			add_location(div0, file$3, 16, 16, 524);
    			attr_dev(stop0, "offset", "0%");
    			attr_dev(stop0, "stop-color", "#ff7700");
    			attr_dev(stop0, "stop-opacity", "1");
    			add_location(stop0, file$3, 29, 29, 1141);
    			attr_dev(stop1, "offset", "100%");
    			attr_dev(stop1, "stop-color", "#ff3300");
    			attr_dev(stop1, "stop-opacity", "1");
    			add_location(stop1, file$3, 33, 30, 1327);
    			attr_dev(linearGradient, "id", "logo_hover_20");
    			attr_dev(linearGradient, "x1", "0%");
    			attr_dev(linearGradient, "y1", "0%");
    			attr_dev(linearGradient, "x2", "0%");
    			attr_dev(linearGradient, "y2", "100%");
    			attr_dev(linearGradient, "spreadMethod", "pad");
    			add_location(linearGradient, file$3, 22, 25, 849);
    			add_location(defs, file$3, 21, 21, 817);
    			attr_dev(path0, "class", "text-custom-fg");
    			attr_dev(path0, "fill", "currentColor");
    			attr_dev(path0, "d", "M10.517 3.742c-.323 0-.49.363-.49.582 0 0-.244 3.591-.244 4.641 0 1.602.15 2.621.15 2.621 0 .222.261.401.584.401.321 0 .519-.179.519-.401 0 0 .398-1.038.398-2.639 0-1.837-.153-4.127-.284-4.592-.112-.395-.313-.613-.633-.613zm-1.996.268c-.323 0-.49.363-.49.582 0 0-.244 3.322-.244 4.372 0 1.602.119 2.621.119 2.621 0 .222.26.401.584.401.321 0 .581-.179.581-.401 0 0 .081-1.007.081-2.608 0-1.837-.206-4.386-.206-4.386 0-.218-.104-.581-.425-.581zm-2.021 1.729c-.324 0-.49.362-.49.582 0 0-.272 1.594-.272 2.644 0 1.602.179 2.559.179 2.559 0 .222.229.463.552.463.321 0 .519-.241.519-.463 0 0 .19-.944.19-2.546 0-1.837-.253-2.657-.253-2.657 0-.22-.104-.582-.425-.582zm-2.046-.358c-.323 0-.49.363-.49.582 0 0-.162 1.92-.162 2.97 0 1.602.069 2.496.069 2.496 0 .222.26.557.584.557.321 0 .581-.304.581-.526 0 0 .143-.936.143-2.538 0-1.837-.206-2.96-.206-2.96 0-.218-.198-.581-.519-.581zm-2.169 1.482c-.272 0-.232.218-.232.218v3.982s-.04.335.232.335c.351 0 .716-.832.716-2.348 0-1.245-.436-2.187-.716-2.187zm18.715-.976c-.289 0-.567.042-.832.116-.417-2.266-2.806-3.989-5.263-3.989-1.127 0-2.095.705-2.931 1.316v8.16s0 .484.5.484h8.526c1.655 0 3-1.55 3-3.155 0-1.607-1.346-2.932-3-2.932zm10.17.857c-1.077-.253-1.368-.389-1.368-.815 0-.3.242-.611.97-.611.621 0 1.106.253 1.542.699l.981-.951c-.641-.669-1.417-1.067-2.474-1.067-1.339 0-2.425.757-2.425 1.99 0 1.338.873 1.736 2.124 2.026 1.281.291 1.513.486 1.513.923 0 .514-.379.738-1.184.738-.65 0-1.26-.223-1.736-.777l-.98.873c.514.757 1.504 1.232 2.639 1.232 1.853 0 2.668-.873 2.668-2.163 0-1.477-1.193-1.845-2.27-2.097zm6.803-2.745c-1.853 0-2.949 1.435-2.949 3.502s1.096 3.501 2.949 3.501c1.852 0 2.949-1.434 2.949-3.501s-1.096-3.502-2.949-3.502zm0 5.655c-1.097 0-1.553-.941-1.553-2.153 0-1.213.456-2.153 1.553-2.153 1.096 0 1.551.94 1.551 2.153.001 1.213-.454 2.153-1.551 2.153zm8.939-1.736c0 1.086-.533 1.756-1.396 1.756-.864 0-1.388-.689-1.388-1.775v-3.897h-1.358v3.916c0 1.978 1.106 3.084 2.746 3.084 1.726 0 2.754-1.136 2.754-3.103v-3.897h-1.358v3.916zm8.142-.89l.019 1.485c-.087-.174-.31-.515-.475-.768l-2.703-3.692h-1.362v6.894h1.401v-2.988l-.02-1.484c.088.175.311.514.475.767l2.79 3.705h1.213v-6.894h-1.339v2.975zm5.895-2.923h-2.124v6.791h2.027c1.746 0 3.474-1.01 3.474-3.395 0-2.484-1.437-3.396-3.377-3.396zm-.097 5.472h-.67v-4.152h.719c1.436 0 2.028.688 2.028 2.076 0 1.242-.651 2.076-2.077 2.076zm7.909-4.229c.611 0 1 .271 1.242.737l1.26-.582c-.426-.883-1.202-1.503-2.483-1.503-1.775 0-3.016 1.435-3.016 3.502 0 2.143 1.191 3.501 2.968 3.501 1.232 0 2.047-.572 2.513-1.533l-1.145-.68c-.358.602-.718.864-1.329.864-1.019 0-1.611-.932-1.611-2.153-.001-1.261.583-2.153 1.601-2.153zm5.17-1.192h-1.359v6.791h4.083v-1.338h-2.724v-5.453zm6.396-.157c-1.854 0-2.949 1.435-2.949 3.502s1.095 3.501 2.949 3.501c1.853 0 2.95-1.434 2.95-3.501s-1.097-3.502-2.95-3.502zm0 5.655c-1.097 0-1.553-.941-1.553-2.153 0-1.213.456-2.153 1.553-2.153 1.095 0 1.55.94 1.55 2.153.001 1.213-.454 2.153-1.55 2.153zm8.557-1.736c0 1.086-.532 1.756-1.396 1.756-.864 0-1.388-.689-1.388-1.775v-3.794h-1.358v3.813c0 1.978 1.106 3.084 2.746 3.084 1.726 0 2.755-1.136 2.755-3.103v-3.794h-1.36v3.813zm5.449-3.907h-2.318v6.978h2.211c1.908 0 3.789-1.037 3.789-3.489 0-2.552-1.565-3.489-3.682-3.489zm-.108 5.623h-.729v-4.266h.783c1.565 0 2.21.706 2.21 2.133.001 1.276-.707 2.133-2.264 2.133z");
    			add_location(path0, file$3, 39, 21, 1587);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "100");
    			attr_dev(svg0, "height", "14");
    			add_location(svg0, file$3, 20, 16, 731);
    			attr_dev(path1, "d", "M9 18l6-6-6-6");
    			add_location(path1, file$3, 55, 44, 5482);
    			attr_dev(svg1, "class", "mr-3");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "14");
    			attr_dev(svg1, "height", "14");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "stroke-width", "2");
    			attr_dev(svg1, "stroke-linecap", "round");
    			attr_dev(svg1, "stroke-linejoin", "round");
    			add_location(svg1, file$3, 45, 16, 5078);
    			attr_dev(div1, "class", "flex items-center h-full");
    			add_location(div1, file$3, 14, 13, 381);
    			attr_dev(a, "href", a_href_value = /*song*/ ctx[1].url);
    			attr_dev(a, "title", a_title_value = "Listen to " + /*song*/ ctx[1].name + " on SoundCloud");
    			add_location(a, file$3, 13, 8, 304);
    			attr_dev(div2, "class", "bg-gradient-to-r from-primary2-500/70 to-secondary2-500/40 text-left border grow h-full ");
    			add_location(div2, file$3, 8, 4, 174);
    			attr_dev(button, "class", "ml-4 h-full text-xl p-5 bg-submit-700/50 touch:active:bg-submit-700/70 mouse:hover:bg-submit-700/70");
    			add_location(button, file$3, 60, 4, 5584);
    			attr_dev(div3, "class", "flex");
    			set_style(div3, "height", /*height*/ ctx[2] + "px");
    			add_location(div3, file$3, 7, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, a);
    			append_dev(a, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p1);
    			append_dev(p1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, svg0);
    			append_dev(svg0, defs);
    			append_dev(defs, linearGradient);
    			append_dev(linearGradient, stop0);
    			append_dev(linearGradient, stop1);
    			append_dev(svg0, path0);
    			append_dev(div1, t5);
    			append_dev(div1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div3, t6);
    			append_dev(div3, button);
    			/*button_binding*/ ctx[4](button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*artwork*/ 8 && !src_url_equal(img.src, img_src_value = /*artwork*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*song*/ 2 && img_alt_value !== (img_alt_value = /*song*/ ctx[1].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*song*/ 2 && t1_value !== (t1_value = /*song*/ ctx[1].name.split(" - ")[1] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*song*/ 2 && t3_value !== (t3_value = /*song*/ ctx[1].name.split(" - ")[0] + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*song*/ 2 && a_href_value !== (a_href_value = /*song*/ ctx[1].url)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*song*/ 2 && a_title_value !== (a_title_value = "Listen to " + /*song*/ ctx[1].name + " on SoundCloud")) {
    				attr_dev(a, "title", a_title_value);
    			}

    			if (dirty & /*height*/ 4) {
    				set_style(div3, "height", /*height*/ ctx[2] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			/*button_binding*/ ctx[4](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Credits', slots, []);
    	let { song } = $$props;
    	let { height } = $$props;
    	let { retryButton } = $$props;
    	let { artwork } = $$props;
    	const writable_props = ['song', 'height', 'retryButton', 'artwork'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Credits> was created with unknown prop '${key}'`);
    	});

    	function button_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			retryButton = $$value;
    			$$invalidate(0, retryButton);
    		});
    	}

    	const click_handler = () => location.reload();

    	$$self.$$set = $$props => {
    		if ('song' in $$props) $$invalidate(1, song = $$props.song);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('retryButton' in $$props) $$invalidate(0, retryButton = $$props.retryButton);
    		if ('artwork' in $$props) $$invalidate(3, artwork = $$props.artwork);
    	};

    	$$self.$capture_state = () => ({ song, height, retryButton, artwork });

    	$$self.$inject_state = $$props => {
    		if ('song' in $$props) $$invalidate(1, song = $$props.song);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('retryButton' in $$props) $$invalidate(0, retryButton = $$props.retryButton);
    		if ('artwork' in $$props) $$invalidate(3, artwork = $$props.artwork);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [retryButton, song, height, artwork, button_binding, click_handler];
    }

    class Credits extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			song: 1,
    			height: 2,
    			retryButton: 0,
    			artwork: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Credits",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*song*/ ctx[1] === undefined && !('song' in props)) {
    			console.warn("<Credits> was created without expected prop 'song'");
    		}

    		if (/*height*/ ctx[2] === undefined && !('height' in props)) {
    			console.warn("<Credits> was created without expected prop 'height'");
    		}

    		if (/*retryButton*/ ctx[0] === undefined && !('retryButton' in props)) {
    			console.warn("<Credits> was created without expected prop 'retryButton'");
    		}

    		if (/*artwork*/ ctx[3] === undefined && !('artwork' in props)) {
    			console.warn("<Credits> was created without expected prop 'artwork'");
    		}
    	}

    	get song() {
    		throw new Error("<Credits>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set song(value) {
    		throw new Error("<Credits>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Credits>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Credits>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get retryButton() {
    		throw new Error("<Credits>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set retryButton(value) {
    		throw new Error("<Credits>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get artwork() {
    		throw new Error("<Credits>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set artwork(value) {
    		throw new Error("<Credits>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Music.svelte generated by Svelte v3.46.4 */
    const file$2 = "src\\Music.svelte";

    function create_fragment$2(ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			attr_dev(iframe, "height", "0");
    			attr_dev(iframe, "allow", "autoplay");
    			attr_dev(iframe, "id", "soundcloud");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://w.soundcloud.com/player/?url=" + /*song*/ ctx[0].url)) attr_dev(iframe, "src", iframe_src_value);
    			set_style(iframe, "display", "none");
    			add_location(iframe, file$2, 58, 0, 1371);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*song*/ 1 && !src_url_equal(iframe.src, iframe_src_value = "https://w.soundcloud.com/player/?url=" + /*song*/ ctx[0].url)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Music', slots, []);
    	let { song } = $$props;

    	let { status = {
    		pos: 0,
    		dur: 1000,
    		ready: false,
    		paused: true
    	} } = $$props;

    	let { info } = $$props;
    	let resetOnToggle = false;
    	let wid;

    	function play() {
    		$$invalidate(1, status.paused = false, status);
    		wid.play();
    	}

    	function pause() {
    		$$invalidate(1, status.paused = true, status);
    		wid.pause();
    	}

    	function toggle() {
    		if (!status.ready) return;
    		if (status.paused && resetOnToggle) seek(0);
    		$$invalidate(1, status.paused = !status.paused, status);
    		wid.toggle();
    	}

    	function seek(pos) {
    		$$invalidate(1, status.pos = pos, status);
    		wid.seekTo(pos);
    	}

    	function setResetOnToggle(r) {
    		resetOnToggle = r;
    	}

    	function setDur(dur) {
    		$$invalidate(1, status.dur = dur, status);
    	}

    	onMount(() => {
    		wid = SC.Widget("soundcloud");

    		wid.bind(SC.Widget.Events.PLAY_PROGRESS, e => {
    			$$invalidate(1, status.pos = e.currentPosition, status);

    			if (e.currentPosition >= status.dur) {
    				resetOnToggle = true;
    				pause();
    			}
    		});

    		wid.bind(SC.Widget.Events.READY, () => {
    			$$invalidate(1, status.ready = true, status);
    			wid.getCurrentSound(cs => $$invalidate(2, info = cs));
    		});
    	});

    	const writable_props = ['song', 'status', 'info'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Music> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('song' in $$props) $$invalidate(0, song = $$props.song);
    		if ('status' in $$props) $$invalidate(1, status = $$props.status);
    		if ('info' in $$props) $$invalidate(2, info = $$props.info);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		song,
    		status,
    		info,
    		resetOnToggle,
    		wid,
    		play,
    		pause,
    		toggle,
    		seek,
    		setResetOnToggle,
    		setDur
    	});

    	$$self.$inject_state = $$props => {
    		if ('song' in $$props) $$invalidate(0, song = $$props.song);
    		if ('status' in $$props) $$invalidate(1, status = $$props.status);
    		if ('info' in $$props) $$invalidate(2, info = $$props.info);
    		if ('resetOnToggle' in $$props) resetOnToggle = $$props.resetOnToggle;
    		if ('wid' in $$props) wid = $$props.wid;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [song, status, info, play, pause, toggle, seek, setResetOnToggle, setDur];
    }

    class Music extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			song: 0,
    			status: 1,
    			info: 2,
    			play: 3,
    			pause: 4,
    			toggle: 5,
    			seek: 6,
    			setResetOnToggle: 7,
    			setDur: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Music",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*song*/ ctx[0] === undefined && !('song' in props)) {
    			console.warn("<Music> was created without expected prop 'song'");
    		}

    		if (/*info*/ ctx[2] === undefined && !('info' in props)) {
    			console.warn("<Music> was created without expected prop 'info'");
    		}
    	}

    	get song() {
    		throw new Error("<Music>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set song(value) {
    		throw new Error("<Music>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get status() {
    		throw new Error("<Music>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set status(value) {
    		throw new Error("<Music>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get info() {
    		throw new Error("<Music>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Music>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get play() {
    		return this.$$.ctx[3];
    	}

    	set play(value) {
    		throw new Error("<Music>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		return this.$$.ctx[4];
    	}

    	set pause(value) {
    		throw new Error("<Music>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		return this.$$.ctx[5];
    	}

    	set toggle(value) {
    		throw new Error("<Music>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get seek() {
    		return this.$$.ctx[6];
    	}

    	set seek(value) {
    		throw new Error("<Music>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setResetOnToggle() {
    		return this.$$.ctx[7];
    	}

    	set setResetOnToggle(value) {
    		throw new Error("<Music>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setDur() {
    		return this.$$.ctx[8];
    	}

    	set setDur(value) {
    		throw new Error("<Music>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const songs = [{
    	url: "https://soundcloud.com/thexxofficial/intro",
    	name: "The xx - Intro"
    }, {
    	url: "https://soundcloud.com/dualipa/levitating",
    	name: "Dua Lipa - Levitating"
    }, {
    	url: "https://soundcloud.com/adelemusic/set-fire-to-the-rain-1",
    	name: "Adele - Set Fire to the Rain"
    }, {
    	url: "https://soundcloud.com/coldplay/the-scientist",
    	name: "Coldplay - The Scientist"
    }, {
    	url: "https://soundcloud.com/bennyblanco/eastside",
    	name: "Benny Blanco - Eastside (feat. Halsey and Khalid)"
    }, {
    	url: "https://soundcloud.com/nirvana/smells-like-teen-spirit-1",
    	name: "Nirvana - Smells Like Teen Spirit"
    }, {
    	url: "https://soundcloud.com/amalaofficial/streets",
    	name: "Doja cat - Streets"
    }, {
    	url: "https://soundcloud.com/beyonce/halo",
    	name: "Beyoncé - Halo"
    }, {
    	url: "https://soundcloud.com/fleetwoodmacofficial/dreams",
    	name: "Fleetwood Mac - Dreams"
    }, {
    	url: "https://soundcloud.com/kanyewest/black-skinhead",
    	name: "Kanye West - Black Skinhead"
    }, {
    	url: "https://soundcloud.com/arianagrande/7-rings",
    	name: "Ariana Grande - 7 rings"
    }, {
    	url: "https://soundcloud.com/kingsofleon/use-somebody",
    	name: "Kings of Leon - Use Somebody"
    }, {
    	url: "https://soundcloud.com/outkast-music/ms-jackson",
    	name: "Outkast - Ms. Jackson"
    }, {
    	url: "https://soundcloud.com/secret-service-862007284/thats-what-i-want",
    	name: "Lil Nas X - That's What I Want"
    }, {
    	url: "https://soundcloud.com/rihanna/rude-boy",
    	name: "Rihanna - Rude Boy"
    }, {
    	url: "https://soundcloud.com/whitneyhouston/i-wanna-dance-with-somebody-1",
    	name: "Whitney Houston - I Wanna Dance With Somebody (Who Loves Me)"
    }, {
    	url: "https://soundcloud.com/wheatus-official/teenage-dirtbag-1",
    	name: "Wheatus - Teenage Dirtbag"
    }, {
    	url: "https://soundcloud.com/lizzomusic/truth-hurts",
    	name: "Lizzo - Truth Hurts"
    }, {
    	url: "https://soundcloud.com/blurofficial/song-2",
    	name: "Blur - Song 2"
    }, {
    	url: "https://soundcloud.com/childish-gambino/redbone",
    	name: "Childish Gambino - Redbone"
    }, {
    	url: "https://soundcloud.com/madonna/like-a-virgin-album-version",
    	name: "Madonna - Like a Virgin"
    }, {
    	url: "https://soundcloud.com/daftpunkofficialmusic/harder-better-faster",
    	name: "Daft Punk - Harder, Better, Faster, Stronger"
    }, {
    	url: "https://soundcloud.com/al-green-official/lets-stay-together-5",
    	name: "Al Green - Let's Stay Together"
    }, {
    	url: "https://soundcloud.com/atlanticrecords/locked-out-of-heaven",
    	name: "Bruno Mars - Locked Out of Heaven"
    }, {
    	url: "https://soundcloud.com/wizkid-official/track-11",
    	name: "Wizkid - Essence (feat. Tems)"
    }, {
    	url: "https://soundcloud.com/destinys-child-official/independent-women-pt-i-3",
    	name: "Destiny's Child - Independent Women, Pt. 1"
    }, {
    	url: "https://soundcloud.com/thekidlaroi/stay",
    	name: "The Kid LAROI. - Stay (feat. Justin Bieber)"
    }, {
    	url: "https://soundcloud.com/linkin_park/numb",
    	name: "Linkin Park - Numb"
    }, {
    	url: "https://soundcloud.com/markronson/valerie-version-revisited",
    	name: "Mark Ronson - Valerie (feat. Amy Winehouse)"
    }, {
    	url: "https://soundcloud.com/dj-jazzy-jeff-the-fresh-prince/summertime-single-edit-1",
    	name: "DJ Jazzy Jeff & The Fresh Prince - Summertime"
    }, {
    	url: "https://soundcloud.com/dollyparton/jolene-11",
    	name: "Dolly Parton - Jolene"
    }, {
    	url: "https://soundcloud.com/foofighters/learn-to-fly",
    	name: "Foo Fighters - Learn To Fly"
    }, {
    	url: "https://soundcloud.com/missyelliott/get-ur-freak-on",
    	name: "Missy Elliott - Get Your Freak On"
    }, {
    	url: "https://soundcloud.com/aceofbaseofficial/all-that-she-wants",
    	name: "Ace of Base - All That She Wants"
    }, {
    	url: "https://soundcloud.com/iamcardib/up-1",
    	name: "Cardi B - Up"
    }, {
    	url: "https://soundcloud.com/rick-astley-official/never-gonna-give-you-up-7",
    	name: "Rick Astley - Never Gonna Give You Up"
    }, {
    	url: "https://soundcloud.com/miauk/paper-planes",
    	name: "M.I.A. - Paper Planes"
    }, {
    	url: "https://soundcloud.com/daryl-hall-john-oates/you-make-my-dreams-remastered",
    	name: "Daryl Hall and John Oates - You Make My Dreams (Come True)"
    }, ];
    const options = ["Lil Uzi Vert - XO Tour Llif3", "Wham! - Last Christmas", "Wham! - Wake Me Up Before You Go-Go", "Wham! - Club Tropicana", "DJ Khaled - Wild Thoughts (feat. Rihanna & Bryson Tiller)", "John Legend - All of Me", "John Legend - Ordinary People", "John Legend - Used To Love You", "John Legend - Green Light", "Dua Lipa - New Rules", "Lil Nas X - Old Town Road", "Lil Nas X - Panini", "Lil Nas X - Rodeo", "Lil Nas X - Industry Baby", "Marshmello - FRIENDS", "Marshmello - Alone", "Marshmello - Shockwave", "Toto - Africa", "Lil Jon - Get Low (feat. Ying Yang Twins)", "Cardi B - Bodak Yellow (feat. Kodak Black)", "Ed Sheeran - Shape of You", "The Kid LAROI. - Without You", "The Kid LAROI. - Still Chose You", "Eurythmics - Sweet Dreams (Are Made of This)", "Eurythmics - There Must Be An Angel", "Eurythmics - Walking On Broken Glass", "The Chainsmokers - High", "The Chainsmokers feat. Halsey - Closer", "Katy Perry - Dark Horse (feat. Juicy J)", "Katy Perry - Roar", "Katy Perry - I Kissed A Girl", "Katy Perry - This Is How We Do", "Michael Jackson - Rock with You", "Michael Jackson - Billie Jean", "Michael Jackson - Bad", "Michael Jackson - Wanna Be Startin' Somethin'", "Michael Jackson - Beat It", "Michael Jackson - P.Y.T", "Rita Ora - Your Song", "Rita Ora - Let You Love Me", "Rita Ora - I Will Never Let You Down", "Rita Ora - Anywhere", "Wiz Khalifa - See You Again (feat. Charlie Puth)", "Wiz Khalifa - Black And Yellow", "Wiz Khalifa - Still Wiz", "Wiz Khalifa - Can't Stay Sober", "Adele - Someone Like You", "Adele - Easy On Me", "Adele - Chasing Pavements", "Madonna - Like a Prayer", "Madonna - Material Girl", "Madonna - Holiday", "Madonna - Vogue", "Carly Rae Jepsen - Call Me Maybe", "Adele - Rolling in the Deep", "Otis Redding - Try A Little Tenderness", "Otis Redding - I've Been Loving You Too Long", "Otis Redding - These Arms of Mine", "Lauv - I Like Me Better", "Daft Punk - One More Time", "Daft Punk - Around The World", "Daft Punk - Da Funk", "Daft Punk - Technologic", "Lynyrd Skynyrd - Sweet Home Alabama", "Sia - Cheap Thrills", "twentyonepilots - Stressed Out", "Mariah Carey - All I Want for Christmas Is You", "Future - Life Is Good (feat. Drake)", "Khalid - Location", "Roddy Ricch - The Box", "Jay-Z - Hard Knock Life (Ghetto Anthem)", "Jay-Z - Empire State Of Mind", "Jay-Z - Izzo (Hova)", "Jay-Z - 99 Problems", "Jay-Z - Dirt Off Your Shoulder", "Lewis Capaldi - Someone You Loved", "Lewis Capaldi - Before You Go", "Lewis Capaldi - Hold Me While You Wait", "Tracy Chapman - Fast Car", "XXXTENTACION - SAD!", "Oasis - Wonderwall", "Oasis - Don't Look Back In Anger", "Oasis - Champagne Supernova", "Prince - Kiss", "Prince - 1999", "Prince - When Doves Cry", "Prince - Purple Rain", "Al Green - How Can You Mend A Broken Heart?", "Al Green - Tired of Being Alone", "Al Green - Love and Happiness", "Al Green - Take Me To the River", "Al Green - I'm Still in Love With You", "David Bowie - Heroes", "David Bowie - Life on Mars", "David Bowie - Space Oddity", "David Bowie - Let's Dance", "Arethra Franklin - Respect", "Arethra Franklin - A Natural Woman", "Arethra Franklin - I Say A Little Prayer", "Migos - Bad and Boujee (Feat. Lil Uzi Vert)", "Migos - Versace", "Migos - Walk It Talk It", "Migos - MotorSport (feat. Nicki Minaj and Cardi B)", "Ed Sheeran & Justin Bieber - I Don't Care", "Ed Sheeran - Thinking Out Loud", "Ed Sheeran - Bad Habits", "Ed Sheeran - Castle on the Hill", "Bruno Mars - 24K Magic", "Duran Duran - Hungry Like The Wolf", "Duran Duran - Girls on Film", "Duran Duran - A View To a Kill", "Duran Duran - Rio", "Coldplay - Yellow", "Coldplay - Fix You", "Coldplay - Clocks", "Eagles - Hotel California", "Eagles - Lyin' Eyes", "Eagles - Heartache Tonight", "Eagles - New Kid In Town", "Calvin Harris - Slide (feat. Frank Ocean & Migos)", "Hozier - Take Me To Church", "Sean Paul - Temperature", "Sean Paul - Gimme the Light", "Sean Paul - Get Busy", "Sean Paul - I'm Still In Love With You", "Cardi B - WAP feat. Megan Thee Stallion", "Goo Goo Dolls - Iris", "XXXTENTACION - Jocelyn Flores", "Linkin Park - In the End", "Linkin Park - Crawling", "Linkin Park - Burn It Down", "ZAYN - PILLOWTALK", "ZAYN - Better", "ZAYN - Vibez", "ZAYN - Dusk till Dawn (feat. Sia)", "Jason Mraz - I'm Yours", "Doja Cat - Kiss Me More (feat. SZA)", "Doja Cat - Woman", "Doja Cat - Say So (feat. Nicki Minaj)", "Leona Lewis - Bleeding Love", "Leona Lewis - A Moment Like This", "Leona Lewis - Better In Time", "Leona Lewis - Run", "XXXTENTACION - Moonlight", "Mark Ronson - Uptown Funk (feat. Bruno Mars)", "Mark Ronson - Nothing Breaks Like a Heart (feat. Miley Cyrus)", "Mark Ronson - Find U Again (feat. Camila Cabello)", "Megan Thee Stallion - Savage", "Megan Thee Stallion - Thot Shit", "Megan Thee Stallion - Girls In the Hood", "Megan Thee Stallion - Hot Girl Summer (feat. Nicki Minaj & Ty Dolla Sign)", "Jason Derulo - Want to Want Me", "Jason Derulo - Ridin' Solo", "Jason Derulo - Talk Dirty (feat. 2 Chainz)", "Jason Derulo - Wiggle (feat. Snoop Dogg)", "OneRepublic - Counting Stars", "OneRepublic - Apologize", "OneRepublic - Rescue Me", "OneRepublic - Lose Somebody (feat. Kygo)", "24kGoldn - Mood (feat. iann dior)", "Fetty Wap - Trap Queen", "Adele - Hello", "The Fray - How to Save a Life", "Train - Drops of Jupiter (Tell Me)", "Train - Drive By", "Train - Hey, Soul Sister", "The Script - Breakeven", "The Script - Superheroes", "The Script - For The First Time", "Calvin Harris - Summer", "Calvin Harris - This Is What You Came For (feat. Rihanna)", "Calvin Harris - Feels (feat. Pharrell Williams, Katy Perry and Big Sean)", "Calvin Harris - One kiss (feat. Dua Lipa)", "Marshmello - Silence (feat. Khalid)", "Alan Walker - Faded", "Lil Nas X - MONTERO (Call Me By Your Name)", "Bruno Mars - That's What I Like", "Bruno Mars - Treasure", "Franz Ferdinand - Take Me Out", "Arctic Monkeys - Do I Wanna Know?", "Arctic Monkeys - I Bet You Look Good on the Dancefloor", "Arctic Monkeys - Why'd You Only Call Me When You're High?", "Arctic Monkeys - When the Sun Goes Down", "Daryl Hall and John Oates - Maneater", "Daryl Hall and John Oates - Out of Touch", "Daryl Hall and John Oates - Rich Girl", "Daryl Hall and John Oates - Can't Go for That (No Can Do)", "French Montana - Unforgettable (feat. Swae Lee)", "The Chainsmokers - Don't Let Me Down (feat. Daya)", "George Ezra - Shotgun", "Tones and I - Dance Monkey", "Miley Cyrus - Wrecking Ball", "Miley Cyrus - Malibu", "Miley Cyrus - Midnight Sky", "Miley Cyrus - We Can't Stop", "Ace Of Base - The Sign", "Ace Of Base - Beautiful Life", "Clean Bandit - Rockabye (feat. Sean Paul & Anne-Marie)", "Ed Sheeran - Perfect", "Kings of Leon - Sex on Fire", "Kings of Leon - Wait for Me", "Kings of Leon - Closer", "Kings of Leon - Pyro", "Kings of Leon - Revelry", "James Blunt - You're Beautiful", "Vance Joy - Riptide", "Vance Joy - Mess Is Mine", "Vance Joy - Georgia", "Missy Elliott - One Minute Man (feat. Ludacris)", "Missy Elliott - Lose Control (feat. Ciara & Fatman Scoop)", "Missy Elliott - Work It", "Missy Elliott - The Rain (Supa Dupa Fly)", "Joy Division - Love Will Tear Us Apart", "Joy Division - Disorder", "Joy Division - Transmission", "Joy Division - Atmosphere", "Notorious B.I.G. - Juicy", "Notorious B.I.G. - One More Chance (Remix)", "Notorious B.I.G. - Hypnotize", "Neil Young - Heart Of Gold", "Neil Young - Harvest Moon", "Neil Young - Down By The River", "Pet Shop Boys - West End Girls", "Pet Shop Boys - Go West", "Pet Shop Boys - It's A Sin", "Camila Cabello - Havana (feat. Young Thug)", "Travis Scott - SICKO MODE", "Kate Bush - Wuthering Heights", "Kate Bush - This Woman's Work", "Kate Bush - Babooshka", "Kate Bush - Cloudbusting", "Seal - Crazy", "Seal - Kiss From A Rose", "Foo Fighters - Everlong", "Foo Fighters - My Hero", "Foo Fighters - The Pretender", "Foo Fighters - Best of You", "Red Hot Chili Peppers - Zephyr Song", "Red Hot Chili Peppers - By The Way", "Red Hot Chili Peppers - Under The Bridge", "Red Hot Chili Peppers - Don't Stop", "Alanis Morissette - Hand In My Pocket", "Alanis Morissette - Ironic", "Alanis Morissette - Thank U", "Alanis Morissette - Head over Feet", "Phil Collins - Another Day In Paradise", "Phil Collins - In The Air Tonight", "Phil Collins - You Can't Hurry Love", "Phil Collins - Easy Lover", "Phil Collins - One More Night", "Joni Mitchell - River", "Joni Mitchell - A Case of You", "Joni Mitchell - Big Yellow Taxi", "The Doors - Light My Fire", "The Doors - End Of The Night", "The Doors - Riders of the Storm", "The Doors - Roadhouse Blues", "Pink Floyd - Another Brick in the Wall (Part II)", "Pink Floyd - Money", "Pink Floyd - Comfortably Numb", "Pink Floyd - One of My Turns", "Charlie Puth - Attention", "Childish Gambino - This is America", "Childish Gambino - Summertime Magic", "Childish Gambino - 3005", "Childish Gambino - Feels Like Summer", "Dua Lipa - Don't Start Now", "T.I. - Live Your Life (feat. Rihanna)", "T.I. - Whatever You Like", "T.I. - What You Know", "T.I. - Dead and Gone, (feat. Justin Timberlake)", "Outkast - Hey Ya!", "Led Zeppelin - Stairway to Heaven", "Led Zeppelin - Black Dog", "Led Zeppelin - Immigrant Song", "Led Zeppelin - Whole Lotta Love", "Tina Turner - The Best", "Tina Turner - What's Love Got to Do With It", "Tina Turner - Proud Mary", "Tina Turner - We Don't Need Another Hero (Thunderdome)", "Spandau Ballet - True", "Spandau Ballet - Gold", "Rod Stewart - Maggie May", "Rod Stewart - Do Ya Think I'm Sexy?", "Rod Stewart - First Cut is the Deepest", "Curtis Mayfield - Move on Up", "Curtis Mayfield - Superfly", "Curtis Mayfield - Pusherman", "Bad Day - Daniel Powter", "Simply Red - Stars", "Simply Red - If You Don't Know Me By Now", "Simply Red - Fairground", "Simply Red - Holding Back the Years", "Kylie Minogue - Can't Get You Out of My Head", "Kylie Minogue - The Loco-motion", "Kylie Minogue - Spinning Around", "Kylie Minogue - I Should Be So Lucky", "Eric Clapton - Tears In Heaven", "Eric Clapton - Wonderful Tonight", "Eric Clapton - Cocaine", "Eric Clapton - Change The World", "Foreigner - I Want to Know What Love Is", "Mark Cohn - Walking in Memphis", "A-ha - Take on Me", "Tom Petty - Wildflowers", "Christina Perri - A Thousand Years", "Roxette - It Must Have Been Love", "Whitney Houston - How Will I Know?", "Whitney Houston - I'm Every Woman", "Whitney Houston - I Will Always Love You", "Whitney Houston - I Have Nothing", "Lizzo - Rumors (feat. Cardi B)", "Lizzo - Good As Hell", "Lizzo - Juice", "Blur - Coffee and TV", "Blur - Beetlebum", "Blur - Parklife", "Outkast - Elevators (Me & You)", "Outkast - The Whole World (feat. Killer Mike)", "Outkast - Roses", "Outkast - The Way You Move (feat. Sleepy Brown)", "Gorillaz - Clint Eastwood", "Gorillaz - Dirty Harry", "Gorillaz - Dare", "Gorillaz - El Mañana", "Blink 182 - All The Small Things", "The Killers - Somebody Told Me", "Avril Lavigne - Sk8ter Boi", "Franz Ferdinand - Take Me Out", "The Fratellis - Chelsea Dagger", "Green Day - American Idiot", "DJ Jazzy Jeff & The Fresh Prince - The Fresh Prince of Bel-Air", "DJ Jazzy Jeff & The Fresh Prince -  Boom! Shake the Room", "DJ Jazzy Jeff & The Fresh Prince -  Parents Just Don't Understand", "Destiny's Child - Say My Name", "Destiny's Child - Bills, Bills, Bills", "Destiny's Child - Bootylicious", "Destiny's Child - Survivor", "Wizkid - Mood (feat. Buju)", "Wizkid - Ginger (feat. Burna Boy)", "Wizkid - No Stress", "Dolly Parton - 9 to 5", "Dolly Parton - Islands In the Stream", "The Zutons - Valerie", "The xx - Intro", "Dua Lipa - Levitating", , "Adele - Set Fire to the Rain", "Coldplay - The Scientist", "Benny Blanco - Eastside (feat. Halsey and Khalid)", "Nirvana - Smells Like Teen Spirit", "Doja cat - Streets", "Beyoncé - Halo", "Fleetwood Mac - Dreams", "Kanye West - Black Skinhead", "Ariana Grande - 7 rings", "Kings of Leon - Use Somebody", "Outkast - Ms. Jackson", "Lil Nas X - That's What I Want", "Rihanna - Rude Boy", "Whitney Houston - I Wanna Dance With Somebody (Who Loves Me)", "Wheatus - Teenage Dirtbag", "Lizzo - Truth Hurts", "Blur - Song 2", "Childish Gambino - Redbone", "Madonna - Like a Virgin", "Daft Punk - Harder, Better, Faster, Stronger", "Al Green - Let's Stay Together", "Bruno Mars - Locked Out of Heaven", "Wizkid - Essence (feat. Tems)", "Destiny's Child - Independent Women, Pt. 1", "The Kid LAROI. - Stay (feat. Justin Bieber)", "Linkin Park - Numb", "Mark Ronson - Valerie (feat. Amy Winehouse)", "DJ Jazzy Jeff & The Fresh Prince - Summertime", "Dolly Parton - Jolene", "Foo Fighters - Learn To Fly", "Missy Elliott - Get Your Freak On", "Ace of Base - All That She Wants", "Cardi B - Up", "Rick Astley - Never Gonna Give You Up", "M.I.A. - Paper Planes", "Daryl Hall and John Oates - You Make My Dreams (Come True)"];

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var autoComplete_min = createCommonjsModule(function (module, exports) {
    var e;e=function(){function t(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r);}return n}function e(e){for(var n=1;n<arguments.length;n++){var i=null!=arguments[n]?arguments[n]:{};n%2?t(Object(i),!0).forEach((function(t){r(e,t,i[t]);})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(i)):t(Object(i)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(i,t));}));}return e}function n(t){return (n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function r(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function i(t){return function(t){if(Array.isArray(t))return s(t)}(t)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(t)||o(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function o(t,e){if(t){if("string"==typeof t)return s(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return "Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?s(t,e):void 0}}function s(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}var u=function(t){return "string"==typeof t?document.querySelector(t):t()},a=function(t,e){var n="string"==typeof t?document.createElement(t):t;for(var r in e){var i=e[r];if("inside"===r)i.append(n);else if("dest"===r)u(i[0]).insertAdjacentElement(i[1],n);else if("around"===r){var o=i;o.parentNode.insertBefore(n,o),n.append(o),null!=o.getAttribute("autofocus")&&o.focus();}else r in n?n[r]=i:n.setAttribute(r,i);}return n},c=function(t,e){return t=t.toString().toLowerCase(),e?t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").normalize("NFC"):t},l=function(t,n){return a("mark",e({innerHTML:t},"string"==typeof n&&{class:n})).outerHTML},f=function(t,e){e.input.dispatchEvent(new CustomEvent(t,{bubbles:!0,detail:e.feedback,cancelable:!0}));},p=function(t,e,n){var r=n||{},i=r.mode,o=r.diacritics,s=r.highlight,u=c(e,o);if(e=e.toString(),t=c(t,o),"loose"===i){var a=(t=t.replace(/ /g,"")).length,f=0,p=Array.from(e).map((function(e,n){return f<a&&u[n]===t[f]&&(e=s?l(e,s):e,f++),e})).join("");if(f===a)return p}else {var d=u.indexOf(t);if(~d)return t=e.substring(d,d+t.length),d=s?e.replace(t,l(t,s)):e}},d=function(t,e){return new Promise((function(n,r){var i;return (i=t.data).cache&&i.store?n():new Promise((function(t,n){return "function"==typeof i.src?i.src(e).then(t,n):t(i.src)})).then((function(e){try{return t.feedback=i.store=e,f("response",t),n()}catch(t){return r(t)}}),r)}))},h=function(t,e){var n=e.data,r=e.searchEngine,i=[];n.store.forEach((function(s,u){var a=function(n){var o=n?s[n]:s,u="function"==typeof r?r(t,o):p(t,o,{mode:r,diacritics:e.diacritics,highlight:e.resultItem.highlight});if(u){var a={match:u,value:s};n&&(a.key=n),i.push(a);}};if(n.keys){var c,l=function(t,e){var n="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!n){if(Array.isArray(t)||(n=o(t))||e&&t&&"number"==typeof t.length){n&&(t=n);var r=0,i=function(){};return {s:i,n:function(){return r>=t.length?{done:!0}:{done:!1,value:t[r++]}},e:function(t){throw t},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,u=!0,a=!1;return {s:function(){n=n.call(t);},n:function(){var t=n.next();return u=t.done,t},e:function(t){a=!0,s=t;},f:function(){try{u||null==n.return||n.return();}finally{if(a)throw s}}}}(n.keys);try{for(l.s();!(c=l.n()).done;)a(c.value);}catch(t){l.e(t);}finally{l.f();}}else a();})),n.filter&&(i=n.filter(i));var s=i.slice(0,e.resultsList.maxResults);e.feedback={query:t,matches:i,results:s},f("results",e);},m="aria-expanded",b="aria-activedescendant",y="aria-selected",v=function(t,n){t.feedback.selection=e({index:n},t.feedback.results[n]);},g=function(t){t.isOpen||((t.wrapper||t.input).setAttribute(m,!0),t.list.removeAttribute("hidden"),t.isOpen=!0,f("open",t));},w=function(t){t.isOpen&&((t.wrapper||t.input).setAttribute(m,!1),t.input.setAttribute(b,""),t.list.setAttribute("hidden",""),t.isOpen=!1,f("close",t));},O=function(t,e){var n=e.resultItem,r=e.list.getElementsByTagName(n.tag),o=!!n.selected&&n.selected.split(" ");if(e.isOpen&&r.length){var s,u,a=e.cursor;t>=r.length&&(t=0),t<0&&(t=r.length-1),e.cursor=t,a>-1&&(r[a].removeAttribute(y),o&&(u=r[a].classList).remove.apply(u,i(o))),r[t].setAttribute(y,!0),o&&(s=r[t].classList).add.apply(s,i(o)),e.input.setAttribute(b,r[e.cursor].id),e.list.scrollTop=r[t].offsetTop-e.list.clientHeight+r[t].clientHeight+5,e.feedback.cursor=e.cursor,v(e,t),f("navigate",e);}},A=function(t){O(t.cursor+1,t);},k=function(t){O(t.cursor-1,t);},L=function(t,e,n){(n=n>=0?n:t.cursor)<0||(t.feedback.event=e,v(t,n),f("selection",t),w(t));};function j(t,n){var r=this;return new Promise((function(i,o){var s,u;return s=n||((u=t.input)instanceof HTMLInputElement||u instanceof HTMLTextAreaElement?u.value:u.innerHTML),function(t,e,n){return e?e(t):t.length>=n}(s=t.query?t.query(s):s,t.trigger,t.threshold)?d(t,s).then((function(n){try{return t.feedback instanceof Error?i():(h(s,t),t.resultsList&&function(t){var n=t.resultsList,r=t.list,i=t.resultItem,o=t.feedback,s=o.matches,u=o.results;if(t.cursor=-1,r.innerHTML="",s.length||n.noResults){var c=new DocumentFragment;u.forEach((function(t,n){var r=a(i.tag,e({id:"".concat(i.id,"_").concat(n),role:"option",innerHTML:t.match,inside:c},i.class&&{class:i.class}));i.element&&i.element(r,t);})),r.append(c),n.element&&n.element(r,o),g(t);}else w(t);}(t),c.call(r))}catch(t){return o(t)}}),o):(w(t),c.call(r));function c(){return i()}}))}var S=function(t,e){for(var n in t)for(var r in t[n])e(n,r);},T=function(t){var n,r,i,o=t.events,s=(n=function(){return j(t)},r=t.debounce,function(){clearTimeout(i),i=setTimeout((function(){return n()}),r);}),u=t.events=e({input:e({},o&&o.input)},t.resultsList&&{list:o?e({},o.list):{}}),a={input:{input:function(){s();},keydown:function(e){!function(t,e){switch(t.keyCode){case 40:case 38:t.preventDefault(),40===t.keyCode?A(e):k(e);break;case 13:e.submit||t.preventDefault(),e.cursor>=0&&L(e,t);break;case 9:e.resultsList.tabSelect&&e.cursor>=0&&L(e,t);break;case 27:e.input.value="",w(e);}}(e,t);},blur:function(){w(t);}},list:{mousedown:function(t){t.preventDefault();},click:function(e){!function(t,e){var n=e.resultItem.tag.toUpperCase(),r=Array.from(e.list.querySelectorAll(n)),i=t.target.closest(n);i&&i.nodeName===n&&L(e,t,r.indexOf(i));}(e,t);}}};S(a,(function(e,n){(t.resultsList||"input"===n)&&(u[e][n]||(u[e][n]=a[e][n]));})),S(u,(function(e,n){t[e].addEventListener(n,u[e][n]);}));};function E(t){var n=this;return new Promise((function(r,i){var o,s,u;if(o=t.placeHolder,u={role:"combobox","aria-owns":(s=t.resultsList).id,"aria-haspopup":!0,"aria-expanded":!1},a(t.input,e(e({"aria-controls":s.id,"aria-autocomplete":"both"},o&&{placeholder:o}),!t.wrapper&&e({},u))),t.wrapper&&(t.wrapper=a("div",e({around:t.input,class:t.name+"_wrapper"},u))),s&&(t.list=a(s.tag,e({dest:[s.destination,s.position],id:s.id,role:"listbox",hidden:"hidden"},s.class&&{class:s.class}))),T(t),t.data.cache)return d(t).then((function(t){try{return c.call(n)}catch(t){return i(t)}}),i);function c(){return f("init",t),r()}return c.call(n)}))}function x(t){var e=t.prototype;e.init=function(){E(this);},e.start=function(t){j(this,t);},e.unInit=function(){if(this.wrapper){var t=this.wrapper.parentNode;t.insertBefore(this.input,this.wrapper),t.removeChild(this.wrapper);}var e;S((e=this).events,(function(t,n){e[t].removeEventListener(n,e.events[t][n]);}));},e.open=function(){g(this);},e.close=function(){w(this);},e.goTo=function(t){O(t,this);},e.next=function(){A(this);},e.previous=function(){k(this);},e.select=function(t){L(this,null,t);},e.search=function(t,e,n){return p(t,e,n)};}return function t(e){this.options=e,this.id=t.instances=(t.instances||0)+1,this.name="autoComplete",this.wrapper=1,this.threshold=1,this.debounce=0,this.resultsList={position:"afterend",tag:"ul",maxResults:5},this.resultItem={tag:"li"},function(t){var e=t.name,r=t.options,i=t.resultsList,o=t.resultItem;for(var s in r)if("object"===n(r[s]))for(var a in t[s]||(t[s]={}),r[s])t[s][a]=r[s][a];else t[s]=r[s];t.selector=t.selector||"#"+e,i.destination=i.destination||t.selector,i.id=i.id||e+"_list_"+t.id,o.id=o.id||e+"_result",t.input=u(t.selector);}(this),x.call(this,t),E(this);}},module.exports=e();
    });

    function AC(field) {
        let ac = new autoComplete_min({
            data: {
                src: options,
                cache: true,
            },
            resultItem: {
                highlight: true,
            },
            events: {
                input: {
                    selection: (event) => {
                        ac.lastSelectedVal = event.detail.selection.value;
                        ac.input.value = ac.lastSelectedVal;
                    },
                },
            },
            selector: () => field,
            resultsList: {
                element: (list, data) => {
                    if (!data.results.length) {
                        const message = document.createElement("div");
                        message.setAttribute("class", "no_result");
                        message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
                        list.prepend(message);
                    }
                },
                noResults: true,
            },
            threshold: 3,
            searchEngine: "loose",
            diacritics: true,
            submit: true,
        });
        return ac;
    }

    /* src\Game.svelte generated by Svelte v3.46.4 */
    const file$1 = "src\\Game.svelte";

    // (108:8) {#if showTip}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Click the play button or press Tab");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(108:8) {#if showTip}",
    		ctx
    	});

    	return block;
    }

    // (112:4) {#if music}
    function create_if_block_1(ctx) {
    	let player;
    	let current;

    	player = new Player({
    			props: {
    				status: /*status*/ ctx[5],
    				toggle: /*func*/ ctx[15]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(player.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(player, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const player_changes = {};
    			if (dirty & /*status*/ 32) player_changes.status = /*status*/ ctx[5];
    			if (dirty & /*showTip, music*/ 68) player_changes.toggle = /*func*/ ctx[15];
    			player.$set(player_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(player.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(player.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(player, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(112:4) {#if music}",
    		ctx
    	});

    	return block;
    }

    // (130:8) {:else}
    function create_else_block(ctx) {
    	let credits;
    	let updating_retryButton;
    	let current;

    	function credits_retryButton_binding(value) {
    		/*credits_retryButton_binding*/ ctx[17](value);
    	}

    	let credits_props = {
    		song: /*song*/ ctx[8],
    		artwork: /*songInfo*/ ctx[0].artwork_url,
    		height: /*buttonHeight*/ ctx[4]
    	};

    	if (/*retryButton*/ ctx[3] !== void 0) {
    		credits_props.retryButton = /*retryButton*/ ctx[3];
    	}

    	credits = new Credits({ props: credits_props, $$inline: true });
    	binding_callbacks.push(() => bind(credits, 'retryButton', credits_retryButton_binding));

    	const block = {
    		c: function create() {
    			create_component(credits.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(credits, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const credits_changes = {};
    			if (dirty & /*songInfo*/ 1) credits_changes.artwork = /*songInfo*/ ctx[0].artwork_url;
    			if (dirty & /*buttonHeight*/ 16) credits_changes.height = /*buttonHeight*/ ctx[4];

    			if (!updating_retryButton && dirty & /*retryButton*/ 8) {
    				updating_retryButton = true;
    				credits_changes.retryButton = /*retryButton*/ ctx[3];
    				add_flush_callback(() => updating_retryButton = false);
    			}

    			credits.$set(credits_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(credits.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(credits.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(credits, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(130:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (123:8) {#if !game.over}
    function create_if_block(ctx) {
    	let buttons;
    	let updating_height;
    	let current;

    	function buttons_height_binding(value) {
    		/*buttons_height_binding*/ ctx[16](value);
    	}

    	let buttons_props = {
    		addSeconds: /*lengths*/ ctx[7][/*game*/ ctx[1].guesses + 1] - /*lengths*/ ctx[7][/*game*/ ctx[1].guesses],
    		skip: /*skip*/ ctx[10],
    		submit: /*submit*/ ctx[9]
    	};

    	if (/*buttonHeight*/ ctx[4] !== void 0) {
    		buttons_props.height = /*buttonHeight*/ ctx[4];
    	}

    	buttons = new Buttons({ props: buttons_props, $$inline: true });
    	binding_callbacks.push(() => bind(buttons, 'height', buttons_height_binding));

    	const block = {
    		c: function create() {
    			create_component(buttons.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(buttons, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const buttons_changes = {};
    			if (dirty & /*game*/ 2) buttons_changes.addSeconds = /*lengths*/ ctx[7][/*game*/ ctx[1].guesses + 1] - /*lengths*/ ctx[7][/*game*/ ctx[1].guesses];

    			if (!updating_height && dirty & /*buttonHeight*/ 16) {
    				updating_height = true;
    				buttons_changes.height = /*buttonHeight*/ ctx[4];
    				add_flush_callback(() => updating_height = false);
    			}

    			buttons.$set(buttons_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttons.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(buttons, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(123:8) {#if !game.over}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let h1;
    	let t1;
    	let music_1;
    	let updating_info;
    	let updating_status;
    	let t2;
    	let fields;
    	let t3;
    	let div0;
    	let t4;
    	let t5;
    	let div1;
    	let current_block_type_index;
    	let if_block2;
    	let current;
    	let mounted;
    	let dispose;

    	function music_1_info_binding(value) {
    		/*music_1_info_binding*/ ctx[12](value);
    	}

    	function music_1_status_binding(value) {
    		/*music_1_status_binding*/ ctx[14](value);
    	}

    	let music_1_props = { song: /*song*/ ctx[8] };

    	if (/*songInfo*/ ctx[0] !== void 0) {
    		music_1_props.info = /*songInfo*/ ctx[0];
    	}

    	if (/*status*/ ctx[5] !== void 0) {
    		music_1_props.status = /*status*/ ctx[5];
    	}

    	music_1 = new Music({ props: music_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(music_1, 'info', music_1_info_binding));
    	/*music_1_binding*/ ctx[13](music_1);
    	binding_callbacks.push(() => bind(music_1, 'status', music_1_status_binding));

    	fields = new Fields({
    			props: {
    				submit: /*submit*/ ctx[9],
    				game: /*game*/ ctx[1]
    			},
    			$$inline: true
    		});

    	let if_block0 = /*showTip*/ ctx[6] && create_if_block_2(ctx);
    	let if_block1 = /*music*/ ctx[2] && create_if_block_1(ctx);
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*game*/ ctx[1].over) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Hello hearld";
    			t1 = space();
    			create_component(music_1.$$.fragment);
    			t2 = space();
    			create_component(fields.$$.fragment);
    			t3 = space();
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			div1 = element("div");
    			if_block2.c();
    			attr_dev(h1, "class", "text-5xl font-bold m-4");
    			add_location(h1, file$1, 102, 4, 3001);
    			attr_dev(div0, "class", "h-20 flex items-center justify-center");
    			add_location(div0, file$1, 106, 4, 3166);
    			attr_dev(div1, "class", "my-4");
    			add_location(div1, file$1, 121, 4, 3559);
    			attr_dev(div2, "class", "w-full max-w-xl scale-[85%] my-[-10vh]");
    			add_location(div2, file$1, 101, 0, 2943);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h1);
    			append_dev(div2, t1);
    			mount_component(music_1, div2, null);
    			append_dev(div2, t2);
    			mount_component(fields, div2, null);
    			append_dev(div2, t3);
    			append_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div2, t4);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*kd*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const music_1_changes = {};

    			if (!updating_info && dirty & /*songInfo*/ 1) {
    				updating_info = true;
    				music_1_changes.info = /*songInfo*/ ctx[0];
    				add_flush_callback(() => updating_info = false);
    			}

    			if (!updating_status && dirty & /*status*/ 32) {
    				updating_status = true;
    				music_1_changes.status = /*status*/ ctx[5];
    				add_flush_callback(() => updating_status = false);
    			}

    			music_1.$set(music_1_changes);
    			const fields_changes = {};
    			if (dirty & /*game*/ 2) fields_changes.game = /*game*/ ctx[1];
    			fields.$set(fields_changes);

    			if (/*showTip*/ ctx[6]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*music*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*music*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, t5);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks[current_block_type_index];

    				if (!if_block2) {
    					if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block2.c();
    				} else {
    					if_block2.p(ctx, dirty);
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div1, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(music_1.$$.fragment, local);
    			transition_in(fields.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(music_1.$$.fragment, local);
    			transition_out(fields.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*music_1_binding*/ ctx[13](null);
    			destroy_component(music_1);
    			destroy_component(fields);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function preloadImage(url) {
    	var img = new Image();
    	img.src = url;
    	return url;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Game', slots, []);
    	const lengths = [1, 2, 4, 7, 11, 16];
    	const song = songs[Math.floor(Math.random() * songs.length)];

    	let game = {
    		over: false,
    		guesses: 0,
    		fields: Array(6),
    		keepPos: false,
    		statuses: Array(6).fill("")
    	};

    	let ac;
    	let music;
    	let songInfo;
    	let retryButton;

    	function guessMade() {
    		$$invalidate(1, game.guesses++, game);

    		if (game.guesses == 6) {
    			end();
    		} else {
    			ac = AC(game.fields[game.guesses]);
    			tick().then(() => game.fields[game.guesses].focus());
    			music.setDur(lengths[game.guesses] * 1000);
    		}

    		music.setResetOnToggle(false);
    	}

    	function submit() {
    		if (game.fields[game.guesses].value === "") skip(); else if (game.fields[game.guesses].value == ac.lastSelectedVal) {
    			if (game.fields[game.guesses].value == song.name) {
    				$$invalidate(1, game.statuses[game.guesses] = "correct", game);
    				end();
    			} else {
    				$$invalidate(1, game.statuses[game.guesses] = "incorrect", game);
    				guessMade();
    			}
    		}
    	}

    	function skip() {
    		$$invalidate(1, game.statuses[game.guesses] = "skipped", game);
    		$$invalidate(1, game.fields[game.guesses].value = "SKIPPED", game);
    		guessMade();
    	}

    	function end() {
    		music.setDur(songInfo.duration);
    		$$invalidate(1, game.over = true, game);
    		music.seek(0);
    		music.play();
    		tick().then(() => retryButton.focus());
    	}

    	tick().then(() => {
    		ac = AC(game.fields[0]);
    		game.fields[0].focus();
    	});

    	function kd(e) {
    		if (e.key == "Tab") {
    			if (!autoplayAsked && navigator.userAgent.toLowerCase().includes("firefox")) {
    				alert("Enable autoplay");
    				autoplayAsked = true;
    			} else {
    				$$invalidate(6, showTip = false);
    				music.toggle();
    				music.setResetOnToggle(true);
    			}

    			e.preventDefault();
    		}
    	}

    	let buttonHeight = 0;
    	let status;
    	let showTip = true;
    	let autoplayAsked = false;
    	var sound = document.createElement('audio');
    	sound.src = 'https://www.kozco.com/tech/LRMonoPhase4.mp3';

    	//sound.src = URL.createObjectURL(AUDIO);
    	sound.play();

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	function music_1_info_binding(value) {
    		songInfo = value;
    		$$invalidate(0, songInfo);
    	}

    	function music_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			music = $$value;
    			$$invalidate(2, music);
    		});
    	}

    	function music_1_status_binding(value) {
    		status = value;
    		$$invalidate(5, status);
    	}

    	const func = () => {
    		$$invalidate(6, showTip = false);
    		music.toggle();
    		music.setResetOnToggle(true);
    	};

    	function buttons_height_binding(value) {
    		buttonHeight = value;
    		$$invalidate(4, buttonHeight);
    	}

    	function credits_retryButton_binding(value) {
    		retryButton = value;
    		$$invalidate(3, retryButton);
    	}

    	$$self.$capture_state = () => ({
    		Fields,
    		Player,
    		Buttons,
    		Credits,
    		Music,
    		songs,
    		tick,
    		AC,
    		preloadImage,
    		lengths,
    		song,
    		game,
    		ac,
    		music,
    		songInfo,
    		retryButton,
    		guessMade,
    		submit,
    		skip,
    		end,
    		kd,
    		buttonHeight,
    		status,
    		showTip,
    		autoplayAsked,
    		sound
    	});

    	$$self.$inject_state = $$props => {
    		if ('game' in $$props) $$invalidate(1, game = $$props.game);
    		if ('ac' in $$props) ac = $$props.ac;
    		if ('music' in $$props) $$invalidate(2, music = $$props.music);
    		if ('songInfo' in $$props) $$invalidate(0, songInfo = $$props.songInfo);
    		if ('retryButton' in $$props) $$invalidate(3, retryButton = $$props.retryButton);
    		if ('buttonHeight' in $$props) $$invalidate(4, buttonHeight = $$props.buttonHeight);
    		if ('status' in $$props) $$invalidate(5, status = $$props.status);
    		if ('showTip' in $$props) $$invalidate(6, showTip = $$props.showTip);
    		if ('autoplayAsked' in $$props) autoplayAsked = $$props.autoplayAsked;
    		if ('sound' in $$props) sound = $$props.sound;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*songInfo*/ 1) {
    			if (songInfo?.artwork_url) preloadImage(songInfo.artwork_url);
    		}
    	};

    	return [
    		songInfo,
    		game,
    		music,
    		retryButton,
    		buttonHeight,
    		status,
    		showTip,
    		lengths,
    		song,
    		submit,
    		skip,
    		kd,
    		music_1_info_binding,
    		music_1_binding,
    		music_1_status_binding,
    		func,
    		buttons_height_binding,
    		credits_retryButton_binding
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let game;
    	let current;
    	game = new Game({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(game.$$.fragment);
    			attr_dev(div, "class", "bg-gradient-to-r from-primary-500 to-secondary-500 flex justify-center items-center h-screen rounded-none overflow-auto");
    			add_location(div, file, 4, 0, 59);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(game, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(game);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Game });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
