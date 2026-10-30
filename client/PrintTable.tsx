import city from './assets/memories/city-walk.jpg';
import picnic from './assets/memories/picnic.jpg';
import birthday from './assets/memories/birthday.jpg';
import train from './assets/memories/train-journey.jpg';
import pizza from './assets/memories/pizza-night.jpg';
import concert from './assets/memories/concert.jpg';

/*
 * The homepage "table": a handful of prints dealt onto the paper, each with a
 * hint of the hidden back. Pure CSS motion (deal-in, hover lift, focus pull),
 * no animation loop, and all of it disabled for reduced-motion users.
 */
const prints = [
  { src: picnic, note: 'when was this?', kind: 'quiz' },
  { src: birthday, note: 'true or false?', kind: 'bluff' },
  { src: concert, note: 'who has the blur?', kind: 'impostor' },
  { src: train, note: '', kind: 'plain' },
  { src: pizza, note: '', kind: 'plain' },
  { src: city, note: '', kind: 'plain' },
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

export function PrintTable() {
  return (
    <div className="print-table" aria-hidden="true">
      {prints.map((p, i) => (
        <figure className={`table-print table-print-${i} kind-${p.kind}`} key={i}>
          <span className="table-print-photo">
            <img src={p.src} alt="" decoding="async" draggable={false} />
          </span>
          {p.kind === 'quiz' ? <span className="date-stamp crossed">'?? ?? ??</span> : null}
          {p.note ? <figcaption className="handwritten">{p.note}</figcaption> : null}
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
