// Pointer-only gallery navigation. Routes belong exclusively to the
// underlined caption link; taps and drags on artwork only change the slide.
export function createGalleryInteractions({
  page, field, layer, cursor, getSlides, getCurrent, onStep, onHold, onResume,
}) {
  let gesture = null;
  let peek = null;
  let settle = null;

  function enabled() {
    return !page.hasAttribute('data-opening')
      && !page.hasAttribute('data-book')
      && page.dataset.view !== 'detail'
      && getSlides().length > 1
      && !document.querySelector('#cv')?.open;
  }

  function showCursor(event) {
    if (event.pointerType === 'touch' || !enabled()) {
      layer.removeAttribute('data-hover');
      return;
    }
    const box = layer.getBoundingClientRect();
    if (!box.width || !box.height) return;
    layer.style.setProperty('--cursor-x', (event.clientX - box.left) + 'px');
    layer.style.setProperty('--cursor-y', (event.clientY - box.top) + 'px');
    cursor.textContent = event.clientX < box.left + box.width / 2 ? '←' : '→';
    layer.dataset.hover = 'true';
  }

  function clearPeek() {
    if (!peek) return;
    peek.element.classList.remove('is-peek');
    peek = null;
  }

  function restore(animate = false) {
    if (settle) { settle.cancel(); settle = null; }
    if (!gesture) {
      clearPeek();
      return;
    }
    const { element, dx } = gesture;
    element.style.removeProperty('transform');
    clearPeek();
    if (animate && Math.abs(dx) > 4 && element.isConnected) {
      settle = element.animate([
        { transform: `translate3d(${dx}px, 0, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ], { duration: 340, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      const animation = settle;
      animation.finished.then(() => { if (settle === animation) settle = null; }).catch(() => {});
    }
    gesture = null;
  }

  function choosePeek(direction) {
    const items = getSlides();
    const current = getCurrent();
    const index = items.indexOf(current);
    if (index < 0 || items.length < 2) return;
    const next = items[(index + direction + items.length) % items.length];
    if (peek?.slide === next) return;
    clearPeek();
    if (!next || next === current) return;
    const element = next.element;
    if (!element.isConnected) field.append(element);
    const preview = next.preview;
    if (preview && !preview.hasAttribute('src')) preview.src = next.project.cover;
    element.setAttribute('aria-hidden', 'true');
    element.classList.add('is-peek');
    peek = { slide: next, element };
  }

  function down(event) {
    if (!enabled() || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const slide = getCurrent();
    if (!slide?.element?.isConnected) return;
    if (settle) { settle.cancel(); settle = null; }
    gesture = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      dx: 0, dy: 0, dragging: false, element: slide.element,
    };
    onHold();
    layer.setPointerCapture(event.pointerId);
    showCursor(event);
  }

  function move(event) {
    showCursor(event);
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture.dx = dx;
    gesture.dy = dy;
    if (!gesture.dragging && Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      gesture.dragging = true;
      layer.dataset.dragging = 'true';
    }
    if (!gesture.dragging) return;

    // The current artwork follows the finger / mouse; the neighbouring
    // project is exposed underneath without changing the grey stage size.
    gesture.element.style.transform = `translate3d(${dx}px, 0, 0)`;
    if (Math.abs(dx) > 15) choosePeek(dx < 0 ? 1 : -1);
    event.preventDefault();
  }

  function end(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    const dragged = gesture.dragging;
    const distance = Math.max(44, layer.clientWidth * .12);
    const isSwipe = dragged && Math.abs(dx) >= distance
      && Math.abs(dx) > Math.abs(dy) * 1.15;

    if (isSwipe && enabled()) {
      // Keep the actual drag offset and the revealed neighbour on screen.
      // The gallery transition receives this frame and continues FROM it.
      const handoff = { element: gesture.element, offset: dx };
      gesture = null;
      layer.removeAttribute('data-dragging');
      if (layer.hasPointerCapture(event.pointerId)) layer.releasePointerCapture(event.pointerId);
      onStep(dx < 0 ? 1 : -1, true, handoff);
      return;
    }

    restore(dragged);
    layer.removeAttribute('data-dragging');
    if (layer.hasPointerCapture(event.pointerId)) layer.releasePointerCapture(event.pointerId);
    if (!enabled()) { onResume(); return; }

    if (!dragged && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const box = layer.getBoundingClientRect();
      onStep(event.clientX < box.left + box.width / 2 ? -1 : 1);
    } else {
      onResume();
    }
  }

  function cancel() {
    const id = gesture?.id;
    restore(true);
    layer.removeAttribute('data-dragging');
    if (id != null && layer.hasPointerCapture(id)) layer.releasePointerCapture(id);
    onResume();
  }

  layer.addEventListener('pointerenter', showCursor);
  layer.addEventListener('pointermove', move);
  layer.addEventListener('pointerdown', down);
  layer.addEventListener('pointerup', end);
  layer.addEventListener('pointercancel', cancel);
  layer.addEventListener('lostpointercapture', () => {
    if (gesture) cancel();
  });
  layer.addEventListener('pointerleave', () => {
    if (!gesture) layer.removeAttribute('data-hover');
  });
  layer.addEventListener('dragstart', (event) => event.preventDefault());

  return { reset: () => { restore(); layer.removeAttribute('data-hover'); layer.removeAttribute('data-dragging'); } };
}
