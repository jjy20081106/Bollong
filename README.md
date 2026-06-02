# 용원고등학교: 그림자 사건 MOBILE

용원고 도트 RPG 최종 조립본을 모바일 브라우저용으로 다시 조정한 버전입니다.

## 핵심 변경

- 모바일 전체화면 시작 버튼
- 가로모드 권장 안내
- 왼쪽 이동 영역 + 플로팅 조이스틱
- 오른쪽 대형 터치 버튼
- 버튼 즉시 반응(`pointerdown`) 처리
- 노치/제스처 바 safe-area 대응
- 세로/가로 화면 비율 대응
- PWA 구성 추가: `manifest.webmanifest`, `sw.js`, 아이콘 SVG
- 모바일 성능을 위해 DPR 상한 1.5 적용

## 프로젝트 구조

```text
index.html
.nojekyll
manifest.webmanifest
sw.js
icon-192.svg
icon-512.svg
MOBILE_REPORT.md
BUGFIX_REPORT.md
src/
  main.js
  core/
    tileset.js
    tilemap.js
    collision.js
    player.js
  maps/
    map_school_front.js
  systems/
    npc.js
    quest.js
    monster.js
    combat.js
    scene_manager.js
```

## 포함된 시스템

- 16x16 도트 타일셋
- 타일맵 렌더러
- 충돌 시스템
- 플레이어 이동
- 모바일 플로팅 조이스틱
- 본관 앞 맵
- NPC 시스템
- 대화창
- 미션 시스템
- 몬스터 추적 AI
- 전투 시스템
- 구역 이동 시스템

## 이동 가능 구역

- 본관 앞
- 운동장
- 급식실
- 과학실
- 체육관
- 정문

## 모바일 조작

- 왼쪽 아래 또는 빈 화면 드래그: 이동
- 공격 버튼: 근접 공격
- 대시 버튼: 짧은 회피/돌진
- 상호작용 버튼: 대화, 조사, 구역 이동
- 리셋 버튼: 처음 상태로 재시작

## PC 조작도 유지

- WASD / 방향키: 이동
- J: 공격
- Shift: 대시
- E / Enter: 상호작용, 구역 이동, 대화, 조사
- R: 리셋
- N: NPC 이름표 표시/숨김

## 실행 방법

압축 해제 후 `index.html`을 브라우저에서 열면 됩니다.

안드로이드 파일관리자에서 바로 열면 일부 브라우저가 로컬 파일 실행을 제한할 수 있습니다. 가장 안정적인 방법은 GitHub Pages 또는 Netlify에 업로드해서 링크로 실행하는 것입니다.

## GitHub Pages 배포

1. GitHub에서 새 public repository 생성
2. 이 폴더 안의 파일 전체 업로드
3. Settings → Pages
4. Deploy from a branch
5. main / root 선택
6. 생성된 Pages 링크를 폰에서 접속
7. 브라우저 메뉴에서 홈 화면에 추가

## Netlify 배포

1. Netlify 접속
2. Add new site → Deploy manually
3. 압축을 푼 폴더 전체를 드래그해서 업로드
4. 생성된 링크를 폰에서 접속

## 현재 한계

- APK 파일은 아님. HTML5 모바일 웹앱 버전임.
- 저장 기능 없음
- 아이템 드롭 없음
- 보스전은 정문 구역에 구조만 준비
- 상업 배포용 완성품보다는 프로토타입 조립본

## 검증

- 전체 JS 문법 검사 통과
- HTML 스크립트 경로 누락 검사 통과
- PWA 캐시 대상 파일 존재 검사 통과
