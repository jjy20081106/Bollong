/*
  용원고등학교 도트 RPG - 9부품: combat.js

  목적:
  - 플레이어와 몬스터 사이의 기본 전투만 담당한다.
  - 공격 / 피격 / HP / 넉백 / 처치 / 전투 UI 보조.
  - 아이템, 보상, 구역 이동, 저장은 아직 넣지 않는다.
*/

class FloatingText {
  constructor(text, x, y, color = "#ffffff") {
    this.text = text;
    this.x = x;
    this.y = y;
    this.vy = -20;
    this.life = 0.75;
    this.maxLife = 0.75;
    this.color = color;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt;
  }

  render(ctx, camera) {
    if (this.life <= 0) return;

    const sx = Math.floor(this.x - camera.x);
    const sy = Math.floor(this.y - camera.y);
    const a = Math.max(0, this.life / this.maxLife);

    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = "bold 9px system-ui, sans-serif";
    ctx.fillStyle = "rgba(0,0,0,.8)";
    ctx.fillText(this.text, sx + 1, sy + 1);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, sx, sy);
    ctx.restore();
  }
}

class SlashEffect {
  constructor(x, y, dir) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.life = 0.16;
    this.maxLife = 0.16;
  }

  update(dt) {
    this.life -= dt;
  }

  render(ctx, camera) {
    if (this.life <= 0) return;

    const sx = Math.floor(this.x - camera.x);
    const sy = Math.floor(this.y - camera.y);
    const a = Math.max(0, this.life / this.maxLife);

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(sx, sy);
    ctx.rotate(this.dir);

    ctx.fillStyle = "#f8fbff";
    ctx.fillRect(8, -2, 19, 4);
    ctx.fillStyle = "#7ee8ff";
    ctx.fillRect(11, -1, 16, 2);
    ctx.fillStyle = "rgba(255,255,255,.45)";
    ctx.fillRect(16, -7, 14, 2);
    ctx.fillRect(16, 5, 14, 2);

    ctx.restore();
  }
}

class CombatSystem {
  constructor() {
    this.playerMaxHp = 100;
    this.playerAttackDamage = 2;
    this.playerAttackRange = 30;
    this.playerAttackAngle = Math.PI * 0.72;
    this.playerAttackCooldownMax = 0.32;
    this.playerInvulnMax = 0.55;

    this.playerAttackCooldown = 0;
    this.playerAttackTimer = 0;
    this.playerInvuln = 0;
    this.playerHitFlash = 0;

    this.floatingTexts = [];
    this.slashEffects = [];
    this.combo = 0;
    this.comboTimer = 0;

    this.defeatedCount = 0;
    this.lastHitMonster = null;
  }

  ensurePlayer(player) {
    if (typeof player.maxHp !== "number") player.maxHp = this.playerMaxHp;
    if (typeof player.hp !== "number") player.hp = player.maxHp;
    if (typeof player.dead !== "boolean") player.dead = false;
  }

  ensureMonster(monster) {
    if (typeof monster.maxHp === "number" && typeof monster.hp === "number") return;

    if (monster.type === "locker") {
      monster.maxHp = 8;
      monster.attackPower = 16;
      monster.attackCooldownMax = 1.05;
    } else if (monster.type === "paper") {
      monster.maxHp = 4;
      monster.attackPower = 8;
      monster.attackCooldownMax = 0.65;
    } else {
      monster.maxHp = 5;
      monster.attackPower = 10;
      monster.attackCooldownMax = 0.82;
    }

    monster.hp = monster.maxHp;
    monster.hitFlash = 0;
    monster.attackCooldown = 0;
    monster.dead = false;
  }

  update(player, monsterManager, dt, collisionSystem) {
    this.ensurePlayer(player);

    this.playerAttackCooldown = Math.max(0, this.playerAttackCooldown - dt);
    this.playerAttackTimer = Math.max(0, this.playerAttackTimer - dt);
    this.playerInvuln = Math.max(0, this.playerInvuln - dt);
    this.playerHitFlash = Math.max(0, this.playerHitFlash - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) this.combo = 0;

    for (const monster of monsterManager.monsters) {
      this.ensureMonster(monster);
      monster.hitFlash = Math.max(0, (monster.hitFlash || 0) - dt);
      monster.attackCooldown = Math.max(0, (monster.attackCooldown || 0) - dt);
    }

    if (!player.dead) {
      this.handleMonsterContact(player, monsterManager, collisionSystem);
    }

    for (const text of this.floatingTexts) text.update(dt);
    for (const slash of this.slashEffects) slash.update(dt);

    this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
    this.slashEffects = this.slashEffects.filter(s => s.life > 0);

    monsterManager.monsters = monsterManager.monsters.filter(m => !m.dead);
  }

  triggerPlayerAttack(player, monsterManager, collisionSystem) {
    this.ensurePlayer(player);
    if (player.dead || this.playerAttackCooldown > 0) return false;

    this.playerAttackCooldown = this.playerAttackCooldownMax;
    this.playerAttackTimer = 0.15;

    this.slashEffects.push(new SlashEffect(player.x, player.y, player.dir));

    let hitCount = 0;

    for (const monster of monsterManager.monsters) {
      this.ensureMonster(monster);
      if (monster.dead) continue;

      if (this.isMonsterInAttackArc(player, monster)) {
        this.damageMonster(monster, this.playerAttackDamage, player, collisionSystem);
        hitCount += 1;
      }
    }

    if (hitCount === 0) {
      this.floatingTexts.push(new FloatingText("MISS", player.x + Math.cos(player.dir) * 18, player.y + Math.sin(player.dir) * 18, "#bfcce3"));
    } else {
      this.combo += hitCount;
      this.comboTimer = 1.05;
    }

    return true;
  }

  isMonsterInAttackArc(player, monster) {
    const dx = monster.x - player.x;
    const dy = monster.y - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist > this.playerAttackRange + monster.radius) return false;

    const targetAngle = Math.atan2(dy, dx);
    const diff = Math.abs(this.angleDiff(player.dir, targetAngle));

    return diff <= this.playerAttackAngle / 2;
  }

  angleDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  damageMonster(monster, amount, player, collisionSystem) {
    monster.hp = Math.max(0, monster.hp - amount);
    monster.hitFlash = 0.18;
    monster.state = "chase";
    monster.noticeTimer = 0.25;

    this.lastHitMonster = monster;
    this.floatingTexts.push(new FloatingText(`-${amount}`, monster.x, monster.y - 14, "#fff29a"));

    const dx = monster.x - player.x;
    const dy = monster.y - player.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;

    collisionSystem.moveCircle(monster, nx * 15, ny * 15);

    if (monster.hp <= 0) {
      this.defeatMonster(monster);
    }
  }

  defeatMonster(monster) {
    monster.dead = true;
    this.defeatedCount += 1;
    this.floatingTexts.push(new FloatingText("정화", monster.x, monster.y - 18, "#9fffe1"));
  }

  handleMonsterContact(player, monsterManager, collisionSystem) {
    if (this.playerInvuln > 0) return;

    for (const monster of monsterManager.monsters) {
      this.ensureMonster(monster);
      if (monster.dead) continue;

      const dist = Math.hypot(monster.x - player.x, monster.y - player.y);
      if (dist > monster.contactRange + player.radius) continue;
      if (monster.attackCooldown > 0) continue;

      this.damagePlayer(player, monster.attackPower, monster, collisionSystem);
      monster.attackCooldown = monster.attackCooldownMax;
      break;
    }
  }

  damagePlayer(player, amount, monster, collisionSystem) {
    player.hp = Math.max(0, player.hp - amount);
    this.playerInvuln = this.playerInvulnMax;
    this.playerHitFlash = 0.22;

    this.floatingTexts.push(new FloatingText(`-${amount}`, player.x, player.y - 18, "#ff9aaa"));

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const len = Math.hypot(dx, dy) || 1;

    collisionSystem.moveCircle(player, (dx / len) * 20, (dy / len) * 20);

    if (player.hp <= 0) {
      player.dead = true;
      this.floatingTexts.push(new FloatingText("기절", player.x, player.y - 22, "#ff9aaa"));
    }
  }

  revivePlayer(player) {
    this.ensurePlayer(player);
    player.dead = false;
    player.hp = player.maxHp;
    this.playerInvuln = 0.8;
    this.playerHitFlash = 0;
  }

  renderEffects(ctx, camera) {
    for (const slash of this.slashEffects) slash.render(ctx, camera);
    for (const text of this.floatingTexts) text.render(ctx, camera);
  }

  renderMonsterHpBars(ctx, camera, monsterManager) {
    ctx.save();

    for (const monster of monsterManager.monsters) {
      this.ensureMonster(monster);
      if (monster.hp >= monster.maxHp || monster.dead) continue;

      const sx = Math.floor(monster.x - camera.x);
      const sy = Math.floor(monster.y - camera.y - 22);

      ctx.fillStyle = "rgba(0,0,0,.72)";
      ctx.fillRect(sx - 10, sy, 20, 4);
      ctx.fillStyle = "#ff536d";
      ctx.fillRect(sx - 9, sy + 1, Math.max(0, 18 * (monster.hp / monster.maxHp)), 2);
    }

    ctx.restore();
  }

  renderPlayerCombatOverlay(ctx, camera, player) {
    this.ensurePlayer(player);

    if (this.playerHitFlash > 0) {
      const sx = Math.floor(player.x - camera.x);
      const sy = Math.floor(player.y - camera.y);

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#ff6b86";
      ctx.fillRect(sx - 8, sy - 15, 16, 27);
      ctx.restore();
    }
  }

  getHudText(player, monsterManager) {
    this.ensurePlayer(player);

    const alive = monsterManager.monsters.length;
    const hp = Math.ceil(player.hp);
    const maxHp = Math.ceil(player.maxHp);
    const cd = this.playerAttackCooldown > 0 ? "쿨타임" : "가능";

    return `HP ${hp}/${maxHp} · 공격 ${cd} · 남은 몬스터 ${alive} · 정화 ${this.defeatedCount}`;
  }

  getComboText() {
    if (this.combo <= 1 || this.comboTimer <= 0) return "";
    return `${this.combo} HIT`;
  }
}

if (typeof window !== "undefined") {
  window.YONGWON_COMBAT = {
    CombatSystem,
    FloatingText,
    SlashEffect
  };
}
