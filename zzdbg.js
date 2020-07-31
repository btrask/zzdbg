(function zzdbg_main(){

var w = window;
var d = w.document;
var zzdbg = {};
var ui = d.createElement("div");
var hpos = 0;
var oldconsole = {};
var reqHandlers = {};
var resHandlers = [null];

zzdbg.loader = null;
zzdbg.script = null;
zzdbg.history = [];
zzdbg.editors = [];
zzdbg.editor = null;
zzdbg.filename = null;

if(w.zzdbg) {
zzdbg.loader = w.zzdbg.loader;
zzdbg.script = w.zzdbg.script;
zzdbg.script.textContent = "("+zzdbg_main.toString()+")();";
w.zzdbg.script = null;
zzdbg.history = w.zzdbg.history;
zzdbg.editors = w.zzdbg.editors;
zzdbg.editor = w.zzdbg.editor;
w.zzdbg.editor = null;
zzdbg.filename = w.zzdbg.filename;
w.zzdbg.close();
}
w.zzdbg = zzdbg;

zzdbg.close = function() {
exchange(oldconsole, console);
if(zzdbg.script) zzdbg.script.remove();
ui.remove();
w.removeEventListener("message", messageListener, true);
delete w.zzdbg;
};
zzdbg.ui = ui;

ui.className = "zzdbgui";
ui.innerHTML = '<style>'+
'.zzdbg, * { pointer-events:auto !important; }'+
'.zzdbgui, .zzdbgui *, .zzeditor { font:3vw monospace !important; margin:0 !important; padding:0 !important; box-sizing:border-box !important; border-radius:0; background-color:white; color:black; }'+
'.zzdbgui { position:fixed; left:0; bottom:0; width:100%; height:40%; z-index:100000000000; }'+
'.zzdbgui textarea, .zzdbgui input, .zzeditor { border:0.3vw solid black !important; padding:0 1vw !important; outline:none; resize:none; }'+
'.zzoutput { position:absolute; left:0; top:0; width:100%; height:calc(100% - 6vw); overflow-y:auto; white-space:pre-wrap; }'+
'.zzbar { position:absolute; left:0; bottom:0; width:100%; height:6vw; }'+
'.zzbar * { position:absolute; top:0; height:100%; }'+
'.zzinput { left:0; width:calc(100% - 20vw) !important; }'+
'.zzdnbtn, .zzupbtn { width:10vw; font-size:1em; text-align:center; }'+
'.zzdnbtn { right:10vw; }'+
'.zzupbtn { right:0vw; }'+
'.zzsuggest { position:fixed; bottom:5vw; right:25vw; border:0.3vw solid black; overflow-x:hidden; overflow-y:auto; }'+
'.zzsuggest[hidden] { display:none !important; }'+
'.zzsuggest > * { padding:0.5vw 2vw !important; }'+
'.zzeditor { width:100%; height:60%; }'+
'</style>'+
'<textarea class="zzoutput" readonly="true"></textarea>'+
'<div class="zzbar">'+
'<textarea class="zzinput"></textarea>'+
'<input class="zzdnbtn" type="button" value="⬇">'+
'<input class="zzupbtn" type="button" value="⬆">'+
'</div>'+
'<div class="zzsuggest" hidden><\div>';

d.body.appendChild(ui);
var output = ui.querySelector(".zzoutput");
var input = ui.querySelector(".zzinput");
var upbtn = ui.querySelector(".zzupbtn");
var dnbtn = ui.querySelector(".zzdnbtn");
var suggest = ui.querySelector(".zzsuggest");
zzdbg.output = output;
zzdbg.input = input;
zzdbg.upbtn = upbtn;
zzdbg.dnbtn = dnbtn;
zzdbg.suggest = suggest;


zzdbg.lastError = undefined;
zzdbg.do = function(cmd) {
var err, res;
var quiet = false;
writeToOutput(["> "+cmd], true);

try {
if(".h" == cmd) {
zzdbg.info(zzdbg.doc);
quiet = true;
} else if(".q" == cmd) return zzdbg.close();
else if(/^\.o\b/.test(cmd)) res = zzdbg.open(zzdbg.evalLocal("("+cmd.replace(/^\.o\s*/, "")+")"));
else if(/^\.d\b/.test(cmd)) res = docLookup(cmd.replace(/^\.d\s*/, ""));
else if(/^\.p\b/.test(cmd)) res = zzdbg.properties(zzdbg.evalLocal("("+cmd.replace(/^\.p\s*/, "")+")"));
else if(".e" == cmd) {
selectElement();
quiet = true;
} else if(".a" == cmd) {
zzdbg.applyChanges();
quiet = true;
} else if(/^\.s\b/.test(cmd)) {
if(!zzdbg.editor) throw new Error("not in edit mode");
zzdbg.filename = cmd.replace(/^\.s\s*|\s*$/g, "") || zzdbg.filename;
zzdbg.dl({ filename: zzdbg.filename || "untitled.txt", url:"data:text/plain,"+encodeURI(zzdbg.editor.value) });
} else res = zzdbg.evalLocal(cmd.replace(/^javascript:/, ""));
} catch(e) { err = e; }

if(!quiet) writeToOutput([err||res], false);
if(".c" == cmd) output.value = "";
zzdbg.history.push({ cmd:cmd, res:res, err:err });
w._ = res;
zzdbg.lastError = err;
};

input.onkeydown = function(event) {
var cmd = input.value;
hpos = 0;
if("Enter" != event.key) return;
event.preventDefault();
if("" == cmd) return;
input.value = "";
zzdbg.do(cmd);
suggest.hidden = true;
};
input.onkeyup = function(event){
var cmd = input.value;
var pos = input.selectionEnd;
var term = cmd.slice(0, pos).match(/([\w$]+\.)*[\w$]*$/);
try {
var base = term[0].replace(/\.?[\w$]*$/, "") || "window";
var part = term[0].replace(/^([\w$]+\.)*/, "");
var compare = new Intl.Collator("en").compare;
var props = term[0].length ? zzdbg.properties(zzdbg.evalLocal("("+base+")")) : [];
props = Array.prototype.concat.apply([], props).filter(function(prop){ return prop.startsWith(part) && prop != part; }).sort(compare);

suggest.innerHTML = "";
for(var i = 0; i < props.length; i++) {
var item = d.createElement("div");
item.textContent = props[i];
suggest.appendChild(item);
item.onclick = function() {
input.value = input.value.slice(0, pos)+this.textContent.slice(part.length)+input.value.slice(pos);
suggest.hidden = true;
input.focus();
input.selectionStart = input.selectionEnd = pos+(this.textContent.length-part.length);
};
}
suggest.hidden = !props.length;
suggest.style.width = suggest.scrollWidth+"px";
suggest.style.height = Math.min(suggest.scrollHeight, w.innerHeight*.75)+"px";
} catch(e) { suggest.hidden = true; }
};


dnbtn.onclick = upbtn.onclick = function(event) {
input.focus();
var dir = 0;
if(dnbtn == this) dir = -1;
if(upbtn == this) dir = +1;
if(0 == dir) return;
hpos += dir;
hpos = Math.min(hpos, zzdbg.history.length);
if(hpos < 0) hpos = 0;
input.value = hpos ? zzdbg.history.slice(-hpos)[0].cmd : "";
input.selectionStart = input.selectionEnd = input.value.length;
};


zzdbg.stringify = null;
zzdbg.stringifyDepth = 3;
zzdbg.stringifyFull = function(x, depth, inlineStrings) {
if(undefined === depth || undefined === inlineStrings) throw new Error("stringify args");

if(zzdbg.stringify) {
x = zzdbg.stringify(x, depth, inlineStrings);
if(isa(x, String)) return x;
}

if(depth >= zzdbg.stringifyDepth) return "…";
if(depth >= 1 && "function" == typeof x) return "[function …]";

if(isa(x, Text)) {
x = x.textContent.replace(/^\s+|\s+$/g, "");
if(!x) return '" "';
}

if(isa(x, String)) {
return inlineStrings && 0 == depth ? x : JSON.stringify(x);
}

if(isa(x, NodeList) || isa(x, NamedNodeMap) || isa(x, StyleSheetList) || isa(x, HTMLCollection) || isa(x, HTMLAllCollection)) x = toArray(x);

if(isa(x, Array)) {
if(depth >= zzdbg.stringifyDepth-1) return "[ ("+x.length+" items) ]";
return "[ "+x.map(function(y, i) { return i+": "+zzdbg.stringifyFull(y, depth+1, inlineStrings); }).join(", ")+" ]";
}

if(isa2(x, Window)) {
try { return "[Window "+zzdbg.stringifyFull(x.zzdbg_initialLocation||x.location.href, depth+1, inlineStrings)+"]"; }
catch(e) { if(!isSecurityError(e)) throw e; return "[Cross-origin window for "+zzdbg.stringifyFull(zzdbg.frameElement(x), depth+1, false)+"]"; }
}

try {
if(isa(x, CSSStyleSheet) || isa(x, CSSRuleList)) return "["+x.constructor.name+" with "+(x.cssRules||x).length+" rules]";
if(isa(x, CSSRule)) return x.cssText;
if(isa(x, CSSStyleDeclaration)) return "{ "+(x.cssText||toArray(x).filter(function(attr) { return x[attr]; }).map(function(attr) { return attr+": "+x[attr]; }).join("; "))+" }";
} catch(e) {
if(!isSecurityError(e)) throw e;
if(x.href) return "["+x.constructor.name+' "'+url_summary(x.href)+'"]';
return "[cross-origin "+x.constructor.name+"]"
}

function url_summary(url) {
return 0 == depth ? url : "…"+(urlBasename(url)||"");
}
if(isa(x, HTMLElement)) {
var attrs = toArray(x.attributes).filter(function(attr) { return 0 == depth || /^(id|class|href|src)$/i.test(attr.name); }).map(function(attr) { return zzdbg.stringifyFull(attr, depth, false); });
if(attrs.length < x.attributes.length) attrs.push("…");
return "<"+[x.tagName.toLowerCase()].concat(attrs).join(" ")+">"+(0==depth ? " "+zzdbg.stringifyFull(zzdbg.cssRules(x), depth, false) : "");
}
if(isa(x, Attr)) {
if(/^(href|src|srcset|background|poster)$/i.test(x.name)) return x.name+'="'+url_summary(x.value)+'"';
return x.name+'="'+x.value+'"';
}

var str;
if(null === x || undefined === x) str = String(x);
try { if(!str && x.__proto__ && "function" == typeof x.__proto__.toString) str = String(x.__proto__.toString.call(x)); }
catch(e) { if(isSecurityError(e)) str = "[cross-origin object]"; }
if(!str) str = Object.prototype.toString.call(x);

if(str && "[object Object]" != str) return str;
return "{ "+Object.keys(x).map(function(key) { return key+": "+zzdbg.stringifyFull(x[key], depth+1, inlineStrings); }).join(", ")+" }";
};


function findprop(obj, prop, depth) {
if(!depth) return null;
if(!obj) return null;
var descriptors = Object.getOwnPropertyDescriptors(obj);

for(var name in descriptors) {
if(obj === w && descriptors[name].enumerable) continue;
var val = descriptors[name].value;
if("function" != typeof val) continue;
if(prop.constructor === val && Function != val) return [name];
if(val === prop) return [name];
var x = findprop(val.prototype, prop, depth-1) || findprop(val, prop, depth-1);
if(x) return [name].concat(x);
}
return null;
}
function docLookup(str) {
var url = null;
try {
var path = null;
if("" === str) return zzdbg.info("Usage: .d (expression or search terms)");
if("null" == str || "undefined" == str) path = [str];
else {
var x = zzdbg.evalLocal("("+str+")");
if(null === x || undefined === x) throw new Error();
path = findprop(w, x, 2);
}
if(!path || !path[0]) throw new Error();

if("CSS2Properties" == path[0]) path[0] = "CSSStyleDeclaration";

if(/^encode|^Object$|^Array$|^Boolean$|^Number$|^BigInt$|^Math$|^Date$|^String$|^RegExp$|Error$|Function$/.test(path[0])) url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/"+path.join("/");
else if(/^CSS|^DOM|^File|^HTML|^Node|^NamedNode|^RTC|^XML|^Attr$|^ChildNode$|^Document$|^IDBFactory$|^URL$|^Window$|Event|Style|Element$|List$/.test(path[0])) url = "https://developer.mozilla.org/en-US/docs/Web/API/"+path.join("/");
else url = "https://developer.mozilla.org/en-US/search?q="+path.join(".");

} catch(e) {
url = "https://developer.mozilla.org/en-US/search?q="+encodeURIComponent(str);
}

return zzdbg.openWindow(url);
}

zzdbg.properties = function(obj) {
var descriptors = Object.getOwnPropertyDescriptors(obj);
var results = [ Object.keys(descriptors) ];
var proto = null;
try { proto = obj.__proto__; }
catch(e) {}
if(proto) results =  results.concat(zzdbg.properties(proto));
return results;
};


zzdbg.cancelSelect = null;
zzdbg.selectElement = function(roots, callback) {
roots = isa(roots, Array) ? roots : roots ? [roots] : [w].concat(toArray(w));
for(var i = 0; i < roots.length; i++) try { roots[i].addEventListener("click", listener, true); } catch(e) { zzdbg.info("Unable to install handler", roots[i]); }
if(zzdbg.cancelSelect) zzdbg.cancelSelect();
zzdbg.cancelSelect = function() {
for(var i = 0; i < roots.length; i++) try { roots[i].removeEventListener("click", listener, true); } catch(e) {}
zzdbg.cancelSelect = null;
};
function listener(event) {
event.preventDefault();
event.stopPropagation();
zzdbg.cancelSelect();
if(callback) callback(event.target);
}
};
zzdbg.lastSelectedElement = null;
function selectElement() {
zzdbg.selectElement(null, function(elem) {
zzdbg.selectElementAction(elem);
var h = zzdbg.history.slice(-1)[0];
if(h && ".e" == h.cmd) { h.res = w._ = elem; }
zzdbg.lastSelectedElement = elem;
});
zzdbg.info("(Waiting for click…)");
}


zzdbg.log = zzdbg.info = function zzdbg_log(...args) {
writeToOutput(args, true);
};
zzdbg.warn = specialLog("Warning:");
zzdbg.error = specialLog("Error:");
function specialLog(pfx) {
return function zzdbg_log(...args) { writeToOutput([pfx].concat(args), true); };
};
oldconsole.log = oldconsole.warn = oldconsole.info = oldconsole.error = zzdbg.log;
exchange(oldconsole, console);
function writeToOutput(array, inlineStrings) {
if(output.value) output.value +="\n";
try { output.value += array.map(function(arg) { return zzdbg.stringifyFull(arg, 0, inlineStrings); }).join(" "); }
catch(e) { output.value += e+" (zzdbg stringify)"; }
output.scrollTop = output.scrollHeight;
}
zzdbg.selectElementAction = zzdbg.log;


zzdbg.cssRules = function(obj) {
var elems = isa(obj, String) ? document.querySelectorAll(obj) : obj.length >= 0 ? obj : [obj];
var results = [];
var sheets = d.styleSheets;
for(var i = 0; i < sheets.length; i++) {
var rules;
try { rules = sheets[i].cssRules; }
catch(e) { results.push(sheets[i]); continue; }
for(var j = 0; j < rules.length; j++) {
for(var k = 0; k < elems.length; k++) {
try { if(elems[k].matches(rules[j].selectorText)) { results.push(rules[j]); break; } }
catch(e) { if(!isa(e, SyntaxError)) throw e+k; }
}
}
}
return results;
};


zzdbg.open = function(obj) {
var win = zzdbg.viewAsSource(obj);
if(win) return win;
obj = zzdbg.frameElement(obj) || obj;
var url = parseURL(obj) || (obj.location||{}).href || obj.href || obj.src || ((obj.attributes||{}).background||{}).value;
if(!url) return null;
url = String(url);
if(/^javascript:/.test(url)) return zzdbg.viewAsSource(url);
return zzdbg.openWindow(url);
};
zzdbg.viewAsSource = function(obj, name) {
var target = obj, url, str;
if(obj == zzdbg.loader) {
target = "loader.js";
str = obj.toString();
name = name || target;
} else if(isa(obj, HTMLScriptElement)) {
if(obj == zzdbg.script) name = name || "zzdbg.js";
if(obj.src) { url = obj.src; name = name || urlBasename(obj.src) || "untitled.js"; }
else { str = obj.textContent; name = name || "inline-script.js"; }
} else if(isa(obj, HTMLStyleElement)) {
str = obj.textContent;
} else if(isa(obj, CSSStyleSheet)) {
if(obj.href) url = obj.href;
else str = obj.ownerNode.textContent;
} else if(isa(obj, HTMLLinkElement)) {
url = obj.href;
} else if(isa(obj, String)) {
var parsed = parseURL(obj);
if(!parsed) str = obj;
else if("javascript:" == parsed.protocol) {
str = obj;
name = name || "bookmarklet.js";
} else if(/\.(js|css|html)$/i.test(parsed.pathname)) url = obj;
target = null;
}
return openEditor(target, url, str, name);
};
function findEditor(obj) {
if(!obj) return;
var ed = zzdbg.editors;
for(var i = 0; i < ed.length; i++) {
var closedOrDead = true;
try { closedOrDead = ed[i].window.closed; } catch(e) {}
if(closedOrDead) { ed.splice(i, 1); i--; continue; }
if(ed[i].window === obj) return ed[i].target;
if(ed[i].target === obj) return ed[i].window;
}
}
function openEditor(target, url, str, name) {
var win = findEditor(target);
if(win) return win.focus(), win;
if(!url && !isa(str, String)) return null;
var title = "zzdbg source view for "+(name||"untitled")+" ("+d.title+")";
var jsurl = 'javascript:'+JSON.stringify(title)+'; "..."';
win = zzdbg.openWindow(url || jsurl, "editor");
if(!win) throw new Error("couldn't create window");
try { setupWin(); win.onload = setupWin; }
catch(e) { zzdbg.info("(To edit, run zzdbg again in the new window)"); }
function setupWin() {
if(!url) {
win.document.title = name || "";
win.document.body.innerHTML = "<pre></pre>";
win.document.querySelector("pre").textContent = str.replace(/^\s+|\s+$/g, "");
}
win.zzdbg_filename = name;
win.location = zzdbg.bookmarklet();
}
zzdbg.editors.push({ window:win, target:target });
return win;
}
zzdbg.applyChanges = function() {
if(!zzdbg.editor) throw new Error("not in edit mode");
var src = zzdbg.editor.value;
sendWindowRequest(w.opener, "apply", { src:src }, function(res) { zzdbg.info("Apply changes:", res || "success"); });
};
reqHandlers.apply = function(win, payload, sendRes) {
var target = findEditor(win);
if(undefined === target) return sendRes("unknown target");
var src = payload.src;
if(!isa(src, String)) return sendRes("not a string");
try {
if(!target) {
return sendRes("target does not support editing");
} else if("loader.js" == target) {
zzdbg.loader = zzdbg.evalLocal("("+src+")");
} else if(isa(target, HTMLScriptElement)) {
if(target.src) target["data-zzdbg-src"] = target.src;
target.removeAttribute("src");
target.textContent = '"nop"';
target.textContent = src;
if(d.contains(target)) zzdbg.evalLocal(src);
} else {
zzdbg.log("apply to unsupported target", target);
return sendRes("unsupported target");
}
sendRes(null);
} catch(e) { sendRes(String(e)); }
};
zzdbg.openWindow = function(url, type) {
if(isa(url, URL)) url = String(url);
if(!isa(url, String)) throw new TypeError("expected string/URL");
var rnd = Math.random().toString(36).slice(2);
var win = w.open(url, "zzdbg-"+(type||"window")+"-"+rnd);
try { if(win) win.zzdbg_initialLocation = url; }
catch(e) {}
return win;
};
zzdbg.bookmarklet = function() {
return 'javascript:('+zzdbg.loader.toString()+')('+JSON.stringify("("+zzdbg_main.toString()+")();")+');/*END*/';
};

zzdbg.wgetcmd = function(dls) {
if(!isa(dls, Array)) dls = toArray(arguments);
return dls.map(function(dl){ return "wget --adjust-extension " + (isa(dl, String) ? safe_shell_arg(dl) : safe_shell_arg(dl.url)+" -O '"+safe_filename(dl.filename)+"'"); }).join("; ");
};
function safe_shell_arg(shell_arg) {
return "'"+shell_arg.replace(/\'/g, "\\'")+"'";
}
function safe_filename(filename) {
return filename.replace(/[^a-zA-Z0-9._ \[\]\{\}-]/g, "_");
}
zzdbg.dl = function(dls) {
if(!isa(dls, Array)) dls = toArray(arguments);
var a = d.createElement("a");
ui.appendChild(a);
/*a.target = "_blank";*/
for(var i = 0; i < dls.length; i++) {
a.download = (isa(dls[i], String) ? "" : dls[i].filename);
a.href = (isa(dls[i], String) ? dls[i] : dls[i].url);
a.click();
}
a.remove();
};

zzdbg.frameElement = function(win) {
if(!isa(win, Window)) return null;
try { return win.frameElement; }
catch(e) { if(!isSecurityError(e)) throw e; }
var frames = document.querySelectorAll("frame, iframe");
for(var i = 0; i < frames.length; i++) if(frames[i].contentWindow == win) return frames[i];
return null;
};


function has(a, b) {
return Object.prototype.hasOwnProperty.call(a, b);
}
function exchange(a, b) {
for(var p in a) if(has(a, p)) { var swap = a[p]; a[p] = b[p]; b[p] = swap; }
}
function toArray(x) {
return Array.prototype.slice.call(x);
}
function isa(x, y) {
if(Array == y) return Array.isArray(x);
if(String == y && "string" == typeof x) return true;
return x instanceof y;
}
function isa2(x, y) {
if(isa(x, y)) return true;
try { return x.constructor.name == y.name; }
catch(e) { return false; }
}
function escapeHTML(str) {
var x = d.createElement("div");
x.textContent = str;
return x.innerHTML;
}
function parseURL(str) {
if(!isa(str, String)) return null;
try { return new URL(str, document.baseURI); }
catch(e) { return null; }
}
function urlBasename(str) {
var url = parseURL(str) || {};
var x = /([\w%._-]*\/?)$/.exec(url.pathname);
return x && x[1];
}
function isSecurityError(e) {
return "SecurityError" == e.name;
}

zzdbg.log("zzdbg - type .h for help");

function eval2(str) {
var n = zzdbg.evalItems.length;
var x = zzdbg.evalItems[n] = { err: new SyntaxError("eval2") };
var s = d.createElement("script");
str = str.replace(/(;|\s|\/\/[^"']*|\/\*[^"']*)*$/, "");
var expr = /^\s*\{/.test(str) ? '{{{{{ '+str+' }}}}}' : 'zzdbg.evalItems['+n+'].res = ((((( '+str+' )))))';
s.textContent =
'try { '+expr+'; delete zzdbg.evalItems['+n+'].err; }'+
'catch(e) { zzdbg.evalItems['+n+'].err = e; }';
ui.appendChild(s); s.remove();
delete zzdbg.evalItems[n];
if(has(x, "err")) throw x.err;
return x.res;
}
zzdbg.evalItems = [];
zzdbg.evalLocal = eval;
try { zzdbg.evalLocal('"test"'); }
catch(e) {
zzdbg.evalLocal = eval2; zzdbg.warn("Warning: zzdbg is running without eval(). Please wrap statements in braces: { var x; }. Expressions can be run as normal: func(). ("+e+")");
}
zzdbg.eval = function(cmd, cb) {
var err = null, res = null;
try { res = zzdbg.evalLocal(cmd); }
catch(e) { err = e; }
setTimeout(function() { cb(err, res); }, 0);
};


function enterEditMode() {
zzdbg.info("Editor mode: use .a to apply changes to main document");
zzdbg.eval = function(src, cb) {
sendWindowRequest(w.opener, "eval", cmd, function(res) {});
};
if(!zzdbg.editor) {
zzdbg.filename = w.zzdbg_filename || urlBasename(w.location.href) || "untitled";
zzdbg.editor = d.createElement("textarea");
zzdbg.editor.className = "zzeditor";
d.title = "zzdbg source view for "+zzdbg.filename;
var pre = d.querySelector("pre") || d.body.childNodes[0];
zzdbg.editor.value = pre.textContent;
pre.replaceWith(zzdbg.editor);
}
}
reqHandlers.eval = function(win, payload, sendRes) {};
if(/^zzdbg-editor/.test(w.name)) enterEditMode();


function sendWindowRequest(window, type, payload, cb) {
var id = resHandlers.length;
resHandlers[id] = cb;
window.postMessage({ zzdbg_msg:{ dir:"req", type:type, payload:payload, id:id } }, "*");
}
function messageListener(ev) {
var win = ev.source;
var msg = ev.data.zzdbg_msg;
var dir = msg.dir;
var type = msg.type;
var payload = msg.payload;
var id = msg.id;
if("req" == dir && has(reqHandlers, type)) reqHandlers[type](win, payload, sendRes);
if("res" == dir && id < resHandlers.length && "function" == typeof resHandlers[id]) { resHandlers[id](payload); delete resHandlers[id]; }
function sendRes(payload) {
win.postMessage({ zzdbg_msg:{ dir:"res", type:type, payload:payload, id:id } }, ev.origin);
}
}
w.addEventListener("message", messageListener, true);


zzdbg.doc = "Commands:"+
"\n\t.h - help"+
"\n\t.q - quit"+
"\n\t.c - clear output"+
"\n\t.o (expr) - open/view source"+
"\n\t.d (expr) - MDN doc"+
"\n\t.p (expr) - list properties"+
"\n\t.e - select element"+
"\n\t.a - apply changes to main document (editor mode)"+
"\n\t.s (filename) - save file (editor mode)"+
"";
input.focus();
})();