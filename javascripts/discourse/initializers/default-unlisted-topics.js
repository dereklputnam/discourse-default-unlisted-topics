import { apiInitializer } from "discourse/lib/api";
import { CREATE_TOPIC } from "discourse/models/composer";

export default apiInitializer("1.8.0", (api) => {
  // Parse pipe-separated category IDs from the list/category setting.
  // Returns an empty array when no categories are configured,
  // which means the default applies globally to all categories.
  function getConfiguredCategoryIds() {
    return settings.unlisted_categories
      .split("|")
      .map((id) => parseInt(id, 10))
      .filter((id) => id);
  }

  function shouldUnlistForCategory(categoryId) {
    const configuredIds = getConfiguredCategoryIds();
    // No categories configured → apply globally
    if (configuredIds.length === 0) {
      return true;
    }
    return configuredIds.includes(categoryId);
  }

  api.composerBeforeSave(function () {
    const model = this.model;
    if (!model || model.action !== CREATE_TOPIC) {
      return;
    }

    if (shouldUnlistForCategory(model.categoryId)) {
      model.set("unlistTopic", true);
    }
  });
});
