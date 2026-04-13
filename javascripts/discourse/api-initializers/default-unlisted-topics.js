import { apiInitializer } from "discourse/lib/api";
import { CREATE_TOPIC } from "discourse/models/composer";

export default apiInitializer("1.8.0", (api) => {
  function getConfiguredCategoryIds() {
    return settings.unlisted_categories
      .split("|")
      .map((id) => parseInt(id, 10))
      .filter((id) => id);
  }

  function shouldUnlistForCategory(categoryId) {
    const configuredIds = getConfiguredCategoryIds();
    if (configuredIds.length === 0) {
      return true;
    }
    return configuredIds.includes(categoryId);
  }

  api.composerBeforeSave(function () {
    const composer = api.container.lookup("service:composer");
    const model = composer?.model;

    if (!model || model.action !== CREATE_TOPIC) {
      return;
    }

    if (shouldUnlistForCategory(model.categoryId)) {
      model.set("unlistTopic", true);
    }
  });
});
