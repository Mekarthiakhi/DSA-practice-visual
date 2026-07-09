"use strict";
/**
 * Real JavaScript Interpreter / Tracer — v3
 *
 * Fixes vs v2:
 *  - Variables inside functions are now properly captured via inline try-catch
 *    assignments after every traced statement (not via Proxy on outer scope)
 *  - Block-opener lines (ending with {) get trace only, no capture
 *  - Return/throw/break/continue get capture BEFORE they exit the block
 *  - MAX_STEPS = 3000
 *  - Function params + for-loop vars are pre-collected for capture
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpretCode = interpretCode;
// ─── Safe value serializer ────────────────────────────────────────────────────
function safeSerialize(val, depth) {
    if (depth === void 0) { depth = 0; }
    if (depth > 3)
        return '[deep]';
    if (val === null || val === undefined)
        return val;
    if (typeof val === 'function')
        return "[fn: ".concat(val.name || 'anon', "]");
    if (typeof val === 'symbol')
        return val.toString();
    if (typeof val !== 'object')
        return val;
    if (val instanceof Map) {
        var obj_1 = {};
        val.forEach(function (v, k) { obj_1[String(k)] = safeSerialize(v, depth + 1); });
        return obj_1;
    }
    if (val instanceof Set)
        return __spreadArray([], val, true).map(function (v) { return safeSerialize(v, depth + 1); });
    if (Array.isArray(val))
        return val.slice(0, 30).map(function (v) { return safeSerialize(v, depth + 1); });
    var res = {};
    var cnt = 0;
    for (var _i = 0, _a = Object.keys(val); _i < _a.length; _i++) {
        var k = _a[_i];
        if (cnt++ > 20) {
            res['...'] = 'more';
            break;
        }
        res[k] = safeSerialize(val[k], depth + 1);
    }
    return res;
}
function deepClone(val, depth) {
    if (depth === void 0) { depth = 0; }
    if (depth > 5)
        return '[deep]';
    if (val === null || val === undefined)
        return val;
    var type = typeof val;
    if (type !== 'object' && type !== 'function')
        return val;
    if (type === 'function')
        return val;
    if (Array.isArray(val)) {
        var copy = new Array(val.length);
        for (var i = 0; i < val.length; i++) {
            copy[i] = deepClone(val[i], depth + 1);
        }
        return copy;
    }
    if (val instanceof Map) {
        var copy_1 = new Map();
        val.forEach(function (v, k) {
            copy_1.set(deepClone(k, depth + 1), deepClone(v, depth + 1));
        });
        return copy_1;
    }
    if (val instanceof Set) {
        var copy_2 = new Set();
        val.forEach(function (v) {
            copy_2.add(deepClone(v, depth + 1));
        });
        return copy_2;
    }
    if (val instanceof Date) {
        return new Date(val.getTime());
    }
    if (val instanceof RegExp) {
        return new RegExp(val.source, val.flags);
    }
    try {
        var proto = Object.getPrototypeOf(val);
        if (proto === null || proto === Object.prototype) {
            var copy = {};
            for (var _i = 0, _a = Object.keys(val); _i < _a.length; _i++) {
                var key = _a[_i];
                copy[key] = deepClone(val[key], depth + 1);
            }
            return copy;
        }
    }
    catch (_b) {
        // fallback
    }
    return val;
}
function typeOf(val) {
    if (val === null)
        return 'null';
    if (val === undefined)
        return 'undefined';
    if (Array.isArray(val))
        return 'Array';
    if (val instanceof Map)
        return 'Map';
    if (val instanceof Set)
        return 'Set';
    return typeof val;
}
function collectFunctionNames(code) {
    var names = new Set();
    for (var _i = 0, _a = code.matchAll(/function\s+([a-zA-Z0-9_$]+)/g); _i < _a.length; _i++) {
        var m = _a[_i];
        names.add(m[1]);
    }
    for (var _b = 0, _c = code.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g); _b < _c.length; _b++) {
        var m = _c[_b];
        names.add(m[1]);
    }
    for (var _d = 0, _e = code.matchAll(/([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/g); _d < _e.length; _d++) {
        var m = _e[_d];
        if (!['if', 'for', 'while', 'switch', 'catch', 'function'].includes(m[1])) {
            names.add(m[1]);
        }
    }
    return names;
}
// ─── Pre-scan variable names ──────────────────────────────────────────────────
function collectVarNames(code) {
    var names = new Set();
    // let/const/var declarations
    for (var _i = 0, _a = code.matchAll(/(?:let|const|var)\s+([a-zA-Z_$][\w$]*)/g); _i < _a.length; _i++) {
        var m = _a[_i];
        names.add(m[1]);
    }
    // function parameters: function foo(a, b, c = 0)
    for (var _b = 0, _c = code.matchAll(/function\s+\w*\s*\(([^)]*)\)/g); _b < _c.length; _b++) {
        var m = _c[_b];
        m[1].split(',').map(function (p) { return p.trim().split('=')[0].trim().replace(/[.[\]]/g, ''); })
            .filter(function (p) { return /^[a-zA-Z_$][\w$]*$/.test(p); })
            .forEach(function (p) { return names.add(p); });
    }
    // Arrow function params: (a, b) => or a =>
    for (var _d = 0, _e = code.matchAll(/\(([^)]*)\)\s*=>/g); _d < _e.length; _d++) {
        var m = _e[_d];
        m[1].split(',').map(function (p) { return p.trim().split('=')[0].trim(); })
            .filter(function (p) { return /^[a-zA-Z_$][\w$]*$/.test(p); })
            .forEach(function (p) { return names.add(p); });
    }
    for (var _f = 0, _g = code.matchAll(/([a-zA-Z_$][\w$]*)\s*=>/g); _f < _g.length; _f++) {
        var m = _g[_f];
        names.add(m[1]);
    }
    // Filter out keywords
    var SKIP = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'catch', 'finally']);
    for (var _h = 0, SKIP_1 = SKIP; _h < SKIP_1.length; _h++) {
        var k = SKIP_1[_h];
        names.delete(k);
    }
    return names;
}
// ─── Build per-line capture string ────────────────────────────────────────────
// Each capture wraps the variable read in try{}catch{} so missing vars are silent.
function buildCaptureStr(names) {
    return __spreadArray([], names, true).map(function (n) { return "try{__v__.".concat(n, "=").concat(n, "}catch{}"); }).join(';');
}
function buildCaptureExpr(names) {
    if (names.size === 0)
        return 'void 0';
    var parts = __spreadArray([], names, true).map(function (n) { return "__v__.".concat(n, "=(() => { try { return ").concat(n, "; } catch { return __v__.").concat(n, "; } })()"); });
    return "(".concat(parts.join(','), ")");
}
// ─── Tokenizer & Recursive Bracer ─────────────────────────────────────────────
function tokenize(code) {
    var tokens = [];
    var i = 0;
    var line = 1;
    var len = code.length;
    while (i < len) {
        var char = code[i];
        if (char === '\n') {
            tokens.push({ type: 'whitespace', value: '\n', line: line });
            line++;
            i++;
            continue;
        }
        if (/\s/.test(char)) {
            var val = '';
            while (i < len && /\s/.test(code[i]) && code[i] !== '\n') {
                val += code[i];
                i++;
            }
            tokens.push({ type: 'whitespace', value: val, line: line });
            continue;
        }
        if (char === '/' && code[i + 1] === '/') {
            var val = '';
            while (i < len && code[i] !== '\n') {
                val += code[i];
                i++;
            }
            tokens.push({ type: 'comment', value: val, line: line });
            continue;
        }
        if (char === '/' && code[i + 1] === '*') {
            var val = '';
            var startLine = line;
            while (i < len) {
                val += code[i];
                if (code[i] === '\n')
                    line++;
                if (code[i] === '*' && code[i + 1] === '/') {
                    val += '/';
                    i += 2;
                    break;
                }
                i++;
            }
            tokens.push({ type: 'comment', value: val, line: startLine });
            continue;
        }
        if (char === '"' || char === "'" || char === '`') {
            var quote = char;
            var val = quote;
            i++;
            while (i < len) {
                var c = code[i];
                val += c;
                if (c === '\n')
                    line++;
                if (c === quote && code[i - 1] !== '\\') {
                    i++;
                    break;
                }
                i++;
            }
            tokens.push({ type: 'string', value: val, line: line });
            continue;
        }
        if (char === '/') {
            var lastToken = tokens[tokens.length - 1];
            var j = tokens.length - 1;
            while (j >= 0 && tokens[j].type === 'whitespace') {
                lastToken = tokens[--j];
            }
            var isRegexPredecessor = !lastToken ||
                ['punctuator', 'operator', 'keyword'].includes(lastToken.type) ||
                (lastToken.type === 'identifier' && ['return', 'throw'].includes(lastToken.value));
            if (isRegexPredecessor) {
                var val = '/';
                i++;
                while (i < len) {
                    var c = code[i];
                    val += c;
                    if (c === '\n')
                        line++;
                    if (c === '/' && code[i - 1] !== '\\') {
                        i++;
                        while (i < len && /[a-z]/i.test(code[i])) {
                            val += code[i];
                            i++;
                        }
                        break;
                    }
                    i++;
                }
                tokens.push({ type: 'string', value: val, line: line });
                continue;
            }
        }
        if (/\d/.test(char) || (char === '.' && /\d/.test(code[i + 1] || ''))) {
            var val = '';
            while (i < len && /[\d.a-zA-Z]/.test(code[i])) {
                val += code[i];
                i++;
            }
            tokens.push({ type: 'number', value: val, line: line });
            continue;
        }
        if (/[a-zA-Z_$]/.test(char)) {
            var val = '';
            while (i < len && /[\w$]/.test(code[i])) {
                val += code[i];
                i++;
            }
            var isKwd = ['if', 'else', 'for', 'while', 'do', 'function', 'class', 'return', 'let', 'const', 'var', 'break', 'continue', 'throw', 'try', 'catch', 'finally'].includes(val);
            tokens.push({ type: isKwd ? 'keyword' : 'identifier', value: val, line: line });
            continue;
        }
        var punctuators = ['{', '}', '(', ')', '[', ']', ';', ',', '.', '?', ':', '===', '==', '=', '!==', '!=', '!', '+=', '-=', '*=', '/=', '++', '--', '+', '-', '*', '%', '&&', '||', '&', '|', '^', '<<', '>>', '>>>', '=>', '<=', '>=', '<', '>'];
        var matchedPunc = '';
        for (var _i = 0, punctuators_1 = punctuators; _i < punctuators_1.length; _i++) {
            var p = punctuators_1[_i];
            if (code.startsWith(p, i)) {
                matchedPunc = p;
                break;
            }
        }
        if (matchedPunc) {
            tokens.push({ type: 'punctuator', value: matchedPunc, line: line });
            i += matchedPunc.length;
            continue;
        }
        tokens.push({ type: 'other', value: char, line: line });
        i++;
    }
    return tokens;
}
function ensureBracesOnce(code) {
    var tokens = tokenize(code);
    var out = [];
    var i = 0;
    var len = tokens.length;
    function skipWhitespace(idx) {
        while (idx < len && (tokens[idx].type === 'whitespace' || tokens[idx].type === 'comment')) {
            idx++;
        }
        return idx;
    }
    while (i < len) {
        var tok = tokens[i];
        if (tok.type === 'keyword' && ['if', 'for', 'while'].includes(tok.value)) {
            out.push(tok.value);
            i++;
            var j = skipWhitespace(i);
            if (j < len && tokens[j].value === '(') {
                for (var k = i; k <= j; k++)
                    out.push(tokens[k].value);
                i = j + 1;
                var parenDepth = 1;
                while (i < len && parenDepth > 0) {
                    var t = tokens[i];
                    if (t.value === '(')
                        parenDepth++;
                    if (t.value === ')')
                        parenDepth--;
                    out.push(t.value);
                    i++;
                }
                var nextNonSpace = skipWhitespace(i);
                if (nextNonSpace < len) {
                    if (tokens[nextNonSpace].value !== '{') {
                        for (var k = i; k < nextNonSpace; k++)
                            out.push(tokens[k].value);
                        out.push('{ ');
                        var scan = nextNonSpace;
                        var bracketDepth = 0;
                        var innerParenDepth = 0;
                        var braceDepth = 0;
                        while (scan < len) {
                            var t = tokens[scan];
                            if (t.value === '(')
                                innerParenDepth++;
                            if (t.value === ')')
                                innerParenDepth--;
                            if (t.value === '[')
                                bracketDepth++;
                            if (t.value === ']')
                                bracketDepth--;
                            if (t.value === '{')
                                braceDepth++;
                            if (t.value === '}')
                                braceDepth--;
                            out.push(t.value);
                            scan++;
                            if (innerParenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
                                if (t.value === ';')
                                    break;
                                if (scan < len && tokens[scan].value === '\n')
                                    break;
                                var nextNext = skipWhitespace(scan);
                                if (nextNext < len && tokens[nextNext].type === 'keyword' && ['else', 'return', 'break', 'continue'].includes(tokens[nextNext].value)) {
                                    break;
                                }
                            }
                        }
                        out.push(' }');
                        i = scan;
                    }
                }
            }
            continue;
        }
        if (tok.type === 'keyword' && tok.value === 'else') {
            out.push('else');
            i++;
            var nextNonSpace = skipWhitespace(i);
            if (nextNonSpace < len) {
                if (tokens[nextNonSpace].type === 'keyword' && tokens[nextNonSpace].value === 'if') {
                    continue;
                }
                if (tokens[nextNonSpace].value !== '{') {
                    for (var k = i; k < nextNonSpace; k++)
                        out.push(tokens[k].value);
                    out.push('{ ');
                    var scan = nextNonSpace;
                    var bracketDepth = 0;
                    var innerParenDepth = 0;
                    var braceDepth = 0;
                    while (scan < len) {
                        var t = tokens[scan];
                        if (t.value === '(')
                            innerParenDepth++;
                        if (t.value === ')')
                            innerParenDepth--;
                        if (t.value === '[')
                            bracketDepth++;
                        if (t.value === ']')
                            bracketDepth--;
                        if (t.value === '{')
                            braceDepth++;
                        if (t.value === '}')
                            braceDepth--;
                        out.push(t.value);
                        scan++;
                        if (innerParenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
                            if (t.value === ';')
                                break;
                            if (scan < len && tokens[scan].value === '\n')
                                break;
                            var nextNext = skipWhitespace(scan);
                            if (nextNext < len && tokens[nextNext].type === 'keyword' && ['else', 'return', 'break', 'continue'].includes(tokens[nextNext].value)) {
                                break;
                            }
                        }
                    }
                    out.push(' }');
                    i = scan;
                }
            }
            continue;
        }
        out.push(tok.value);
        i++;
    }
    return out.join('');
}
function ensureBraces(code) {
    try {
        var prev = code;
        var safety = 0;
        while (safety++ < 10) {
            var braced = ensureBracesOnce(prev);
            if (braced === prev)
                return braced;
            prev = braced;
        }
        return prev;
    }
    catch (e) {
        console.error('ensureBraces failed, falling back to original code:', e);
        return code;
    }
}
// ─── Instrument source code ───────────────────────────────────────────────────
function findMatchingParen(str, startIdx) {
    if (startIdx === -1)
        return -1;
    var depth = 0;
    for (var i = startIdx; i < str.length; i++) {
        if (str[i] === '(')
            depth++;
        if (str[i] === ')') {
            depth--;
            if (depth === 0)
                return i;
        }
    }
    return -1;
}
function instrumentCode(code, names) {
    var bracedCode = ensureBraces(code);
    var lines = bracedCode.split('\n');
    var out = [];
    var inMLComment = false;
    var captureExpr = buildCaptureExpr(names);
    var braceDepth = 0;
    var parenDepth = 0;
    var bracketDepth = 0;
    var classDepths = [];
    for (var i = 0; i < lines.length; i++) {
        var raw = lines[i];
        var trimmed = raw.trim();
        var ln = i + 1;
        if (trimmed.startsWith('/*'))
            inMLComment = true;
        if (inMLComment) {
            out.push(raw);
            if (trimmed.includes('*/'))
                inMLComment = false;
            continue;
        }
        if (!trimmed || trimmed.startsWith('//')) {
            out.push(raw);
            continue;
        }
        var opens = 0;
        var closes = 0;
        var parenOpens = 0;
        var parenCloses = 0;
        var bracketOpens = 0;
        var bracketCloses = 0;
        var inString = false;
        var stringChar = '';
        for (var charIdx = 0; charIdx < trimmed.length; charIdx++) {
            var char = trimmed[charIdx];
            if ((char === '"' || char === "'" || char === '`') && trimmed[charIdx - 1] !== '\\') {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                }
                else if (stringChar === char) {
                    inString = false;
                }
            }
            if (!inString) {
                if (char === '{')
                    opens++;
                if (char === '}')
                    closes++;
                if (char === '(')
                    parenOpens++;
                if (char === ')')
                    parenCloses++;
                if (char === '[')
                    bracketOpens++;
                if (char === ']')
                    bracketCloses++;
            }
        }
        var startsWithClose = trimmed.startsWith('}');
        if (startsWithClose) {
            braceDepth -= closes;
        }
        var inClassBody = classDepths.length > 0 && braceDepth === classDepths[classDepths.length - 1];
        var isClassDecl = trimmed.startsWith('class ');
        if (isClassDecl) {
            classDepths.push(braceDepth + 1);
        }
        var inExpressionContinuation = parenDepth > 0 || bracketDepth > 0;
        if (inExpressionContinuation) {
            out.push(raw);
        }
        else if (isClassDecl) {
            out.push(raw);
        }
        else if (inClassBody && !startsWithClose && !trimmed.endsWith('{')) {
            out.push(raw);
        }
        else if (trimmed.startsWith('if') || trimmed.startsWith('} if') || trimmed.startsWith('else if') || trimmed.startsWith('} else if')) {
            var condStart = raw.indexOf('(');
            var condEnd = findMatchingParen(raw, condStart);
            if (condStart !== -1 && condEnd !== -1) {
                var prefix = raw.substring(0, condStart + 1);
                var cond = raw.substring(condStart + 1, condEnd);
                var suffix = raw.substring(condEnd);
                out.push("".concat(prefix, "(").concat(captureExpr, ", __trace__(").concat(ln, "), ").concat(cond, ")").concat(suffix));
            }
            else {
                out.push(raw);
            }
        }
        else if (trimmed.startsWith('while') || trimmed.startsWith('} while')) {
            var condStart = raw.indexOf('(');
            var condEnd = findMatchingParen(raw, condStart);
            if (condStart !== -1 && condEnd !== -1) {
                var prefix = raw.substring(0, condStart + 1);
                var cond = raw.substring(condStart + 1, condEnd);
                var suffix = raw.substring(condEnd);
                out.push("".concat(prefix, "(").concat(captureExpr, ", __trace__(").concat(ln, "), ").concat(cond, ")").concat(suffix));
            }
            else {
                out.push(raw);
            }
        }
        else if (trimmed.startsWith('for') || trimmed.startsWith('} for')) {
            var condStart = raw.indexOf('(');
            var condEnd = findMatchingParen(raw, condStart);
            if (condStart !== -1 && condEnd !== -1) {
                var prefix = raw.substring(0, condStart + 1);
                var inner = raw.substring(condStart + 1, condEnd);
                var suffix = raw.substring(condEnd);
                var parts = inner.split(';');
                if (parts.length === 3) {
                    var init = parts[0];
                    var cond = parts[1].trim() || 'true';
                    var next = parts[2];
                    out.push("".concat(prefix).concat(init, "; (").concat(captureExpr, ", __trace__(").concat(ln, "), ").concat(cond, "); ").concat(next).concat(suffix));
                }
                else {
                    out.push(raw);
                }
            }
            else {
                out.push(raw);
            }
        }
        else if (trimmed.startsWith('else') || trimmed.startsWith('} else')) {
            var braceIdx = raw.lastIndexOf('{');
            if (braceIdx !== -1) {
                out.push("".concat(raw.substring(0, braceIdx + 1), " ").concat(captureExpr, "; __trace__(").concat(ln, "); ").concat(raw.substring(braceIdx + 1)));
            }
            else {
                out.push(raw);
            }
        }
        else if (trimmed.endsWith('{') && !trimmed.startsWith('}')) {
            var braceIdx = raw.lastIndexOf('{');
            out.push("".concat(raw.substring(0, braceIdx + 1), " ").concat(captureExpr, "; __trace__(").concat(ln, "); ").concat(raw.substring(braceIdx + 1)));
        }
        else if (trimmed.startsWith('return') || trimmed.startsWith('throw') || trimmed.startsWith('break') || trimmed.startsWith('continue')) {
            out.push("".concat(captureExpr, "; __trace__(").concat(ln, "); ").concat(raw));
        }
        else if (trimmed === '}' || trimmed.startsWith('}')) {
            out.push(raw);
        }
        else {
            out.push("".concat(captureExpr, "; __trace__(").concat(ln, "); ").concat(raw));
        }
        if (!startsWithClose) {
            braceDepth += opens;
            braceDepth -= closes;
        }
        else {
            braceDepth += opens;
        }
        parenDepth += parenOpens - parenCloses;
        bracketDepth += bracketOpens - bracketCloses;
        if (classDepths.length > 0 && braceDepth < classDepths[classDepths.length - 1]) {
            classDepths.pop();
        }
    }
    return out.join('\n');
}
// ─── Core interpret function ──────────────────────────────────────────────────
function interpretCode(code) {
    var events = [];
    var consoleLines = [];
    var hasError = '';
    // Shared vars object — inline captures write into this
    var __v__ = {};
    var varNames = collectVarNames(code);
    var captureStr = buildCaptureStr(varNames);
    var instrumentedCode = instrumentCode(code, varNames);
    // Execution state
    var stepCount = 0;
    var MAX_STEPS = 3000;
    var functionNames = collectFunctionNames(code);
    function getCallStack() {
        var stack = new Error().stack || '';
        var frames = [];
        var lines = stack.split('\n');
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var l = lines_1[_i];
            var trimmed = l.trim();
            if (!trimmed)
                continue;
            var v8Match = trimmed.match(/^at\s+([a-zA-Z0-9_$.]+)/);
            if (v8Match) {
                var fullName = v8Match[1];
                var parts = fullName.split('.');
                var hasMatch = parts.some(function (p) { return functionNames.has(p); });
                if (hasMatch) {
                    frames.push(parts[parts.length - 1]);
                }
                continue;
            }
            var ffMatch = trimmed.match(/^([a-zA-Z0-9_$]+)@/);
            if (ffMatch) {
                var name = ffMatch[1];
                if (functionNames.has(name)) {
                    frames.push(name);
                }
            }
        }
        return __spreadArray(['main'], frames.reverse(), true);
    }
    function __trace__(line) {
        if (stepCount++ > MAX_STEPS)
            throw new Error('__MAX_STEPS__');
        var callStack = getCallStack();
        // Deep clone each captured variable to avoid reference mutations
        var varsCopy = {};
        for (var _i = 0, _a = Object.entries(__v__); _i < _a.length; _i++) {
            var _b = _a[_i], k = _b[0], v = _b[1];
            varsCopy[k] = deepClone(v);
        }
        events.push({
            type: 'line',
            line: line,
            vars: varsCopy,
            callStack: callStack,
        });
    }
    var safeConsole = {
        log: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var str = args.map(function (a) {
                if (typeof a === 'object' && a !== null) {
                    try {
                        return JSON.stringify(safeSerialize(a));
                    }
                    catch (_a) {
                        return String(a);
                    }
                }
                return String(a);
            }).join(' ');
            consoleLines.push(str);
            // Deep clone each captured variable for output events as well
            var varsCopy = {};
            for (var _a = 0, _b = Object.entries(__v__); _a < _b.length; _a++) {
                var _c = _b[_a], k = _c[0], v = _c[1];
                varsCopy[k] = deepClone(v);
            }
            events.push({ type: 'output', line: 0, vars: varsCopy, callStack: getCallStack(), output: str });
        },
        error: function () {
            var a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                a[_i] = arguments[_i];
            }
            return safeConsole.log.apply(safeConsole, __spreadArray(['[ERROR]'], a, false));
        },
        warn: function () {
            var a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                a[_i] = arguments[_i];
            }
            return safeConsole.log.apply(safeConsole, __spreadArray(['[WARN]'], a, false));
        },
        info: function () {
            var a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                a[_i] = arguments[_i];
            }
            return safeConsole.log.apply(safeConsole, __spreadArray(['[INFO]'], a, false));
        },
    };
    try {
        var sandbox = {
            __trace__: __trace__,
            __v__: __v__,
            console: safeConsole,
            Math: Math,
            JSON: JSON,
            Array: Array,
            Object: Object,
            String: String,
            Number: Number,
            Boolean: Boolean,
            Map: Map,
            Set: Set,
            Date: Date,
            parseInt: parseInt,
            parseFloat: parseFloat,
            isNaN: isNaN,
            isFinite: isFinite,
            Infinity: Infinity,
            NaN: NaN,
            undefined: undefined,
            setTimeout: function () { }, setInterval: function () { },
            clearTimeout: function () { }, clearInterval: function () { },
        };
        var keys = Object.keys(sandbox);
        var vals = Object.values(sandbox);
        var linesCount = code.split('\n').length;
        // eslint-disable-next-line no-new-func
        var fn = new (Function.bind.apply(Function, __spreadArray(__spreadArray([void 0], keys, false), ["\"use strict\";\n".concat(instrumentedCode, "\n").concat(captureStr, ";\n__trace__(").concat(linesCount, ");")], false)))();
        fn.apply(void 0, vals);
    }
    catch (err) {
        var msg = err instanceof Error ? err.message : String(err);
        if (msg !== '__MAX_STEPS__') {
            hasError = msg;
            consoleLines.push("\u274C Runtime Error: ".concat(msg));
        }
    }
    var steps = eventsToSteps(events, code);
    var detectedType = detectDataType(code, __v__);
    return { steps: steps, output: consoleLines, error: hasError || undefined, detectedType: detectedType };
}
// ─── Filter intermediate swap states ──────────────────────────────────────────
function filterSwapEvents(events, activeArrayName) {
    if (!activeArrayName)
        return events;
    var filtered = [];
    for (var i = 0; i < events.length; i++) {
        var cur = events[i];
        // Check if we can look ahead
        if (i > 0 && i < events.length - 1) {
            var prev = filtered[filtered.length - 1];
            var next = events[i + 1];
            if (cur.type === 'line' && (prev === null || prev === void 0 ? void 0 : prev.type) === 'line' && (next === null || next === void 0 ? void 0 : next.type) === 'line') {
                var prevArr = prev.vars[activeArrayName];
                var curArr = cur.vars[activeArrayName];
                var nextArr = next.vars[activeArrayName];
                if (Array.isArray(prevArr) && Array.isArray(curArr) && Array.isArray(nextArr)) {
                    if (prevArr.length === curArr.length && curArr.length === nextArr.length) {
                        // Find positions where prev and next differ
                        var diffIndices = [];
                        for (var k = 0; k < prevArr.length; k++) {
                            if (prevArr[k] !== nextArr[k]) {
                                diffIndices.push(k);
                            }
                        }
                        if (diffIndices.length === 2) {
                            var idx1 = diffIndices[0], idx2 = diffIndices[1];
                            // Check if they are swapped
                            var isSwapped = prevArr[idx1] === nextArr[idx2] && prevArr[idx2] === nextArr[idx1];
                            if (isSwapped) {
                                // Check if curArr is an intermediate copy-over state
                                var isIntermediate = true;
                                for (var k = 0; k < curArr.length; k++) {
                                    if (k !== idx1 && k !== idx2) {
                                        if (curArr[k] !== prevArr[k]) {
                                            isIntermediate = false;
                                            break;
                                        }
                                    }
                                }
                                if (isIntermediate) {
                                    var val1 = curArr[idx1];
                                    var val2 = curArr[idx2];
                                    var expectedVal1 = prevArr[idx1];
                                    var expectedVal2 = prevArr[idx2];
                                    if ((val1 === expectedVal2 && val2 === expectedVal2) ||
                                        (val1 === expectedVal1 && val2 === expectedVal1)) {
                                        // Instead of deleting the event, patch the array to hide the intermediate state
                                        // This keeps the line trace intact but prevents visual glitches
                                        cur.vars[activeArrayName] = __spreadArray([], prevArr, true);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        filtered.push(cur);
    }
    return filtered;
}
// ─── Events → Steps ──────────────────────────────────────────────────────────
function eventsToSteps(events, code) {
    var _a, _b;
    // 1. Detect active array name first to guide the filter
    var activeArrayName = '';
    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
        var ev = events_1[_i];
        if (ev.type === 'line') {
            var fallback = Object.entries(ev.vars).find(function (v) { return (v[0] === 'arr' || v[0] === 'nums' || v[0] === 'array') && Array.isArray(v[1]); });
            if (fallback) {
                activeArrayName = fallback[0];
                break;
            }
        }
    }
    // 2. Filter intermediate states
    var filteredEvents = filterSwapEvents(events, activeArrayName);
    var codeLines = code.split('\n');
    // Find all line event indices
    var lineEventIndices = [];
    for (var idx = 0; idx < filteredEvents.length; idx++) {
        if (filteredEvents[idx].type === 'line') {
            lineEventIndices.push(idx);
        }
    }
    var steps = [];
    var swaps = 0;
    var comparisons = 0;
    var prevArrState = [];
    var prevPointers = '';
    var _loop_1 = function (k) {
        var curIdx = lineEventIndices[k];
        var curEv = filteredEvents[curIdx];
        // Find next line event
        var nextIdx = k + 1 < lineEventIndices.length ? lineEventIndices[k + 1] : -1;
        var nextEv = nextIdx !== -1 ? filteredEvents[nextIdx] : curEv;
        // The variables, callstack, and scope for this step come from the next event (representing post-execution state of current line)
        var varsForStep = nextEv.vars;
        var callStackForStep = nextEv.callStack;
        var lineForStep = curEv.line;
        // Collect all outputs between current line event and next line event
        var limitIdx = nextIdx !== -1 ? nextIdx : filteredEvents.length;
        var outputs = [];
        for (var oIdx = curIdx + 1; oIdx < limitIdx; oIdx++) {
            var oEv = filteredEvents[oIdx];
            if (oEv.type === 'output' && oEv.output) {
                outputs.push(oEv.output);
            }
        }
        var prevStep = steps[steps.length - 1];
        var prevVars = (prevStep === null || prevStep === void 0 ? void 0 : prevStep.variables) || [];
        var currentVars = Object.entries(varsForStep)
            .filter(function (_a) {
            var name = _a[0];
            return !name.startsWith('__');
        })
            .map(function (_a) {
            var name = _a[0], value = _a[1];
            var serialized = safeSerialize(value);
            var prev = prevVars.find(function (v) { return v.name === name; });
            var changed = !prev || JSON.stringify(prev.value) !== JSON.stringify(serialized);
            return { name: name, value: serialized, type: typeOf(value), scope: callStackForStep[callStackForStep.length - 1] || 'main', changed: changed };
        });
        var callStack = callStackForStep.map(function (name, idx) { return ({
            id: "f".concat(idx),
            name: name,
            line: lineForStep, variables: [], isActive: idx === callStackForStep.length - 1,
        }); });
        var lineCode = ((_a = codeLines[lineForStep - 1]) === null || _a === void 0 ? void 0 : _a.trim()) || '';
        var changedArray = currentVars.find(function (v) { return v.changed && v.type === 'Array' && Array.isArray(v.value) && typeof v.value[0] === 'number'; });
        if (changedArray)
            activeArrayName = changedArray.name;
        if (!activeArrayName) {
            var fallback = currentVars.find(function (v) { return (v.name === 'arr' || v.name === 'nums' || v.name === 'array') && v.type === 'Array'; });
            if (fallback)
                activeArrayName = fallback.name;
        }
        var dsaState = buildDSAState(varsForStep, activeArrayName, lineCode);
        var desc = buildDesc(lineCode, varsForStep);
        if (dsaState && dsaState.type === 'array') {
            var currentArr = dsaState.nodes.map(function (n) { return Number(n.value); });
            var currentPointers = "".concat(dsaState.pointer, ",").concat(dsaState.pointer2);
            var isSwap = false;
            if (prevArrState.length > 0 && currentArr.join(',') !== prevArrState.join(',')) {
                isSwap = true;
                swaps++;
            }
            else if (currentPointers !== prevPointers && currentPointers !== 'undefined,undefined') {
                comparisons++;
            }
            dsaState.swaps = swaps;
            dsaState.comparisons = comparisons;
            if (isSwap) {
                dsaState.nodes.forEach(function (n, idx) {
                    if (prevArrState[idx] !== undefined && Number(n.value) !== prevArrState[idx]) {
                        n.highlight = 'swapping';
                    }
                });
            }
            prevArrState = currentArr;
            prevPointers = currentPointers;
        }
        steps.push({
            line: lineForStep,
            description: desc,
            variables: currentVars,
            callStack: callStack,
            heap: [],
            output: outputs.join('\n'),
            dsaState: dsaState,
        });
    };
    for (var k = 0; k < lineEventIndices.length; k++) {
        _loop_1(k);
    }
    // Mark as sorted if strictly increasing at the end
    if (steps.length > 0) {
        var lastStep = steps[steps.length - 1];
        if (((_b = lastStep === null || lastStep === void 0 ? void 0 : lastStep.dsaState) === null || _b === void 0 ? void 0 : _b.type) === 'array') {
            var isSorted = lastStep.dsaState.nodes.every(function (n, i, a) { return i === 0 || Number(n.value) >= Number(a[i - 1].value); });
            if (isSorted && lastStep.dsaState.swaps !== undefined && lastStep.dsaState.swaps > 0) {
                lastStep.dsaState.nodes.forEach(function (n) { return n.highlight = 'sorted'; });
            }
        }
    }
    // Backfill dsaState for early steps that don't have one
    var firstWithDSA = steps.find(function (s) { return s.dsaState && s.dsaState.nodes && s.dsaState.nodes.length > 0; });
    if (firstWithDSA && firstWithDSA.dsaState) {
        var defaultDSA = __assign(__assign({}, firstWithDSA.dsaState), { nodes: firstWithDSA.dsaState.nodes.map(function (n) { return (__assign(__assign({}, n), { highlight: 'none' })); }), pointer: undefined, pointer2: undefined, message: 'Initializing...' });
        for (var i = 0; i < steps.length; i++) {
            if (!steps[i].dsaState) {
                steps[i].dsaState = __assign({}, defaultDSA);
            }
        }
    }
    return steps;
}
// ─── Substitution & Evaluation helpers ────────────────────────────────────────
function substituteVars(expr, vars) {
    var _a, _b, _c;
    var result = expr.trim();
    // Clean up braces, semi-colons
    result = result.replace(/;\s*$/, '').replace(/^if\s*\(/, '').replace(/\)\s*\{?$/, '');
    // 1. Replace array accesses like arr[j + 1] or nums[i]
    var arrayAccessRegex = /(\b[a-zA-Z_$][\w$]*)\s*\[([^\]]+)\]/g;
    var match;
    var safetyCounter = 0;
    while (safetyCounter++ < 20 && (match = arrayAccessRegex.exec(result)) !== null) {
        var fullMatch = match[0];
        var arrName = match[1];
        var indexExpr = match[2].trim();
        var arrVal = vars[arrName];
        if (Array.isArray(arrVal)) {
            var indexVal = null;
            if (/^\d+$/.test(indexExpr)) {
                indexVal = parseInt(indexExpr);
            }
            else if (vars[indexExpr] !== undefined && typeof vars[indexExpr] === 'number') {
                indexVal = vars[indexExpr];
            }
            else {
                // Simple index expression like j + 1 or i - 1
                var simpleArith = indexExpr.match(/^(\w+)\s*([+-])\s*(\d+)$/);
                if (simpleArith) {
                    var varName = simpleArith[1];
                    var op = simpleArith[2];
                    var val = parseInt(simpleArith[3]);
                    if (vars[varName] !== undefined && typeof vars[varName] === 'number') {
                        var base = vars[varName];
                        indexVal = op === '+' ? base + val : base - val;
                    }
                }
            }
            if (indexVal !== null && indexVal >= 0 && indexVal < arrVal.length) {
                var val = arrVal[indexVal];
                result = result.replace(fullMatch, String(val));
                arrayAccessRegex.lastIndex = 0;
            }
        }
    }
    // 2. Replace map/set has/get checks
    var methodCallRegex = /(\b[a-zA-Z_$][\w$]*)\s*\.(has|get)\(([^)]+)\)/g;
    safetyCounter = 0;
    while (safetyCounter++ < 20 && (match = methodCallRegex.exec(result)) !== null) {
        var fullMatch = match[0];
        var objName = match[1];
        var method = match[2];
        var argExpr = match[3].trim();
        var objVal = vars[objName];
        var argVal = vars[argExpr] !== undefined ? vars[argExpr] : argExpr;
        var evalVal = 'false';
        if (objVal instanceof Map) {
            if (method === 'has') {
                evalVal = String(objVal.has(Number(argVal)) || objVal.has(argVal));
            }
            else {
                evalVal = String((_b = (_a = objVal.get(Number(argVal))) !== null && _a !== void 0 ? _a : objVal.get(argVal)) !== null && _b !== void 0 ? _b : 'undefined');
            }
        }
        else if (objVal instanceof Set) {
            if (method === 'has') {
                evalVal = String(objVal.has(Number(argVal)) || objVal.has(argVal));
            }
        }
        else if (objVal && typeof objVal === 'object') {
            if (method === 'has') {
                evalVal = String(String(argVal) in objVal);
            }
            else {
                evalVal = String((_c = objVal[String(argVal)]) !== null && _c !== void 0 ? _c : 'undefined');
            }
        }
        result = result.replace(fullMatch, evalVal);
        methodCallRegex.lastIndex = 0;
    }
    // 3. Replace plain variables
    var wordRegex = /\b([a-zA-Z_$][\w$]*)\b/g;
    var wordsToReplace = [];
    while ((match = wordRegex.exec(result)) !== null) {
        var word = match[1];
        if (vars[word] !== undefined && typeof vars[word] !== 'object' && typeof vars[word] !== 'function') {
            wordsToReplace.push({ word: word, valStr: String(vars[word]) });
        }
    }
    wordsToReplace.sort(function (a, b) { return b.word.length - a.word.length; });
    var replacedWords = new Set();
    for (var _i = 0, wordsToReplace_1 = wordsToReplace; _i < wordsToReplace_1.length; _i++) {
        var _d = wordsToReplace_1[_i], word = _d.word, valStr = _d.valStr;
        if (replacedWords.has(word))
            continue;
        replacedWords.add(word);
        var regex = new RegExp("\\b".concat(word, "\\b"), 'g');
        result = result.replace(regex, valStr);
    }
    return result;
}
function tryEvaluateBoolean(substituted) {
    try {
        if (/^-?\d+(?:\s*[-+*/%]\s*-?\d+)*\s*(?:==|===|!=|!==|>|>=|<|<=)\s*-?\d+(?:\s*[-+*/%]\s*-?\d+)*$/.test(substituted.trim())) {
            // eslint-disable-next-line no-eval
            return !!eval(substituted);
        }
    }
    catch (_a) {
        // ignore
    }
    return null;
}
// ─── Description builder ──────────────────────────────────────────────────────
function buildDesc(lineCode, vars) {
    var _a, _b;
    if (!lineCode)
        return 'Executing...';
    var trimmed = lineCode.trim();
    // 1. Assignment
    var assignMatch = trimmed.match(/(?:let|const|var)?\s*(\w+)\s*([+\-*/%]?=)\s*(.+)/);
    if (assignMatch) {
        var name = assignMatch[1];
        var op = assignMatch[2];
        var rhs = assignMatch[3].replace(/;$/, '').trim();
        if (vars[name] !== undefined) {
            var valStr = (_b = (_a = JSON.stringify(safeSerialize(vars[name]))) === null || _a === void 0 ? void 0 : _a.substring(0, 40)) !== null && _b !== void 0 ? _b : '?';
            if (op === '=') {
                var subRHS = substituteVars(rhs, vars);
                if (subRHS !== rhs && subRHS !== valStr) {
                    return "".concat(name, " = ").concat(rhs, "  \u2192  ").concat(subRHS, " = ").concat(valStr);
                }
            }
            return "".concat(name, " = ").concat(valStr);
        }
    }
    // 2. If condition
    if (/^if\s*\(/.test(trimmed)) {
        var condMatch = trimmed.match(/^if\s*\((.+)\)/);
        if (condMatch) {
            var cond = condMatch[1];
            var sub = substituteVars(cond, vars);
            var evalResult = tryEvaluateBoolean(sub);
            return "Check: ".concat(cond, "  \u2192  ").concat(sub).concat(evalResult !== null ? " (".concat(evalResult ? 'true' : 'false', ")") : '');
        }
    }
    // 3. For/While condition
    if (/^(for|while)\s*\(/.test(trimmed)) {
        var condMatch = trimmed.match(/^(?:for|while)\s*\((.+)\)/);
        if (condMatch) {
            var inner = condMatch[1];
            var parts = inner.split(';');
            var cond = parts.length === 3 ? parts[1].trim() : inner;
            var sub = substituteVars(cond, vars);
            var evalResult = tryEvaluateBoolean(sub);
            return "Loop condition: ".concat(cond, "  \u2192  ").concat(sub).concat(evalResult !== null ? " (".concat(evalResult ? 'true' : 'false', ")") : '');
        }
    }
    // 4. Return statement
    if (/^return\b/.test(trimmed)) {
        var expr = trimmed.replace(/^return\s*/, '').replace(/;$/, '').trim();
        if (expr) {
            var sub = substituteVars(expr, vars);
            return "Return: ".concat(sub);
        }
        return 'Return';
    }
    // 5. Console log
    var logMatch = trimmed.match(/console\.log\((.+)\)/);
    if (logMatch) {
        var expr = logMatch[1];
        var sub = substituteVars(expr, vars);
        return "print: ".concat(sub);
    }
    return trimmed.substring(0, 60);
}
// ─── Detect data structure type ───────────────────────────────────────────────
function detectDataType(code, vars) {
    var lower = code.toLowerCase();
    var hasGraphNode = Object.values(vars).some(function (v) {
        return v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Map) && !(v instanceof Set) &&
            Object.values(v).every(function (val) { return Array.isArray(val) && val.every(function (item) { return typeof item === 'string' || typeof item === 'number'; }); });
    });
    if (hasGraphNode || lower.includes('graph') || lower.includes('adjacency'))
        return 'graph';
    var hasTreeNode = Object.values(vars).some(function (v) {
        return v && typeof v === 'object' && ('left' in v || 'right' in v);
    });
    if (hasTreeNode || lower.includes('.left') || lower.includes('.right') || lower.includes('bst'))
        return 'tree';
    var hasLLNode = Object.values(vars).some(function (v) {
        return v && typeof v === 'object' && 'next' in v;
    });
    if (hasLLNode || lower.includes('.next') || lower.includes('linkedlist'))
        return 'linkedlist';
    if (Object.keys(vars).some(function (k) { return k.toLowerCase().includes('stack'); }) || (lower.includes('push') && lower.includes('pop') && !lower.includes('array.')))
        return 'stack';
    if (Object.keys(vars).some(function (k) { return k.toLowerCase().includes('queue'); }) || lower.includes('enqueue') || lower.includes('dequeue'))
        return 'queue';
    if (Object.values(vars).some(function (v) { return v instanceof Map; }) || lower.includes('hashmap') || lower.includes('hash map'))
        return 'hashmap';
    var numArrays = Object.values(vars).filter(function (v) { return Array.isArray(v) && v.length > 1 && typeof v[0] === 'number'; });
    if (numArrays.length > 0)
        return 'array';
    var strs = Object.values(vars).filter(function (v) { return typeof v === 'string' && v.length > 1; });
    if (strs.length > 0 && (lower.includes('reverse') || lower.includes('palindrome') || lower.includes('char')))
        return 'string';
    return 'generic';
}
// ─── DSA state builder ────────────────────────────────────────────────────────
function detectHashTableInfo(vars, excludeName) {
    var mapEntry = Object.entries(vars).find(function (_a) {
        var k = _a[0], v = _a[1];
        return !k.startsWith('__') && v instanceof Map;
    });
    if (mapEntry) {
        var name = mapEntry[0], mapObj = mapEntry[1];
        var table_1 = {};
        mapObj.forEach(function (v, k) { table_1[String(k)] = v; });
        // If keys are numbers (common in twoSum), label is "value → index"
        var keysAreNumbers = Array.from(mapObj.keys()).every(function (k) { return typeof k === 'number' || !isNaN(Number(k)); });
        var label = keysAreNumbers ? 'value → index' : 'key → value';
        return { table: table_1, name: name, label: label };
    }
    var setEntry = Object.entries(vars).find(function (_a) {
        var k = _a[0], v = _a[1];
        return !k.startsWith('__') && v instanceof Set;
    });
    if (setEntry) {
        var name = setEntry[0], setObj = setEntry[1];
        var table_2 = {};
        setObj.forEach(function (v) { table_2[String(v)] = '✓'; });
        return { table: table_2, name: name, label: 'presence' };
    }
    var objEntry = Object.entries(vars).find(function (_a) {
        var k = _a[0], v = _a[1];
        return !k.startsWith('__') && k !== excludeName && k !== 'variables' && typeof v === 'object' && v !== null && !Array.isArray(v) &&
            !(v instanceof Map) && !(v instanceof Set) &&
            Object.values(v).some(function (val) { return typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean'; });
    });
    if (objEntry) {
        var name = objEntry[0], obj = objEntry[1];
        var table_3 = {};
        Object.entries(obj)
            .filter(function (_a) {
            var v = _a[1];
            return typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean';
        })
            .slice(0, 20)
            .forEach(function (_a) {
            var k = _a[0], v = _a[1];
            table_3[k] = v;
        });
        var keysAreNumbers = Object.keys(table_3).every(function (k) { return !isNaN(Number(k)); });
        var label = keysAreNumbers ? 'value → index' : 'key → value';
        return { table: table_3, name: name, label: label };
    }
    return undefined;
}
function buildDSAState(vars, preferredName, lineCode) {
    if (lineCode === void 0) { lineCode = ''; }
    // 1. STACK DETECTOR
    var stackVar = Object.entries(vars).find(function (_a) {
        var k = _a[0], v = _a[1];
        return k.toLowerCase().includes('stack') && Array.isArray(v);
    });
    var strEntriesForStack = Object.entries(vars).filter(function (_a) {
        var k = _a[0], v = _a[1];
        return !k.startsWith('__') && typeof v === 'string' && v.length > 0 && k !== 'type';
    });
    var hasArrayForStack = Object.entries(vars).some(function (_a) {
        var k = _a[0], v = _a[1];
        return !k.startsWith('__') && Array.isArray(v) && v.length > 1 && typeof v[0] === 'number';
    });
    if (stackVar && strEntriesForStack.length === 0 && !hasArrayForStack) {
        var name = stackVar[0], arr = stackVar[1];
        var items_1 = arr;
        return {
            type: 'stack',
            stackItems: __spreadArray([], items_1, true),
            nodes: items_1.map(function (v, i) { return ({
                id: "s".concat(i),
                value: String(v),
                highlight: i === items_1.length - 1 ? 'active' : 'visited'
            }); }),
            message: "".concat(name, ": [").concat(items_1.join(', '), "]")
        };
    }
    // 2. QUEUE DETECTOR
    var queueVar = Object.entries(vars).find(function (_a) {
        var k = _a[0], v = _a[1];
        return k.toLowerCase().includes('queue') && Array.isArray(v);
    });
    if (queueVar) {
        var name = queueVar[0], arr = queueVar[1];
        var items_2 = arr;
        return {
            type: 'queue',
            queueItems: __spreadArray([], items_2, true),
            nodes: items_2.map(function (v, i) { return ({
                id: "q".concat(i),
                value: String(v),
                highlight: i === 0 ? 'active' : i === items_2.length - 1 ? 'comparing' : 'visited'
            }); }),
            message: "".concat(name, ": [").concat(items_2.join(', '), "]")
        };
    }
    // 3. TREE / BST DETECTOR
    var findTreeRoot = function (vrs) {
        var candidates = Object.entries(vrs).filter(function (_a) {
            var v = _a[1];
            return v && typeof v === 'object' && ('left' in v || 'right' in v);
        });
        if (candidates.length === 0)
            return null;
        var preferred = candidates.find(function (_a) {
            var k = _a[0];
            return k === 'root' || k === 'tree' || k === 'bst';
        });
        return preferred ? preferred[1] : candidates[0][1];
    };
    var root = findTreeRoot(vars);
    if (root) {
        var nodes = [];
        var edges = [];
        var q = [{ node: root, x: 350, y: 60, spread: 160 }];
        var idCounter = 0;
        var visited = new Set();
        while (q.length > 0) {
            var _a = q.shift(), node = _a.node, x = _a.x, y = _a.y, spread = _a.spread, parentId = _a.parentId;
            if (!node || visited.has(node))
                continue;
            visited.add(node);
            var id = "t-".concat(idCounter++);
            var val = node.val !== undefined ? node.val : node.value;
            var highlight = 'none';
            if (vars['curr'] && vars['curr'].val === val)
                highlight = 'active';
            else if (vars['node'] && vars['node'].val === val)
                highlight = 'active';
            nodes.push({
                id: id,
                value: val !== undefined ? String(val) : 'T',
                x: x,
                y: y,
                highlight: highlight
            });
            if (parentId) {
                edges.push({
                    id: "e-".concat(parentId, "-").concat(id),
                    from: parentId,
                    to: id,
                    directed: true
                });
            }
            if (node.left) {
                q.push({
                    node: node.left,
                    x: x - spread,
                    y: y + 80,
                    spread: spread * 0.5,
                    parentId: id
                });
            }
            if (node.right) {
                q.push({
                    node: node.right,
                    x: x + spread,
                    y: y + 80,
                    spread: spread * 0.5,
                    parentId: id
                });
            }
        }
        return {
            type: 'tree',
            nodes: nodes,
            edges: edges,
            message: "Binary Tree Layout (Nodes: ".concat(nodes.length, ")")
        };
    }
    // 4. LINKED LIST DETECTOR
    var linkedListVars = Object.entries(vars).filter(function (_a) {
        var v = _a[1];
        return v && typeof v === 'object' && ('next' in v || 'val' in v || 'value' in v);
    });
    if (linkedListVars.length > 0) {
        var nodes = [];
        var edges = [];
        // Map node object references to the variable names that point to them
        var nodePointers = new Map();
        for (var _i = 0, linkedListVars_1 = linkedListVars; _i < linkedListVars_1.length; _i++) {
            var _b = linkedListVars_1[_i], k = _b[0], v = _b[1];
            var existing = nodePointers.get(v) || [];
            existing.push(k);
            nodePointers.set(v, existing);
        }
        // Determine the heads to start tracing from
        // Prioritize named lists, dummy nodes, or heads
        var preferredHeadNames_1 = ['list1', 'list2', 'l1', 'l2', 'head1', 'head2', 'head', 'dummy', 'list'];
        var startVars = linkedListVars.filter(function (_a) {
            var k = _a[0];
            return preferredHeadNames_1.includes(k);
        });
        if (startVars.length === 0)
            startVars = linkedListVars;
        var globalVisited = new Set();
        var currentY = 80;
        var listCount = 0;
        for (var _c = 0, startVars_1 = startVars; _c < startVars_1.length; _c++) {
            var _d = startVars_1[_c], varName = _d[0], headNode = _d[1];
            if (globalVisited.has(headNode))
                continue; // Already traced this node as part of another list
            var curr = headNode;
            var idx = 0;
            while (curr && !globalVisited.has(curr)) {
                globalVisited.add(curr);
                var val = curr.val !== undefined ? curr.val : curr.value;
                var id = "ll-".concat(listCount, "-").concat(idx);
                var highlight = 'none';
                var ptrNames = nodePointers.get(curr) || [];
                // Determine highlighting based on variable names pointing to this node
                if (ptrNames.some(function (n) { return ['curr', 'current', 'list1', 'list2', 'l1', 'l2'].includes(n); })) {
                    highlight = 'active';
                }
                else if (ptrNames.some(function (n) { return ['prev', 'p'].includes(n); })) {
                    highlight = 'visited';
                }
                else if (ptrNames.some(function (n) { return ['next', 'nextTemp', 'q', 'temp'].includes(n); })) {
                    highlight = 'comparing';
                }
                else if (ptrNames.length > 0 && !ptrNames.includes(varName)) {
                    // It has some other pointer pointing to it
                    highlight = 'processing';
                }
                // Create a label showing which variables point to this node
                var label = ptrNames.join(', ');
                nodes.push({
                    id: id,
                    value: val !== undefined ? String(val) : "Node",
                    x: idx * 100 + 60,
                    y: currentY,
                    highlight: highlight,
                    label: label || undefined
                });
                if (idx > 0) {
                    edges.push({
                        id: "e-ll-".concat(listCount, "-").concat(idx - 1, "-").concat(idx),
                        from: "ll-".concat(listCount, "-").concat(idx - 1),
                        to: id,
                        directed: true
                    });
                }
                curr = curr.next;
                idx++;
            }
            if (idx > 0) {
                currentY += 100; // Move down for the next list
                listCount++;
            }
        }
        // If we have nodes, return the state
        if (nodes.length > 0) {
            return {
                type: 'linkedlist',
                nodes: nodes,
                edges: edges,
                message: "Linked List Traversal (Lists: ".concat(listCount, ", Nodes: ").concat(nodes.length, ")")
            };
        }
    }
    // 5. GRAPH DETECTOR
    var findGraph = function (vrs) {
        var candidates = Object.entries(vrs).filter(function (_a) {
            var v = _a[1];
            return v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Map) && !(v instanceof Set) &&
                Object.values(v).every(function (val) { return Array.isArray(val) && val.every(function (item) { return typeof item === 'string' || typeof item === 'number'; }); });
        });
        if (candidates.length === 0)
            return null;
        return candidates[0];
    };
    var graphEntry = findGraph(vars);
    if (graphEntry) {
        var name = graphEntry[0], graphObj = graphEntry[1];
        var adjList = graphObj;
        var nodeIds = Object.keys(adjList);
        var n_1 = nodeIds.length;
        var visitedVar = Object.values(vars).find(function (v) { return (v instanceof Set || Array.isArray(v)) && __spreadArray([], v, true).every(function (item) { return typeof item === 'string' || typeof item === 'number'; }); });
        var visitedSet_1 = visitedVar ? new Set(__spreadArray([], visitedVar, true)) : new Set();
        var queueVar_1 = Object.entries(vars).find(function (_a) {
            var k = _a[0], v = _a[1];
            return (k === 'queue' || k === 'stack') && Array.isArray(v);
        });
        var queueItems_1 = queueVar_1 ? queueVar_1[1] : [];
        var currentVar = Object.entries(vars).find(function (_a) {
            var k = _a[0], v = _a[1];
            return (k === 'node' || k === 'curr' || k === 'current') && (typeof v === 'string' || typeof v === 'number');
        });
        var currentVal_1 = currentVar ? String(currentVar[1]) : null;
        var positions_1 = {};
        nodeIds.forEach(function (id, i) {
            var angle = (i / n_1) * Math.PI * 2 - Math.PI / 2;
            positions_1[id] = { x: 220 + 160 * Math.cos(angle), y: 200 + 160 * Math.sin(angle) };
        });
        var nodes = nodeIds.map(function (id) {
            var highlight = 'none';
            if (id === currentVal_1)
                highlight = 'active';
            else if (visitedSet_1.has(id))
                highlight = 'found';
            else if (queueItems_1.includes(id))
                highlight = 'comparing';
            return {
                id: id,
                value: id,
                x: positions_1[id].x,
                y: positions_1[id].y,
                highlight: highlight
            };
        });
        var edges = [];
        var seenEdges = new Set();
        for (var _e = 0, _f = Object.entries(adjList); _e < _f.length; _e++) {
            var _g = _f[_e], from = _g[0], neighbors = _g[1];
            for (var _h = 0, neighbors_1 = neighbors; _h < neighbors_1.length; _h++) {
                var to = neighbors_1[_h];
                var key = [from, to].sort().join('-');
                if (!seenEdges.has(key)) {
                    seenEdges.add(key);
                    edges.push({
                        id: "e-g-".concat(from, "-").concat(to),
                        from: from,
                        to: String(to),
                        directed: false
                    });
                }
            }
        }
        return {
            type: 'graph',
            nodes: nodes,
            edges: edges,
            message: "".concat(name, ": Graph Adjacency Layout")
        };
    }
    // 6. ARRAY DETECTOR
    var numArrays = Object.entries(vars)
        .filter(function (_a) {
        var k = _a[0], v = _a[1];
        return !k.startsWith('__') && Array.isArray(v) && v.length > 1 && typeof v[0] === 'number';
    });
    if (numArrays.length > 0) {
        var target = numArrays[0];
        if (preferredName) {
            var match_1 = numArrays.find(function (a) { return a[0] === preferredName; });
            if (match_1)
                target = match_1;
        }
        else {
            target = numArrays.reduce(function (best, cur) {
                return cur[1].length > best[1].length ? cur : best;
            });
        }
        var name = target[0], arr = target[1];
        var values_1 = arr.slice(0, 24);
        // Range pointers
        var rangeStart_1;
        var rangeEnd_1;
        var startCandidates = ['left', 'l', 'low', 'start'];
        var endCandidates = ['right', 'r', 'high', 'end'];
        var foundStart = startCandidates.find(function (p) { return typeof vars[p] === 'number' && vars[p] >= 0 && vars[p] < values_1.length; });
        if (foundStart !== undefined) {
            rangeStart_1 = vars[foundStart];
        }
        var foundEnd = endCandidates.find(function (p) { return typeof vars[p] === 'number' && vars[p] >= 0 && vars[p] < values_1.length; });
        if (foundEnd !== undefined) {
            rangeEnd_1 = vars[foundEnd];
        }
        // Pivot Index detection
        var pivotIndex_1;
        var pivotIdxCandidates = ['pivotIndex', 'pivotIdx', 'pi'];
        var foundPivotIdx = pivotIdxCandidates.find(function (p) { return typeof vars[p] === 'number' && vars[p] >= 0 && vars[p] < values_1.length; });
        if (foundPivotIdx !== undefined) {
            pivotIndex_1 = vars[foundPivotIdx];
        }
        else if (typeof vars['high'] === 'number' && vars['high'] >= 0 && vars['high'] < values_1.length) {
            if (vars['pivot'] !== undefined || lineCode.includes('pivot')) {
                pivotIndex_1 = vars['high'];
            }
        }
        // Dynamic pointer detection
        var pointer_1;
        var pointer2 = void 0;
        var ignoredNumNames_1 = new Set([
            'length', 'len', 'n', 'size', 'count', 'sum', 'total', 'max', 'min',
            'target', 'diff', 'curr', 'current', 'temp', 'val', 'value', 'ans', 'res', 'result', 'pivot',
            'maxLength', 'maxLen', 'maxlength', 'zeroCount', 'zerocount', 'ones', 'zeros',
            'comparisons', 'swaps', 'shifts', 'k', 'windowLen', 'windowSize',
            'complement', 'profit', 'maxProfit', 'minPrice', 'currentSum', 'maxSum',
            'key', 'depth', 'level', 'step', 'steps', 'windowSum'
        ]);
        var validIndices = Object.entries(vars)
            .filter(function (_a) {
            var k = _a[0], v = _a[1];
            return !k.startsWith('__') && !ignoredNumNames_1.has(k.toLowerCase()) && typeof v === 'number' && v >= 0 && v <= values_1.length;
        })
            .map(function (_a) {
            var k = _a[0], v = _a[1];
            return ({ name: k, val: v });
        });
        // Priority naming list for pointers
        var pointerPriority_1 = ['mid', 'm', 'left', 'l', 'right', 'r', 'i', 'j', 'p1', 'p2', 'idx', 'index'];
        validIndices.sort(function (a, b) {
            var idxA = pointerPriority_1.indexOf(a.name.toLowerCase());
            var idxB = pointerPriority_1.indexOf(b.name.toLowerCase());
            if (idxA !== -1 && idxB !== -1)
                return idxA - idxB;
            if (idxA !== -1)
                return -1;
            if (idxB !== -1)
                return 1;
            return 0;
        });
        if (validIndices.length > 0)
            pointer_1 = validIndices[0].val;
        if (validIndices.length > 1)
            pointer2 = validIndices[1].val;
        if (pointer_1 === undefined && rangeStart_1 !== undefined)
            pointer_1 = rangeStart_1;
        if (pointer2 === undefined && rangeEnd_1 !== undefined)
            pointer2 = rangeEnd_1;
        var pointerName = validIndices.length > 0 ? validIndices[0].name : foundStart || undefined;
        var pointer2Name = validIndices.length > 1 ? validIndices[1].name : foundEnd || undefined;
        // ── Array access parser (resolve arr[j], arr[j+1], arr[j-k], etc.) ──
        var accessedIndices_1 = new Set();
        var arrayAccessRegex = new RegExp("\\b".concat(name, "\\s*\\[([^\\]]+)\\]"), 'g');
        var match = void 0;
        while ((match = arrayAccessRegex.exec(lineCode)) !== null) {
            var indexExpr = match[1].trim();
            var idx = null;
            if (/^\d+$/.test(indexExpr)) {
                // Literal number: arr[0]
                idx = parseInt(indexExpr);
            }
            else if (vars[indexExpr] !== undefined && typeof vars[indexExpr] === 'number') {
                // Single variable: arr[j]
                idx = vars[indexExpr];
            }
            else {
                // Arithmetic: arr[j + 1] or arr[j - k]
                var arith = indexExpr.match(/^(\w+)\s*([+\-*])\s*(\w+)$/);
                if (arith) {
                    var leftName = arith[1];
                    var op = arith[2];
                    var rightName = arith[3];
                    // Resolve left operand
                    var leftVal = null;
                    if (/^\d+$/.test(leftName))
                        leftVal = parseInt(leftName);
                    else if (vars[leftName] !== undefined && typeof vars[leftName] === 'number')
                        leftVal = vars[leftName];
                    // Resolve right operand
                    var rightVal = null;
                    if (/^\d+$/.test(rightName))
                        rightVal = parseInt(rightName);
                    else if (vars[rightName] !== undefined && typeof vars[rightName] === 'number')
                        rightVal = vars[rightName];
                    if (leftVal !== null && rightVal !== null) {
                        if (op === '+')
                            idx = leftVal + rightVal;
                        else if (op === '-')
                            idx = leftVal - rightVal;
                        else if (op === '*')
                            idx = leftVal * rightVal;
                    }
                }
            }
            if (idx !== null && idx >= 0 && idx < values_1.length) {
                accessedIndices_1.add(idx);
            }
        }
        // ── Sliding window detection ──
        // When variable `k` (window size) exists, compute the window range dynamically.
        // IMPORTANT: The sliding phase only activates on lines that ACCESS the array.
        // This prevents the first loop's exit (i reaches k) from falsely triggering the sliding window.
        if (rangeStart_1 === undefined && rangeEnd_1 === undefined && typeof vars['k'] === 'number') {
            var kVal = vars['k'];
            if (kVal > 0 && kVal < values_1.length) {
                // Collect ALL valid loop indices to find the furthest-along pointer
                var allLoopVals = validIndices.map(function (vi) { return vi.val; });
                var maxLoopVal = allLoopVals.length > 0 ? Math.max.apply(Math, allLoopVals) : -1;
                if (maxLoopVal >= kVal && accessedIndices_1.size > 0) {
                    // Sliding phase: the window is [maxLoopVal - k + 1 .. maxLoopVal]
                    // Only activates when the line actually accesses the array (e.g. arr[j-k] or arr[j])
                    rangeStart_1 = maxLoopVal - kVal + 1;
                    rangeEnd_1 = maxLoopVal;
                }
                else if (maxLoopVal >= 0 && maxLoopVal < kVal) {
                    // Build phase: the window is growing from [0 .. maxLoopVal]
                    rangeStart_1 = 0;
                    rangeEnd_1 = maxLoopVal;
                }
            }
        }
        var isWindow_1 = rangeStart_1 !== undefined && rangeEnd_1 !== undefined && rangeEnd_1 >= rangeStart_1;
        // Detect if this line is an actual element swap
        var isSwapLine_1 = ((lineCode.includes('swap') || lineCode.includes('temp')) ||
            (/\[.*\]\s*=/.test(lineCode) && accessedIndices_1.size >= 2));
        var nodes = values_1.map(function (v, idx) {
            var highlight = 'none';
            if (isWindow_1 && rangeStart_1 !== undefined && rangeEnd_1 !== undefined) {
                // Window mode: elements in window are 'active', elements accessed on this line are 'comparing'
                if (idx >= rangeStart_1 && idx <= rangeEnd_1)
                    highlight = 'active';
                // Elements outside the window that were previously inside are 'visited'
                if (idx < rangeStart_1)
                    highlight = 'visited';
                // Accessed elements get highlighted over the base window color
                if (accessedIndices_1.has(idx))
                    highlight = 'comparing';
            }
            else {
                if (idx === pivotIndex_1) {
                    highlight = 'pivot';
                }
                else if (accessedIndices_1.has(idx)) {
                    highlight = isSwapLine_1 ? 'swapping' : 'comparing';
                }
                else if (idx === pointer_1) {
                    highlight = 'active';
                }
                else if (rangeStart_1 !== undefined && rangeEnd_1 !== undefined && (idx < rangeStart_1 || idx > rangeEnd_1)) {
                    highlight = 'visited';
                }
            }
            return {
                id: "n".concat(idx),
                value: v,
                highlight: highlight,
            };
        });
        var hashInfo = detectHashTableInfo(vars, name);
        var detectedStackVar = Object.entries(vars).find(function (_a) {
            var k = _a[0], v = _a[1];
            return k.toLowerCase().includes('stack') && Array.isArray(v);
        });
        var stackItems = detectedStackVar ? __spreadArray([], detectedStackVar[1], true) : undefined;
        return {
            type: 'array',
            nodes: nodes,
            pointer: pointer_1,
            pointerName: pointerName,
            pointer2: pointer2,
            pointer2Name: pointer2Name,
            rangeStart: rangeStart_1,
            rangeEnd: rangeEnd_1,
            pivotIndex: pivotIndex_1,
            message: "".concat(name, ": [").concat(values_1.join(', '), "]"),
            hashTable: hashInfo === null || hashInfo === void 0 ? void 0 : hashInfo.table,
            arrayName: name,
            hashTableName: hashInfo === null || hashInfo === void 0 ? void 0 : hashInfo.name,
            hashTableLabel: hashInfo === null || hashInfo === void 0 ? void 0 : hashInfo.label,
            stackItems: stackItems,
            stackName: detectedStackVar ? detectedStackVar[0] : undefined
        };
    }
    // 7. STRING DETECTOR
    var strEntries = Object.entries(vars)
        .filter(function (_a) {
        var k = _a[0], v = _a[1];
        return !k.startsWith('__') && typeof v === 'string' && v.length > 0;
    });
    if (strEntries.length > 0) {
        var _j = strEntries[0], name = _j[0], str = _j[1];
        var chars_1 = str.split('').slice(0, 20);
        // Extract range start/end if present
        var rangeStart_2;
        var rangeEnd_2;
        var startCandidates = ['left', 'l', 'low', 'start'];
        var endCandidates = ['right', 'r', 'high', 'end'];
        var foundStart = startCandidates.find(function (p) { return typeof vars[p] === 'number' && vars[p] >= 0 && vars[p] < chars_1.length; });
        if (foundStart !== undefined) {
            rangeStart_2 = vars[foundStart];
        }
        var foundEnd = endCandidates.find(function (p) { return typeof vars[p] === 'number' && vars[p] >= 0 && vars[p] < chars_1.length; });
        if (foundEnd !== undefined) {
            rangeEnd_2 = vars[foundEnd];
        }
        // Dynamic pointer detection for strings
        var pointer_2;
        var pointer2_1;
        var ignoredNumNames_2 = new Set([
            'length', 'len', 'n', 'size', 'count', 'sum', 'total', 'max', 'min',
            'target', 'diff', 'curr', 'current', 'temp', 'val', 'value', 'ans', 'res', 'result', 'pivot',
            'maxLength', 'maxLen', 'maxlength', 'zeroCount', 'zerocount', 'ones', 'zeros',
            'comparisons', 'swaps', 'shifts', 'k', 'windowLen', 'windowSize',
            'complement', 'profit', 'maxProfit', 'minPrice', 'currentSum', 'maxSum',
            'key', 'depth', 'level', 'step', 'steps'
        ]);
        var validIndices = Object.entries(vars)
            .filter(function (_a) {
            var k = _a[0], v = _a[1];
            return !k.startsWith('__') && !ignoredNumNames_2.has(k.toLowerCase()) && typeof v === 'number' && v >= 0 && v <= chars_1.length;
        })
            .map(function (_a) {
            var k = _a[0], v = _a[1];
            return ({ name: k, val: v });
        });
        // Priority naming list for pointers
        var pointerPriority_2 = ['mid', 'm', 'left', 'l', 'right', 'r', 'i', 'j', 'p1', 'p2', 'idx', 'index'];
        validIndices.sort(function (a, b) {
            var idxA = pointerPriority_2.indexOf(a.name.toLowerCase());
            var idxB = pointerPriority_2.indexOf(b.name.toLowerCase());
            if (idxA !== -1 && idxB !== -1)
                return idxA - idxB;
            if (idxA !== -1)
                return -1;
            if (idxB !== -1)
                return 1;
            return 0; // maintain original order for others
        });
        if (validIndices.length > 0)
            pointer_2 = validIndices[0].val;
        if (validIndices.length > 1)
            pointer2_1 = validIndices[1].val;
        if (pointer_2 === undefined && rangeStart_2 !== undefined)
            pointer_2 = rangeStart_2;
        if (pointer2_1 === undefined && rangeEnd_2 !== undefined)
            pointer2_1 = rangeEnd_2;
        var pointerName = validIndices.length > 0 ? validIndices[0].name : foundStart || undefined;
        var pointer2Name = validIndices.length > 1 ? validIndices[1].name : foundEnd || undefined;
        var isWindow_2 = rangeStart_2 !== undefined && rangeEnd_2 !== undefined && rangeEnd_2 >= rangeStart_2;
        var hashInfo = detectHashTableInfo(vars, name);
        var detectedStackVar = Object.entries(vars).find(function (_a) {
            var k = _a[0], v = _a[1];
            return k.toLowerCase().includes('stack') && Array.isArray(v);
        });
        var stackItems = detectedStackVar ? __spreadArray([], detectedStackVar[1], true) : undefined;
        return {
            type: 'string',
            nodes: chars_1.map(function (c, i) {
                var highlight = 'none';
                if (isWindow_2 && rangeStart_2 !== undefined && rangeEnd_2 !== undefined) {
                    if (i >= rangeStart_2 && i <= rangeEnd_2)
                        highlight = 'active';
                    if (i === pointer_2 || i === pointer2_1)
                        highlight = 'comparing';
                }
                else {
                    highlight = i === pointer_2 ? 'comparing' : i === pointer2_1 ? 'comparing' : 'none';
                }
                return {
                    id: "c".concat(i),
                    value: c,
                    highlight: highlight
                };
            }),
            pointer: pointer_2,
            pointerName: pointerName,
            pointer2: pointer2_1,
            pointer2Name: pointer2Name,
            rangeStart: rangeStart_2,
            rangeEnd: rangeEnd_2,
            message: "".concat(name, " = \"").concat(str, "\""),
            hashTable: hashInfo === null || hashInfo === void 0 ? void 0 : hashInfo.table,
            arrayName: name,
            hashTableName: hashInfo === null || hashInfo === void 0 ? void 0 : hashInfo.name,
            hashTableLabel: hashInfo === null || hashInfo === void 0 ? void 0 : hashInfo.label,
            stackItems: stackItems,
            stackName: detectedStackVar ? detectedStackVar[0] : undefined
        };
    }
    // 8. HASHMAP DETECTOR
    var mapEntry = Object.entries(vars).find(function (_a) {
        var v = _a[1];
        return v instanceof Map;
    });
    if (mapEntry) {
        var name = mapEntry[0], mapObj = mapEntry[1];
        var table_4 = {};
        mapObj.forEach(function (v, k) { table_4[String(k)] = v; });
        return {
            type: 'hashmap', nodes: [], hashTable: table_4,
            message: "".concat(name, ": ").concat(mapObj.size, " entries"),
            hashTableName: name,
            hashTableLabel: 'key → value'
        };
    }
    var objEntry = Object.entries(vars).find(function (_a) {
        var k = _a[0], v = _a[1];
        return !k.startsWith('__') && typeof v === 'object' && v !== null && !Array.isArray(v) &&
            !(v instanceof Map) && !(v instanceof Set) &&
            Object.values(v).some(function (val) { return typeof val === 'number'; });
    });
    if (objEntry) {
        var name = objEntry[0], obj = objEntry[1];
        var table_5 = {};
        Object.entries(obj)
            .filter(function (_a) {
            var v = _a[1];
            return typeof v === 'number';
        })
            .slice(0, 20)
            .forEach(function (_a) {
            var k = _a[0], v = _a[1];
            table_5[k] = v;
        });
        return {
            type: 'hashmap', nodes: [], hashTable: table_5,
            message: "".concat(name, ": ").concat(Object.keys(table_5).length, " entries"),
            hashTableName: name,
            hashTableLabel: 'key → value'
        };
    }
    return undefined;
}
