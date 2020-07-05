(function zzdbg_main(w){

var d = w.document;
var zzdbg = {};
var ui = d.createElement("div");
var history = [];
var hpos = 0;
var oldconsole = {};

zzdbg.loader = null;
zzdbg.script = null;

if(w.zzdbg) {
history = w.zzdbg.history || history;
zzdbg.loader = w.zzdbg.loader;
zzdbg.script = w.zzdbg.script;
w.zzdbg.script = null;
w.zzdbg.close();
}
w.zzdbg = zzdbg;
zzdbg.history = history;

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
'.zzdbgui, .zzdbgui * { font-family:monospace; font-size:3vw; margin:0 !important; padding:0 !important; box-sizing:border-box; border-radius:0; background-color:white; color:black; }'+
'.zzdbgui { position:fixed; left:0; bottom:0; width:100%; height:40%; z-index:100000000; }'+
'.zzdbgui textarea, .zzdbgui input { border:0.3vw solid black !important; padding:0 1vw; }'+
'.zzoutput { position:absolute; left:0; top:0; width:100%; height:calc(100% - 6vw); overflow-y:auto; white-space:pre-wrap; }'+
'.zzbar { position:absolute; left:0; bottom:0; width:100%; height:6vw; }'+
'.zzbar * { position:absolute; top:0; height:100%; }'+
'.zzinput { left:0; width:calc(100% - 20vw); }'+
'.zzdnbtn, .zzupbtn { width:10vw; font-size:1em; text-align:center; }'+
'.zzdnbtn { right:10vw; }'+
'.zzupbtn { right:0; }'+
'.zzsuggest { position:fixed; bottom:5vw; right:25vw; border:0.3vw solid black; overflow:hidden auto; text-overflow:ellipsis; }'+
'.zzsuggest > * { padding:0.5vw 2vw; }'+
'</style>'+
'<textarea class="zzoutput" readonly="true"></textarea>'+
'<div class="zzbar">'+
'<input class="zzinput" type="text">'+
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


zzdbg.do = function(cmd) {
var err, res;
writeToOutput(["> "+cmd], true);

try {
if(".h" == cmd) zzdbg.info(zzdbg.doc);
else if(".q" == cmd) return zzdbg.close();
else if(/^\.o\b/.test(cmd)) res = zzdbg.open(zzdbg.evalLocal("("+cmd.replace(/^\.o\s*/, "")+")"));
else if(/^\.d\b/.test(cmd)) res = docLookup(cmd.replace(/^\.d\s*/, ""));
else if(/^\.p\b/.test(cmd)) res = zzdbg.properties(zzdbg.evalLocal("("+cmd.replace(/^\.p\s*/, "")+")"));
else if(".s" == cmd) res = selectElement();
else if(".a" == cmd) res = zzdbg.applyChanges();
else res = zzdbg.evalLocal(cmd.replace(/^javascript:/, ""));
} catch(e) { err = e; }

writeToOutput([err||res], false);
if(".c" == cmd) output.value = "";
history.push({ cmd:cmd, res:res, err:err });
w._ = res;
};

input.onkeyup = function(event){
var cmd = input.value;
hpos = 0;

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

if("Enter" != event.key) return;
if("" == cmd) return;
input.value = "";
zzdbg.do(cmd);
suggest.hidden = true;
};


dnbtn.onclick = upbtn.onclick = function(event) {
input.focus();
var dir = 0;
if(dnbtn == this) dir = -1;
if(upbtn == this) dir = +1;
if(0 == dir) return;
hpos += dir;
if(hpos > history.length) hpos = history.length;
if(hpos < 0) hpos = 0;
input.value = hpos ? history.slice(-hpos)[0].cmd : "";
input.selectionStart = input.selectionEnd = input.value.length;
};


zzdbg.stringify = null;
zzdbg.stringifyDepth = 3;
zzdbg.stringifyFull = function(x, depth, inlineStrings) {
if(undefined === depth || undefined === inlineStrings) throw new Error("stringify args");

if(zzdbg.stringify) {
x = zzdbg.stringify(x, depth, inlineStrings);
if(isString(x)) return x;
}

if(depth >= zzdbg.stringifyDepth) return "…";
if(depth >= 1 && "function" == typeof x) return "[function …]";

if(x instanceof Text) {
x = x.textContent.replace(/^\s+|\s+$/g, "");
if(!x) return '" "';
}

if(isString(x)) {
return inlineStrings && 0 == depth ? x : JSON.stringify(x);
}

if(x instanceof NodeList || x instanceof NamedNodeMap || x instanceof StyleSheetList || x instanceof HTMLCollection) x = toArray(x);

if(Array.isArray(x)) {
if(depth >= zzdbg.stringifyDepth-1) return "[ ("+x.length+" item(s)) ]";
return "[ "+x.map(function(y) { return zzdbg.stringifyFull(y, depth+1, inlineStrings); }).join(", ")+" ]";
}

if(x instanceof Window) return "[Window "+zzdbg.stringifyFull(x.initialLocation||x.location.href, depth+1, inlineStrings)+"]";

try {
if(x instanceof CSSStyleSheet) return zzdbg.stringifyFull(x.cssRules, depth, inlineStrings);
if(x instanceof CSSRuleList) {
if(depth >= 1) return "["+x.length+" CSS rule(s)]";
return toArray(x).map(function(rule) { return zzdbg.stringifyFull(rule, depth+1, inlineStrings); }).join("\n");
}
if(x instanceof CSSRule) return x.cssText;
if(x instanceof CSSStyleDeclaration) return "{ "+x.cssText+" }";
} catch(e) { if(!(e instanceof SecurityError)) throw e; }

function url_summary(url) {
return url.replace(/^.*\//, "…");
}
if(x instanceof HTMLElement) {
var attrs = [x.tagName.toLowerCase()];
if(x.id) attrs.push('id="'+x.id+'"');
else if(x.href) attrs.push('href="'+url_summary(x.href)+'"');
else if(x.src) attrs.push('src="'+url_summary(x.src)+'"');
else if(x.className) attrs.push('class="'+x.className+'"');
return "<"+attrs.join(" ")+">";
}

if(x instanceof Attr) return x.name+'="'+x.value+'"';

var str = null;
if(null === x || undefined === x) str = String(x);
try { if(null === str && x.__proto__ && "function" == typeof x.__proto__.toString) str = String(x.__proto__.toString.call(x));
} catch(e){}
if(null === str) str = Object.prototype.toString.call(x);

if(!isString(x) && "[object Object]" == str) return "{ "+Object.keys(x).map(function(key) { return key+": "+zzdbg.stringifyFull(x[key], depth+1, inlineStrings); }).join(", ")+" }";

return str;
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

if(/^encode|^Object$|^Array$|^Boolean$|^Number$|^BigInt$|^Math$|^Date$|^String$|^RegExp$|Error$/.test(path[0])) url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/"+path.join("/");
else if(/^CSS|^DOM|^HTML|^Node|^NamedNode|^RTC|^XML|^Attr$|^ChildNode$|^Document$|^IDBFactory$|^URL$|^Window$|Event|Style|Element$|List$/.test(path[0])) url = "https://developer.mozilla.org/en-US/docs/Web/API/"+path.join("/");
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


zzdbg.selectElement = function(root, callback) {
root = root || d;
root.addEventListener("click", listener, true);
function listener(event) {
event.preventDefault();
event.stopPropagation();
root.removeEventListener("click", listener, true);
if(callback) callback(event.target);
}
};
zzdbg.lastSelectedElement = null;
function selectElement() {
zzdbg.selectElement(null, function(elem) {
zzdbg.selectElementAction(elem);
var h = zzdbg.history.slice(-1)[0];
if(h && ".s" == h.cmd) { h.res = elem; w._ = elem; }
zzdbg.lastSelectedElement = elem;
});
zzdbg.info("(Waiting for click…)");
}


zzdbg.log = zzdbg.warn = zzdbg.info = zzdbg.error = function zzdbg_log(args) {
return writeToOutput(toArray(arguments), true);
};
oldconsole.log = oldconsole.warn = oldconsole.info = oldconsole.error = zzdbg.log;
exchange(oldconsole, console);
function writeToOutput(array, inlineStrings) {
if(output.value) output.value +="\n";
try { output.value += array.map(function(arg) { return zzdbg.stringifyFull(arg, 0, inlineStrings); }).join(", "); }
catch(e) { output.value += e+" (zzdbg stringify)"; }
output.scrollTop = output.scrollHeight;
}


zzdbg.inspect = zzdbg.selectElementAction = function(elem) {
zzdbg.log(elem, zzdbg.cssRules(elem));
};
zzdbg.cssRules = function(elem) {
var results = [];
var sheets = d.styleSheets;
for(var i = 0; i < sheets.length; i++) {
var rules = sheets[i].cssRules;
for(var j = 0; j < rules.length; j++) {
var matches = false;
try { matches = elem.matches(rules[j].selectorText); } catch(e) { if(!(e instanceof SyntaxError)) throw e; }
if(matches) results.push(rules[j]);
}
}
return results;
};


zzdbg.open = function(obj) {
var win = zzdbg.viewAsSource(obj);
if(win) return win;
var url = null;
if(obj.href) url = obj.href;
else if(obj.src) url = obj.src;
return zzdbg.openWindow(url);
};
zzdbg.viewAsSource = function(obj, name) {
var url = null;
var str = null;

if(obj instanceof HTMLScriptElement) {
if(obj.src) url = obj.src;
else str = obj.textContent;
} else if(obj instanceof HTMLStyleElement) {
str = obj.textContent;
} else if(obj instanceof CSSStyleSheet) {
if(obj.href) url = obj.href;
else str = obj.ownerNode.textContent;
} else if(obj instanceof HTMLLinkElement) {
url = obj.href;
}

if(url) return zzdbg.openWindow(url, "editor");

if(isString(obj)) str = obj;
else name = name || zzdbg.stringifyFull(obj, 0, true);
name = name || "untitled";

if(!str) return null;

var title = "zzdbg source view for "+name+" ("+d.title+")";
var win = zzdbg.openWindow('javascript:'+JSON.stringify(title)+'; "Loading…"', "editor");
win.onload = function() {
win.document.body.innerHTML = "<pre></pre>";
win.document.querySelector("pre").textContent = str.replace(/^\s+|\s+$/g, "");
zzdbg_main(win);
};
return win;
};
zzdbg.applyChanges = function() {
if(!zzdbg.editMode) throw new Error("Not in edit mode");
w.opener.postMessage({ zzdbg_apply: true, zzdbg_src: d.querySelector("pre").textContent });
};
var windowNumber = 0;
zzdbg.openWindow = function(url, type) {
var win = w.open(url, "zzdbg-"+(type||"window")+"-"+(windowNumber++));
win.initialLocation = url;
return win;
};


zzdbg.wgetcmd = function(dls) {
if(!Array.isArray(dls)) dls = toArray(arguments);
return dls.map(function(dl){ return "wget --adjust-extension " + (isString(dl) ? safe_shell_arg(dl) : safe_shell_arg(dl.url)+" -O '"+safe_filename(dl.filename)+"'"); }).join("; ");
};
function safe_shell_arg(shell_arg) {
return "'"+shell_arg.replace(/\'/g, "\\'")+"'";
}
function safe_filename(filename) {
return filename.replace(/[^a-zA-Z0-9._ \[\]\{\}-]/g, "_");
}


zzdbg.dl = function(dls) {
if(!Array.isArray(dls)) dls = toArray(arguments);
var a = d.createElement("a");
ui.appendChild(a);
/*a.target = "_blank";*/
for(var i = 0; i < dls.length; i++) {
a.download = (isString(dls[i]) ? "" : dls[i].filename);
a.href = (isString(dls[i]) ? dls[i] : dls[i].url);
a.click();
}
a.remove();
};


zzdbg.bookmarklet = function() {
var src = 'javascript:('+zzdbg.loader.toString()+')('+JSON.stringify(zzdbg.script.textContent)+')/*END*/';
return zzdbg.viewAsSource(src, "zzdbg bookmarklet");
};
zzdbg.edit = function() {
return zzdbg.viewAsSource(zzdbg.script);
};


function has(a, b) {
return Object.prototype.hasOwnProperty.call(a, b);
}
function exchange(a, b) {
for(var prop in a) if(has(a, prop)) {
var swap = a[prop];
a[prop] = b[prop];
b[prop] = swap;
}
}
function toArray(x) {
return Array.prototype.slice.call(x);
}
function isString(x) {
return "string" == typeof x || x instanceof String;
}
function escapeHTML(str) {
var x = d.createElement("div");
x.textContent = str;
return x.innerHTML;
}

zzdbg.log("zzdbg - type .h for help");

function eval2(str) {
var n = zzdbg.evalItems.length;
var x = zzdbg.evalItems[n] = { err: new SyntaxError("eval2") };
var s = d.createElement("script");
str = str.replace(/;+$/, "");
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
zzdbg.evalLocal = eval2;
zzdbg.log(e); zzdbg.log("Warning: zzdbg is running without eval(). Please wrap statements in braces: { var x; }. Expressions can be run as normal: func().");
}
zzdbg.eval = function(cmd, cb) {
var err = null, res = null;
try { res = zzdbg.evalLocal(cmd); }
catch(e) { err = e; }
setTimeout(function() { cb(err, res); }, 0);
};


zzdbg.editMode = false;
if(/^zzdbg-editor/.test(w.name)) {
zzdbg.editMode = true;
d.title = "zzdbg source view for "+d.title;
var code = d.querySelector("pre");
code.style = "white-space:pre-wrap; font:20pt monospace;";
code.contentEditable = true;
zzdbg.log("Note: zzdbg is running as an editor. Javascript commands will be executed in the host window. Use .a to apply your changes to the main document. Use .q to hide this console.");
zzdbg.eval = function(src, cb) {
var n = zzdbg.evalItems.length;
zzdbg.evalItems[n] = { cb: cb };
w.opener.postMessage({ zzdbg_eval_req: true, zzdbg_cmd: cmd, zzdbg_id: n }, "*");
};
}

w.addEventListener("message", messageListener, true);
function messageListener(ev) {
var obj = ev.data;
var n = obj.zzdbg_id;
if(obj.zzdbg_eval_req) {
zzdbg.evalItems[n](obj.zzdbg_err, obj.zzdbg_res);
delete zzdbg.evalItems[n];
} else if(obj.zzdbg_apply_req) {}
}


zzdbg.doc = "Commands:"+
"\n\t.h - help"+
"\n\t.q - quit"+
"\n\t.c - clear output"+
"\n\t.o (expr) - open/view source"+
"\n\t.d (expr) - MDN doc"+
"\n\t.p (expr) - list properties"+
"\n\t.s - select element"+
"\n\t.a - apply changes from editor to main document"+
"";
input.focus();
})(window);