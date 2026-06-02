/*
  용원고등학교 도트 RPG - 10부품: scene_manager.js

  목적:
  - 여러 구역 맵 생성
  - 현재 구역 전환
  - 출입구/길목 트리거 관리
  - 구역별 스폰 위치 관리

  포함 구역:
  - school_front: 본관 앞
  - field: 운동장
  - cafeteria: 급식실
  - science: 과학실
  - gym: 체육관
  - gate: 정문

  아직 넣지 않는 것:
  - 저장
  - 보스전
  - 구역별 미션 강제 조건
*/

class SceneManager {
  constructor() {
    this.scenes = {};
    this.currentId = "school_front";
    this.transitionCooldown = 0;
    this.fadeTimer = 0;
    this.lastTransitionLabel = "";
  }

  registerScene(id, scene) {
    this.scenes[id] = scene;
  }

  getScene(id = this.currentId) {
    return this.scenes[id] || null;
  }

  getMap() {
    const scene = this.getScene();
    return scene ? scene.map : null;
  }

  getSceneName() {
    const scene = this.getScene();
    return scene ? scene.name : "-";
  }

  update(dt) {
    this.transitionCooldown = Math.max(0, this.transitionCooldown - dt);
    this.fadeTimer = Math.max(0, this.fadeTimer - dt);
  }

  switchTo(sceneId, spawnId, player) {
    const next = this.scenes[sceneId];
    if (!next) return false;

    this.currentId = sceneId;
    this.transitionCooldown = 0.45;
    this.fadeTimer = 0.34;

    const spawn = next.spawns[spawnId] || next.spawns.default;
    if (spawn && player) {
      player.x = spawn.x;
      player.y = spawn.y;
      player.dir = spawn.dir ?? player.dir;
      player.facing = spawn.facing || player.facing;
      player.dashTimer = 0;
      player.dashCooldown = 0;
    }

    this.lastTransitionLabel = next.name;
    return true;
  }

  nearestTransition(player, maxDistance = 26) {
    const scene = this.getScene();
    if (!scene || !scene.transitions) return null;

    let best = null;
    let bestD = maxDistance;

    for (const t of scene.transitions) {
      const d = Math.hypot(player.x - t.x, player.y - t.y);
      if (d < bestD) {
        best = t;
        bestD = d;
      }
    }

    return best;
  }

  tryTransition(player) {
    if (this.transitionCooldown > 0) return null;

    // 모바일 터치 이동은 좌표를 정확히 맞추기 어려우므로 전환 판정 범위를 넓힌다.
    const t = this.nearestTransition(player, 44);
    if (!t) return null;

    const ok = this.switchTo(t.to, t.spawn, player);
    if (!ok) return null;

    return t;
  }

  renderTransitionHint(ctx, player) {
    const t = this.nearestTransition(player, 44);
    if (!t) return;

    ctx.save();
    const text = `${t.label} 이동 가능`;
    ctx.font = "bold 8px system-ui, sans-serif";
    const w = Math.ceil(ctx.measureText(text).width) + 14;
    const x = Math.floor((320 - w) / 2);
    const y = 180 - 24;

    ctx.fillStyle = "rgba(0,0,0,.72)";
    ctx.fillRect(x, y, w, 16);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x + 7, y + 11);
    ctx.restore();
  }

  renderFade(ctx) {
    if (this.fadeTimer <= 0) return;

    const a = Math.min(0.65, this.fadeTimer / 0.34);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 320, 180);
    ctx.restore();
  }
}

function createLayerSet(width, height, baseTile) {
  const M = window.YONGWON_TILEMAP;
  return {
    ground: M.createEmptyLayer(width, height, baseTile),
    detail: M.createEmptyLayer(width, height, -1),
    objects: M.createEmptyLayer(width, height, -1),
    collision: M.createEmptyLayer(width, height, 0)
  };
}

function createGenericSceneMap(config) {
  const T = window.YONGWON_TILESET.TILE;
  const M = window.YONGWON_TILEMAP;

  const width = config.width || 52;
  const height = config.height || 38;
  const L = createLayerSet(width, height, config.baseTile ?? T.GRASS);

  function rect(layer, x, y, w, h, tile) {
    M.fillRect(layer, x, y, w, h, tile);
  }

  function solid(x, y, w, h, value = 1) {
    M.fillRect(L.collision, x, y, w, h, value);
  }

  // 외곽 울타리/벽
  rect(L.objects, 0, 0, width, 1, config.borderTile ?? T.FENCE);
  rect(L.objects, 0, height - 1, width, 1, config.borderTile ?? T.FENCE);
  rect(L.objects, 0, 0, 1, height, config.borderTile ?? T.FENCE);
  rect(L.objects, width - 1, 0, 1, height, config.borderTile ?? T.FENCE);
  solid(0, 0, width, 1);
  solid(0, height - 1, width, 1);
  solid(0, 0, 1, height);
  solid(width - 1, 0, 1, height);

  if (config.kind === "field") {
    rect(L.ground, 1, 1, width - 2, height - 2, T.SAND_FIELD);
    rect(L.ground, 4, 5, width - 8, height - 10, T.DIRT_PATH);
    rect(L.detail, 8, 10, width - 16, 1, T.ROAD);
    rect(L.detail, 8, height - 11, width - 16, 1, T.ROAD);
    rect(L.objects, 9, 8, 2, 1, T.LOCKER);
    rect(L.objects, width - 11, height - 9, 2, 1, T.LOCKER);
    solid(9, 8, 2, 1);
    solid(width - 11, height - 9, 2, 1);
    L.objects[19][26] = T.BALL;
    solid(26, 19, 1, 1);
  }

  if (config.kind === "cafeteria") {
    rect(L.ground, 1, 1, width - 2, height - 2, T.SCHOOL_FLOOR);
    rect(L.objects, 2, 2, width - 4, 1, T.SERVING_COUNTER);
    solid(2, 2, width - 4, 1);

    for (let y = 8; y < height - 6; y += 5) {
      for (let x = 7; x < width - 8; x += 8) {
        rect(L.objects, x, y, 3, 2, T.CAFETERIA_TABLE);
        solid(x, y, 3, 2);
      }
    }

    rect(L.objects, width - 3, 17, 2, 4, T.DOOR);
    solid(width - 3, 17, 2, 4, 0);
  }

  if (config.kind === "science") {
    rect(L.ground, 1, 1, width - 2, height - 2, T.SCHOOL_FLOOR);
    rect(L.objects, 18, 1, 8, 1, T.CHALKBOARD);
    solid(18, 1, 8, 1);

    for (let y = 7; y < height - 5; y += 5) {
      for (let x = 6; x < width - 8; x += 7) {
        rect(L.objects, x, y, 2, 1, T.DESK);
        solid(x, y, 2, 1);
      }
    }

    rect(L.objects, width - 3, 17, 2, 4, T.DOOR);
    solid(width - 3, 17, 2, 4, 0);
  }

  if (config.kind === "gym") {
    rect(L.ground, 1, 1, width - 2, height - 2, T.GYM_FLOOR);
    rect(L.detail, 6, 7, width - 12, 1, T.STONE_PATH);
    rect(L.detail, 6, height - 8, width - 12, 1, T.STONE_PATH);
    rect(L.objects, 6, 3, 3, 1, T.LOCKER);
    rect(L.objects, width - 9, height - 4, 3, 1, T.LOCKER);
    solid(6, 3, 3, 1);
    solid(width - 9, height - 4, 3, 1);
    L.objects[17][25] = T.BALL;
    solid(25, 17, 1, 1);
  }

  if (config.kind === "gate") {
    rect(L.ground, 1, 1, width - 2, height - 2, T.GRASS);
    rect(L.ground, 20, 0, 12, height, T.ROAD);
    rect(L.ground, 0, 17, width, 5, T.DIRT_PATH);
    rect(L.objects, 16, 10, 2, 15, T.FENCE);
    rect(L.objects, 34, 10, 2, 15, T.FENCE);
    solid(16, 10, 2, 15);
    solid(34, 10, 2, 15);
    rect(L.objects, 23, 13, 6, 2, T.LOCKER);
    solid(23, 13, 6, 2);
  }

  const map = new M.TileMap({
    name: config.name,
    width,
    height,
    layers: {
      ground: L.ground,
      detail: L.detail,
      objects: L.objects
    },
    collision: L.collision
  });

  map.labels = config.labels || [];
  map.interactionPoints = config.interactionPoints || [];

  return map;
}

function buildSceneManager() {
  const S = 16;
  const manager = new SceneManager();

  const frontMap = window.YONGWON_MAP_SCHOOL_FRONT.createSchoolFrontMapDetailed();

  manager.registerScene("school_front", {
    id: "school_front",
    name: "본관 앞",
    map: frontMap,
    spawns: {
      default: { x: 42*S, y: 42*S, facing: "up", dir: -Math.PI/2 },
      from_field: { x: 76*S, y: 36*S, facing: "left", dir: Math.PI },
      from_cafeteria: { x: 8*S, y: 36*S, facing: "right", dir: 0 },
      from_science: { x: 42*S, y: 21*S, facing: "down", dir: Math.PI/2 },
      from_gym: { x: 18*S, y: 54*S, facing: "right", dir: 0 },
      from_gate: { x: 42*S, y: 55*S, facing: "up", dir: -Math.PI/2 }
    },
    transitions: [
      { id: "to_field", label: "운동장", x: 77*S, y: 35*S, to: "field", spawn: "from_front" },
      { id: "to_cafeteria", label: "급식실", x: 7*S, y: 35*S, to: "cafeteria", spawn: "from_front" },
      { id: "to_science", label: "과학실", x: 42*S, y: 20*S, to: "science", spawn: "from_front" },
      { id: "to_gym", label: "체육관", x: 14*S, y: 55*S, to: "gym", spawn: "from_front" },
      { id: "to_gate", label: "정문", x: 42*S, y: 58*S, to: "gate", spawn: "from_front" }
    ]
  });

  const fieldMap = createGenericSceneMap({
    name: "운동장",
    kind: "field",
    width: 56,
    height: 40,
    baseTile: window.YONGWON_TILESET.TILE.SAND_FIELD,
    labels: [
      { text: "용원고 운동장", x: 20*S, y: 5*S, type: "large" },
      { text: "본관 앞 ←", x: 2*S, y: 19*S, type: "small" }
    ]
  });

  manager.registerScene("field", {
    id: "field",
    name: "운동장",
    map: fieldMap,
    spawns: {
      default: { x: 5*S, y: 20*S, facing: "right", dir: 0 },
      from_front: { x: 5*S, y: 20*S, facing: "right", dir: 0 }
    },
    transitions: [
      { id: "field_to_front", label: "본관 앞", x: 2*S, y: 20*S, to: "school_front", spawn: "from_field" }
    ]
  });

  const cafeteriaMap = createGenericSceneMap({
    name: "급식실",
    kind: "cafeteria",
    width: 52,
    height: 38,
    baseTile: window.YONGWON_TILESET.TILE.SCHOOL_FLOOR,
    borderTile: window.YONGWON_TILESET.TILE.SCHOOL_WALL,
    labels: [
      { text: "급식실", x: 22*S, y: 5*S, type: "large" },
      { text: "본관 앞 →", x: 42*S, y: 18*S, type: "small" }
    ]
  });

  manager.registerScene("cafeteria", {
    id: "cafeteria",
    name: "급식실",
    map: cafeteriaMap,
    spawns: {
      default: { x: 46*S, y: 19*S, facing: "left", dir: Math.PI },
      from_front: { x: 46*S, y: 19*S, facing: "left", dir: Math.PI }
    },
    transitions: [
      { id: "cafeteria_to_front", label: "본관 앞", x: 49*S, y: 19*S, to: "school_front", spawn: "from_cafeteria" }
    ]
  });

  const scienceMap = createGenericSceneMap({
    name: "과학실",
    kind: "science",
    width: 52,
    height: 38,
    baseTile: window.YONGWON_TILESET.TILE.SCHOOL_FLOOR,
    borderTile: window.YONGWON_TILESET.TILE.SCHOOL_WALL,
    labels: [
      { text: "과학실", x: 22*S, y: 5*S, type: "large" },
      { text: "본관 앞 →", x: 42*S, y: 18*S, type: "small" }
    ]
  });

  manager.registerScene("science", {
    id: "science",
    name: "과학실",
    map: scienceMap,
    spawns: {
      default: { x: 46*S, y: 19*S, facing: "left", dir: Math.PI },
      from_front: { x: 46*S, y: 19*S, facing: "left", dir: Math.PI }
    },
    transitions: [
      { id: "science_to_front", label: "본관 앞", x: 49*S, y: 19*S, to: "school_front", spawn: "from_science" }
    ]
  });

  const gymMap = createGenericSceneMap({
    name: "체육관",
    kind: "gym",
    width: 56,
    height: 40,
    baseTile: window.YONGWON_TILESET.TILE.GYM_FLOOR,
    borderTile: window.YONGWON_TILESET.TILE.SCHOOL_WALL,
    labels: [
      { text: "체육관", x: 24*S, y: 5*S, type: "large" },
      { text: "본관 앞 ←", x: 2*S, y: 20*S, type: "small" }
    ]
  });

  manager.registerScene("gym", {
    id: "gym",
    name: "체육관",
    map: gymMap,
    spawns: {
      default: { x: 5*S, y: 20*S, facing: "right", dir: 0 },
      from_front: { x: 5*S, y: 20*S, facing: "right", dir: 0 }
    },
    transitions: [
      { id: "gym_to_front", label: "본관 앞", x: 2*S, y: 20*S, to: "school_front", spawn: "from_gym" }
    ]
  });

  const gateMap = createGenericSceneMap({
    name: "정문",
    kind: "gate",
    width: 52,
    height: 38,
    baseTile: window.YONGWON_TILESET.TILE.GRASS,
    labels: [
      { text: "용원고 정문", x: 21*S, y: 6*S, type: "large" },
      { text: "본관 앞 ↑", x: 22*S, y: 3*S, type: "small" },
      { text: "봉쇄 구역", x: 23*S, y: 16*S, type: "small" }
    ]
  });

  manager.registerScene("gate", {
    id: "gate",
    name: "정문",
    map: gateMap,
    spawns: {
      default: { x: 26*S, y: 5*S, facing: "down", dir: Math.PI/2 },
      from_front: { x: 26*S, y: 5*S, facing: "down", dir: Math.PI/2 }
    },
    transitions: [
      { id: "gate_to_front", label: "본관 앞", x: 26*S, y: 2*S, to: "school_front", spawn: "from_gate" }
    ]
  });

  return manager;
}

if (typeof window !== "undefined") {
  window.YONGWON_SCENE = {
    SceneManager,
    buildSceneManager,
    createGenericSceneMap
  };
}
