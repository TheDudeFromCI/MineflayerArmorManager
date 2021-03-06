import minecraftData from "minecraft-data";
import { Plugin } from "mineflayer";

import { IndexedData } from "./types";
import { isArmor } from "./lib/isArmor";
import { equipItem } from "./lib/equipItem";
import { Item } from "prismarine-item";

const initializeBot: Plugin = (bot, options) => {
  if (!bot) {
    throw new Error(
      "Bot object is missing, provide mineflayer bot as first argument"
    );
  }

  // @ts-expect-error
  bot.armorManager = {}

  // @ts-expect-error
  bot.armorManager.equipAll = function () {
    for (const item of bot.inventory.items()) {
      equipItem(bot, item.type)
    }
  }

  let versionData: IndexedData;
  if (bot.version) {
    versionData = minecraftData(bot.version);
  }

  // Version is only detected after bot logs in
  bot.on("login", function onLogin() {
    versionData = minecraftData(bot.version);
  });

  bot.on("playerCollect", function onPlayerCollect(collector, item) {
    if (collector.username !== bot.username) {
      return;
    }

    try {
      const itemMetadata = item.metadata[item.metadata.length - 1] as any;
      // In older versions blockId is used instead of itemId
      if (itemMetadata === 0) {
        // itemMetadata is 0, item no longer exists or is exp. Return
        return
      }
      var itemId =
        "itemId" in itemMetadata
          ? itemMetadata.itemId
          : "blockId" in itemMetadata && itemMetadata.blockId;
      if (itemId && isArmor(itemId, versionData)) {
        // Little delay to receive inventory
        setTimeout(() => equipItem(bot, itemId), 100);
      }
    } catch (err) {
      if (options.logErrors) {
        console.log("Failed to retrieve block id, probably exp bottle", err);
      }
    }
  });
};

export = initializeBot;
