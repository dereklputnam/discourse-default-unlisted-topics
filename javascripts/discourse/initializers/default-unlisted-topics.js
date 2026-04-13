import { withPluginApi } from "discourse/lib/plugin-api";
import { CREATE_TOPIC } from "discourse/models/composer";

export default {
  name: "default-unlisted-topics",

  initialize() {
    withPluginApi("1.8.0", (api) => {
      // Parse the configured category IDs from theme settings.
      // Returns an empty array when no categories are configured,
      // which means the default applies globally.
      function getConfiguredCategoryIds() {
        const raw = settings.unlisted_by_default_categories;
        if (!raw) {
          return [];
        }
        return raw.split("|").map(Number).filter(Boolean);
      }

      function shouldUnlistForCategory(categoryId) {
        const configuredIds = getConfiguredCategoryIds();
        // No categories configured → apply globally
        if (configuredIds.length === 0) {
          return true;
        }
        return configuredIds.includes(categoryId);
      }

      // Set unlistTopic=true on open so the user sees the indicator
      // before they submit. This respects any manual toggle the user
      // makes afterward.
      api.modifyClass("service:composer", {
        pluginId: "default-unlisted-topics",

        async open(opts = {}) {
          const result = await super.open(opts);

          const model = this.model;
          if (model?.action === CREATE_TOPIC) {
            const categoryId = model.categoryId;
            if (shouldUnlistForCategory(categoryId)) {
              model.set("unlistTopic", true);
            }
          }

          return result;
        },
      });

      // Also enforce the setting at save time to catch cases where
      // the category was changed after the composer opened.
      api.composerBeforeSave(function () {
        const model = this.model;
        if (!model || model.action !== CREATE_TOPIC) {
          return;
        }

        const categoryId = model.categoryId;
        if (shouldUnlistForCategory(categoryId)) {
          model.set("unlistTopic", true);
        }
      });
    });
  },
};
