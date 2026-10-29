import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CandleOffering } from '../../types';
import { Eye, Pause, Play, Sparkles, Compass, Volume2, VolumeX } from 'lucide-react';

interface VeilGardenCanvasProps {
  candles: CandleOffering[];
  onSelectCandle?: (candle: CandleOffering) => void;
  onOpenLeaveLight?: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
}

export const VeilGardenCanvas: React.FC<VeilGardenCanvasProps> = ({
  candles,
  onSelectCandle,
  onOpenLeaveLight,
  isSoundMuted,
  onToggleSound,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'veil' | 'altar' | 'sky'>('veil');
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);

  // References for render loop and interaction
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 2.2, 7.5));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 0));
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const candlesGroupRef = useRef<THREE.Group | null>(null);
  const orbRef = useRef<THREE.Mesh | null>(null);

  // Math reusables outside render loop (Zero GC)
  const _camCurrentLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 0));
  const _raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const _pointer = useRef<THREE.Vector2>(new THREE.Vector2());

  // Procedural stone texture
  const generateStoneTexture = useCallback((): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f121a';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle stone noise
    for (let i = 0; i < 25000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(Math.random() * 25 + 15);
      ctx.fillStyle = `rgb(${gray}, ${gray + 3}, ${gray + 7})`;
      ctx.fillRect(x, y, 2, 2);
    }
    // Subtle slab seams
    ctx.strokeStyle = 'rgba(5, 7, 12, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 128) {
      ctx.moveTo(x, 0); ctx.lineTo(x, 512);
    }
    for (let y = 0; y <= 512; y += 128) {
      ctx.moveTo(0, y); ctx.lineTo(512, y);
    }
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch (e: any) {
      setWebglError('WebGL is unavailable on this device. Displaying atmospheric still view.');
      return;
    }

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#08090D');
    scene.fog = new THREE.FogExp2('#08090D', 0.045);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.2, 7.5);
    cameraRef.current = camera;

    // Lighting (Warm Key + Cool Fill + Golden Accent)
    const ambientLight = new THREE.AmbientLight('#101624', 0.7);
    scene.add(ambientLight);

    const coolFillLight = new THREE.HemisphereLight('#91C7D8', '#08090D', 0.6);
    scene.add(coolFillLight);

    const warmKeyLight = new THREE.DirectionalLight('#D7AD63', 1.8);
    warmKeyLight.position.set(3, 8, 4);
    scene.add(warmKeyLight);

    // Reflective Stone Ground
    const groundTex = generateStoneTexture();
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.6,
      metalness: 0.15,
      color: '#1a1d26',
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // 1. THE VEIL GATE (Monumental Megalithic Archway - 8-part Composite Group)
    const veilGateGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      color: '#1d212b',
      roughness: 0.85,
      metalness: 0.1,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: '#D7AD63',
      roughness: 0.25,
      metalness: 0.85,
      emissive: '#59441a',
      emissiveIntensity: 0.4,
    });

    // Left Pillar
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), stoneMat);
    leftPillar.position.set(-2.0, 2.5, 0);
    veilGateGroup.add(leftPillar);

    const leftBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), stoneMat);
    leftBase.position.set(-2.0, 0.2, 0);
    veilGateGroup.add(leftBase);

    // Right Pillar
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), stoneMat);
    rightPillar.position.set(2.0, 2.5, 0);
    veilGateGroup.add(rightPillar);

    const rightBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), stoneMat);
    rightBase.position.set(2.0, 0.2, 0);
    veilGateGroup.add(rightBase);

    // Lintel Beam (Top Crossbeam)
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.7, 1.1), stoneMat);
    lintel.position.set(0, 5.1, 0);
    veilGateGroup.add(lintel);

    // Golden Runic Trims inside pillars
    const leftGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.2, 0.08), goldTrimMat);
    leftGoldTrim.position.set(-1.58, 2.6, 0.38);
    veilGateGroup.add(leftGoldTrim);

    const rightGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.2, 0.08), goldTrimMat);
    rightGoldTrim.position.set(1.58, 2.6, 0.38);
    veilGateGroup.add(rightGoldTrim);

    // Lintel Inlay
    const lintelGoldInlay = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 0.08), goldTrimMat);
    lintelGoldInlay.position.set(0, 4.8, 0.54);
    veilGateGroup.add(lintelGoldInlay);

    // Luminous Portal Plane inside the Veil Gate
    const portalGeo = new THREE.PlaneGeometry(3.2, 4.4);
    const portalMat = new THREE.MeshBasicMaterial({
      color: '#D7AD63',
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const portalMesh = new THREE.Mesh(portalGeo, portalMat);
    portalMesh.position.set(0, 2.5, 0);
    veilGateGroup.add(portalMesh);

    scene.add(veilGateGroup);

    // 2. THE FLOATING SPECTRAL ORB (Centerpiece)
    const orbGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const orbMat = new THREE.MeshStandardMaterial({
      color: '#91C7D8',
      roughness: 0.1,
      metalness: 0.3,
      emissive: '#91C7D8',
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0, 2.5, 0.2);
    scene.add(orb);
    orbRef.current = orb;

    // Orb halo ring
    const haloGeo = new THREE.TorusGeometry(0.85, 0.02, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: '#D7AD63',
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(orb.position);
    halo.rotation.x = Math.PI / 3;
    scene.add(halo);

    // Point Light from Orb
    const orbLight = new THREE.PointLight('#91C7D8', 2.0, 10);
    orbLight.position.copy(orb.position);
    scene.add(orbLight);

    // 3. DRIFTING PARTICLES & GOLDEN POLLEN (InstancedMesh)
    const particleCount = isSoftwareGl ? 350 : 1100;
    const particleGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const particleMat = new THREE.MeshBasicMaterial({
      color: '#E98B37',
      transparent: true,
      opacity: 0.75,
    });
    const instancedParticles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    instancedParticles.frustumCulled = false;

    const dummy = new THREE.Object3D();
    const particleVelocities: { x: number; y: number; z: number; phase: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 18;
      const y = Math.random() * 6 + 0.1;
      const z = (Math.random() - 0.5) * 16;
      dummy.position.set(x, y, z);
      const scale = Math.random() * 0.8 + 0.4;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedParticles.setMatrixAt(i, dummy.matrix);

      // Varying particle tints between gold, marigold, and spectral cyan
      const colorRoll = Math.random();
      const pColor = new THREE.Color(
        colorRoll > 0.6 ? '#D7AD63' : colorRoll > 0.2 ? '#E98B37' : '#91C7D8'
      );
      instancedParticles.setColorAt(i, pColor);

      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.005,
        y: Math.random() * 0.006 + 0.002,
        z: (Math.random() - 0.5) * 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }
    if (instancedParticles.instanceColor) instancedParticles.instanceColor.needsUpdate = true;
    scene.add(instancedParticles);

    // 4. PROCEDURAL MARIGOLD FLOWER CLUSTERS
    const marigoldGroup = new THREE.Group();
    const marigoldMat = new THREE.MeshStandardMaterial({
      color: '#E98B37',
      roughness: 0.6,
      emissive: '#703808',
      emissiveIntensity: 0.25,
    });

    const createMarigoldCluster = (x: number, z: number) => {
      const cluster = new THREE.Group();
      cluster.position.set(x, 0.05, z);
      for (let m = 0; m < 5; m++) {
        const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 1), marigoldMat);
        const offsetX = (Math.random() - 0.5) * 0.35;
        const offsetZ = (Math.random() - 0.5) * 0.35;
        flower.position.set(offsetX, 0.1 + Math.random() * 0.08, offsetZ);
        flower.scale.set(1, 0.7, 1);
        cluster.add(flower);
      }
      return cluster;
    };

    marigoldGroup.add(createMarigoldCluster(-2.2, 0.7));
    marigoldGroup.add(createMarigoldCluster(-1.7, 1.2));
    marigoldGroup.add(createMarigoldCluster(2.2, 0.8));
    marigoldGroup.add(createMarigoldCluster(1.8, 1.3));
    marigoldGroup.add(createMarigoldCluster(0, 1.6));
    scene.add(marigoldGroup);

    // 5. DISTANT MONOLITHIC RUINS (Background Silhouette)
    const ruinsGroup = new THREE.Group();
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.7, 6, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: '#0d1017',
      roughness: 0.95,
      metalness: 0.05,
    });
    for (let r = 0; r < 8; r++) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      const angle = (r / 8) * Math.PI * 2;
      const radius = 12 + Math.random() * 4;
      pillar.position.set(Math.cos(angle) * radius, 3, Math.sin(angle) * radius - 4);
      pillar.rotation.y = Math.random() * Math.PI;
      ruinsGroup.add(pillar);
    }
    scene.add(ruinsGroup);

    // 6. CANDLES GROUP (Dynamic offerings)
    const candlesGroup = new THREE.Group();
    candlesGroupRef.current = candlesGroup;
    scene.add(candlesGroup);

    // Mouse Parallax listener
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = { x, y };
      _pointer.current.set(x, y);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Window resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // WebGL Context Lost / Restored
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('WebGL Context Lost. Attempting restoration...');
    };
    const handleContextRestored = () => {
      setWebglError(null);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isPaused) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Camera Damping
      const cam = cameraRef.current;
      if (cam) {
        // Subtle mouse parallax
        const parallaxX = mousePos.current.x * 0.45;
        const parallaxY = mousePos.current.y * 0.25;

        cam.position.x = THREE.MathUtils.damp(cam.position.x, targetCamPos.current.x + parallaxX, 3.5, delta);
        cam.position.y = THREE.MathUtils.damp(cam.position.y, targetCamPos.current.y + parallaxY, 3.5, delta);
        cam.position.z = THREE.MathUtils.damp(cam.position.z, targetCamPos.current.z, 3.5, delta);

        _camCurrentLook.current.x = THREE.MathUtils.damp(_camCurrentLook.current.x, targetCamLook.current.x, 3.5, delta);
        _camCurrentLook.current.y = THREE.MathUtils.damp(_camCurrentLook.current.y, targetCamLook.current.y, 3.5, delta);
        _camCurrentLook.current.z = THREE.MathUtils.damp(_camCurrentLook.current.z, targetCamLook.current.z, 3.5, delta);

        cam.lookAt(_camCurrentLook.current);
      }

      // Orb floating and halo spin
      if (orbRef.current) {
        orbRef.current.position.y = 2.5 + Math.sin(elapsed * 1.4) * 0.12;
        halo.position.copy(orbRef.current.position);
        halo.rotation.z += 0.008;
        halo.rotation.y += 0.005;
        orbLight.position.copy(orbRef.current.position);
      }

      // Portal gentle breathing
      portalMat.opacity = 0.10 + Math.sin(elapsed * 2.0) * 0.04;

      // Update particle positions
      const matrix = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const scaleVec = new THREE.Vector3();
      const quat = new THREE.Quaternion();

      for (let i = 0; i < particleCount; i++) {
        instancedParticles.getMatrixAt(i, matrix);
        matrix.decompose(pos, quat, scaleVec);

        const v = particleVelocities[i];
        pos.y += v.y;
        pos.x += Math.sin(elapsed + v.phase) * 0.003;
        pos.z += Math.cos(elapsed + v.phase) * 0.003;

        // Wrap particles when reaching ceiling
        if (pos.y > 6.5) {
          pos.y = 0.1;
        }

        matrix.compose(pos, quat, scaleVec);
        instancedParticles.setMatrixAt(i, matrix);
      }
      instancedParticles.instanceMatrix.needsUpdate = true;

      // Animate candle flames
      if (candlesGroupRef.current) {
        candlesGroupRef.current.children.forEach((candleObj, idx) => {
          const flame = candleObj.getObjectByName('flame');
          const light = candleObj.getObjectByName('light') as THREE.PointLight;
          if (flame) {
            const flicker = Math.sin(elapsed * 12 + idx * 2.5) * 0.15 + Math.cos(elapsed * 7) * 0.1;
            flame.scale.set(1 + flicker, 1 + flicker * 1.5, 1 + flicker);
            if (light) {
              light.intensity = 1.0 + flicker * 0.6;
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      renderer.dispose();
      groundTex.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [generateStoneTexture]);

  // Sync candle models when offerings update
  useEffect(() => {
    const group = candlesGroupRef.current;
    if (!group) return;

    // Clear old candles
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    const waxMat = new THREE.MeshStandardMaterial({
      color: '#F3EBDD',
      roughness: 0.35,
      metalness: 0.05,
    });
    const flameMat = new THREE.MeshBasicMaterial({
      color: '#E98B37',
    });

    candles.forEach((c) => {
      const candleComposite = new THREE.Group();
      candleComposite.position.set(c.x, 0, c.z);
      candleComposite.userData = { candle: c };

      // Candle body
      const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.35, 12), waxMat);
      wax.position.y = 0.175;
      candleComposite.add(wax);

      // Flame
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), flameMat);
      flame.name = 'flame';
      flame.position.y = 0.41;
      candleComposite.add(flame);

      // Flame Light
      const lightColor = c.color === 'cyan' ? '#91C7D8' : c.color === 'marigold' ? '#E98B37' : '#D7AD63';
      const candleLight = new THREE.PointLight(lightColor, 1.2, 3.5);
      candleLight.name = 'light';
      candleLight.position.y = 0.45;
      candleComposite.add(candleLight);

      group.add(candleComposite);
    });
  }, [candles]);

  // Click on 3D object raycasting
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cameraRef.current || !candlesGroupRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    _raycaster.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const intersects = _raycaster.current.intersectObjects(candlesGroupRef.current.children, true);

    if (intersects.length > 0) {
      // Find parent candle group
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.userData?.candle && obj.parent) {
        obj = obj.parent;
      }
      if (obj && obj.userData?.candle && onSelectCandle) {
        onSelectCandle(obj.userData.candle);
      }
    }
  };

  // Camera presets
  const handleSetCameraPreset = (preset: 'veil' | 'altar' | 'sky', index: number) => {
    setCameraMode(preset);
    setActivePresetIndex(index);
    if (preset === 'veil') {
      targetCamPos.current.set(0, 2.2, 7.5);
      targetCamLook.current.set(0, 1.8, 0);
    } else if (preset === 'altar') {
      targetCamPos.current.set(-1.8, 1.4, 3.8);
      targetCamLook.current.set(-0.5, 0.8, 1.5);
    } else if (preset === 'sky') {
      targetCamPos.current.set(0, 5.5, 6.0);
      targetCamLook.current.set(0, 2.5, -1.0);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none" onClick={handleCanvasClick}>
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* WebGL Fallback if device unsupported */}
      {webglError && (
        <div className="absolute inset-0 bg-[#08090D] flex flex-col items-center justify-center p-6 text-center z-10">
          <img
            src="/src/assets/images/veil_gate_monolith_1793096629868.jpg"
            alt="The Veil Gate Monolith"
            className="w-full max-w-lg h-64 object-cover rounded-xl border border-white/10 mb-4 opacity-80"
          />
          <h3 className="text-xl font-display text-[#D7AD63] mb-2">The Veil Gate</h3>
          <p className="text-sm text-[#777985] max-w-md">{webglError}</p>
        </div>
      )}

      {/* Center Hero Brand & Headline Overlay (100% clean, non-obstructive) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center px-4 text-center z-10">
        <span className="text-xs uppercase tracking-[0.3em] text-[#D7AD63] mb-3">
          Hacktoberfest 2026 · Week 4: Ghost in the Machine
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-semibold text-[#F3EBDD] tracking-wide max-w-4xl text-balance drop-shadow-2xl">
          AFTERLIGHT
        </h1>
        <p className="mt-3 text-base md:text-lg text-[#91C7D8] font-editorial italic max-w-xl text-balance">
          “Some things deserve to live forever.”
        </p>
        <p className="mt-2 text-xs md:text-sm text-[#777985] max-w-lg text-balance">
          An intimate universe where memories become light, stories awaken, and open-weight AI preserves human heritage.
        </p>

        {/* Quiet privacy philosophy badge */}
        <div className="mt-6 flex items-center gap-2 text-xs text-[#777985] bg-[#08090D]/80 border border-[#D7AD63]/20 px-3 py-1.5 rounded-md pointer-events-auto">
          <span className="text-[#D7AD63]">✦</span>
          <span>Your memories stay on your device by default.</span>
        </div>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-3xl transition-transform duration-300 ease-out ${
          isDockCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        {/* Dock Drawer Toggle Header */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#D7AD63] bg-[#101624]/90 border border-[#D7AD63]/30 rounded-t-lg hover:bg-[#1a233a] transition-colors shadow-lg cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isDockCollapsed ? '▴ Show Garden Controls' : '▾ Hide Controls'}</span>
          </button>
        </div>

        {/* Main Dock Surface */}
        <div className="bg-[#101624]/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-[#F3EBDD]">
          {/* Camera View Switcher */}
          <div className="flex items-center gap-1 bg-[#08090D] p-1 rounded-lg border border-white/5">
            <span className="text-[#777985] px-2 font-mono">VIEW:</span>
            <button
              onClick={() => handleSetCameraPreset('veil', 0)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activePresetIndex === 0 ? 'bg-[#D7AD63] text-[#08090D] font-semibold' : 'text-[#777985] hover:text-[#F3EBDD]'
              }`}
            >
              The Veil
            </button>
            <button
              onClick={() => handleSetCameraPreset('altar', 1)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activePresetIndex === 1 ? 'bg-[#D7AD63] text-[#08090D] font-semibold' : 'text-[#777985] hover:text-[#F3EBDD]'
              }`}
            >
              Memorial Garden
            </button>
            <button
              onClick={() => handleSetCameraPreset('sky', 2)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activePresetIndex === 2 ? 'bg-[#D7AD63] text-[#08090D] font-semibold' : 'text-[#777985] hover:text-[#F3EBDD]'
              }`}
            >
              Constellation Sky
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#08090D] border border-white/10 rounded-lg hover:border-[#D7AD63]/50 text-[#F3EBDD] transition-colors cursor-pointer"
              title={isSoundMuted ? 'Turn on ambient soundscape' : 'Mute soundscape'}
            >
              {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-[#777985]" /> : <Volume2 className="w-3.5 h-3.5 text-[#D7AD63]" />}
              <span>{isSoundMuted ? 'Sound Off' : 'Sound On'}</span>
            </button>

            {/* Pause Animation */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#08090D] border border-white/10 rounded-lg hover:border-[#D7AD63]/50 text-[#F3EBDD] transition-colors cursor-pointer"
              title="Pause 3D animation"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-[#E98B37]" /> : <Pause className="w-3.5 h-3.5 text-[#777985]" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* Leave a Light Primary Offer */}
            {onOpenLeaveLight && (
              <button
                onClick={onOpenLeaveLight}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D7AD63] text-[#08090D] font-medium rounded-lg hover:bg-[#e4be78] transition-colors shadow-md cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Leave a Light</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
