# zzdbg: a web debugger in a bookmarklet in a quine

zzdbg is a simple but relatively powerful web and Javascript debugger that loads into a web page as a bookmarklet. It's specifically designed for mobile browsers that don't have their own built-in debuggers and which make it too difficult to run your own code.

### Usage examples

Use `.e` to get an element by clicking somewhere on the page. It prints a summary of the element plus all the CSS rules that apply to it:

> `> .e`  
> `(Waiting for click…)`  
> `<img src="https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png"> [ {  }, img { vertical-align: middle; }, hr, img { border: 0px none; }, .central-featured-logo { position: absolute; top: 158px; left: 35px; } ]`  

Use `.o` to "open" an arbitrary object. `_` is the last result, in this case, an `<img>`:

> `> .o _`  
> `[Window "https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png"]`  

Run arbitrary Javascript:

> `> 2+2`  
> `4`  
> `> document.title`  
> `"Wikipedia"`

DOM elements are printed nicely:

> `> document.querySelector(".sprite")`  
> `<span class="central-textlogo__image sprite svg-Wikipedia_wordmark">`

View source of first script in page:

> `> .o document.scripts[0]`  
> `[Window "javascript:\"zzdbg source view for inline-script.js (Wikipedia)\"; \"...\""]`

View source of first style sheet in page:

> `> .o document.styleSheets[0]`  
> `[Window "javascript:\"zzdbg source view for inline-style.css (Wikipedia)\"; \"...\""]`

Look up MDN documentation for arbitrary objects:

> `> .d document.body`  
> `[Window "https://developer.mozilla.org/en-US/docs/Web/API/HTMLBodyElement"]`

### Special commands
- `.h`: help
- `.q`: quit (or hide in editor mode)
- `.c`: clear output
- `.o (expr)`: open/view source of URL, anchor, image, script or style object
- `.d (expr)`: look up the value of the expression or an arbitrary string in the MDN docs
- `.p (expr)`: list properties
- `.e`: click an element to get a reference to it (use `_` or `zzdbg.lastSelectedElement` after clicking)
- `.a`: apply changes to the main document (editor mode)
- `.s [filename]`: save file (editor mode)

zzdbg also defines the `zzdbg` object that exposes most of its functionality programmatically.

### What's so special about being a quine?
Quines are nothing special, but as a quine and an editor, zzdbg is fully "self-hosting". You can run it from a bookmarklet, edit it, and save it back into the bookmarklet without directly touching the file system.

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

Unfortunately, it seems nearly impossible to support breakpoints from within a page, simply because it can't reliably get all JS code across origins. Any code that could possibly call the function where the breakpoint is set also needs to be instrumented or interpreted.

### Known issues
Some pages have strict Content-Security-Policy settings that block bookmarklets entirely (which I consider a browser bug). Aside from that, zzdbg does a pretty good job working within browsers' security rules. On pages where `eval` is blocked, there is an "eval2" substitute, but it is more limited. If you want to edit a cross-origin script, just run zzdbg again in the new window and it will link up with the main document.

It's only been tested in Firefox Mobile.

### Development notes
The coding style is "idiosyncratic" because I'm writing it entirely on my phone. Some compromises are made to keep the code short enough to fit in a bookmarklet as well.

### Similar projects
- https://github.com/liriliri/eruda
- https://github.com/Tencent/vConsole
- https://www.hnldesign.nl/work/code/mobileconsole-javascript-console-for-mobile-devices/
- See also https://stackoverflow.com/questions/37256331/is-it-possible-to-open-developer-tools-console-in-chrome-on-android-phone


License: MIT
