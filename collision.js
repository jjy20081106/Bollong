/*
  용원고등학교 도트 RPG - 3부품: collision.js

  목적:
  - 타일맵 기반 충돌만 담당한다.
  - 픽셀 좌표 -> 타일 좌표 변환
  - 점/원 충돌 판정
  - 이동 시 X/Y 축 분리 충돌 처리
  - 문/상호작용 타일 감지 보조

  의존:
  - tileset.js
  - tilemap.js

  아직 넣지 않는 것:
  - 정식 플레이어 시스템
  - NPC
  - 전투
  - 미션
*/

class CollisionSystem {
  constructor(tileMap) {
    if (!tileMap) {
      throw new Error("CollisionSystem에는 TileMap 인스턴스가 필요합니다.");
    }

    this.map = tileMap;
    this.tileSize = tileMap.tileSize;
  }

  pixelToTile(px, py) {
    return {
      tx: Math.floor(px / this.tileSize),
      ty: Math.floor(py / this.tileSize)
    };
  }

  tileToPixel(tx, ty) {
    return {
      x: tx * this.tileSize,
      y: ty * this.tileSize
    };
  }

  isSolidTile(tx, ty) {
    return this.map.isSolid(tx, ty);
  }

  isSolidPixel(px, py) {
    const { tx, ty } = this.pixelToTile(px, py);
    return this.isSolidTile(tx, ty);
  }

  /*
    원형 히트박스 충돌.
    캐릭터를 원으로 잡으면 좁은 모서리에서 덜 걸린다.
  */
  circleHitsSolid(x, y, radius) {
    const samples = [
      [x, y],
      [x - radius, y],
      [x + radius, y],
      [x, y - radius],
      [x, y + radius],
      [x - radius * 0.707, y - radius * 0.707],
      [x + radius * 0.707, y - radius * 0.707],
      [x - radius * 0.707, y + radius * 0.707],
      [x + radius * 0.707, y + radius * 0.707]
    ];

    for (const [sx, sy] of samples) {
      if (this.isSolidPixel(sx, sy)) return true;
    }

    return false;
  }

  /*
    사각형 히트박스 충돌.
    오브젝트/몬스터용으로 쓸 수 있다.
  */
  rectHitsSolid(x, y, w, h) {
    const points = [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h],
      [x + w / 2, y],
      [x + w / 2, y + h],
      [x, y + h / 2],
      [x + w, y + h / 2]
    ];

    for (const [px, py] of points) {
      if (this.isSolidPixel(px, py)) return true;
    }

    return false;
  }

  /*
    X축/Y축을 분리해서 이동한다.
    대각선으로 벽에 부딪힐 때 완전히 멈추지 않고 벽을 따라 미끄러지게 된다.
  */
  moveCircle(entity, dx, dy) {
    let movedX = false;
    let movedY = false;

    const nextX = this.clampX(entity.x + dx, entity.radius);
    if (!this.circleHitsSolid(nextX, entity.y, entity.radius)) {
      entity.x = nextX;
      movedX = true;
    }

    const nextY = this.clampY(entity.y + dy, entity.radius);
    if (!this.circleHitsSolid(entity.x, nextY, entity.radius)) {
      entity.y = nextY;
      movedY = true;
    }

    return {
      movedX,
      movedY,
      blockedX: !movedX && Math.abs(dx) > 0.0001,
      blockedY: !movedY && Math.abs(dy) > 0.0001
    };
  }

  clampX(x, radius = 0) {
    return Math.max(radius, Math.min(x, this.map.pixelWidth - radius));
  }

  clampY(y, radius = 0) {
    return Math.max(radius, Math.min(y, this.map.pixelHeight - radius));
  }

  /*
    주변 타일 목록.
    디버그 / 상호작용 / 문 감지에 사용.
  */
  getTilesAroundPixel(px, py, radiusTiles = 1) {
    const center = this.pixelToTile(px, py);
    const result = [];

    for (let ty = center.ty - radiusTiles; ty <= center.ty + radiusTiles; ty++) {
      for (let tx = center.tx - radiusTiles; tx <= center.tx + radiusTiles; tx++) {
        result.push({
          tx,
          ty,
          solid: this.isSolidTile(tx, ty),
          ground: this.map.getTile("ground", tx, ty),
          detail: this.map.getTile("detail", tx, ty),
          object: this.map.getTile("objects", tx, ty)
        });
      }
    }

    return result;
  }

  /*
    특정 픽셀 근처에 특정 타일이 있는지 찾는다.
    예: 문 타일 감지.
  */
  findNearbyTile(px, py, tileId, radiusTiles = 1, layerNames = ["objects", "detail", "ground"]) {
    const around = this.getTilesAroundPixel(px, py, radiusTiles);

    for (const item of around) {
      for (const layerName of layerNames) {
        if (item[layerName] === tileId) {
          return {
            tx: item.tx,
            ty: item.ty,
            layer: layerName,
            tileId
          };
        }
      }
    }

    return null;
  }

  /*
    간단한 레이캐스트.
    몬스터 시야, 상호작용 방향 체크 등에 나중에 사용 가능.
  */
  raycastSolid(x1, y1, x2, y2, step = 4) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / step));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + dx * t;
      const y = y1 + dy * t;

      if (this.isSolidPixel(x, y)) {
        const tile = this.pixelToTile(x, y);
        return {
          hit: true,
          x,
          y,
          tx: tile.tx,
          ty: tile.ty,
          distance: distance * t
        };
      }
    }

    return {
      hit: false,
      x: x2,
      y: y2,
      distance
    };
  }

  renderProbeDebug(ctx, camera, entity, options = {}) {
    const x = Math.floor(entity.x - camera.x);
    const y = Math.floor(entity.y - camera.y);
    const radius = entity.radius;

    ctx.save();

    // hitbox
    ctx.strokeStyle = options.colliding ? "#ff4f6a" : "#70f7ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // sample points
    const points = [
      [entity.x, entity.y],
      [entity.x - radius, entity.y],
      [entity.x + radius, entity.y],
      [entity.x, entity.y - radius],
      [entity.x, entity.y + radius],
      [entity.x - radius * 0.707, entity.y - radius * 0.707],
      [entity.x + radius * 0.707, entity.y - radius * 0.707],
      [entity.x - radius * 0.707, entity.y + radius * 0.707],
      [entity.x + radius * 0.707, entity.y + radius * 0.707]
    ];

    for (const [px, py] of points) {
      const solid = this.isSolidPixel(px, py);
      ctx.fillStyle = solid ? "#ff4f6a" : "#90ffb7";
      ctx.fillRect(Math.floor(px - camera.x) - 1, Math.floor(py - camera.y) - 1, 3, 3);
    }

    ctx.restore();
  }
}

if (typeof window !== "undefined") {
  window.YONGWON_COLLISION = {
    CollisionSystem
  };
}
