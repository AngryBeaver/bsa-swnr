export class SWNR implements SystemApi {
  get version() {
    return 2;
  }

  get id() {
    return "swnr";
  }

  async actorRollSkill(actor, skillId): Promise<Roll | null> {
    const skill = this.configSkills.find((s) => s.id === skillId);
    if (skill) {
      const item = actor.items.find((i) => i.type === "skill" && i.name === skill.label);
      if (item) {
        //Very unstable Workaround for systems that do not return anything for rolls
        const deferred = new Deferred();
        const hook = (message, temp, userId) => {
          if (userId === game["users"].current.id && message.rolls && message.rolls[0]) {
            deferred.resolve(message.rolls[0]);
            Hooks.off("createChatMessage", hook);
          }
        };
        Hooks.on("createChatMessage", hook);
        await item.roll();
        window.setTimeout(() => {
          deferred.resolve(null);
          Hooks.off("createChatMessage", hook);
        }, 30000);
        return deferred.promise;
      }
    }
    // @ts-ignore
    ui.notifications.warn("skill " + skillId + " is not known");
    return null;
  }

  async waitForChatMessage(maxTime = 2000): Promise<Roll | null> {
    return new Promise((resolve, reject) => {
      let hookId;
      hookId = Hooks.once("createChatMessage", (chatMessage, options, userId) => {
        clearTimeout(timeout);
        if (!chatMessage.rolls) {
          resolve(null);
        }
        resolve(chatMessage.rolls[0]);
      });
      const timeout = setTimeout(() => {
        Hooks.off("createChatMessage", hookId); // Destroy the hook to prevent it from lingering
        resolve(null); // Return `null` or handle however you want after a timeout
      }, maxTime);
    });
  }

  async actorRollAbility(actor, abilityId): Promise<Roll | null> {
    throw new Error("can not do this");
  }

  actorCurrenciesGet(actor): Currencies {
    return { balance: actor["system"].credits.balance };
  }

  async actorCurrenciesStore(actor, currencies: Currencies): Promise<void> {
    await actor.update({ system: { credits: currencies } });
  }

  actorSheetAddTab(sheet, html, actor, tabData: { id: string; label: string; html: string }, tabBody: string): void {
    const tabs = $(html).find('.sheet-tabs [data-group="primary"]').parent();
    const tabItem = $(
      '<a class="sheet-body" data-group="primary" data-actionn="tab" data-tab="' +
        tabData.id +
        '" title="' +
        tabData.label +
        '">' +
        tabData.label +
        "</a>",
    );
    tabs.append(tabItem);
    const body = $(html).find(".window-content");
    $(html).find(".beavers-tab-content").remove();
    const tabContent = $(
      '<section class="beavers-tab-content tab flexcol sheet-body" data-group="primary" data-tab="' +
        tabData.id +
        '"></section>',
    );
    body.append(tabContent);
    tabContent.append(tabBody);
  }

  itemSheetReplaceContent(app, html, element): void {
    const content = html.find(".window-content");
    const header = html.find(".sheet-header").clone();
    content.css("overflow-y", "auto");
    content.empty();
    content.append(header);
    content.append(element);
  }

  get configSkills(): SkillConfig[] {
    return Object.entries(game["i18n"].translations.swnr.skills.classic).map(([key, value]) => {
      // @ts-ignore
      return { id: key, label: value.name };
    });
  }

  get configAbilities(): AbilityConfig[] {
    return [
      { id: "STR", label: "STR" },
      { id: "DEX", label: "DEX" },
      { id: "CON", label: "CON" },
      {
        id: "INT",
        label: "INT",
      },
      { id: "WIS", label: "WIS" },
      { id: "CHA", label: "CHA" },
    ];
  }

  get configCurrencies(): CurrencyConfig[] {
    return [
      {
        id: "balance",
        factor: 1,
        label: game["i18n"].localize("swnr.credits.balance"),
      },
    ];
  }

  get configCanRollAbility(): boolean {
    return false;
  }

  get configLootItemType(): string {
    return "item";
  }

  get itemPriceAttribute(): string {
    return "system.cost";
  }

  get itemQuantityAttribute(): string {
    return "system.quantity";
  }
}

class Deferred {
  promise;
  reject;
  resolve;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}
