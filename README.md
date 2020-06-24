# zzdbg: a web debugger in a bookmarklet

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
- `.s`: click an element to get a reference to it (use `_.elem` after clicking)

zzdbg also defines the `zzdbg` object that exposes most of its functionality programmatically.

### Known issues
Some pages with strict Content-Security-Policy headers break `eval`, unfortunately. Some features are limited by security restrictions as well.

Only tested in Firefox Mobile.

### Development notes
The coding style is "idiosyncratic" because I'm writing it entirely on my phone. Some compromises are made to keep the code short enough to fit in a bookmarklet as well.

License: MIT
