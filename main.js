/*
  용원고등학교 도트 RPG - 최종 조립 main.js

  1~10부품을 조립한 실행 진입점.
  index.html은 화면과 버튼만 담당하고, 실제 게임 루프는 이 파일에서 실행한다.
*/

(() => {
  'use strict';

  function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`필수 UI 요소가 없습니다: #${id}`);
    return el;
  }

  function ensureApi(name) {
    if (!window[name]) throw new Error(`필수 스크립트 로드 실패: ${name}`);
    return window[name];
  }

  [
    "YONGWON_TILESET",
    "YONGWON_TILEMAP",
    "YONGWON_COLLISION",
    "YONGWON_PLAYER",
    "YONGWON_MAP_SCHOOL_FRONT",
    "YONGWON_NPC",
    "YONGWON_QUEST",
    "YONGWON_MONSTER",
    "YONGWON_COMBAT",
    "YONGWON_SCENE"
  ].forEach(ensureApi);

  const canvas = requireElement("screen");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D 컨텍스트를 만들 수 없습니다.");
  ctx.imageSmoothingEnabled = false;

  const view = document.createElement("canvas");
  const vctx = view.getContext("2d");
  view.width = 320;
  view.height = 180;
  vctx.imageSmoothingEnabled = false;

  const sceneManager = window.YONGWON_SCENE.buildSceneManager();
  let map = sceneManager.getMap();
  if (!map) throw new Error("초기 맵을 생성하지 못했습니다.");
  let collision = new window.YONGWON_COLLISION.CollisionSystem(map);
  const player = new window.YONGWON_PLAYER.Player({
    x: sceneManager.getScene().spawns.default.x,
    y: sceneManager.getScene().spawns.default.y
  });

  const questManager = new window.YONGWON_QUEST.QuestManager();
  const combat = new window.YONGWON_COMBAT.CombatSystem();

  let npcManager = createNpcManagerForScene(sceneManager.currentId);
  let monsterManager = createMonsterManagerForScene(sceneManager.currentId);

  const camera = { x: 0, y: 0 };
  const keys = new Set();
  const joy = requireElement("joy");
  const stick = requireElement("stick");
  const toastWrap = requireElement("toastWrap");

  const joystick = {
    id: null,
    baseX: 0,
    baseY: 0,
    x: 0,
    y: 0
  };

  function clearVirtualJoystick() {
    joystick.id = null;
    joystick.x = 0;
    joystick.y = 0;
    joy.style.display = "none";
    stick.style.transform = "translate(0,0)";
  }

  function clearQueuedActions() {
    dashQueued = false;
    attackQueued = false;
  }

  function queueAttack() {
    if (!running || paused || dialog.active || player.dead) return;
    attackQueued = true;
  }

  function queueDash() {
    if (!running || paused || dialog.active || player.dead) return;
    dashQueued = true;
  }

  const dialog = {
    active: false,
    npc: null,
    lines: [],
    index: 0,
    action: null
  };

  let DPR = 1;
  let W = innerWidth;
  let H = innerHeight;
  let running = false;
  let paused = true;
  let last = 0;
  let dashQueued = false;
  let attackQueued = false;

  const mapName = requireElement("mapName");
  const combatInfo = requireElement("combatInfo");
  const nearInfo = requireElement("nearInfo");
  const objectiveBox = requireElement("objectiveBox");
  const hpInner = requireElement("hpInner");
  const startPanel = requireElement("startPanel");

  const dialogPanel = requireElement("dialogPanel");
  const dialogName = requireElement("dialogName");
  const dialogText = requireElement("dialogText");
  const dialogCounter = requireElement("dialogCounter");
  const dialogNextBtn = requireElement("dialogNextBtn");

  combat.ensurePlayer(player);

  function createMonsterManagerForScene(sceneId) {
    const S = 16;
    const MM = window.YONGWON_MONSTER;

    if (sceneId === "school_front") return MM.createSchoolFrontMonsters();

    if (sceneId === "field") {
      return new MM.MonsterManager([
        new MM.Monster({ id:"field_shadow_1", name:"운동장 그림자", type:"shadow", x:26*S, y:17*S, aggroRange:90, chaseSpeed:62 }),
        new MM.Monster({ id:"field_shadow_2", name:"운동장 그림자", type:"shadow", x:39*S, y:24*S, aggroRange:86, chaseSpeed:60 }),
        new MM.Monster({ id:"field_paper_1", name:"날리는 종이", type:"paper", x:18*S, y:26*S, aggroRange:92, chaseSpeed:72 })
      ]);
    }

    if (sceneId === "cafeteria") {
      return new MM.MonsterManager([
        new MM.Monster({ id:"cafeteria_paper_1", name:"급식실 종이", type:"paper", x:22*S, y:18*S, aggroRange:82, chaseSpeed:68 })
      ]);
    }

    if (sceneId === "science") {
      return new MM.MonsterManager([
        new MM.Monster({ id:"science_paper_1", name:"실험지 그림자", type:"paper", x:18*S, y:22*S, aggroRange:82, chaseSpeed:68 }),
        new MM.Monster({ id:"science_locker_1", name:"사물함 잔상", type:"locker", x:36*S, y:22*S, aggroRange:78, chaseSpeed:44 })
      ]);
    }

    if (sceneId === "gym") {
      return new MM.MonsterManager([
        new MM.Monster({ id:"gym_shadow_1", name:"체육관 그림자", type:"shadow", x:28*S, y:20*S, aggroRange:98, chaseSpeed:64 }),
        new MM.Monster({ id:"gym_shadow_2", name:"체육관 그림자", type:"shadow", x:40*S, y:25*S, aggroRange:90, chaseSpeed:64 })
      ]);
    }

    if (sceneId === "gate") {
      return new MM.MonsterManager([
        new MM.Monster({ id:"gate_locker_1", name:"봉쇄 사물함", type:"locker", x:26*S, y:18*S, radius:8, aggroRange:88, chaseSpeed:42 })
      ]);
    }

    return new MM.MonsterManager([]);
  }

  function createNpcManagerForScene(sceneId) {
    const S = 16;
    const NPC = window.YONGWON_NPC;

    if (sceneId === "school_front") return NPC.createSchoolFrontNPCs();

    if (sceneId === "field") {
      return new NPC.NPCManager([
        new NPC.NPC({ id:"field_student", name:"유지호", role:"student", x:8*S, y:18*S, facing:"right", color:"#c8ffb7", dialogues:["유지호: 여긴 운동장이다.", "유지호: 몬스터 처치 미션은 나중에 여기랑 연결하면 된다."]})
      ]);
    }

    if (sceneId === "cafeteria") {
      return new NPC.NPCManager([
        new NPC.NPC({ id:"cafeteria_teacher", name:"임채영", role:"teacher", x:12*S, y:7*S, facing:"down", color:"#ffb3c8", dialogues:["임채영 선생님: 급식실 구역 이동 테스트다.", "임채영 선생님: 출석부 회수 미션은 여기서 붙이면 된다."]})
      ]);
    }

    if (sceneId === "science") {
      return new NPC.NPCManager([
        new NPC.NPC({ id:"science_teacher", name:"최원석", role:"teacher", x:10*S, y:7*S, facing:"down", color:"#b8e0ff", dialogues:["최원석 선생님: 과학실이다.", "최원석 선생님: 부품 3개 회수 미션은 다음 조립 단계에서 연결하면 된다."]})
      ]);
    }

    if (sceneId === "gym") {
      return new NPC.NPCManager([
        new NPC.NPC({ id:"gym_student", name:"최승현", role:"student", x:10*S, y:20*S, facing:"right", color:"#fff0a8", dialogues:["최승현: 체육관 이동 확인.", "최승현: 여기엔 강화 몬스터를 넣으면 된다."]})
      ]);
    }

    if (sceneId === "gate") {
      return new NPC.NPCManager([
        new NPC.NPC({ id:"gate_teacher", name:"변세일", role:"teacher", x:21*S, y:9*S, facing:"down", color:"#d4c1ff", dialogues:["변세일 선생님: 여긴 정문이다.", "변세일 선생님: 마지막 보스전은 이 구역에 연결하면 된다."]})
      ]);
    }

    return new NPC.NPCManager([]);
  }

  function refreshSceneSystems() {
    map = sceneManager.getMap();
    if (!map) throw new Error(`맵 전환 실패: ${sceneManager.currentId}`);
    collision = new window.YONGWON_COLLISION.CollisionSystem(map);
    npcManager = createNpcManagerForScene(sceneManager.currentId);
    monsterManager = createMonsterManagerForScene(sceneManager.currentId);

    combat.floatingTexts = [];
    combat.slashEffects = [];
    combat.playerAttackCooldown = 0;
    combat.playerAttackTimer = 0;

    updateCamera();
    updateHud();
  }

  function resize() {
    const vv = window.visualViewport;
    DPR = Math.min(1.5, devicePixelRatio || 1);
    W = Math.max(1, Math.floor(vv ? vv.width : innerWidth));
    H = Math.max(1, Math.floor(vv ? vv.height : innerHeight));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  addEventListener("resize", resize);
  if (window.visualViewport) {
    visualViewport.addEventListener("resize", resize);
    visualViewport.addEventListener("scroll", resize);
  }
  resize();

  function toast(text) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    toastWrap.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function toastMany(messages) {
    for (let i = 0; i < messages.length; i++) {
      setTimeout(() => toast(messages[i]), i * 250);
    }
  }

  function absorbAsyncFailure(task) {
    try {
      const result = task();
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch (_) {
      // content://, file://, 일부 모바일 브라우저에서는 전체화면/가로고정 API가 동기 예외를 던진다.
      // 이 실패 때문에 게임 시작 자체가 막히면 안 된다.
    }
  }

  function activateMobileShell() {
    const doc = document.documentElement;

    absorbAsyncFailure(() => {
      if (doc.requestFullscreen && !document.fullscreenElement) {
        return doc.requestFullscreen({ navigationUI: "hide" });
      }
      return null;
    });

    absorbAsyncFailure(() => {
      if (screen.orientation && screen.orientation.lock) {
        return screen.orientation.lock("landscape");
      }
      return null;
    });
  }

  function start() {
    if (running) return;

    // 패널 먼저 닫기 — 전체화면/가로고정 실패와 무관하게 항상 진행.
    startPanel.style.display = "none";
    running = true;

    resetAll();           // 내부에서 paused를 건드리지 않도록 아래서 명시 설정
    paused = false;       // resetAll 이후에 확실히 해제

    activateMobileShell();

    toast("모바일 모드 시작 · 왼쪽 드래그 이동");
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function resetAll() {
    clearQueuedActions();
    clearVirtualJoystick();
    closeDialog(false);
    sceneManager.switchTo("school_front", "default", player);
    refreshSceneSystems();

    player.reset();
    const spawn = sceneManager.getScene().spawns.default;
    player.x = spawn.x;
    player.y = spawn.y;
    player.facing = spawn.facing;
    player.dir = spawn.dir;

    player.maxHp = 100;
    player.hp = 100;
    player.dead = false;

    combat.playerAttackCooldown = 0;
    combat.playerAttackTimer = 0;
    combat.playerInvuln = 0;
    combat.playerHitFlash = 0;
    combat.floatingTexts = [];
    combat.slashEffects = [];
    combat.combo = 0;
    combat.comboTimer = 0;
    combat.defeatedCount = 0;

    updateCamera();
    updateHud();
  }

  function updateCamera() {
    camera.x = player.x - view.width / 2;
    camera.y = player.y - view.height / 2;
    map.clampCamera(camera, view.width, view.height);
  }

  function collectInput() {
    const input = window.YONGWON_PLAYER.createInputState();

    if (!player.dead) {
      if (keys.has("arrowleft") || keys.has("a")) input.x -= 1;
      if (keys.has("arrowright") || keys.has("d")) input.x += 1;
      if (keys.has("arrowup") || keys.has("w")) input.y -= 1;
      if (keys.has("arrowdown") || keys.has("s")) input.y += 1;

      input.x += joystick.x;
      input.y += joystick.y;
    }

    if (dashQueued) {
      input.dashPressed = true;
      dashQueued = false;
    }

    return input;
  }

  function nearestMapInteraction() {
    let best = null;
    let bestD = 99999;

    for (const p of map.interactionPoints || []) {
      const d = Math.hypot(player.x - p.x, player.y - p.y);
      if (d < p.radius && d < bestD) {
        best = p;
        bestD = d;
      }
    }

    return best;
  }

  function interact() {
    if (dialog.active) {
      nextDialog();
      return;
    }

    if (player.dead) {
      toast("리셋 버튼으로 다시 시작");
      return;
    }

    const transition = sceneManager.tryTransition(player);
    if (transition) {
      clearQueuedActions();
      clearVirtualJoystick();
      refreshSceneSystems();
      toast(`${sceneManager.getSceneName()} 이동`);
      return;
    }

    const npc = npcManager.nearestTo(player.x, player.y, 26);
    if (npc) {
      openDialog(npc);
      return;
    }

    const point = nearestMapInteraction();
    if (point) {
      inspectMapPoint(point);
      return;
    }

    toast("상호작용할 대상이 근처에 없습니다.");
  }

  function inspectMapPoint(point) {
    const pathRoutes = {
      main_door: { to: "science", spawn: "from_front", label: "과학실" },
      cafeteria_path: { to: "cafeteria", spawn: "from_front", label: "급식실" },
      field_path: { to: "field", spawn: "from_front", label: "운동장" },
      gate_path: { to: "gate", spawn: "from_front", label: "정문" }
    };

    const route = pathRoutes[point.id];
    if (route && sceneManager.switchTo(route.to, route.spawn, player)) {
      clearQueuedActions();
      clearVirtualJoystick();
      refreshSceneSystems();
      toast(`${route.label} 이동`);
      return;
    }

    const messages = {
      board_left: "왼쪽 게시판을 조사했다.",
      board_right: "오른쪽 게시판을 조사했다.",
      fountain: "중앙 분수대를 조사했다."
    };

    toast(messages[point.id] || point.label);

    const questMessages = questManager.onInspectPoint(point.id);
    if (questMessages.length) toastMany(questMessages);

    updateHud();
  }

  function openDialog(npc) {
    let convo;

    if (sceneManager.currentId === "school_front") {
      convo = questManager.getConversationForNpc(npc);
    } else {
      convo = { lines: npc.getDialogue({}), action: null };
    }

    dialog.active = true;
    dialog.npc = npc;
    dialog.lines = convo.lines || ["..."];
    dialog.index = 0;
    dialog.action = convo.action || null;

    paused = true;
    clearQueuedActions();
    clearVirtualJoystick();
    renderDialog();
    dialogPanel.style.display = "block";
  }

  function renderDialog() {
    if (!dialog.active || !dialog.npc) return;

    dialogName.textContent = dialog.npc.name;
    dialogText.textContent = dialog.lines[dialog.index] || "";
    dialogCounter.textContent = `${dialog.index + 1}/${dialog.lines.length}`;

    const lastLine = dialog.index >= dialog.lines.length - 1;
    dialogNextBtn.textContent = lastLine && dialog.action ? dialog.action.label : "다음";
  }

  function nextDialog() {
    if (!dialog.active) return;

    const lastLine = dialog.index >= dialog.lines.length - 1;

    if (lastLine) {
      if (dialog.action) {
        const messages = questManager.applyAction(dialog.action);
        if (messages.length) toastMany(messages);
      } else if (dialog.npc && sceneManager.currentId === "school_front") {
        const messages = questManager.onNpcTalk(dialog.npc.id);
        if (messages.length) toastMany(messages);
      }

      closeDialog();
      updateHud();
      return;
    }

    dialog.index += 1;
    renderDialog();
  }

  function closeDialog(resume = true) {
    dialog.active = false;
    dialog.npc = null;
    dialog.lines = [];
    dialog.index = 0;
    dialog.action = null;
    dialogPanel.style.display = "none";
    clearQueuedActions();

    if (running && resume) {
      paused = false;
      last = performance.now();
    }
  }

  function update(dt) {
    if (!running || paused) return;

    sceneManager.update(dt);

    const input = collectInput();
    player.update(input, dt, collision);

    if (attackQueued) {
      combat.triggerPlayerAttack(player, monsterManager, collision);
      attackQueued = false;
    }

    if (!player.dead) {
      monsterManager.update(player, dt, collision);
    }

    combat.update(player, monsterManager, dt, collision);
    updateCamera();
    updateHud();
  }

  function draw() {
    vctx.clearRect(0, 0, view.width, view.height);

    map.render(vctx, camera, view.width, view.height, {
      showCollision: false
    });

    drawMapLabels();
    drawActorsSorted();

    combat.renderMonsterHpBars(vctx, camera, monsterManager);
    combat.renderEffects(vctx, camera);
    drawCombo();

    if (!player.dead) {
      npcManager.renderHint(vctx, camera, player);
      if (!npcManager.nearestTo(player.x, player.y, 25)) {
        sceneManager.renderTransitionHint(vctx, player);
        drawMapInteractionHint();
      }
    }

    if (player.dead) drawDownOverlay();

    sceneManager.renderFade(vctx);
    drawToScreen();
  }

  function drawActorsSorted() {
    const actors = [];

    for (const npc of npcManager.npcs) actors.push({ y: npc.y, type: "npc", ref: npc });
    for (const monster of monsterManager.monsters) actors.push({ y: monster.y, type: "monster", ref: monster });
    actors.push({ y: player.y, type: "player", ref: player });

    actors.sort((a, b) => a.y - b.y);

    for (const actor of actors) {
      if (actor.type === "npc") {
        actor.ref.render(vctx, camera, {
          showNames: npcManager.showNames,
          near: actor.ref === npcManager.nearestTo(player.x, player.y, 25)
        });
      } else if (actor.type === "monster") {
        actor.ref.render(vctx, camera, { showDebug: false });
      } else {
        combat.renderPlayerCombatOverlay(vctx, camera, player);
        player.render(vctx, camera, { showHitbox: false });
      }
    }
  }

  function drawCombo() {
    const text = combat.getComboText();
    if (!text) return;

    vctx.save();
    vctx.font = "bold 16px system-ui, sans-serif";
    vctx.fillStyle = "rgba(0,0,0,.75)";
    vctx.fillText(text, 13, 72);
    vctx.fillStyle = "#fff29a";
    vctx.fillText(text, 12, 71);
    vctx.restore();
  }

  function drawDownOverlay() {
    vctx.save();
    vctx.fillStyle = "rgba(0,0,0,.58)";
    vctx.fillRect(0, 0, view.width, view.height);
    vctx.font = "bold 16px system-ui, sans-serif";
    vctx.fillStyle = "#fff";
    vctx.fillText("전투 불능", 126, 78);
    vctx.font = "bold 9px system-ui, sans-serif";
    vctx.fillText("R 또는 리셋 버튼으로 다시 시작", 104, 96);
    vctx.restore();
  }

  function drawMapLabels() {
    if (!map.labels) return;

    vctx.save();

    for (const label of map.labels) {
      const sx = Math.floor(label.x - camera.x);
      const sy = Math.floor(label.y - camera.y);

      if (sx < -80 || sy < -20 || sx > view.width + 80 || sy > view.height + 20) continue;

      const fontSize = label.type === "large" ? 10 : 8;
      vctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      const w = Math.ceil(vctx.measureText(label.text).width) + 8;
      const h = label.type === "large" ? 14 : 12;

      vctx.fillStyle = "rgba(0,0,0,.58)";
      vctx.fillRect(sx - 4, sy - 9, w, h);
      vctx.fillStyle = "#fff";
      vctx.fillText(label.text, sx, sy);
    }

    vctx.restore();
  }

  function drawMapInteractionHint() {
    if (player.dead) return;
    if (sceneManager.nearestTransition(player, 44)) return;

    const point = nearestMapInteraction();
    if (!point) return;

    vctx.save();
    const text = `${point.label} 조사 가능`;
    vctx.font = "bold 8px system-ui, sans-serif";
    const w = Math.ceil(vctx.measureText(text).width) + 14;
    const x = Math.floor((view.width - w) / 2);
    const y = view.height - 24;

    vctx.fillStyle = "rgba(0,0,0,.68)";
    vctx.fillRect(x, y, w, 16);
    vctx.fillStyle = "#fff";
    vctx.fillText(text, x + 7, y + 11);
    vctx.restore();
  }

  function drawToScreen() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#05070b";
    ctx.fillRect(0, 0, W, H);

    const portrait = H > W;
    const scale = portrait
      ? Math.min(W / view.width, H / view.height)
      : Math.max(W / view.width, H / view.height);
    const dw = view.width * scale;
    const dh = view.height * scale;
    const ox = (W - dw) / 2;
    const oy = (H - dh) / 2;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(view, ox, oy, dw, dh);
  }

  function updateHud() {
    const tile = player.getTilePosition(16);
    const npc = npcManager.nearestTo(player.x, player.y, 26);
    const monster = monsterManager.getNearestMonster(player.x, player.y, 38);
    const transition = sceneManager.nearestTransition(player, 44);
    const mapPoint = nearestMapInteraction();

    mapName.textContent = `구역: ${sceneManager.getSceneName()} · ${tile.tx},${tile.ty}`;
    combatInfo.textContent = combat.getHudText(player, monsterManager);
    nearInfo.textContent = transition
      ? `이동: ${transition.label}`
      : npc
        ? `근처: ${npc.name}`
        : monster
          ? `근처: ${monster.name} (${monster.state})`
          : mapPoint
            ? `근처: ${mapPoint.label}`
            : "근처: 없음";

    const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
    hpInner.style.width = `${Math.floor(hpRatio * 100)}%`;

    objectiveBox.textContent =
      `현재 미션:\n${questManager.getCurrentObjectiveText()}\n\n구역 이동: 이동 표시에서 E/상호작용\nN: 이름표 표시/숨김`;
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  const pointerBlockSelectors = ".controls,.topRight,.hud,.panel,.dialogPanel";

  function shouldIgnoreTouch(target) {
    return target.closest && target.closest(pointerBlockSelectors);
  }

  addEventListener("touchstart", (event) => {
    for (const t of event.changedTouches) {
      if (joystick.id === null && !shouldIgnoreTouch(t.target) && !dialog.active) {
        joystick.id = t.identifier;
        joystick.baseX = t.clientX;
        joystick.baseY = t.clientY;
        joystick.x = 0;
        joystick.y = 0;
        joy.style.display = "block";
        joy.style.left = `${t.clientX}px`;
        joy.style.top = `${t.clientY}px`;
        stick.style.transform = "translate(0,0)";
        event.preventDefault();
        break;
      }
    }
  }, { passive: false });

  addEventListener("touchmove", (event) => {
    for (const t of event.changedTouches) {
      if (t.identifier === joystick.id) {
        const dx = t.clientX - joystick.baseX;
        const dy = t.clientY - joystick.baseY;
        const len = Math.hypot(dx, dy);
        const max = 44;
        const k = len > max ? max / len : 1;
        joystick.x = (dx * k) / max;
        joystick.y = (dy * k) / max;
        stick.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
        event.preventDefault();
        break;
      }
    }
  }, { passive: false });

  function endJoystick(event) {
    for (const t of event.changedTouches) {
      if (t.identifier === joystick.id) {
        clearVirtualJoystick();
        event.preventDefault();
        break;
      }
    }
  }

  addEventListener("touchend", endJoystick, { passive: false });
  addEventListener("touchcancel", endJoystick, { passive: false });

  addEventListener("mousedown", (event) => {
    if (event.button !== 0 || shouldIgnoreTouch(event.target) || dialog.active) return;
    joystick.id = "mouse";
    joystick.baseX = event.clientX;
    joystick.baseY = event.clientY;
    joystick.x = 0;
    joystick.y = 0;
    joy.style.display = "block";
    joy.style.left = `${event.clientX}px`;
    joy.style.top = `${event.clientY}px`;
    stick.style.transform = "translate(0,0)";
    event.preventDefault();
  });

  addEventListener("mousemove", (event) => {
    if (joystick.id !== "mouse") return;
    const dx = event.clientX - joystick.baseX;
    const dy = event.clientY - joystick.baseY;
    const len = Math.hypot(dx, dy);
    const max = 44;
    const k = len > max ? max / len : 1;
    joystick.x = (dx * k) / max;
    joystick.y = (dy * k) / max;
    stick.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    event.preventDefault();
  });

  addEventListener("mouseup", () => {
    if (joystick.id === "mouse") clearVirtualJoystick();
  });

  addEventListener("mouseleave", () => {
    if (joystick.id === "mouse") clearVirtualJoystick();
  });

  addEventListener("blur", () => {
    keys.clear();
    clearQueuedActions();
    clearVirtualJoystick();
  });


  addEventListener("keydown", (event) => {
    keys.add(event.key.toLowerCase());

    if (event.key === "Shift") queueDash();
    if (event.key.toLowerCase() === "j") queueAttack();
    if (event.key.toLowerCase() === "n") {
      const shown = npcManager.toggleNames();
      toast(shown ? "이름표 표시" : "이름표 숨김");
    }
    if (event.key.toLowerCase() === "r") resetAll();
    if (event.key.toLowerCase() === "e" || event.key === "Enter") {
      event.preventDefault();
      interact();
    }
  });

  addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  function bindActionButton(id, action) {
    const el = requireElement(id);
    let firedAt = 0;

    // pointerdown/touchstart/mousedown이 동시에 발화해도 300ms 안에 한 번만 실행.
    const run = (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      const now = performance.now();
      if (now - firedAt < 300) return;
      firedAt = now;
      el.classList.add("isDown");
      action();
    };

    const release = (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      el.classList.remove("isDown");
    };

    // Pointer Events API 지원 환경에서는 pointerdown 하나로 충분.
    // 미지원(일부 구형 WebView) 대비해 touchstart/mousedown도 등록하되 run() 내부 디바운스로 중복 차단.
    el.addEventListener("pointerdown", run, { passive: false });
    el.addEventListener("touchstart", run, { passive: false });
    el.addEventListener("mousedown", run, { passive: false });

    el.addEventListener("pointerup", release, { passive: false });
    el.addEventListener("pointercancel", release, { passive: false });
    el.addEventListener("pointerleave", release, { passive: false });
    el.addEventListener("touchend", release, { passive: false });
    el.addEventListener("touchcancel", release, { passive: false });
    el.addEventListener("mouseup", release, { passive: false });

    // Pointer Events 자체가 누락된 최구형 환경 최후 보험.
    el.addEventListener("click", (event) => {
      const now = performance.now();
      if (now - firedAt > 600) run(event);
      else event.preventDefault();
    }, { passive: false });
  }

  bindActionButton("startBtn", start);
  bindActionButton("btnAttack", queueAttack);
  bindActionButton("btnDash", queueDash);
  bindActionButton("btnTalk", interact);
  bindActionButton("btnReset", resetAll);
  bindActionButton("dialogNextBtn", nextDialog);

  addEventListener("contextmenu", (event) => event.preventDefault());
  addEventListener("gesturestart", (event) => event.preventDefault());
  addEventListener("gesturechange", (event) => event.preventDefault());
  addEventListener("gestureend", (event) => event.preventDefault());

  updateCamera();
  updateHud();
  draw();
})();
