(function(C, le, D, f, s, t, w, I, N, A, de, y, S, fe) {
  "use strict";

  const { FormSection: FormSection } = N.Forms;
  const getScreens = s.findByName("getScreens");
  const UserSettingsOverviewWrapper = s.findByName("UserSettingsOverviewWrapper", false);
  const themed = t.stylesheet.createThemedStyleSheet({
    container: { flex: 1, backgroundColor: I.semanticColors.BACKGROUND_MOBILE_PRIMARY },
  });

  // ========= Settings Injection =========
  function injectIntoSettings(shouldShow, Row, pageDef) {
    const unpatchers = [];

    const stop = w.after("default", UserSettingsOverviewWrapper, function(_args, ret) {
      stop();
      const overview = A.findInReactTree(ret.props.children, c => c.type && c.type.name === "UserSettingsOverview");

      unpatchers.push(
        w.after("render", overview.type.prototype, function(_a, res) {
          let { props: { children } } = res;
          const groupLabels = [t.i18n.Messages.BILLING_SETTINGS, t.i18n.Messages.PREMIUM_SETTINGS];

          const list = A.findInReactTree(children, d => d.children[1].type === FormSection).children;
          const idx = list.findIndex(d => groupLabels.includes(d?.props.label));

          shouldShow() && list.splice(idx === -1 ? 4 : idx, 0, Row({}));
        })
      );
    }, true);

    unpatchers.push(stop);

    if (getScreens && pageDef) {
      const routeKey = `VENDETTA_THEME_${t.lodash.snakeCase(pageDef.key).toUpperCase()}`;
      const Render = pageDef.page.render;

      const Screen = t.React.memo(function ThemePage({ navigation }) {
        const sub = navigation.addListener("focus", () => {
          sub();
          navigation.setOptions(A.without(pageDef.page, "noErrorBoundary", "render"));
        });
        return t.React.createElement(
          t.ReactNative.View,
          { style: themed.container },
          t.React.createElement(N.ErrorBoundary, null, t.React.createElement(Render, null))
        );
      });

      const REGISTRY = {
        [routeKey]: {
          type: "route",
          title: () => pageDef.title,
          icon: pageDef.icon,
          parent: null,
          screen: {
            route: `VendettaTheme${t.lodash.chain(pageDef.key).camelCase().upperFirst().value()}`,
            getComponent: () => Screen,
          },
        },
      };

      const overview = s.findByProps("useOverviewSettings");
      const titleCfg = s.findByProps("getSettingTitleConfig");
      const relRenderCfg = s.findByProps("SETTING_RELATIONSHIPS", "SETTING_RENDERER_CONFIGS");

      unpatchers.push(
        w.after("useOverviewSettings", overview, (_a, ret) => {
          const list = [...ret];
          const sections = list?.[0]?.sections ?? list;
          if (!Array.isArray(sections)) return ret;
          const cat = sections.find(x => x?.title === "Vendetta" || x?.label === "Vendetta");
          if (cat && !cat?.settings?.includes(routeKey)) cat.settings.push(routeKey);
          return list;
        })
      );

      unpatchers.push(
        w.after("getSettingTitleConfig", titleCfg, (_a, ret) => ({ ...ret, [routeKey]: pageDef.title }))
      );

      const REL = relRenderCfg.SETTING_RELATIONSHIPS;
      const CFG = relRenderCfg.SETTING_RENDERER_CONFIGS;
      relRenderCfg.SETTING_RELATIONSHIPS = { ...REL, [routeKey]: null };
      relRenderCfg.SETTING_RENDERER_CONFIGS = { ...CFG, ...REGISTRY };
      unpatchers.push(() => {
        relRenderCfg.SETTING_RELATIONSHIPS = REL;
        relRenderCfg.SETTING_RENDERER_CONFIGS = CFG;
      });
    }

    return () => unpatchers.forEach(u => u && u());
  }

  // ========= Data =========
  const THEMES_URL = "https://troyydev.github.io/Playfab-pal/theme/themes-full.json";
  let REMOTE_HASHES = {};
  const STORE = le.storage;

  function diffSinceLast() {
    if (!Object.keys(REMOTE_HASHES)[0] || !STORE.themeCache?.[0]) return [];
    return Object.entries(REMOTE_HASHES).map(([url, hash]) =>
      STORE.themeCache?.includes(url)
        ? (S.plugins[url] && S.plugins[url].manifest.hash !== hash ? [url, "update"] : undefined)
        : [url, "new"]
    ).filter(Boolean);
  }
  function setSeenNow() { STORE.themeCache = Object.keys(REMOTE_HASHES); }

  async function refreshRemoteHashes() {
    const res = await (await A.safeFetch(THEMES_URL, { cache: "no-store" })).json();
    REMOTE_HASHES = Object.fromEntries(res.map(item => [item.link, item.hash]));
  }
  function startRemotePoller() {
    const interval = setInterval(refreshRemoteHashes, 600000);
    refreshRemoteHashes();
    return () => clearInterval(interval);
  }

  // ========= Row Renderer =========
  const { FormRow } = N.Forms;
  function ThemeRow({ item, changes }) {
    const url = item.link;
    const [busy, setBusy] = t.React.useState(false);
    const isInstalled = !!S.plugins[url];
    const change = changes.find(([u]) => u === url);

    const actions = busy
      ? []
      : isInstalled
      ? [
          {
            icon: f.getAssetIDByName("ic_message_delete"),
            destructive: true,
            onPress: async () => {
              setBusy(true);
              try {
                S.removePlugin(url);
                y.showToast(`Removed ${item.name}`, f.getAssetIDByName("ic_message_delete"));
              } catch {
                y.showToast(`Failed to remove ${item.name}!`, f.getAssetIDByName("Small"));
              }
              setBusy(false);
            },
          },
        ]
      : [
          {
            icon: f.getAssetIDByName("ic_download_24px"),
            onPress: async () => {
              setBusy(true);
              S.installPlugin(url, true)
                .then(() => y.showToast(`Installed ${item.name}`, f.getAssetIDByName("toast_image_saved")))
                .catch(err => y.showToast(err?.message ?? `Failed to install ${item.name}!`, f.getAssetIDByName("Small")))
                .finally(() => setBusy(false));
            },
          },
        ];

    return t.React.createElement(FormRow, {
      label: `${item.name} — ${item.description}`,
      leading: t.React.createElement(FormRow.Icon, { source: f.getAssetIDByName(item.vendetta?.icon ?? "ic_theme_24px") }),
      trailing: actions.length ? actions.map(a => t.React.createElement(N.General.Pressable, { onPress: a.onPress }, t.React.createElement(N.General.Image, { source: a.icon }))) : null,
    });
  }

  // ========= Page =========
  function ThemeBrowserPage() {
    const navigation = t.NavigationNative.useNavigation();
    const changes = diffSinceLast();
    const [themes, setThemes] = t.React.useState(null);

    t.React.useEffect(setSeenNow, []);
    t.React.useEffect(() => {
      if (themes) return;
      A.safeFetch(THEMES_URL, { cache: "no-store" })
        .then(r => r.json().then(setThemes))
        .catch(() => y.showToast("Failed to fetch themes", f.getAssetIDByName("Small")));
    }, [themes]);

    return themes
      ? t.React.createElement(t.ReactNative.FlatList, {
          data: themes,
          renderItem: ({ item }) => t.React.createElement(ThemeRow, { item, changes }),
        })
      : t.React.createElement(t.ReactNative.ActivityIndicator, { size: "large", style: { flex: 1 } });
  }

  // ========= Overview Row =========
  function ThemeBrowserOverviewRow({ changes }) {
    const nav = t.NavigationNative.useNavigation();
    return t.React.createElement(FormRow, {
      label: `Theme Browser${changes ? ` (+${changes})` : ""}`,
      leading: t.React.createElement(FormRow.Icon, { source: f.getAssetIDByName("ic_theme_24px") }),
      trailing: FormRow.Arrow,
      onPress: () => nav.push("VendettaCustomPage", { render: ThemeBrowserPage }),
    });
  }

  // ========= Entry =========
  function mountThemeBrowser() {
    const unpatchers = [];
    unpatchers.push(
      injectIntoSettings(
        () => true,
        () => t.React.createElement(ThemeBrowserOverviewRow, { changes: diffSinceLast().filter(x => x[1] === "new").length }),
        {
          key: D.plugin.manifest.name,
          icon: f.getAssetIDByName("ic_theme_24px"),
          get title() {
            const newCount = diffSinceLast().filter(x => x[1] === "new").length;
            return `Theme Browser${newCount ? ` (+${newCount})` : ""}`;
          },
          page: { render: ThemeBrowserPage },
        }
      )
    );
    unpatchers.push(startRemotePoller());
    return () => unpatchers.forEach(u => u && u());
  }

  let unmount;
  var ThemeBrowser = {
    onLoad: function() { unmount = mountThemeBrowser(); },
    onUnload: function() { unmount?.(); },
  };

  return C.default = ThemeBrowser, C.themesURL = THEMES_URL, C.vstorage = STORE, C;
})({}, vendetta.plugin, vendetta, vendetta.ui.assets, vendetta.metro, vendetta.metro.common, vendetta.patcher, vendetta.ui, vendetta.ui.components, vendetta.utils, vendetta.ui.alerts, vendetta.ui.toasts, vendetta.plugins, vendetta.themes);
