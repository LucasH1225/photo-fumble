(() => {
  const river = document.getElementById('river');
  const layer = document.getElementById('river-photos');
  const frame = document.getElementById('preview-frame');
  const motionButton = document.getElementById('motion-toggle');
  const motionLabel = document.getElementById('motion-label');
  const feedback = document.getElementById('preview-feedback');
  const formPreview = document.getElementById('form-preview');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const params = new URLSearchParams(window.location.search);
  const photos = [
    'city-walk',
    'picnic',
    'birthday',
    'train-journey',
    'pizza-night',
    'beach-sunset',
    'concert',
  ];
  const slots = [0, 3, 1, 5, 2, 6, 4, 0, 5, 3, 1, 6];
  const shapes = [1.16, 0.83, 1.12, 0.88, 1.25, 0.9, 1.1, 0.8, 1.2, 0.92, 1.14, 0.82];
  const cards = slots.map((photoIndex, i) => {
    const card = document.createElement('figure');
    card.className = 'memory';
    card.dataset.photo = photos[photoIndex];
    const image = document.createElement('img');
    image.src = `../river-join/assets/${photos[photoIndex]}.jpg`;
    image.alt = '';
    image.decoding = 'async';
    image.draggable = false;
    card.appendChild(image);
    layer.appendChild(card);
    return {
      card,
      shape: shapes[i],
      lane: i % 2 === 0 ? -1 : 1,
      tilt: [-4, 3, -2, 4, -3, 2][i % 6],
    };
  });

  let width = 0;
  let height = 0;
  let mobile = false;
  let elapsed = 0;
  let lastTime = null;
  let animation = null;
  let paused = reducedMotion.matches || params.get('still') === '1';

  function measure() {
    width = river.clientWidth;
    height = river.clientHeight;
    mobile = height < 250;
    paint();
  }

  function paint() {
    if (!width || !height) return;
    const phase = elapsed / (mobile ? 100 : 118);
    cards.forEach(({ card, shape, lane, tilt }, i) => {
      card.hidden = mobile && i >= 8;
      if (card.hidden) return;
      const u = ((i + 0.35) / (mobile ? 8 : cards.length) + phase) % 1;
      let x, y, cardWidth, cardHeight;
      if (mobile) {
        // A shallow sideways current keeps the join action close on small screens.
        cardWidth = Math.min(118, height * 0.73) + (i % 3) * 10;
        cardHeight = Math.min(cardWidth * (shape > 1 ? 0.98 : 0.8), height * 0.68);
        x = (u * 1.7 - 0.35) * width;
        y = height * 0.5 + Math.sin(u * Math.PI * 2) * height * 0.07 + lane * height * 0.035;
      } else {
        cardWidth = Math.min(182, width * 0.27) * [0.94, 1.08, 0.92, 1.03][i % 4];
        cardHeight = cardWidth * shape;
        // Both banks follow one continuous S bend, rising from below the viewport.
        x = width * (0.49 + 0.21 * Math.sin((u * 2 - 0.5) * Math.PI) + lane * 0.145);
        y = (1.24 - u * 1.5) * height;
      }
      card.style.width = `${cardWidth}px`;
      card.style.height = `${cardHeight}px`;
      card.style.transform = `translate3d(${x - cardWidth / 2}px, ${y - cardHeight / 2}px, 0) rotate(${tilt}deg)`;
    });
  }

  function tick(now) {
    animation = null;
    if (paused || document.hidden) {
      lastTime = null;
      return;
    }
    if (lastTime !== null) elapsed += Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    paint();
    animation = requestAnimationFrame(tick);
  }

  function syncMotion() {
    if (animation !== null) cancelAnimationFrame(animation);
    animation = null;
    lastTime = null;
    motionButton.dataset.paused = String(paused);
    motionButton.setAttribute('aria-label', paused ? 'Play photo motion' : 'Pause photo motion');
    motionLabel.textContent = paused ? 'Play motion' : 'Pause motion';
    if (!paused && !document.hidden) animation = requestAnimationFrame(tick);
  }

  motionButton.addEventListener('click', () => {
    paused = !paused;
    syncMotion();
  });
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      paused = true;
      syncMotion();
    }
  });
  document.addEventListener('visibilitychange', syncMotion);

  document.querySelectorAll('[data-device]').forEach((button) => {
    if (button.tagName !== 'BUTTON') return;
    button.addEventListener('click', () => {
      frame.dataset.device = button.dataset.device;
      document
        .querySelectorAll('button[data-device]')
        .forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    });
  });
  if (params.get('phone') === '1') document.querySelector('button[data-device="phone"]').click();

  document.getElementById('join-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('nickname').value.trim();
    feedback.textContent = name
      ? `Preview confirmed for ${name}. No game session was created.`
      : 'Enter a nickname to try the join preview.';
    formPreview.hidden = false;
    formPreview.textContent = name
      ? `Ready, ${name}. This is a preview of joining.`
      : 'Enter a nickname to try the join preview.';
  });
  document.querySelector('.brand').addEventListener('click', (event) => event.preventDefault());

  new ResizeObserver(measure).observe(river);
  measure();
  syncMotion();
})();

(() => {
  const palettes = {
    petrol: [
      'Petrol + ivory: calm, rich colour that gives both warm and cool photographs room to stand out.',
      '#173B46',
      '#F0E4C8',
      '#FBF8EF',
    ],
    ivory: [
      'Ivory + cobalt: brighter and more playful. The photos feel like prints arranged on a light album page.',
      '#F6F3EB',
      '#3048A5',
      '#202E52',
    ],
    brick: [
      'Brick + peach: warm and nostalgic, with the feeling of an evening around the table with friends.',
      '#5A2927',
      '#F5D9C3',
      '#FFF3E8',
    ],
    plum: [
      'Current plum: the existing After Hours palette, kept here for a direct comparison.',
      '#2D2038',
      '#D9C9F3',
      '#FFF9FF',
    ],
  };
  document.querySelectorAll('[data-palette-choice]').forEach((button) =>
    button.addEventListener('click', () => {
      const key = button.dataset.paletteChoice;
      document.documentElement.dataset.palette = key;
      document
        .querySelectorAll('[data-palette-choice]')
        .forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      document.getElementById('palette-note').textContent = palettes[key][0];
      ['base', 'accent', 'paper'].forEach(
        (role, index) =>
          (document.getElementById(`hex-${role}`).textContent = palettes[key][index + 1]),
      );
      document.querySelector('meta[name="theme-color"]').content = palettes[key][1];
    }),
  );
  const join = document.getElementById('join-tab'),
    create = document.getElementById('create-tab');
  function entry(isCreate) {
    join.setAttribute('aria-pressed', String(!isCreate));
    create.setAttribute('aria-pressed', String(isCreate));
    document.getElementById('code-field').hidden = isCreate;
    document.getElementById('room-code').required = !isCreate;
    document.querySelector('.join-button').textContent = isCreate ? 'Create room' : 'Join room';
    document.getElementById('form-preview').hidden = true;
  }
  join.addEventListener('click', () => entry(false));
  create.addEventListener('click', () => entry(true));
})();
