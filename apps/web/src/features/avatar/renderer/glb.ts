import * as THREE from 'three';
import {GLTFLoader, type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type {Clip, Role} from '../behavior/machine';
import type {AvatarRenderer, GlbManifest} from './adapter';

export interface GlbAssets {
  scene: THREE.Group;
  clips: Map<Clip, {clip: THREE.AnimationClip; loop: boolean}>;
}

const ONE_SHOTS: readonly Clip[] = ['wave', 'poke', 'stretch'];

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Loads the rigged model and every clip the manifest names. Clips in other files must target the same rig. */
export async function loadGlbAssets(manifest: GlbManifest, signal?: AbortSignal): Promise<GlbAssets> {
  if (!supportsWebGL()) throw Error('WebGL unavailable');
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const files = new Map<string, Promise<GLTF>>();
  const load = (url: string) => {
    let pending = files.get(url);
    if (!pending) {
      pending = loader.loadAsync(url);
      files.set(url, pending);
    }
    return pending;
  };
  const base = await load(manifest.model);
  const clips: GlbAssets['clips'] = new Map();
  for (const [name, spec] of Object.entries(manifest.clips) as [Clip, NonNullable<GlbManifest['clips'][keyof GlbManifest['clips']]>][]) {
    const source = spec.file ? await load(spec.file) : base;
    const clip = spec.name ? THREE.AnimationClip.findByName(source.animations, spec.name) : source.animations[0];
    if (!clip) throw Error(`Animation clip "${name}" not found in ${spec.file ?? manifest.model}`);
    clips.set(name, {clip, loop: spec.loop ?? !ONE_SHOTS.includes(name)});
  }
  if (signal?.aborted) throw Error('aborted');
  if (!clips.has('idle')) throw Error('idle clip missing');
  stylise(base.scene);
  return {scene: base.scene, clips};
}

/** Cel-shaded look: three-tone lighting on the model's own textures, matching the illustrated reference. */
function stylise(root: THREE.Object3D) {
  const steps = new THREE.DataTexture(new Uint8Array([110, 175, 235]), 3, 1, THREE.RedFormat);
  steps.minFilter = steps.magFilter = THREE.NearestFilter;
  steps.needsUpdate = true;
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const replaced = materials.map(material => {
      const source = material as THREE.MeshStandardMaterial;
      const toon = new THREE.MeshToonMaterial({map: source.map ?? null, color: source.color ?? new THREE.Color('#ffffff'), gradientMap: steps});
      if (source.map) source.map.colorSpace = THREE.SRGBColorSpace;
      source.dispose();
      return toon;
    });
    mesh.material = Array.isArray(mesh.material) ? replaced : replaced[0];
  });
}

/**
 * Renders the rigged companion into the host's canvas with three.js. One idle loop plus one-shot reactions,
 * cross-faded through an animation mixer. Draws only while unpaused and stops completely on pause or dispose.
 */
export class GlbRenderer implements AvatarRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  private mixer: THREE.AnimationMixer;
  private actions = new Map<Clip, THREE.AnimationAction>();
  private loops = new Map<Clip, boolean>();
  private current: Clip = 'idle';
  private requested: Clip = 'idle';
  private clock = new THREE.Clock();
  private frame = 0;
  private paused = false;
  private disposed = false;
  private observer: ResizeObserver;
  private lost: (e: Event) => void;

  constructor(private canvas: HTMLCanvasElement, private assets: GlbAssets, onContextLost: () => void) {
    this.renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'});
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a3a40, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(-1.5, 3, 4);
    const rim = new THREE.DirectionalLight(0xefad45, 0.5);
    rim.position.set(2, 1, -3);
    this.scene.add(key, rim, assets.scene);
    this.frameCharacter(assets.scene);
    this.mixer = new THREE.AnimationMixer(assets.scene);
    for (const [name, {clip, loop}] of assets.clips) {
      const action = this.mixer.clipAction(clip);
      action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
      action.clampWhenFinished = !loop;
      this.actions.set(name, action);
      this.loops.set(name, loop);
    }
    this.mixer.addEventListener('finished', () => {
      if (this.current !== 'idle') this.transition('idle');
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.lost = e => {
      e.preventDefault();
      onContextLost();
    };
    canvas.addEventListener('webglcontextlost', this.lost);
    this.resize();
    this.actions.get('idle')!.play();
    this.loop();
  }

  /** Feet on the ground, centred, slightly turned, and the camera pulled back to fit the full height. */
  private frameCharacter(root: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    root.position.set(-centre.x, -box.min.y, -centre.z);
    root.rotation.y = -0.2;
    const distance = (size.y / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) * 1.15;
    this.camera.position.set(0, size.y * 0.52, distance);
    this.camera.lookAt(0, size.y * 0.5, 0);
  }

  private resize() {
    const width = this.canvas.clientWidth || 160, height = this.canvas.clientHeight || 180;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private loop = () => {
    if (this.disposed || this.paused) return;
    this.frame = requestAnimationFrame(this.loop);
    this.mixer.update(this.clock.getDelta());
    this.renderer.render(this.scene, this.camera);
  };

  private transition(next: Clip) {
    const to = this.actions.get(next), from = this.actions.get(this.current);
    if (!to) return;
    to.reset();
    to.enabled = true;
    to.setEffectiveTimeScale(1);
    to.setEffectiveWeight(1);
    to.play();
    if (from && from !== to) from.crossFadeTo(to, 0.25, false);
    this.current = next;
  }

  play(clip: Clip) {
    // Edge-triggered: the scheduler repeats its current choice every tick, which must not restart a reaction.
    if (clip === this.requested) return;
    this.requested = clip;
    const target = this.actions.has(clip) ? clip : 'idle';
    if (target === this.current) return;
    const busy = this.current !== 'idle' && !this.loops.get(this.current) && this.actions.get(this.current)!.isRunning();
    if (target === 'idle' && busy) return; // let a one-shot finish; 'finished' brings idle back
    this.transition(target);
  }

  setRole(_role: Role) {
    /* Only the casual model is authored. */
  }

  setPaused(value: boolean) {
    if (this.paused === value) return;
    this.paused = value;
    if (value) {
      cancelAnimationFrame(this.frame);
    } else {
      this.clock.getDelta();
      this.loop();
    }
  }

  /** Releases the WebGL context and timers. Model geometry is shared with the host and kept for re-show. */
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.lost);
    this.mixer.stopAllAction();
    this.scene.remove(this.assets.scene);
    this.renderer.dispose();
  }
}
