import { useEffect, useRef, useState } from 'react';
import city from './assets/memories/city-walk.jpg';
import picnic from './assets/memories/picnic.jpg';
import birthday from './assets/memories/birthday.jpg';
import train from './assets/memories/train-journey.jpg';
import pizza from './assets/memories/pizza-night.jpg';
import beach from './assets/memories/beach-sunset.jpg';
import concert from './assets/memories/concert.jpg';
import credits from './assets/memories/credits.json';

const photos = [city, picnic, birthday, train, pizza, beach, concert];
const slots = [0, 3, 1, 5, 2, 6, 4, 0, 5, 3, 1, 6];
const shapes = [1.16, 0.83, 1.12, 0.88, 1.25, 0.9, 1.1, 0.8, 1.2, 0.92, 1.14, 0.82];

export function MemoryRiver() {
  const river = useRef<HTMLDivElement>(null);
  const elapsed = useRef(0);
  const [paused, setPaused] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = (event: MediaQueryListEvent) => {
      if (event.matches) setPaused(true);
    };
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const element = river.current!;
    const cards = [...element.querySelectorAll<HTMLElement>('.photo-memory')];
    let width = 0,
      height = 0,
      mobile = false;
    let lastTime: number | null = null,
      paintedAt = 0,
      animation = 0;
    let visible = true;
    function paint() {
      if (!width || !height) return;
      const phase = elapsed.current / (mobile ? 100 : 118);
      cards.forEach((card, i) => {
        card.hidden = mobile && i >= 8;
        if (card.hidden) return;
        const u = ((i + 0.35) / (mobile ? 8 : cards.length) + phase) % 1;
        const lane = i % 2 === 0 ? -1 : 1;
        let x: number, y: number, cardWidth: number, cardHeight: number;
        if (mobile) {
          cardWidth = Math.min(118, height * 0.73) + (i % 3) * 10;
          cardHeight = Math.min(cardWidth * (shapes[i] > 1 ? 0.98 : 0.8), height * 0.68);
          x = (u * 1.7 - 0.35) * width;
          y = height * 0.5 + Math.sin(u * Math.PI * 2) * height * 0.07 + lane * height * 0.035;
        } else {
          cardWidth = Math.min(182, width * 0.27) * [0.94, 1.08, 0.92, 1.03][i % 4];
          cardHeight = cardWidth * shapes[i];
          x = width * (0.49 + 0.21 * Math.sin((u * 2 - 0.5) * Math.PI) + lane * 0.145);
          y = (1.24 - u * 1.5) * height;
        }
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;
        card.style.transform = `translate3d(${x - cardWidth / 2}px, ${y - cardHeight / 2}px, 0) rotate(${[-4, 3, -2, 4, -3, 2][i % 6]}deg)`;
      });
    }
    function measure() {
      width = element.clientWidth;
      height = element.clientHeight;
      mobile = height < 250;
      paint();
    }
    function tick(now: number) {
      if (paused || document.hidden || !visible) {
        lastTime = null;
        return;
      }
      if (lastTime !== null) elapsed.current += Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (now - paintedAt >= 1000 / 30) {
        paint();
        paintedAt = now;
      }
      animation = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(animation);
      lastTime = null;
      if (!paused && !document.hidden && visible) animation = requestAnimationFrame(tick);
    }
    const resize = new ResizeObserver(measure);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    resize.observe(element);
    intersection.observe(element);
    document.addEventListener('visibilitychange', sync);
    measure();
    sync();
    return () => {
      cancelAnimationFrame(animation);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [paused]);
  return (
    <>
      <div className="photo-river" ref={river} aria-hidden="true">
        {slots.map((index, slot) => (
          <figure
            className="photo-memory"
            data-photo={index === 5 ? 'beach' : undefined}
            key={slot}
          >
            <img src={photos[index]} alt="" decoding="async" draggable={false} />
          </figure>
        ))}
      </div>
      <button
        type="button"
        className="photo-motion"
        data-paused={paused}
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? 'Play photo motion' : 'Pause photo motion'}
      >
        <span className="photo-motion-icon" aria-hidden="true" />
        {paused ? 'Play motion' : 'Pause motion'}
      </button>
    </>
  );
}

export function PhotoCredits() {
  return (
    <details className="photo-credits">
      <summary>Sample photo credits</summary>
      <p>Stock photos set the scene. Your game uploads stay private.</p>
      <ul>
        {credits.photos.map((photo) => (
          <li key={photo.file}>
            <a href={photo.source} target="_blank" rel="noreferrer">
              {photo.photographer} / {photo.license === 'Unsplash License' ? 'Unsplash' : 'Pexels'}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
