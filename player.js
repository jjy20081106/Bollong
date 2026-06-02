/*
  용원고등학교 도트 RPG - 4부품: player.js

  목적:
  - 정식 플레이어 이동만 담당한다.
  - 방향, 걷기 애니메이션, 대시, 카메라 추적, 도트 스프라이트 렌더링.
  - 충돌은 3부품 CollisionSystem에 위임한다.

  의존:
  - collision.js
*/

class Player {
  constructor(options = {}) {
    this.spawnX = options.x ?? 32 * 16;
    this.spawnY = options.y ?? 33 * 16;

    this.x = this.spawnX;
    this.y = this.spawnY;

    this.radius = options.radius ?? 6;
    this.speed = options.speed ?? 92;
    this.dashSpeed = options.dashSpeed ?? 260;
    this.dashDuration = options.dashDuration ?? 0.13;
    this.dashCooldownMax = options.dashCooldown ?? 0.65;

    this.dir = -Math.PI / 2;
    this.facing = "up"; // down, up, left, right
    this.walkTime = 0;
    this.idleTime = 0;

    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.isMoving = false;
    this.lastMove = { x: 0, y: -1 };
    this.lastCollision = {
      movedX: false,
      movedY: false,
      blockedX: false,
      blockedY: false
    };
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.dir = -Math.PI / 2;
    this.facing = "up";
    this.walkTime = 0;
    this.idleTime = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.isMoving = false;
  }

  update(input, dt, collisionSystem) {
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    let ix = input.x || 0;
    let iy = input.y || 0;

    const len = Math.hypot(ix, iy);
    if (len > 0.05) {
      ix /= Math.max(1, len);
      iy /= Math.max(1, len);

      this.dir = Math.atan2(iy, ix);
      this.lastMove.x = ix;
      this.lastMove.y = iy;
      this.updateFacing(ix, iy);
      this.isMoving = true;
    } else {
      ix = 0;
      iy = 0;
      this.isMoving = false;
    }

    if (input.dashPressed) {
      this.tryDash();
    }

    let speed = this.speed;

    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      ix = this.lastMove.x;
      iy = this.lastMove.y;
      speed = this.dashSpeed;
      this.isMoving = true;
    }

    if (this.isMoving) {
      this.walkTime += dt;
      this.idleTime = 0;

      const moveResult = collisionSystem.moveCircle(
        this,
        ix * speed * dt,
        iy * speed * dt
      );

      this.lastCollision = moveResult;
    } else {
      this.idleTime += dt;
      this.walkTime = 0;
      this.lastCollision = {
        movedX: false,
        movedY: false,
        blockedX: false,
        blockedY: false
      };
    }
  }

  tryDash() {
    if (this.dashCooldown > 0 || this.dashTimer > 0) return false;

    this.dashTimer = this.dashDuration;
    this.dashCooldown = this.dashCooldownMax;

    return true;
  }

  updateFacing(ix, iy) {
    if (Math.abs(ix) > Math.abs(iy)) {
      this.facing = ix < 0 ? "left" : "right";
    } else {
      this.facing = iy < 0 ? "up" : "down";
    }
  }

  getTilePosition(tileSize = 16) {
    return {
      tx: Math.floor(this.x / tileSize),
      ty: Math.floor(this.y / tileSize)
    };
  }

  render(ctx, camera, options = {}) {
    const sx = Math.floor(this.x - camera.x);
    const sy = Math.floor(this.y - camera.y);

    const blink = this.dashTimer > 0 && Math.floor(performance.now() / 35) % 2 === 0;

    ctx.save();

    if (this.dashTimer > 0) {
      this.renderAfterImage(ctx, sx, sy);
    }

    ctx.globalAlpha = blink ? 0.78 : 1;
    this.renderShadow(ctx, sx, sy);
    this.renderSprite(ctx, sx, sy);

    if (options.showHitbox) {
      this.renderHitbox(ctx, sx, sy);
    }

    ctx.restore();
  }

  renderShadow(ctx, sx, sy) {
    ctx.fillStyle = "rgba(0,0,0,.32)";
    ctx.fillRect(sx - 7, sy + 8, 14, 4);
  }

  renderAfterImage(ctx, sx, sy) {
    const ax = sx - this.lastMove.x * 10;
    const ay = sy - this.lastMove.y * 10;
    ctx.save();
    ctx.globalAlpha = 0.28;
    this.renderSprite(ctx, ax, ay, "#9beaff");
    ctx.restore();
  }

  renderSprite(ctx, sx, sy, overrideShirt = null) {
    const walkFrame = this.isMoving ? Math.floor(this.walkTime * 10) % 2 : 0;
    const bob = this.isMoving ? (walkFrame === 0 ? 0 : 1) : Math.floor(Math.sin(this.idleTime * 3) * 0.5);

    const shirt = overrideShirt || "#5fd9ff";
    const pants = "#172036";
    const outline = "#10131a";
    const skin = "#f0d2a8";
    const hair = "#111824";
    const glass = "#eaffff";

    const x = sx;
    const y = sy + bob;

    // outline/body base
    ctx.fillStyle = outline;
    ctx.fillRect(x - 6, y - 13, 12, 25);

    // head
    ctx.fillStyle = skin;
    ctx.fillRect(x - 4, y - 13, 8, 8);

    // hair
    ctx.fillStyle = hair;
    ctx.fillRect(x - 5, y - 15, 10, 4);
    ctx.fillRect(x - 5, y - 12, 2, 4);

    // glasses
    ctx.strokeStyle = glass;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 4, y - 10, 3, 3);
    ctx.strokeRect(x + 1, y - 10, 3, 3);
    ctx.fillStyle = glass;
    ctx.fillRect(x - 1, y - 9, 2, 1);

    // body shirt
    ctx.fillStyle = shirt;
    ctx.fillRect(x - 5, y - 5, 10, 10);

    // uniform shade
    ctx.fillStyle = "#2f426c";
    ctx.fillRect(x - 5, y - 2, 10, 7);

    // arms
    ctx.fillStyle = skin;
    if (this.facing === "left") {
      ctx.fillRect(x - 8, y - 3, 3, 8);
      ctx.fillRect(x + 5, y - 2, 2, 7);
    } else if (this.facing === "right") {
      ctx.fillRect(x + 5, y - 3, 3, 8);
      ctx.fillRect(x - 7, y - 2, 2, 7);
    } else {
      const swing = walkFrame === 0 ? 0 : 1;
      ctx.fillRect(x - 7, y - 3 + swing, 2, 8);
      ctx.fillRect(x + 5, y - 3 - swing, 2, 8);
    }

    // legs
    ctx.fillStyle = pants;
    if (this.isMoving && this.facing !== "up" && this.facing !== "down") {
      ctx.fillRect(x - 5, y + 5, 4, 6 + walkFrame);
      ctx.fillRect(x + 1, y + 5, 4, 7 - walkFrame);
    } else {
      ctx.fillRect(x - 5, y + 5, 4, 6);
      ctx.fillRect(x + 1, y + 5, 4, 6);
    }

    // face direction mark
    ctx.fillStyle = "#10131a";
    if (this.facing === "down") {
      ctx.fillRect(x - 2, y - 8, 1, 1);
      ctx.fillRect(x + 2, y - 8, 1, 1);
    } else if (this.facing === "up") {
      ctx.fillRect(x - 3, y - 11, 6, 1);
    } else if (this.facing === "left") {
      ctx.fillRect(x - 3, y - 8, 1, 1);
    } else if (this.facing === "right") {
      ctx.fillRect(x + 3, y - 8, 1, 1);
    }
  }

  renderHitbox(ctx, sx, sy) {
    ctx.strokeStyle = this.lastCollision.blockedX || this.lastCollision.blockedY ? "#ff5570" : "#70f7ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.fillRect(
      Math.floor(sx + Math.cos(this.dir) * 10) - 1,
      Math.floor(sy + Math.sin(this.dir) * 10) - 1,
      3,
      3
    );
  }
}

function createInputState() {
  return {
    x: 0,
    y: 0,
    dashPressed: false
  };
}

if (typeof window !== "undefined") {
  window.YONGWON_PLAYER = {
    Player,
    createInputState
  };
}
