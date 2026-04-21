/* ═══════════════════════════════════════════════════════════
   TRUCK.JS — Three.js scroll-driven truck animation
   Builds a procedural truck from geometry (no model file needed).
   Replace buildTruck() with a GLTFLoader call for a custom model.
═══════════════════════════════════════════════════════════ */

(function () {
  // ── Scene setup ──────────────────────────────────────────
  const canvas  = document.getElementById('truckCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene  = new THREE.Scene();
  scene.fog    = new THREE.FogExp2(0x0a0a0a, 0.018);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  // ── Initial camera: side/front view ──────────────────────
  camera.position.set(8, 3, 12);
  camera.lookAt(0, 1, 0);

  // ── Resize handler ────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Lights ────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xffeedd, 0.3);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff5e0, 2.2);
  sun.position.set(10, 20, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.width  = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far  = 100;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top   = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  // Rim light from opposite side
  const rimLight = new THREE.DirectionalLight(0xf5a623, 0.8);
  rimLight.position.set(-10, 5, -8);
  scene.add(rimLight);

  // Headlight glow
  const headlight = new THREE.PointLight(0xffeedd, 1.5, 12);
  headlight.position.set(-3.2, 1.2, -4.2);
  scene.add(headlight);

  // ── Materials ─────────────────────────────────────────────
  const matBody   = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.6, roughness: 0.3 });
  const matCabin  = new THREE.MeshStandardMaterial({ color: 0x16213e, metalness: 0.7, roughness: 0.25 });
  const matGlass  = new THREE.MeshStandardMaterial({ color: 0x88bbdd, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.55 });
  const matWheel  = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.2, roughness: 0.8 });
  const matRim    = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
  const matAccent = new THREE.MeshStandardMaterial({ color: 0xf5a623, metalness: 0.3, roughness: 0.4, emissive: 0xf5a623, emissiveIntensity: 0.15 });
  const matExhaust= new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.6 });

  // ── Truck builder ─────────────────────────────────────────
  const truckGroup = new THREE.Group();

  function box(w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.castShadow    = true;
    m.receiveShadow = true;
    return m;
  }
  function cyl(rt, rb, h, seg, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.castShadow = true;
    return m;
  }

  // Trailer / cargo box
  const trailer = box(2.4, 2.2, 8, matBody);
  trailer.position.set(0, 1.9, 2);
  truckGroup.add(trailer);

  // Amber stripe on trailer
  const stripe = box(2.42, 0.18, 8.01, matAccent);
  stripe.position.set(0, 1.0, 2);
  truckGroup.add(stripe);

  // Cabin
  const cabin = box(2.2, 1.8, 2.8, matCabin);
  cabin.position.set(0, 1.7, -3.8);
  truckGroup.add(cabin);

  // Cabin roof fairing (rounded top) - approximate with scaled sphere
  const fairing = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 8, 0, Math.PI*2, 0, Math.PI/2), matCabin);
  fairing.scale.set(1, 0.6, 1.3);
  fairing.position.set(0, 2.55, -3.5);
  fairing.castShadow = true;
  truckGroup.add(fairing);

  // Windshield
  const windshield = box(1.9, 1.1, 0.08, matGlass);
  windshield.position.set(0, 1.9, -5.22);
  windshield.rotation.x = 0.18;
  truckGroup.add(windshield);

  // Side windows
  [-1.11, 1.11].forEach(x => {
    const sw = box(0.08, 0.7, 1.1, matGlass);
    sw.position.set(x, 2.0, -3.9);
    truckGroup.add(sw);
  });

  // Chassis / frame
  const chassis = box(2.0, 0.3, 12, matExhaust);
  chassis.position.set(0, 0.55, -0.5);
  truckGroup.add(chassis);

  // ── Wheels ────────────────────────────────────────────────
  window._wheels = []; // store for rotation animation

  function addWheel(x, y, z) {
    const group = new THREE.Group();
    const tire = cyl(0.55, 0.55, 0.45, 24, matWheel);
    tire.rotation.z = Math.PI / 2;
    group.add(tire);
    const rim = cyl(0.32, 0.32, 0.46, 12, matRim);
    rim.rotation.z = Math.PI / 2;
    group.add(rim);
    // Lug nuts
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const lug = cyl(0.04, 0.04, 0.05, 6, matRim);
      lug.rotation.z = Math.PI / 2;
      lug.position.set(0.24, Math.sin(angle) * 0.22, Math.cos(angle) * 0.22);
      group.add(lug);
    }
    group.position.set(x, y, z);
    truckGroup.add(group);
    window._wheels.push(group);
    return group;
  }

  // Front axle
  addWheel(-1.1, 0.55, -4.2);
  addWheel( 1.1, 0.55, -4.2);
  // Rear drive axle pair
  addWheel(-1.1, 0.55, -1.2);
  addWheel( 1.1, 0.55, -1.2);
  addWheel(-1.1, 0.55, -0.2);
  addWheel( 1.1, 0.55, -0.2);
  // Trailer rear axle
  addWheel(-1.1, 0.55,  4.8);
  addWheel( 1.1, 0.55,  4.8);
  addWheel(-1.1, 0.55,  5.7);
  addWheel( 1.1, 0.55,  5.7);

  // Exhaust stacks
  [-0.6, 0.6].forEach(x => {
    const stack = cyl(0.07, 0.07, 2, 8, matExhaust);
    stack.position.set(x, 3.1, -4.2);
    truckGroup.add(stack);
  });

  // Headlights
  [-0.7, 0.7].forEach(x => {
    const hl = box(0.35, 0.25, 0.1, new THREE.MeshStandardMaterial({
      color: 0xfff5cc, emissive: 0xfff5cc, emissiveIntensity: 1.5,
      metalness: 0.1, roughness: 0.1
    }));
    hl.position.set(x, 1.3, -5.25);
    truckGroup.add(hl);
  });

  // Grille
  const grille = box(1.8, 0.8, 0.1, matAccent);
  grille.position.set(0, 0.9, -5.25);
  truckGroup.add(grille);

  // Truck starts behind camera; we'll move it via scroll
  truckGroup.position.set(0, 0, -10);
  scene.add(truckGroup);

  // ── Road ─────────────────────────────────────────────────
  // Two road segments, alternating for infinite feel
  const roadGeo = new THREE.PlaneGeometry(14, 80);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, metalness: 0.0, roughness: 0.95
  });

  const roads = [
    new THREE.Mesh(roadGeo, roadMat),
    new THREE.Mesh(roadGeo, roadMat)
  ];
  roads.forEach((r, i) => {
    r.rotation.x = -Math.PI / 2;
    r.position.set(0, 0, i * 80 - 40);
    r.receiveShadow = true;
    scene.add(r);
  });

  // Dashed center line
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, emissive: 0xf5a623, emissiveIntensity: 0.3 });
  const dashes = [];
  for (let i = -20; i < 20; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 1.8), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.01, i * 4);
    scene.add(dash);
    dashes.push(dash);
  }

  // Road shoulders
  [-6, 6].forEach(x => {
    const shoulder = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 160),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 1 })
    );
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(x, 0, 0);
    shoulder.receiveShadow = true;
    scene.add(shoulder);
  });

  // ── Scroll-driven animation state ────────────────────────
  // Parameters — tweak these to adjust feel
  const TRUCK_Z_START = -18;  // where truck starts (far away)
  const TRUCK_Z_END   =  28;  // where truck moves to (past camera)
  const TRUCK_ROT_DEG =  340; // degrees of Y-rotation over full scroll

  let scrollProgress = 0;     // 0..1

  function onScroll() {
    const wrapper   = document.getElementById('scrollWrapper');
    const scrollTop = window.scrollY;
    const maxScroll = wrapper.scrollHeight - window.innerHeight;
    scrollProgress  = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── GSAP ScrollTrigger for slogan parallax ───────────────
  gsap.registerPlugin(ScrollTrigger);

  gsap.to('#heroSlogan', {
    yPercent: -60,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '#scrollWrapper',
      start: 'top top',
      end:   '30% top',
      scrub: 1
    }
  });

  gsap.to('#roadLabel', {
    opacity: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#scrollWrapper',
      start: '25% top',
      end:   '45% top',
      scrub: 1
    }
  });

  // ── Render loop ──────────────────────────────────────────
  let time = 0;

  function render() {
    requestAnimationFrame(render);
    time += 0.016;

    const p = scrollProgress;

    // Move truck along Z axis
    truckGroup.position.z = THREE.MathUtils.lerp(TRUCK_Z_START, TRUCK_Z_END, p);

    // Rotate truck Y (almost full 360)
    truckGroup.rotation.y = THREE.MathUtils.lerp(0, (TRUCK_ROT_DEG * Math.PI) / 180, p);

    // Slight tilt for cinematic feel
    truckGroup.rotation.z = Math.sin(p * Math.PI) * 0.03;

    // Wheel rotation synced with forward movement
    const wheelRot = p * 30; // radians
    window._wheels.forEach(w => { w.rotation.x = wheelRot; });

    // Move road dashes for motion illusion
    dashes.forEach((d, i) => {
      d.position.z = ((d.position.z + 0.04) % 80) - 40;
    });

    // Camera tracks truck slightly
    const camTargetX = THREE.MathUtils.lerp(8, -6, p);
    const camTargetZ = THREE.MathUtils.lerp(12, -14, p);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, 0.04);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, 0.04);
    camera.position.y = 3 + Math.sin(p * Math.PI) * 1.5;
    camera.lookAt(truckGroup.position.x, 1.2, truckGroup.position.z);

    // Subtle lighting shift (warmer as truck comes closer)
    rimLight.intensity = 0.8 + p * 0.8;
    headlight.position.z = truckGroup.position.z - 4.2;
    headlight.position.x = truckGroup.position.x;

    renderer.render(scene, camera);
  }

  render();

})();

/* ─────────────────────────────────────────────────────────
   HOW TO REPLACE THE TRUCK WITH A CUSTOM GLTF MODEL:
   ─────────────────────────────────────────────────────────
   1. Add to your HTML (after Three.js):
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/GLTFLoader.js"></script>

   2. Replace the "Truck builder" section with:

      const loader = new THREE.GLTFLoader();
      loader.load('assets/truck.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(1.0);        // adjust scale
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;
          }
        });
        truckGroup.add(model);
      });

   3. Wheel refs: access named bones/meshes from gltf.scene.getObjectByName('WheelFL')
      and add them to window._wheels for auto rotation.

   Free truck models: sketchfab.com, poly.pizza, turbosquid.com
─────────────────────────────────────────────────────────── */
