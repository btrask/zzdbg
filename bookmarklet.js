javascript:(function zzdbg_load(src) { if(window.zzdbg && zzdbg.script) zzdbg.script.remove(); var s = document.createElement("script"); s.textContent = src; document.body.appendChild(s); zzdbg.loader = zzdbg_load; zzdbg.script = s; })("(function zzdbg_main(w){\r\n\r\nvar d = w.document;\r\nvar zzdbg = {};\r\nvar ui = d.createElement(\"div\");\r\nvar history = [];\r\nvar hpos = 0;\r\nvar oldconsole = {};\r\n\r\nzzdbg.loader = null;\r\nzzdbg.script = null;\r\n\r\nif(w.zzdbg) {\r\nhistory = w.zzdbg.history || history;\r\nzzdbg.loader = w.zzdbg.loader;\r\nzzdbg.script = w.zzdbg.script;\r\nw.zzdbg.script = null;\r\nw.zzdbg.close();\r\n}\r\nw.zzdbg = zzdbg;\r\nzzdbg.history = history;\r\n\r\nzzdbg.close = function() {\r\nexchange(oldconsole, console);\r\nif(zzdbg.script) zzdbg.script.remove();\r\nui.remove();\r\nw.removeEventListener(\"message\", messageListener, true);\r\ndelete w.zzdbg;\r\n};\r\nzzdbg.ui = ui;\r\n\r\nui.className = \"zzdbgui\";\r\nui.innerHTML = '<style>'+\r\n'.zzdbgui, .zzdbgui * { font-family:monospace; font-size:3vw !important; margin:0 !important; padding:0 !important; box-sizing:border-box !important; border-radius:0; background-color:white; color:black; }'+\r\n'.zzdbgui { position:fixed; left:0; bottom:0; width:100%; height:40%; z-index:100000000; }'+\r\n'.zzdbgui textarea, .zzdbgui input { border:0.3vw solid black !important; padding:0 1vw !important; }'+\r\n'.zzoutput { position:absolute; left:0; top:0; width:100%; height:calc(100% - 6vw); overflow-y:auto; white-space:pre-wrap; }'+\r\n'.zzbar { position:absolute; left:0; bottom:0; width:100%; height:6vw; }'+\r\n'.zzbar * { position:absolute; top:0; height:100%; }'+\r\n'.zzinput { left:0; width:calc(100% - 20vw) !important; }'+\r\n'.zzdnbtn, .zzupbtn { width:10vw; font-size:1em; text-align:center; }'+\r\n'.zzdnbtn { right:10vw; }'+\r\n'.zzupbtn { right:0; }'+\r\n'.zzsuggest { position:fixed; bottom:5vw; right:25vw; border:0.3vw solid black; overflow:hidden auto; text-overflow:ellipsis; }'+\r\n'.zzsuggest > * { padding:0.5vw 2vw !important; }'+\r\n'</style>'+\r\n'<textarea class=\"zzoutput\" readonly=\"true\"></textarea>'+\r\n'<div class=\"zzbar\">'+\r\n'<input class=\"zzinput\" type=\"text\">'+\r\n'<input class=\"zzdnbtn\" type=\"button\" value=\"⬇\">'+\r\n'<input class=\"zzupbtn\" type=\"button\" value=\"⬆\">'+\r\n'</div>'+\r\n'<div class=\"zzsuggest\" hidden><\\div>';\r\n\r\nd.body.appendChild(ui);\r\nvar output = ui.querySelector(\".zzoutput\");\r\nvar input = ui.querySelector(\".zzinput\");\r\nvar upbtn = ui.querySelector(\".zzupbtn\");\r\nvar dnbtn = ui.querySelector(\".zzdnbtn\");\r\nvar suggest = ui.querySelector(\".zzsuggest\");\r\nzzdbg.output = output;\r\nzzdbg.input = input;\r\nzzdbg.upbtn = upbtn;\r\nzzdbg.dnbtn = dnbtn;\r\nzzdbg.suggest = suggest;\r\n\r\n\r\nzzdbg.do = function(cmd) {\r\nvar err, res;\r\nvar quiet = false;\r\nwriteToOutput([\"> \"+cmd], true);\r\n\r\ntry {\r\nif(\".h\" == cmd) {\r\nzzdbg.info(zzdbg.doc);\r\nquiet = true;\r\n} else if(\".q\" == cmd) return zzdbg.close();\r\nelse if(/^\\.o\\b/.test(cmd)) res = zzdbg.open(zzdbg.evalLocal(\"(\"+cmd.replace(/^\\.o\\s*/, \"\")+\")\"));\r\nelse if(/^\\.d\\b/.test(cmd)) res = docLookup(cmd.replace(/^\\.d\\s*/, \"\"));\r\nelse if(/^\\.p\\b/.test(cmd)) res = zzdbg.properties(zzdbg.evalLocal(\"(\"+cmd.replace(/^\\.p\\s*/, \"\")+\")\"));\r\nelse if(\".s\" == cmd) res = selectElement();\r\nelse if(\".a\" == cmd) res = zzdbg.applyChanges();\r\nelse res = zzdbg.evalLocal(cmd.replace(/^javascript:/, \"\"));\r\n} catch(e) { err = e; }\r\n\r\nif(!quiet) writeToOutput([err||res], false);\r\nif(\".c\" == cmd) output.value = \"\";\r\nhistory.push({ cmd:cmd, res:res, err:err });\r\nw._ = res;\r\n};\r\n\r\ninput.onkeyup = function(event){\r\nvar cmd = input.value;\r\nhpos = 0;\r\n\r\nvar pos = input.selectionEnd;\r\nvar term = cmd.slice(0, pos).match(/([\\w$]+\\.)*[\\w$]*$/);\r\ntry {\r\nvar base = term[0].replace(/\\.?[\\w$]*$/, \"\") || \"window\";\r\nvar part = term[0].replace(/^([\\w$]+\\.)*/, \"\");\r\nvar compare = new Intl.Collator(\"en\").compare;\r\nvar props = term[0].length ? zzdbg.properties(zzdbg.evalLocal(\"(\"+base+\")\")) : [];\r\nprops = Array.prototype.concat.apply([], props).filter(function(prop){ return prop.startsWith(part) && prop != part; }).sort(compare);\r\n\r\nsuggest.innerHTML = \"\";\r\nfor(var i = 0; i < props.length; i++) {\r\nvar item = d.createElement(\"div\");\r\nitem.textContent = props[i];\r\nsuggest.appendChild(item);\r\nitem.onclick = function() {\r\ninput.value = input.value.slice(0, pos)+this.textContent.slice(part.length)+input.value.slice(pos);\r\nsuggest.hidden = true;\r\ninput.focus();\r\ninput.selectionStart = input.selectionEnd = pos+(this.textContent.length-part.length);\r\n};\r\n}\r\nsuggest.hidden = !props.length;\r\nsuggest.style.width = suggest.scrollWidth+\"px\";\r\nsuggest.style.height = Math.min(suggest.scrollHeight, w.innerHeight*.75)+\"px\";\r\n} catch(e) { suggest.hidden = true; }\r\n\r\nif(\"Enter\" != event.key) return;\r\nif(\"\" == cmd) return;\r\ninput.value = \"\";\r\nzzdbg.do(cmd);\r\nsuggest.hidden = true;\r\n};\r\n\r\n\r\ndnbtn.onclick = upbtn.onclick = function(event) {\r\ninput.focus();\r\nvar dir = 0;\r\nif(dnbtn == this) dir = -1;\r\nif(upbtn == this) dir = +1;\r\nif(0 == dir) return;\r\nhpos += dir;\r\nif(hpos > history.length) hpos = history.length;\r\nif(hpos < 0) hpos = 0;\r\ninput.value = hpos ? history.slice(-hpos)[0].cmd : \"\";\r\ninput.selectionStart = input.selectionEnd = input.value.length;\r\n};\r\n\r\n\r\nzzdbg.stringify = null;\r\nzzdbg.stringifyDepth = 3;\r\nzzdbg.stringifyFull = function(x, depth, inlineStrings) {\r\nif(undefined === depth || undefined === inlineStrings) throw new Error(\"stringify args\");\r\n\r\nif(zzdbg.stringify) {\r\nx = zzdbg.stringify(x, depth, inlineStrings);\r\nif(isString(x)) return x;\r\n}\r\n\r\nif(depth >= zzdbg.stringifyDepth) return \"…\";\r\nif(depth >= 1 && \"function\" == typeof x) return \"[function …]\";\r\n\r\nif(x instanceof Text) {\r\nx = x.textContent.replace(/^\\s+|\\s+$/g, \"\");\r\nif(!x) return '\" \"';\r\n}\r\n\r\nif(isString(x)) {\r\nreturn inlineStrings && 0 == depth ? x : JSON.stringify(x);\r\n}\r\n\r\nif(x instanceof NodeList || x instanceof NamedNodeMap || x instanceof StyleSheetList || x instanceof HTMLCollection) x = toArray(x);\r\n\r\nif(Array.isArray(x)) {\r\nif(depth >= zzdbg.stringifyDepth-1) return \"[ (\"+x.length+\" item(s)) ]\";\r\nreturn \"[ \"+x.map(function(y) { return zzdbg.stringifyFull(y, depth+1, inlineStrings); }).join(\", \")+\" ]\";\r\n}\r\n\r\nif(x instanceof Window) return \"[Window \"+zzdbg.stringifyFull(x.initialLocation||x.location.href, depth+1, inlineStrings)+\"]\";\r\n\r\ntry {\r\nif(x instanceof CSSStyleSheet) return zzdbg.stringifyFull(x.cssRules, depth, inlineStrings);\r\nif(x instanceof CSSRuleList) {\r\nif(depth >= 1) return \"[\"+x.length+\" CSS rule(s)]\";\r\nreturn toArray(x).map(function(rule) { return zzdbg.stringifyFull(rule, depth+1, inlineStrings); }).join(\"\\n\");\r\n}\r\nif(x instanceof CSSRule) return x.cssText;\r\nif(x instanceof CSSStyleDeclaration) return \"{ \"+(x.cssText||toArray(x).filter(function(attr) { return x[attr]; }).map(function(attr) { return attr+\": \"+x[attr]; }).join(\"; \"))+\" }\";\r\n} catch(e) { if(!(e instanceof SecurityError)) throw e; }\r\n\r\nfunction url_summary(url) {\r\nreturn url.replace(/^.*\\//, \"…\");\r\n}\r\nif(x instanceof HTMLElement) {\r\nvar attrs = [x.tagName.toLowerCase()];\r\nif(x.id) attrs.push('id=\"'+x.id+'\"');\r\nelse if(x.href) attrs.push('href=\"'+url_summary(x.href)+'\"');\r\nelse if(x.src) attrs.push('src=\"'+url_summary(x.src)+'\"');\r\nelse if(x.className) attrs.push('class=\"'+x.className+'\"');\r\nreturn \"<\"+attrs.join(\" \")+\">\";\r\n}\r\n\r\nif(x instanceof Attr) return x.name+'=\"'+x.value+'\"';\r\n\r\nvar str = null;\r\nif(null === x || undefined === x) str = String(x);\r\ntry { if(null === str && x.__proto__ && \"function\" == typeof x.__proto__.toString) str = String(x.__proto__.toString.call(x));\r\n} catch(e){}\r\nif(null === str) str = Object.prototype.toString.call(x);\r\n\r\nif(!isString(x) && \"[object Object]\" == str) return \"{ \"+Object.keys(x).map(function(key) { return key+\": \"+zzdbg.stringifyFull(x[key], depth+1, inlineStrings); }).join(\", \")+\" }\";\r\n\r\nreturn str;\r\n};\r\n\r\n\r\nfunction findprop(obj, prop, depth) {\r\nif(!depth) return null;\r\nif(!obj) return null;\r\nvar descriptors = Object.getOwnPropertyDescriptors(obj);\r\n\r\nfor(var name in descriptors) {\r\nif(obj === w && descriptors[name].enumerable) continue;\r\nvar val = descriptors[name].value;\r\nif(\"function\" != typeof val) continue;\r\nif(prop.constructor === val && Function != val) return [name];\r\nif(val === prop) return [name];\r\nvar x = findprop(val.prototype, prop, depth-1) || findprop(val, prop, depth-1);\r\nif(x) return [name].concat(x);\r\n}\r\nreturn null;\r\n}\r\nfunction docLookup(str) {\r\nvar url = null;\r\ntry {\r\nvar path = null;\r\nif(\"\" === str) return zzdbg.info(\"Usage: .d (expression or search terms)\");\r\nif(\"null\" == str || \"undefined\" == str) path = [str];\r\nelse {\r\nvar x = zzdbg.evalLocal(\"(\"+str+\")\");\r\nif(null === x || undefined === x) throw new Error();\r\npath = findprop(w, x, 2);\r\n}\r\nif(!path || !path[0]) throw new Error();\r\n\r\nif(\"CSS2Properties\" == path[0]) path[0] = \"CSSStyleDeclaration\";\r\n\r\nif(/^encode|^Object$|^Array$|^Boolean$|^Number$|^BigInt$|^Math$|^Date$|^String$|^RegExp$|Error$/.test(path[0])) url = \"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/\"+path.join(\"/\");\r\nelse if(/^CSS|^DOM|^HTML|^Node|^NamedNode|^RTC|^XML|^Attr$|^ChildNode$|^Document$|^IDBFactory$|^URL$|^Window$|Event|Style|Element$|List$/.test(path[0])) url = \"https://developer.mozilla.org/en-US/docs/Web/API/\"+path.join(\"/\");\r\nelse url = \"https://developer.mozilla.org/en-US/search?q=\"+path.join(\".\");\r\n\r\n} catch(e) {\r\nurl = \"https://developer.mozilla.org/en-US/search?q=\"+encodeURIComponent(str);\r\n}\r\n\r\nreturn zzdbg.openWindow(url);\r\n}\r\n\r\nzzdbg.properties = function(obj) {\r\nvar descriptors = Object.getOwnPropertyDescriptors(obj);\r\nvar results = [ Object.keys(descriptors) ];\r\nvar proto = null;\r\ntry { proto = obj.__proto__; }\r\ncatch(e) {}\r\nif(proto) results =  results.concat(zzdbg.properties(proto));\r\nreturn results;\r\n};\r\n\r\n\r\nzzdbg.selectElement = function(root, callback) {\r\nroot = root || d;\r\nroot.addEventListener(\"click\", listener, true);\r\nfunction listener(event) {\r\nevent.preventDefault();\r\nevent.stopPropagation();\r\nroot.removeEventListener(\"click\", listener, true);\r\nif(callback) callback(event.target);\r\n}\r\n};\r\nzzdbg.lastSelectedElement = null;\r\nfunction selectElement() {\r\nzzdbg.selectElement(null, function(elem) {\r\nzzdbg.selectElementAction(elem);\r\nvar h = zzdbg.history.slice(-1)[0];\r\nif(h && \".s\" == h.cmd) { h.res = elem; w._ = elem; }\r\nzzdbg.lastSelectedElement = elem;\r\n});\r\nzzdbg.info(\"(Waiting for click…)\");\r\n}\r\n\r\n\r\nzzdbg.log = zzdbg.warn = zzdbg.info = zzdbg.error = function zzdbg_log(args) {\r\nreturn writeToOutput(toArray(arguments), true);\r\n};\r\noldconsole.log = oldconsole.warn = oldconsole.info = oldconsole.error = zzdbg.log;\r\nexchange(oldconsole, console);\r\nfunction writeToOutput(array, inlineStrings) {\r\nif(output.value) output.value +=\"\\n\";\r\ntry { output.value += array.map(function(arg) { return zzdbg.stringifyFull(arg, 0, inlineStrings); }).join(\", \"); }\r\ncatch(e) { output.value += e+\" (zzdbg stringify)\"; }\r\noutput.scrollTop = output.scrollHeight;\r\n}\r\n\r\n\r\nzzdbg.inspect = zzdbg.selectElementAction = function(elem) {\r\nzzdbg.log(elem, zzdbg.cssRules(elem));\r\n};\r\nzzdbg.cssRules = function(elem) {\r\nvar results = [];\r\nvar sheets = d.styleSheets;\r\nfor(var i = 0; i < sheets.length; i++) {\r\nvar rules = sheets[i].cssRules;\r\nfor(var j = 0; j < rules.length; j++) {\r\nvar matches = false;\r\ntry { matches = elem.matches(rules[j].selectorText); } catch(e) { if(!(e instanceof SyntaxError)) throw e; }\r\nif(matches) results.push(rules[j]);\r\n}\r\n}\r\nreturn results;\r\n};\r\n\r\n\r\nzzdbg.open = function(obj) {\r\nvar win = zzdbg.viewAsSource(obj);\r\nif(win) return win;\r\nvar url = null;\r\nif(obj.href) url = obj.href;\r\nelse if(obj.src) url = obj.src;\r\nreturn zzdbg.openWindow(url);\r\n};\r\nzzdbg.viewAsSource = function(obj, name) {\r\nvar url = null;\r\nvar str = null;\r\n\r\nif(obj instanceof HTMLScriptElement) {\r\nif(obj.src) url = obj.src;\r\nelse str = obj.textContent;\r\n} else if(obj instanceof HTMLStyleElement) {\r\nstr = obj.textContent;\r\n} else if(obj instanceof CSSStyleSheet) {\r\nif(obj.href) url = obj.href;\r\nelse str = obj.ownerNode.textContent;\r\n} else if(obj instanceof HTMLLinkElement) {\r\nurl = obj.href;\r\n}\r\n\r\nif(url) {\r\nzzdbg.info(\"(Run zzdbg in window to edit)\");\r\nreturn zzdbg.openWindow(url, \"editor\");\r\n}\r\n\r\nif(isString(obj)) str = obj;\r\nelse name = name || zzdbg.stringifyFull(obj, 0, true);\r\nname = name || \"untitled\";\r\n\r\nif(!str) return null;\r\n\r\nvar title = \"zzdbg source view for \"+name+\" (\"+d.title+\")\";\r\nvar win = zzdbg.openWindow('javascript:'+JSON.stringify(title)+'; \"Loading…\"', \"editor\");\r\nwin.onload = function() {\r\nwin.document.body.innerHTML = \"<pre></pre>\";\r\nwin.document.querySelector(\"pre\").textContent = str.replace(/^\\s+|\\s+$/g, \"\");\r\nzzdbg_main(win);\r\n};\r\nreturn win;\r\n};\r\nzzdbg.applyChanges = function() {\r\nif(!zzdbg.editMode) throw new Error(\"Not in edit mode\");\r\nw.opener.postMessage({ zzdbg_apply: true, zzdbg_src: d.querySelector(\"pre\").textContent });\r\n};\r\nvar windowNumber = 0;\r\nzzdbg.openWindow = function(url, type) {\r\nvar win = w.open(url, \"zzdbg-\"+(type||\"window\")+\"-\"+(windowNumber++));\r\nwin.initialLocation = url;\r\nreturn win;\r\n};\r\n\r\n\r\nzzdbg.wgetcmd = function(dls) {\r\nif(!Array.isArray(dls)) dls = toArray(arguments);\r\nreturn dls.map(function(dl){ return \"wget --adjust-extension \" + (isString(dl) ? safe_shell_arg(dl) : safe_shell_arg(dl.url)+\" -O '\"+safe_filename(dl.filename)+\"'\"); }).join(\"; \");\r\n};\r\nfunction safe_shell_arg(shell_arg) {\r\nreturn \"'\"+shell_arg.replace(/\\'/g, \"\\\\'\")+\"'\";\r\n}\r\nfunction safe_filename(filename) {\r\nreturn filename.replace(/[^a-zA-Z0-9._ \\[\\]\\{\\}-]/g, \"_\");\r\n}\r\n\r\n\r\nzzdbg.dl = function(dls) {\r\nif(!Array.isArray(dls)) dls = toArray(arguments);\r\nvar a = d.createElement(\"a\");\r\nui.appendChild(a);\r\n/*a.target = \"_blank\";*/\r\nfor(var i = 0; i < dls.length; i++) {\r\na.download = (isString(dls[i]) ? \"\" : dls[i].filename);\r\na.href = (isString(dls[i]) ? dls[i] : dls[i].url);\r\na.click();\r\n}\r\na.remove();\r\n};\r\n\r\n\r\nzzdbg.bookmarklet = function() {\r\nvar src = 'javascript:('+zzdbg.loader.toString()+')('+JSON.stringify(zzdbg.script.textContent)+');/*END*/';\r\nreturn zzdbg.viewAsSource(src, \"zzdbg bookmarklet\");\r\n};\r\nzzdbg.edit = function() {\r\nreturn zzdbg.viewAsSource(zzdbg.script);\r\n};\r\n\r\n\r\nfunction has(a, b) {\r\nreturn Object.prototype.hasOwnProperty.call(a, b);\r\n}\r\nfunction exchange(a, b) {\r\nfor(var prop in a) if(has(a, prop)) {\r\nvar swap = a[prop];\r\na[prop] = b[prop];\r\nb[prop] = swap;\r\n}\r\n}\r\nfunction toArray(x) {\r\nreturn Array.prototype.slice.call(x);\r\n}\r\nfunction isString(x) {\r\nreturn \"string\" == typeof x || x instanceof String;\r\n}\r\nfunction escapeHTML(str) {\r\nvar x = d.createElement(\"div\");\r\nx.textContent = str;\r\nreturn x.innerHTML;\r\n}\r\n\r\nzzdbg.log(\"zzdbg - type .h for help\");\r\n\r\nfunction eval2(str) {\r\nvar n = zzdbg.evalItems.length;\r\nvar x = zzdbg.evalItems[n] = { err: new SyntaxError(\"eval2\") };\r\nvar s = d.createElement(\"script\");\r\nstr = str.replace(/(;|\\s|\\/\\/[^\"']*|\\/\\*[^\"']*)*$/, \"\");\r\nvar expr = /^\\s*\\{/.test(str) ? '{{{{{ '+str+' }}}}}' : 'zzdbg.evalItems['+n+'].res = ((((( '+str+' )))))';\r\ns.textContent =\r\n'try { '+expr+'; delete zzdbg.evalItems['+n+'].err; }'+\r\n'catch(e) { zzdbg.evalItems['+n+'].err = e; }';\r\nui.appendChild(s); s.remove();\r\ndelete zzdbg.evalItems[n];\r\nif(has(x, \"err\")) throw x.err;\r\nreturn x.res;\r\n}\r\nzzdbg.evalItems = [];\r\nzzdbg.evalLocal = eval;\r\ntry { zzdbg.evalLocal('\"test\"'); }\r\ncatch(e) {\r\nzzdbg.evalLocal = eval2;\r\nzzdbg.log(e); zzdbg.log(\"Warning: zzdbg is running without eval(). Please wrap statements in braces: { var x; }. Expressions can be run as normal: func().\");\r\n}\r\nzzdbg.eval = function(cmd, cb) {\r\nvar err = null, res = null;\r\ntry { res = zzdbg.evalLocal(cmd); }\r\ncatch(e) { err = e; }\r\nsetTimeout(function() { cb(err, res); }, 0);\r\n};\r\n\r\n\r\nzzdbg.editMode = false;\r\nif(/^zzdbg-editor/.test(w.name)) {\r\nzzdbg.editMode = true;\r\nd.title = \"zzdbg source view for \"+d.title;\r\nvar code = d.querySelector(\"pre\");\r\ncode.style = \"white-space:pre-wrap; font:20pt monospace;\";\r\ncode.contentEditable = true;\r\nzzdbg.log(\"Note: zzdbg is running as an editor. Javascript commands will be executed in the host window. Use .a to apply your changes to the main document. Use .q to hide this console.\");\r\nzzdbg.eval = function(src, cb) {\r\nvar n = zzdbg.evalItems.length;\r\nzzdbg.evalItems[n] = { cb: cb };\r\nw.opener.postMessage({ zzdbg_eval_req: true, zzdbg_cmd: cmd, zzdbg_id: n }, \"*\");\r\n};\r\n}\r\n\r\nw.addEventListener(\"message\", messageListener, true);\r\nfunction messageListener(ev) {\r\nvar obj = ev.data;\r\nvar n = obj.zzdbg_id;\r\nif(obj.zzdbg_eval_req) {\r\nzzdbg.evalItems[n](obj.zzdbg_err, obj.zzdbg_res);\r\ndelete zzdbg.evalItems[n];\r\n} else if(obj.zzdbg_apply_req) {}\r\n}\r\n\r\n\r\nzzdbg.doc = \"Commands:\"+\r\n\"\\n\\t.h - help\"+\r\n\"\\n\\t.q - quit\"+\r\n\"\\n\\t.c - clear output\"+\r\n\"\\n\\t.o (expr) - open/view source\"+\r\n\"\\n\\t.d (expr) - MDN doc\"+\r\n\"\\n\\t.p (expr) - list properties\"+\r\n\"\\n\\t.s - select element\"+\r\n\"\\n\\t.a - apply changes from editor to main document\"+\r\n\"\";\r\ninput.focus();\r\n})(window);");/*END*/