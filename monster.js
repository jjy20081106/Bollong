/*
  용원고등학교 도트 RPG - 8부품: monster.js

  목적:
  - 몬스터 추적 AI만 담당한다.
  - 대기 / 배회 / 추적 / 복귀 상태를 가진다.
  - 충돌 시스템을 사용해서 벽과 오브젝트를 통과하지 않는다.
  - 전투, 피해, 처치, 보상은 아직 넣지 않는다.

  상태:
  - idle: 대기
  - wander: 짧은 배회
  - chase: 플레이어 추적
  - return: 원위치 복귀
*/

class Monster {
  constructor(options) {
    this.id = options.id;
    this.name = options.name || "몬스터";
    this.type = options.type || "shadow";

    this.x = options.x;
    this.y = options.y;
    this.homeX = options.x;
    this.homeY = options.y;

    this.radius = options.radius ?? 6;
    this.speed = options.speed ?? 42;
    this.chaseSpeed = options.chaseSpeed ?? 58;
    this.returnSpeed = options.returnSpeed ?? 45;

    this.aggroRange = options.aggroRange ?? 88;
    this.loseRange = options.loseRange ?? 132;
    this.homeLimit = options.homeLimit ?? 170;
    this.contactRange = options.contactRange ?? 13;

    this.state = "idle";
    this.dir = 0;
    this.stateTimer = 0;
    this.wanderX = 0;
    this.wanderY = 0;
    this.noticeTimer = 0;
    this.contactTimer = 0;
    this.bobTime = Math.random() * 10;
  }

  distanceToPlayer(player) {
    return Math.hypot(player.x - this.x, player.y - this.y);
  }

  distanceToHome() {
    return Math.hypot(this.homeX - this.x, this.homeY - this.y);
  }

  setState(next) {
    if (this.state === next) return;
    this.state = next;
    this.stateTimer = 0;

    if (next === "wander") {
      const angle = Math.random() * Math.PI * 2;
      this.wanderX = Math.cos(angle);
      this.wanderY = Math.sin(angle);
    }
  }

  update(player, dt, collisionSystem) {
    this.stateTimer += dt;
    this.bobTime += dt;
    this.noticeTimer = Math.max(0, this.noticeTimer - dt);
    this.contactTimer = Math.max(0, this.contactTimer - dt);

    const distPlayer = this.distanceToPlayer(player);
    const distHome = this.distanceToHome();

    if (distPlayer <= this.aggroRange && distHome <= this.homeLimit) {
      this.setState("chase");
      this.noticeTimer = 0.35;
    }

    if (this.state === "chase") {
      if (distPlayer > this.loseRange || distHome > this.homeLimit) {
        this.setState("return");
      } else {
        this.moveToward(player.x, player.y, this.chaseSpeed, dt, collisionSystem);
      }

      if (distPlayer <= this.contactRange) {
        this.contactTimer = 0.18;
      }

      return;
    }

    if (this.state === "return") {
      if (distHome <= 5) {
        this.x = this.homeX;
        this.y = this.homeY;
        this.setState("idle");
      } else {
        this.moveToward(this.homeX, this.homeY, this.returnSpeed, dt, collisionSystem);
      }
      return;
    }

    if (this.state === "idle") {
      if (this.stateTimer > 1.2 + Math.random() * 1.4) {
        this.setState("wander");
      }
      return;
    }

    if (this.state === "wander") {
      if (this.stateTimer > 0.45) {
        this.setState("idle");
        return;
      }

      const result = collisionSystem.moveCircle(
        this,
        this.wanderX * this.speed * dt,
        this.wanderY * this.speed * dt
      );

      if (result.blockedX || result.blockedY || this.distanceToHome() > 42) {
        this.setState("return");
      }
    }
  }

  moveToward(targetX, targetY, speed, dt, collisionSystem) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const len = Math.hypot(dx, dy);

    if (len < 0.001) return;

    const nx = dx / len;
    const ny = dy / len;

    this.dir = Math.atan2(ny, nx);

    const result = collisionSystem.moveCircle(
      this,
      nx * speed * dt,
      ny * speed * dt
    );

    /*
      단순 추적이 벽에 걸릴 때 완전히 멈추지 않도록
      보조 방향을 한 번 더 시도한다.
      정식 길찾기 A*는 지금 단계에서 넣지 않는다.
    */
    if (result.blockedX || result.blockedY) {
      collisionSystem.moveCircle(
        this,
        -ny * speed * dt * 0.55,
        nx * speed * dt * 0.55
      );
    }
  }

  render(ctx, camera, options = {}) {
    const sx = Math.floor(this.x - camera.x);
    const sy = Math.floor(this.y - camera.y);

    if (sx < -32 || sy < -40 || sx > 352 || sy > 220) return;

    ctx.save();

    this.renderShadow(ctx, sx, sy);
    this.renderSprite(ctx, sx, sy);
    this.renderStateIcon(ctx, sx, sy);

    if (options.showDebug) {
      this.renderDebug(ctx, sx, sy);
    }

    ctx.restore();
  }

  renderShadow(ctx, sx, sy) {
    ctx.fillStyle = "rgba(0,0,0,.34)";
    ctx.fillRect(sx - 8, sy + 8, 16, 4);
  }

  renderSprite(ctx, sx, sy) {
    const bob = Math.floor(Math.sin(this.bobTime * 5) * 1);
    const y = sy + bob;

    if (this.type === "paper") {
      this.renderPaper(ctx, sx, y);
    } else if (this.type === "locker") {
      this.renderLocker(ctx, sx, y);
    } else {
      this.renderShadowMonster(ctx, sx, y);
    }

    if (this.contactTimer > 0) {
      ctx.strokeStyle = "#ffeb7a";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 9, y - 14, 18, 24);
    }
  }

  renderShadowMonster(ctx, sx, sy) {
    ctx.fillStyle = "#161329";
    ctx.fillRect(sx - 7, sy - 11, 14, 20);

    ctx.fillStyle = "#3c2a77";
    ctx.fillRect(sx - 6, sy - 13, 12, 18);
    ctx.fillRect(sx - 8, sy - 5, 16, 10);

    ctx.fillStyle = "#775dff";
    ctx.fillRect(sx - 3, sy - 8, 2, 2);
    ctx.fillRect(sx + 2, sy - 8, 2, 2);

    ctx.fillStyle = "#20173f";
    ctx.fillRect(sx - 5, sy + 5, 4, 6);
    ctx.fillRect(sx + 1, sy + 5, 4, 6);
  }

  renderPaper(ctx, sx, sy) {
    ctx.fillStyle = "#24243a";
    ctx.fillRect(sx - 6, sy - 12, 13, 18);

    ctx.fillStyle = "#f4f0dc";
    ctx.fillRect(sx - 5, sy - 13, 10, 18);

    ctx.fillStyle = "#c7c0aa";
    ctx.fillRect(sx + 1, sy - 13, 4, 4);

    ctx.fillStyle = "#6a5aa8";
    ctx.fillRect(sx - 3, sy - 7, 2, 2);
    ctx.fillRect(sx + 2, sy - 7, 2, 2);

    ctx.fillStyle = "#b8ac90";
    ctx.fillRect(sx - 3, sy - 2, 6, 1);
    ctx.fillRect(sx - 3, sy + 1, 5, 1);
  }

  renderLocker(ctx, sx, sy) {
    ctx.fillStyle = "#141923";
    ctx.fillRect(sx - 8, sy - 15, 16, 27);

    ctx.fillStyle = "#7d8998";
    ctx.fillRect(sx - 7, sy - 14, 14, 25);

    ctx.fillStyle = "#56606d";
    ctx.fillRect(sx - 7, sy - 2, 14, 2);
    ctx.fillRect(sx - 1, sy - 14, 2, 25);

    ctx.fillStyle = "#ff7b8f";
    ctx.fillRect(sx - 4, sy - 8, 2, 2);
    ctx.fillRect(sx + 3, sy - 8, 2, 2);

    ctx.fillStyle = "#c3cad4";
    ctx.fillRect(sx - 5, sy - 11, 3, 1);
    ctx.fillRect(sx + 2, sy + 1, 3, 1);
  }

  renderStateIcon(ctx, sx, sy) {
    if (this.noticeTimer > 0 || this.state === "chase") {
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillStyle = "#ffef7a";
      ctx.fillText("!", sx - 3, sy - 20);
      return;
    }

    if (this.state === "return") {
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.fillStyle = "#a9d8ff";
      ctx.fillText("↺", sx - 4, sy - 20);
    }
  }

  renderDebug(ctx, sx, sy) {
    ctx.strokeStyle = this.state === "chase" ? "#ff5570" : "#70f7ff";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.beginPath();
    ctx.arc(Math.floor(this.homeX - (this.x - sx)), Math.floor(this.homeY - (this.y - sy)), this.aggroRange, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "bold 7px system-ui, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(this.state, sx - 12, sy + 20);
  }
}

class MonsterManager {
  constructor(monsters = []) {
    this.monsters = monsters;
    this.showDebug = false;
    this.lastContactId = null;
    this.lastContactTimer = 0;
  }

  add(monster) {
    this.monsters.push(monster);
  }

  update(player, dt, collisionSystem) {
    this.lastContactTimer = Math.max(0, this.lastContactTimer - dt);

    for (const monster of this.monsters) {
      monster.update(player, dt, collisionSystem);

      if (monster.distanceToPlayer(player) <= monster.contactRange && this.lastContactTimer <= 0) {
        this.lastContactId = monster.id;
        this.lastContactTimer = 0.55;
      }
    }
  }

  render(ctx, camera) {
    for (const monster of this.monsters) {
      monster.render(ctx, camera, {
        showDebug: this.showDebug
      });
    }
  }

  getTouchingMonster(player) {
    for (const monster of this.monsters) {
      if (monster.distanceToPlayer(player) <= monster.contactRange) return monster;
    }

    return null;
  }

  getNearestMonster(x, y, maxDistance = 44) {
    let best = null;
    let bestD = maxDistance;

    for (const monster of this.monsters) {
      const d = Math.hypot(monster.x - x, monster.y - y);
      if (d < bestD) {
        best = monster;
        bestD = d;
      }
    }

    return best;
  }

  toggleDebug() {
    this.showDebug = !this.showDebug;
    return this.showDebug;
  }
}

function createSchoolFrontMonsters() {
  const S = 16;

  return new MonsterManager([
    new Monster({
      id: "shadow_front_1",
      name: "그림자",
      type: "shadow",
      x: 33 * S,
      y: 37 * S,
      speed: 34,
      chaseSpeed: 58,
      aggroRange: 82
    }),
    new Monster({
      id: "paper_front_1",
      name: "종이 그림자",
      type: "paper",
      x: 51 * S,
      y: 37 * S,
      speed: 42,
      chaseSpeed: 70,
      aggroRange: 86,
      loseRange: 140
    }),
    new Monster({
      id: "shadow_front_2",
      name: "그림자",
      type: "shadow",
      x: 20 * S,
      y: 45 * S,
      speed: 35,
      chaseSpeed: 56,
      aggroRange: 78
    }),
    new Monster({
      id: "locker_front_1",
      name: "사물함 잔상",
      type: "locker",
      x: 62 * S,
      y: 45 * S,
      radius: 7,
      speed: 24,
      chaseSpeed: 42,
      returnSpeed: 36,
      aggroRange: 76,
      loseRange: 126
    })
  ]);
}

if (typeof window !== "undefined") {
  window.YONGWON_MONSTER = {
    Monster,
    MonsterManager,
    createSchoolFrontMonsters
  };
}
