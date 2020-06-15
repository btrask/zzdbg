javascript:(function(){/*ZZDBG*/

var zzdbg = {};
var ui = document.createElement("div");
var history = [];
var hpos = 0;
var oldconsole = {};
var geval = eval;

if(window.zzdbg) {
history = window.zzdbg.history || history;
window.zzdbg.close();
}
window.zzdbg = zzdbg;
zzdbg.history = history;

zzdbg.close = function() {
exchange(oldconsole, console);
ui.remove();
delete window.zzdbg;
};
zzdbg.ui = ui;

ui.id = "zzdbgui";
ui.innerHTML = '<style>'+
'#zzdbgui { position: fixed; left:0; right:0; bottom:0; height:40%; z-index:100000000; }'+
'#zzdbgui * { font-size:3vw; }'+
'#zzdbgui textarea, #zzdbgui input { position:absolute; background-color:white; color:black; border:0.3vw solid black !important; box-sizing:border-box; font-family:monospace; padding:0 1vw; border-radius:0; }'+
'#zzoutput { left:0; top:0; width:100%; height:calc(100% - 6vw); overflow-y:auto; white-space:pre-wrap; }'+
'#zzbar { position:absolute; left:0; bottom:0; width:100%; height:6vw; }'+
'#zzbar * { top:0; height:100%; }'+
'#zzinput { position:absolute; left:0; width:calc(100% - 20vw); }'+
'#zzdnbtn, #zzupbtn { width:10vw; font-size:1em; text-align:center; }'+
'#zzdnbtn { right:10vw; }'+
'#zzupbtn { right:0; }'+
'#zzsuggest { position:fixed; background:white; border:0.3vw solid black; bottom:5vw; right:25vw; overflow:hidden auto; text-overflow:ellipsis; }'+
'#zzsuggest > * { padding:0.5vw 2vw; }'+
'</style>'+
'<textarea id="zzoutput" readonly="true"></textarea>'+
'<div id="zzbar">'+
'<input id="zzinput" type="text">'+
'<input id="zzdnbtn" type="button" value="⬇">'+
'<input id="zzupbtn" type="button" value="⬆">'+
'</div>'+
'<div id="zzsuggest" hidden><\div>';

document.body.appendChild(ui);
var output = ui.querySelector("#zzoutput");
var input = ui.querySelector("#zzinput");
var upbtn = ui.querySelector("#zzupbtn");
var dnbtn = ui.querySelector("#zzdnbtn");
var suggest = ui.querySelector("#zzsuggest");
zzdbg.output = output;
zzdbg.input = input;
zzdbg.upbtn = upbtn;
zzdbg.dnbtn = dnbtn;
zzdbg.suggest = suggest;


zzdbg.do = function(cmd) {
var res = null;
var err = null;
window._ = history.length ? history.slice(-1)[0].res : undefined;
if(output.value) output.value += "\n";
output.value += "> "+cmd;

try {
if(".q" == cmd) return zzdbg.close();
else if(".h" == cmd) res = "Commands: .q quit, .c clear, .d MDN doc, .p list properties, .s select element";
else if(/^\.d\b/.test(cmd)) res = docLookup(cmd.replace(/^\.d\s*/, ""));
else if(/^\.p\b/.test(cmd)) res = zzdbg.properties(geval("("+cmd.replace(/^\.p\s*/, "")+")"));
else if(".s" == cmd) res = zzdbg.selectElement(null, zzdbg.selectElementAction);
else res = geval(cmd);
} catch(e) { err = e; }

zzdbg.log(err||res);
if(".c" == cmd) output.value = "";
history.push({ cmd:cmd, res:res, err:err });
};

input.onkeyup = function(event){
var cmd = input.value;
hpos = 0;

var pos = input.selectionEnd;
var term = cmd.slice(0, pos).match(/(\w+\.)*\w*$/);
try {
var base = term[0].replace(/\.?\w*$/, "") || "window";
var part = term[0].replace(/^(\w+\.)*/, "");
var compare = new Intl.Collator("en").compare;
var props = term[0].length ? zzdbg.properties(geval("("+base+")")) : [];
props = Array.prototype.concat.apply([], props).filter(function(prop){ return prop.startsWith(part) && prop != part; }).sort(compare);

suggest.innerHTML = "";
for(var i = 0; i < props.length; i++) {
var item = document.createElement("div");
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
suggest.style.height = Math.min(suggest.scrollHeight, window.innerHeight*.75)+"px";
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
function stringify(x, depth) {
if(undefined === depth) throw new Error("stringify depth");

if(zzdbg.stringify) {
x = zzdbg.stringify(x, depth);
if("string" == typeof x) return x;
}

if(depth >= zzdbg.stringifyDepth) return "...";
if(depth >= 1 && "function" == typeof x) return "[function ...]";

if(x instanceof Text) {
x = x.textContent.replace(/^\s+|\s+$/g, "");
if(!x) return '" "';
}

if("string" == typeof x) {
if(/[^\w!@#$%^&*().:?\/\[\]{}~=+_ -]/.test(x)) return '"""'+x+'"""';
return '"'+x+'"';
}

if(x instanceof NodeList || x instanceof NamedNodeMap || x instanceof StyleSheetList || x instanceof HTMLCollection) x = Array.from(x);

if(Array.isArray(x)) {
if(depth >= zzdbg.stringifyDepth-1) return "[ ("+x.length+" item(s)) ]";
return "[ "+x.map(function(y) { return stringify(y, depth+1); }).join(", ")+" ]";
}

try {
if(x instanceof CSSStyleSheet) return stringify(x.cssRules, depth);
if(x instanceof CSSRuleList) {
if(depth >= 1) return "["+x.length+" CSS rule(s)]";
return Array.from(x, function(rule) { return stringify(rule, depth+1); }).join("\n");
}
if(x instanceof CSSRule) return x.cssText;
if(x instanceof CSSStyleDeclaration) return "{ "+x.cssText+" }";
} catch(e) { if(!(e instanceof SecurityError)) throw e; }

function url_summary(url) {
return url.replace(/^.*\//, "...");
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

if(("string" != typeof x) && "[object Object]" == str) return "{ "+Object.keys(x).map(function(key) { return key+": "+stringify(x[key], depth+1); }).join(", ")+" }";

return str;
}


function findprop(obj, prop, depth) {
if(!depth) return null;
if(!obj) return null;
var descriptors = Object.getOwnPropertyDescriptors(obj);

for(var name in descriptors) {
if(obj === window && descriptors[name].enumerable) continue;
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
if("" === str) return "Usage: .d expr";
if("null" == str || "undefined" == str) path = [str];
else {
var x = geval("("+str+")");
if(null === x || undefined === x) throw new Error();
path = findprop(window, x, 2);
}
if(!path || !path[0]) throw new Error();

if("CSS2Properties" == path[0]) path[0] = "CSSStyleDeclaration";

if(/^encode|^Object$|^Array$|^Boolean$|^Number$|^BigInt$|^Math$|^Date$|^String$|^RegExp$|Error$/.test(path[0])) url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/"+path.join("/");
else if(/^CSS|^DOM|^HTML|^Node|^NamedNode|^Attr$|^ChildNode$|^Document$|^URL$|^Window$|Event|Style|Element$|List$/.test(path[0])) url = "https://developer.mozilla.org/en-US/docs/Web/API/"+path.join("/");
else url = "https://developer.mozilla.org/en-US/search?q="+path.join(".");

} catch(e) {
url = "https://developer.mozilla.org/en-US/search?q="+encodeURIComponent(str);
}

window.open(url, "_blank");
return url;
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
if(!root) root = document;
var result = { elem: null, callback: callback };
root.addEventListener("click", listener, true);
return result;
function listener(event) {
event.preventDefault();
event.stopPropagation();
root.removeEventListener("click", listener, true);
result.elem = event.target;
if(result.callback) result.callback(result.elem);
}
};

zzdbg.log = zzdbg.warn = zzdbg.info = zzdbg.error = function zzdbg_log(args) {
if(output.value) output.value +="\n";
try { output.value += Array.from(arguments, function(arg) { return stringify(arg, 0); }).join(", "); }
catch(e) { output.value += e+" (zzdbg.stringify)"; }
output.scrollTop = output.scrollHeight;
};
oldconsole.log = oldconsole.warn = oldconsole.info = oldconsole.error = zzdbg.log;
exchange(oldconsole, console);


zzdbg.inspect = zzdbg.selectElementAction = function(elem) {
zzdbg.log(elem, zzdbg.cssRules(elem));
};
zzdbg.cssRules = function(elem) {
var results = [];
var sheets = document.styleSheets;
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


zzdbg.wgetcmd = function(dls) {
if(!Array.isArray(dls)) dls = Array.from(arguments);
return dls.map(function(dl){ return "wget --adjust-extension " + ("string" == typeof dl ? safe_shell_arg(dl) : safe_shell_arg(dl.url)+" -O '"+safe_filename(dl.filename)+"'"); }).join("; ");
};
function safe_shell_arg(shell_arg) {
return "'"+shell_arg.replace(/\'/g, "\\'")+"'";
}
function safe_filename(filename) {
return filename.replace(/[^a-zA-Z0-9._ \[\]\{\}-]/g, "_");
}


zzdbg.dl = function(dls) {
if(!Array.isArray(dls)) dls = Array.from(arguments);
var a = document.createElement("a");
ui.appendChild(a);
/*a.target = "_blank";*/
for(var i = 0; i < dls.length; i++) {
a.download = ("string" == typeof dls[i] ? "" : dls[i].filename);
a.href = ("string" == typeof dls[i] ? dls[i] : dls[i].url);
a.click();
}
a.remove();
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


input.focus();
})()/*END*/