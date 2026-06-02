/*
  용원고등학교 도트 RPG - 5부품: map_school_front.js

  목적:
  - 본관 앞 1구역 맵만 담당한다.
  - NPC, 미션, 몬스터, 전투는 넣지 않는다.
  - 1~4부품과 조립해서 "걷고 둘러볼 수 있는 본관 앞"을 만든다.

  구조:
  - ground 레이어: 바닥
  - detail 레이어: 방향 표시, 장식 타일
  - objects 레이어: 벽/나무/벤치/게시판/문 등 오브젝트
  - collision 레이어: 통과 불가 타일
  - labels: 렌더러 밖에서 그릴 위치명/표지 텍스트
*/

function createSchoolFrontMapDetailed() {
  const T = window.YONGWON_TILESET.TILE;
  const M = window.YONGWON_TILEMAP;

  const width = 84;
  const height = 62;

  const ground = M.createEmptyLayer(width, height, T.GRASS);
  const detail = M.createEmptyLayer(width, height, -1);
  const objects = M.createEmptyLayer(width, height, -1);
  const collision = M.createEmptyLayer(width, height, 0);

  function rect(layer, x, y, w, h, tile) {
    M.fillRect(layer, x, y, w, h, tile);
  }

  function solid(x, y, w, h, value = 1) {
    M.fillRect(collision, x, y, w, h, value);
  }

  function hline(layer, x, y, w, tile) {
    M.fillLineH(layer, x, y, w, tile);
  }

  function vline(layer, x, y, h, tile) {
    M.fillLineV(layer, x, y, h, tile);
  }

  function stampTree(x, y) {
    // 2x2 leaf + trunk 2 tiles
    objects[y][x] = T.TREE_LEAF;
    objects[y][x + 1] = T.TREE_LEAF;
    objects[y + 1][x] = T.TREE_LEAF;
    objects[y + 1][x + 1] = T.TREE_LEAF;
    objects[y + 2][x] = T.TREE_TRUNK;
    objects[y + 2][x + 1] = T.TREE_TRUNK;
    solid(x, y, 2, 3, 1);
  }

  function stampBench(x, y, w = 3) {
    rect(objects, x, y, w, 1, T.BENCH);
    solid(x, y, w, 1, 1);
  }

  function stampFlowerBed(x, y, w, h) {
    rect(objects, x, y, w, h, T.FLOWER_BED);
    solid(x, y, w, h, 1);
  }

  function stampNoticeBoard(x, y) {
    rect(objects, x, y, 2, 2, T.NOTICE_BOARD);
    solid(x, y, 2, 2, 1);
  }

  function stampWaterRect(x, y, w, h) {
    rect(ground, x, y, w, h, T.WATER);
    solid(x, y, w, h, 1);
  }

  function stampFenceRect() {
    hline(objects, 0, 0, width, T.FENCE);
    hline(objects, 0, height - 1, width, T.FENCE);
    vline(objects, 0, 0, height, T.FENCE);
    vline(objects, width - 1, 0, height, T.FENCE);

    hline(collision, 0, 0, width, 1);
    hline(collision, 0, height - 1, width, 1);
    vline(collision, 0, 0, height, 1);
    vline(collision, width - 1, 0, height, 1);
  }

  // ─────────────────────────────────────────────
  // 1. 큰 지형
  // ─────────────────────────────────────────────

  // 메인 가로길: 정문/운동장/급식실로 뻗는 길
  rect(ground, 0, 43, width, 5, T.DIRT_PATH);

  // 본관 입구에서 내려오는 중앙 세로길
  rect(ground, 38, 18, 8, 30, T.DIRT_PATH);

  // 좌측 급식실 방향 곁길
  rect(ground, 4, 33, 32, 4, T.DIRT_PATH);
  rect(ground, 4, 36, 5, 8, T.DIRT_PATH);

  // 우측 운동장 방향 곁길
  rect(ground, 48, 33, 31, 4, T.DIRT_PATH);
  rect(ground, 75, 36, 5, 8, T.DIRT_PATH);

  // 본관 앞 넓은 보도블럭 광장
  rect(ground, 24, 21, 36, 16, T.STONE_PATH);
  rect(ground, 30, 37, 24, 7, T.STONE_PATH);

  // 정문 방향 도로 느낌
  rect(ground, 34, 48, 16, 13, T.ROAD);
  for (let y = 50; y < 61; y += 4) {
    rect(detail, 41, y, 2, 1, T.SAND_FIELD);
  }

  // 좌측 아래 운동장 모래 연결 표현
  rect(ground, 2, 48, 18, 10, T.SAND_FIELD);
  rect(detail, 5, 51, 12, 1, T.DIRT_PATH);
  rect(detail, 5, 55, 12, 1, T.DIRT_PATH);

  // 우측 아래 외부 도로 연결
  rect(ground, 61, 48, 19, 10, T.ROAD);
  for (let x = 64; x < 78; x += 5) {
    rect(detail, x, 52, 2, 1, T.SAND_FIELD);
  }

  // ─────────────────────────────────────────────
  // 2. 본관 건물
  // ─────────────────────────────────────────────

  // 본관 벽체
  rect(ground, 16, 5, 52, 15, T.SCHOOL_WALL);
  solid(16, 5, 52, 15, 1);

  // 지붕
  rect(objects, 15, 3, 54, 3, T.ROOF);
  solid(15, 3, 54, 2, 1);

  // 창문들: 물 타일을 창문 느낌으로 재활용
  const windowXs = [20, 25, 30, 35, 49, 54, 59, 64];
  for (const x of windowXs) {
    rect(objects, x, 9, 2, 2, T.WATER);
    rect(objects, x, 14, 2, 2, T.WATER);
  }

  // 본관 중앙 입구
  rect(objects, 38, 18, 8, 2, T.DOOR);
  solid(38, 18, 8, 2, 0);

  // 입구 앞 계단/문턱
  rect(detail, 36, 20, 12, 1, T.STONE_PATH);
  rect(detail, 37, 21, 10, 1, T.STONE_PATH);

  // 양쪽 기둥
  rect(objects, 35, 17, 2, 3, T.SCHOOL_WALL);
  rect(objects, 47, 17, 2, 3, T.SCHOOL_WALL);
  solid(35, 17, 2, 3, 1);
  solid(47, 17, 2, 3, 1);

  // ─────────────────────────────────────────────
  // 3. 광장 오브젝트
  // ─────────────────────────────────────────────

  // 중앙 분수대
  stampWaterRect(39, 28, 6, 5);
  rect(objects, 38, 27, 8, 1, T.STONE_PATH);
  rect(objects, 38, 33, 8, 1, T.STONE_PATH);
  rect(objects, 38, 28, 1, 5, T.STONE_PATH);
  rect(objects, 45, 28, 1, 5, T.STONE_PATH);
  solid(38, 27, 8, 7, 1);

  // 게시판
  stampNoticeBoard(25, 25);
  stampNoticeBoard(57, 25);

  // 본관 앞 벤치
  stampBench(28, 31, 3);
  stampBench(53, 31, 3);
  stampBench(28, 39, 3);
  stampBench(53, 39, 3);

  // 화단
  stampFlowerBed(18, 22, 5, 4);
  stampFlowerBed(61, 22, 5, 4);
  stampFlowerBed(20, 38, 6, 3);
  stampFlowerBed(58, 38, 6, 3);
  stampFlowerBed(6, 24, 8, 4);
  stampFlowerBed(70, 24, 8, 4);

  // 장식 공 / 그림자 흔적: 아직 전투용 아님
  objects[51][12] = T.BALL;
  solid(12, 51, 1, 1, 1);

  detail[25][43] = T.SHADOW_MARK;
  detail[26][44] = T.SHADOW_MARK;
  detail[29][31] = T.SHADOW_MARK;

  // ─────────────────────────────────────────────
  // 4. 주변 밀도: 나무, 울타리, 보조 오브젝트
  // ─────────────────────────────────────────────

  const trees = [
    [4, 6], [8, 10], [3, 17], [9, 19], [4, 29],
    [72, 6], [76, 10], [75, 17], [70, 19], [76, 29],
    [5, 39], [10, 40], [14, 39], [70, 40], [75, 39],
    [22, 53], [27, 54], [54, 54], [59, 53],
    [2, 53], [7, 56], [74, 55], [78, 52]
  ];
  for (const [x, y] of trees) stampTree(x, y);

  // 울타리 일부와 외곽
  stampFenceRect();

  // 내부 작은 울타리
  rect(objects, 3, 31, 13, 1, T.FENCE);
  solid(3, 31, 13, 1, 1);
  rect(objects, 68, 31, 13, 1, T.FENCE);
  solid(68, 31, 13, 1, 1);

  // 방향 표시용 디테일
  rect(detail, 14, 35, 3, 1, T.ROAD);
  rect(detail, 67, 35, 3, 1, T.ROAD);
  rect(detail, 41, 45, 2, 1, T.ROAD);

  // ─────────────────────────────────────────────
  // 5. 맵 객체 생성
  // ─────────────────────────────────────────────

  const map = new window.YONGWON_TILEMAP.TileMap({
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

  map.spawn = {
    x: 42 * 16,
    y: 42 * 16,
    facing: "up"
  };

  map.labels = [
    { text: "용원고 본관", x: 36 * 16, y: 7 * 16, type: "large" },
    { text: "본관 입구", x: 39 * 16, y: 21 * 16, type: "small" },
    { text: "중앙 광장", x: 38 * 16, y: 26 * 16, type: "small" },
    { text: "게시판", x: 24 * 16, y: 24 * 16, type: "small" },
    { text: "게시판", x: 56 * 16, y: 24 * 16, type: "small" },
    { text: "← 급식실 방향", x: 8 * 16, y: 33 * 16, type: "small" },
    { text: "운동장 방향 →", x: 62 * 16, y: 33 * 16, type: "small" },
    { text: "정문 방향 ↓", x: 39 * 16, y: 48 * 16, type: "small" },
    { text: "모래 운동장 연결", x: 3 * 16, y: 49 * 16, type: "small" },
    { text: "외부 도로 연결", x: 63 * 16, y: 49 * 16, type: "small" }
  ];

  map.interactionPoints = [
    { id: "main_door", type: "door", label: "본관 입구", x: 42 * 16, y: 20 * 16, radius: 24 },
    { id: "board_left", type: "notice", label: "왼쪽 게시판", x: 26 * 16, y: 26 * 16, radius: 22 },
    { id: "board_right", type: "notice", label: "오른쪽 게시판", x: 58 * 16, y: 26 * 16, radius: 22 },
    { id: "fountain", type: "object", label: "중앙 분수대", x: 42 * 16, y: 31 * 16, radius: 28 },
    { id: "cafeteria_path", type: "path", label: "급식실 방향 길", x: 8 * 16, y: 35 * 16, radius: 28 },
    { id: "field_path", type: "path", label: "운동장 방향 길", x: 76 * 16, y: 35 * 16, radius: 28 },
    { id: "gate_path", type: "path", label: "정문 방향 길", x: 42 * 16, y: 55 * 16, radius: 28 }
  ];

  return map;
}

if (typeof window !== "undefined") {
  window.YONGWON_MAP_SCHOOL_FRONT = {
    createSchoolFrontMapDetailed
  };
}
