/*
  용원고등학교 도트 RPG - 2부품: tilemap.js

  목적:
  - 2차원 배열 맵을 화면에 렌더링한다.
  - 카메라 위치를 적용한다.
  - 화면 밖 타일은 그리지 않는다.
  - 이 파일은 맵 렌더링만 담당한다.
  - 플레이어, NPC, 전투, 미션 코드는 넣지 않는다.

  필요:
  - tileset.js가 먼저 로드되어 있어야 한다.
  - window.YONGWON_TILESET.drawTile(ctx, tileId, x, y)를 사용한다.
*/

class TileMap {
  constructor(options) {
    if (!window.YONGWON_TILESET) {
      throw new Error("tileset.js가 먼저 로드되어야 합니다.");
    }

    this.tileSize = window.YONGWON_TILESET.TILE_SIZE;
    this.width = options.width;
    this.height = options.height;
    this.name = options.name || "이름 없는 맵";
    this.layers = options.layers || {};
    this.collision = options.collision || null;

    if (!this.layers.ground) {
      throw new Error("TileMap에는 ground 레이어가 필요합니다.");
    }

    this.pixelWidth = this.width * this.tileSize;
    this.pixelHeight = this.height * this.tileSize;
  }

  getTile(layerName, tx, ty) {
    const layer = this.layers[layerName];
    if (!layer) return null;
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return null;
    return layer[ty][tx];
  }

  isSolid(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;

    if (this.collision) {
      return !!this.collision[ty][tx];
    }

    const tile = this.getTile("objects", tx, ty);
    if (tile === null || tile === undefined || tile < 0) return false;
    return !!window.YONGWON_TILESET.TILE_SOLID[tile];
  }

  render(ctx, camera, viewportWidth, viewportHeight, options = {}) {
    const tileSize = this.tileSize;
    const drawTile = window.YONGWON_TILESET.drawTile;

    const startTileX = Math.max(0, Math.floor(camera.x / tileSize) - 1);
    const startTileY = Math.max(0, Math.floor(camera.y / tileSize) - 1);
    const endTileX = Math.min(this.width - 1, Math.ceil((camera.x + viewportWidth) / tileSize) + 1);
    const endTileY = Math.min(this.height - 1, Math.ceil((camera.y + viewportHeight) / tileSize) + 1);

    let rendered = 0;

    const layerOrder = options.layerOrder || ["ground", "detail", "objects"];

    for (const layerName of layerOrder) {
      const layer = this.layers[layerName];
      if (!layer) continue;

      for (let ty = startTileY; ty <= endTileY; ty++) {
        for (let tx = startTileX; tx <= endTileX; tx++) {
          const tileId = layer[ty][tx];

          // -1은 빈 타일. 해당 레이어에서 아무것도 그리지 않는다.
          if (tileId === -1 || tileId === null || tileId === undefined) continue;

          const sx = Math.floor(tx * tileSize - camera.x);
          const sy = Math.floor(ty * tileSize - camera.y);

          drawTile(ctx, tileId, sx, sy);
          rendered++;
        }
      }
    }

    if (options.showCollision) {
      this.renderCollisionDebug(ctx, camera, startTileX, startTileY, endTileX, endTileY);
    }

    return {
      renderedTiles: rendered,
      startTileX,
      startTileY,
      endTileX,
      endTileY
    };
  }

  renderCollisionDebug(ctx, camera, startTileX, startTileY, endTileX, endTileY) {
    const tileSize = this.tileSize;

    ctx.save();
    ctx.globalAlpha = 0.34;

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        if (!this.isSolid(tx, ty)) continue;

        const sx = Math.floor(tx * tileSize - camera.x);
        const sy = Math.floor(ty * tileSize - camera.y);

        ctx.fillStyle = "#ff3b5f";
        ctx.fillRect(sx + 2, sy + 2, tileSize - 4, tileSize - 4);
      }
    }

    ctx.restore();
  }

  clampCamera(camera, viewportWidth, viewportHeight) {
    camera.x = Math.max(0, Math.min(camera.x, Math.max(0, this.pixelWidth - viewportWidth)));
    camera.y = Math.max(0, Math.min(camera.y, Math.max(0, this.pixelHeight - viewportHeight)));
  }
}

function createEmptyLayer(width, height, fillTile = -1) {
  return Array.from({ length: height }, () => Array(width).fill(fillTile));
}

function fillRect(layer, x, y, w, h, tileId) {
  for (let ty = y; ty < y + h; ty++) {
    for (let tx = x; tx < x + w; tx++) {
      if (ty >= 0 && tx >= 0 && ty < layer.length && tx < layer[0].length) {
        layer[ty][tx] = tileId;
      }
    }
  }
}

function fillLineH(layer, x, y, w, tileId) {
  fillRect(layer, x, y, w, 1, tileId);
}

function fillLineV(layer, x, y, h, tileId) {
  fillRect(layer, x, y, 1, h, tileId);
}

function stampTree(objects, x, y, T) {
  // 2x2 잎 + 기둥 형태
  objects[y][x] = T.TREE_LEAF;
  objects[y][x + 1] = T.TREE_LEAF;
  objects[y + 1][x] = T.TREE_LEAF;
  objects[y + 1][x + 1] = T.TREE_LEAF;
  objects[y + 2][x] = T.TREE_TRUNK;
  objects[y + 2][x + 1] = T.TREE_TRUNK;
}

function createSchoolFrontMap() {
  const T = window.YONGWON_TILESET.TILE;

  const width = 64;
  const height = 48;

  const ground = createEmptyLayer(width, height, T.GRASS);
  const detail = createEmptyLayer(width, height, -1);
  const objects = createEmptyLayer(width, height, -1);
  const collision = createEmptyLayer(width, height, 0);

  // 중앙 길
  fillRect(ground, 0, 34, width, 5, T.DIRT_PATH);
  fillRect(ground, 29, 14, 6, 24, T.DIRT_PATH);

  // 본관 앞 보도
  fillRect(ground, 18, 19, 28, 8, T.STONE_PATH);
  fillRect(ground, 23, 27, 18, 7, T.STONE_PATH);

  // 본관 건물
  fillRect(ground, 13, 4, 38, 14, T.SCHOOL_WALL);
  fillRect(objects, 13, 3, 38, 2, T.ROOF);
  fillRect(objects, 13, 17, 38, 1, T.SCHOOL_WALL);
  fillRect(objects, 16, 7, 3, 2, T.WATER);       // 창문 대체
  fillRect(objects, 23, 7, 3, 2, T.WATER);
  fillRect(objects, 36, 7, 3, 2, T.WATER);
  fillRect(objects, 44, 7, 3, 2, T.WATER);
  fillRect(objects, 29, 16, 6, 2, T.DOOR);

  // 충돌: 본관 전체, 문 앞만 통과 가능
  fillRect(collision, 13, 4, 38, 14, 1);
  fillRect(collision, 29, 16, 6, 2, 0);

  // 게시판
  fillRect(objects, 18, 21, 2, 2, T.NOTICE_BOARD);
  fillRect(collision, 18, 21, 2, 2, 1);

  // 분수대
  fillRect(ground, 30, 24, 5, 5, T.WATER);
  fillRect(collision, 30, 24, 5, 5, 1);

  // 벤치
  const benches = [
    [24, 29], [39, 29], [20, 37], [43, 37]
  ];
  for (const [x, y] of benches) {
    fillRect(objects, x, y, 3, 1, T.BENCH);
    fillRect(collision, x, y, 3, 1, 1);
  }

  // 화단
  fillRect(objects, 7, 22, 8, 3, T.FLOWER_BED);
  fillRect(objects, 49, 22, 8, 3, T.FLOWER_BED);
  fillRect(objects, 7, 41, 10, 3, T.FLOWER_BED);
  fillRect(objects, 47, 41, 10, 3, T.FLOWER_BED);
  fillRect(collision, 7, 22, 8, 3, 1);
  fillRect(collision, 49, 22, 8, 3, 1);
  fillRect(collision, 7, 41, 10, 3, 1);
  fillRect(collision, 47, 41, 10, 3, 1);

  // 나무
  const treeSpots = [
    [5, 7], [8, 13], [4, 20], [8, 29], [4, 38],
    [55, 7], [52, 13], [57, 20], [54, 30], [58, 38],
    [18, 43], [23, 43], [39, 43], [45, 43]
  ];
  for (const [x, y] of treeSpots) {
    stampTree(objects, x, y, T);
    fillRect(collision, x, y, 2, 3, 1);
  }

  // 외곽 울타리
  fillLineH(objects, 0, 0, width, T.FENCE);
  fillLineH(objects, 0, height - 1, width, T.FENCE);
  fillLineV(objects, 0, 0, height, T.FENCE);
  fillLineV(objects, width - 1, 0, height, T.FENCE);
  fillLineH(collision, 0, 0, width, 1);
  fillLineH(collision, 0, height - 1, width, 1);
  fillLineV(collision, 0, 0, height, 1);
  fillLineV(collision, width - 1, 0, height, 1);

  // 방향 표시용 길 장식
  fillRect(detail, 52, 35, 3, 1, T.ROAD);
  fillRect(detail, 9, 35, 3, 1, T.ROAD);
  fillRect(detail, 31, 41, 2, 1, T.ROAD);

  return new TileMap({
    name: "용원고 본관 앞",
    width,
    height,
    layers: {
      ground,
      detail,
      objects
    },
    collision
  });
}

if (typeof window !== "undefined") {
  window.YONGWON_TILEMAP = {
    TileMap,
    createEmptyLayer,
    fillRect,
    fillLineH,
    fillLineV,
    createSchoolFrontMap
  };
}
