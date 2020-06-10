javascript:(function(){/*ZZDBG*/

var zzdbg = {};
var ui = document.createElement("div");
var history = [];
var hpos = 0;
var oldconsole = {};

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
'</style>'+
'<textarea id="zzoutput" readonly="true"></textarea>'+
'<div id="zzbar">'+
'<input id="zzinput" type="text">'+
'<input id="zzdnbtn" type="button" value="⬇">'+
'<input id="zzupbtn" type="button" value="⬆">'+
'</div>';

document.body.appendChild(ui);
var output = ui.querySelector("#zzoutput");
var input = ui.querySelector("#zzinput");
var upbtn = ui.querySelector("#zzupbtn");
var dnbtn = ui.querySelector("#zzdnbtn");
zzdbg.output = output;
zzdbg.input = input;
zzdbg.upbtn = upbtn;
zzdbg.dnbtn = dnbtn;


zzdbg.do = function(cmd) {
var geval = eval;
var res = null;
var err = null;
window._ = history.length ? history.slice(-1)[0].res : undefined;
if(output.value) output.value += "\n";
output.value += "> "+cmd;

try {
if(".q" == cmd) return zzdbg.close();
else if(".h" == cmd) res = "Commands: .q quit, .c clear, .d MDN doc, .s select element";
else if(/^\.d\b/.test(cmd)) res = docLookup(cmd.replace(/^\.d\s*/, ""));
else if(".s" == cmd) res = zzdbg.selectElement(null, zzdbg.log);
else res = geval(cmd);
}
catch(e) { err = e; }

zzdbg.log(err||res);
if(".c" == cmd) output.value = "";

output.scrollTop = output.scrollHeight;
history.push({ cmd:cmd, res:res, err:err });
};

input.onkeydown = function(event){
hpos = 0;
if("Enter" != event.key) return;
var cmd = input.value;
if("" == input.value) return;
input.value = "";
zzdbg.do(cmd);
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
input.selectionsStart = input.selectionEnd = input.value.length;
};


zzdbg.stringify = null;
zzdbg.stringifyDepth = 3;
function stringify(x, depth) {
if(zzdbg.stringify) {
x = zzdbg.stringify(x, depth);
if("string" == typeof x) return x;
}

if(depth >= zzdbg.stringifyDepth) return "...";
if(depth >= 1 && "function" == typeof x) return "[function ...]";

if("string" == typeof x) {
if(/[^\w!@#$%^&*().:?\/\[\]{}~=+_ -]/.test(x)) return '"""'+x+'"""';
return '"'+x+'"';
}

if(x instanceof NodeList || x instanceof NamedNodeMap) x = Array.prototype.slice.call(x);

if(Array.isArray(x)) {
if(depth >= zzdbg.stringifyDepth-1) return "[ ("+x.length+" item(s)) ]";
return "[ "+x.map(function(y) { return stringify(y, depth+1); }).join(", ")+" ]";
}

try { if(x instanceof CSSStyleDeclaration) return "{ "+Array.prototype.slice.call(x).filter(function(field){ return undefined !== x[field]; }).map(function(field){ return field+': "'+x[field]+'"'; }).join(";\n")+" }"; }
catch(e) {}

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

if(x instanceof Text) {
x = x.textContent.replace(/^\s+|\s+$/g, "");
if(x) x = '"""'+x+'"""';
else x = '" "';
}

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
var geval = eval;
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

if(/^encode|^Object$|^Array$|^Number$|^BigInt$|^Math$|^Date$|^String$|^RegExp$|Error$/.test(path[0])) url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/"+path.join("/");
else if(/^CSS|^DOM|^HTML|^Node|^NamedNode|^Attr$|^ChildNode$|^Document$|^URL$|^Window$|Event|Element$/.test(path[0])) url = "https://developer.mozilla.org/en-US/docs/Web/API/"+path.join("/");
else url = "https://developer.mozilla.org/en-US/search?q="+path.join(".");

} catch(e) {
url = "https://developer.mozilla.org/en-US/search?q="+encodeURIComponent(str);
}

window.open(url, "_blank");
return url;
}


zzdbg.selectElement = function(root, callback) {
if(!root) root = document.body;
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
try { output.value += Array.from(arguments, function(arg) { return stringify(arg, 0); }).join(" "); }
catch(e) { output.value += e+" (zzdbg.stringify)"; }
};
oldconsole.log = oldconsole.warn = oldconsole.info = oldconsole.error = zzdbg.log;
exchange(oldconsole, console);


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