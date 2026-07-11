import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";
import {
  mountSceneRuntime,
  type SceneContext,
  type SceneRuntimeOptions,
} from "../../src/scenes/shared/runtime";
import {
  MockIntersectionObserver,
  MockResizeObserver,
  setReducedMotion,
} from "../setup";

function createFakeRenderer() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = {
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    readPixels: vi.fn(
      (
        _x: number,
        _y: number,
        _width: number,
        _height: number,
        _format: number,
        _type: number,
        pixels: Uint8Array,
      ) => {
        for (let index = 0; index < pixels.length; index += 4) {
          const value = index % 8 === 0 ? 20 : 220;
          pixels[index] = value;
          pixels[index + 1] = value;
          pixels[index + 2] = value;
          pixels[index + 3] = 255;
        }
      },
    ),
  };
  return {
    domElement: canvas,
    shadowMap: { enabled: false, type: 0 },
    outputColorSpace: "",
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    getContext: vi.fn(() => context),
  } as unknown as THREE.WebGLRenderer;
}

function runtimeOptions(renderer: THREE.WebGLRenderer): SceneRuntimeOptions {
  return {
    camera: { fov: 40, near: 0.1, far: 10, position: [1, 2, 3] },
    reducedMotionTime: 2.5,
    visibility: { threshold: 0.2 },
    rendererFactory: () => renderer,
    baseUrl: "/synthetic",
  };
}

describe("shared scene runtime", () => {
  test("owns resize, visibility, frame rendering, pause, and disposal", () => {
    setReducedMotion(true);
    const renderer = createFakeRenderer();
    const mount = document.createElement("div");
    let width = 320;
    let height = 180;
    Object.defineProperties(mount, {
      clientWidth: { configurable: true, get: () => width },
      clientHeight: { configurable: true, get: () => height },
    });
    document.body.appendChild(mount);
    const updates = vi.fn();
    const controllerDispose = vi.fn();
    const controllerResize = vi.fn();
    const cleanup = vi.fn();
    const build = vi.fn((context) => {
      expect(context.baseUrl).toBe("/synthetic/");
      expect(context.camera.position.toArray()).toEqual([1, 2, 3]);
      context.addCleanup(cleanup);
      return { update: updates, resize: controllerResize, dispose: controllerDispose };
    });

    const dispose = mountSceneRuntime(mount, build, runtimeOptions(renderer));
    expect(mount).toContainElement(renderer.domElement);
    expect(renderer.setSize).toHaveBeenCalledWith(320, 180, false);
    const visibility = MockIntersectionObserver.instances.at(-1)!;
    visibility.trigger(mount, true);
    expect(updates).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(updates).toHaveBeenLastCalledWith({
      elapsed: 2.5,
      delta: 0,
      reducedMotion: true,
    });

    visibility.trigger(mount, false);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    const resize = MockResizeObserver.instances.at(-1)!;
    width = 640;
    height = 360;
    resize.trigger(mount, 640, 360);
    expect(renderer.setSize).toHaveBeenLastCalledWith(640, 360, false);
    expect(controllerResize).toHaveBeenLastCalledWith(640, 360);

    dispose();
    expect(visibility.disconnected).toBe(true);
    expect(resize.disconnected).toBe(true);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(controllerDispose).toHaveBeenCalledOnce();
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(mount).not.toContainElement(renderer.domElement);
    mount.remove();
  });

  test("falls back without browser observers and supports static invalidation", () => {
    setReducedMotion(true);
    vi.stubGlobal("IntersectionObserver", undefined);
    vi.stubGlobal("ResizeObserver", undefined);
    const renderer = createFakeRenderer();
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const updates = vi.fn();
    let context: SceneContext | null = null;

    const dispose = mountSceneRuntime(
      mount,
      (sceneContext) => {
        context = sceneContext;
        return { update: updates };
      },
      runtimeOptions(renderer),
    );
    expect(updates).toHaveBeenCalledOnce();
    (context as SceneContext | null)?.requestRender();
    expect(updates).toHaveBeenCalledTimes(2);
    window.dispatchEvent(new Event("resize"));
    expect(renderer.setSize).toHaveBeenCalledTimes(2);

    renderer.domElement.remove();
    expect(dispose).not.toThrow();
    mount.remove();
  });

  test("schedules animated frames and cancels them while offscreen", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let nextFrame = 1;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = nextFrame;
      nextFrame += 1;
      callbacks.set(id, callback);
      return id;
    });
    const cancelFrame = vi.fn((id: number) => callbacks.delete(id));
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);

    const renderer = createFakeRenderer();
    const mount = document.createElement("div");
    document.body.appendChild(mount);
    const updates = vi.fn();
    const dispose = mountSceneRuntime(
      mount,
      () => ({ update: updates }),
      runtimeOptions(renderer),
    );
    const visibility = MockIntersectionObserver.instances.at(-1)!;
    visibility.trigger(mount, true);
    expect(requestFrame).toHaveBeenCalledOnce();
    const firstFrame = callbacks.values().next().value as FrameRequestCallback;
    firstFrame(16);
    expect(updates).toHaveBeenCalledTimes(2);

    visibility.trigger(mount, false);
    expect(cancelFrame).toHaveBeenCalled();
    visibility.trigger(mount, true);
    expect(updates).toHaveBeenCalledTimes(3);
    dispose();
    mount.remove();
  });
});
