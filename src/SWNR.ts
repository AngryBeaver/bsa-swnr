export class SWNR implements SystemApi {

    get version() {
        return 2;
    }

    get id() {
        return "swnr";
    }

    async actorRollSkill(actor, skillId): Promise<Roll | null> {
        const skill = this.configSkills.find(s=>s.id===skillId);
        if(skill) {
            const item = actor.items.find(i => i.type === "skill" && i.name === skill.label);
            if(item) {
                //Very unstable Workaround for systems that do not return anything for rolls
                const deferred = new Deferred();
                const hook = (message,temp,userId)=> {
                    if (userId === game["users"].current.id &&  message.rolls &&  message.rolls[0]) {
                        deferred.resolve(message.rolls[0]);
                        Hooks.off("createChatMessage",hook)
                    }
                };
                Hooks.on("createChatMessage",hook);
                await item.roll();
                window.setTimeout(()=>{deferred.resolve(null);Hooks.off("createChatMessage",hook)},30000)
                return deferred.promise;
            }
        }
        // @ts-ignore
        ui.notifications.warn("skill "+skillId+" is not known");
        return null;

    }

    async actorRollAbility(actor, abilityId): Promise<Roll | null> {
        throw new Error("can not do this")
    }

    actorCurrenciesGet(actor): Currencies {
        return {balance:actor["system"].credits.balance};
    }

    async actorCurrenciesStore(actor, currencies: Currencies): Promise<void> {
        await actor.update({system: {credits: currencies}});
    }

    actorSheetAddTab(sheet, html, actor, tabData: { id: string, label: string, html: string }, tabBody: string): void {
        const tabs = $(html).find('nav[data-group="primary"]');
        const tabItem = $('<a class="item" data-tab="' + tabData.id + '" title="' + tabData.label + '">' + tabData.html + '</a>');
        tabs.append(tabItem);
        const body = $(html).find(".sheet-body");
        const tabContent = $('<div class="tab flexcol" data-group="primary" data-tab="' + tabData.id + '"></div>');
        body.append(tabContent);
        tabContent.append(tabBody);
    }

    itemSheetReplaceContent(app, html, element): void {
        const sheetBody = html.find('.form-sheet>div:nth-child(2)');
        sheetBody.addClass("flexrow");
        sheetBody.empty();
        sheetBody.append(element);
    }

    get configSkills(): SkillConfig[] {
        return Object.entries(game["i18n"].translations.swnr.skills.classic).map(([key,value])=>{
           // @ts-ignore
            return{id:key,label:value.name}
        });
    }

    get configAbilities(): AbilityConfig[] {
        return [{id:"STR",label:"STR"},{id:"DEX",label:"DEX"},{id:"CON",label:"CON"},{id:"INT",label:"INT"},{id:"WIS",label:"WIS"},{id:"CHA",label:"CHA"}];
    }

    get configCurrencies(): CurrencyConfig[] {
        return [
            {
                id: "balance",
                factor: 1,
                label: game["i18n"].localize("swnr.credits.balance"),
            }
        ]
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