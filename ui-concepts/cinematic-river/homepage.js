(() => {
  const scene = document.getElementById('landscape');
  const canvas = document.getElementById('water-canvas');
  const photoLayer = document.getElementById('memory-photos');
  const motionButton = document.getElementById('motion-toggle');
  const motionLabel = document.getElementById('motion-label');
  const frame = document.getElementById('preview-frame');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const parameters = new URLSearchParams(location.search);
  const sourceAspect = 1672 / 941;
  const photos = [
    'picnic',
    'birthday',
    'city-walk',
    'train-journey',
    'pizza-night',
    'beach-sunset',
    'concert',
  ];
  const cards = photos.map((photo, index) => {
    const card = document.createElement('figure');
    card.className = 'memory';
    card.dataset.photo = photo;
    const image = document.createElement('img');
    image.src = `../river-join/assets/${photo}.jpg`;
    image.alt = '';
    image.decoding = 'async';
    image.draggable = false;
    card.append(image);
    photoLayer.append(card);
    return {
      card,
      lane: [-0.75, 0.65, -0.35, 0.7, -0.55, 0.35, 0][index],
      tilt: [-7, 5, -3, 7, -5, 3, -2][index],
    };
  });

  // Coordinates follow the river in the source artwork, independent of screen crop.
  const current = [
    [0.755, 0.205],
    [0.715, 0.335],
    [0.645, 0.465],
    [0.65, 0.6],
    [0.61, 0.775],
    [0.69, 1.19],
  ];
  let width = 1,
    height = 1,
    cover = [1, 1],
    offset = [0, 0];
  let elapsed = 0,
    previous = null,
    paintedAt = 0,
    request = null;
  let paused = reduced.matches || parameters.get('still') === '1';
  let inView = true;
  let renderer;

  function riverPoint(t) {
    const f = t * (current.length - 1);
    const i = Math.min(current.length - 2, Math.floor(f));
    const u = f - i;
    const p0 = current[Math.max(0, i - 1)],
      p1 = current[i],
      p2 = current[i + 1],
      p3 = current[Math.min(current.length - 1, i + 2)];
    return [0, 1].map(
      (axis) =>
        0.5 *
        (2 * p1[axis] +
          (-p0[axis] + p2[axis]) * u +
          (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * u * u +
          (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * u * u * u),
    );
  }

  function measure() {
    width = scene.clientWidth;
    height = scene.clientHeight;
    const aspect = width / height;
    cover = aspect > sourceAspect ? [1, sourceAspect / aspect] : [aspect / sourceAspect, 1];
    offset = [(1 - cover[0]) * (height <= 320 ? 0.72 : 0.6), (1 - cover[1]) * 0.5];
    const ratio = Math.min(devicePixelRatio || 1, 1.25, 1600 / Math.max(width, height));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    render();
  }

  function render() {
    renderer?.draw(elapsed, cover, offset);
    const compact = height <= 320;
    const count = compact ? 5 : cards.length;
    cards.forEach(({ card, lane, tilt }, index) => {
      card.hidden = index >= count;
      if (card.hidden) return;
      const u = ((index + 0.45) / count + elapsed / 112) % 1;
      const depth = Math.pow(u, 1.16);
      const point = riverPoint(depth);
      point[0] += lane * (0.009 + 0.05 * depth * depth);
      const x = ((point[0] - offset[0]) / cover[0]) * width;
      const y = ((point[1] - offset[1]) / cover[1]) * height;
      const size = (compact ? 28 : 25) + Math.pow(depth, 1.4) * (compact ? 103 : 188);
      card.style.width = `${size}px`;
      card.style.height = `${size * 0.76}px`;
      const opacity = Math.min(1, u / 0.1, (1 - u) / 0.1);
      card.style.opacity = String(Math.max(0, opacity) * (0.55 + depth * 0.4));
      card.style.transform = `translate3d(${x - size / 2}px, ${y - (size * 0.76) / 2}px, 0) perspective(700px) rotateX(${compact ? 43 : 48}deg) rotateZ(${tilt + Math.sin(elapsed * 0.15 + index) * 1.1}deg)`;
      card.style.zIndex = String(Math.floor(depth * 100));
    });
    document.getElementById('mist-far').style.transform =
      `translate3d(${Math.sin(elapsed * 0.045) * 20}px, ${Math.sin(elapsed * 0.032) * 5}px, 0)`;
    document.getElementById('mist-near').style.transform =
      `translate3d(${Math.sin(elapsed * 0.035 + 1) * 28}px, 0, 0)`;
  }

  function animate(now) {
    request = null;
    if (paused || document.hidden || !inView) {
      previous = null;
      return;
    }
    if (previous !== null) elapsed += Math.min((now - previous) / 1000, 0.06);
    previous = now;
    if (now - paintedAt >= 1000 / 30) {
      render();
      paintedAt = now;
    }
    request = requestAnimationFrame(animate);
  }

  function syncMotion() {
    if (request !== null) cancelAnimationFrame(request);
    request = null;
    previous = null;
    motionButton.dataset.paused = String(paused);
    motionButton.setAttribute('aria-label', paused ? 'Play scene motion' : 'Pause scene motion');
    motionLabel.textContent = paused ? 'Play motion' : 'Pause motion';
    if (!paused && !document.hidden && inView) request = requestAnimationFrame(animate);
  }
  motionButton.addEventListener('click', () => {
    paused = !paused;
    syncMotion();
  });
  reduced.addEventListener('change', (event) => {
    if (event.matches) {
      paused = true;
      syncMotion();
    }
  });
  document.addEventListener('visibilitychange', syncMotion);
  new IntersectionObserver(
    (entries) => {
      inView = entries[0].isIntersecting;
      syncMotion();
    },
    { threshold: 0 },
  ).observe(scene);
  new ResizeObserver(measure).observe(scene);

  document.querySelectorAll('button[data-size]').forEach((button) =>
    button.addEventListener('click', () => {
      frame.dataset.size = button.dataset.size;
      document
        .querySelectorAll('button[data-size]')
        .forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    }),
  );
  if (parameters.get('phone') === '1') document.querySelector('button[data-size="phone"]').click();

  const nickname = document.getElementById('nickname');
  nickname.addEventListener('input', () => nickname.setCustomValidity(''));
  document.getElementById('join-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nickname.value.trim();
    if (!name) {
      nickname.setCustomValidity('Enter a nickname to try the preview.');
      nickname.reportValidity();
      return;
    }
    const receipt = document.getElementById('join-receipt');
    receipt.textContent = `Ready, ${name}. This is a preview; no game session was created.`;
    receipt.hidden = false;
  });
  document.querySelector('.wordmark').addEventListener('click', (event) => event.preventDefault());

  function makeWaterRenderer(image) {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL unavailable');
    const vertex = `attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=vec2((a_position.x+1.0)*.5,1.0-(a_position.y+1.0)*.5); gl_Position=vec4(a_position,0.,1.);}`;
    const fragment = `precision mediump float;
      varying vec2 v_uv; uniform sampler2D u_image; uniform float u_time; uniform vec2 u_cover; uniform vec2 u_offset;
      void main(){
        vec2 uv=v_uv*u_cover+u_offset;
        vec3 still=texture2D(u_image,uv).rgb;
        float depth=clamp((uv.y-.205)/.795,0.,1.);
        float center=.75-.14*sin(depth*3.14159*.9);
        float halfWidth=.012+.40*pow(depth,1.28);
        float channel=(1.-smoothstep(halfWidth-.012,halfWidth+.018,abs(uv.x-center)))*smoothstep(.205,.26,uv.y);
        float brightness=dot(still,vec3(.2126,.7152,.0722));
        float liquid=channel*smoothstep(.17,.34,brightness);
        float island=1.-smoothstep(.85,1.15,length((uv-vec2(.355,1.02))/vec2(.14,.13)));
        liquid*=1.-island;
        vec2 ripple=vec2(sin(uv.y*95.-u_time*.68+sin(uv.x*24.)),cos(uv.x*86.+uv.y*53.-u_time*.56));
        vec2 warp=ripple*vec2(.0010,.0016)*(.25+.75*depth)*liquid;
        vec3 flowing=texture2D(u_image,uv+warp).rgb;
        float sheen=sin(uv.y*108.+uv.x*64.-u_time*.8)*.006*liquid;
        gl_FragColor=vec4(mix(still,flowing,liquid)+vec3(sheen*.78,sheen*.91,sheen),1.);
      }`;
    function shader(type, source) {
      const value = gl.createShader(type);
      gl.shaderSource(value, source);
      gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(value));
      return value;
    }
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
    const time = gl.getUniformLocation(program, 'u_time'),
      crop = gl.getUniformLocation(program, 'u_cover'),
      start = gl.getUniformLocation(program, 'u_offset');
    return {
      draw(seconds, scale, origin) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);
        gl.uniform1f(time, seconds);
        gl.uniform2fv(crop, scale);
        gl.uniform2fv(start, origin);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
    };
  }

  const artwork = new Image();
  artwork.onload = () => {
    try {
      renderer = makeWaterRenderer(artwork);
      render();
      canvas.classList.add('ready');
      canvas.dataset.renderer = 'webgl';
    } catch {
      canvas.dataset.renderer = 'poster';
      document.getElementById('water-status').textContent =
        'This browser is showing the still-water fallback. Photo and mist motion remain available.';
    }
  };
  artwork.src = 'river-study-v1.png';
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer = undefined;
    canvas.classList.remove('ready');
    canvas.dataset.renderer = 'poster';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      renderer = makeWaterRenderer(artwork);
      render();
      canvas.classList.add('ready');
      canvas.dataset.renderer = 'webgl';
    } catch {
      /* The poster stays visible. */
    }
  });
  measure();
  syncMotion();
})();
