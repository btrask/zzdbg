# zzdbg: a web debugger in a bookmarklet in a quine

zzdbg is a simple but relatively powerful web and Javascript debugger that loads into a web page as a bookmarklet. It's specifically designed for mobile browsers that don't have their own built-in debuggers and which make it too difficult to run your own code.

### Usage examples
```javascript
// Run arbitrary Javascript
> 2+2
4
> window
[object Window]

// Get the previous result
> _
[object Window]

// DOM elements are printed nicely
> document.querySelector("#main")
<div id="main">

// View source of first script in page
> .o document.scripts[0]

// View source of first style sheet in page
> .o document.styleSheets[0]

// Look up MDN documentation for HTMLBodyElement
> .d document.body
```

### Special commands
- `.h`: help
- `.q`: quit
- `.c`: clear output
- `.o (expr)`: open/view source of URL, anchor, image, script or style object
- `.d (expr)`: look up the value of the expression or an arbitrary string in the MDN docs
- `.p (expr)`: list properties
- `.s`: click an element to get a reference to it (use `_` or `zzdbg.lastSelectedElement` after clicking)
- `.a`: apply changes made in editor mode to the main document

zzdbg also defines the `zzdbg` object that exposes most of its functionality programmatically.

### What's so special about being a quine?
Quines are nothing special, but as a quine and an editor, zzdbg is fully "self-hosting". You can run it from a bookmarklet, edit it, and save it back into the bookmarklet without directly touching the file system.

Here is the full self-editing workflow:
1. Run zzdbg from its bookmarklet
2. Run the command `.o zzdbg.script` to open an editor with the main zzdbg source code, or `.o zzdbg.loader` to edit the loader
3. Make some changes
4. Run `.a` in the editor console to apply your changes
5. Back in the main window, run `.o zzdbg.bookmarklet()` to open a (read-only) editor with the full bookmarklet code
6. Copy and paste the bookmarklet code back into your browser bookmarks to save your changes

### Is it really a debugger if it doesn't support breakpoints?
Well, it supports console.log()...

Breakpoints might be possible in the future using something like [JS-Interpreter](https://github.com/NeilFraser/JS-Interpreter) or [Acorn](https://github.com/acornjs/acorn). However, a bookmarklet-based debugger has the limitation of not necessarily being able to see all of the page's code. The problem is, any code that could possibly call the function where the breakpoint is set also needs to be interpreted/instrumented.

### Known issues
In general zzdbg does a pretty good job working within browsers' security rules. On pages where `eval` is blocked by Content-Security-Policy, there is an "eval2" substitute, but it is more limited. If you want to edit a cross-origin script, just run zzdbg again in the new window and it will link up with the main document.

It's only been tested in Firefox Mobile.

### Development notes
The coding style is "idiosyncratic" because I'm writing it entirely on my phone. Some compromises are made to keep the code short enough to fit in a bookmarklet as well.

License: MIT
