/**
 * Intersection Observer action for scroll-triggered animations.
 *
 * Fires a callback when the element enters or leaves the viewport.
 * Used throughout the demo walkthrough for scroll-triggered reveals.
 *
 * @example
 * <div use:inview={(visible) => show = visible}>
 */
export function inview(
  node: HTMLElement,
  callback: (visible: boolean) => void,
) {
  const observer = new IntersectionObserver(
    ([entry]) => callback(entry.isIntersecting),
    {
      threshold: 0.25,
    },
  );
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}
