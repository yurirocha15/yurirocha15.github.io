import * as THREE from "three";
import { disposeObjectTree } from "./objects";
import { normalizeBaseUrl } from "./assets";

export type FrameState = {
  elapsed: number;
  delta: number;
  reducedMotion: boolean;
};

export type SceneContext = {
  mount: HTMLElement;
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  baseUrl: string;
  isDisposed: () => boolean;
  requestRender: () => void;
  addCleanup: (cleanup: () => void) => void;
};

export type SceneController = {
  update: (frame: FrameState) => void;
  resize?: (width: number, height: number) => void;
  dispose?: () => void;
};

export type SceneBuilder = (context: SceneContext) => SceneController;

export type SceneRuntimeOptions = {
  camera: {
    fov: number;
    near: number;
    far: number;
    position: [number, number, number];
  };
  reducedMotionTime: number;
  visibility: IntersectionObserverInit;
  rendererFactory?: () => THREE.WebGLRenderer;
  baseUrl?: string;
};

function createRenderer() {
  const canvas = document.createElement("canvas");
  const attributes: WebGLContextAttributes = {
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  };
  const context = canvas.getContext("webgl2", attributes);
  if (!context) throw new Error("WebGL2 is unavailable");

  return new THREE.WebGLRenderer({ canvas, context, ...attributes });
}

function updatePixelSignal(renderer: THREE.WebGLRenderer, canvas: HTMLCanvasElement) {
  if (canvas.dataset.pixelSignal === "true" || typeof renderer.getContext !== "function") return;
  const width = Math.min(64, canvas.width);
  const height = Math.min(64, canvas.height);
  if (width < 2 || height < 2) return;

  const gl = renderer.getContext();
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(
    Math.max(0, Math.floor((canvas.width - width) / 2)),
    Math.max(0, Math.floor((canvas.height - height) / 2)),
    width,
    height,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels,
  );
  let opaquePixels = 0;
  let minimum = 765;
  let maximum = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) continue;
    opaquePixels += 1;
    const luminance = pixels[index] + pixels[index + 1] + pixels[index + 2];
    minimum = Math.min(minimum, luminance);
    maximum = Math.max(maximum, luminance);
  }
  canvas.dataset.pixelSignal = String(opaquePixels > 20 && maximum - minimum > 12);
}

export function mountSceneRuntime(
  mount: HTMLElement,
  buildScene: SceneBuilder,
  options: SceneRuntimeOptions,
) {
  const renderer = options.rendererFactory?.() ?? createRenderer();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.dataset.runtimeActive = "false";
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    options.camera.fov,
    1,
    options.camera.near,
    options.camera.far,
  );
  camera.position.set(...options.camera.position);

  const clock = new THREE.Clock();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups: Array<() => void> = [];
  let controller: SceneController | null = null;
  let frameId = 0;
  let previousElapsed = 0;
  let disposed = false;
  let visible = false;

  const renderFrame = () => {
    if (disposed || !visible || !controller) return;

    const elapsed = reducedMotion ? options.reducedMotionTime : clock.getElapsedTime();
    const delta = reducedMotion ? 0 : Math.max(0, elapsed - previousElapsed);
    previousElapsed = elapsed;
    controller.update({ elapsed, delta, reducedMotion });
    renderer.render(scene, camera);
    if (import.meta.env.DEV) updatePixelSignal(renderer, renderer.domElement);
    if (!reducedMotion) frameId = window.requestAnimationFrame(renderFrame);
  };

  const requestRender = () => {
    if (reducedMotion && visible) renderFrame();
  };

  const context: SceneContext = {
    mount,
    canvas: renderer.domElement,
    renderer,
    scene,
    camera,
    baseUrl: normalizeBaseUrl(options.baseUrl ?? import.meta.env.BASE_URL),
    isDisposed: () => disposed,
    requestRender,
    addCleanup: (cleanup) => cleanups.push(cleanup),
  };
  controller = buildScene(context);

  const resize = () => {
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controller?.resize?.(width, height);
    requestRender();
  };

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
  } else {
    window.addEventListener("resize", resize);
    cleanups.push(() => window.removeEventListener("resize", resize));
  }
  resize();

  const start = () => {
    if (disposed || visible) return;
    visible = true;
    renderer.domElement.dataset.runtimeActive = "true";
    previousElapsed = 0;
    clock.start();
    renderFrame();
  };
  const stop = () => {
    visible = false;
    renderer.domElement.dataset.runtimeActive = "false";
    window.cancelAnimationFrame(frameId);
  };

  let visibilityObserver: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    }, options.visibility);
    visibilityObserver.observe(mount);
  } else {
    start();
  }

  return () => {
    disposed = true;
    stop();
    visibilityObserver?.disconnect();
    resizeObserver?.disconnect();
    cleanups.forEach((cleanup) => cleanup());
    controller?.dispose?.();
    renderer.dispose();
    disposeObjectTree(scene);
    if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
  };
}
