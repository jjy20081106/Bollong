/*
  용원고등학교 도트 RPG - 7부품: quest.js

  목적:
  - 미션 상태 관리만 담당한다.
  - 수락 / 진행 / 완료 가능 / 완료 / 다음 미션 해금 구조.
  - NPC 대화와 조사 이벤트를 받아서 목표를 갱신한다.
  - 몬스터, 전투, 아이템, 구역 이동은 아직 넣지 않는다.

  상태:
  - locked: 잠김
  - active: 진행 중
  - ready: 완료 보고 가능
  - done: 완료
*/

class QuestManager {
  constructor() {
    this.quests = [
      {
        id: "intro",
        title: "시작: 상황 파악",
        giver: "teacher_kim",
        giverName: "김호준",
        status: "active",
        desc: "김호준 선생님과 대화해서 현재 상황을 듣는다.",
        objectives: [
          { id: "talk_kim", type: "talkNpc", target: "teacher_kim", text: "김호준 선생님과 대화하기", done: false }
        ],
        next: "front_survey"
      },
      {
        id: "front_survey",
        title: "본관 앞 점검",
        giver: "teacher_kim",
        giverName: "김호준",
        status: "locked",
        desc: "본관 앞의 주요 지점을 조사한다.",
        objectives: [
          { id: "inspect_board_left", type: "inspectPoint", target: "board_left", text: "왼쪽 게시판 조사", done: false },
          { id: "inspect_board_right", type: "inspectPoint", target: "board_right", text: "오른쪽 게시판 조사", done: false },
          { id: "inspect_fountain", type: "inspectPoint", target: "fountain", text: "중앙 분수대 조사", done: false }
        ],
        next: "report_im"
      },
      {
        id: "report_im",
        title: "점검 보고",
        giver: "teacher_im",
        giverName: "임채영",
        status: "locked",
        desc: "본관 앞 점검 결과를 임채영 선생님에게 보고한다.",
        objectives: [
          { id: "talk_im", type: "talkNpc", target: "teacher_im", text: "임채영 선생님에게 보고", done: false }
        ],
        next: "next_ready"
      },
      {
        id: "next_ready",
        title: "다음 임무 준비",
        giver: "teacher_choi",
        giverName: "최원석",
        status: "locked",
        desc: "최원석 선생님에게 다음 시스템 제작 방향을 듣는다.",
        objectives: [
          { id: "talk_choi", type: "talkNpc", target: "teacher_choi", text: "최원석 선생님과 대화", done: false }
        ],
        next: null
      }
    ];

    this.log = [];
  }

  getQuest(id) {
    return this.quests.find(q => q.id === id) || null;
  }

  getActiveQuest() {
    return this.quests.find(q => q.status === "active" || q.status === "ready") || null;
  }

  getVisibleQuests() {
    return this.quests.filter(q => q.status !== "locked");
  }

  getStatusLabel(status) {
    if (status === "locked") return "잠김";
    if (status === "active") return "진행 중";
    if (status === "ready") return "완료 보고 가능";
    if (status === "done") return "완료";
    return status;
  }

  getObjectiveProgress(quest) {
    const total = quest.objectives.length;
    const done = quest.objectives.filter(o => o.done).length;
    return { done, total };
  }

  getObjectiveText(quest) {
    const lines = quest.objectives.map(o => `${o.done ? "✓" : "·"} ${o.text}`);
    return lines.join("\n");
  }

  getCurrentObjectiveText() {
    const quest = this.getActiveQuest();
    if (!quest) return "현재 미션 없음";

    const progress = this.getObjectiveProgress(quest);
    return `${quest.title} (${progress.done}/${progress.total})\n${this.getObjectiveText(quest)}`;
  }

  startQuest(id) {
    const quest = this.getQuest(id);
    if (!quest || quest.status !== "locked") return false;

    quest.status = "active";
    this.pushLog(`미션 시작: ${quest.title}`);
    return true;
  }

  completeQuest(id) {
    const quest = this.getQuest(id);
    if (!quest || (quest.status !== "ready" && quest.status !== "active")) return false;

    for (const obj of quest.objectives) {
      obj.done = true;
    }

    quest.status = "done";
    this.pushLog(`미션 완료: ${quest.title}`);

    if (quest.next) {
      const nextQuest = this.getQuest(quest.next);
      if (nextQuest && nextQuest.status === "locked") {
        nextQuest.status = "active";
        this.pushLog(`미션 해금: ${nextQuest.title}`);
      }
    }

    return true;
  }

  markObjective(type, target) {
    const messages = [];

    for (const quest of this.quests) {
      if (quest.status !== "active") continue;

      let changed = false;

      for (const obj of quest.objectives) {
        if (!obj.done && obj.type === type && obj.target === target) {
          obj.done = true;
          changed = true;
          messages.push(`목표 완료: ${obj.text}`);
        }
      }

      if (changed && quest.objectives.every(o => o.done)) {
        quest.status = "ready";
        messages.push(`완료 보고 가능: ${quest.giverName}`);
      }
    }

    for (const m of messages) this.pushLog(m);
    return messages;
  }

  onNpcTalk(npcId) {
    return this.markObjective("talkNpc", npcId);
  }

  onInspectPoint(pointId) {
    return this.markObjective("inspectPoint", pointId);
  }

  pushLog(text) {
    this.log.unshift({
      text,
      time: Date.now()
    });

    if (this.log.length > 30) this.log.length = 30;
  }

  getConversationForNpc(npc) {
    const id = npc.id;

    if (id === "teacher_kim") {
      const intro = this.getQuest("intro");
      const survey = this.getQuest("front_survey");

      if (intro && intro.status === "active") {
        return {
          lines: [
            "김호준 선생님: 본관 앞까지는 안정적으로 구현됐구나.",
            "김호준 선생님: 이제부터 미션 시스템을 테스트한다.",
            "김호준 선생님: 먼저 본관 앞의 게시판과 분수대를 조사해라."
          ],
          action: {
            label: "미션 수락",
            type: "completeQuest",
            questId: "intro"
          }
        };
      }

      if (survey && survey.status === "active") {
        return {
          lines: [
            "김호준 선생님: 아직 점검이 끝나지 않았다.",
            "김호준 선생님: 왼쪽 게시판, 오른쪽 게시판, 중앙 분수대를 조사해라.",
            this.getObjectiveText(survey)
          ],
          action: null
        };
      }

      if (survey && survey.status === "ready") {
        return {
          lines: [
            "김호준 선생님: 본관 앞 점검이 끝났군.",
            "김호준 선생님: 확인했다. 이제 임채영 선생님께 보고해라."
          ],
          action: {
            label: "완료 보고",
            type: "completeQuest",
            questId: "front_survey"
          }
        };
      }

      return {
        lines: [
          "김호준 선생님: 지금은 NPC와 미션 연결 테스트 단계다.",
          "김호준 선생님: 다음 단계에서는 이 구조 위에 몬스터와 전투를 붙이면 된다."
        ],
        action: null
      };
    }

    if (id === "teacher_im") {
      const report = this.getQuest("report_im");

      if (report && report.status === "active") {
        return {
          lines: [
            "임채영 선생님: 본관 앞 점검 결과를 가져왔니?",
            "임채영 선생님: 좋아. 보고 처리해둘게.",
            "임채영 선생님: 다음은 최원석 선생님에게 가서 다음 제작 방향을 확인해."
          ],
          action: {
            label: "보고 완료",
            type: "completeQuest",
            questId: "report_im"
          }
        };
      }

      return {
        lines: [
          "임채영 선생님: 아직 내가 받을 보고는 없어.",
          "임채영 선생님: 김호준 선생님 미션부터 진행해."
        ],
        action: null
      };
    }

    if (id === "teacher_choi") {
      const ready = this.getQuest("next_ready");

      if (ready && ready.status === "active") {
        return {
          lines: [
            "최원석 선생님: 이제 미션 시스템까지 붙었다.",
            "최원석 선생님: 다음 8부품은 몬스터 추적 AI가 맞다.",
            "최원석 선생님: 전투는 그 다음에 붙여야 꼬이지 않는다."
          ],
          action: {
            label: "확인 완료",
            type: "completeQuest",
            questId: "next_ready"
          }
        };
      }

      return {
        lines: [
          "최원석 선생님: 부품식 제작은 계속 유지해라.",
          "최원석 선생님: 한 번에 완성본을 만들면 다시 무너진다."
        ],
        action: null
      };
    }

    return {
      lines: npc.getDialogue({
        questManager: this
      }),
      action: null
    };
  }

  applyAction(action) {
    if (!action) return [];

    const messages = [];

    if (action.type === "completeQuest") {
      const quest = this.getQuest(action.questId);
      const beforeNext = quest ? quest.next : null;

      if (this.completeQuest(action.questId)) {
        messages.push(`미션 완료: ${quest.title}`);

        if (beforeNext) {
          const nextQuest = this.getQuest(beforeNext);
          if (nextQuest) messages.push(`새 미션: ${nextQuest.title}`);
        }
      }
    }

    if (action.type === "startQuest") {
      const quest = this.getQuest(action.questId);
      if (this.startQuest(action.questId) && quest) {
        messages.push(`미션 시작: ${quest.title}`);
      }
    }

    return messages;
  }
}

if (typeof window !== "undefined") {
  window.YONGWON_QUEST = {
    QuestManager
  };
}
