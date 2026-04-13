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

  function applyUnlisted(model) {
    if (!model || model.action !== CREATE_TOPIC) {
      return;
    }
    if (shouldUnlistForCategory(model.categoryId)) {
      model.set("unlistTopic", true);
    }
  }

  // Set unlisted as soon as the composer opens so the indicator shows immediately.
  const appEvents = api.container.lookup("service:app-events");
  appEvents.on("composer:open", ({ model }) => applyUnlisted(model));

  // Also enforce at save time in case the category was changed after opening.
  // composerBeforeSave expects a Promise return value.
  api.composerBeforeSave(function () {
    const composer = api.container.lookup("service:composer");
    applyUnlisted(composer?.model);
    return Promise.resolve();
  });
});
