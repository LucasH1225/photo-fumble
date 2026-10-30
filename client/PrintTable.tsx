import { useEffect, useRef, useState } from 'react';
import city from './assets/memories/city-walk.jpg';
import picnic from './assets/memories/picnic.jpg';
import birthday from './assets/memories/birthday.jpg';
import train from './assets/memories/train-journey.jpg';
import pizza from './assets/memories/pizza-night.jpg';
import concert from './assets/memories/concert.jpg';

/*
 * The homepage "table": a handful of prints dealt onto the paper, each with a
 * hint of the hidden back. Prints sway slowly, the table shifts a little with
 * the cursor, and now and then one print turns over to show what's written on
 * its back. All of it is off for reduced-motion users.
 */
const prints = [
  { src: picnic, note: 'when was this?', kind: 'quiz', back: 'aug 2021 — the wasp one' },
  { src: birthday, note: 'true or false?', kind: 'bluff', back: 'true. she cried.' },
  { src: concert, note: 'who has the blur?', kind: 'impostor', back: '' },
  { src: train, note: '', kind: 'plain', back: 'wrong train, right people' },
  { src: pizza, note: '', kind: 'plain', back: '3 pizzas, 2 people' },
  { src: city, note: '', kind: 'plain', back: 'lost, again' },
];

/*
 * Face-down prints already lying on the table, peeking in from the edges
 * behind the dealt prints and the form.
 */
export function TableSurface() {
  return (
    <div className="table-surface" aria-hidden="true">
      <span className="table-back table-back-0">
        <span className="handwritten">ibiza '24</span>
      </span>
      <span className="table-back table-back-1">
        <span className="handwritten">don't show mum</span>
      </span>
    </div>
  );
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PrintTable() {
  const ref = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState<number | null>(null);

  // Turn one visible print over at a time, never the one under the cursor.
  useEffect(() => {
    const root = ref.current!;
    let timer = 0;
    let last = -1;
    const flipNext = () => {
      const choices = [...root.querySelectorAll<HTMLElement>('[data-back]')].filter(
        (el) => el.offsetParent !== null && !el.matches(':hover') && Number(el.dataset.index) !== last,
      );
      if (document.hidden || reducedMotion() || !choices.length) {
        timer = window.setTimeout(flipNext, 3000);
        return;
      }
      last = Number(choices[Math.floor(Math.random() * choices.length)].dataset.index);
      setFlipped(last);
      timer = window.setTimeout(() => {
        setFlipped(null);
        timer = window.setTimeout(flipNext, 4000 + Math.random() * 2500);
      }, 2600);
    };
    timer = window.setTimeout(flipNext, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Shift the table slightly against the cursor; the layer behind moves less.
  useEffect(() => {
    const layer = ref.current!.parentElement!;
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let x = 0;
    let y = 0;
    const move = (e: PointerEvent) => {
      x = (e.clientX / innerWidth) * 2 - 1;
      y = (e.clientY / innerHeight) * 2 - 1;
      if (frame || !pointer.matches || reducedMotion()) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        layer.style.setProperty('--px', x.toFixed(3));
        layer.style.setProperty('--py', y.toFixed(3));
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(frame);
      layer.style.removeProperty('--px');
      layer.style.removeProperty('--py');
    };
  }, []);

  return (
    <div className="print-table" aria-hidden="true" ref={ref}>
      {prints.map((p, i) => (
        <figure
          className={`table-print table-print-${i} kind-${p.kind}`}
          key={i}
          data-index={i}
          data-back={p.back ? '' : undefined}
        >
          <span className={`table-print-card${flipped === i ? ' flipped' : ''}`}>
            <span className="table-print-face">
              <span className="table-print-photo">
                <img src={p.src} alt="" decoding="async" draggable={false} />
              </span>
              {p.kind === 'quiz' ? <span className="date-stamp crossed">'?? ?? ??</span> : null}
              {p.note ? <span className="table-print-note handwritten">{p.note}</span> : null}
            </span>
            {p.back ? (
              <span className="table-print-face table-print-reverse">
                <span className="handwritten">{p.back}</span>
              </span>
            ) : null}
          </span>
        </figure>
      ))}
      <span className="table-tape">
        <span className="tape-reel" />
        <span className="tape-reel" />
        <span className="tape-wave">
          {[22, 40, 28, 48, 32, 44, 20, 36].map((h, i) => (
            <span key={i} style={{ height: h, animationDelay: `${i * 0.11}s` }} />
          ))}
        </span>
      </span>
      <span className="table-chat">
        <span className="ink-bar" />
        <span className="bubble">are you awake</span>
        <span className="bubble mine">the goat is back</span>
      </span>
    </div>
  );
}
