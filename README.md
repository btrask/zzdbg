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

zzdbg also defines the `zzdbg` object that exposes most of its functionality programmatically.

### How is it a quine?
zzdbg can print and also edit/reload its own code. Several functions are available:
- `zzdbg.bookmarklet()` returns the full code as a `javascript:` URL string
- `zzdbg.viewBookmarklet()` opens an editor with the bookmarklet source (read-only)
- `zzdbg.editLoader()` opens an editor with the small loader function
- `zzdbg.editScript()` opens an editor with the main zzdbg source code (including whitespace)

After editing the source, you can run `.a` to reload zzdbg with your changes, and then get the new "compiled" bookmarklet.

### Is it really a debugger if it doesn't support breakpoints?
Well, it supports console.log()...

Breakpoints might be possible in the future using something like [JS-Interpreter](https://github.com/NeilFraser/JS-Interpreter) or [Acorn](https://github.com/acornjs/acorn). However, a bookmarklet-based debugger has the limitation of not necessarily being able to see all of the page's code. The problem is, any code that could possibly call the function where the breakpoint is set also needs to be interpreted/instrumented.

### Known issues
In general zzdbg does a pretty good job working within browsers' security rules. On pages where `eval` is blocked by Content-Security-Policy, there is an "eval2" substitute, but it is more limited.

Only tested in Firefox Mobile.

### Development notes
The coding style is "idiosyncratic" because I'm writing it entirely on my phone. Some compromises are made to keep the code short enough to fit in a bookmarklet as well.

License: MIT
