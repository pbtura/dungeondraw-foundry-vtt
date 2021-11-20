import { DungeonConfig } from "./dungeonconfig.js";
import { DungeonLayer } from "./dungeonlayer.js";


const notImplementedYet = () => {
  ui.notifications.info("Not implemented yet", {permanent: false});
}

export class DungeonDraw {
  // module name from module.json
  static MODULE_NAME = "dungeon-draw"

  static init() {
    console.log("***** DUNGEON DRAW *****");
    game.settings.register(DungeonDraw.MODULE_NAME, "releaseNotesVersion", {
        name: "Last version we showed release notes.",
        scope: "client",
        default: "",
        type: String,
        config: false
    });
  }

  static ready() {
    DungeonDraw.maybeShowReleaseNotes();
  }

  static async maybeShowReleaseNotes() {
    if (!game.user.isGM) {
      // GMs only
      return;
    }
    const moduleVersion = game.modules.get(DungeonDraw.MODULE_NAME).data.version;
    const settingsVersion = game.settings.get(DungeonDraw.MODULE_NAME, "releaseNotesVersion");
    if (moduleVersion === settingsVersion) {
      // they've already seen it
      return;
    }
    const resp = await fetch("modules/dungeon-draw/CHANGELOG.md");
    const changelog = await resp.text();
    // keep only the most recent changelog section
    const firstChangelog = "#" + changelog.split("#")[1];
    // show it in a Dialog
    const html = await renderTemplate("modules/dungeon-draw/templates/release-notes.html", {
      data: {
        version: moduleVersion,
        changelog: firstChangelog
      }
    });
    const dialog = new Dialog(
      {
        title: game.i18n.localize("DD.ReleaseNotes"),
        content: html,
        buttons: {
          roll: {
            icon: '<i class="fas fa-check"></i>',
            label: "OK",
          },
        },
      },
      {
        width: 600,  
      }
    );
    dialog.render(true);
    // mark this version as shown
    await game.settings.set(DungeonDraw.MODULE_NAME, "releaseNotesVersion", moduleVersion);
  }

  static getSceneControlButtons(controls) {
    CONFIG.Canvas.layers.dungeon = DungeonLayer;
    CONFIG.Dungeon = {
      //documentClass: DungeonDocument,
      layerClass: DungeonLayer,
      sheetClass: DungeonConfig
    };

    controls.push({
      name: "dungeondraw",
      title: "DD.SceneControlTitle",
      layer: DungeonLayer.LAYER_NAME,
      icon: "fas fa-dungeon",
      visible: game.user.isTrusted,
      tools: [
        {
          name: "addrect",
          title: "DD.ButtonTitleAddRect",
          icon: "fas fa-plus-square",
        },
        {
          name: "subtractrect",
          title: "DD.ButtonTitleSubtractRect",
          icon: "fas fa-minus-square",
        },
        {
          name: "addpoly",
          title: "DD.ButtonTitleAddPoly",
          icon: "fas fa-draw-polygon",
        },
        {
          name: "adddoor",
          title: "DD.ButtonTitleAddDoor",
          icon: "fas fa-door-open",
        },
        {
          name: "subtractdoor",
          title: "DD.ButtonTitleSubtractDoor",
          icon: "fas fa-door-closed",
        },
        {
          name: "undo",
          title: "DD.ButtonTitleUndo",
          icon: "fas fa-undo",
          onClick: async () => {
            await canvas.dungeon.dungeon.undo();
          },
          button: true
        },
        {
          name: "redo",
          title: "DD.ButtonTitleRedo",
          icon: "fas fa-redo",
          onClick: async () => {
            await canvas.dungeon.dungeon.redo();
          },          
          button: true
        },
        {
          name: "config",
          title: "DD.ButtonTitleConfig",
          icon: "fas fa-cog",
          onClick: () => canvas.dungeon.configureSettings(),
          button: true
        },
        {
          name: "clear",
          title: "DD.ButtonTitleClear",
          icon: "fas fa-trash",
          // visible: isGM,
          visible: true,
          onClick: () => canvas.dungeon.deleteAll(),
          button: true
        }
      ],
      activeTool: "addrect"
    });
  }

  static async canvasReady(canvas) {
    await canvas.dungeon.loadDungeon();
  }

  static async updateJournalEntry(document, change, options, userId) {
    if (game.user.id !== userId) {
      // if somebody else changed the backing JournalEntry, we need to refresh
      await canvas.dungeon.dungeon?.maybeRefresh(document);
    }
  }
}

Hooks.on("init", DungeonDraw.init);
Hooks.on("ready", DungeonDraw.ready);
Hooks.on("getSceneControlButtons", DungeonDraw.getSceneControlButtons);
Hooks.on("canvasReady", DungeonDraw.canvasReady);
Hooks.on("updateJournalEntry", DungeonDraw.updateJournalEntry);
