// node_modules/compromise/src/API/world.js
var methods = {
  one: {},
  two: {},
  three: {},
  four: {}
};
var model = {
  one: {},
  two: {},
  three: {}
};
var compute = {};
var hooks = [];
var world_default = { methods, model, compute, hooks };

// node_modules/compromise/src/API/methods/compute.js
var isArray = (input) => Object.prototype.toString.call(input) === "[object Array]";
var fns = {
  /** add metadata to term objects */
  compute: function(input) {
    const { world: world2 } = this;
    const compute4 = world2.compute;
    if (typeof input === "string" && compute4.hasOwnProperty(input)) {
      compute4[input](this);
    } else if (isArray(input)) {
      input.forEach((name) => {
        if (world2.compute.hasOwnProperty(name)) {
          compute4[name](this);
        } else {
          console.warn("no compute:", input);
        }
      });
    } else if (typeof input === "function") {
      input(this);
    } else {
      console.warn("no compute:", input);
    }
    return this;
  }
};
var compute_default = fns;

// node_modules/compromise/src/API/methods/loops.js
var forEach = function(cb) {
  const ptrs = this.fullPointer;
  ptrs.forEach((ptr, i3) => {
    const view = this.update([ptr]);
    cb(view, i3);
  });
  return this;
};
var map = function(cb, empty) {
  const ptrs = this.fullPointer;
  const res = ptrs.map((ptr, i3) => {
    const view = this.update([ptr]);
    const out2 = cb(view, i3);
    if (out2 === void 0) {
      return this.none();
    }
    return out2;
  });
  if (res.length === 0) {
    return empty || this.update([]);
  }
  if (res[0] !== void 0) {
    if (typeof res[0] === "string") {
      return res;
    }
    if (typeof res[0] === "object" && (res[0] === null || !res[0].isView)) {
      return res;
    }
  }
  let all = [];
  res.forEach((ptr) => {
    all = all.concat(ptr.fullPointer);
  });
  return this.toView(all);
};
var filter = function(cb) {
  let ptrs = this.fullPointer;
  ptrs = ptrs.filter((ptr, i3) => {
    const view = this.update([ptr]);
    return cb(view, i3);
  });
  const res = this.update(ptrs);
  return res;
};
var find = function(cb) {
  const ptrs = this.fullPointer;
  const found = ptrs.find((ptr, i3) => {
    const view = this.update([ptr]);
    return cb(view, i3);
  });
  return this.update([found]);
};
var some = function(cb) {
  const ptrs = this.fullPointer;
  return ptrs.some((ptr, i3) => {
    const view = this.update([ptr]);
    return cb(view, i3);
  });
};
var random = function(n2 = 1) {
  let ptrs = this.fullPointer;
  let r2 = Math.floor(Math.random() * ptrs.length);
  if (r2 + n2 > this.length) {
    r2 = this.length - n2;
    r2 = r2 < 0 ? 0 : r2;
  }
  ptrs = ptrs.slice(r2, r2 + n2);
  return this.update(ptrs);
};
var loops_default = { forEach, map, filter, find, some, random };

// node_modules/compromise/src/API/methods/utils.js
var utils = {
  /** */
  termList: function() {
    return this.methods.one.termList(this.docs);
  },
  /** return individual terms*/
  terms: function(n2) {
    const m = this.match(".");
    return typeof n2 === "number" ? m.eq(n2) : m;
  },
  /** */
  groups: function(group) {
    if (group || group === 0) {
      return this.update(this._groups[group] || []);
    }
    const res = {};
    Object.keys(this._groups).forEach((k2) => {
      res[k2] = this.update(this._groups[k2]);
    });
    return res;
  },
  /** */
  eq: function(n2) {
    let ptr = this.pointer;
    if (!ptr) {
      ptr = this.docs.map((_doc, i3) => [i3]);
    }
    if (ptr[n2]) {
      return this.update([ptr[n2]]);
    }
    return this.none();
  },
  /** */
  first: function() {
    return this.eq(0);
  },
  /** */
  last: function() {
    const n2 = this.fullPointer.length - 1;
    return this.eq(n2);
  },
  /** grab term[0] for every match */
  firstTerms: function() {
    return this.match("^.");
  },
  /** grab the last term for every match  */
  lastTerms: function() {
    return this.match(".$");
  },
  /** */
  slice: function(min, max2) {
    let pntrs = this.pointer || this.docs.map((_o, n2) => [n2]);
    pntrs = pntrs.slice(min, max2);
    return this.update(pntrs);
  },
  /** return a view of the entire document */
  all: function() {
    return this.update().toView();
  },
  /**  */
  fullSentences: function() {
    const ptrs = this.fullPointer.map((a2) => [a2[0]]);
    return this.update(ptrs).toView();
  },
  /** return a view of no parts of the document */
  none: function() {
    return this.update([]);
  },
  /** are these two views looking at the same words? */
  isDoc: function(b) {
    if (!b || !b.isView) {
      return false;
    }
    const aPtr = this.fullPointer;
    const bPtr = b.fullPointer;
    if (!aPtr.length === bPtr.length) {
      return false;
    }
    return aPtr.every((ptr, i3) => {
      if (!bPtr[i3]) {
        return false;
      }
      return ptr[0] === bPtr[i3][0] && ptr[1] === bPtr[i3][1] && ptr[2] === bPtr[i3][2];
    });
  },
  /** how many seperate terms does the document have? */
  wordCount: function() {
    return this.docs.reduce((count, terms) => {
      count += terms.filter((t3) => t3.text !== "").length;
      return count;
    }, 0);
  },
  // is the pointer the full sentence?
  isFull: function() {
    const ptrs = this.pointer;
    if (!ptrs) {
      return true;
    }
    if (ptrs.length === 0 || ptrs[0][0] !== 0) {
      return false;
    }
    let wantTerms = 0;
    let haveTerms = 0;
    this.document.forEach((terms) => wantTerms += terms.length);
    this.docs.forEach((terms) => haveTerms += terms.length);
    return wantTerms === haveTerms;
  },
  // return the nth elem of a doc
  getNth: function(n2) {
    if (typeof n2 === "number") {
      return this.eq(n2);
    } else if (typeof n2 === "string") {
      return this.if(n2);
    }
    return this;
  }
};
utils.group = utils.groups;
utils.fullSentence = utils.fullSentences;
utils.sentence = utils.fullSentences;
utils.lastTerm = utils.lastTerms;
utils.firstTerm = utils.firstTerms;
var utils_default = utils;

// node_modules/compromise/src/API/methods/index.js
var methods2 = Object.assign({}, utils_default, compute_default, loops_default);
methods2.get = methods2.eq;
var methods_default = methods2;

// node_modules/compromise/src/API/View.js
var View = class _View {
  constructor(document, pointer, groups = {}) {
    const props = [
      ["document", document],
      ["world", world_default],
      ["_groups", groups],
      ["_cache", null],
      ["viewType", "View"]
    ];
    props.forEach((a2) => {
      Object.defineProperty(this, a2[0], {
        value: a2[1],
        writable: true
      });
    });
    this.ptrs = pointer;
  }
  /* getters:  */
  get docs() {
    let docs = this.document;
    if (this.ptrs) {
      docs = world_default.methods.one.getDoc(this.ptrs, this.document);
    }
    return docs;
  }
  get pointer() {
    return this.ptrs;
  }
  get methods() {
    return this.world.methods;
  }
  get model() {
    return this.world.model;
  }
  get hooks() {
    return this.world.hooks;
  }
  get isView() {
    return true;
  }
  // is the view not-empty?
  get found() {
    return this.docs.length > 0;
  }
  // how many matches we have
  get length() {
    return this.docs.length;
  }
  // return a more-hackable pointer
  get fullPointer() {
    const { docs, ptrs, document } = this;
    const pointers = ptrs || docs.map((_d, n2) => [n2]);
    return pointers.map((a2) => {
      let [n2, start2, end2, id, endId] = a2;
      start2 = start2 || 0;
      end2 = end2 || (document[n2] || []).length;
      if (document[n2] && document[n2][start2]) {
        id = id || document[n2][start2].id;
        if (document[n2][end2 - 1]) {
          endId = endId || document[n2][end2 - 1].id;
        }
      }
      return [n2, start2, end2, id, endId];
    });
  }
  // create a new View, from this one
  update(pointer) {
    const m = new _View(this.document, pointer);
    if (this._cache && pointer && pointer.length > 0) {
      const cache = [];
      pointer.forEach((ptr, i3) => {
        const [n2, start2, end2] = ptr;
        if (ptr.length === 1) {
          cache[i3] = this._cache[n2];
        } else if (start2 === 0 && this.document[n2].length === end2) {
          cache[i3] = this._cache[n2];
        }
      });
      if (cache.length > 0) {
        m._cache = cache;
      }
    }
    m.world = this.world;
    return m;
  }
  // create a new View, from this one
  toView(pointer) {
    return new _View(this.document, pointer || this.pointer);
  }
  fromText(input) {
    const { methods: methods17 } = this;
    const document = methods17.one.tokenize.fromString(input, this.world);
    const doc = new _View(document);
    doc.world = this.world;
    doc.compute(["normal", "freeze", "lexicon"]);
    if (this.world.compute.preTagger) {
      doc.compute("preTagger");
    }
    doc.compute("unfreeze");
    return doc;
  }
  clone() {
    let document = this.document.slice(0);
    document = document.map((terms) => {
      return terms.map((term) => {
        term = Object.assign({}, term);
        term.tags = new Set(term.tags);
        return term;
      });
    });
    const m = this.update(this.pointer);
    m.document = document;
    m._cache = this._cache;
    return m;
  }
};
Object.assign(View.prototype, methods_default);
var View_default = View;

// node_modules/compromise/src/_version.js
var version_default = "14.15.1";

// node_modules/compromise/src/API/extend.js
var isObject = function(item) {
  return item && typeof item === "object" && !Array.isArray(item);
};
var isArray2 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
function mergeDeep(model4, plugin2) {
  if (isObject(plugin2)) {
    for (const key in plugin2) {
      if (isObject(plugin2[key])) {
        if (!model4[key]) Object.assign(model4, { [key]: {} });
        mergeDeep(model4[key], plugin2[key]);
      } else {
        Object.assign(model4, { [key]: plugin2[key] });
      }
    }
  }
  return model4;
}
function mergeQuick(model4, plugin2) {
  for (const key in plugin2) {
    model4[key] = model4[key] || {};
    Object.assign(model4[key], plugin2[key]);
  }
  return model4;
}
var addIrregulars = function(model4, conj) {
  const m = model4.two.models || {};
  Object.keys(conj).forEach((k2) => {
    if (conj[k2].pastTense) {
      if (m.toPast) {
        m.toPast.ex[k2] = conj[k2].pastTense;
      }
      if (m.fromPast) {
        m.fromPast.ex[conj[k2].pastTense] = k2;
      }
    }
    if (conj[k2].presentTense) {
      if (m.toPresent) {
        m.toPresent.ex[k2] = conj[k2].presentTense;
      }
      if (m.fromPresent) {
        m.fromPresent.ex[conj[k2].presentTense] = k2;
      }
    }
    if (conj[k2].gerund) {
      if (m.toGerund) {
        m.toGerund.ex[k2] = conj[k2].gerund;
      }
      if (m.fromGerund) {
        m.fromGerund.ex[conj[k2].gerund] = k2;
      }
    }
    if (conj[k2].comparative) {
      if (m.toComparative) {
        m.toComparative.ex[k2] = conj[k2].comparative;
      }
      if (m.fromComparative) {
        m.fromComparative.ex[conj[k2].comparative] = k2;
      }
    }
    if (conj[k2].superlative) {
      if (m.toSuperlative) {
        m.toSuperlative.ex[k2] = conj[k2].superlative;
      }
      if (m.fromSuperlative) {
        m.fromSuperlative.ex[conj[k2].superlative] = k2;
      }
    }
  });
};
var extend = function(plugin2, world2, View2, nlp2) {
  if (isArray2(plugin2)) {
    plugin2.forEach((p2) => extend(p2, world2, View2, nlp2));
    return;
  }
  const { methods: methods17, model: model4, compute: compute4, hooks: hooks2 } = world2;
  if (plugin2.methods) {
    mergeQuick(methods17, plugin2.methods);
  }
  if (plugin2.model) {
    mergeDeep(model4, plugin2.model);
  }
  if (plugin2.irregulars) {
    addIrregulars(model4, plugin2.irregulars);
  }
  if (plugin2.compute) {
    Object.assign(compute4, plugin2.compute);
  }
  if (hooks2) {
    world2.hooks = hooks2.concat(plugin2.hooks || []);
  }
  if (plugin2.api) {
    plugin2.api(View2);
  }
  if (plugin2.lib) {
    Object.keys(plugin2.lib).forEach((k2) => nlp2[k2] = plugin2.lib[k2]);
  }
  if (plugin2.tags) {
    nlp2.addTags(plugin2.tags);
  }
  if (plugin2.words) {
    nlp2.addWords(plugin2.words);
  }
  if (plugin2.frozen) {
    nlp2.addWords(plugin2.frozen, true);
  }
  if (plugin2.mutate) {
    plugin2.mutate(world2, nlp2);
  }
};
var extend_default = extend;

// node_modules/compromise/src/API/_lib.js
var verbose = function(set) {
  const env = typeof process === "undefined" || !process.env ? self.env || {} : process.env;
  env.DEBUG_TAGS = set === "tagger" || set === true ? true : "";
  env.DEBUG_MATCH = set === "match" || set === true ? true : "";
  env.DEBUG_CHUNKS = set === "chunker" || set === true ? true : "";
  return this;
};

// node_modules/compromise/src/API/inputs.js
var isObject2 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
var isArray3 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
var fromJson = function(json) {
  return json.map((o2) => {
    return o2.terms.map((term) => {
      if (isArray3(term.tags)) {
        term.tags = new Set(term.tags);
      }
      return term;
    });
  });
};
var preTokenized = function(arr) {
  return arr.map((a2) => {
    return a2.map((str) => {
      return {
        text: str,
        normal: str,
        //cleanup
        pre: "",
        post: " ",
        tags: /* @__PURE__ */ new Set()
      };
    });
  });
};
var inputs = function(input, View2, world2) {
  const { methods: methods17 } = world2;
  const doc = new View2([]);
  doc.world = world2;
  if (typeof input === "number") {
    input = String(input);
  }
  if (!input) {
    return doc;
  }
  if (typeof input === "string") {
    const document = methods17.one.tokenize.fromString(input, world2);
    return new View2(document);
  }
  if (isObject2(input) && input.isView) {
    return new View2(input.document, input.ptrs);
  }
  if (isArray3(input)) {
    if (isArray3(input[0])) {
      const document2 = preTokenized(input);
      return new View2(document2);
    }
    const document = fromJson(input);
    return new View2(document);
  }
  return doc;
};
var inputs_default = inputs;

// node_modules/compromise/src/nlp.js
var world = Object.assign({}, world_default);
var nlp = function(input, lex) {
  if (lex) {
    nlp.addWords(lex);
  }
  const doc = inputs_default(input, View_default, world);
  if (input) {
    doc.compute(world.hooks);
  }
  return doc;
};
Object.defineProperty(nlp, "_world", {
  value: world,
  writable: true
});
nlp.tokenize = function(input, lex) {
  const { compute: compute4 } = this._world;
  if (lex) {
    nlp.addWords(lex);
  }
  const doc = inputs_default(input, View_default, world);
  if (compute4.contractions) {
    doc.compute(["alias", "normal", "machine", "contractions"]);
  }
  return doc;
};
nlp.plugin = function(plugin2) {
  extend_default(plugin2, this._world, View_default, this);
  return this;
};
nlp.extend = nlp.plugin;
nlp.world = function() {
  return this._world;
};
nlp.model = function() {
  return this._world.model;
};
nlp.methods = function() {
  return this._world.methods;
};
nlp.hooks = function() {
  return this._world.hooks;
};
nlp.verbose = verbose;
nlp.version = version_default;
var nlp_default = nlp;

// node_modules/compromise/src/1-one/cache/methods/cacheDoc.js
var createCache = function(document) {
  const cache = document.map((terms) => {
    const items = /* @__PURE__ */ new Set();
    terms.forEach((term) => {
      if (term.normal !== "") {
        items.add(term.normal);
      }
      if (term.switch) {
        items.add(`%${term.switch}%`);
      }
      if (term.implicit) {
        items.add(term.implicit);
      }
      if (term.machine) {
        items.add(term.machine);
      }
      if (term.root) {
        items.add(term.root);
      }
      if (term.alias) {
        term.alias.forEach((str) => items.add(str));
      }
      const tags = Array.from(term.tags);
      for (let t3 = 0; t3 < tags.length; t3 += 1) {
        items.add("#" + tags[t3]);
      }
    });
    return items;
  });
  return cache;
};
var cacheDoc_default = createCache;

// node_modules/compromise/src/1-one/cache/methods/index.js
var methods_default2 = {
  one: {
    cacheDoc: cacheDoc_default
  }
};

// node_modules/compromise/src/1-one/cache/api.js
var methods3 = {
  /** */
  cache: function() {
    this._cache = this.methods.one.cacheDoc(this.document);
    return this;
  },
  /** */
  uncache: function() {
    this._cache = null;
    return this;
  }
};
var addAPI = function(View2) {
  Object.assign(View2.prototype, methods3);
};
var api_default = addAPI;

// node_modules/compromise/src/1-one/cache/compute.js
var compute_default2 = {
  cache: function(view) {
    view._cache = view.methods.one.cacheDoc(view.document);
  }
};

// node_modules/compromise/src/1-one/cache/plugin.js
var plugin_default = {
  api: api_default,
  compute: compute_default2,
  methods: methods_default2
};

// node_modules/compromise/src/1-one/change/api/case.js
var case_default = {
  /** */
  toLowerCase: function() {
    this.termList().forEach((t3) => {
      t3.text = t3.text.toLowerCase();
    });
    return this;
  },
  /** */
  toUpperCase: function() {
    this.termList().forEach((t3) => {
      t3.text = t3.text.toUpperCase();
    });
    return this;
  },
  /** */
  toTitleCase: function() {
    this.termList().forEach((t3) => {
      t3.text = t3.text.replace(/^ *[a-z\u00C0-\u00FF]/, (x) => x.toUpperCase());
    });
    return this;
  },
  /** */
  toCamelCase: function() {
    this.docs.forEach((terms) => {
      terms.forEach((t3, i3) => {
        if (i3 !== 0) {
          t3.text = t3.text.replace(/^ *[a-z\u00C0-\u00FF]/, (x) => x.toUpperCase());
        }
        if (i3 !== terms.length - 1) {
          t3.post = "";
        }
      });
    });
    return this;
  }
};

// node_modules/compromise/src/1-one/change/api/lib/insert.js
var isTitleCase = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
var toTitleCase = (str) => str.replace(/^\p{Ll}/u, (x) => x.toUpperCase());
var toLowerCase = (str) => str.replace(/^\p{Lu}/u, (x) => x.toLowerCase());
var spliceArr = (parent, index3, child) => {
  child.forEach((term) => term.dirty = true);
  if (parent) {
    const args = [index3, 0].concat(child);
    Array.prototype.splice.apply(parent, args);
  }
  return parent;
};
var endSpace = function(terms) {
  const hasSpace2 = / $/;
  const hasDash4 = /[-–—]/;
  const lastTerm = terms[terms.length - 1];
  if (lastTerm && !hasSpace2.test(lastTerm.post) && !hasDash4.test(lastTerm.post)) {
    lastTerm.post += " ";
  }
};
var movePunct = (source, end2, needle) => {
  const juicy = /[-.?!,;:)–—'"]/g;
  const wasLast = source[end2 - 1];
  if (!wasLast) {
    return;
  }
  const post = wasLast.post;
  if (juicy.test(post)) {
    const punct = post.match(juicy).join("");
    const last = needle[needle.length - 1];
    last.post = punct + last.post;
    wasLast.post = wasLast.post.replace(juicy, "");
  }
};
var moveTitleCase = function(home, start2, needle) {
  const from = home[start2];
  if (start2 !== 0 || !isTitleCase(from.text)) {
    return;
  }
  needle[0].text = toTitleCase(needle[0].text);
  const old = home[start2];
  if (old.tags.has("ProperNoun") || old.tags.has("Acronym")) {
    return;
  }
  if (isTitleCase(old.text) && old.text.length > 1) {
    old.text = toLowerCase(old.text);
  }
};
var cleanPrepend = function(home, ptr, needle, document) {
  const [n2, start2, end2] = ptr;
  if (start2 === 0) {
    endSpace(needle);
  } else if (end2 === document[n2].length) {
    endSpace(needle);
  } else {
    endSpace(needle);
    endSpace([home[ptr[1]]]);
  }
  moveTitleCase(home, start2, needle);
  spliceArr(home, start2, needle);
};
var cleanAppend = function(home, ptr, needle, document) {
  const [n2, , end2] = ptr;
  const total = (document[n2] || []).length;
  if (end2 < total) {
    movePunct(home, end2, needle);
    endSpace(needle);
  } else if (total === end2) {
    endSpace(home);
    movePunct(home, end2, needle);
    if (document[n2 + 1]) {
      needle[needle.length - 1].post += " ";
    }
  }
  spliceArr(home, ptr[2], needle);
  ptr[4] = needle[needle.length - 1].id;
};

// node_modules/compromise/src/1-one/change/compute/uuid.js
var index = 0;
var pad3 = (str) => {
  str = str.length < 3 ? "0" + str : str;
  return str.length < 3 ? "0" + str : str;
};
var toId = function(term) {
  let [n2, i3] = term.index || [0, 0];
  index += 1;
  index = index > 46655 ? 0 : index;
  n2 = n2 > 46655 ? 0 : n2;
  i3 = i3 > 1294 ? 0 : i3;
  let id = pad3(index.toString(36));
  id += pad3(n2.toString(36));
  let tx = i3.toString(36);
  tx = tx.length < 2 ? "0" + tx : tx;
  id += tx;
  const r2 = parseInt(Math.random() * 36, 10);
  id += r2.toString(36);
  return term.normal + "|" + id.toUpperCase();
};
var uuid_default = toId;

// node_modules/compromise/src/1-one/change/api/insert.js
var expand = function(m) {
  if (m.has("@hasContraction") && typeof m.contractions === "function") {
    const more = m.grow("@hasContraction");
    more.contractions().expand();
  }
};
var isArray4 = (arr) => Object.prototype.toString.call(arr) === "[object Array]";
var addIds = function(terms) {
  terms = terms.map((term) => {
    term.id = uuid_default(term);
    return term;
  });
  return terms;
};
var getTerms = function(input, world2) {
  const { methods: methods17 } = world2;
  if (typeof input === "string") {
    return methods17.one.tokenize.fromString(input, world2)[0];
  }
  if (typeof input === "object" && input.isView) {
    return input.clone().docs[0] || [];
  }
  if (isArray4(input)) {
    return isArray4(input[0]) ? input[0] : input;
  }
  return [];
};
var insert = function(input, view, prepend) {
  const { document, world: world2 } = view;
  view.uncache();
  const ptrs = view.fullPointer;
  const selfPtrs = view.fullPointer;
  view.forEach((m, i3) => {
    const ptr = m.fullPointer[0];
    const [n2] = ptr;
    const home = document[n2];
    let terms = getTerms(input, world2);
    if (terms.length === 0) {
      return;
    }
    terms = addIds(terms);
    if (prepend) {
      expand(view.update([ptr]).firstTerm());
      cleanPrepend(home, ptr, terms, document);
    } else {
      expand(view.update([ptr]).lastTerm());
      cleanAppend(home, ptr, terms, document);
    }
    if (document[n2] && document[n2][ptr[1]]) {
      ptr[3] = document[n2][ptr[1]].id;
    }
    selfPtrs[i3] = ptr;
    ptr[2] += terms.length;
    ptrs[i3] = ptr;
  });
  const doc = view.toView(ptrs);
  view.ptrs = selfPtrs;
  doc.compute(["id", "index", "freeze", "lexicon"]);
  if (doc.world.compute.preTagger) {
    doc.compute("preTagger");
  }
  doc.compute("unfreeze");
  return doc;
};
var fns2 = {
  insertAfter: function(input) {
    return insert(input, this, false);
  },
  insertBefore: function(input) {
    return insert(input, this, true);
  }
};
fns2.append = fns2.insertAfter;
fns2.prepend = fns2.insertBefore;
fns2.insert = fns2.insertAfter;
var insert_default = fns2;

// node_modules/compromise/src/1-one/change/api/replace.js
var dollarStub = /\$[0-9a-z]+/g;
var fns3 = {};
var isTitleCase2 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
var toTitleCase2 = (str) => str.replace(/^\p{Ll}/u, (x) => x.toUpperCase());
var toLowerCase2 = (str) => str.replace(/^\p{Lu}/u, (x) => x.toLowerCase());
var replaceByFn = function(main, fn, keep) {
  main.forEach((m) => {
    const out2 = fn(m);
    m.replaceWith(out2, keep);
  });
  return main;
};
var subDollarSign = function(input, main) {
  if (typeof input !== "string") {
    return input;
  }
  const groups = main.groups();
  input = input.replace(dollarStub, (a2) => {
    const num = a2.replace(/\$/, "");
    if (groups.hasOwnProperty(num)) {
      return groups[num].text();
    }
    return a2;
  });
  return input;
};
fns3.replaceWith = function(input, keep = {}) {
  let ptrs = this.fullPointer;
  const main = this;
  this.uncache();
  if (typeof input === "function") {
    return replaceByFn(main, input, keep);
  }
  const terms = main.docs[0];
  if (!terms) return main;
  const isOriginalPossessive = keep.possessives && terms[terms.length - 1].tags.has("Possessive");
  const isOriginalTitleCase = keep.case && isTitleCase2(terms[0].text);
  input = subDollarSign(input, main);
  const original = this.update(ptrs);
  ptrs = ptrs.map((ptr) => ptr.slice(0, 3));
  const oldTags = (original.docs[0] || []).map((term) => Array.from(term.tags));
  const originalPre = original.docs[0][0].pre;
  const originalPost = original.docs[0][original.docs[0].length - 1].post;
  if (typeof input === "string") {
    input = this.fromText(input).compute("id");
  }
  main.insertAfter(input);
  if (original.has("@hasContraction") && main.contractions) {
    const more = main.grow("@hasContraction+");
    more.contractions().expand();
  }
  main.delete(original);
  if (isOriginalPossessive) {
    const tmp = main.docs[0];
    const term = tmp[tmp.length - 1];
    if (!term.tags.has("Possessive")) {
      term.text += "'s";
      term.normal += "'s";
      term.tags.add("Possessive");
    }
  }
  if (originalPre && main.docs[0]) {
    main.docs[0][0].pre = originalPre;
  }
  if (originalPost && main.docs[0]) {
    const lastOne = main.docs[0][main.docs[0].length - 1];
    if (!lastOne.post.trim()) {
      lastOne.post = originalPost;
    }
  }
  const m = main.toView(ptrs).compute(["index", "freeze", "lexicon"]);
  if (m.world.compute.preTagger) {
    m.compute("preTagger");
  }
  m.compute("unfreeze");
  if (keep.tags) {
    m.terms().forEach((term, i3) => {
      term.tagSafe(oldTags[i3]);
    });
  }
  if (!m.docs[0] || !m.docs[0][0]) return m;
  if (keep.case) {
    const transformCase = isOriginalTitleCase ? toTitleCase2 : toLowerCase2;
    m.docs[0][0].text = transformCase(m.docs[0][0].text);
  }
  return m;
};
fns3.replace = function(match2, input, keep) {
  if (match2 && !input) {
    return this.replaceWith(match2, keep);
  }
  const m = this.match(match2);
  if (!m.found) {
    return this;
  }
  this.soften();
  return m.replaceWith(input, keep);
};
var replace_default = fns3;

// node_modules/compromise/src/1-one/change/api/lib/remove.js
var repairPunct = function(terms, len) {
  const last = terms.length - 1;
  const from = terms[last];
  const to = terms[last - len];
  if (to && from) {
    to.post += from.post;
    to.post = to.post.replace(/ +([.?!,;:])/, "$1");
    to.post = to.post.replace(/[,;:]+([.?!])/, "$1");
  }
};
var pluckOut = function(document, nots) {
  nots.forEach((ptr) => {
    const [n2, start2, end2] = ptr;
    const len = end2 - start2;
    if (!document[n2]) {
      return;
    }
    if (end2 === document[n2].length && end2 > 1) {
      repairPunct(document[n2], len);
    }
    document[n2].splice(start2, len);
  });
  for (let i3 = document.length - 1; i3 >= 0; i3 -= 1) {
    if (document[i3].length === 0) {
      document.splice(i3, 1);
      if (i3 === document.length && document[i3 - 1]) {
        const terms = document[i3 - 1];
        const lastTerm = terms[terms.length - 1];
        if (lastTerm) {
          lastTerm.post = lastTerm.post.trimEnd();
        }
      }
    }
  }
  return document;
};
var remove_default = pluckOut;

// node_modules/compromise/src/1-one/change/api/remove.js
var fixPointers = function(ptrs, gonePtrs) {
  ptrs = ptrs.map((ptr) => {
    const [n2] = ptr;
    if (!gonePtrs[n2]) {
      return ptr;
    }
    gonePtrs[n2].forEach((no) => {
      const len = no[2] - no[1];
      if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
        ptr[2] -= len;
      }
    });
    return ptr;
  });
  ptrs.forEach((ptr, i3) => {
    if (ptr[1] === 0 && ptr[2] == 0) {
      for (let n2 = i3 + 1; n2 < ptrs.length; n2 += 1) {
        ptrs[n2][0] -= 1;
        if (ptrs[n2][0] < 0) {
          ptrs[n2][0] = 0;
        }
      }
    }
  });
  ptrs = ptrs.filter((ptr) => ptr[2] - ptr[1] > 0);
  ptrs = ptrs.map((ptr) => {
    ptr[3] = null;
    ptr[4] = null;
    return ptr;
  });
  return ptrs;
};
var methods4 = {
  /** */
  remove: function(reg) {
    const { indexN: indexN2 } = this.methods.one.pointer;
    this.uncache();
    let self2 = this.all();
    let not = this;
    if (reg) {
      self2 = this;
      not = this.match(reg);
    }
    const isFull = !self2.ptrs;
    if (not.has("@hasContraction") && not.contractions) {
      const more = not.grow("@hasContraction");
      more.contractions().expand();
    }
    let ptrs = self2.fullPointer;
    const nots = not.fullPointer.reverse();
    const document = remove_default(this.document, nots);
    const gonePtrs = indexN2(nots);
    ptrs = fixPointers(ptrs, gonePtrs);
    self2.ptrs = ptrs;
    self2.document = document;
    self2.compute("index");
    if (isFull) {
      self2.ptrs = void 0;
    }
    if (!reg) {
      this.ptrs = [];
      return self2.none();
    }
    const res = self2.toView(ptrs);
    return res;
  }
};
methods4.delete = methods4.remove;
var remove_default2 = methods4;

// node_modules/compromise/src/1-one/change/api/whitespace.js
var methods5 = {
  /** add this punctuation or whitespace before each match: */
  pre: function(str, concat) {
    if (str === void 0 && this.found) {
      return this.docs[0][0].pre;
    }
    this.docs.forEach((terms) => {
      const term = terms[0];
      if (concat === true) {
        term.pre += str;
      } else {
        term.pre = str;
      }
    });
    return this;
  },
  /** add this punctuation or whitespace after each match: */
  post: function(str, concat) {
    if (str === void 0) {
      const last = this.docs[this.docs.length - 1];
      return last[last.length - 1].post;
    }
    this.docs.forEach((terms) => {
      const term = terms[terms.length - 1];
      if (concat === true) {
        term.post += str;
      } else {
        term.post = str;
      }
    });
    return this;
  },
  /** remove whitespace from start/end */
  trim: function() {
    if (!this.found) {
      return this;
    }
    const docs = this.docs;
    const start2 = docs[0][0];
    start2.pre = start2.pre.trimStart();
    const last = docs[docs.length - 1];
    const end2 = last[last.length - 1];
    end2.post = end2.post.trimEnd();
    return this;
  },
  /** connect words with hyphen, and remove whitespace */
  hyphenate: function() {
    this.docs.forEach((terms) => {
      terms.forEach((t3, i3) => {
        if (i3 !== 0) {
          t3.pre = "";
        }
        if (terms[i3 + 1]) {
          t3.post = "-";
        }
      });
    });
    return this;
  },
  /** remove hyphens between words, and set whitespace */
  dehyphenate: function() {
    const hasHyphen3 = /[-–—]/;
    this.docs.forEach((terms) => {
      terms.forEach((t3) => {
        if (hasHyphen3.test(t3.post)) {
          t3.post = " ";
        }
      });
    });
    return this;
  },
  /** add quotations around these matches */
  toQuotations: function(start2, end2) {
    start2 = start2 || `"`;
    end2 = end2 || `"`;
    this.docs.forEach((terms) => {
      terms[0].pre = start2 + terms[0].pre;
      const last = terms[terms.length - 1];
      last.post = end2 + last.post;
    });
    return this;
  },
  /** add brackets around these matches */
  toParentheses: function(start2, end2) {
    start2 = start2 || `(`;
    end2 = end2 || `)`;
    this.docs.forEach((terms) => {
      terms[0].pre = start2 + terms[0].pre;
      const last = terms[terms.length - 1];
      last.post = end2 + last.post;
    });
    return this;
  }
};
methods5.deHyphenate = methods5.dehyphenate;
methods5.toQuotation = methods5.toQuotations;
var whitespace_default = methods5;

// node_modules/compromise/src/1-one/change/api/lib/_sort.js
var alpha = (a2, b) => {
  if (a2.normal < b.normal) {
    return -1;
  }
  if (a2.normal > b.normal) {
    return 1;
  }
  return 0;
};
var length = (a2, b) => {
  const left = a2.normal.trim().length;
  const right = b.normal.trim().length;
  if (left < right) {
    return 1;
  }
  if (left > right) {
    return -1;
  }
  return 0;
};
var wordCount = (a2, b) => {
  if (a2.words < b.words) {
    return 1;
  }
  if (a2.words > b.words) {
    return -1;
  }
  return 0;
};
var sequential = (a2, b) => {
  if (a2[0] < b[0]) {
    return 1;
  }
  if (a2[0] > b[0]) {
    return -1;
  }
  return a2[1] > b[1] ? 1 : -1;
};
var byFreq = function(arr) {
  const counts = {};
  arr.forEach((o2) => {
    counts[o2.normal] = counts[o2.normal] || 0;
    counts[o2.normal] += 1;
  });
  arr.sort((a2, b) => {
    const left = counts[a2.normal];
    const right = counts[b.normal];
    if (left < right) {
      return 1;
    }
    if (left > right) {
      return -1;
    }
    return 0;
  });
  return arr;
};
var sort_default = { alpha, length, wordCount, sequential, byFreq };

// node_modules/compromise/src/1-one/change/api/sort.js
var seqNames = /* @__PURE__ */ new Set(["index", "sequence", "seq", "sequential", "chron", "chronological"]);
var freqNames = /* @__PURE__ */ new Set(["freq", "frequency", "topk", "repeats"]);
var alphaNames = /* @__PURE__ */ new Set(["alpha", "alphabetical"]);
var customSort = function(view, fn) {
  let ptrs = view.fullPointer;
  ptrs = ptrs.sort((a2, b) => {
    a2 = view.update([a2]);
    b = view.update([b]);
    return fn(a2, b);
  });
  view.ptrs = ptrs;
  return view;
};
var sort = function(input) {
  const { docs, pointer } = this;
  this.uncache();
  if (typeof input === "function") {
    return customSort(this, input);
  }
  input = input || "alpha";
  const ptrs = pointer || docs.map((_d, n2) => [n2]);
  let arr = docs.map((terms, n2) => {
    return {
      index: n2,
      words: terms.length,
      normal: terms.map((t3) => t3.machine || t3.normal || "").join(" "),
      pointer: ptrs[n2]
    };
  });
  if (seqNames.has(input)) {
    input = "sequential";
  }
  if (alphaNames.has(input)) {
    input = "alpha";
  }
  if (freqNames.has(input)) {
    arr = sort_default.byFreq(arr);
    return this.update(arr.map((o2) => o2.pointer));
  }
  if (typeof sort_default[input] === "function") {
    arr = arr.sort(sort_default[input]);
    return this.update(arr.map((o2) => o2.pointer));
  }
  return this;
};
var reverse = function() {
  let ptrs = this.pointer || this.docs.map((_d, n2) => [n2]);
  ptrs = [].concat(ptrs);
  ptrs = ptrs.reverse();
  if (this._cache) {
    this._cache = this._cache.reverse();
  }
  return this.update(ptrs);
};
var unique = function() {
  const already = /* @__PURE__ */ new Set();
  const res = this.filter((m) => {
    const txt = m.text("machine");
    if (already.has(txt)) {
      return false;
    }
    already.add(txt);
    return true;
  });
  return res;
};
var sort_default2 = { unique, reverse, sort };

// node_modules/compromise/src/1-one/change/api/concat.js
var isArray5 = (arr) => Object.prototype.toString.call(arr) === "[object Array]";
var combineDocs = function(homeDocs, inputDocs) {
  if (homeDocs.length > 0) {
    const end2 = homeDocs[homeDocs.length - 1];
    const last = end2[end2.length - 1];
    if (/ /.test(last.post) === false) {
      last.post += " ";
    }
  }
  homeDocs = homeDocs.concat(inputDocs);
  return homeDocs;
};
var combineViews = function(home, input) {
  if (home.document === input.document) {
    const ptrs2 = home.fullPointer.concat(input.fullPointer);
    return home.toView(ptrs2).compute("index");
  }
  const ptrs = input.fullPointer;
  ptrs.forEach((a2) => {
    a2[0] += home.document.length;
  });
  home.document = combineDocs(home.document, input.docs);
  return home.all();
};
var concat_default = {
  // add string as new match/sentence
  concat: function(input) {
    if (typeof input === "string") {
      const more = this.fromText(input);
      if (!this.found || !this.ptrs) {
        this.document = this.document.concat(more.document);
      } else {
        const ptrs = this.fullPointer;
        const at = ptrs[ptrs.length - 1][0];
        this.document.splice(at, 0, ...more.document);
      }
      return this.all().compute("index");
    }
    if (typeof input === "object" && input.isView) {
      return combineViews(this, input);
    }
    if (isArray5(input)) {
      const docs = combineDocs(this.document, input);
      this.document = docs;
      return this.all();
    }
    return this;
  }
};

// node_modules/compromise/src/1-one/change/api/harden.js
var harden = function() {
  this.ptrs = this.fullPointer;
  return this;
};
var soften = function() {
  let ptr = this.ptrs;
  if (!ptr || ptr.length < 1) {
    return this;
  }
  ptr = ptr.map((a2) => a2.slice(0, 3));
  this.ptrs = ptr;
  return this;
};
var harden_default = { harden, soften };

// node_modules/compromise/src/1-one/change/api/index.js
var methods6 = Object.assign({}, case_default, insert_default, replace_default, remove_default2, whitespace_default, sort_default2, concat_default, harden_default);
var addAPI2 = function(View2) {
  Object.assign(View2.prototype, methods6);
};
var api_default2 = addAPI2;

// node_modules/compromise/src/1-one/change/compute/index.js
var compute2 = {
  id: function(view) {
    const docs = view.docs;
    for (let n2 = 0; n2 < docs.length; n2 += 1) {
      for (let i3 = 0; i3 < docs[n2].length; i3 += 1) {
        const term = docs[n2][i3];
        term.id = term.id || uuid_default(term);
      }
    }
  }
};
var compute_default3 = compute2;

// node_modules/compromise/src/1-one/change/plugin.js
var plugin_default2 = {
  api: api_default2,
  compute: compute_default3
};

// node_modules/compromise/src/1-one/contraction-one/model/contractions.js
var contractions_default = [
  // simple mappings
  { word: "@", out: ["at"] },
  { word: "arent", out: ["are", "not"] },
  { word: "alot", out: ["a", "lot"] },
  { word: "brb", out: ["be", "right", "back"] },
  { word: "cannot", out: ["can", "not"] },
  { word: "dun", out: ["do", "not"] },
  { word: "can't", out: ["can", "not"] },
  { word: "shan't", out: ["should", "not"] },
  { word: "won't", out: ["will", "not"] },
  { word: "that's", out: ["that", "is"] },
  { word: "what's", out: ["what", "is"] },
  { word: "let's", out: ["let", "us"] },
  // { word: "there's", out: ['there', 'is'] },
  { word: "dunno", out: ["do", "not", "know"] },
  { word: "gonna", out: ["going", "to"] },
  { word: "gotta", out: ["have", "got", "to"] },
  //hmm
  { word: "gimme", out: ["give", "me"] },
  { word: "outta", out: ["out", "of"] },
  { word: "tryna", out: ["trying", "to"] },
  { word: "gtg", out: ["got", "to", "go"] },
  { word: "im", out: ["i", "am"] },
  { word: "imma", out: ["I", "will"] },
  { word: "imo", out: ["in", "my", "opinion"] },
  { word: "irl", out: ["in", "real", "life"] },
  { word: "ive", out: ["i", "have"] },
  { word: "rn", out: ["right", "now"] },
  { word: "tbh", out: ["to", "be", "honest"] },
  { word: "wanna", out: ["want", "to"] },
  { word: `c'mere`, out: ["come", "here"] },
  { word: `c'mon`, out: ["come", "on"] },
  // shoulda, coulda
  { word: "shoulda", out: ["should", "have"] },
  { word: "coulda", out: ["coulda", "have"] },
  { word: "woulda", out: ["woulda", "have"] },
  { word: "musta", out: ["must", "have"] },
  { word: "tis", out: ["it", "is"] },
  { word: "twas", out: ["it", "was"] },
  { word: `y'know`, out: ["you", "know"] },
  { word: "ne'er", out: ["never"] },
  { word: "o'er", out: ["over"] },
  // contraction-part mappings
  { after: "ll", out: ["will"] },
  { after: "ve", out: ["have"] },
  { after: "re", out: ["are"] },
  { after: "m", out: ["am"] },
  // french contractions
  { before: "c", out: ["ce"] },
  { before: "m", out: ["me"] },
  { before: "n", out: ["ne"] },
  { before: "qu", out: ["que"] },
  { before: "s", out: ["se"] },
  { before: "t", out: ["tu"] },
  // t'aime
  // missing apostrophes
  { word: "shouldnt", out: ["should", "not"] },
  { word: "couldnt", out: ["could", "not"] },
  { word: "wouldnt", out: ["would", "not"] },
  { word: "hasnt", out: ["has", "not"] },
  { word: "wasnt", out: ["was", "not"] },
  { word: "isnt", out: ["is", "not"] },
  { word: "cant", out: ["can", "not"] },
  { word: "dont", out: ["do", "not"] },
  { word: "wont", out: ["will", "not"] },
  // apostrophe d
  { word: "howd", out: ["how", "did"] },
  { word: "whatd", out: ["what", "did"] },
  { word: "whend", out: ["when", "did"] },
  { word: "whered", out: ["where", "did"] }
];

// node_modules/compromise/src/1-one/contraction-one/model/number-suffix.js
var t = true;
var number_suffix_default = {
  "st": t,
  "nd": t,
  "rd": t,
  "th": t,
  "am": t,
  "pm": t,
  "max": t,
  "\xB0": t,
  "s": t,
  // 1990s
  "e": t,
  // 18e - french/spanish ordinal
  "er": t,
  //french 1er
  "\xE8re": t,
  //''
  "\xE8me": t
  //french 2ème
};

// node_modules/compromise/src/1-one/contraction-one/model/index.js
var model_default = {
  one: {
    contractions: contractions_default,
    numberSuffixes: number_suffix_default
  }
};

// node_modules/compromise/src/1-one/contraction-one/compute/contractions/_splice.js
var insertContraction = function(document, point, words) {
  const [n2, w] = point;
  if (!words || words.length === 0) {
    return;
  }
  words = words.map((word, i3) => {
    word.implicit = word.text;
    word.machine = word.text;
    word.pre = "";
    word.post = "";
    word.text = "";
    word.normal = "";
    word.index = [n2, w + i3];
    return word;
  });
  if (words[0]) {
    words[0].pre = document[n2][w].pre;
    words[words.length - 1].post = document[n2][w].post;
    words[0].text = document[n2][w].text;
    words[0].normal = document[n2][w].normal;
  }
  document[n2].splice(w, 1, ...words);
};
var splice_default = insertContraction;

// node_modules/compromise/src/1-one/contraction-one/compute/contractions/apostrophe-d.js
var hasContraction = /'/;
var alwaysDid = /* @__PURE__ */ new Set([
  "what",
  "how",
  "when",
  "where",
  "why"
]);
var useWould = /* @__PURE__ */ new Set([
  "be",
  "go",
  "start",
  "think",
  "need"
]);
var useHad = /* @__PURE__ */ new Set([
  "been",
  "gone"
]);
var _apostropheD = function(terms, i3) {
  const before2 = terms[i3].normal.split(hasContraction)[0];
  if (alwaysDid.has(before2)) {
    return [before2, "did"];
  }
  if (terms[i3 + 1]) {
    if (useHad.has(terms[i3 + 1].normal)) {
      return [before2, "had"];
    }
    if (useWould.has(terms[i3 + 1].normal)) {
      return [before2, "would"];
    }
  }
  return null;
};
var apostrophe_d_default = _apostropheD;

// node_modules/compromise/src/1-one/contraction-one/compute/contractions/apostrophe-t.js
var apostropheT = function(terms, i3) {
  if (terms[i3].normal === "ain't" || terms[i3].normal === "aint") {
    return null;
  }
  const before2 = terms[i3].normal.replace(/n't/, "");
  return [before2, "not"];
};
var apostrophe_t_default = apostropheT;

// node_modules/compromise/src/1-one/contraction-one/compute/contractions/french.js
var hasContraction2 = /'/;
var isFeminine = /(e|é|aison|sion|tion)$/;
var isMasculine = /(age|isme|acle|ege|oire)$/;
var preL = (terms, i3) => {
  const after2 = terms[i3].normal.split(hasContraction2)[1];
  if (after2 && after2.endsWith("e")) {
    return ["la", after2];
  }
  return ["le", after2];
};
var preD = (terms, i3) => {
  const after2 = terms[i3].normal.split(hasContraction2)[1];
  if (after2 && isFeminine.test(after2) && !isMasculine.test(after2)) {
    return ["du", after2];
  } else if (after2 && after2.endsWith("s")) {
    return ["des", after2];
  }
  return ["de", after2];
};
var preJ = (terms, i3) => {
  const after2 = terms[i3].normal.split(hasContraction2)[1];
  return ["je", after2];
};
var french_default = {
  preJ,
  preL,
  preD
};

// node_modules/compromise/src/1-one/contraction-one/compute/contractions/number-range.js
var isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
var timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
var phoneNum = /^[0-9]{3}-[0-9]{4}$/;
var numberRange = function(terms, i3) {
  const term = terms[i3];
  let parts = term.text.match(isRange);
  if (parts !== null) {
    if (term.tags.has("PhoneNumber") === true || phoneNum.test(term.text)) {
      return null;
    }
    return [parts[1], "to", parts[2]];
  } else {
    parts = term.text.match(timeRange);
    if (parts !== null) {
      return [parts[1], "to", parts[4]];
    }
  }
  return null;
};
var number_range_default = numberRange;

// node_modules/compromise/src/1-one/contraction-one/compute/contractions/number-unit.js
var numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/;
var numberUnit = function(terms, i3, world2) {
  const notUnit = world2.model.one.numberSuffixes || {};
  const term = terms[i3];
  const parts = term.text.match(numUnit);
  if (parts !== null) {
    const unit = parts[2].toLowerCase().trim();
    if (notUnit.hasOwnProperty(unit)) {
      return null;
    }
    return [parts[1], unit];
  }
  return null;
};
var number_unit_default = numberUnit;

// node_modules/compromise/src/1-one/contraction-one/compute/contractions/index.js
var byApostrophe = /'/;
var numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;
var reTag = function(terms, view, start2, len) {
  const tmp = view.update();
  tmp.document = [terms];
  let end2 = start2 + len;
  if (start2 > 0) {
    start2 -= 1;
  }
  if (terms[end2]) {
    end2 += 1;
  }
  tmp.ptrs = [[0, start2, end2]];
};
var byEnd = {
  // ain't
  t: (terms, i3) => apostrophe_t_default(terms, i3),
  // how'd
  d: (terms, i3) => apostrophe_d_default(terms, i3)
};
var byStart = {
  // j'aime
  j: (terms, i3) => french_default.preJ(terms, i3),
  // l'amour
  l: (terms, i3) => french_default.preL(terms, i3),
  // d'amerique
  d: (terms, i3) => french_default.preD(terms, i3)
};
var knownOnes = function(list2, term, before2, after2) {
  for (let i3 = 0; i3 < list2.length; i3 += 1) {
    const o2 = list2[i3];
    if (o2.word === term.normal) {
      return o2.out;
    } else if (after2 !== null && after2 === o2.after) {
      return [before2].concat(o2.out);
    } else if (before2 !== null && before2 === o2.before && after2 && after2.length > 2) {
      return o2.out.concat(after2);
    }
  }
  return null;
};
var toDocs = function(words, view) {
  const doc = view.fromText(words.join(" "));
  doc.compute(["id", "alias"]);
  return doc.docs[0];
};
var thereHas = function(terms, i3) {
  for (let k2 = i3 + 1; k2 < 5; k2 += 1) {
    if (!terms[k2]) {
      break;
    }
    if (terms[k2].normal === "been") {
      return ["there", "has"];
    }
  }
  return ["there", "is"];
};
var contractions = (view) => {
  const { world: world2, document } = view;
  const { model: model4, methods: methods17 } = world2;
  const list2 = model4.one.contractions || [];
  document.forEach((terms, n2) => {
    for (let i3 = terms.length - 1; i3 >= 0; i3 -= 1) {
      let before2 = null;
      let after2 = null;
      if (byApostrophe.test(terms[i3].normal) === true) {
        const res = terms[i3].normal.split(byApostrophe);
        before2 = res[0];
        after2 = res[1];
      }
      let words = knownOnes(list2, terms[i3], before2, after2);
      if (!words && byEnd.hasOwnProperty(after2)) {
        words = byEnd[after2](terms, i3, world2);
      }
      if (!words && byStart.hasOwnProperty(before2)) {
        words = byStart[before2](terms, i3);
      }
      if (before2 === "there" && after2 === "s") {
        words = thereHas(terms, i3);
      }
      if (words) {
        words = toDocs(words, view);
        splice_default(document, [n2, i3], words);
        reTag(document[n2], view, i3, words.length);
        continue;
      }
      if (numDash.test(terms[i3].normal)) {
        words = number_range_default(terms, i3);
        if (words) {
          words = toDocs(words, view);
          splice_default(document, [n2, i3], words);
          methods17.one.setTag(words, "NumberRange", world2);
          if (words[2] && words[2].tags.has("Time")) {
            methods17.one.setTag([words[0]], "Time", world2, null, "time-range");
          }
          reTag(document[n2], view, i3, words.length);
        }
        continue;
      }
      words = number_unit_default(terms, i3, world2);
      if (words) {
        words = toDocs(words, view);
        splice_default(document, [n2, i3], words);
        methods17.one.setTag([words[1]], "Unit", world2, null, "contraction-unit");
      }
    }
  });
};
var contractions_default2 = contractions;

// node_modules/compromise/src/1-one/contraction-one/compute/index.js
var compute_default4 = { contractions: contractions_default2 };

// node_modules/compromise/src/1-one/contraction-one/plugin.js
var plugin = {
  model: model_default,
  compute: compute_default4,
  hooks: ["contractions"]
};
var plugin_default3 = plugin;

// node_modules/compromise/src/1-one/freeze/compute.js
var freeze = function(view) {
  const world2 = view.world;
  const { model: model4, methods: methods17 } = view.world;
  const setTag2 = methods17.one.setTag;
  const { frozenLex } = model4.one;
  const multi = model4.one._multiCache || {};
  view.docs.forEach((terms) => {
    for (let i3 = 0; i3 < terms.length; i3 += 1) {
      const t3 = terms[i3];
      const word = t3.machine || t3.normal;
      if (multi[word] !== void 0 && terms[i3 + 1]) {
        const end2 = i3 + multi[word] - 1;
        for (let k2 = end2; k2 > i3; k2 -= 1) {
          const words = terms.slice(i3, k2 + 1);
          const str = words.map((term) => term.machine || term.normal).join(" ");
          if (frozenLex.hasOwnProperty(str) === true) {
            setTag2(words, frozenLex[str], world2, false, "1-frozen-multi-lexicon");
            words.forEach((term) => term.frozen = true);
            continue;
          }
        }
      }
      if (frozenLex[word] !== void 0 && frozenLex.hasOwnProperty(word)) {
        setTag2([t3], frozenLex[word], world2, false, "1-freeze-lexicon");
        t3.frozen = true;
        continue;
      }
    }
  });
};
var unfreeze = function(view) {
  view.docs.forEach((ts) => {
    ts.forEach((term) => {
      delete term.frozen;
    });
  });
  return view;
};
var compute_default5 = { frozen: freeze, freeze, unfreeze };

// node_modules/compromise/src/1-one/freeze/debug.js
var blue = (str) => "\x1B[34m" + str + "\x1B[0m";
var dim = (str) => "\x1B[3m\x1B[2m" + str + "\x1B[0m";
var debug = function(view) {
  view.docs.forEach((terms) => {
    console.log(blue("\n  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
    terms.forEach((t3) => {
      let str = `  ${dim("\u2502")}  `;
      const txt = t3.implicit || t3.text || "-";
      if (t3.frozen === true) {
        str += `${blue(txt)} \u2744\uFE0F`;
      } else {
        str += dim(txt);
      }
      console.log(str);
    });
  });
};
var debug_default = debug;

// node_modules/compromise/src/1-one/freeze/plugin.js
var plugin_default4 = {
  // add .compute('freeze')
  compute: compute_default5,
  mutate: (world2) => {
    const methods17 = world2.methods.one;
    methods17.termMethods.isFrozen = (term) => term.frozen === true;
    methods17.debug.freeze = debug_default;
    methods17.debug.frozen = debug_default;
  },
  api: function(View2) {
    View2.prototype.freeze = function() {
      this.docs.forEach((ts) => {
        ts.forEach((term) => {
          term.frozen = true;
        });
      });
      return this;
    };
    View2.prototype.unfreeze = function() {
      this.compute("unfreeze");
    };
    View2.prototype.isFrozen = function() {
      return this.match("@isFrozen+");
    };
  },
  // run it in init
  hooks: ["freeze"]
};

// node_modules/compromise/src/1-one/lexicon/compute/multi-word.js
var multiWord = function(terms, start_i, world2) {
  const { model: model4, methods: methods17 } = world2;
  const setTag2 = methods17.one.setTag;
  const multi = model4.one._multiCache || {};
  const { lexicon: lexicon3 } = model4.one || {};
  const t3 = terms[start_i];
  const word = t3.machine || t3.normal;
  if (multi[word] !== void 0 && terms[start_i + 1]) {
    const end2 = start_i + multi[word] - 1;
    for (let i3 = end2; i3 > start_i; i3 -= 1) {
      const words = terms.slice(start_i, i3 + 1);
      if (words.length <= 1) {
        return false;
      }
      const str = words.map((term) => term.machine || term.normal).join(" ");
      if (lexicon3.hasOwnProperty(str) === true) {
        const tag = lexicon3[str];
        setTag2(words, tag, world2, false, "1-multi-lexicon");
        if (tag && tag.length === 2 && (tag[0] === "PhrasalVerb" || tag[1] === "PhrasalVerb")) {
          setTag2([words[1]], "Particle", world2, false, "1-phrasal-particle");
        }
        return true;
      }
    }
    return false;
  }
  return null;
};
var multi_word_default = multiWord;

// node_modules/compromise/src/1-one/lexicon/compute/single-word.js
var prefix = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
var allowPrefix = /* @__PURE__ */ new Set(["Verb", "Infinitive", "PastTense", "Gerund", "PresentTense", "Adjective", "Participle"]);
var checkLexicon = function(terms, i3, world2) {
  const { model: model4, methods: methods17 } = world2;
  const setTag2 = methods17.one.setTag;
  const { lexicon: lexicon3 } = model4.one;
  const t3 = terms[i3];
  const word = t3.machine || t3.normal;
  if (lexicon3[word] !== void 0 && lexicon3.hasOwnProperty(word)) {
    setTag2([t3], lexicon3[word], world2, false, "1-lexicon");
    return true;
  }
  if (t3.alias) {
    const found = t3.alias.find((str) => lexicon3.hasOwnProperty(str));
    if (found) {
      setTag2([t3], lexicon3[found], world2, false, "1-lexicon-alias");
      return true;
    }
  }
  if (prefix.test(word) === true) {
    const stem = word.replace(prefix, "");
    if (lexicon3.hasOwnProperty(stem) && stem.length > 3) {
      if (allowPrefix.has(lexicon3[stem])) {
        setTag2([t3], lexicon3[stem], world2, false, "1-lexicon-prefix");
        return true;
      }
    }
  }
  return null;
};
var single_word_default = checkLexicon;

// node_modules/compromise/src/1-one/lexicon/compute/index.js
var lexicon = function(view) {
  const world2 = view.world;
  view.docs.forEach((terms) => {
    for (let i3 = 0; i3 < terms.length; i3 += 1) {
      if (terms[i3].tags.size === 0) {
        let found = null;
        found = found || multi_word_default(terms, i3, world2);
        found = found || single_word_default(terms, i3, world2);
      }
    }
  });
};
var compute_default6 = {
  lexicon
};

// node_modules/compromise/src/1-one/lexicon/methods/expand.js
var expand2 = function(words) {
  const lex = {};
  const _multi = {};
  Object.keys(words).forEach((word) => {
    const tag = words[word];
    word = word.toLowerCase().trim();
    word = word.replace(/'s\b/, "");
    const split2 = word.split(/ /);
    if (split2.length > 1) {
      if (_multi[split2[0]] === void 0 || split2.length > _multi[split2[0]]) {
        _multi[split2[0]] = split2.length;
      }
    }
    lex[word] = lex[word] || tag;
  });
  delete lex[""];
  delete lex[null];
  delete lex[" "];
  return { lex, _multi };
};
var expand_default = expand2;

// node_modules/compromise/src/1-one/lexicon/methods/index.js
var methods_default3 = {
  one: {
    expandLexicon: expand_default
  }
};

// node_modules/compromise/src/1-one/lexicon/lib.js
var addWords = function(words, isFrozen = false) {
  const world2 = this.world();
  const { methods: methods17, model: model4 } = world2;
  if (!words) {
    return;
  }
  Object.keys(words).forEach((k2) => {
    if (typeof words[k2] === "string" && words[k2].startsWith("#")) {
      words[k2] = words[k2].replace(/^#/, "");
    }
  });
  if (isFrozen === true) {
    const { lex: lex2, _multi: _multi2 } = methods17.one.expandLexicon(words, world2);
    Object.assign(model4.one._multiCache, _multi2);
    Object.assign(model4.one.frozenLex, lex2);
    return;
  }
  if (methods17.two.expandLexicon) {
    const { lex: lex2, _multi: _multi2 } = methods17.two.expandLexicon(words, world2);
    Object.assign(model4.one.lexicon, lex2);
    Object.assign(model4.one._multiCache, _multi2);
  }
  const { lex, _multi } = methods17.one.expandLexicon(words, world2);
  Object.assign(model4.one.lexicon, lex);
  Object.assign(model4.one._multiCache, _multi);
};
var lib_default = { addWords };

// node_modules/compromise/src/1-one/lexicon/plugin.js
var model2 = {
  one: {
    lexicon: {},
    //setup blank lexicon
    _multiCache: {},
    frozenLex: {}
    //2nd lexicon
  }
};
var plugin_default5 = {
  model: model2,
  methods: methods_default3,
  compute: compute_default6,
  lib: lib_default,
  hooks: ["lexicon"]
};

// node_modules/compromise/src/1-one/lookup/api/buildTrie/index.js
var tokenize = function(phrase, world2) {
  const { methods: methods17, model: model4 } = world2;
  const terms = methods17.one.tokenize.splitTerms(phrase, model4).map((t3) => methods17.one.tokenize.splitWhitespace(t3, model4));
  return terms.map((term) => term.text.toLowerCase());
};
var buildTrie = function(phrases, world2) {
  const goNext = [{}];
  const endAs = [null];
  const failTo = [0];
  const xs = [];
  let n2 = 0;
  phrases.forEach(function(phrase) {
    let curr = 0;
    const words = tokenize(phrase, world2);
    for (let i3 = 0; i3 < words.length; i3++) {
      const word = words[i3];
      if (goNext[curr] && goNext[curr].hasOwnProperty(word)) {
        curr = goNext[curr][word];
      } else {
        n2++;
        goNext[curr][word] = n2;
        goNext[n2] = {};
        curr = n2;
        endAs[n2] = null;
      }
    }
    endAs[curr] = [words.length];
  });
  for (const word in goNext[0]) {
    n2 = goNext[0][word];
    failTo[n2] = 0;
    xs.push(n2);
  }
  while (xs.length) {
    const r2 = xs.shift();
    const keys = Object.keys(goNext[r2]);
    for (let i3 = 0; i3 < keys.length; i3 += 1) {
      const word = keys[i3];
      const s2 = goNext[r2][word];
      xs.push(s2);
      n2 = failTo[r2];
      while (n2 > 0 && !goNext[n2].hasOwnProperty(word)) {
        n2 = failTo[n2];
      }
      if (goNext.hasOwnProperty(n2)) {
        const fs = goNext[n2][word];
        failTo[s2] = fs;
        if (endAs[fs]) {
          endAs[s2] = endAs[s2] || [];
          endAs[s2] = endAs[s2].concat(endAs[fs]);
        }
      } else {
        failTo[s2] = 0;
      }
    }
  }
  return { goNext, endAs, failTo };
};
var buildTrie_default = buildTrie;

// node_modules/compromise/src/1-one/lookup/api/scan.js
var scanWords = function(terms, trie, opts2) {
  let n2 = 0;
  const results = [];
  for (let i3 = 0; i3 < terms.length; i3++) {
    const word = terms[i3][opts2.form] || terms[i3].normal;
    while (n2 > 0 && (trie.goNext[n2] === void 0 || !trie.goNext[n2].hasOwnProperty(word))) {
      n2 = trie.failTo[n2] || 0;
    }
    if (!trie.goNext[n2].hasOwnProperty(word)) {
      continue;
    }
    n2 = trie.goNext[n2][word];
    if (trie.endAs[n2]) {
      const arr = trie.endAs[n2];
      for (let o2 = 0; o2 < arr.length; o2++) {
        const len = arr[o2];
        const term = terms[i3 - len + 1];
        const [no, start2] = term.index;
        results.push([no, start2, start2 + len, term.id]);
      }
    }
  }
  return results;
};
var cacheMiss = function(words, cache) {
  for (let i3 = 0; i3 < words.length; i3 += 1) {
    if (cache.has(words[i3]) === true) {
      return false;
    }
  }
  return true;
};
var scan = function(view, trie, opts2) {
  let results = [];
  opts2.form = opts2.form || "normal";
  const docs = view.docs;
  if (!trie.goNext || !trie.goNext[0]) {
    console.error("Compromise invalid lookup trie");
    return view.none();
  }
  const firstWords = Object.keys(trie.goNext[0]);
  for (let i3 = 0; i3 < docs.length; i3++) {
    if (view._cache && view._cache[i3] && cacheMiss(firstWords, view._cache[i3]) === true) {
      continue;
    }
    const terms = docs[i3];
    const found = scanWords(terms, trie, opts2);
    if (found.length > 0) {
      results = results.concat(found);
    }
  }
  return view.update(results);
};
var scan_default = scan;

// node_modules/compromise/src/1-one/lookup/api/index.js
var isObject3 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
function api_default3(View2) {
  View2.prototype.lookup = function(input, opts2 = {}) {
    if (!input) {
      return this.none();
    }
    if (typeof input === "string") {
      input = [input];
    }
    const trie = isObject3(input) ? input : buildTrie_default(input, this.world);
    let res = scan_default(this, trie, opts2);
    res = res.settle();
    return res;
  };
}

// node_modules/compromise/src/1-one/lookup/api/buildTrie/compress.js
var truncate = (list2, val) => {
  for (let i3 = list2.length - 1; i3 >= 0; i3 -= 1) {
    if (list2[i3] !== val) {
      list2 = list2.slice(0, i3 + 1);
      return list2;
    }
  }
  return list2;
};
var compress = function(trie) {
  trie.goNext = trie.goNext.map((o2) => {
    if (Object.keys(o2).length === 0) {
      return void 0;
    }
    return o2;
  });
  trie.goNext = truncate(trie.goNext, void 0);
  trie.failTo = truncate(trie.failTo, 0);
  trie.endAs = truncate(trie.endAs, null);
  return trie;
};
var compress_default = compress;

// node_modules/compromise/src/1-one/lookup/plugin.js
var lib = {
  /** turn an array or object into a compressed trie*/
  buildTrie: function(input) {
    const trie = buildTrie_default(input, this.world());
    return compress_default(trie);
  }
};
lib.compile = lib.buildTrie;
var plugin_default6 = {
  api: api_default3,
  lib
};

// node_modules/compromise/src/1-one/match/api/_lib.js
var relPointer = function(ptrs, parent) {
  if (!parent) {
    return ptrs;
  }
  ptrs.forEach((ptr) => {
    const n2 = ptr[0];
    if (parent[n2]) {
      ptr[0] = parent[n2][0];
      ptr[1] += parent[n2][1];
      ptr[2] += parent[n2][1];
    }
  });
  return ptrs;
};
var fixPointers2 = function(res, parent) {
  let { ptrs } = res;
  const { byGroup } = res;
  ptrs = relPointer(ptrs, parent);
  Object.keys(byGroup).forEach((k2) => {
    byGroup[k2] = relPointer(byGroup[k2], parent);
  });
  return { ptrs, byGroup };
};
var parseRegs = function(regs, opts2, world2) {
  const one = world2.methods.one;
  if (typeof regs === "number") {
    regs = String(regs);
  }
  if (typeof regs === "string") {
    regs = one.killUnicode(regs, world2);
    regs = one.parseMatch(regs, opts2, world2);
  }
  return regs;
};
var isObject4 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
var isView = (val) => val && isObject4(val) && val.isView === true;
var isNet = (val) => val && isObject4(val) && val.isNet === true;

// node_modules/compromise/src/1-one/match/api/match.js
var match = function(regs, group, opts2) {
  const one = this.methods.one;
  if (isView(regs)) {
    return this.intersection(regs);
  }
  if (isNet(regs)) {
    return this.sweep(regs, { tagger: false }).view.settle();
  }
  regs = parseRegs(regs, opts2, this.world);
  const todo = { regs, group };
  const res = one.match(this.docs, todo, this._cache);
  const { ptrs, byGroup } = fixPointers2(res, this.fullPointer);
  const view = this.toView(ptrs);
  view._groups = byGroup;
  return view;
};
var matchOne = function(regs, group, opts2) {
  const one = this.methods.one;
  if (isView(regs)) {
    return this.intersection(regs).eq(0);
  }
  if (isNet(regs)) {
    return this.sweep(regs, { tagger: false, matchOne: true }).view;
  }
  regs = parseRegs(regs, opts2, this.world);
  const todo = { regs, group, justOne: true };
  const res = one.match(this.docs, todo, this._cache);
  const { ptrs, byGroup } = fixPointers2(res, this.fullPointer);
  const view = this.toView(ptrs);
  view._groups = byGroup;
  return view;
};
var has = function(regs, group, opts2) {
  const one = this.methods.one;
  if (isView(regs)) {
    const ptrs2 = this.intersection(regs).fullPointer;
    return ptrs2.length > 0;
  }
  if (isNet(regs)) {
    return this.sweep(regs, { tagger: false }).view.found;
  }
  regs = parseRegs(regs, opts2, this.world);
  const todo = { regs, group, justOne: true };
  const ptrs = one.match(this.docs, todo, this._cache).ptrs;
  return ptrs.length > 0;
};
var ifFn = function(regs, group, opts2) {
  const one = this.methods.one;
  if (isView(regs)) {
    return this.filter((m) => m.intersection(regs).found);
  }
  if (isNet(regs)) {
    const m = this.sweep(regs, { tagger: false }).view.settle();
    return this.if(m);
  }
  regs = parseRegs(regs, opts2, this.world);
  const todo = { regs, group, justOne: true };
  let ptrs = this.fullPointer;
  const cache = this._cache || [];
  ptrs = ptrs.filter((ptr, i3) => {
    const m = this.update([ptr]);
    const res = one.match(m.docs, todo, cache[i3]).ptrs;
    return res.length > 0;
  });
  const view = this.update(ptrs);
  if (this._cache) {
    view._cache = ptrs.map((ptr) => cache[ptr[0]]);
  }
  return view;
};
var ifNo = function(regs, group, opts2) {
  const { methods: methods17 } = this;
  const one = methods17.one;
  if (isView(regs)) {
    return this.filter((m) => !m.intersection(regs).found);
  }
  if (isNet(regs)) {
    const m = this.sweep(regs, { tagger: false }).view.settle();
    return this.ifNo(m);
  }
  regs = parseRegs(regs, opts2, this.world);
  const cache = this._cache || [];
  const view = this.filter((m, i3) => {
    const todo = { regs, group, justOne: true };
    const ptrs = one.match(m.docs, todo, cache[i3]).ptrs;
    return ptrs.length === 0;
  });
  if (this._cache) {
    view._cache = view.ptrs.map((ptr) => cache[ptr[0]]);
  }
  return view;
};
var match_default = { matchOne, match, has, if: ifFn, ifNo };

// node_modules/compromise/src/1-one/match/api/lookaround.js
var before = function(regs, group, opts2) {
  const { indexN: indexN2 } = this.methods.one.pointer;
  const pre = [];
  const byN = indexN2(this.fullPointer);
  Object.keys(byN).forEach((k2) => {
    const first = byN[k2].sort((a2, b) => a2[1] > b[1] ? 1 : -1)[0];
    if (first[1] > 0) {
      pre.push([first[0], 0, first[1]]);
    }
  });
  const preWords = this.toView(pre);
  if (!regs) {
    return preWords;
  }
  return preWords.match(regs, group, opts2);
};
var after = function(regs, group, opts2) {
  const { indexN: indexN2 } = this.methods.one.pointer;
  const post = [];
  const byN = indexN2(this.fullPointer);
  const document = this.document;
  Object.keys(byN).forEach((k2) => {
    const last = byN[k2].sort((a2, b) => a2[1] > b[1] ? -1 : 1)[0];
    const [n2, , end2] = last;
    if (end2 < document[n2].length) {
      post.push([n2, end2, document[n2].length]);
    }
  });
  const postWords = this.toView(post);
  if (!regs) {
    return postWords;
  }
  return postWords.match(regs, group, opts2);
};
var growLeft = function(regs, group, opts2) {
  if (typeof regs === "string") {
    regs = this.world.methods.one.parseMatch(regs, opts2, this.world);
  }
  regs[regs.length - 1].end = true;
  const ptrs = this.fullPointer;
  this.forEach((m, n2) => {
    const more = m.before(regs, group);
    if (more.found) {
      const terms = more.terms();
      ptrs[n2][1] -= terms.length;
      ptrs[n2][3] = terms.docs[0][0].id;
    }
  });
  return this.update(ptrs);
};
var growRight = function(regs, group, opts2) {
  if (typeof regs === "string") {
    regs = this.world.methods.one.parseMatch(regs, opts2, this.world);
  }
  regs[0].start = true;
  const ptrs = this.fullPointer;
  this.forEach((m, n2) => {
    const more = m.after(regs, group);
    if (more.found) {
      const terms = more.terms();
      ptrs[n2][2] += terms.length;
      ptrs[n2][4] = null;
    }
  });
  return this.update(ptrs);
};
var grow = function(regs, group, opts2) {
  return this.growRight(regs, group, opts2).growLeft(regs, group, opts2);
};
var lookaround_default = { before, after, growLeft, growRight, grow };

// node_modules/compromise/src/1-one/match/api/split.js
var combine = function(left, right) {
  return [left[0], left[1], right[2]];
};
var isArray6 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
var getDoc = (reg, view, group) => {
  if (typeof reg === "string" || isArray6(reg)) {
    return view.match(reg, group);
  }
  if (!reg) {
    return view.none();
  }
  return reg;
};
var addIds2 = function(ptr, view) {
  const [n2, start2, end2] = ptr;
  if (view.document[n2] && view.document[n2][start2]) {
    ptr[3] = ptr[3] || view.document[n2][start2].id;
    if (view.document[n2][end2 - 1]) {
      ptr[4] = ptr[4] || view.document[n2][end2 - 1].id;
    }
  }
  return ptr;
};
var methods7 = {};
methods7.splitOn = function(m, group) {
  const { splitAll: splitAll2 } = this.methods.one.pointer;
  const splits = getDoc(m, this, group).fullPointer;
  const all = splitAll2(this.fullPointer, splits);
  let res = [];
  all.forEach((o2) => {
    res.push(o2.passthrough);
    res.push(o2.before);
    res.push(o2.match);
    res.push(o2.after);
  });
  res = res.filter((p2) => p2);
  res = res.map((p2) => addIds2(p2, this));
  return this.update(res);
};
methods7.splitBefore = function(m, group) {
  const { splitAll: splitAll2 } = this.methods.one.pointer;
  const splits = getDoc(m, this, group).fullPointer;
  const all = splitAll2(this.fullPointer, splits);
  for (let i3 = 0; i3 < all.length; i3 += 1) {
    if (!all[i3].after && all[i3 + 1] && all[i3 + 1].before) {
      if (all[i3].match && all[i3].match[0] === all[i3 + 1].before[0]) {
        all[i3].after = all[i3 + 1].before;
        delete all[i3 + 1].before;
      }
    }
  }
  let res = [];
  all.forEach((o2) => {
    res.push(o2.passthrough);
    res.push(o2.before);
    if (o2.match && o2.after) {
      res.push(combine(o2.match, o2.after));
    } else {
      res.push(o2.match);
    }
  });
  res = res.filter((p2) => p2);
  res = res.map((p2) => addIds2(p2, this));
  return this.update(res);
};
methods7.splitAfter = function(m, group) {
  const { splitAll: splitAll2 } = this.methods.one.pointer;
  const splits = getDoc(m, this, group).fullPointer;
  const all = splitAll2(this.fullPointer, splits);
  let res = [];
  all.forEach((o2) => {
    res.push(o2.passthrough);
    if (o2.before && o2.match) {
      res.push(combine(o2.before, o2.match));
    } else {
      res.push(o2.before);
      res.push(o2.match);
    }
    res.push(o2.after);
  });
  res = res.filter((p2) => p2);
  res = res.map((p2) => addIds2(p2, this));
  return this.update(res);
};
methods7.split = methods7.splitAfter;
var split_default = methods7;

// node_modules/compromise/src/1-one/match/api/join.js
var isNeighbour = function(ptrL, ptrR) {
  if (!ptrL || !ptrR) {
    return false;
  }
  if (ptrL[0] !== ptrR[0]) {
    return false;
  }
  return ptrL[2] === ptrR[1];
};
var mergeIf = function(doc, lMatch, rMatch) {
  const world2 = doc.world;
  const parseMatch = world2.methods.one.parseMatch;
  lMatch = lMatch || ".$";
  rMatch = rMatch || "^.";
  const leftMatch = parseMatch(lMatch, {}, world2);
  const rightMatch = parseMatch(rMatch, {}, world2);
  leftMatch[leftMatch.length - 1].end = true;
  rightMatch[0].start = true;
  const ptrs = doc.fullPointer;
  const res = [ptrs[0]];
  for (let i3 = 1; i3 < ptrs.length; i3 += 1) {
    const ptrL = res[res.length - 1];
    const ptrR = ptrs[i3];
    const left = doc.update([ptrL]);
    const right = doc.update([ptrR]);
    if (isNeighbour(ptrL, ptrR) && left.has(leftMatch) && right.has(rightMatch)) {
      res[res.length - 1] = [ptrL[0], ptrL[1], ptrR[2], ptrL[3], ptrR[4]];
    } else {
      res.push(ptrR);
    }
  }
  return doc.update(res);
};
var methods8 = {
  //  merge only if conditions are met
  joinIf: function(lMatch, rMatch) {
    return mergeIf(this, lMatch, rMatch);
  },
  // merge all neighbouring matches
  join: function() {
    return mergeIf(this);
  }
};
var join_default = methods8;

// node_modules/compromise/src/1-one/match/api/index.js
var methods9 = Object.assign({}, match_default, lookaround_default, split_default, join_default);
methods9.lookBehind = methods9.before;
methods9.lookBefore = methods9.before;
methods9.lookAhead = methods9.after;
methods9.lookAfter = methods9.after;
methods9.notIf = methods9.ifNo;
var matchAPI = function(View2) {
  Object.assign(View2.prototype, methods9);
};
var api_default4 = matchAPI;

// node_modules/compromise/src/1-one/match/methods/parseMatch/01-parseBlocks.js
var bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
var byParentheses = /([!~[^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/;
var byWord = / /g;
var isBlock = (str) => {
  return /^[![^]*(<[^<]*>)?\(/.test(str) && /\)[?\]+*$~]*$/.test(str);
};
var isReg = (str) => {
  return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str);
};
var cleanUp = function(arr) {
  arr = arr.map((str) => str.trim());
  arr = arr.filter((str) => str);
  return arr;
};
var parseBlocks = function(txt) {
  const arr = txt.split(bySlashes);
  let res = [];
  arr.forEach((str) => {
    if (isReg(str)) {
      res.push(str);
      return;
    }
    res = res.concat(str.split(byParentheses));
  });
  res = cleanUp(res);
  let final = [];
  res.forEach((str) => {
    if (isBlock(str)) {
      final.push(str);
    } else if (isReg(str)) {
      final.push(str);
    } else {
      final = final.concat(str.split(byWord));
    }
  });
  final = cleanUp(final);
  return final;
};
var parseBlocks_default = parseBlocks;

// node_modules/compromise/src/1-one/match/methods/parseMatch/02-parseToken.js
var hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
var andSign = /&&/;
var captureName = new RegExp(/^<\s*(\S+)\s*>/);
var titleCase = (str) => str.charAt(0).toUpperCase() + str.substring(1);
var end = (str) => str.charAt(str.length - 1);
var start = (str) => str.charAt(0);
var stripStart = (str) => str.substring(1);
var stripEnd = (str) => str.substring(0, str.length - 1);
var stripBoth = function(str) {
  str = stripStart(str);
  str = stripEnd(str);
  return str;
};
var parseToken = function(w, opts2) {
  const obj = {};
  for (let i3 = 0; i3 < 2; i3 += 1) {
    if (end(w) === "$") {
      obj.end = true;
      w = stripEnd(w);
    }
    if (start(w) === "^") {
      obj.start = true;
      w = stripStart(w);
    }
    if (end(w) === "?") {
      obj.optional = true;
      w = stripEnd(w);
    }
    if (start(w) === "[" || end(w) === "]") {
      obj.group = null;
      if (start(w) === "[") {
        obj.groupStart = true;
      }
      if (end(w) === "]") {
        obj.groupEnd = true;
      }
      w = w.replace(/^\[/, "");
      w = w.replace(/\]$/, "");
      if (start(w) === "<") {
        const res = captureName.exec(w);
        if (res.length >= 2) {
          obj.group = res[1];
          w = w.replace(res[0], "");
        }
      }
    }
    if (end(w) === "+") {
      obj.greedy = true;
      w = stripEnd(w);
    }
    if (w !== "*" && end(w) === "*" && w !== "\\*") {
      obj.greedy = true;
      w = stripEnd(w);
    }
    if (start(w) === "!") {
      obj.negative = true;
      w = stripStart(w);
    }
    if (start(w) === "~" && end(w) === "~" && w.length > 2) {
      w = stripBoth(w);
      obj.fuzzy = true;
      obj.min = opts2.fuzzy || 0.85;
      if (/\(/.test(w) === false) {
        obj.word = w;
        return obj;
      }
    }
    if (start(w) === "/" && end(w) === "/") {
      w = stripBoth(w);
      if (opts2.caseSensitive) {
        obj.use = "text";
      }
      obj.regex = new RegExp(w);
      return obj;
    }
    if (hasMinMax.test(w) === true) {
      w = w.replace(hasMinMax, (_a, b, c2) => {
        if (c2 === void 0) {
          obj.min = Number(b);
          obj.max = Number(b);
        } else {
          c2 = c2.replace(/, */, "");
          if (b === void 0) {
            obj.min = 0;
            obj.max = Number(c2);
          } else {
            obj.min = Number(b);
            obj.max = Number(c2 || 999);
          }
        }
        obj.greedy = true;
        if (!obj.min) {
          obj.optional = true;
        }
        return "";
      });
    }
    if (start(w) === "(" && end(w) === ")") {
      if (andSign.test(w)) {
        obj.choices = w.split(andSign);
        obj.operator = "and";
      } else {
        obj.choices = w.split("|");
        obj.operator = "or";
      }
      obj.choices[0] = stripStart(obj.choices[0]);
      const last = obj.choices.length - 1;
      obj.choices[last] = stripEnd(obj.choices[last]);
      obj.choices = obj.choices.map((s2) => s2.trim());
      obj.choices = obj.choices.filter((s2) => s2);
      obj.choices = obj.choices.map((str) => {
        return str.split(/ /g).map((s2) => parseToken(s2, opts2));
      });
      w = "";
    }
    if (start(w) === "{" && end(w) === "}") {
      w = stripBoth(w);
      obj.root = w;
      if (/\//.test(w)) {
        const split2 = obj.root.split(/\//);
        obj.root = split2[0];
        obj.pos = split2[1];
        if (obj.pos === "adj") {
          obj.pos = "Adjective";
        }
        obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
        if (split2[2] !== void 0) {
          obj.sense = split2[2];
        }
      }
      return obj;
    }
    if (start(w) === "<" && end(w) === ">") {
      w = stripBoth(w);
      obj.chunk = titleCase(w);
      obj.greedy = true;
      return obj;
    }
    if (start(w) === "%" && end(w) === "%") {
      w = stripBoth(w);
      obj.switch = w;
      return obj;
    }
  }
  if (start(w) === "#") {
    obj.tag = stripStart(w);
    obj.tag = titleCase(obj.tag);
    return obj;
  }
  if (start(w) === "@") {
    obj.method = stripStart(w);
    return obj;
  }
  if (w === ".") {
    obj.anything = true;
    return obj;
  }
  if (w === "*") {
    obj.anything = true;
    obj.greedy = true;
    obj.optional = true;
    return obj;
  }
  if (w) {
    w = w.replace("\\*", "*");
    w = w.replace("\\.", ".");
    if (opts2.caseSensitive) {
      obj.use = "text";
    } else {
      w = w.toLowerCase();
    }
    obj.word = w;
  }
  return obj;
};
var parseToken_default = parseToken;

// node_modules/compromise/src/1-one/match/methods/parseMatch/03-splitHyphens.js
var hasDash = /[a-z0-9][-–—][a-z]/i;
var splitHyphens = function(regs, world2) {
  const prefixes = world2.model.one.prefixes;
  for (let i3 = regs.length - 1; i3 >= 0; i3 -= 1) {
    const reg = regs[i3];
    if (reg.word && hasDash.test(reg.word)) {
      let words = reg.word.split(/[-–—]/g);
      if (prefixes.hasOwnProperty(words[0])) {
        continue;
      }
      words = words.filter((w) => w).reverse();
      regs.splice(i3, 1);
      words.forEach((w) => {
        const obj = Object.assign({}, reg);
        obj.word = w;
        regs.splice(i3, 0, obj);
      });
    }
  }
  return regs;
};
var splitHyphens_default = splitHyphens;

// node_modules/compromise/src/1-one/match/methods/parseMatch/04-inflect-root.js
var addVerbs = function(token, world2) {
  const { all } = world2.methods.two.transform.verb || {};
  const str = token.root;
  if (!all) {
    return [];
  }
  return all(str, world2.model);
};
var addNoun = function(token, world2) {
  const { all } = world2.methods.two.transform.noun || {};
  if (!all) {
    return [token.root];
  }
  return all(token.root, world2.model);
};
var addAdjective = function(token, world2) {
  const { all } = world2.methods.two.transform.adjective || {};
  if (!all) {
    return [token.root];
  }
  return all(token.root, world2.model);
};
var inflectRoot = function(regs, world2) {
  regs = regs.map((token) => {
    if (token.root) {
      if (world2.methods.two && world2.methods.two.transform) {
        let choices = [];
        if (token.pos) {
          if (token.pos === "Verb") {
            choices = choices.concat(addVerbs(token, world2));
          } else if (token.pos === "Noun") {
            choices = choices.concat(addNoun(token, world2));
          } else if (token.pos === "Adjective") {
            choices = choices.concat(addAdjective(token, world2));
          }
        } else {
          choices = choices.concat(addVerbs(token, world2));
          choices = choices.concat(addNoun(token, world2));
          choices = choices.concat(addAdjective(token, world2));
        }
        choices = choices.filter((str) => str);
        if (choices.length > 0) {
          token.operator = "or";
          token.fastOr = new Set(choices);
        }
      } else {
        token.machine = token.root;
        delete token.id;
        delete token.root;
      }
    }
    return token;
  });
  return regs;
};
var inflect_root_default = inflectRoot;

// node_modules/compromise/src/1-one/match/methods/parseMatch/05-postProcess.js
var nameGroups = function(regs) {
  let index3 = 0;
  let inGroup = null;
  for (let i3 = 0; i3 < regs.length; i3++) {
    const token = regs[i3];
    if (token.groupStart === true) {
      inGroup = token.group;
      if (inGroup === null) {
        inGroup = String(index3);
        index3 += 1;
      }
    }
    if (inGroup !== null) {
      token.group = inGroup;
    }
    if (token.groupEnd === true) {
      inGroup = null;
    }
  }
  return regs;
};
var doFastOrMode = function(tokens) {
  return tokens.map((token) => {
    if (token.choices !== void 0) {
      if (token.operator !== "or") {
        return token;
      }
      if (token.fuzzy === true) {
        return token;
      }
      const shouldPack = token.choices.every((block) => {
        if (block.length !== 1) {
          return false;
        }
        const reg = block[0];
        if (reg.fuzzy === true) {
          return false;
        }
        if (reg.start || reg.end) {
          return false;
        }
        if (reg.word !== void 0 && reg.negative !== true && reg.optional !== true && reg.method !== true) {
          return true;
        }
        return false;
      });
      if (shouldPack === true) {
        token.fastOr = /* @__PURE__ */ new Set();
        token.choices.forEach((block) => {
          token.fastOr.add(block[0].word);
        });
        delete token.choices;
      }
    }
    return token;
  });
};
var fuzzyOr = function(regs) {
  return regs.map((reg) => {
    if (reg.fuzzy && reg.choices) {
      reg.choices.forEach((r2) => {
        if (r2.length === 1 && r2[0].word) {
          r2[0].fuzzy = true;
          r2[0].min = reg.min;
        }
      });
    }
    return reg;
  });
};
var postProcess = function(regs) {
  regs = nameGroups(regs);
  regs = doFastOrMode(regs);
  regs = fuzzyOr(regs);
  return regs;
};
var postProcess_default = postProcess;

// node_modules/compromise/src/1-one/match/methods/parseMatch/index.js
var syntax = function(input, opts2, world2) {
  if (input === null || input === void 0 || input === "") {
    return [];
  }
  opts2 = opts2 || {};
  if (typeof input === "number") {
    input = String(input);
  }
  let tokens = parseBlocks_default(input);
  tokens = tokens.map((str) => parseToken_default(str, opts2));
  tokens = splitHyphens_default(tokens, world2);
  tokens = inflect_root_default(tokens, world2);
  tokens = postProcess_default(tokens, opts2);
  return tokens;
};
var parseMatch_default = syntax;

// node_modules/compromise/src/1-one/match/methods/match/01-failFast.js
var anyIntersection = function(setA, setB) {
  for (const elem of setB) {
    if (setA.has(elem)) {
      return true;
    }
  }
  return false;
};
var failFast = function(regs, cache) {
  for (let i3 = 0; i3 < regs.length; i3 += 1) {
    const reg = regs[i3];
    if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
      continue;
    }
    if (reg.word !== void 0 && cache.has(reg.word) === false) {
      return true;
    }
    if (reg.tag !== void 0 && cache.has("#" + reg.tag) === false) {
      return true;
    }
    if (reg.fastOr && anyIntersection(reg.fastOr, cache) === false) {
      return false;
    }
  }
  return false;
};
var failFast_default = failFast;

// node_modules/compromise/src/1-one/match/methods/match/term/_fuzzy.js
var editDistance = function(strA, strB) {
  const aLength = strA.length, bLength = strB.length;
  if (aLength === 0) {
    return bLength;
  }
  if (bLength === 0) {
    return aLength;
  }
  const limit = (bLength > aLength ? bLength : aLength) + 1;
  if (Math.abs(aLength - bLength) > (limit || 100)) {
    return limit || 100;
  }
  const matrix = [];
  for (let i3 = 0; i3 < limit; i3++) {
    matrix[i3] = [i3];
    matrix[i3].length = limit;
  }
  for (let i3 = 0; i3 < limit; i3++) {
    matrix[0][i3] = i3;
  }
  let j2, a_index, b_index, cost, min, t3;
  for (let i3 = 1; i3 <= aLength; ++i3) {
    a_index = strA[i3 - 1];
    for (j2 = 1; j2 <= bLength; ++j2) {
      if (i3 === j2 && matrix[i3][j2] > 4) {
        return aLength;
      }
      b_index = strB[j2 - 1];
      cost = a_index === b_index ? 0 : 1;
      min = matrix[i3 - 1][j2] + 1;
      if ((t3 = matrix[i3][j2 - 1] + 1) < min) min = t3;
      if ((t3 = matrix[i3 - 1][j2 - 1] + cost) < min) min = t3;
      const shouldUpdate = i3 > 1 && j2 > 1 && a_index === strB[j2 - 2] && strA[i3 - 2] === b_index && (t3 = matrix[i3 - 2][j2 - 2] + cost) < min;
      if (shouldUpdate) {
        matrix[i3][j2] = t3;
      } else {
        matrix[i3][j2] = min;
      }
    }
  }
  return matrix[aLength][bLength];
};
var fuzzyMatch = function(strA, strB, minLength = 3) {
  if (strA === strB) {
    return 1;
  }
  if (strA.length < minLength || strB.length < minLength) {
    return 0;
  }
  const steps = editDistance(strA, strB);
  const length2 = Math.max(strA.length, strB.length);
  const relative = length2 === 0 ? 0 : steps / length2;
  const similarity = 1 - relative;
  return similarity;
};
var fuzzy_default = fuzzyMatch;

// node_modules/compromise/src/1-one/match/methods/termMethods.js
var startQuote = /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;
var endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;
var hasHyphen = /^[-–—]$/;
var hasDash2 = / [-–—]{1,3} /;
var hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
var methods10 = {
  /** does it have a quotation symbol?  */
  hasQuote: (term) => startQuote.test(term.pre) || endQuote.test(term.post),
  /** does it have a comma?  */
  hasComma: (term) => hasPost(term, ","),
  /** does it end in a period? */
  hasPeriod: (term) => hasPost(term, ".") === true && hasPost(term, "...") === false,
  /** does it end in an exclamation */
  hasExclamation: (term) => hasPost(term, "!"),
  /** does it end with a question mark? */
  hasQuestionMark: (term) => hasPost(term, "?") || hasPost(term, "\xBF"),
  /** is there a ... at the end? */
  hasEllipses: (term) => hasPost(term, "..") || hasPost(term, "\u2026"),
  /** is there a semicolon after term word? */
  hasSemicolon: (term) => hasPost(term, ";"),
  /** is there a colon after term word? */
  hasColon: (term) => hasPost(term, ":"),
  /** is there a slash '/' in term word? */
  hasSlash: (term) => /\//.test(term.text),
  /** a hyphen connects two words like-term */
  hasHyphen: (term) => hasHyphen.test(term.post) || hasHyphen.test(term.pre),
  /** a dash separates words - like that */
  hasDash: (term) => hasDash2.test(term.post) || hasDash2.test(term.pre),
  /** is it multiple words combinded */
  hasContraction: (term) => Boolean(term.implicit),
  /** is it an acronym */
  isAcronym: (term) => term.tags.has("Acronym"),
  /** does it have any tags */
  isKnown: (term) => term.tags.size > 0,
  /** uppercase first letter, then a lowercase */
  isTitleCase: (term) => /^\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
  /** uppercase all letters */
  isUpperCase: (term) => /^\p{Lu}+$/u.test(term.text)
};
methods10.hasQuotation = methods10.hasQuote;
var termMethods_default = methods10;

// node_modules/compromise/src/1-one/match/methods/match/term/doesMatch.js
var wrapMatch = function() {
};
var doesMatch = function(term, reg, index3, length2) {
  if (reg.anything === true) {
    return true;
  }
  if (reg.start === true && index3 !== 0) {
    return false;
  }
  if (reg.end === true && index3 !== length2 - 1) {
    return false;
  }
  if (reg.id !== void 0 && reg.id === term.id) {
    return true;
  }
  if (reg.word !== void 0) {
    if (reg.use) {
      return reg.word === term[reg.use];
    }
    if (term.machine !== null && term.machine === reg.word) {
      return true;
    }
    if (term.alias !== void 0 && term.alias.hasOwnProperty(reg.word)) {
      return true;
    }
    if (reg.fuzzy === true) {
      if (reg.word === term.root) {
        return true;
      }
      const score = fuzzy_default(reg.word, term.normal);
      if (score >= reg.min) {
        return true;
      }
    }
    if (term.alias && term.alias.some((str) => str === reg.word)) {
      return true;
    }
    return reg.word === term.text || reg.word === term.normal;
  }
  if (reg.tag !== void 0) {
    return term.tags.has(reg.tag) === true;
  }
  if (reg.method !== void 0) {
    if (typeof termMethods_default[reg.method] === "function" && termMethods_default[reg.method](term) === true) {
      return true;
    }
    return false;
  }
  if (reg.pre !== void 0) {
    return term.pre && term.pre.includes(reg.pre);
  }
  if (reg.post !== void 0) {
    return term.post && term.post.includes(reg.post);
  }
  if (reg.regex !== void 0) {
    let str = term.normal;
    if (reg.use) {
      str = term[reg.use];
    }
    return reg.regex.test(str);
  }
  if (reg.chunk !== void 0) {
    return term.chunk === reg.chunk;
  }
  if (reg.switch !== void 0) {
    return term.switch === reg.switch;
  }
  if (reg.machine !== void 0) {
    return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine;
  }
  if (reg.sense !== void 0) {
    return term.sense === reg.sense;
  }
  if (reg.fastOr !== void 0) {
    if (reg.pos && !term.tags.has(reg.pos)) {
      return null;
    }
    const str = term.root || term.implicit || term.machine || term.normal;
    return reg.fastOr.has(str) || reg.fastOr.has(term.text);
  }
  if (reg.choices !== void 0) {
    if (reg.operator === "and") {
      return reg.choices.every((r2) => wrapMatch(term, r2, index3, length2));
    }
    return reg.choices.some((r2) => wrapMatch(term, r2, index3, length2));
  }
  return false;
};
wrapMatch = function(t3, reg, index3, length2) {
  const result = doesMatch(t3, reg, index3, length2);
  if (reg.negative === true) {
    return !result;
  }
  return result;
};
var doesMatch_default = wrapMatch;

// node_modules/compromise/src/1-one/match/methods/match/steps/logic/greedy.js
var getGreedy = function(state, endReg) {
  const reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
  const start2 = state.t;
  for (; state.t < state.terms.length; state.t += 1) {
    if (endReg && doesMatch_default(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
      return state.t;
    }
    const count = state.t - start2 + 1;
    if (reg.max !== void 0 && count === reg.max) {
      return state.t;
    }
    if (doesMatch_default(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
      if (reg.min !== void 0 && count < reg.min) {
        return null;
      }
      return state.t;
    }
  }
  return state.t;
};
var greedyTo = function(state, nextReg) {
  let t3 = state.t;
  if (!nextReg) {
    return state.terms.length;
  }
  for (; t3 < state.terms.length; t3 += 1) {
    if (doesMatch_default(state.terms[t3], nextReg, state.start_i + t3, state.phrase_length) === true) {
      return t3;
    }
  }
  return null;
};
var isEndGreedy = function(reg, state) {
  if (reg.end === true && reg.greedy === true) {
    if (state.start_i + state.t < state.phrase_length - 1) {
      const tmpReg = Object.assign({}, reg, { end: false });
      if (doesMatch_default(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
        return true;
      }
    }
  }
  return false;
};

// node_modules/compromise/src/1-one/match/methods/match/_lib.js
var getGroup = function(state, term_index) {
  if (state.groups[state.inGroup]) {
    return state.groups[state.inGroup];
  }
  state.groups[state.inGroup] = {
    start: term_index,
    length: 0
  };
  return state.groups[state.inGroup];
};

// node_modules/compromise/src/1-one/match/methods/match/steps/astrix.js
var doAstrix = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const skipto = greedyTo(state, regs[state.r + 1]);
  if (skipto === null || skipto === 0) {
    return null;
  }
  if (reg.min !== void 0 && skipto - state.t < reg.min) {
    return null;
  }
  if (reg.max !== void 0 && skipto - state.t > reg.max) {
    state.t = state.t + reg.max;
    return true;
  }
  if (state.hasGroup === true) {
    const g2 = getGroup(state, state.t);
    g2.length = skipto - state.t;
  }
  state.t = skipto;
  return true;
};
var astrix_default = doAstrix;

// node_modules/compromise/src/1-one/match/methods/match/steps/logic/and-or.js
var isArray7 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
var doOrBlock = function(state, skipN = 0) {
  const block = state.regs[state.r];
  let wasFound = false;
  for (let c2 = 0; c2 < block.choices.length; c2 += 1) {
    const regs = block.choices[c2];
    if (!isArray7(regs)) {
      return false;
    }
    wasFound = regs.every((cr, w_index) => {
      let extra = 0;
      const t3 = state.t + w_index + skipN + extra;
      if (state.terms[t3] === void 0) {
        return false;
      }
      const foundBlock = doesMatch_default(state.terms[t3], cr, t3 + state.start_i, state.phrase_length);
      if (foundBlock === true && cr.greedy === true) {
        for (let i3 = 1; i3 < state.terms.length; i3 += 1) {
          const term = state.terms[t3 + i3];
          if (term) {
            const keepGoing = doesMatch_default(term, cr, state.start_i + i3, state.phrase_length);
            if (keepGoing === true) {
              extra += 1;
            } else {
              break;
            }
          }
        }
      }
      skipN += extra;
      return foundBlock;
    });
    if (wasFound) {
      skipN += regs.length;
      break;
    }
  }
  if (wasFound && block.greedy === true) {
    return doOrBlock(state, skipN);
  }
  return skipN;
};
var doAndBlock = function(state) {
  let longest = 0;
  const reg = state.regs[state.r];
  const allDidMatch = reg.choices.every((block) => {
    const allWords = block.every((cr, w_index) => {
      const tryTerm = state.t + w_index;
      if (state.terms[tryTerm] === void 0) {
        return false;
      }
      return doesMatch_default(state.terms[tryTerm], cr, tryTerm, state.phrase_length);
    });
    if (allWords === true && block.length > longest) {
      longest = block.length;
    }
    return allWords;
  });
  if (allDidMatch === true) {
    return longest;
  }
  return false;
};

// node_modules/compromise/src/1-one/match/methods/match/steps/or-block.js
var orBlock = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const skipNum = doOrBlock(state);
  if (skipNum) {
    if (reg.negative === true) {
      return null;
    }
    if (state.hasGroup === true) {
      const g2 = getGroup(state, state.t);
      g2.length += skipNum;
    }
    if (reg.end === true) {
      const end2 = state.phrase_length;
      if (state.t + state.start_i + skipNum !== end2) {
        return null;
      }
    }
    state.t += skipNum;
    return true;
  } else if (!reg.optional) {
    return null;
  }
  return true;
};
var or_block_default = orBlock;

// node_modules/compromise/src/1-one/match/methods/match/steps/and-block.js
var andBlock = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const skipNum = doAndBlock(state);
  if (skipNum) {
    if (reg.negative === true) {
      return null;
    }
    if (state.hasGroup === true) {
      const g2 = getGroup(state, state.t);
      g2.length += skipNum;
    }
    if (reg.end === true) {
      const end2 = state.phrase_length - 1;
      if (state.t + state.start_i !== end2) {
        return null;
      }
    }
    state.t += skipNum;
    return true;
  } else if (!reg.optional) {
    return null;
  }
  return true;
};
var and_block_default = andBlock;

// node_modules/compromise/src/1-one/match/methods/match/steps/logic/negative-greedy.js
var negGreedy = function(state, reg, nextReg) {
  let skip = 0;
  for (let t3 = state.t; t3 < state.terms.length; t3 += 1) {
    let found = doesMatch_default(state.terms[t3], reg, state.start_i + state.t, state.phrase_length);
    if (found) {
      break;
    }
    if (nextReg) {
      found = doesMatch_default(state.terms[t3], nextReg, state.start_i + state.t, state.phrase_length);
      if (found) {
        break;
      }
    }
    skip += 1;
    if (reg.max !== void 0 && skip === reg.max) {
      break;
    }
  }
  if (skip === 0) {
    return false;
  }
  if (reg.min && reg.min > skip) {
    return false;
  }
  state.t += skip;
  return true;
};
var negative_greedy_default = negGreedy;

// node_modules/compromise/src/1-one/match/methods/match/steps/negative.js
var doNegative = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const tmpReg = Object.assign({}, reg);
  tmpReg.negative = false;
  const found = doesMatch_default(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
  if (found) {
    return false;
  }
  if (reg.optional) {
    const nextReg = regs[state.r + 1];
    if (nextReg) {
      const fNext = doesMatch_default(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
      if (fNext) {
        state.r += 1;
      } else if (nextReg.optional && regs[state.r + 2]) {
        const fNext2 = doesMatch_default(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
        if (fNext2) {
          state.r += 2;
        }
      }
    }
  }
  if (reg.greedy) {
    return negative_greedy_default(state, tmpReg, regs[state.r + 1]);
  }
  state.t += 1;
  return true;
};
var negative_default = doNegative;

// node_modules/compromise/src/1-one/match/methods/match/steps/optional-match.js
var foundOptional = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const term = state.terms[state.t];
  const nextRegMatched = doesMatch_default(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
  if (reg.negative || nextRegMatched) {
    const nextTerm = state.terms[state.t + 1];
    if (!nextTerm || !doesMatch_default(nextTerm, regs[state.r + 1], state.start_i + state.t, state.phrase_length)) {
      state.r += 1;
    }
  }
};
var optional_match_default = foundOptional;

// node_modules/compromise/src/1-one/match/methods/match/steps/greedy-match.js
var greedyMatch = function(state) {
  const { regs, phrase_length } = state;
  const reg = regs[state.r];
  state.t = getGreedy(state, regs[state.r + 1]);
  if (state.t === null) {
    return null;
  }
  if (reg.min && reg.min > state.t) {
    return null;
  }
  if (reg.end === true && state.start_i + state.t !== phrase_length) {
    return null;
  }
  return true;
};
var greedy_match_default = greedyMatch;

// node_modules/compromise/src/1-one/match/methods/match/steps/contraction-skip.js
var contractionSkip = function(state) {
  const term = state.terms[state.t];
  const reg = state.regs[state.r];
  if (term.implicit && state.terms[state.t + 1]) {
    const nextTerm = state.terms[state.t + 1];
    if (!nextTerm.implicit) {
      return;
    }
    if (reg.word === term.normal) {
      state.t += 1;
    }
    if (reg.method === "hasContraction") {
      state.t += 1;
    }
  }
};
var contraction_skip_default = contractionSkip;

// node_modules/compromise/src/1-one/match/methods/match/steps/simple-match.js
var setGroup = function(state, startAt) {
  const reg = state.regs[state.r];
  const g2 = getGroup(state, startAt);
  if (state.t > 1 && reg.greedy) {
    g2.length += state.t - startAt;
  } else {
    g2.length++;
  }
};
var simpleMatch = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const term = state.terms[state.t];
  const startAt = state.t;
  if (reg.optional && regs[state.r + 1] && reg.negative) {
    return true;
  }
  if (reg.optional && regs[state.r + 1]) {
    optional_match_default(state);
  }
  if (term.implicit && state.terms[state.t + 1]) {
    contraction_skip_default(state);
  }
  state.t += 1;
  if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
    return null;
  }
  if (reg.greedy === true) {
    const alive = greedy_match_default(state);
    if (!alive) {
      return null;
    }
  }
  if (state.hasGroup === true) {
    setGroup(state, startAt);
  }
  return true;
};
var simple_match_default = simpleMatch;

// node_modules/compromise/src/1-one/match/methods/match/02-from-here.js
var tryHere = function(terms, regs, start_i, phrase_length) {
  if (terms.length === 0 || regs.length === 0) {
    return null;
  }
  const state = {
    t: 0,
    terms,
    r: 0,
    regs,
    groups: {},
    start_i,
    phrase_length,
    inGroup: null
  };
  for (; state.r < regs.length; state.r += 1) {
    const reg = regs[state.r];
    state.hasGroup = Boolean(reg.group);
    if (state.hasGroup === true) {
      state.inGroup = reg.group;
    } else {
      state.inGroup = null;
    }
    if (!state.terms[state.t]) {
      const alive = regs.slice(state.r).some((remain) => !remain.optional);
      if (alive === false) {
        break;
      }
      return null;
    }
    if (reg.anything === true && reg.greedy === true) {
      const alive = astrix_default(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.choices !== void 0 && reg.operator === "or") {
      const alive = or_block_default(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.choices !== void 0 && reg.operator === "and") {
      const alive = and_block_default(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.anything === true) {
      if (reg.negative && reg.anything) {
        return null;
      }
      const alive = simple_match_default(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (isEndGreedy(reg, state) === true) {
      const alive = simple_match_default(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.negative) {
      const alive = negative_default(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    const hasMatch = doesMatch_default(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
    if (hasMatch === true) {
      const alive = simple_match_default(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.optional === true) {
      continue;
    }
    return null;
  }
  const pntr = [null, start_i, state.t + start_i];
  if (pntr[1] === pntr[2]) {
    return null;
  }
  const groups = {};
  Object.keys(state.groups).forEach((k2) => {
    const o2 = state.groups[k2];
    const start2 = start_i + o2.start;
    groups[k2] = [null, start2, start2 + o2.length];
  });
  return { pointer: pntr, groups };
};
var from_here_default = tryHere;

// node_modules/compromise/src/1-one/match/methods/match/03-getGroup.js
var getGroup2 = function(res, group) {
  const ptrs = [];
  const byGroup = {};
  if (res.length === 0) {
    return { ptrs, byGroup };
  }
  if (typeof group === "number") {
    group = String(group);
  }
  if (group) {
    res.forEach((r2) => {
      if (r2.groups[group]) {
        ptrs.push(r2.groups[group]);
      }
    });
  } else {
    res.forEach((r2) => {
      ptrs.push(r2.pointer);
      Object.keys(r2.groups).forEach((k2) => {
        byGroup[k2] = byGroup[k2] || [];
        byGroup[k2].push(r2.groups[k2]);
      });
    });
  }
  return { ptrs, byGroup };
};
var getGroup_default = getGroup2;

// node_modules/compromise/src/1-one/match/methods/match/03-notIf.js
var notIf = function(results, not, docs) {
  results = results.filter((res) => {
    const [n2, start2, end2] = res.pointer;
    const terms = docs[n2].slice(start2, end2);
    for (let i3 = 0; i3 < terms.length; i3 += 1) {
      const slice = terms.slice(i3);
      const found = from_here_default(slice, not, i3, terms.length);
      if (found !== null) {
        return false;
      }
    }
    return true;
  });
  return results;
};
var notIf_default = notIf;

// node_modules/compromise/src/1-one/match/methods/match/index.js
var addSentence = function(res, n2) {
  res.pointer[0] = n2;
  Object.keys(res.groups).forEach((k2) => {
    res.groups[k2][0] = n2;
  });
  return res;
};
var handleStart = function(terms, regs, n2) {
  let res = from_here_default(terms, regs, 0, terms.length);
  if (res) {
    res = addSentence(res, n2);
    return res;
  }
  return null;
};
var runMatch = function(docs, todo, cache) {
  cache = cache || [];
  const { regs, group, justOne } = todo;
  let results = [];
  if (!regs || regs.length === 0) {
    return { ptrs: [], byGroup: {} };
  }
  const minLength = regs.filter((r2) => r2.optional !== true && r2.negative !== true).length;
  docs: for (let n2 = 0; n2 < docs.length; n2 += 1) {
    const terms = docs[n2];
    if (cache[n2] && failFast_default(regs, cache[n2])) {
      continue;
    }
    if (regs[0].start === true) {
      const foundStart = handleStart(terms, regs, n2, group);
      if (foundStart) {
        results.push(foundStart);
      }
      continue;
    }
    for (let i3 = 0; i3 < terms.length; i3 += 1) {
      const slice = terms.slice(i3);
      if (slice.length < minLength) {
        break;
      }
      let res = from_here_default(slice, regs, i3, terms.length);
      if (res) {
        res = addSentence(res, n2);
        results.push(res);
        if (justOne === true) {
          break docs;
        }
        const end2 = res.pointer[2];
        if (Math.abs(end2 - 1) > i3) {
          i3 = Math.abs(end2 - 1);
        }
      }
    }
  }
  if (regs[regs.length - 1].end === true) {
    results = results.filter((res) => {
      const n2 = res.pointer[0];
      return docs[n2].length === res.pointer[2];
    });
  }
  if (todo.notIf) {
    results = notIf_default(results, todo.notIf, docs);
  }
  results = getGroup_default(results, group);
  results.ptrs.forEach((ptr) => {
    const [n2, start2, end2] = ptr;
    ptr[3] = docs[n2][start2].id;
    ptr[4] = docs[n2][end2 - 1].id;
  });
  return results;
};
var match_default2 = runMatch;

// node_modules/compromise/src/1-one/match/methods/index.js
var methods11 = {
  one: {
    termMethods: termMethods_default,
    parseMatch: parseMatch_default,
    match: match_default2
  }
};
var methods_default4 = methods11;

// node_modules/compromise/src/1-one/match/lib.js
var lib_default2 = {
  /** pre-parse any match statements */
  parseMatch: function(str, opts2) {
    const world2 = this.world();
    const killUnicode2 = world2.methods.one.killUnicode;
    if (killUnicode2) {
      str = killUnicode2(str, world2);
    }
    return world2.methods.one.parseMatch(str, opts2, world2);
  }
};

// node_modules/compromise/src/1-one/match/plugin.js
var plugin_default7 = {
  api: api_default4,
  methods: methods_default4,
  lib: lib_default2
};

// node_modules/compromise/src/1-one/output/api/html.js
var isClass = /^\../;
var isId = /^#./;
var escapeXml = (str) => {
  str = str.replace(/&/g, "&amp;");
  str = str.replace(/</g, "&lt;");
  str = str.replace(/>/g, "&gt;");
  str = str.replace(/"/g, "&quot;");
  str = str.replace(/'/g, "&apos;");
  return str;
};
var toTag = function(k2) {
  let start2 = "";
  let end2 = "</span>";
  k2 = escapeXml(k2);
  if (isClass.test(k2)) {
    start2 = `<span class="${k2.replace(/^\./, "")}"`;
  } else if (isId.test(k2)) {
    start2 = `<span id="${k2.replace(/^#/, "")}"`;
  } else {
    start2 = `<${k2}`;
    end2 = `</${k2}>`;
  }
  start2 += ">";
  return { start: start2, end: end2 };
};
var getIndex = function(doc, obj) {
  const starts = {};
  const ends = {};
  Object.keys(obj).forEach((k2) => {
    let res = obj[k2];
    const tag = toTag(k2);
    if (typeof res === "string") {
      res = doc.match(res);
    }
    res.docs.forEach((terms) => {
      if (terms.every((t3) => t3.implicit)) {
        return;
      }
      const a2 = terms[0].id;
      starts[a2] = starts[a2] || [];
      starts[a2].push(tag.start);
      const b = terms[terms.length - 1].id;
      ends[b] = ends[b] || [];
      ends[b].push(tag.end);
    });
  });
  return { starts, ends };
};
var html = function(obj) {
  const { starts, ends } = getIndex(this, obj);
  let out2 = "";
  this.docs.forEach((terms) => {
    for (let i3 = 0; i3 < terms.length; i3 += 1) {
      const t3 = terms[i3];
      if (starts.hasOwnProperty(t3.id)) {
        out2 += starts[t3.id].join("");
      }
      out2 += t3.pre || "";
      out2 += t3.text || "";
      if (ends.hasOwnProperty(t3.id)) {
        out2 += ends[t3.id].join("");
      }
      out2 += t3.post || "";
    }
  });
  return out2;
};
var html_default = { html };

// node_modules/compromise/src/1-one/output/api/_text.js
var trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/;
var trimStart = /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;
var punctToKill = /[,:;)('"\u201D\]]/;
var isHyphen = /^[-–—]$/;
var hasSpace = / /;
var textFromTerms = function(terms, opts2, keepSpace = true) {
  let txt = "";
  terms.forEach((t3) => {
    let pre = t3.pre || "";
    let post = t3.post || "";
    if (opts2.punctuation === "some") {
      pre = pre.replace(trimStart, "");
      if (isHyphen.test(post)) {
        post = " ";
      }
      post = post.replace(punctToKill, "");
      post = post.replace(/\?!+/, "?");
      post = post.replace(/!+/, "!");
      post = post.replace(/\?+/, "?");
      post = post.replace(/\.{2,}/, "");
      if (t3.tags.has("Abbreviation")) {
        post = post.replace(/\./, "");
      }
    }
    if (opts2.whitespace === "some") {
      pre = pre.replace(/\s/, "");
      post = post.replace(/\s+/, " ");
    }
    if (!opts2.keepPunct) {
      pre = pre.replace(trimStart, "");
      if (post === "-") {
        post = " ";
      } else {
        post = post.replace(trimEnd, "");
      }
    }
    let word = t3[opts2.form || "text"] || t3.normal || "";
    if (opts2.form === "implicit") {
      word = t3.implicit || t3.text;
    }
    if (opts2.form === "root" && t3.implicit) {
      word = t3.root || t3.implicit || t3.normal;
    }
    if ((opts2.form === "machine" || opts2.form === "implicit" || opts2.form === "root") && t3.implicit) {
      if (!post || !hasSpace.test(post)) {
        post += " ";
      }
    }
    txt += pre + word + post;
  });
  if (keepSpace === false) {
    txt = txt.trim();
  }
  if (opts2.lowerCase === true) {
    txt = txt.toLowerCase();
  }
  return txt;
};
var textFromDoc = function(docs, opts2) {
  let text = "";
  if (!docs || !docs[0] || !docs[0][0]) {
    return text;
  }
  for (let i3 = 0; i3 < docs.length; i3 += 1) {
    text += textFromTerms(docs[i3], opts2, true);
  }
  if (!opts2.keepSpace) {
    text = text.trim();
  }
  if (opts2.keepEndPunct === false) {
    if (!docs[0][0].tags.has("Emoticon")) {
      text = text.replace(trimStart, "");
    }
    const last = docs[docs.length - 1];
    if (!last[last.length - 1].tags.has("Emoticon")) {
      text = text.replace(trimEnd, "");
    }
    if (text.endsWith(`'`) && !text.endsWith(`s'`)) {
      text = text.replace(/'/, "");
    }
  }
  if (opts2.cleanWhitespace === true) {
    text = text.trim();
  }
  return text;
};

// node_modules/compromise/src/1-one/output/api/_fmts.js
var fmts = {
  text: {
    form: "text"
  },
  normal: {
    whitespace: "some",
    punctuation: "some",
    case: "some",
    unicode: "some",
    form: "normal"
  },
  machine: {
    keepSpace: false,
    whitespace: "some",
    punctuation: "some",
    case: "none",
    unicode: "some",
    form: "machine"
  },
  root: {
    keepSpace: false,
    whitespace: "some",
    punctuation: "some",
    case: "some",
    unicode: "some",
    form: "root"
  },
  implicit: {
    form: "implicit"
  }
};
fmts.clean = fmts.normal;
fmts.reduced = fmts.root;
var fmts_default = fmts;

// node_modules/compromise/src/1-one/output/methods/hash.js
var k = [];
var i = 0;
for (; i < 64; ) {
  k[i] = 0 | Math.sin(++i % Math.PI) * 4294967296;
}
var md5 = function(s2) {
  let b, c2, d2, j2 = decodeURI(encodeURI(s2)) + "\x80", a2 = j2.length;
  const h2 = [b = 1732584193, c2 = 4023233417, ~b, ~c2], words = [];
  s2 = --a2 / 4 + 2 | 15;
  words[--s2] = a2 * 8;
  for (; ~a2; ) {
    words[a2 >> 2] |= j2.charCodeAt(a2) << 8 * a2--;
  }
  for (i = j2 = 0; i < s2; i += 16) {
    a2 = h2;
    for (; j2 < 64; a2 = [
      d2 = a2[3],
      b + ((d2 = a2[0] + [b & c2 | ~b & d2, d2 & b | ~d2 & c2, b ^ c2 ^ d2, c2 ^ (b | ~d2)][a2 = j2 >> 4] + k[j2] + ~~words[i | [j2, 5 * j2 + 1, 3 * j2 + 5, 7 * j2][a2] & 15]) << (a2 = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a2 + j2++ % 4]) | d2 >>> -a2),
      b,
      c2
    ]) {
      b = a2[1] | 0;
      c2 = a2[2];
    }
    for (j2 = 4; j2; ) h2[--j2] += a2[j2];
  }
  for (s2 = ""; j2 < 32; ) {
    s2 += (h2[j2 >> 3] >> (1 ^ j2++) * 4 & 15).toString(16);
  }
  return s2;
};
var hash_default = md5;

// node_modules/compromise/src/1-one/output/api/json.js
var defaults = {
  text: true,
  terms: true
};
var opts = { case: "none", unicode: "some", form: "machine", punctuation: "some" };
var merge = function(a2, b) {
  return Object.assign({}, a2, b);
};
var fns4 = {
  text: (terms) => textFromTerms(terms, { keepPunct: true }, false),
  normal: (terms) => textFromTerms(terms, merge(fmts_default.normal, { keepPunct: true }), false),
  implicit: (terms) => textFromTerms(terms, merge(fmts_default.implicit, { keepPunct: true }), false),
  machine: (terms) => textFromTerms(terms, opts, false),
  root: (terms) => textFromTerms(terms, merge(opts, { form: "root" }), false),
  hash: (terms) => hash_default(textFromTerms(terms, { keepPunct: true }, false)),
  offset: (terms) => {
    const len = fns4.text(terms).length;
    return {
      index: terms[0].offset.index,
      start: terms[0].offset.start,
      length: len
    };
  },
  terms: (terms) => {
    return terms.map((t3) => {
      const term = Object.assign({}, t3);
      term.tags = Array.from(t3.tags);
      return term;
    });
  },
  confidence: (_terms, view, i3) => view.eq(i3).confidence(),
  syllables: (_terms, view, i3) => view.eq(i3).syllables(),
  sentence: (_terms, view, i3) => view.eq(i3).fullSentence().text(),
  dirty: (terms) => terms.some((t3) => t3.dirty === true)
};
fns4.sentences = fns4.sentence;
fns4.clean = fns4.normal;
fns4.reduced = fns4.root;
var toJSON = function(view, option) {
  option = option || {};
  if (typeof option === "string") {
    option = {};
  }
  option = Object.assign({}, defaults, option);
  if (option.offset) {
    view.compute("offset");
  }
  return view.docs.map((terms, i3) => {
    const res = {};
    Object.keys(option).forEach((k2) => {
      if (option[k2] && fns4[k2]) {
        res[k2] = fns4[k2](terms, view, i3);
      }
    });
    return res;
  });
};
var methods12 = {
  /** return data */
  json: function(n2) {
    const res = toJSON(this, n2);
    if (typeof n2 === "number") {
      return res[n2];
    }
    return res;
  }
};
methods12.data = methods12.json;
var json_default = methods12;

// node_modules/compromise/src/1-one/output/api/debug.js
var isClientSide = () => typeof window !== "undefined" && window.document;
var debug2 = function(fmt2) {
  const debugMethods = this.methods.one.debug || {};
  if (fmt2 && debugMethods.hasOwnProperty(fmt2)) {
    debugMethods[fmt2](this);
    return this;
  }
  if (isClientSide()) {
    debugMethods.clientSide(this);
    return this;
  }
  debugMethods.tags(this);
  return this;
};
var debug_default2 = debug2;

// node_modules/compromise/src/1-one/output/api/wrap.js
var toText = function(term) {
  const pre = term.pre || "";
  const post = term.post || "";
  return pre + term.text + post;
};
var findStarts = function(doc, obj) {
  const starts = {};
  Object.keys(obj).forEach((reg) => {
    const m = doc.match(reg);
    m.fullPointer.forEach((a2) => {
      starts[a2[3]] = { fn: obj[reg], end: a2[2] };
    });
  });
  return starts;
};
var wrap = function(doc, obj) {
  const starts = findStarts(doc, obj);
  let text = "";
  doc.docs.forEach((terms, n2) => {
    for (let i3 = 0; i3 < terms.length; i3 += 1) {
      const t3 = terms[i3];
      if (starts.hasOwnProperty(t3.id)) {
        const { fn, end: end2 } = starts[t3.id];
        const m = doc.update([[n2, i3, end2]]);
        text += terms[i3].pre || "";
        text += fn(m);
        i3 = end2 - 1;
        text += terms[i3].post || "";
      } else {
        text += toText(t3);
      }
    }
  });
  return text;
};
var wrap_default = wrap;

// node_modules/compromise/src/1-one/output/api/out.js
var isObject5 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
var topk = function(arr) {
  const obj = {};
  arr.forEach((a2) => {
    obj[a2] = obj[a2] || 0;
    obj[a2] += 1;
  });
  const res = Object.keys(obj).map((k2) => {
    return { normal: k2, count: obj[k2] };
  });
  return res.sort((a2, b) => a2.count > b.count ? -1 : 0);
};
var out = function(method) {
  if (isObject5(method)) {
    return wrap_default(this, method);
  }
  if (method === "text") {
    return this.text();
  }
  if (method === "normal") {
    return this.text("normal");
  }
  if (method === "root") {
    return this.text("root");
  }
  if (method === "machine" || method === "reduced") {
    return this.text("machine");
  }
  if (method === "hash" || method === "md5") {
    return hash_default(this.text());
  }
  if (method === "json") {
    return this.json();
  }
  if (method === "offset" || method === "offsets") {
    this.compute("offset");
    return this.json({ offset: true });
  }
  if (method === "array") {
    const arr = this.docs.map((terms) => {
      return terms.reduce((str, t3) => {
        return str + t3.pre + t3.text + t3.post;
      }, "").trim();
    });
    return arr.filter((str) => str);
  }
  if (method === "freq" || method === "frequency" || method === "topk") {
    return topk(this.json({ normal: true }).map((o2) => o2.normal));
  }
  if (method === "terms") {
    let list2 = [];
    this.docs.forEach((terms) => {
      let words = terms.map((t3) => t3.text);
      words = words.filter((t3) => t3);
      list2 = list2.concat(words);
    });
    return list2;
  }
  if (method === "tags") {
    return this.docs.map((terms) => {
      return terms.reduce((h2, t3) => {
        h2[t3.implicit || t3.normal] = Array.from(t3.tags);
        return h2;
      }, {});
    });
  }
  if (method === "debug") {
    return this.debug();
  }
  return this.text();
};
var methods13 = {
  /** */
  debug: debug_default2,
  /** */
  out,
  /** */
  wrap: function(obj) {
    return wrap_default(this, obj);
  }
};
var out_default = methods13;

// node_modules/compromise/src/1-one/output/api/text.js
var isObject6 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
var text_default = {
  /** */
  text: function(fmt2) {
    let opts2 = {};
    if (fmt2 && typeof fmt2 === "string" && fmts_default.hasOwnProperty(fmt2)) {
      opts2 = Object.assign({}, fmts_default[fmt2]);
    } else if (fmt2 && isObject6(fmt2)) {
      opts2 = Object.assign({}, fmt2);
    }
    if (opts2.keepSpace === void 0 && !this.isFull()) {
      opts2.keepSpace = false;
    }
    if (opts2.keepEndPunct === void 0 && this.pointer) {
      const ptr = this.pointer[0];
      if (ptr && ptr[1]) {
        opts2.keepEndPunct = false;
      } else {
        opts2.keepEndPunct = true;
      }
    }
    if (opts2.keepPunct === void 0) {
      opts2.keepPunct = true;
    }
    if (opts2.keepSpace === void 0) {
      opts2.keepSpace = true;
    }
    return textFromDoc(this.docs, opts2);
  }
};

// node_modules/compromise/src/1-one/output/api/index.js
var methods14 = Object.assign({}, out_default, text_default, json_default, html_default);
var addAPI3 = function(View2) {
  Object.assign(View2.prototype, methods14);
};
var api_default5 = addAPI3;

// node_modules/compromise/src/1-one/output/methods/debug/client-side.js
var logClientSide = function(view) {
  console.log("%c -=-=- ", "background-color:#6699cc;");
  view.forEach((m) => {
    console.groupCollapsed(m.text());
    const terms = m.docs[0];
    const out2 = terms.map((t3) => {
      let text = t3.text || "-";
      if (t3.implicit) {
        text = "[" + t3.implicit + "]";
      }
      const tags = "[" + Array.from(t3.tags).join(", ") + "]";
      return { text, tags };
    });
    console.table(out2, ["text", "tags"]);
    console.groupEnd();
  });
};
var client_side_default = logClientSide;

// node_modules/compromise/src/1-one/output/methods/debug/_color.js
var reset = "\x1B[0m";
var cli = {
  green: (str) => "\x1B[32m" + str + reset,
  red: (str) => "\x1B[31m" + str + reset,
  blue: (str) => "\x1B[34m" + str + reset,
  magenta: (str) => "\x1B[35m" + str + reset,
  cyan: (str) => "\x1B[36m" + str + reset,
  yellow: (str) => "\x1B[33m" + str + reset,
  black: (str) => "\x1B[30m" + str + reset,
  dim: (str) => "\x1B[2m" + str + reset,
  i: (str) => "\x1B[3m" + str + reset
};
var color_default = cli;

// node_modules/compromise/src/1-one/output/methods/debug/tags.js
var tagString = function(tags, model4) {
  if (model4.one.tagSet) {
    tags = tags.map((tag) => {
      if (!model4.one.tagSet.hasOwnProperty(tag)) {
        return tag;
      }
      const c2 = model4.one.tagSet[tag].color || "blue";
      return color_default[c2](tag);
    });
  }
  return tags.join(", ");
};
var showTags = function(view) {
  const { docs, model: model4 } = view;
  if (docs.length === 0) {
    console.log(color_default.blue("\n     \u2500\u2500\u2500\u2500\u2500\u2500"));
  }
  docs.forEach((terms) => {
    console.log(color_default.blue("\n  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
    terms.forEach((t3) => {
      const tags = [...t3.tags || []];
      let text = t3.text || "-";
      if (t3.sense) {
        text = `{${t3.normal}/${t3.sense}}`;
      }
      if (t3.implicit) {
        text = "[" + t3.implicit + "]";
      }
      text = color_default.yellow(text);
      let word = "'" + text + "'";
      if (t3.reference) {
        const str2 = view.update([t3.reference]).text("normal");
        word += ` - ${color_default.dim(color_default.i("[" + str2 + "]"))}`;
      }
      word = word.padEnd(18);
      const str = color_default.blue("  \u2502 ") + color_default.i(word) + "  - " + tagString(tags, model4);
      console.log(str);
    });
  });
  console.log("\n");
};
var tags_default = showTags;

// node_modules/compromise/src/1-one/output/methods/debug/chunks.js
var showChunks = function(view) {
  const { docs } = view;
  console.log("");
  docs.forEach((terms) => {
    const out2 = [];
    terms.forEach((term) => {
      if (term.chunk === "Noun") {
        out2.push(color_default.blue(term.implicit || term.normal));
      } else if (term.chunk === "Verb") {
        out2.push(color_default.green(term.implicit || term.normal));
      } else if (term.chunk === "Adjective") {
        out2.push(color_default.yellow(term.implicit || term.normal));
      } else if (term.chunk === "Pivot") {
        out2.push(color_default.red(term.implicit || term.normal));
      } else {
        out2.push(term.implicit || term.normal);
      }
    });
    console.log(out2.join(" "), "\n");
  });
  console.log("\n");
};
var chunks_default = showChunks;

// node_modules/compromise/src/1-one/output/methods/debug/highlight.js
var split = (txt, offset2, index3) => {
  const buff = index3 * 9;
  const start2 = offset2.start + buff;
  const end2 = start2 + offset2.length;
  const pre = txt.substring(0, start2);
  const mid = txt.substring(start2, end2);
  const post = txt.substring(end2, txt.length);
  return [pre, mid, post];
};
var spliceIn = function(txt, offset2, index3) {
  const parts = split(txt, offset2, index3);
  return `${parts[0]}${color_default.blue(parts[1])}${parts[2]}`;
};
var showHighlight = function(doc) {
  if (!doc.found) {
    return;
  }
  const bySentence = {};
  doc.fullPointer.forEach((ptr) => {
    bySentence[ptr[0]] = bySentence[ptr[0]] || [];
    bySentence[ptr[0]].push(ptr);
  });
  Object.keys(bySentence).forEach((k2) => {
    const full = doc.update([[Number(k2)]]);
    let txt = full.text();
    const matches = doc.update(bySentence[k2]);
    const json = matches.json({ offset: true });
    json.forEach((obj, i3) => {
      txt = spliceIn(txt, obj.offset, i3);
    });
    console.log(txt);
  });
  console.log("\n");
};
var highlight_default = showHighlight;

// node_modules/compromise/src/1-one/output/methods/debug/index.js
var debug3 = {
  tags: tags_default,
  clientSide: client_side_default,
  chunks: chunks_default,
  highlight: highlight_default
};
var debug_default3 = debug3;

// node_modules/compromise/src/1-one/output/plugin.js
var plugin_default8 = {
  api: api_default5,
  methods: {
    one: {
      hash: hash_default,
      debug: debug_default3
    }
  }
};

// node_modules/compromise/src/1-one/pointers/api/lib/_lib.js
var doesOverlap = function(a2, b) {
  if (a2[0] !== b[0]) {
    return false;
  }
  const [, startA, endA] = a2;
  const [, startB, endB] = b;
  if (startA <= startB && endA > startB) {
    return true;
  }
  if (startB <= startA && endB > startA) {
    return true;
  }
  return false;
};
var getExtent = function(ptrs) {
  let min = ptrs[0][1];
  let max2 = ptrs[0][2];
  ptrs.forEach((ptr) => {
    if (ptr[1] < min) {
      min = ptr[1];
    }
    if (ptr[2] > max2) {
      max2 = ptr[2];
    }
  });
  return [ptrs[0][0], min, max2];
};
var indexN = function(ptrs) {
  const byN = {};
  ptrs.forEach((ref) => {
    byN[ref[0]] = byN[ref[0]] || [];
    byN[ref[0]].push(ref);
  });
  return byN;
};
var uniquePtrs = function(arr) {
  const obj = {};
  for (let i3 = 0; i3 < arr.length; i3 += 1) {
    obj[arr[i3].join(",")] = arr[i3];
  }
  return Object.values(obj);
};

// node_modules/compromise/src/1-one/pointers/api/lib/split.js
var pivotBy = function(full, m) {
  const [n2, start2] = full;
  const mStart = m[1];
  const mEnd = m[2];
  const res = {};
  if (start2 < mStart) {
    const end2 = mStart < full[2] ? mStart : full[2];
    res.before = [n2, start2, end2];
  }
  res.match = m;
  if (full[2] > mEnd) {
    res.after = [n2, mEnd, full[2]];
  }
  return res;
};
var doesMatch2 = function(full, m) {
  return full[1] <= m[1] && m[2] <= full[2];
};
var splitAll = function(full, m) {
  const byN = indexN(m);
  const res = [];
  full.forEach((ptr) => {
    const [n2] = ptr;
    let matches = byN[n2] || [];
    matches = matches.filter((p2) => doesMatch2(ptr, p2));
    if (matches.length === 0) {
      res.push({ passthrough: ptr });
      return;
    }
    matches = matches.sort((a2, b) => a2[1] - b[1]);
    let carry = ptr;
    matches.forEach((p2, i3) => {
      const found = pivotBy(carry, p2);
      if (!matches[i3 + 1]) {
        res.push(found);
      } else {
        res.push({ before: found.before, match: found.match });
        if (found.after) {
          carry = found.after;
        }
      }
    });
  });
  return res;
};
var split_default2 = splitAll;

// node_modules/compromise/src/1-one/pointers/methods/getDoc.js
var max = 20;
var blindSweep = function(id, doc, n2) {
  for (let i3 = 0; i3 < max; i3 += 1) {
    if (doc[n2 - i3]) {
      const index3 = doc[n2 - i3].findIndex((term) => term.id === id);
      if (index3 !== -1) {
        return [n2 - i3, index3];
      }
    }
    if (doc[n2 + i3]) {
      const index3 = doc[n2 + i3].findIndex((term) => term.id === id);
      if (index3 !== -1) {
        return [n2 + i3, index3];
      }
    }
  }
  return null;
};
var repairEnding = function(ptr, document) {
  const [n2, start2, , , endId] = ptr;
  const terms = document[n2];
  const newEnd = terms.findIndex((t3) => t3.id === endId);
  if (newEnd === -1) {
    ptr[2] = document[n2].length;
    ptr[4] = terms.length ? terms[terms.length - 1].id : null;
  } else {
    ptr[2] = newEnd;
  }
  return document[n2].slice(start2, ptr[2] + 1);
};
var getDoc2 = function(ptrs, document) {
  let doc = [];
  ptrs.forEach((ptr, i3) => {
    if (!ptr) {
      return;
    }
    let [n2, start2, end2, id, endId] = ptr;
    let terms = document[n2] || [];
    if (start2 === void 0) {
      start2 = 0;
    }
    if (end2 === void 0) {
      end2 = terms.length;
    }
    if (id && (!terms[start2] || terms[start2].id !== id)) {
      const wild = blindSweep(id, document, n2);
      if (wild !== null) {
        const len = end2 - start2;
        terms = document[wild[0]].slice(wild[1], wild[1] + len);
        const startId = terms[0] ? terms[0].id : null;
        ptrs[i3] = [wild[0], wild[1], wild[1] + len, startId];
      }
    } else {
      terms = terms.slice(start2, end2);
    }
    if (terms.length === 0) {
      return;
    }
    if (start2 === end2) {
      return;
    }
    if (endId && terms[terms.length - 1].id !== endId) {
      terms = repairEnding(ptr, document);
    }
    doc.push(terms);
  });
  doc = doc.filter((a2) => a2.length > 0);
  return doc;
};
var getDoc_default = getDoc2;

// node_modules/compromise/src/1-one/pointers/methods/index.js
var termList = function(docs) {
  const arr = [];
  for (let i3 = 0; i3 < docs.length; i3 += 1) {
    for (let t3 = 0; t3 < docs[i3].length; t3 += 1) {
      arr.push(docs[i3][t3]);
    }
  }
  return arr;
};
var methods_default5 = {
  one: {
    termList,
    getDoc: getDoc_default,
    pointer: {
      indexN,
      splitAll: split_default2
    }
  }
};

// node_modules/compromise/src/1-one/pointers/api/lib/union.js
var getUnion = function(a2, b) {
  const both = a2.concat(b);
  const byN = indexN(both);
  let res = [];
  both.forEach((ptr) => {
    const [n2] = ptr;
    if (byN[n2].length === 1) {
      res.push(ptr);
      return;
    }
    const hmm = byN[n2].filter((m) => doesOverlap(ptr, m));
    hmm.push(ptr);
    const range = getExtent(hmm);
    res.push(range);
  });
  res = uniquePtrs(res);
  return res;
};
var union_default = getUnion;

// node_modules/compromise/src/1-one/pointers/api/lib/difference.js
var subtract = function(refs, not) {
  const res = [];
  const found = split_default2(refs, not);
  found.forEach((o2) => {
    if (o2.passthrough) {
      res.push(o2.passthrough);
    }
    if (o2.before) {
      res.push(o2.before);
    }
    if (o2.after) {
      res.push(o2.after);
    }
  });
  return res;
};
var difference_default = subtract;

// node_modules/compromise/src/1-one/pointers/api/lib/intersection.js
var intersection = function(a2, b) {
  const start2 = a2[1] < b[1] ? b[1] : a2[1];
  const end2 = a2[2] > b[2] ? b[2] : a2[2];
  if (start2 < end2) {
    return [a2[0], start2, end2];
  }
  return null;
};
var getIntersection = function(a2, b) {
  const byN = indexN(b);
  const res = [];
  a2.forEach((ptr) => {
    let hmm = byN[ptr[0]] || [];
    hmm = hmm.filter((p2) => doesOverlap(ptr, p2));
    if (hmm.length === 0) {
      return;
    }
    hmm.forEach((h2) => {
      const overlap = intersection(ptr, h2);
      if (overlap) {
        res.push(overlap);
      }
    });
  });
  return res;
};
var intersection_default = getIntersection;

// node_modules/compromise/src/1-one/pointers/api/index.js
var isArray8 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
var getDoc3 = (m, view) => {
  if (typeof m === "string" || isArray8(m)) {
    return view.match(m);
  }
  if (!m) {
    return view.none();
  }
  return m;
};
var addIds3 = function(ptrs, docs) {
  return ptrs.map((ptr) => {
    const [n2, start2] = ptr;
    if (docs[n2] && docs[n2][start2]) {
      ptr[3] = docs[n2][start2].id;
    }
    return ptr;
  });
};
var methods15 = {};
methods15.union = function(m) {
  m = getDoc3(m, this);
  let ptrs = union_default(this.fullPointer, m.fullPointer);
  ptrs = addIds3(ptrs, this.document);
  return this.toView(ptrs);
};
methods15.and = methods15.union;
methods15.intersection = function(m) {
  m = getDoc3(m, this);
  let ptrs = intersection_default(this.fullPointer, m.fullPointer);
  ptrs = addIds3(ptrs, this.document);
  return this.toView(ptrs);
};
methods15.not = function(m) {
  m = getDoc3(m, this);
  let ptrs = difference_default(this.fullPointer, m.fullPointer);
  ptrs = addIds3(ptrs, this.document);
  return this.toView(ptrs);
};
methods15.difference = methods15.not;
methods15.complement = function() {
  const doc = this.all();
  let ptrs = difference_default(doc.fullPointer, this.fullPointer);
  ptrs = addIds3(ptrs, this.document);
  return this.toView(ptrs);
};
methods15.settle = function() {
  let ptrs = this.fullPointer;
  ptrs.forEach((ptr) => {
    ptrs = union_default(ptrs, [ptr]);
  });
  ptrs = addIds3(ptrs, this.document);
  return this.update(ptrs);
};
var addAPI4 = function(View2) {
  Object.assign(View2.prototype, methods15);
};
var api_default6 = addAPI4;

// node_modules/compromise/src/1-one/pointers/plugin.js
var plugin_default9 = {
  methods: methods_default5,
  api: api_default6
};

// node_modules/compromise/src/1-one/sweep/lib.js
var lib_default3 = {
  // compile a list of matches into a match-net
  buildNet: function(matches) {
    const methods17 = this.methods();
    const net = methods17.one.buildNet(matches, this.world());
    net.isNet = true;
    return net;
  }
};

// node_modules/compromise/src/1-one/sweep/api.js
var api = function(View2) {
  View2.prototype.sweep = function(net, opts2 = {}) {
    const { world: world2, docs } = this;
    const { methods: methods17 } = world2;
    let found = methods17.one.bulkMatch(docs, net, this.methods, opts2);
    if (opts2.tagger !== false) {
      methods17.one.bulkTagger(found, docs, this.world);
    }
    found = found.map((o2) => {
      const ptr = o2.pointer;
      const term = docs[ptr[0]][ptr[1]];
      const len = ptr[2] - ptr[1];
      if (term.index) {
        o2.pointer = [
          term.index[0],
          term.index[1],
          ptr[1] + len
        ];
      }
      return o2;
    });
    const ptrs = found.map((o2) => o2.pointer);
    found = found.map((obj) => {
      obj.view = this.update([obj.pointer]);
      delete obj.regs;
      delete obj.needs;
      delete obj.pointer;
      delete obj._expanded;
      return obj;
    });
    return {
      view: this.update(ptrs),
      found
    };
  };
};
var api_default7 = api;

// node_modules/compromise/src/1-one/sweep/methods/buildNet/01-parse.js
var getTokenNeeds = function(reg) {
  if (reg.optional === true || reg.negative === true) {
    return null;
  }
  if (reg.tag) {
    return "#" + reg.tag;
  }
  if (reg.word) {
    return reg.word;
  }
  if (reg.switch) {
    return `%${reg.switch}%`;
  }
  return null;
};
var getNeeds = function(regs) {
  const needs = [];
  regs.forEach((reg) => {
    needs.push(getTokenNeeds(reg));
    if (reg.operator === "and" && reg.choices) {
      reg.choices.forEach((oneSide) => {
        oneSide.forEach((r2) => {
          needs.push(getTokenNeeds(r2));
        });
      });
    }
  });
  return needs.filter((str) => str);
};
var getWants = function(regs) {
  const wants = [];
  let count = 0;
  regs.forEach((reg) => {
    if (reg.operator === "or" && !reg.optional && !reg.negative) {
      if (reg.fastOr) {
        Array.from(reg.fastOr).forEach((w) => {
          wants.push(w);
        });
      }
      if (reg.choices) {
        reg.choices.forEach((rs) => {
          rs.forEach((r2) => {
            const n2 = getTokenNeeds(r2);
            if (n2) {
              wants.push(n2);
            }
          });
        });
      }
      count += 1;
    }
  });
  return { wants, count };
};
var parse = function(matches, world2) {
  const parseMatch = world2.methods.one.parseMatch;
  matches.forEach((obj) => {
    obj.regs = parseMatch(obj.match, {}, world2);
    if (typeof obj.ifNo === "string") {
      obj.ifNo = [obj.ifNo];
    }
    if (obj.notIf) {
      obj.notIf = parseMatch(obj.notIf, {}, world2);
    }
    obj.needs = getNeeds(obj.regs);
    const { wants, count } = getWants(obj.regs);
    obj.wants = wants;
    obj.minWant = count;
    obj.minWords = obj.regs.filter((o2) => !o2.optional).length;
  });
  return matches;
};
var parse_default = parse;

// node_modules/compromise/src/1-one/sweep/methods/buildNet/index.js
var buildNet = function(matches, world2) {
  matches = parse_default(matches, world2);
  const hooks2 = {};
  matches.forEach((obj) => {
    obj.needs.forEach((str) => {
      hooks2[str] = Array.isArray(hooks2[str]) ? hooks2[str] : [];
      hooks2[str].push(obj);
    });
    obj.wants.forEach((str) => {
      hooks2[str] = Array.isArray(hooks2[str]) ? hooks2[str] : [];
      hooks2[str].push(obj);
    });
  });
  Object.keys(hooks2).forEach((k2) => {
    const already = {};
    hooks2[k2] = hooks2[k2].filter((obj) => {
      if (typeof already[obj.match] === "boolean") {
        return false;
      }
      already[obj.match] = true;
      return true;
    });
  });
  const always = matches.filter((o2) => o2.needs.length === 0 && o2.wants.length === 0);
  return {
    hooks: hooks2,
    always
  };
};
var buildNet_default = buildNet;

// node_modules/compromise/src/1-one/sweep/methods/sweep/01-getHooks.js
var getHooks = function(docCaches, hooks2) {
  return docCaches.map((set, i3) => {
    let maybe = [];
    Object.keys(hooks2).forEach((k2) => {
      if (docCaches[i3].has(k2)) {
        maybe = maybe.concat(hooks2[k2]);
      }
    });
    const already = {};
    maybe = maybe.filter((m) => {
      if (typeof already[m.match] === "boolean") {
        return false;
      }
      already[m.match] = true;
      return true;
    });
    return maybe;
  });
};
var getHooks_default = getHooks;

// node_modules/compromise/src/1-one/sweep/methods/sweep/02-trim-down.js
var localTrim = function(maybeList, docCache) {
  return maybeList.map((list2, n2) => {
    const haves = docCache[n2];
    list2 = list2.filter((obj) => {
      return obj.needs.every((need) => haves.has(need));
    });
    list2 = list2.filter((obj) => {
      if (obj.ifNo !== void 0 && obj.ifNo.some((no) => haves.has(no)) === true) {
        return false;
      }
      return true;
    });
    list2 = list2.filter((obj) => {
      if (obj.wants.length === 0) {
        return true;
      }
      const found = obj.wants.filter((str) => haves.has(str)).length;
      return found >= obj.minWant;
    });
    return list2;
  });
};
var trim_down_default = localTrim;

// node_modules/compromise/src/1-one/sweep/methods/sweep/04-runMatch.js
var runMatch2 = function(maybeList, document, docCache, methods17, opts2) {
  const results = [];
  for (let n2 = 0; n2 < maybeList.length; n2 += 1) {
    for (let i3 = 0; i3 < maybeList[n2].length; i3 += 1) {
      const m = maybeList[n2][i3];
      const res = methods17.one.match([document[n2]], m);
      if (res.ptrs.length > 0) {
        res.ptrs.forEach((ptr) => {
          ptr[0] = n2;
          const todo = Object.assign({}, m, { pointer: ptr });
          if (m.unTag !== void 0) {
            todo.unTag = m.unTag;
          }
          results.push(todo);
        });
        if (opts2.matchOne === true) {
          return [results[0]];
        }
      }
    }
  }
  return results;
};
var runMatch_default = runMatch2;

// node_modules/compromise/src/1-one/sweep/methods/sweep/index.js
var tooSmall = function(maybeList, document) {
  return maybeList.map((arr, i3) => {
    const termCount = document[i3].length;
    arr = arr.filter((o2) => {
      return termCount >= o2.minWords;
    });
    return arr;
  });
};
var sweep = function(document, net, methods17, opts2 = {}) {
  const docCache = methods17.one.cacheDoc(document);
  let maybeList = getHooks_default(docCache, net.hooks);
  maybeList = trim_down_default(maybeList, docCache, document);
  if (net.always.length > 0) {
    maybeList = maybeList.map((arr) => arr.concat(net.always));
  }
  maybeList = tooSmall(maybeList, document);
  const results = runMatch_default(maybeList, document, docCache, methods17, opts2);
  return results;
};
var sweep_default = sweep;

// node_modules/compromise/src/1-one/sweep/methods/tagger/canBe.js
var canBe = function(terms, tag, model4) {
  const tagSet = model4.one.tagSet;
  if (!tagSet.hasOwnProperty(tag)) {
    return true;
  }
  const not = tagSet[tag].not || [];
  for (let i3 = 0; i3 < terms.length; i3 += 1) {
    const term = terms[i3];
    for (let k2 = 0; k2 < not.length; k2 += 1) {
      if (term.tags.has(not[k2]) === true) {
        return false;
      }
    }
  }
  return true;
};
var canBe_default = canBe;

// node_modules/compromise/src/1-one/sweep/methods/tagger/index.js
var tagger = function(list2, document, world2) {
  const { model: model4, methods: methods17 } = world2;
  const { getDoc: getDoc4, setTag: setTag2, unTag: unTag2 } = methods17.one;
  const looksPlural = methods17.two.looksPlural;
  if (list2.length === 0) {
    return list2;
  }
  const env = typeof process === "undefined" || !process.env ? self.env || {} : process.env;
  if (env.DEBUG_TAGS) {
    console.log(`

  \x1B[32m\u2192 ${list2.length} post-tagger:\x1B[0m`);
  }
  return list2.map((todo) => {
    if (!todo.tag && !todo.chunk && !todo.unTag) {
      return;
    }
    const reason = todo.reason || todo.match;
    const terms = getDoc4([todo.pointer], document)[0];
    if (todo.safe === true) {
      if (canBe_default(terms, todo.tag, model4) === false) {
        return;
      }
      if (terms[terms.length - 1].post === "-") {
        return;
      }
    }
    if (todo.tag !== void 0) {
      setTag2(terms, todo.tag, world2, todo.safe, `[post] '${reason}'`);
      if (todo.tag === "Noun" && looksPlural) {
        const term = terms[terms.length - 1];
        if (looksPlural(term.text)) {
          setTag2([term], "Plural", world2, todo.safe, "quick-plural");
        } else {
          setTag2([term], "Singular", world2, todo.safe, "quick-singular");
        }
      }
      if (todo.freeze === true) {
        terms.forEach((term) => term.frozen = true);
      }
    }
    if (todo.unTag !== void 0) {
      unTag2(terms, todo.unTag, world2, todo.safe, reason);
    }
    if (todo.chunk) {
      terms.forEach((t3) => t3.chunk = todo.chunk);
    }
  });
};
var tagger_default = tagger;

// node_modules/compromise/src/1-one/sweep/methods/index.js
var methods_default6 = {
  buildNet: buildNet_default,
  bulkMatch: sweep_default,
  bulkTagger: tagger_default
};

// node_modules/compromise/src/1-one/sweep/plugin.js
var plugin_default10 = {
  lib: lib_default3,
  api: api_default7,
  methods: {
    one: methods_default6
  }
};

// node_modules/compromise/src/1-one/tag/methods/setTag.js
var isMulti = / /;
var addChunk = function(term, tag) {
  if (tag === "Noun") {
    term.chunk = tag;
  }
  if (tag === "Verb") {
    term.chunk = tag;
  }
};
var tagTerm = function(term, tag, tagSet, isSafe) {
  if (term.tags.has(tag) === true) {
    return null;
  }
  if (tag === ".") {
    return null;
  }
  if (term.frozen === true) {
    isSafe = true;
  }
  const known = tagSet[tag];
  if (known) {
    if (known.not && known.not.length > 0) {
      for (let o2 = 0; o2 < known.not.length; o2 += 1) {
        if (isSafe === true && term.tags.has(known.not[o2])) {
          return null;
        }
        term.tags.delete(known.not[o2]);
      }
    }
    if (known.parents && known.parents.length > 0) {
      for (let o2 = 0; o2 < known.parents.length; o2 += 1) {
        term.tags.add(known.parents[o2]);
        addChunk(term, known.parents[o2]);
      }
    }
  }
  term.tags.add(tag);
  term.dirty = true;
  addChunk(term, tag);
  return true;
};
var multiTag = function(terms, tagString2, tagSet, isSafe) {
  const tags = tagString2.split(isMulti);
  terms.forEach((term, i3) => {
    let tag = tags[i3];
    if (tag) {
      tag = tag.replace(/^#/, "");
      tagTerm(term, tag, tagSet, isSafe);
    }
  });
};
var isArray9 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
var log = (terms, tag, reason = "") => {
  const yellow = (str) => "\x1B[33m\x1B[3m" + str + "\x1B[0m";
  const i3 = (str) => "\x1B[3m" + str + "\x1B[0m";
  const word = terms.map((t3) => {
    return t3.text || "[" + t3.implicit + "]";
  }).join(" ");
  if (typeof tag !== "string" && tag.length > 2) {
    tag = tag.slice(0, 2).join(", #") + " +";
  }
  tag = typeof tag !== "string" ? tag.join(", #") : tag;
  console.log(` ${yellow(word).padEnd(24)} \x1B[32m\u2192\x1B[0m #${tag.padEnd(22)}  ${i3(reason)}`);
};
var setTag = function(terms, tag, world2 = {}, isSafe, reason) {
  const tagSet = world2.model.one.tagSet || {};
  if (!tag) {
    return;
  }
  const env = typeof process === "undefined" || !process.env ? self.env || {} : process.env;
  if (env && env.DEBUG_TAGS) {
    log(terms, tag, reason);
  }
  if (isArray9(tag) === true) {
    tag.forEach((tg) => setTag(terms, tg, world2, isSafe));
    return;
  }
  if (typeof tag !== "string") {
    console.warn(`compromise: Invalid tag '${tag}'`);
    return;
  }
  tag = tag.trim();
  if (isMulti.test(tag)) {
    multiTag(terms, tag, tagSet, isSafe);
    return;
  }
  tag = tag.replace(/^#/, "");
  for (let i3 = 0; i3 < terms.length; i3 += 1) {
    tagTerm(terms[i3], tag, tagSet, isSafe);
  }
};
var setTag_default = setTag;

// node_modules/compromise/src/1-one/tag/methods/unTag.js
var unTag = function(terms, tag, tagSet) {
  tag = tag.trim().replace(/^#/, "");
  for (let i3 = 0; i3 < terms.length; i3 += 1) {
    const term = terms[i3];
    if (term.frozen === true) {
      continue;
    }
    if (tag === "*") {
      term.tags.clear();
      continue;
    }
    const known = tagSet[tag];
    if (known && known.children.length > 0) {
      for (let o2 = 0; o2 < known.children.length; o2 += 1) {
        term.tags.delete(known.children[o2]);
      }
    }
    term.tags.delete(tag);
  }
};
var unTag_default = unTag;

// node_modules/compromise/src/1-one/tag/methods/canBe.js
var canBe2 = function(term, tag, tagSet) {
  if (!tagSet.hasOwnProperty(tag)) {
    return true;
  }
  const not = tagSet[tag].not || [];
  for (let i3 = 0; i3 < not.length; i3 += 1) {
    if (term.tags.has(not[i3])) {
      return false;
    }
  }
  return true;
};
var canBe_default2 = canBe2;

// node_modules/grad-school/builds/grad-school.mjs
var e = function(e2) {
  return e2.children = e2.children || [], e2._cache = e2._cache || {}, e2.props = e2.props || {}, e2._cache.parents = e2._cache.parents || [], e2._cache.children = e2._cache.children || [], e2;
};
var t2 = /^ *(#|\/\/)/;
var n = function(t3) {
  let n2 = t3.trim().split(/->/), r2 = [];
  n2.forEach(((t4) => {
    r2 = r2.concat((function(t5) {
      if (!(t5 = t5.trim())) return null;
      if (/^\[/.test(t5) && /\]$/.test(t5)) {
        let n3 = (t5 = (t5 = t5.replace(/^\[/, "")).replace(/\]$/, "")).split(/,/);
        return n3 = n3.map(((e2) => e2.trim())).filter(((e2) => e2)), n3 = n3.map(((t6) => e({ id: t6 }))), n3;
      }
      return [e({ id: t5 })];
    })(t4));
  })), r2 = r2.filter(((e2) => e2));
  let i3 = r2[0];
  for (let e2 = 1; e2 < r2.length; e2 += 1) i3.children.push(r2[e2]), i3 = r2[e2];
  return r2[0];
};
var r = (e2, t3) => {
  let n2 = [], r2 = [e2];
  for (; r2.length > 0; ) {
    let e3 = r2.pop();
    n2.push(e3), e3.children && e3.children.forEach(((n3) => {
      t3 && t3(e3, n3), r2.push(n3);
    }));
  }
  return n2;
};
var i2 = (e2) => "[object Array]" === Object.prototype.toString.call(e2);
var c = (e2) => (e2 = e2 || "").trim();
var s = function(c2 = []) {
  return "string" == typeof c2 ? (function(r2) {
    let i3 = r2.split(/\r?\n/), c3 = [];
    i3.forEach(((e2) => {
      if (!e2.trim() || t2.test(e2)) return;
      let r3 = ((e3) => {
        const t3 = /^( {2}|\t)/;
        let n2 = 0;
        for (; t3.test(e3); ) e3 = e3.replace(t3, ""), n2 += 1;
        return n2;
      })(e2);
      c3.push({ indent: r3, node: n(e2) });
    }));
    let s3 = (function(e2) {
      let t3 = { children: [] };
      return e2.forEach(((n2, r3) => {
        0 === n2.indent ? t3.children = t3.children.concat(n2.node) : e2[r3 - 1] && (function(e3, t4) {
          let n3 = e3[t4].indent;
          for (; t4 >= 0; t4 -= 1) if (e3[t4].indent < n3) return e3[t4];
          return e3[0];
        })(e2, r3).node.children.push(n2.node);
      })), t3;
    })(c3);
    return s3 = e(s3), s3;
  })(c2) : i2(c2) ? (function(t3) {
    let n2 = {};
    t3.forEach(((e2) => {
      n2[e2.id] = e2;
    }));
    let r2 = e({});
    return t3.forEach(((t4) => {
      if ((t4 = e(t4)).parent) if (n2.hasOwnProperty(t4.parent)) {
        let e2 = n2[t4.parent];
        delete t4.parent, e2.children.push(t4);
      } else console.warn(`[Grad] - missing node '${t4.parent}'`);
      else r2.children.push(t4);
    })), r2;
  })(c2) : (r(s2 = c2).forEach(e), s2);
  var s2;
};
var h = (e2) => "\x1B[31m" + e2 + "\x1B[0m";
var o = (e2) => "\x1B[2m" + e2 + "\x1B[0m";
var l = function(e2, t3) {
  let n2 = "-> ";
  t3 && (n2 = o("\u2192 "));
  let i3 = "";
  return r(e2).forEach(((e3, r2) => {
    let c2 = e3.id || "";
    if (t3 && (c2 = h(c2)), 0 === r2 && !e3.id) return;
    let s2 = e3._cache.parents.length;
    i3 += "    ".repeat(s2) + n2 + c2 + "\n";
  })), i3;
};
var a = function(e2) {
  let t3 = r(e2);
  t3.forEach(((e3) => {
    delete (e3 = Object.assign({}, e3)).children;
  }));
  let n2 = t3[0];
  return n2 && !n2.id && 0 === Object.keys(n2.props).length && t3.shift(), t3;
};
var p = { text: l, txt: l, array: a, flat: a };
var d = function(e2, t3) {
  return "nested" === t3 || "json" === t3 ? e2 : "debug" === t3 ? (console.log(l(e2, true)), null) : p.hasOwnProperty(t3) ? p[t3](e2) : e2;
};
var u = (e2) => {
  r(e2, ((e3, t3) => {
    e3.id && (e3._cache.parents = e3._cache.parents || [], t3._cache.parents = e3._cache.parents.concat([e3.id]));
  }));
};
var f = (e2, t3) => (Object.keys(t3).forEach(((n2) => {
  if (t3[n2] instanceof Set) {
    let r2 = e2[n2] || /* @__PURE__ */ new Set();
    e2[n2] = /* @__PURE__ */ new Set([...r2, ...t3[n2]]);
  } else {
    if (((e3) => e3 && "object" == typeof e3 && !Array.isArray(e3))(t3[n2])) {
      let r2 = e2[n2] || {};
      e2[n2] = Object.assign({}, t3[n2], r2);
    } else i2(t3[n2]) ? e2[n2] = t3[n2].concat(e2[n2] || []) : void 0 === e2[n2] && (e2[n2] = t3[n2]);
  }
})), e2);
var j = /\//;
var g = class _g {
  constructor(e2 = {}) {
    Object.defineProperty(this, "json", { enumerable: false, value: e2, writable: true });
  }
  get children() {
    return this.json.children;
  }
  get id() {
    return this.json.id;
  }
  get found() {
    return this.json.id || this.json.children.length > 0;
  }
  props(e2 = {}) {
    let t3 = this.json.props || {};
    return "string" == typeof e2 && (t3[e2] = true), this.json.props = Object.assign(t3, e2), this;
  }
  get(t3) {
    if (t3 = c(t3), !j.test(t3)) {
      let e2 = this.json.children.find(((e3) => e3.id === t3));
      return new _g(e2);
    }
    let n2 = ((e2, t4) => {
      let n3 = ((e3) => "string" != typeof e3 ? e3 : (e3 = e3.replace(/^\//, "")).split(/\//))(t4 = t4 || "");
      for (let t5 = 0; t5 < n3.length; t5 += 1) {
        let r2 = e2.children.find(((e3) => e3.id === n3[t5]));
        if (!r2) return null;
        e2 = r2;
      }
      return e2;
    })(this.json, t3) || e({});
    return new _g(n2);
  }
  add(t3, n2 = {}) {
    if (i2(t3)) return t3.forEach(((e2) => this.add(c(e2), n2))), this;
    t3 = c(t3);
    let r2 = e({ id: t3, props: n2 });
    return this.json.children.push(r2), new _g(r2);
  }
  remove(e2) {
    return e2 = c(e2), this.json.children = this.json.children.filter(((t3) => t3.id !== e2)), this;
  }
  nodes() {
    return r(this.json).map(((e2) => (delete (e2 = Object.assign({}, e2)).children, e2)));
  }
  cache() {
    return ((e2) => {
      let t3 = r(e2, ((e3, t4) => {
        e3.id && (e3._cache.parents = e3._cache.parents || [], e3._cache.children = e3._cache.children || [], t4._cache.parents = e3._cache.parents.concat([e3.id]));
      })), n2 = {};
      t3.forEach(((e3) => {
        e3.id && (n2[e3.id] = e3);
      })), t3.forEach(((e3) => {
        e3._cache.parents.forEach(((t4) => {
          n2.hasOwnProperty(t4) && n2[t4]._cache.children.push(e3.id);
        }));
      })), e2._cache.children = Object.keys(n2);
    })(this.json), this;
  }
  list() {
    return r(this.json);
  }
  fillDown() {
    var e2;
    return e2 = this.json, r(e2, ((e3, t3) => {
      t3.props = f(t3.props, e3.props);
    })), this;
  }
  depth() {
    u(this.json);
    let e2 = r(this.json), t3 = e2.length > 1 ? 1 : 0;
    return e2.forEach(((e3) => {
      if (0 === e3._cache.parents.length) return;
      let n2 = e3._cache.parents.length + 1;
      n2 > t3 && (t3 = n2);
    })), t3;
  }
  out(e2) {
    return u(this.json), d(this.json, e2);
  }
  debug() {
    return u(this.json), d(this.json, "debug"), this;
  }
};
var _ = function(e2) {
  let t3 = s(e2);
  return new g(t3);
};
_.prototype.plugin = function(e2) {
  e2(this);
};

// node_modules/compromise/src/1-one/tag/methods/addTags/_colors.js
var colors = {
  Noun: "blue",
  Verb: "green",
  Negative: "green",
  Date: "red",
  Value: "red",
  Adjective: "magenta",
  Preposition: "cyan",
  Conjunction: "cyan",
  Determiner: "cyan",
  Hyphenated: "cyan",
  Adverb: "cyan"
};
var colors_default = colors;

// node_modules/compromise/src/1-one/tag/methods/addTags/02-fmt.js
var getColor = function(node) {
  if (colors_default.hasOwnProperty(node.id)) {
    return colors_default[node.id];
  }
  if (colors_default.hasOwnProperty(node.is)) {
    return colors_default[node.is];
  }
  const found = node._cache.parents.find((c2) => colors_default[c2]);
  return colors_default[found];
};
var fmt = function(nodes) {
  const res = {};
  nodes.forEach((node) => {
    const { not, also, is, novel } = node.props;
    let parents = node._cache.parents;
    if (also) {
      parents = parents.concat(also);
    }
    res[node.id] = {
      is,
      not,
      novel,
      also,
      parents,
      children: node._cache.children,
      color: getColor(node)
    };
  });
  Object.keys(res).forEach((k2) => {
    const nots = new Set(res[k2].not);
    res[k2].not.forEach((not) => {
      if (res[not]) {
        res[not].children.forEach((tag) => nots.add(tag));
      }
    });
    res[k2].not = Array.from(nots);
  });
  return res;
};
var fmt_default = fmt;

// node_modules/compromise/src/1-one/tag/methods/addTags/01-validate.js
var toArr = function(input) {
  if (!input) {
    return [];
  }
  if (typeof input === "string") {
    return [input];
  }
  return input;
};
var addImplied = function(tags, already) {
  Object.keys(tags).forEach((k2) => {
    if (tags[k2].isA) {
      tags[k2].is = tags[k2].isA;
    }
    if (tags[k2].notA) {
      tags[k2].not = tags[k2].notA;
    }
    if (tags[k2].is && typeof tags[k2].is === "string") {
      if (!already.hasOwnProperty(tags[k2].is) && !tags.hasOwnProperty(tags[k2].is)) {
        tags[tags[k2].is] = {};
      }
    }
    if (tags[k2].not && typeof tags[k2].not === "string" && !tags.hasOwnProperty(tags[k2].not)) {
      if (!already.hasOwnProperty(tags[k2].not) && !tags.hasOwnProperty(tags[k2].not)) {
        tags[tags[k2].not] = {};
      }
    }
  });
  return tags;
};
var validate = function(tags, already) {
  tags = addImplied(tags, already);
  Object.keys(tags).forEach((k2) => {
    tags[k2].children = toArr(tags[k2].children);
    tags[k2].not = toArr(tags[k2].not);
  });
  Object.keys(tags).forEach((k2) => {
    const nots = tags[k2].not || [];
    nots.forEach((no) => {
      if (tags[no] && tags[no].not) {
        tags[no].not.push(k2);
      }
    });
  });
  return tags;
};
var validate_default = validate;

// node_modules/compromise/src/1-one/tag/methods/addTags/index.js
var compute3 = function(allTags) {
  const flatList = Object.keys(allTags).map((k2) => {
    const o2 = allTags[k2];
    const props = { not: new Set(o2.not), also: o2.also, is: o2.is, novel: o2.novel };
    return { id: k2, parent: o2.is, props, children: [] };
  });
  const graph = _(flatList).cache().fillDown();
  return graph.out("array");
};
var fromUser = function(tags) {
  Object.keys(tags).forEach((k2) => {
    tags[k2] = Object.assign({}, tags[k2]);
    tags[k2].novel = true;
  });
  return tags;
};
var addTags = function(tags, already) {
  if (Object.keys(already).length > 0) {
    tags = fromUser(tags);
  }
  tags = validate_default(tags, already);
  const allTags = Object.assign({}, already, tags);
  const nodes = compute3(allTags);
  const res = fmt_default(nodes);
  return res;
};
var addTags_default = addTags;

// node_modules/compromise/src/1-one/tag/methods/index.js
var methods_default7 = {
  one: {
    setTag: setTag_default,
    unTag: unTag_default,
    addTags: addTags_default,
    canBe: canBe_default2
  }
};

// node_modules/compromise/src/1-one/tag/api/tag.js
var isArray10 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
var fns5 = {
  /** add a given tag, to all these terms */
  tag: function(input, reason = "", isSafe) {
    if (!this.found || !input) {
      return this;
    }
    const terms = this.termList();
    if (terms.length === 0) {
      return this;
    }
    const { methods: methods17, verbose: verbose2, world: world2 } = this;
    if (verbose2 === true) {
      console.log(" +  ", input, reason || "");
    }
    if (isArray10(input)) {
      input.forEach((tag) => methods17.one.setTag(terms, tag, world2, isSafe, reason));
    } else {
      methods17.one.setTag(terms, input, world2, isSafe, reason);
    }
    this.uncache();
    return this;
  },
  /** add a given tag, only if it is consistent */
  tagSafe: function(input, reason = "") {
    return this.tag(input, reason, true);
  },
  /** remove a given tag from all these terms */
  unTag: function(input, reason) {
    if (!this.found || !input) {
      return this;
    }
    const terms = this.termList();
    if (terms.length === 0) {
      return this;
    }
    const { methods: methods17, verbose: verbose2, model: model4 } = this;
    if (verbose2 === true) {
      console.log(" -  ", input, reason || "");
    }
    const tagSet = model4.one.tagSet;
    if (isArray10(input)) {
      input.forEach((tag) => methods17.one.unTag(terms, tag, tagSet));
    } else {
      methods17.one.unTag(terms, input, tagSet);
    }
    this.uncache();
    return this;
  },
  /** return only the terms that can be this tag  */
  canBe: function(tag) {
    tag = tag.replace(/^#/, "");
    const tagSet = this.model.one.tagSet;
    const canBe3 = this.methods.one.canBe;
    const nope = [];
    this.document.forEach((terms, n2) => {
      terms.forEach((term, i3) => {
        if (!canBe3(term, tag, tagSet)) {
          nope.push([n2, i3, i3 + 1]);
        }
      });
    });
    const noDoc = this.update(nope);
    return this.difference(noDoc);
  }
};
var tag_default = fns5;

// node_modules/compromise/src/1-one/tag/api/index.js
var tagAPI = function(View2) {
  Object.assign(View2.prototype, tag_default);
};
var api_default8 = tagAPI;

// node_modules/compromise/src/1-one/tag/lib.js
var addTags2 = function(tags) {
  const { model: model4, methods: methods17 } = this.world();
  const tagSet = model4.one.tagSet;
  const fn = methods17.one.addTags;
  const res = fn(tags, tagSet);
  model4.one.tagSet = res;
  return this;
};
var lib_default4 = { addTags: addTags2 };

// node_modules/compromise/src/1-one/tag/compute/tagRank.js
var boringTags = /* @__PURE__ */ new Set(["Auxiliary", "Possessive"]);
var sortByKids = function(tags, tagSet) {
  tags = tags.sort((a2, b) => {
    if (boringTags.has(a2) || !tagSet.hasOwnProperty(b)) {
      return 1;
    }
    if (boringTags.has(b) || !tagSet.hasOwnProperty(a2)) {
      return -1;
    }
    let kids = tagSet[a2].children || [];
    const aKids = kids.length;
    kids = tagSet[b].children || [];
    const bKids = kids.length;
    return aKids - bKids;
  });
  return tags;
};
var tagRank = function(view) {
  const { document, world: world2 } = view;
  const tagSet = world2.model.one.tagSet;
  document.forEach((terms) => {
    terms.forEach((term) => {
      const tags = Array.from(term.tags);
      term.tagRank = sortByKids(tags, tagSet);
    });
  });
};
var tagRank_default = tagRank;

// node_modules/compromise/src/1-one/tag/plugin.js
var plugin_default11 = {
  model: {
    one: { tagSet: {} }
  },
  compute: {
    tagRank: tagRank_default
  },
  methods: methods_default7,
  api: api_default8,
  lib: lib_default4
};

// node_modules/compromise/src/1-one/tokenize/methods/01-sentences/01-simple-split.js
var initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s)/g;
var splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s$/;
var newLine = /((?:\r?\n|\r)+)/;
var basicSplit = function(text) {
  const all = [];
  const lines = text.split(newLine);
  for (let i3 = 0; i3 < lines.length; i3++) {
    const arr = lines[i3].split(initSplit);
    for (let o2 = 0; o2 < arr.length; o2++) {
      if (arr[o2 + 1] && splitsOnly.test(arr[o2 + 1]) === true) {
        arr[o2] += arr[o2 + 1];
        arr[o2 + 1] = "";
      }
      if (arr[o2] !== "") {
        all.push(arr[o2]);
      }
    }
  }
  return all;
};
var simple_split_default = basicSplit;

// node_modules/compromise/src/1-one/tokenize/methods/01-sentences/02-simple-merge.js
var hasLetter = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;
var hasSomething = /\S/;
var notEmpty = function(splits) {
  const chunks = [];
  for (let i3 = 0; i3 < splits.length; i3++) {
    const s2 = splits[i3];
    if (s2 === void 0 || s2 === "") {
      continue;
    }
    if (hasSomething.test(s2) === false || hasLetter.test(s2) === false) {
      if (chunks[chunks.length - 1]) {
        chunks[chunks.length - 1] += s2;
        continue;
      } else if (splits[i3 + 1]) {
        splits[i3 + 1] = s2 + splits[i3 + 1];
        continue;
      }
    }
    chunks.push(s2);
  }
  return chunks;
};
var simple_merge_default = notEmpty;

// node_modules/compromise/src/1-one/tokenize/methods/01-sentences/03-smart-merge.js
var hasNewline = function(c2) {
  return Boolean(c2.match(/\n$/));
};
var smartMerge = function(chunks, world2) {
  const isSentence2 = world2.methods.one.tokenize.isSentence;
  const abbrevs = world2.model.one.abbreviations || /* @__PURE__ */ new Set();
  const sentences = [];
  for (let i3 = 0; i3 < chunks.length; i3++) {
    const c2 = chunks[i3];
    if (chunks[i3 + 1] && !isSentence2(c2, abbrevs) && !hasNewline(c2)) {
      chunks[i3 + 1] = c2 + (chunks[i3 + 1] || "");
    } else if (c2 && c2.length > 0) {
      sentences.push(c2);
      chunks[i3] = "";
    }
  }
  return sentences;
};
var smart_merge_default = smartMerge;

// node_modules/compromise/src/1-one/tokenize/methods/01-sentences/04-quote-merge.js
var MAX_QUOTE = 280;
var pairs = {
  '"': '"',
  // 'StraightDoubleQuotes'
  "\uFF02": "\uFF02",
  // 'StraightDoubleQuotesWide'
  // '\u0027': '\u0027', // 'StraightSingleQuotes'
  "\u201C": "\u201D",
  // 'CommaDoubleQuotes'
  // '\u2018': '\u2019', // 'CommaSingleQuotes'
  "\u201F": "\u201D",
  // 'CurlyDoubleQuotesReversed'
  // '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
  "\u201E": "\u201D",
  // 'LowCurlyDoubleQuotes'
  "\u2E42": "\u201D",
  // 'LowCurlyDoubleQuotesReversed'
  "\u201A": "\u2019",
  // 'LowCurlySingleQuotes'
  "\xAB": "\xBB",
  // 'AngleDoubleQuotes'
  "\u2039": "\u203A",
  // 'AngleSingleQuotes'
  "\u2035": "\u2032",
  // 'PrimeSingleQuotes'
  "\u2036": "\u2033",
  // 'PrimeDoubleQuotes'
  "\u2037": "\u2034",
  // 'PrimeTripleQuotes'
  "\u301D": "\u301E",
  // 'PrimeDoubleQuotes'
  // '\u0060': '\u00B4', // 'PrimeSingleQuotes'
  "\u301F": "\u301E"
  // 'LowPrimeDoubleQuotesReversed'
};
var openQuote = RegExp("[" + Object.keys(pairs).join("") + "]", "g");
var closeQuote = RegExp("[" + Object.values(pairs).join("") + "]", "g");
var closesQuote = function(str) {
  if (!str) {
    return false;
  }
  const m = str.match(closeQuote);
  if (m !== null && m.length === 1) {
    return true;
  }
  return false;
};
var quoteMerge = function(splits) {
  const arr = [];
  for (let i3 = 0; i3 < splits.length; i3 += 1) {
    const split2 = splits[i3];
    const m = split2.match(openQuote);
    if (m !== null && m.length === 1) {
      if (closesQuote(splits[i3 + 1]) && splits[i3 + 1].length < MAX_QUOTE) {
        splits[i3] += splits[i3 + 1];
        arr.push(splits[i3]);
        splits[i3 + 1] = "";
        i3 += 1;
        continue;
      }
      if (closesQuote(splits[i3 + 2])) {
        const toAdd = splits[i3 + 1] + splits[i3 + 2];
        if (toAdd.length < MAX_QUOTE) {
          splits[i3] += toAdd;
          arr.push(splits[i3]);
          splits[i3 + 1] = "";
          splits[i3 + 2] = "";
          i3 += 2;
          continue;
        }
      }
    }
    arr.push(splits[i3]);
  }
  return arr;
};
var quote_merge_default = quoteMerge;

// node_modules/compromise/src/1-one/tokenize/methods/01-sentences/05-parens-merge.js
var MAX_LEN = 250;
var hasOpen = /\(/g;
var hasClosed = /\)/g;
var mergeParens = function(splits) {
  const arr = [];
  for (let i3 = 0; i3 < splits.length; i3 += 1) {
    const split2 = splits[i3];
    const m = split2.match(hasOpen);
    if (m !== null && m.length === 1) {
      if (splits[i3 + 1] && splits[i3 + 1].length < MAX_LEN) {
        const m2 = splits[i3 + 1].match(hasClosed);
        if (m2 !== null && m.length === 1 && !hasOpen.test(splits[i3 + 1])) {
          splits[i3] += splits[i3 + 1];
          arr.push(splits[i3]);
          splits[i3 + 1] = "";
          i3 += 1;
          continue;
        }
      }
    }
    arr.push(splits[i3]);
  }
  return arr;
};
var parens_merge_default = mergeParens;

// node_modules/compromise/src/1-one/tokenize/methods/01-sentences/index.js
var hasSomething2 = /\S/;
var startWhitespace = /^\s+/;
var splitSentences = function(text, world2) {
  text = text || "";
  text = String(text);
  if (!text || typeof text !== "string" || hasSomething2.test(text) === false) {
    return [];
  }
  text = text.replace("\xA0", " ");
  const splits = simple_split_default(text);
  let sentences = simple_merge_default(splits);
  sentences = smart_merge_default(sentences, world2);
  sentences = quote_merge_default(sentences);
  sentences = parens_merge_default(sentences);
  if (sentences.length === 0) {
    return [text];
  }
  for (let i3 = 1; i3 < sentences.length; i3 += 1) {
    const ws = sentences[i3].match(startWhitespace);
    if (ws !== null) {
      sentences[i3 - 1] += ws[0];
      sentences[i3] = sentences[i3].replace(startWhitespace, "");
    }
  }
  return sentences;
};
var sentences_default = splitSentences;

// node_modules/compromise/src/1-one/tokenize/methods/02-terms/01-hyphens.js
var hasHyphen2 = function(str, model4) {
  const parts = str.split(/[-–—]/);
  if (parts.length <= 1) {
    return false;
  }
  const { prefixes, suffixes } = model4.one;
  if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
    return false;
  }
  if (prefixes.hasOwnProperty(parts[0])) {
    return false;
  }
  parts[1] = parts[1].trim().replace(/[.?!]$/, "");
  if (suffixes.hasOwnProperty(parts[1])) {
    return false;
  }
  const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
  if (reg.test(str) === true) {
    return true;
  }
  const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
  if (reg2.test(str) === true) {
    return true;
  }
  return false;
};
var splitHyphens2 = function(word) {
  const arr = [];
  const hyphens = word.split(/[-–—]/);
  let whichDash = "-";
  const found = word.match(/[-–—]/);
  if (found && found[0]) {
    whichDash = found;
  }
  for (let o2 = 0; o2 < hyphens.length; o2++) {
    if (o2 === hyphens.length - 1) {
      arr.push(hyphens[o2]);
    } else {
      arr.push(hyphens[o2] + whichDash);
    }
  }
  return arr;
};

// node_modules/compromise/src/1-one/tokenize/methods/02-terms/03-ranges.js
var combineRanges = function(arr) {
  const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
  const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
  for (let i3 = 0; i3 < arr.length - 1; i3 += 1) {
    if (arr[i3 + 1] && startRange.test(arr[i3]) && endRange.test(arr[i3 + 1])) {
      arr[i3] = arr[i3] + arr[i3 + 1];
      arr[i3 + 1] = null;
    }
  }
  return arr;
};
var ranges_default = combineRanges;

// node_modules/compromise/src/1-one/tokenize/methods/02-terms/02-slashes.js
var isSlash = /\p{L} ?\/ ?\p{L}+$/u;
var combineSlashes = function(arr) {
  for (let i3 = 1; i3 < arr.length - 1; i3++) {
    if (isSlash.test(arr[i3])) {
      arr[i3 - 1] += arr[i3] + arr[i3 + 1];
      arr[i3] = null;
      arr[i3 + 1] = null;
    }
  }
  return arr;
};
var slashes_default = combineSlashes;

// node_modules/compromise/src/1-one/tokenize/methods/02-terms/index.js
var wordlike = /\S/;
var isBoundary = /^[!?.]+$/;
var naiiveSplit = /(\S+)/;
var notWord = [
  ".",
  "?",
  "!",
  ":",
  ";",
  "-",
  "\u2013",
  "\u2014",
  "--",
  "...",
  "(",
  ")",
  "[",
  "]",
  '"',
  "'",
  "`",
  "\xAB",
  "\xBB",
  "*",
  "\u2022"
];
notWord = notWord.reduce((h2, c2) => {
  h2[c2] = true;
  return h2;
}, {});
var isArray11 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
var splitWords = function(str, model4) {
  let result = [];
  let arr = [];
  str = str || "";
  if (typeof str === "number") {
    str = String(str);
  }
  if (isArray11(str)) {
    return str;
  }
  const words = str.split(naiiveSplit);
  for (let i3 = 0; i3 < words.length; i3++) {
    if (hasHyphen2(words[i3], model4) === true) {
      arr = arr.concat(splitHyphens2(words[i3]));
      continue;
    }
    arr.push(words[i3]);
  }
  let carry = "";
  for (let i3 = 0; i3 < arr.length; i3++) {
    const word = arr[i3];
    if (wordlike.test(word) === true && notWord.hasOwnProperty(word) === false && isBoundary.test(word) === false) {
      if (result.length > 0) {
        result[result.length - 1] += carry;
        result.push(word);
      } else {
        result.push(carry + word);
      }
      carry = "";
    } else {
      carry += word;
    }
  }
  if (carry) {
    if (result.length === 0) {
      result[0] = "";
    }
    result[result.length - 1] += carry;
  }
  result = slashes_default(result);
  result = ranges_default(result);
  result = result.filter((s2) => s2);
  return result;
};
var terms_default = splitWords;

// node_modules/compromise/src/1-one/tokenize/methods/03-whitespace/tokenize.js
var isLetter = /\p{Letter}/u;
var isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
var hasAcronym = /^[a-z]\.([a-z]\.)+/i;
var chillin = /[sn]['’]$/;
var normalizePunctuation = function(str, model4) {
  const { prePunctuation: prePunctuation2, postPunctuation: postPunctuation2, emoticons: emoticons2 } = model4.one;
  let original = str;
  let pre = "";
  let post = "";
  const chars = Array.from(str);
  if (emoticons2.hasOwnProperty(str.trim())) {
    return { str: str.trim(), pre, post: " " };
  }
  let len = chars.length;
  for (let i3 = 0; i3 < len; i3 += 1) {
    const c2 = chars[0];
    if (prePunctuation2[c2] === true) {
      continue;
    }
    if ((c2 === "+" || c2 === "-") && isNumber.test(chars[1])) {
      break;
    }
    if (c2 === "'" && c2.length === 3 && isNumber.test(chars[1])) {
      break;
    }
    if (isLetter.test(c2) || isNumber.test(c2)) {
      break;
    }
    pre += chars.shift();
  }
  len = chars.length;
  for (let i3 = 0; i3 < len; i3 += 1) {
    const c2 = chars[chars.length - 1];
    if (postPunctuation2[c2] === true) {
      continue;
    }
    if (isLetter.test(c2) || isNumber.test(c2)) {
      break;
    }
    if (c2 === "." && hasAcronym.test(original) === true) {
      continue;
    }
    if (c2 === "'" && chillin.test(original) === true) {
      continue;
    }
    post = chars.pop() + post;
  }
  str = chars.join("");
  if (str === "") {
    original = original.replace(/ *$/, (after2) => {
      post = after2 || "";
      return "";
    });
    str = original;
    pre = "";
  }
  return { str, pre, post };
};
var tokenize_default = normalizePunctuation;

// node_modules/compromise/src/1-one/tokenize/methods/03-whitespace/index.js
var parseTerm = (txt, model4) => {
  const { str, pre, post } = tokenize_default(txt, model4);
  const parsed = {
    text: str,
    pre,
    post,
    tags: /* @__PURE__ */ new Set()
  };
  return parsed;
};
var whitespace_default2 = parseTerm;

// node_modules/compromise/src/1-one/tokenize/methods/unicode.js
var killUnicode = function(str, world2) {
  const unicode2 = world2.model.one.unicode || {};
  str = str || "";
  const chars = str.split("");
  chars.forEach((s2, i3) => {
    if (unicode2[s2]) {
      chars[i3] = unicode2[s2];
    }
  });
  return chars.join("");
};
var unicode_default = killUnicode;

// node_modules/compromise/src/1-one/tokenize/compute/normal/01-cleanup.js
var clean = function(str) {
  str = str || "";
  str = str.toLowerCase();
  str = str.trim();
  const original = str;
  str = str.replace(/[,;.!?]+$/, "");
  str = str.replace(/\u2026/g, "...");
  str = str.replace(/\u2013/g, "-");
  if (/^[:;]/.test(str) === false) {
    str = str.replace(/\.{3,}$/g, "");
    str = str.replace(/[",.!:;?)]+$/g, "");
    str = str.replace(/^['"(]+/g, "");
  }
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, "");
  str = str.trim();
  if (str === "") {
    str = original;
  }
  str = str.replace(/([0-9]),([0-9])/g, "$1$2");
  return str;
};
var cleanup_default = clean;

// node_modules/compromise/src/1-one/tokenize/compute/normal/02-acronyms.js
var periodAcronym = /([A-Z]\.)+[A-Z]?,?$/;
var oneLetterAcronym = /^[A-Z]\.,?$/;
var noPeriodAcronym = /[A-Z]{2,}('s|,)?$/;
var lowerCaseAcronym = /([a-z]\.)+[a-z]\.?$/;
var isAcronym = function(str) {
  if (periodAcronym.test(str) === true) {
    return true;
  }
  if (lowerCaseAcronym.test(str) === true) {
    return true;
  }
  if (oneLetterAcronym.test(str) === true) {
    return true;
  }
  if (noPeriodAcronym.test(str) === true) {
    return true;
  }
  return false;
};
var doAcronym = function(str) {
  if (isAcronym(str)) {
    str = str.replace(/\./g, "");
  }
  return str;
};
var acronyms_default = doAcronym;

// node_modules/compromise/src/1-one/tokenize/compute/normal/index.js
var normalize = function(term, world2) {
  const killUnicode2 = world2.methods.one.killUnicode;
  let str = term.text || "";
  str = cleanup_default(str);
  str = killUnicode2(str, world2);
  str = acronyms_default(str);
  term.normal = str;
};
var normal_default = normalize;

// node_modules/compromise/src/1-one/tokenize/methods/parse.js
var parse2 = function(input, world2) {
  const { methods: methods17, model: model4 } = world2;
  const { splitSentences: splitSentences2, splitTerms, splitWhitespace } = methods17.one.tokenize;
  input = input || "";
  const sentences = splitSentences2(input, world2);
  input = sentences.map((txt) => {
    let terms = splitTerms(txt, model4);
    terms = terms.map((t3) => splitWhitespace(t3, model4));
    terms.forEach((t3) => {
      normal_default(t3, world2);
    });
    return terms;
  });
  return input;
};
var parse_default2 = parse2;

// node_modules/compromise/src/1-one/tokenize/methods/01-sentences/is-sentence.js
var isAcronym2 = /[ .][A-Z]\.? *$/i;
var hasEllipse = /(?:\u2026|\.{2,}) *$/;
var hasLetter2 = /\p{L}/u;
var hasPeriod = /\. *$/;
var leadInit = /^[A-Z]\. $/;
var isSentence = function(str, abbrevs) {
  if (hasLetter2.test(str) === false) {
    return false;
  }
  if (isAcronym2.test(str) === true) {
    return false;
  }
  if (str.length === 3 && leadInit.test(str)) {
    return false;
  }
  if (hasEllipse.test(str) === true) {
    return false;
  }
  const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, "");
  const words = txt.split(" ");
  const lastWord = words[words.length - 1].toLowerCase();
  if (abbrevs.hasOwnProperty(lastWord) === true && hasPeriod.test(str) === true) {
    return false;
  }
  return true;
};
var is_sentence_default = isSentence;

// node_modules/compromise/src/1-one/tokenize/methods/index.js
var methods_default8 = {
  one: {
    killUnicode: unicode_default,
    tokenize: {
      splitSentences: sentences_default,
      isSentence: is_sentence_default,
      splitTerms: terms_default,
      splitWhitespace: whitespace_default2,
      fromString: parse_default2
    }
  }
};

// node_modules/compromise/src/1-one/tokenize/model/aliases.js
var aliases = {
  "&": "and",
  "@": "at",
  "%": "percent",
  "plz": "please",
  "bein": "being"
};
var aliases_default = aliases;

// node_modules/compromise/src/1-one/tokenize/model/abbreviations/misc.js
var misc_default = [
  "approx",
  "apt",
  "bc",
  "cyn",
  "eg",
  "esp",
  "est",
  "etc",
  "ex",
  "exp",
  "prob",
  //probably
  "pron",
  // Pronunciation
  "gal",
  //gallon
  "min",
  "pseud",
  "fig",
  //figure
  "jd",
  "lat",
  //latitude
  "lng",
  //longitude
  "vol",
  //volume
  "fm",
  //not am
  "def",
  //definition
  "misc",
  "plz",
  //please
  "ea",
  //each
  "ps",
  "sec",
  //second
  "pt",
  "pref",
  //preface
  "pl",
  //plural
  "pp",
  //pages
  "qt",
  //quarter
  "fr",
  //french
  "sq",
  "nee",
  //given name at birth
  "ss",
  //ship, or sections
  "tel",
  "temp",
  "vet",
  "ver",
  //version
  "fem",
  //feminine
  "masc",
  //masculine
  "eng",
  //engineering/english
  "adj",
  //adjective
  "vb",
  //verb
  "rb",
  //adverb
  "inf",
  //infinitive
  "situ",
  // in situ
  "vivo",
  "vitro",
  "wr"
  //world record
];

// node_modules/compromise/src/1-one/tokenize/model/abbreviations/honorifics.js
var honorifics_default = [
  "adj",
  "adm",
  "adv",
  "asst",
  "atty",
  "bldg",
  "brig",
  "capt",
  "cmdr",
  "comdr",
  "cpl",
  "det",
  "dr",
  "esq",
  "gen",
  "gov",
  "hon",
  "jr",
  "llb",
  "lt",
  "maj",
  "messrs",
  "mlle",
  "mme",
  "mr",
  "mrs",
  "ms",
  "mstr",
  "phd",
  "prof",
  "pvt",
  "rep",
  "reps",
  "res",
  "rev",
  "sen",
  "sens",
  "sfc",
  "sgt",
  "sir",
  "sr",
  "supt",
  "surg"
  //miss
  //misses
];

// node_modules/compromise/src/1-one/tokenize/model/abbreviations/months.js
var months_default = ["jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec"];

// node_modules/compromise/src/1-one/tokenize/model/abbreviations/nouns.js
var nouns_default = [
  "ad",
  "al",
  "arc",
  "ba",
  "bl",
  "ca",
  "cca",
  "col",
  "corp",
  "ft",
  "fy",
  "ie",
  "lit",
  "ma",
  "md",
  "pd",
  "tce"
];

// node_modules/compromise/src/1-one/tokenize/model/abbreviations/organizations.js
var organizations_default = ["dept", "univ", "assn", "bros", "inc", "ltd", "co"];

// node_modules/compromise/src/1-one/tokenize/model/abbreviations/places.js
var places_default = [
  "rd",
  "st",
  "dist",
  "mt",
  "ave",
  "blvd",
  "cl",
  // 'ct',
  "cres",
  "hwy",
  //states
  "ariz",
  "cal",
  "calif",
  "colo",
  "conn",
  "fla",
  "fl",
  "ga",
  "ida",
  "ia",
  "kan",
  "kans",
  "minn",
  "neb",
  "nebr",
  "okla",
  "penna",
  "penn",
  "pa",
  "dak",
  "tenn",
  "tex",
  "ut",
  "vt",
  "va",
  "wis",
  "wisc",
  "wy",
  "wyo",
  "usafa",
  "alta",
  "ont",
  "que",
  "sask"
];

// node_modules/compromise/src/1-one/tokenize/model/abbreviations/units.js
var units_default = [
  "dl",
  "ml",
  "gal",
  // 'ft', //ambiguous
  "qt",
  "pt",
  "tbl",
  "tsp",
  "tbsp",
  "km",
  "dm",
  //decimeter
  "cm",
  "mm",
  "mi",
  "td",
  "hr",
  //hour
  "hrs",
  //hour
  "kg",
  "hg",
  "dg",
  //decigram
  "cg",
  //centigram
  "mg",
  //milligram
  "\xB5g",
  //microgram
  "lb",
  //pound
  "oz",
  //ounce
  "sq ft",
  "hz",
  //hertz
  "mps",
  //meters per second
  "mph",
  "kmph",
  //kilometers per hour
  "kb",
  //kilobyte
  "mb",
  //megabyte
  // 'gb', //ambig
  "tb",
  //terabyte
  "lx",
  //lux
  "lm",
  //lumen
  // 'pa', //ambig
  "fl oz",
  //
  "yb"
];

// node_modules/compromise/src/1-one/tokenize/model/lexicon.js
var list = [
  [misc_default],
  [units_default, "Unit"],
  [nouns_default, "Noun"],
  [honorifics_default, "Honorific"],
  [months_default, "Month"],
  [organizations_default, "Organization"],
  [places_default, "Place"]
];
var abbreviations = {};
var lexicon2 = {};
list.forEach((a2) => {
  a2[0].forEach((w) => {
    abbreviations[w] = true;
    lexicon2[w] = "Abbreviation";
    if (a2[1] !== void 0) {
      lexicon2[w] = [lexicon2[w], a2[1]];
    }
  });
});

// node_modules/compromise/src/1-one/tokenize/model/prefixes.js
var prefixes_default = [
  "anti",
  "bi",
  "co",
  "contra",
  "de",
  "extra",
  "infra",
  "inter",
  "intra",
  "macro",
  "micro",
  "mis",
  "mono",
  "multi",
  "peri",
  "pre",
  "pro",
  "proto",
  "pseudo",
  "re",
  "sub",
  "supra",
  "trans",
  "tri",
  "un",
  "out",
  //out-lived
  "ex"
  //ex-wife
  // 'counter',
  // 'mid',
  // 'out',
  // 'non',
  // 'over',
  // 'post',
  // 'semi',
  // 'super', //'super-cool'
  // 'ultra', //'ulta-cool'
  // 'under',
  // 'whole',
].reduce((h2, str) => {
  h2[str] = true;
  return h2;
}, {});

// node_modules/compromise/src/1-one/tokenize/model/suffixes.js
var suffixes_default = {
  "like": true,
  "ish": true,
  "less": true,
  "able": true,
  "elect": true,
  "type": true,
  "designate": true
  // 'fold':true,
};

// node_modules/compromise/src/1-one/tokenize/model/unicode.js
var compact = {
  "!": "\xA1",
  "?": "\xBF\u0241",
  '"': '\u201C\u201D"\u275D\u275E',
  "'": "\u2018\u201B\u275B\u275C\u2019",
  "-": "\u2014\u2013",
  a: "\xAA\xC0\xC1\xC2\xC3\xC4\xC5\xE0\xE1\xE2\xE3\xE4\xE5\u0100\u0101\u0102\u0103\u0104\u0105\u01CD\u01CE\u01DE\u01DF\u01E0\u01E1\u01FA\u01FB\u0200\u0201\u0202\u0203\u0226\u0227\u023A\u0386\u0391\u0394\u039B\u03AC\u03B1\u03BB\u0410\u0430\u0466\u0467\u04D0\u04D1\u04D2\u04D3\u019B\xE6",
  b: "\xDF\xFE\u0180\u0181\u0182\u0183\u0184\u0185\u0243\u0392\u03B2\u03D0\u03E6\u0411\u0412\u042A\u042C\u0432\u044A\u044C\u0462\u0463\u048C\u048D",
  c: "\xA2\xA9\xC7\xE7\u0106\u0107\u0108\u0109\u010A\u010B\u010C\u010D\u0186\u0187\u0188\u023B\u023C\u037B\u037C\u03F2\u03F9\u03FD\u03FE\u0421\u0441\u0454\u0480\u0481\u04AA\u04AB",
  d: "\xD0\u010E\u010F\u0110\u0111\u0189\u018A\u0221\u018B\u018C",
  e: "\xC8\xC9\xCA\xCB\xE8\xE9\xEA\xEB\u0112\u0113\u0114\u0115\u0116\u0117\u0118\u0119\u011A\u011B\u0190\u0204\u0205\u0206\u0207\u0228\u0229\u0246\u0247\u0388\u0395\u039E\u03A3\u03AD\u03B5\u03BE\u03F5\u0400\u0401\u0415\u0435\u0450\u0451\u04BC\u04BD\u04BE\u04BF\u04D6\u04D7\u1EC5",
  f: "\u0191\u0192\u03DC\u03DD\u04FA\u04FB\u0492\u0493\u017F",
  g: "\u011C\u011D\u011E\u011F\u0120\u0121\u0122\u0123\u0193\u01E4\u01E5\u01E6\u01E7\u01F4\u01F5",
  h: "\u0124\u0125\u0126\u0127\u0195\u01F6\u021E\u021F\u0389\u0397\u0402\u040A\u040B\u041D\u043D\u0452\u045B\u04A2\u04A3\u04A4\u04A5\u04BA\u04BB\u04C9\u04CA",
  I: "\xCC\xCD\xCE\xCF",
  i: "\xEC\xED\xEE\xEF\u0128\u0129\u012A\u012B\u012C\u012D\u012E\u012F\u0130\u0131\u0196\u0197\u0208\u0209\u020A\u020B\u038A\u0390\u03AA\u03AF\u03B9\u03CA\u0406\u0407\u0456\u0457i\u0307",
  j: "\u0134\u0135\u01F0\u0237\u0248\u0249\u03F3\u0408\u0458",
  k: "\u0136\u0137\u0138\u0198\u0199\u01E8\u01E9\u039A\u03BA\u040C\u0416\u041A\u0436\u043A\u045C\u049A\u049B\u049C\u049D\u049E\u049F\u04A0\u04A1",
  l: "\u0139\u013A\u013B\u013C\u013D\u013E\u013F\u0140\u0141\u0142\u019A\u01AA\u01C0\u01CF\u01D0\u0234\u023D\u0399\u04C0\u04CF",
  m: "\u039C\u03FA\u03FB\u041C\u043C\u04CD\u04CE",
  n: "\xD1\xF1\u0143\u0144\u0145\u0146\u0147\u0148\u0149\u014A\u014B\u019D\u019E\u01F8\u01F9\u0220\u0235\u039D\u03A0\u03AE\u03B7\u03DE\u040D\u0418\u0419\u041B\u041F\u0438\u0439\u043B\u043F\u045D\u048A\u048B\u04C5\u04C6\u04E2\u04E3\u04E4\u04E5\u03C0",
  o: "\xD2\xD3\xD4\xD5\xD6\xD8\xF0\xF2\xF3\xF4\xF5\xF6\xF8\u014C\u014D\u014E\u014F\u0150\u0151\u019F\u01A0\u01A1\u01D1\u01D2\u01EA\u01EB\u01EC\u01ED\u01FE\u01FF\u020C\u020D\u020E\u020F\u022A\u022B\u022C\u022D\u022E\u022F\u0230\u0231\u038C\u0398\u039F\u03B8\u03BF\u03C3\u03CC\u03D5\u03D8\u03D9\u03EC\u03F4\u041E\u0424\u043E\u0472\u0473\u04E6\u04E7\u04E8\u04E9\u04EA\u04EB",
  p: "\u01A4\u03A1\u03C1\u03F7\u03F8\u03FC\u0420\u0440\u048E\u048F\xDE",
  q: "\u024A\u024B",
  r: "\u0154\u0155\u0156\u0157\u0158\u0159\u01A6\u0210\u0211\u0212\u0213\u024C\u024D\u0403\u0413\u042F\u0433\u044F\u0453\u0490\u0491",
  s: "\u015A\u015B\u015C\u015D\u015E\u015F\u0160\u0161\u01A7\u01A8\u0218\u0219\u023F\u0405\u0455",
  t: "\u0162\u0163\u0164\u0165\u0166\u0167\u01AB\u01AC\u01AD\u01AE\u021A\u021B\u0236\u023E\u0393\u03A4\u03C4\u03EE\u0422\u0442",
  u: "\xD9\xDA\xDB\xDC\xF9\xFA\xFB\xFC\u0168\u0169\u016A\u016B\u016C\u016D\u016E\u016F\u0170\u0171\u0172\u0173\u01AF\u01B0\u01B1\u01B2\u01D3\u01D4\u01D5\u01D6\u01D7\u01D8\u01D9\u01DA\u01DB\u01DC\u0214\u0215\u0216\u0217\u0244\u03B0\u03C5\u03CB\u03CD",
  v: "\u03BD\u0474\u0475\u0476\u0477",
  w: "\u0174\u0175\u019C\u03C9\u03CE\u03D6\u03E2\u03E3\u0428\u0429\u0448\u0449\u0461\u047F",
  x: "\xD7\u03A7\u03C7\u03D7\u03F0\u0425\u0445\u04B2\u04B3\u04FC\u04FD\u04FE\u04FF",
  y: "\xDD\xFD\xFF\u0176\u0177\u0178\u01B3\u01B4\u0232\u0233\u024E\u024F\u038E\u03A5\u03AB\u03B3\u03C8\u03D2\u03D3\u03D4\u040E\u0423\u0443\u0447\u045E\u0470\u0471\u04AE\u04AF\u04B0\u04B1\u04EE\u04EF\u04F0\u04F1\u04F2\u04F3",
  z: "\u0179\u017A\u017B\u017C\u017D\u017E\u01B5\u01B6\u0224\u0225\u0240\u0396"
};
var unicode = {};
Object.keys(compact).forEach(function(k2) {
  compact[k2].split("").forEach(function(s2) {
    unicode[s2] = k2;
  });
});
var unicode_default2 = unicode;

// node_modules/compromise/src/1-one/tokenize/model/punctuation.js
var prePunctuation = {
  "#": true,
  //#hastag
  "@": true,
  //@atmention
  "_": true,
  //underscore
  "\xB0": true,
  // '+': true,//+4
  // '\\-',//-4  (escape)
  // '.',//.4
  // zero-width chars
  "\u200B": true,
  "\u200C": true,
  "\u200D": true,
  "\uFEFF": true
};
var postPunctuation = {
  "%": true,
  //88%
  "_": true,
  //underscore
  "\xB0": true,
  //degrees, italian ordinal
  // '\'',// sometimes
  // zero-width chars
  "\u200B": true,
  "\u200C": true,
  "\u200D": true,
  "\uFEFF": true
};
var emoticons = {
  "<3": true,
  "</3": true,
  "<\\3": true,
  ":^P": true,
  ":^p": true,
  ":^O": true,
  ":^3": true
};

// node_modules/compromise/src/1-one/tokenize/model/index.js
var model_default2 = {
  one: {
    aliases: aliases_default,
    abbreviations,
    prefixes: prefixes_default,
    suffixes: suffixes_default,
    prePunctuation,
    postPunctuation,
    lexicon: lexicon2,
    //give this one forward
    unicode: unicode_default2,
    emoticons
  }
};

// node_modules/compromise/src/1-one/tokenize/compute/alias.js
var hasSlash = /\//;
var hasDomain = /[a-z]\.[a-z]/i;
var isMath = /[0-9]/;
var addAliases = function(term, world2) {
  const str = term.normal || term.text || term.machine;
  const aliases2 = world2.model.one.aliases;
  if (aliases2.hasOwnProperty(str)) {
    term.alias = term.alias || [];
    term.alias.push(aliases2[str]);
  }
  if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
    const arr = str.split(hasSlash);
    if (arr.length <= 3) {
      arr.forEach((word) => {
        word = word.trim();
        if (word !== "") {
          term.alias = term.alias || [];
          term.alias.push(word);
        }
      });
    }
  }
  return term;
};
var alias_default = addAliases;

// node_modules/compromise/src/1-one/tokenize/compute/machine.js
var hasDash3 = /^\p{Letter}+-\p{Letter}+$/u;
var doMachine = function(term) {
  let str = term.implicit || term.normal || term.text;
  str = str.replace(/['’]s$/, "");
  str = str.replace(/s['’]$/, "s");
  str = str.replace(/([aeiou][ktrp])in'$/, "$1ing");
  if (hasDash3.test(str)) {
    str = str.replace(/-/g, "");
  }
  str = str.replace(/^[#@]/, "");
  if (str !== term.normal) {
    term.machine = str;
  }
};
var machine_default = doMachine;

// node_modules/compromise/src/1-one/tokenize/compute/freq.js
var freq = function(view) {
  const docs = view.docs;
  const counts = {};
  for (let i3 = 0; i3 < docs.length; i3 += 1) {
    for (let t3 = 0; t3 < docs[i3].length; t3 += 1) {
      const term = docs[i3][t3];
      const word = term.machine || term.normal;
      counts[word] = counts[word] || 0;
      counts[word] += 1;
    }
  }
  for (let i3 = 0; i3 < docs.length; i3 += 1) {
    for (let t3 = 0; t3 < docs[i3].length; t3 += 1) {
      const term = docs[i3][t3];
      const word = term.machine || term.normal;
      term.freq = counts[word];
    }
  }
};
var freq_default = freq;

// node_modules/compromise/src/1-one/tokenize/compute/offset.js
var offset = function(view) {
  let elapsed = 0;
  let index3 = 0;
  const docs = view.document;
  for (let i3 = 0; i3 < docs.length; i3 += 1) {
    for (let t3 = 0; t3 < docs[i3].length; t3 += 1) {
      const term = docs[i3][t3];
      term.offset = {
        index: index3,
        start: elapsed + term.pre.length,
        length: term.text.length
      };
      elapsed += term.pre.length + term.text.length + term.post.length;
      index3 += 1;
    }
  }
};
var offset_default = offset;

// node_modules/compromise/src/1-one/tokenize/compute/reindex.js
var index2 = function(view) {
  const document = view.document;
  for (let n2 = 0; n2 < document.length; n2 += 1) {
    for (let i3 = 0; i3 < document[n2].length; i3 += 1) {
      document[n2][i3].index = [n2, i3];
    }
  }
};
var reindex_default = index2;

// node_modules/compromise/src/1-one/tokenize/compute/wordCount.js
var wordCount2 = function(view) {
  let n2 = 0;
  const docs = view.docs;
  for (let i3 = 0; i3 < docs.length; i3 += 1) {
    for (let t3 = 0; t3 < docs[i3].length; t3 += 1) {
      if (docs[i3][t3].normal === "") {
        continue;
      }
      n2 += 1;
      docs[i3][t3].wordCount = n2;
    }
  }
};
var wordCount_default = wordCount2;

// node_modules/compromise/src/1-one/tokenize/compute/index.js
var termLoop = function(view, fn) {
  const docs = view.docs;
  for (let i3 = 0; i3 < docs.length; i3 += 1) {
    for (let t3 = 0; t3 < docs[i3].length; t3 += 1) {
      fn(docs[i3][t3], view.world);
    }
  }
};
var methods16 = {
  alias: (view) => termLoop(view, alias_default),
  machine: (view) => termLoop(view, machine_default),
  normal: (view) => termLoop(view, normal_default),
  freq: freq_default,
  offset: offset_default,
  index: reindex_default,
  wordCount: wordCount_default
};
var compute_default7 = methods16;

// node_modules/compromise/src/1-one/tokenize/plugin.js
var plugin_default12 = {
  compute: compute_default7,
  methods: methods_default8,
  model: model_default2,
  hooks: ["alias", "machine", "index", "id"]
};

// node_modules/compromise/src/1-one/typeahead/compute.js
var typeahead = function(view) {
  const prefixes = view.model.one.typeahead;
  const docs = view.docs;
  if (docs.length === 0 || Object.keys(prefixes).length === 0) {
    return;
  }
  const lastPhrase = docs[docs.length - 1] || [];
  const lastTerm = lastPhrase[lastPhrase.length - 1];
  if (lastTerm.post) {
    return;
  }
  if (prefixes.hasOwnProperty(lastTerm.normal)) {
    const found = prefixes[lastTerm.normal];
    lastTerm.implicit = found;
    lastTerm.machine = found;
    lastTerm.typeahead = true;
    if (view.compute.preTagger) {
      view.last().unTag("*").compute(["lexicon", "preTagger"]);
    }
  }
};
var compute_default8 = { typeahead };

// node_modules/compromise/src/1-one/typeahead/api.js
var autoFill = function() {
  const docs = this.docs;
  if (docs.length === 0) {
    return this;
  }
  const lastPhrase = docs[docs.length - 1] || [];
  const term = lastPhrase[lastPhrase.length - 1];
  if (term.typeahead === true && term.machine) {
    term.text = term.machine;
    term.normal = term.machine;
  }
  return this;
};
var api2 = function(View2) {
  View2.prototype.autoFill = autoFill;
};
var api_default9 = api2;

// node_modules/compromise/src/1-one/typeahead/lib/allPrefixes.js
var getPrefixes = function(arr, opts2, world2) {
  let index3 = {};
  const collisions = [];
  const existing = world2.prefixes || {};
  arr.forEach((str) => {
    str = str.toLowerCase().trim();
    let max2 = str.length;
    if (opts2.max && max2 > opts2.max) {
      max2 = opts2.max;
    }
    for (let size = opts2.min; size < max2; size += 1) {
      const prefix2 = str.substring(0, size);
      if (opts2.safe && world2.model.one.lexicon.hasOwnProperty(prefix2)) {
        continue;
      }
      if (existing.hasOwnProperty(prefix2) === true) {
        collisions.push(prefix2);
        continue;
      }
      if (index3.hasOwnProperty(prefix2) === true) {
        collisions.push(prefix2);
        continue;
      }
      index3[prefix2] = str;
    }
  });
  index3 = Object.assign({}, existing, index3);
  collisions.forEach((str) => {
    delete index3[str];
  });
  return index3;
};
var allPrefixes_default = getPrefixes;

// node_modules/compromise/src/1-one/typeahead/lib/index.js
var isObject7 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
var defaults2 = {
  safe: true,
  min: 3
};
var prepare = function(words = [], opts2 = {}) {
  const model4 = this.model();
  opts2 = Object.assign({}, defaults2, opts2);
  if (isObject7(words)) {
    Object.assign(model4.one.lexicon, words);
    words = Object.keys(words);
  }
  const prefixes = allPrefixes_default(words, opts2, this.world());
  Object.keys(prefixes).forEach((str) => {
    if (model4.one.typeahead.hasOwnProperty(str)) {
      delete model4.one.typeahead[str];
      return;
    }
    model4.one.typeahead[str] = prefixes[str];
  });
  return this;
};
var lib_default5 = {
  typeahead: prepare
};

// node_modules/compromise/src/1-one/typeahead/plugin.js
var model3 = {
  one: {
    typeahead: {}
    //set a blank key-val
  }
};
var plugin_default13 = {
  model: model3,
  api: api_default9,
  lib: lib_default5,
  compute: compute_default8,
  hooks: ["typeahead"]
};

// node_modules/compromise/src/one.js
nlp_default.extend(plugin_default2);
nlp_default.extend(plugin_default8);
nlp_default.extend(plugin_default7);
nlp_default.extend(plugin_default9);
nlp_default.extend(plugin_default11);
nlp_default.plugin(plugin_default3);
nlp_default.extend(plugin_default12);
nlp_default.extend(plugin_default4);
nlp_default.plugin(plugin_default);
nlp_default.extend(plugin_default6);
nlp_default.extend(plugin_default13);
nlp_default.extend(plugin_default5);
nlp_default.extend(plugin_default10);
var one_default = nlp_default;
export {
  one_default as default
};
