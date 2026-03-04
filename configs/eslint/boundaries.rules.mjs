const appBoundaries = {
  "apps/example-kiosk": ["@edgeflow/bridge", "@edgeflow/flow"],
  "packages/core": ["*"],
  "packages/bridge": ["@edgeflow/observability"],
  "packages/flow": [],
  "packages/device": [],
  "packages/device-sim": ["@edgeflow/device"],
  "packages/sync": [],
  "packages/observability": [],
  "packages/maintenance": ["@edgeflow/device", "@edgeflow/sync", "@edgeflow/ota", "@edgeflow/observability"],
  "packages/ota": [],
};

function pathToPackage(filePath) {
  const n = filePath.replace(/\\/g, "/");
  const m = n.match(/(?:packages|apps)\/[^/]+/);
  return m ? m[0] : null;
}

export default {
  rules: {
    "import-boundaries": {
      meta: { type: "problem", schema: [{ type: "object" }] },
      create(context) {
        const filename = context.getFilename?.() ?? "";
        const pkg = pathToPackage(filename.replace(/\\/g, "/"));
        if (!pkg || !appBoundaries[pkg]) return {};
        const allowed = new Set(appBoundaries[pkg].flatMap((x) => (x === "*" ? Object.keys(appBoundaries) : [x])));
        return {
          ImportDeclaration(node) {
            const src = node.source?.value;
            if (!src?.startsWith("@edgeflow/")) return;
            if (!allowed.has(src)) {
              context.report({
                node: node.source,
                message: `Package "${pkg}" may not import "${src}". Allowed: ${[...appBoundaries[pkg]].join(", ")}`,
              });
            }
          },
        };
      },
    },
  },
};
