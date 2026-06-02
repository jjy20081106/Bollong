/*
  용원고등학교 도트 RPG - 6부품: npc.js

  목적:
  - NPC 배치, 렌더링, 이름표, 근처 감지, 대화 데이터만 담당한다.
  - 미션 수락/완료, 몬스터, 전투는 넣지 않는다.
  - 7부품 quest.js에서 NPC 대화와 미션 시스템을 연결한다.
*/

class NPC {
  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.role = options.role || "student"; // student / teacher
    this.x = options.x;
    this.y = options.y;
    this.facing = options.facing || "down";
    this.radius = options.radius || 12;
    this.color = options.color || "#ffd8a6";
    this.dialogues = options.dialogues || ["..."];
    this.portraitColor = options.portraitColor || this.color;
    this.hint = options.hint || "";
  }

  distanceTo(x, y) {
    return Math.hypot(this.x - x, this.y - y);
  }

  getDialogue(context = {}) {
    if (typeof this.dialogues === "function") {
      return this.dialogues(context);
    }

    return this.dialogues;
  }

  render(ctx, camera, options = {}) {
    const sx = Math.floor(this.x - camera.x);
    const sy = Math.floor(this.y - camera.y);

    if (sx < -30 || sy < -38 || sx > 350 || sy > 220) return;

    ctx.save();

    this.renderShadow(ctx, sx, sy);
    this.renderSprite(ctx, sx, sy);

    if (options.showNames !== false) {
      this.renderNameTag(ctx, sx, sy);
    }

    if (this.role === "teacher") {
      this.renderQuestMark(ctx, sx, sy, options.near);
    }

    ctx.restore();
  }

  renderShadow(ctx, sx, sy) {
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.fillRect(sx - 7, sy + 8, 14, 4);
  }

  renderSprite(ctx, sx, sy) {
    const outline = "#10131a";
    const skin = "#f0d2a8";
    const hair = this.role === "teacher" ? "#2a2e38" : "#171b27";
    const shirt = this.role === "teacher" ? "#b89cff" : this.color;
    const pants = this.role === "teacher" ? "#303850" : "#1b2540";

    // outline
    ctx.fillStyle = outline;
    ctx.fillRect(sx - 6, sy - 13, 12, 25);

    // head
    ctx.fillStyle = skin;
    ctx.fillRect(sx - 4, sy - 13, 8, 8);

    // hair
    ctx.fillStyle = hair;
    ctx.fillRect(sx - 5, sy - 15, 10, 4);
    ctx.fillRect(sx - 5, sy - 12, 2, 4);

    // body
    ctx.fillStyle = shirt;
    ctx.fillRect(sx - 5, sy - 5, 10, 10);

    // uniform shade
    ctx.fillStyle = this.role === "teacher" ? "#6e5ea6" : "#38517d";
    ctx.fillRect(sx - 5, sy - 1, 10, 6);

    // arms
    ctx.fillStyle = skin;
    ctx.fillRect(sx - 7, sy - 3, 2, 8);
    ctx.fillRect(sx + 5, sy - 3, 2, 8);

    // legs
    ctx.fillStyle = pants;
    ctx.fillRect(sx - 5, sy + 5, 4, 6);
    ctx.fillRect(sx + 1, sy + 5, 4, 6);

    // face
    ctx.fillStyle = "#10131a";
    if (this.facing === "up") {
      ctx.fillRect(sx - 3, sy - 11, 6, 1);
    } else if (this.facing === "left") {
      ctx.fillRect(sx - 3, sy - 8, 1, 1);
    } else if (this.facing === "right") {
      ctx.fillRect(sx + 3, sy - 8, 1, 1);
    } else {
      ctx.fillRect(sx - 2, sy - 8, 1, 1);
      ctx.fillRect(sx + 2, sy - 8, 1, 1);
    }

    // teacher detail
    if (this.role === "teacher") {
      ctx.strokeStyle = "#eaffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 4, sy - 10, 3, 3);
      ctx.strokeRect(sx + 1, sy - 10, 3, 3);
    }
  }

  renderNameTag(ctx, sx, sy) {
    ctx.font = "bold 7px system-ui, sans-serif";
    const w = Math.ceil(ctx.measureText(this.name).width) + 8;
    const x = Math.floor(sx - w / 2);
    const y = Math.floor(sy - 28);

    ctx.fillStyle = "rgba(0,0,0,.68)";
    ctx.fillRect(x, y, w, 10);

    ctx.fillStyle = this.role === "teacher" ? "#d9c4ff" : "#ffffff";
    ctx.fillText(this.name, x + 4, y + 7);
  }

  renderQuestMark(ctx, sx, sy, near) {
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.fillStyle = near ? "#fff2a0" : "#ffffff";
    ctx.fillText("!", sx - 3, sy - 22);
  }
}

class NPCManager {
  constructor(npcs = []) {
    this.npcs = npcs;
    this.showNames = true;
  }

  add(npc) {
    this.npcs.push(npc);
  }

  findById(id) {
    return this.npcs.find(npc => npc.id === id) || null;
  }

  nearestTo(x, y, maxDistance = 24) {
    let best = null;
    let bestDistance = maxDistance;

    for (const npc of this.npcs) {
      const d = npc.distanceTo(x, y);
      if (d < bestDistance) {
        best = npc;
        bestDistance = d;
      }
    }

    return best;
  }

  render(ctx, camera, player) {
    const sorted = this.npcs
      .slice()
      .sort((a, b) => a.y - b.y);

    const nearNpc = player ? this.nearestTo(player.x, player.y, 25) : null;

    for (const npc of sorted) {
      npc.render(ctx, camera, {
        showNames: this.showNames,
        near: npc === nearNpc
      });
    }
  }

  renderHint(ctx, camera, player) {
    const npc = this.nearestTo(player.x, player.y, 25);
    if (!npc) return null;

    const text = `${npc.name} 대화 가능`;
    ctx.save();
    ctx.font = "bold 8px system-ui, sans-serif";
    const w = Math.ceil(ctx.measureText(text).width) + 14;
    const x = Math.floor((320 - w) / 2);
    const y = 180 - 24;

    ctx.fillStyle = "rgba(0,0,0,.72)";
    ctx.fillRect(x, y, w, 16);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x + 7, y + 11);
    ctx.restore();

    return npc;
  }

  toggleNames() {
    this.showNames = !this.showNames;
    return this.showNames;
  }
}

function createSchoolFrontNPCs() {
  const S = 16;

  return new NPCManager([
    new NPC({
      id: "teacher_kim",
      name: "김호준",
      role: "teacher",
      x: 42 * S,
      y: 25 * S,
      facing: "down",
      color: "#b89cff",
      dialogues: [
        "김호준 선생님: 본관 앞과 주요 구역 이동이 연결됐다.",
        "김호준 선생님: 이제 대화, 조사, 미션 진행을 함께 확인하면 된다.",
        "김호준 선생님: 첫 미션은 나와 대화하면서 바로 시작된다."
      ],
      hint: "메인 미션 시작 NPC 후보"
    }),

    new NPC({
      id: "teacher_im",
      name: "임채영",
      role: "teacher",
      x: 31 * S,
      y: 30 * S,
      facing: "right",
      color: "#ffb3c8",
      dialogues: [
        "임채영 선생님: 대화창이 제대로 뜨는지 확인해 봐.",
        "임채영 선생님: 급식실 쪽 이동도 같이 확인해 봐.",
        "임채영 선생님: 구역별 미션은 여기서 더 확장하면 된다."
      ],
      hint: "출석부 미션 NPC 후보"
    }),

    new NPC({
      id: "teacher_choi",
      name: "최원석",
      role: "teacher",
      x: 54 * S,
      y: 30 * S,
      facing: "left",
      color: "#b8e0ff",
      dialogues: [
        "최원석 선생님: 부품식 개발은 맞는 방향이다.",
        "최원석 선생님: 타일, 맵, 충돌, 플레이어, NPC를 분리하면 나중에 덜 꼬인다.",
        "최원석 선생님: 퀘스트 상태 관리까지 연결된 상태다."
      ],
      hint: "과학실 부품 미션 NPC 후보"
    }),

    new NPC({
      id: "student_jeon",
      name: "전재영",
      role: "student",
      x: 40 * S,
      y: 39 * S,
      facing: "up",
      color: "#5fd9ff",
      dialogues: [
        "전재영: 이제야 좀 게임 부품처럼 나뉘는 느낌이다.",
        "전재영: 한 번에 만들지 말고 이렇게 쌓아야 한다.",
        "전재영: 이제 대화, 조사, 전투, 구역 이동이 동시에 꼬이지 않는지 보면 된다."
      ],
      hint: "플레이어 기준 테스트 NPC"
    }),

    new NPC({
      id: "student_mingu",
      name: "강민구",
      role: "student",
      x: 24 * S,
      y: 34 * S,
      facing: "right",
      color: "#c8ffb7",
      dialogues: [
        "강민구: 왼쪽 길은 급식실 방향으로 쓰면 될 것 같다.",
        "강민구: 왼쪽 길 끝에서 급식실로 이동할 수 있다.",
        "강민구: 이동 표시가 뜨면 상호작용으로 넘어가면 된다."
      ]
    }),

    new NPC({
      id: "student_woochan",
      name: "김우찬",
      role: "student",
      x: 60 * S,
      y: 34 * S,
      facing: "left",
      color: "#ffd8a6",
      dialogues: [
        "김우찬: 오른쪽 길은 운동장 방향으로 쓰면 자연스럽다.",
        "김우찬: 첫 전투 구역은 운동장이 어울린다.",
        "김우찬: 운동장에는 그림자 몬스터가 배치되어 있다."
      ]
    }),

    new NPC({
      id: "student_juhyun",
      name: "김주현",
      role: "student",
      x: 28 * S,
      y: 41 * S,
      facing: "down",
      color: "#ffcbef",
      dialogues: [
        "김주현: 이름표가 너무 거슬리면 N 키로 켜고 끌 수 있다.",
        "김주현: NPC가 맵에 많아지면 화면이 복잡해질 수 있다.",
        "김주현: 그래도 학교 느낌은 사람이 있어야 산다."
      ]
    }),

    new NPC({
      id: "student_junseung",
      name: "김준승",
      role: "student",
      x: 56 * S,
      y: 41 * S,
      facing: "down",
      color: "#bde4ff",
      dialogues: [
        "김준승: 게시판 근처에도 조사 포인트가 있다.",
        "김준승: 게시판 조사는 본관 앞 점검 미션에 연결되어 있다.",
        "김준승: 지금은 NPC 대화와 오브젝트 조사가 분리되어 있는지 확인하면 된다."
      ]
    }),

    new NPC({
      id: "student_mingyu",
      name: "김민규",
      role: "student",
      x: 14 * S,
      y: 45 * S,
      facing: "right",
      color: "#fff0a8",
      dialogues: [
        "김민규: 왼쪽 아래는 운동장 모래 느낌이 난다.",
        "김민규: 맵이 비어 보이지 않게 사람을 더 배치하는 게 맞다.",
        "김민규: 몬스터는 다른 구역에 분산되어 있어서 허브가 너무 복잡하지 않다."
      ]
    }),

    new NPC({
      id: "student_sungjin",
      name: "박성진",
      role: "student",
      x: 70 * S,
      y: 45 * S,
      facing: "left",
      color: "#d4c1ff",
      dialogues: [
        "박성진: 오른쪽 아래는 도로 연결 느낌이다.",
        "박성진: 아래쪽 도로 끝에서 정문으로 이동할 수 있다.",
        "박성진: 정문 구역은 마지막 전투 확장용으로 쓰기 좋다."
      ]
    }),

    new NPC({
      id: "student_sangshin",
      name: "한상신",
      role: "student",
      x: 42 * S,
      y: 53 * S,
      facing: "up",
      color: "#ffcc99",
      dialogues: [
        "한상신: 정문 방향은 아래쪽이다.",
        "한상신: 마지막 보스전은 정문 맵에서 따로 만드는 게 낫다.",
        "한상신: 이 맵은 시작 허브 역할로 쓰면 된다."
      ]
    })
  ]);
}

if (typeof window !== "undefined") {
  window.YONGWON_NPC = {
    NPC,
    NPCManager,
    createSchoolFrontNPCs
  };
}
