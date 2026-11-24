var SlokamritaWordLinks = (() => { const exports = {};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindWordLinks = bindWordLinks;
function bindWordLinks(root, initial = {}) {
    let enabled = false, scope = '', hover = '', focus = '', pinned = '', disposed = false;
    let down = null;
    let tapKey = '', tapTime = 0;
    const selector = '[data-word-link]';
    const hit = (node) => node instanceof Element ? node.closest(selector) : null;
    const keyOf = (node) => { const n = hit(node); return n && root.contains(n) ? n.dataset.wordLink || '' : ''; };
    const paint = () => {
        if (disposed)
            return;
        const key = enabled ? hover || focus || pinned : '';
        root.dataset.activeWordLink = key;
        root.querySelectorAll(selector + ',.word-link-active').forEach(n => {
            n.classList.toggle('word-link-active', !!key && n.dataset.wordLink === key);
            if (!n.hasAttribute('data-word-link')) {
                n.removeAttribute('tabindex');
                n.removeAttribute('role');
            }
        });
    };
    const clear = () => { hover = focus = pinned = ''; down = null; tapKey = ''; paint(); };
    const over = (e) => { if (e.pointerType !== 'touch') {
        hover = keyOf(e.target);
        paint();
    } };
    const out = (e) => { if (e.pointerType !== 'touch') {
        hover = keyOf(e.relatedTarget);
        paint();
    } };
    const leave = () => { hover = ''; paint(); };
    const focusIn = (e) => { focus = e.target instanceof Element && e.target.matches(':focus-visible') ? keyOf(e.target) : ''; paint(); };
    const focusOut = () => { focus = ''; paint(); };
    const pointerDown = (e) => {
        if (!e.isPrimary)
            return;
        down = { x: e.clientX, y: e.clientY, key: keyOf(e.target), touch: e.pointerType === 'touch', drag: false };
        tapKey = '';
    };
    const pointerMove = (e) => {
        if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
            down.drag = true;
            pinned = hover = '';
            paint();
        }
    };
    const pointerUp = () => {
        if (down?.touch && !down.drag && enabled) {
            const key = down.key;
            tapKey = key;
            tapTime = performance.now();
            queueMicrotask(() => { if (!disposed) {
                pinned = pinned === key ? '' : key;
                hover = '';
                paint();
            } });
        }
        down = null;
    };
    const cancel = () => { down = null; tapKey = ''; };
    const click = (e) => {
        const key = keyOf(e.target) || (performance.now() - tapTime < 750 ? tapKey : '');
        if (enabled && key) {
            const selection = root.ownerDocument.defaultView?.getSelection();
            if (selection && !selection.isCollapsed)
                return;
            e.preventDefault();
            e.stopPropagation();
        }
        else if (!key) {
            pinned = '';
            paint();
        }
        tapKey = '';
    };
    const keyboard = (e) => {
        if (!enabled)
            return;
        if (e.key === 'Escape' && (hover || focus || pinned)) {
            clear();
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        const key = keyOf(e.target);
        if (key && (e.key === 'Enter' || e.key === ' ')) {
            pinned = pinned === key ? '' : key;
            e.preventDefault();
            e.stopPropagation();
            paint();
        }
    };
    const listeners = [
        ['pointerover', over, false], ['pointerout', out, false], ['pointerleave', leave, false],
        ['focusin', focusIn, false], ['focusout', focusOut, false], ['pointerdown', pointerDown, true],
        ['pointermove', pointerMove, true], ['pointerup', pointerUp, true], ['pointercancel', cancel, true],
        ['click', click, true], ['keydown', keyboard, true],
    ];
    listeners.forEach(([name, fn, capture]) => root.addEventListener(name, fn, capture));
    const refresh = (options) => {
        if (options.scope !== scope) {
            hover = focus = pinned = '';
            scope = options.scope || '';
        }
        enabled = options.enabled !== false;
        root.dataset.wordLinks = enabled ? 'on' : 'off';
        root.querySelectorAll(selector).forEach(n => {
            if (enabled) {
                n.tabIndex = 0;
                n.setAttribute('role', 'button');
            }
            else {
                n.removeAttribute('tabindex');
                n.removeAttribute('role');
            }
        });
        if (!enabled)
            clear();
        else
            paint();
    };
    refresh(initial);
    return { refresh, clear, destroy: () => {
            clear();
            disposed = true;
            listeners.forEach(([name, fn, capture]) => root.removeEventListener(name, fn, capture));
            delete root.dataset.wordLinks;
            root.querySelectorAll(selector).forEach(n => { n.removeAttribute('tabindex'); n.removeAttribute('role'); });
        } };
}

return exports; })();
