import { describe, it, expect } from "vitest";
import type { Scene } from "phaser";
import { getSceneScale } from "../SceneScaling";
import {
  GAME_WIDTH_SCALE,
  GAME_HEIGHT_SCALE,
  SCENE_800_600_W,
  SCENE_800_600_H,
  SCENE_800_600_CX,
  SCENE_800_600_CY,
  SCENE_400_800_W,
  SCENE_400_800_H,
  SCENE_400_800_CX,
  SCENE_400_800_CY,
  SCENE_LANDSCAPE_W,
  SCENE_LARGE_W,
  SCENE_LARGE_H,
} from "../../../constants";

function makeScene(cfg: {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}): unknown {
  return { cameras: { main: cfg } };
}

describe("getSceneScale", () => {
  it("returns centerX and centerY from camera", () => {
    const result = getSceneScale(
      makeScene({
        centerX: SCENE_800_600_CX,
        centerY: SCENE_800_600_CY,
        width: SCENE_800_600_W,
        height: SCENE_800_600_H,
      }) as unknown as Scene,
    );
    expect(result.centerX).toBe(SCENE_800_600_CX);
    expect(result.centerY).toBe(SCENE_800_600_CY);
  });

  it("computes scale as min of width/ratio and height/ratio", () => {
    const result = getSceneScale(
      makeScene({
        centerX: SCENE_800_600_CX,
        centerY: SCENE_800_600_CY,
        width: SCENE_800_600_W,
        height: SCENE_800_600_H,
      }) as unknown as Scene,
    );
    const expected = Math.min(
      SCENE_800_600_W / GAME_WIDTH_SCALE,
      SCENE_800_600_H / GAME_HEIGHT_SCALE,
    );
    expect(result.scale).toBe(expected);
  });

  it("uses the smaller axis for scale (portrait orientation)", () => {
    const result = getSceneScale(
      makeScene({
        centerX: SCENE_400_800_CX,
        centerY: SCENE_400_800_CY,
        width: SCENE_400_800_W,
        height: SCENE_400_800_H,
      }) as unknown as Scene,
    );
    const expected = Math.min(
      SCENE_400_800_W / GAME_WIDTH_SCALE,
      SCENE_400_800_H / GAME_HEIGHT_SCALE,
    );
    expect(result.scale).toBe(expected);
  });

  it("returns scale of 1 when dimensions match reference", () => {
    const result = getSceneScale(
      makeScene({
        centerX: GAME_WIDTH_SCALE / 2,
        centerY: GAME_HEIGHT_SCALE / 2,
        width: GAME_WIDTH_SCALE,
        height: GAME_HEIGHT_SCALE,
      }) as unknown as Scene,
    );
    expect(result.scale).toBe(1);
  });

  it("uses width as limiting factor in wide landscape", () => {
    const result = getSceneScale(
      makeScene({
        centerX: SCENE_800_600_CX,
        centerY: SCENE_800_600_CY,
        width: SCENE_LANDSCAPE_W,
        height: SCENE_800_600_H,
      }) as unknown as Scene,
    );
    const expected = Math.min(
      SCENE_LANDSCAPE_W / GAME_WIDTH_SCALE,
      SCENE_800_600_H / GAME_HEIGHT_SCALE,
    );
    expect(result.scale).toBe(expected);
  });

  it("returns 0.5 for half-size dimensions", () => {
    const result = getSceneScale(
      makeScene({
        centerX: GAME_WIDTH_SCALE / 4,
        centerY: GAME_HEIGHT_SCALE / 4,
        width: GAME_WIDTH_SCALE / 2,
        height: GAME_HEIGHT_SCALE / 2,
      }) as unknown as Scene,
    );
    expect(result.scale).toBe(0.5);
  });

  it("returns 2 for double-size dimensions", () => {
    const result = getSceneScale(
      makeScene({
        centerX: GAME_WIDTH_SCALE,
        centerY: GAME_HEIGHT_SCALE,
        width: GAME_WIDTH_SCALE * 2,
        height: GAME_HEIGHT_SCALE * 2,
      }) as unknown as Scene,
    );
    expect(result.scale).toBe(2);
  });

  it("does not truncate scale to integer", () => {
    const result = getSceneScale(
      makeScene({
        centerX: SCENE_800_600_CX,
        centerY: SCENE_800_600_CY,
        width: SCENE_LARGE_W,
        height: SCENE_LARGE_H,
      }) as unknown as Scene,
    );
    expect(Number.isInteger(result.scale)).toBe(false);
  });
});
