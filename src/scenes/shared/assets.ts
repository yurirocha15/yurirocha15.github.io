export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function getAssetUrl(path: string, baseUrl = import.meta.env.BASE_URL) {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizeBaseUrl(baseUrl)}${normalizedPath}`;
}

export function getFrankaPackageRoot(baseUrl = import.meta.env.BASE_URL) {
  return getAssetUrl("franka_description", baseUrl);
}

/** The arm with simplified collision meshes, light enough for scenes with several robots. */
export function getFrankaUrdfUrl(baseUrl = import.meta.env.BASE_URL) {
  return getAssetUrl("franka_description/fr3_hero.urdf", baseUrl);
}

/** The arm with its visual meshes and no hand, for scenes that show one robot up close. */
export function getFrankaVisualUrdfUrl(baseUrl = import.meta.env.BASE_URL) {
  return getAssetUrl("franka_description/fr3_visual.urdf", baseUrl);
}
