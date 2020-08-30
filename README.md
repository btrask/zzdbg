# zzdbg: a web debugger in a bookmarklet in a quine

zzdbg is a simple but relatively powerful web and Javascript debugger that loads into a web page as a bookmarklet. It's specifically designed for mobile browsers that don't have their own built-in debuggers and which make it too difficult to run your own code.

Unlike other projects that attempt to replicate the Chrome developer tools, zzdbg is more like a CLI. It might be more convenient for people who know what they're doing.

### Usage examples

Use `.e` to get an element by clicking somewhere on the page. It prints a summary of the element plus all the CSS rules that apply to it:

> `> .e`  
> `(Waiting for click…)`  
> `<img class="central-featured-logo" src="portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png" srcset="portal/wikipedia.org/assets/img/Wikipedia-logo-v2@1.5x.png 1.5x, portal/wikipedia.org/assets/img/Wikipedia-logo-v2@2x.png 2x" alt="Wikipedia" width="200" height="183"> [ 0: img { vertical-align: middle; }, 1: hr, img { border: 0px none; }, 2: .central-featured-logo { position: absolute; top: 158px; left: 35px; }, 3: .zzdbg, * { pointer-events: auto !important; } ]`  

Use `.o` to "open" an arbitrary object. `_` is the last result, in this case, an `<img>`:

> `> .o _`  
> `[Window "https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png"]`  

Run arbitrary Javascript:

> `> 2+2`  
> `4`  
> `> document.title`  
> `"Wikipedia"`

DOM elements are printed in full detail:

> `> document.querySelector(".sprite")`  
> `<span class="central-textlogo__image sprite svg-Wikipedia_wordmark"> [ 0: .sprite { background-image: linear-gradient(transparent, transparent), url("portal/wikipedia.org/assets/img/sprite-46c49284.svg"); background-repeat: no-repeat; display: inline-block; vertical-align: middle; }, 1: .svg-Wikipedia_wordmark { background-position: 0px -254px; width: 176px; height: 32px; }, 2: .central-textlogo__image { color: transparent; display: inline-block; overflow: hidden; text-indent: -10000px; }, 3: .zzdbg, * { pointer-events: auto !important; } ]`  

View source of first script in page:

> `> .o document.scripts[0]`  
> `[Window "javascript:\"zzdbg source view for inline-script.js (Wikipedia)\"; \"...\""]`

View source of first style sheet in page:

> `> .o document.styleSheets[0]`  
> `[Window "javascript:\"zzdbg source view for inline-style.css (Wikipedia)\"; \"...\""]`

Look up MDN documentation for arbitrary objects and functions:

> `> .d document.addEventListener`  
> `[Window "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener"]`  

### Special commands
- `.h`: help
- `.q`: quit (or hide in editor mode)
- `.c`: clear output
- `.o (expr)`: open/view source of URL, anchor, image, script or style object
- `.d (expr)`: look up the value of the expression or an arbitrary string in the MDN docs
- `.e`: click an element to get a reference to it (use `_` or `zzdbg.lastSelectedElement` after clicking)
- `.a`: apply changes to the main document (editor mode)
- `.s [filename]`: save file, with optional filename (editor mode)

zzdbg also defines the `zzdbg` object that exposes most of its functionality programmatically.

### Other features

`zzdbg.getURL(obj)` and `zzdbg.getURLs(array)` expose the same logic used by `.o` to get the URL of an arbitrary object, such as `<a>` or `<img>`.

`zzdbg.wgetcmd(dls)` and `zzdbg.dl(dls)` are handy for scraping.

`zzdbg.traceEvent(elem, ["click", MouseEvent])`: It isn't possible to get a list of registered event listeners, unfortunately, but this method will dispatch a fake event with a special getter that logs the stack when it's called.

### What's so special about being a quine?
Quines are nothing special, but as a quine and an editor, zzdbg is fully "self-hosting". You can run it from a bookmarklet, edit it, and save it back into the bookmarklet without directly(!) touching the file system.

It also uses its quine form to load itself into new windows, as: `newWin.location = zzdbg.bookmarklet()`.

Here is the full self-editing workflow:
1. Run zzdbg from its bookmarklet
2. Run the command `.o zzdbg.script` to open an editor with the main zzdbg source code, or `.o zzdbg.loader` to edit the loader
3. Make some changes
4. Run `.a` in the editor console to apply your changes
5. Back in the main window, run `.o zzdbg.bookmarklet()` to open a (read-only) editor with the full bookmarklet code
6. Copy and paste the bookmarklet code back into your browser bookmarks to save your changes

### Is it really a debugger if it doesn't support breakpoints?
Well, it supports console.log()...

Real breakpoints are very tricky to support purely from inside the page. No other project does it to my knowledge. That said I'm still interested in finding a way that's feasible.

### Known issues
Some pages have strict Content-Security-Policy settings that block bookmarklets entirely (which I consider a browser bug). Aside from that, zzdbg does a pretty good job working within browsers' security rules. On pages where `eval` is blocked, there is an "eval2" substitute, but it is more limited. If you want to edit a cross-origin script, just run zzdbg again in the new window and it will link up with the main document.

The text editor in edit mode is just a plain `<textarea>`.

zzdbg is mainly developed in and for Mobile Firefox v68. It should also work in Mobile Chrome/Safari.

Some browsers like Safari impose a short maximum bookmarklet length, which zzdbg is too big for. Ironically, the only way to run zzdbg in these browsers is through the developer console.

### Development notes
The coding style is "idiosyncratic" because I'm writing it entirely on my phone. Some compromises are made to keep the code short enough to fit in a bookmarklet as well.

### Similar projects
- https://github.com/liriliri/eruda
- https://github.com/Tencent/vConsole
- https://www.hnldesign.nl/work/code/mobileconsole-javascript-console-for-mobile-devices/
- See also https://stackoverflow.com/questions/37256331/is-it-possible-to-open-developer-tools-console-in-chrome-on-android-phone


License: MIT
