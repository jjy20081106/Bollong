/*
  용원고등학교 도트 RPG - 1부품: tileset.js

  목적:
  - 16x16 도트 타일만 담당한다.
  - 맵, 플레이어, NPC, 전투 코드는 여기 넣지 않는다.
  - 다음 부품(tilemap.js)에서 drawTile(ctx, tileId, x, y)를 호출해서 사용한다.
*/

const TILE_SIZE = 16;

const TILE = Object.freeze({
  GRASS: 0,
  DIRT_PATH: 1,
  STONE_PATH: 2,
  SCHOOL_FLOOR: 3,
  SCHOOL_WALL: 4,
  ROOF: 5,
  TREE_TRUNK: 6,
  TREE_LEAF: 7,
  FENCE: 8,
  WATER: 9,
  BENCH: 10,
  NOTICE_BOARD: 11,
  DOOR: 12,
  FLOWER_BED: 13,
  DESK: 14,
  CHALKBOARD: 15,
  LOCKER: 16,
  CAFETERIA_TABLE: 17,
  SERVING_COUNTER: 18,
  ROAD: 19,
  GYM_FLOOR: 20,
  SAND_FIELD: 21,
  BALL: 22,
  SHADOW_MARK: 23
});

const TILE_NAMES = [
  "잔디",
  "흙길",
  "보도블럭",
  "학교 바닥",
  "학교 벽",
  "본관 지붕",
  "나무 기둥",
  "나뭇잎",
  "울타리",
  "물",
  "벤치",
  "게시판",
  "문",
  "화단",
  "책상",
  "칠판",
  "사물함",
  "급식실 식탁",
  "배식대",
  "도로",
  "체육관 바닥",
  "운동장 모래",
  "공",
  "그림자 흔적"
];

const TILE_SOLID = Object.freeze({
  [TILE.GRASS]: false,
  [TILE.DIRT_PATH]: false,
  [TILE.STONE_PATH]: false,
  [TILE.SCHOOL_FLOOR]: false,
  [TILE.SCHOOL_WALL]: true,
  [TILE.ROOF]: true,
  [TILE.TREE_TRUNK]: true,
  [TILE.TREE_LEAF]: true,
  [TILE.FENCE]: true,
  [TILE.WATER]: true,
  [TILE.BENCH]: true,
  [TILE.NOTICE_BOARD]: true,
  [TILE.DOOR]: false,
  [TILE.FLOWER_BED]: true,
  [TILE.DESK]: true,
  [TILE.CHALKBOARD]: true,
  [TILE.LOCKER]: true,
  [TILE.CAFETERIA_TABLE]: true,
  [TILE.SERVING_COUNTER]: true,
  [TILE.ROAD]: false,
  [TILE.GYM_FLOOR]: false,
  [TILE.SAND_FIELD]: false,
  [TILE.BALL]: true,
  [TILE.SHADOW_MARK]: false
});

const PALETTE = Object.freeze({
  outline: "#10131a",
  shade: "rgba(0,0,0,.28)",
  shine: "rgba(255,255,255,.22)",

  grassA: "#74b743",
  grassB: "#5e9d35",
  grassC: "#386f25",

  dirtA: "#d7bd75",
  dirtB: "#b99653",
  dirtC: "#7f6238",

  stoneA: "#b8c0c4",
  stoneB: "#9da7ad",
  stoneC: "#68737a",

  wallA: "#7e8a9e",
  wallB: "#657184",
  wallC: "#3d4555",

  roofA: "#5b6477",
  roofB: "#394153",
  roofC: "#222838",

  woodA: "#b0804b",
  woodB: "#875d35",
  woodC: "#543920",

  leafA: "#3fa34d",
  leafB: "#2d7f3c",
  leafC: "#1d5529",

  waterA: "#66c7f0",
  waterB: "#3d94d3",
  waterC: "#23639b",

  flowerA: "#ffd4ec",
  flowerB: "#fff0a0",
  flowerC: "#ff8fba",

  boardA: "#2e6b3c",
  boardB: "#1b4025",
  chalk: "#e9f3d7",

  metalA: "#c5c9d2",
  metalB: "#8d96a3",
  metalC: "#58616c",

  redA: "#d66d5b",
  redB: "#a8483f"
});

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawPixelBorder(ctx, x, y, w, h, light = PALETTE.shine, dark = PALETTE.shade) {
  px(ctx, x, y, w, 1, light);
  px(ctx, x, y, 1, h, light);
  px(ctx, x, y + h - 1, w, 1, dark);
  px(ctx, x + w - 1, y, 1, h, dark);
}

function drawTile(ctx, tileId, x, y) {
  const s = TILE_SIZE;
  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled = false;

  switch (tileId) {
    case TILE.GRASS:
      px(ctx, 0, 0, s, s, PALETTE.grassA);
      px(ctx, 0, 8, s, 8, PALETTE.grassB);
      px(ctx, 3, 3, 2, 2, PALETTE.grassC);
      px(ctx, 10, 4, 2, 2, PALETTE.grassC);
      px(ctx, 6, 12, 2, 2, PALETTE.grassC);
      px(ctx, 13, 11, 1, 2, PALETTE.grassC);
      break;

    case TILE.DIRT_PATH:
      px(ctx, 0, 0, s, s, PALETTE.dirtA);
      px(ctx, 0, 9, s, 7, PALETTE.dirtB);
      px(ctx, 2, 3, 3, 2, PALETTE.dirtC);
      px(ctx, 10, 5, 2, 2, PALETTE.dirtC);
      px(ctx, 6, 12, 3, 1, PALETTE.dirtC);
      px(ctx, 13, 11, 2, 2, PALETTE.dirtC);
      break;

    case TILE.STONE_PATH:
      px(ctx, 0, 0, s, s, PALETTE.stoneA);
      for (let yy = 0; yy < s; yy += 8) {
        for (let xx = 0; xx < s; xx += 8) {
          px(ctx, xx + 1, yy + 1, 6, 6, (xx + yy) % 16 === 0 ? PALETTE.stoneB : "#aab3b9");
        }
      }
      px(ctx, 7, 0, 1, s, PALETTE.stoneC);
      px(ctx, 0, 7, s, 1, PALETTE.stoneC);
      break;

    case TILE.SCHOOL_FLOOR:
      px(ctx, 0, 0, s, s, "#b78a56");
      px(ctx, 0, 8, s, 8, "#a97b4d");
      for (let xx = 0; xx < s; xx += 4) px(ctx, xx, 0, 1, s, "rgba(80,45,24,.22)");
      px(ctx, 0, 7, s, 1, "rgba(255,255,255,.18)");
      break;

    case TILE.SCHOOL_WALL:
      px(ctx, 0, 0, s, s, PALETTE.wallA);
      px(ctx, 0, 8, s, 8, PALETTE.wallB);
      px(ctx, 0, 0, s, 2, "#9aa6b8");
      px(ctx, 0, 7, s, 1, PALETTE.wallC);
      px(ctx, 7, 0, 1, s, PALETTE.wallC);
      drawPixelBorder(ctx, 0, 0, s, s);
      break;

    case TILE.ROOF:
      px(ctx, 0, 0, s, s, PALETTE.roofA);
      px(ctx, 0, 8, s, 8, PALETTE.roofB);
      for (let yy = 2; yy < s; yy += 5) px(ctx, 0, yy, s, 2, PALETTE.roofC);
      px(ctx, 2, 1, 12, 2, "rgba(255,255,255,.10)");
      break;

    case TILE.TREE_TRUNK:
      px(ctx, 0, 0, s, s, "#3a7b39");
      px(ctx, 5, 2, 6, 14, PALETTE.woodB);
      px(ctx, 7, 2, 2, 13, PALETTE.woodA);
      px(ctx, 5, 3, 2, 13, PALETTE.woodC);
      px(ctx, 3, 13, 10, 2, "rgba(0,0,0,.18)");
      break;

    case TILE.TREE_LEAF:
      px(ctx, 0, 0, s, s, "#3a7b39");
      px(ctx, 3, 2, 10, 12, PALETTE.leafB);
      px(ctx, 1, 5, 14, 8, PALETTE.leafB);
      px(ctx, 5, 0, 6, 4, PALETTE.leafA);
      px(ctx, 4, 4, 5, 4, PALETTE.leafA);
      px(ctx, 10, 11, 3, 2, PALETTE.leafC);
      break;

    case TILE.FENCE:
      px(ctx, 0, 0, s, s, "#4f9140");
      px(ctx, 0, 5, s, 4, "#d7c1a1");
      px(ctx, 0, 10, s, 3, "#b99d7c");
      px(ctx, 2, 2, 2, 13, "#f1dcc1");
      px(ctx, 8, 2, 2, 13, "#f1dcc1");
      px(ctx, 14, 2, 2, 13, "#f1dcc1");
      px(ctx, 2, 12, 14, 1, "rgba(0,0,0,.22)");
      break;

    case TILE.WATER:
      px(ctx, 0, 0, s, s, PALETTE.waterB);
      px(ctx, 0, 9, s, 7, PALETTE.waterC);
      px(ctx, 2, 4, 5, 2, PALETTE.waterA);
      px(ctx, 9, 8, 5, 2, PALETTE.waterA);
      px(ctx, 4, 13, 4, 1, "#bdeeff");
      break;

    case TILE.BENCH:
      px(ctx, 0, 0, s, s, "#4f9140");
      px(ctx, 2, 6, 12, 4, PALETTE.woodA);
      px(ctx, 2, 10, 12, 3, PALETTE.woodB);
      px(ctx, 3, 13, 2, 3, PALETTE.woodC);
      px(ctx, 11, 13, 2, 3, PALETTE.woodC);
      break;

    case TILE.NOTICE_BOARD:
      px(ctx, 0, 0, s, s, "#4f9140");
      px(ctx, 2, 2, 12, 10, PALETTE.boardA);
      px(ctx, 2, 2, 12, 2, "#6c8b57");
      px(ctx, 4, 5, 8, 1, PALETTE.chalk);
      px(ctx, 4, 8, 6, 1, PALETTE.chalk);
      px(ctx, 3, 12, 2, 4, PALETTE.woodC);
      px(ctx, 11, 12, 2, 4, PALETTE.woodC);
      break;

    case TILE.DOOR:
      px(ctx, 0, 0, s, s, PALETTE.wallB);
      px(ctx, 3, 1, 10, 15, "#d5b778");
      px(ctx, 5, 3, 6, 11, "#b78c4f");
      px(ctx, 10, 8, 2, 2, "#f7e39b");
      px(ctx, 3, 1, 1, 15, PALETTE.woodC);
      break;

    case TILE.FLOWER_BED:
      px(ctx, 0, 0, s, s, "#3f7b38");
      px(ctx, 0, 12, s, 4, PALETTE.woodB);
      px(ctx, 1, 11, 14, 2, PALETTE.woodA);
      px(ctx, 3, 6, 2, 2, PALETTE.flowerA);
      px(ctx, 8, 4, 2, 2, PALETTE.flowerB);
      px(ctx, 12, 7, 2, 2, PALETTE.flowerC);
      px(ctx, 5, 9, 2, 2, PALETTE.leafA);
      break;

    case TILE.DESK:
      px(ctx, 0, 0, s, s, "#b78a56");
      px(ctx, 1, 5, 14, 7, "#d4ae75");
      px(ctx, 1, 9, 14, 3, "#a67745");
      px(ctx, 3, 12, 2, 3, "#604126");
      px(ctx, 11, 12, 2, 3, "#604126");
      break;

    case TILE.CHALKBOARD:
      px(ctx, 0, 0, s, s, PALETTE.wallB);
      px(ctx, 2, 3, 12, 9, PALETTE.boardA);
      px(ctx, 2, 3, 12, 1, "#6c8b57");
      px(ctx, 4, 6, 7, 1, PALETTE.chalk);
      px(ctx, 4, 9, 5, 1, PALETTE.chalk);
      px(ctx, 2, 12, 12, 2, PALETTE.woodB);
      break;

    case TILE.LOCKER:
      px(ctx, 0, 0, s, s, PALETTE.stoneB);
      px(ctx, 2, 1, 12, 14, PALETTE.metalA);
      px(ctx, 2, 8, 12, 1, PALETTE.metalC);
      px(ctx, 7, 1, 1, 14, PALETTE.metalC);
      px(ctx, 4, 4, 2, 1, PALETTE.metalC);
      px(ctx, 10, 11, 2, 1, PALETTE.metalC);
      break;

    case TILE.CAFETERIA_TABLE:
      px(ctx, 0, 0, s, s, "#b8b1a7");
      px(ctx, 1, 4, 14, 8, "#e0bd7c");
      px(ctx, 1, 9, 14, 3, "#b5874a");
      px(ctx, 3, 2, 3, 2, "#efefef");
      px(ctx, 9, 12, 4, 2, "#98653e");
      break;

    case TILE.SERVING_COUNTER:
      px(ctx, 0, 0, s, s, "#b8b1a7");
      px(ctx, 0, 2, 16, 8, "#d5d5d5");
      px(ctx, 1, 4, 14, 3, "#9ca8b4");
      px(ctx, 3, 5, 4, 1, "#e8f5ff");
      px(ctx, 0, 10, 16, 4, "#858d96");
      break;

    case TILE.ROAD:
      px(ctx, 0, 0, s, s, "#68718c");
      px(ctx, 0, 8, s, 8, "#5a637e");
      px(ctx, 5, 7, 6, 2, "#d8cd7a");
      px(ctx, 2, 14, 3, 1, "rgba(0,0,0,.22)");
      break;

    case TILE.GYM_FLOOR:
      px(ctx, 0, 0, s, s, "#c38650");
      px(ctx, 0, 8, s, 8, "#b77846");
      px(ctx, 0, 7, s, 1, "#f3d2a5");
      px(ctx, 7, 0, 1, s, "#9d6339");
      break;

    case TILE.SAND_FIELD:
      px(ctx, 0, 0, s, s, "#d7bd68");
      px(ctx, 0, 9, s, 7, "#c6a75a");
      px(ctx, 3, 4, 2, 2, "#a78946");
      px(ctx, 11, 6, 3, 1, "#a78946");
      px(ctx, 7, 13, 2, 2, "#a78946");
      break;

    case TILE.BALL:
      px(ctx, 0, 0, s, s, "#4f9140");
      ctx.fillStyle = "#e9edf0";
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      px(ctx, 6, 4, 4, 4, "#5d6570");
      px(ctx, 4, 9, 3, 2, "#5d6570");
      px(ctx, 10, 10, 3, 2, "#5d6570");
      break;

    case TILE.SHADOW_MARK:
      px(ctx, 0, 0, s, s, PALETTE.grassB);
      px(ctx, 4, 4, 8, 8, "#4d3c8f");
      px(ctx, 6, 2, 4, 3, "#7256ca");
      px(ctx, 5, 11, 6, 2, "#231a49");
      break;

    default:
      px(ctx, 0, 0, s, s, "#ff00ff");
      px(ctx, 2, 2, 12, 12, "#000");
      break;
  }

  ctx.restore();
}

function drawTilesetGrid(ctx, options = {}) {
  const scale = options.scale ?? 3;
  const columns = options.columns ?? 6;
  const gap = options.gap ?? 12;
  const labelHeight = options.labelHeight ?? 18;
  const startX = options.x ?? 18;
  const startY = options.y ?? 18;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.font = "12px system-ui, sans-serif";
  ctx.textBaseline = "top";

  const tileIds = Object.values(TILE);
  for (let i = 0; i < tileIds.length; i++) {
    const tileId = tileIds[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = startX + col * (TILE_SIZE * scale + gap);
    const y = startY + row * (TILE_SIZE * scale + labelHeight + gap);

    ctx.fillStyle = "#111722";
    ctx.fillRect(x - 4, y - 4, TILE_SIZE * scale + 8, TILE_SIZE * scale + labelHeight + 8);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    drawTile(ctx, tileId, 0, 0);
    ctx.restore();

    ctx.fillStyle = "#dfe9ff";
    ctx.fillText(`${tileId}. ${TILE_NAMES[tileId]}`, x, y + TILE_SIZE * scale + 4);

    ctx.fillStyle = TILE_SOLID[tileId] ? "#ff8b8b" : "#8fffd8";
    ctx.fillText(TILE_SOLID[tileId] ? "충돌" : "통과", x + 58, y + TILE_SIZE * scale + 4);
  }

  ctx.restore();
}

if (typeof window !== "undefined") {
  window.YONGWON_TILESET = {
    TILE_SIZE,
    TILE,
    TILE_NAMES,
    TILE_SOLID,
    drawTile,
    drawTilesetGrid
  };
}
