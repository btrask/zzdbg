#!/usr/bin/env node
var fs = require("fs");

var loader = fs.readFileSync("loader.js", "utf8");
var zzdbg = fs.readFileSync("zzdbg.js", "utf8");
var bookmarklet = "javascript:("+loader+")("+JSON.stringify(zzdbg)+")";

fs.writeFileSync("bookmarklet.js", bookmarklet, "utf8");
fs.writeFileSync("bookmarklet.js.txt", bookmarklet, "utf8");
