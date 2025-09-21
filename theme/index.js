(function(C, le, D, f, s, t, w, I, N, A, de, y, S, fe) {
  "use strict";

  // ========== Imports / Shorthands ==========
  const { FormSection: FormSection } = N.Forms;
  const getScreens = s.findByName("getScreens");
  const UserSettingsOverviewWrapper = s.findByName("UserSettingsOverviewWrapper", false);
  const themed = t.stylesheet.createThemedStyleSheet({
    container: { flex: 1, backgroundColor: I.semanticColors.BACKGROUND_MOBILE_PRIMARY },
  });

  // ========== Settings Page Injection Helper ==========
  function injectIntoSettings(shouldShow, Row, pageDef) {
    const unpatchers = [];

    // Insert a row in Settings → Overview
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

    // Optional: Add a full custom page in search + routing (like Plugin Browser did)
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
          pageDef.page.noErrorBoundary
            ? t.React.createElement(Render, null)
            : t.React.createElement(N.ErrorBoundary, null, t.React.createElement(Render, null))
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

      const wireSettingsSearch = () => {
        const overview = s.findByProps("useOverviewSettings");
        const titleCfg = s.findByProps("getSettingTitleConfig");
        const relRenderCfg = s.findByProps("SETTING_RELATIONSHIPS", "SETTING_RENDERER_CONFIGS");

        const E = "getSettingSearchListItems";
        const L = "getSettingListItems";
        const searchMod = s.findByProps(E) ?? s.findByProps(L);
        const searchFnName = s.findByProps(E) ? E : L;

        if (!searchMod || !overview) return false;

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

        unpatchers.push(
          w.after(searchFnName, searchMod, (args, out) => {
            const [listArg] = args;
            return [
              ...(listArg.includes(routeKey)
                ? [
                    {
                      type: "setting_search_result",
                      ancestorRendererData: REGISTRY[routeKey],
                      setting: routeKey,
                      title: () => pageDef.title,
                      breadcrumbs: ["Vendetta"],
                      icon: REGISTRY[routeKey].icon,
                    },
                  ]
                : []),
              ...out,
            ];
          })
        );

        const REL = relRenderCfg.SETTING_RELATIONSHIPS;
        const CFG = relRenderCfg.SETTING_RENDERER_CONFIGS;

        relRenderCfg.SETTING_RELATIONSHIPS = { ...REL, [routeKey]: null };
        relRenderCfg.SETTING_RENDERER_CONFIGS = { ...CFG, ...REGISTRY };

        unpatchers.push(() => {
          relRenderCfg.SETTING_RELATIONSHIPS = REL;
          relRenderCfg.SETTING_RENDERER_CONFIGS = CFG;
        });

        return true;
      };

      const wireSearchableList = () => {
        const Searchable = s.findByProps("SearchableSettingsList");
        const RendererCfg = s.findByProps("SETTING_RENDERER_CONFIG");
        const listMod = s.findByProps("getSettingListItems");

        if (!listMod || !Searchable || !RendererCfg) return false;

        unpatchers.push(
          w.before("type", Searchable.SearchableSettingsList, (args) => {
            const [props] = args;
            // Prepend our entry to the searchable items (in overview context)
            const clone = [...props];
            if (clone?.[0]?.sections) {
              const cat = clone[0].sections.find(x => x?.title === "Vendetta" || x?.label === "Vendetta");
              if (cat && !cat.settings.includes(routeKey)) cat.settings.push(routeKey);
            }
            return clone;
          })
        );

        unpatchers.push(
          w.after("getSettingListSearchResultItems", listMod, (_a, out) => {
            for (const item of out) if (item.setting === routeKey) item.breadcrumbs = ["Vendetta"];
          })
        );

        const OLD = RendererCfg.SETTING_RENDERER_CONFIG;
        RendererCfg.SETTING_RENDERER_CONFIG = { ...OLD, ...REGISTRY };
        unpatchers.push(() => (RendererCfg.SETTING_RENDERER_CONFIG = OLD));

        return true;
      };

      wireSearchableList() || wireSettingsSearch();
    }

    // Unpatcher
    return () => unpatchers.forEach(u => u && u());
  }

  // ========== Theme Utils / UI ==========
  const ThemeStore = s.findByStoreName("ThemeStore");
  const Colors = s.findByProps("colors", "unsafe_rawColors");
  const colorMeta = Colors?.internal ?? Colors?.meta;
  const { TextStyleSheet } = s.findByProps("TextStyleSheet");
  const { View: Vw, Text: Txt, Pressable } = N.General;

  const ActionSheetMod = s.findByProps("ActionSheet")?.ActionSheet ?? s.find(e => e.render?.name === "ActionSheet");
  const sheet = s.findByProps("openLazy", "hideActionSheet");
  const { openLazy, hideActionSheet } = sheet;
  const { ActionSheetTitleHeader, ActionSheetCloseButton, ActionSheetContentContainer } =
    s.findByProps("ActionSheetTitleHeader", "ActionSheetCloseButton", "ActionSheetContentContainer");

  const SearchControls = s.findByProps("useSearchControls");
  const SearchQuery = s.findByProps("useSettingSearchQuery");
  const SettingSearchBar = s.findByName("SettingSearchBar");

  function resolveColor(token, theme = ThemeStore.theme) {
    return colorMeta.resolveSemanticColor(theme, token);
  }

  function openActionSheet(Component, props) {
    try {
      openLazy(new Promise(r => r({ default: Component })), "ActionSheet", props);
    } catch (err) {
      D.logger.error(err.stack);
      y.showToast("Got error when opening ActionSheet! Please check debug logs", f.getAssetIDByName("Smal"));
    }
  }

  // Search header used by overview search
  const UseAdvancedSearch = Object.assign(
    function SearchHeader({ searchContext, controls }) {
      return t.React.createElement(
        t.ReactNative.ScrollView,
        { scrollEnabled: false },
        t.React.createElement(SearchControls.default, { searchContext, controls },
          t.React.createElement(SettingSearchBar, null)
        )
      );
    },
    {
      useAdvancedSearch(ctx) {
        const query = SearchQuery.useSettingSearchQuery();
        const controls = SearchControls.useSearchControls(ctx, false, function() {});
        t.React.useEffect(() => () => {
          SearchQuery.setSettingSearchQuery("");
          SearchQuery.setIsSettingSearchActive(false);
        }, []);
        return [query, controls];
      }
    }
  );

  // Typography sugar
  function Eyebrow({ children, marginLeft }) {
    const { View } = N.General;
    const styles = t.stylesheet.createThemedStyleSheet({
      main: { marginRight: 16, flexGrow: 0 },
      content: {
        backgroundColor: I.semanticColors.REDESIGN_BUTTON_PRIMARY_BACKGROUND,
        borderRadius: 16,
        marginLeft: 8,
        paddingHorizontal: 8,
      },
    });
    return t.React.createElement(View, { style: [styles.main, marginLeft ? { marginLeft: 16, marginRight: 0 } : {}] },
      t.React.createElement(View, { style: styles.content },
        t.React.createElement(Txt, {
          style: [TextStyleSheet.eyebrow, { color: resolveColor(I.semanticColors.TEXT_NORMAL) }]
        }, children)
      )
    );
  }

  function TText({ variant, lineClamp, color, align, style, onPress, getChildren, children }) {
    return t.React.createElement(
      Txt,
      {
        style: [
          variant ? TextStyleSheet[variant] : {},
          color ? { color: resolveColor(I.semanticColors[color]) } : {},
          align ? { textAlign: align } : {},
          style ?? {},
        ],
        numberOfLines: lineClamp,
        onPress,
      },
      getChildren?.() ?? children
    );
  }

  function IconButton({ onPress, onLongPress, icon, style, destructive, color }) {
    const ss = t.stylesheet.createThemedStyleSheet({
      headerStyleIcon: { width: 24, height: 24, marginRight: 10, tintColor: I.semanticColors.HEADER_PRIMARY },
      cardStyleIcon: { width: 22, height: 22, marginLeft: 5, tintColor: I.semanticColors.INTERACTIVE_NORMAL },
      destructiveIcon: { tintColor: I.semanticColors.TEXT_DANGER },
    });
    return t.React.createElement(
      t.ReactNative.TouchableOpacity,
      { onPress, onLongPress },
      t.React.createElement(t.ReactNative.Image, {
        style: [
          typeof style === "string" ? (style === "header" ? ss.headerStyleIcon : ss.cardStyleIcon) : style,
          destructive && ss.destructiveIcon,
          color && { tintColor: color },
        ].filter(Boolean),
        source: icon,
      })
    );
  }

  // ========== Change detection for "New / Updated" badges ==========
  let REMOTE_HASHES = {};           // url -> hash (from remote list)
  const STORE = le.storage;         // persistent storage between sessions
  function diffSinceLast() {
    if (!Object.keys(REMOTE_HASHES)[0] || !STORE.themeCache?.[0]) return [];
    return Object.entries(REMOTE_HASHES)
      .map(([url, hash]) => {
        return STORE.themeCache?.includes(url)
          ? (fe.themes[url] && fe.themes[url].manifest?.hash !== hash ? [url, "update"] : undefined)
          : [url, "new"];
      })
      .filter(Boolean);
  }
  function setSeenNow() { STORE.themeCache = Object.keys(REMOTE_HASHES); }

  const THEMES_URL = "https://vd-plugins.github.io/proxy/themes-full.json"; // <- host your list here (shape you provided)

  async function refreshRemoteHashes() {
    const res = await (await A.safeFetch(THEMES_URL, { cache: "no-store" })).json();
    REMOTE_HASHES = Object.fromEntries(
      res.map(item => [item.link, item.hash])
    );
  }

  function startRemotePoller() {
    const interval = setInterval(refreshRemoteHashes, 600000); // 10 min
    refreshRemoteHashes();
    return () => clearInterval(interval);
  }

  // ========== Theme cards ==========
  const EmitterSym = Symbol.for("vendetta.storage.emitter");
  const hasThemeEmitter = !!fe.themes[EmitterSym];

  const { FormRow } = N.Forms;
  const cardStyles = t.stylesheet.createThemedStyleSheet({
    card: { backgroundColor: I.semanticColors.BACKGROUND_SECONDARY, borderRadius: 5 },
    header: { padding: 0, backgroundColor: I.semanticColors.BACKGROUND_TERTIARY, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
    actions: { flexDirection: "row-reverse", alignItems: "center" },
  });

  function Card({ headerLabel, headerIcon, descriptionLabel, actions, loading }) {
    const { View } = N.General;
    return t.React.createElement(
      t.ReactNative.View,
      { style: [cardStyles.card, { marginBottom: 10 }] },
      t.React.createElement(FormRow, {
        style: cardStyles.header,
        label: headerLabel,
        leading: headerIcon && t.React.createElement(FormRow.Icon, { source: headerIcon }),
      }),
      t.React.createElement(FormRow, {
        label: descriptionLabel,
        trailing: t.React.createElement(
          t.ReactNative.View,
          { style: cardStyles.actions },
          actions?.map(a =>
            t.React.createElement(IconButton, {
              icon: a.icon,
              onPress: a.onPress,
              onLongPress: a.onLongPress,
              style: "card",
              destructive: a.destructive ?? false,
            })
          ),
          loading && t.React.createElement(t.ReactNative.ActivityIndicator, { size: "small", style: { height: 22, width: 22 } })
        ),
      })
    );
  }

  function useThemeInstalled(url) {
    const [installed, setInstalled] = t.React.useState(!!fe.themes[url]);
    const emitter = fe.themes[EmitterSym];

    const sync = () => setInstalled(!!fe.themes[url]);

    t.React.useEffect(() => {
      setInstalled(!!fe.themes[url]);
      emitter.on("SET", sync);
      emitter.on("DEL", sync);
      return () => {
        emitter.off("SET", sync);
        emitter.off("DEL", sync);
      };
    }, [url]);

    return installed;
  }

  function ThemeRow({ item, changes }) {
    // item shape:
    // { name, description, authors: [{name,id}], link, vendetta:{icon}, hash }
    const url = item.link; // canonical theme url (already proxied in your list)
    const [busy, setBusy] = t.React.useState(false);
    const isInstalled = useThemeInstalled(url);

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
                  fe.removeTheme(url);
                  y.showToast(`Successfully removed ${item.name}`, f.getAssetIDByName("ic_message_delete"));
                } catch {
                  y.showToast(`Failed to remove ${item.name}!`, f.getAssetIDByName("Small"));
                }
                setBusy(false);
              },
              onLongPress: () => {
                t.clipboard.setString(url);
                y.showToast("Copied theme URL", f.getAssetIDByName("toast_copy_link"));
              },
            },
          ]
        : [
            {
              icon: f.getAssetIDByName("ic_download_24px"),
              onPress: async () => {
                setBusy(true);
                fe.installTheme(url, true)
                  .then(() => y.showToast(`Successfully installed ${item.name}`, f.getAssetIDByName("toast_image_saved")))
                  .catch(err => y.showToast(err?.message ?? `Failed to install ${item.name}!`, f.getAssetIDByName("Small")))
                  .finally(() => setBusy(false));
              },
              onLongPress: () => {
                t.clipboard.setString(url);
                y.showToast("Copied theme URL", f.getAssetIDByName("toast_copy_link"));
              },
            },
          ];

    const { View } = N.General;
    return t.React.createElement(
      Card,
      {
        headerLabel: t.React.createElement(
          View,
          { style: { flexDirection: "row", alignItems: "center" } },
          change && t.React.createElement(Eyebrow, { children: change[1] === "new" ? "New" : "Upd" }),
          t.React.createElement(TText, { variant: "text-md/semibold", color: "HEADER_PRIMARY" }, item.name),
          item.authors?.length
            ? t.React.createElement(
                TText,
                { variant: "text-md/semibold", color: "HEADER_PRIMARY", style: { marginLeft: 6 } },
                "by ",
                ...item.authors.map((a, i, arr) => t.React.createElement(t.React.Fragment, null, a.name, i !== arr.length - 1 && ", "))
              )
            : null
        ),
        headerIcon: f.getAssetIDByName(item.vendetta?.icon ?? "ic_theme_24px"),
        descriptionLabel: item.description,
        actions,
        loading: busy,
      }
    );
  }

  // ========== Sort / Filter Sheet ==========
  const { FormRadioRow } = N.Forms;
  const Sort = {
    DateNewest: "Creation date (new to old)",
    DateOldest: "Creation date (old to new)",
    NameAZ: "Name (A-Z)",
    NameZA: "Name (Z-A)",
  };

  function SortSheet({ label, value, choices, update }) {
    const [sel, setSel] = t.React.useState(value);
    update(sel);
    return t.React.createElement(
      ActionSheetMod,
      null,
      t.React.createElement(
        ActionSheetContentContainer,
        null,
        t.React.createElement(ActionSheetTitleHeader, {
          title: label,
          trailing: t.React.createElement(ActionSheetCloseButton, { onPress: () => hideActionSheet() }),
        }),
        choices.map(option =>
          t.React.createElement(FormRadioRow, {
            label: option,
            onPress: () => setSel(option),
            selected: sel === option,
          })
        )
      )
    );
  }

  // ========== Page ==========
  let refreshBtn, filterBtn;

  function ThemeBrowserPage() {
    const navigation = t.NavigationNative.useNavigation();

    if (!hasThemeEmitter) {
      de.showConfirmationAlert({
        title: "Can't use",
        content: "You must reinstall Vendetta first in order for Theme Browser to function properly",
        confirmText: "Dismiss",
        confirmColor: "brand",
        onConfirm() {},
        isDismissable: true,
      });
      navigation.goBack();
      return null;
    }

    const SEARCH_CTX = { type: "THEME_BROWSER_SEARCH" };
    const [query, controls] = UseAdvancedSearch.useAdvancedSearch(SEARCH_CTX);

    const changesRef = t.React.useRef(diffSinceLast()).current;
    const [sortBy, setSortBy] = t.React.useState(Sort.DateNewest);
    const [themes, setThemes] = t.React.useState(null);
    const setSortByRef = t.React.useRef(setSortBy);
    setSortByRef.current = setSortBy;

    const filtered = t.React.useMemo(() => {
      if (!themes) return themes;

      let list = themes
        .filter(it =>
          it.name?.toLowerCase().includes(query) ||
          it.authors?.some(a => a.name?.toLowerCase().includes(query)) ||
          it.description?.toLowerCase().includes(query)
        )
        .slice();

      if ([Sort.NameAZ, Sort.NameZA].includes(sortBy)) {
        list.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      }
      if ([Sort.NameZA, Sort.DateNewest].includes(sortBy)) list.reverse();

      return list;
    }, [themes, query, sortBy]);

    t.React.useEffect(setSeenNow, []);
    t.React.useEffect(() => {
      if (themes) return;
      A.safeFetch(THEMES_URL, { cache: "no-store" })
        .then(r => r.json().then(setThemes).catch(() => y.showToast("Failed to parse themes", f.getAssetIDByName("Small"))))
        .catch(() => y.showToast("Failed to fetch themes", f.getAssetIDByName("Small")));
    }, [themes]);

    refreshBtn = () => themes && setThemes(null);
    filterBtn = () =>
      themes &&
      openActionSheet(SortSheet, {
        label: "Filter",
        value: sortBy,
        choices: Object.values(Sort),
        update: (v) => setSortByRef.current(v),
      });

    navigation.addListener("focus", () => {
      navigation.setOptions({
        title: "Theme Browser",
        headerRight: () =>
          t.React.createElement(
            Vw,
            { style: { flexDirection: "row-reverse" } },
            t.React.createElement(IconButton, {
              onPress: () => refreshBtn?.(),
              icon: f.getAssetIDByName("ic_sync_24px"),
              style: "header",
            }),
            t.React.createElement(IconButton, {
              onPress: () => filterBtn?.(),
              icon: f.getAssetIDByName("ic_filter"),
              style: "header",
            })
          ),
      });
    });

    return themes
      ? t.React.createElement(t.ReactNative.FlatList, {
          ListHeaderComponent: t.React.createElement(Vw, { style: { marginBottom: 10 } },
            t.React.createElement(UseAdvancedSearch, { searchContext: SEARCH_CTX, controls })
          ),
          style: { paddingHorizontal: 10 },
          contentContainerStyle: { paddingBottom: 20 },
          data: filtered,
          renderItem: ({ item }) => t.React.createElement(ThemeRow, { item, changes: changesRef }),
          removeClippedSubviews: true,
        })
      : t.React.createElement(t.ReactNative.ActivityIndicator, { size: "large", style: { flex: 1 } });
  }

  // Row shown inside Settings Overview
  const { FormRow: FRow } = N.Forms;
  function ThemeBrowserOverviewRow({ changes }) {
    const nav = t.NavigationNative.useNavigation();
    return t.React.createElement(
      N.ErrorBoundary,
      null,
      t.React.createElement(FRow, {
        label: t.React.createElement(
          TText,
          { variant: "text-md/semibold", color: "HEADER_PRIMARY" },
          "Theme Browser",
          changes
            ? t.React.createElement(Eyebrow, { children: changes.toString(), marginLeft: true })
            : t.React.createElement(t.React.Fragment, null)
        ),
        leading: t.React.createElement(FRow.Icon, { source: f.getAssetIDByName("ic_theme_24px") }),
        trailing: FRow.Arrow,
        onPress: () => nav.push("VendettaCustomPage", { render: ThemeBrowserPage }),
      })
    );
  }

  // Inject into Settings + set title with (+new) count
  function mountThemeBrowser() {
    const unpatchers = [];

    // Settings row + page
    unpatchers.push(
      injectIntoSettings(
        () => true,
        () => t.React.createElement(ThemeBrowserOverviewRow, {
          changes: diffSinceLast().filter(x => x[1] === "new").length,
        }),
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

    // remote poller for hash changes
    unpatchers.push(startRemotePoller());

    return () => unpatchers.forEach(u => u && u());
  }

  // ========== Exports ==========
  const URL = THEMES_URL;
  let unmount;

  const ThemeBrowser = {
    onLoad() { unmount = mountThemeBrowser(); },
    onUnload() { unmount?.(); },
  };

  C.default = ThemeBrowser;
  C.themesURL = URL;
  C.vstorage = STORE;
  Object.defineProperty(C, "__esModule", { value: true });
  return C;
})({}, vendetta.plugin, vendetta, vendetta.ui.assets, vendetta.metro, vendetta.metro.common, vendetta.patcher, vendetta.ui, vendetta.ui.components, vendetta.utils, vendetta.ui.alerts, vendetta.ui.toasts, vendetta.plugins, vendetta.themes);
