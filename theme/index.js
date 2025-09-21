(function(C, le, D, f, s, t, w, I, N, A, de, y, S, fe) {
    "use strict";

    // ---------- UI/Metro pulls ----------
    const { FormSection: ge, FormRow: FormRow, FormRadioRow: FormRadioRow } = N.Forms;
    const ThemeStore = s.findByStoreName("ThemeStore");
    const ColorsMod = s.findByProps("colors", "unsafe_rawColors");
    const ColorRuntime = ColorsMod?.internal ?? ColorsMod?.meta;
    const TextSS = s.findByProps("TextStyleSheet")?.TextStyleSheet ?? {};
    const { View, Text, Pressable } = N.General;

    // ActionSheet
    const ActionSheetMod = s.findByProps("ActionSheet")?.ActionSheet ?? s.find(e => e.render?.name === "ActionSheet");
    const LazySheet = s.findByProps("openLazy", "hideActionSheet");
    const { openLazy: openSheet, hideActionSheet: hideSheet } = LazySheet;
    const {
        ActionSheetTitleHeader,
        ActionSheetCloseButton,
        ActionSheetContentContainer
    } = s.findByProps("ActionSheetTitleHeader", "ActionSheetCloseButton", "ActionSheetContentContainer") ?? {};

    // Settings search (optional; older builds may not expose these)
    const SearchControls = s.findByProps("useSearchControls") || null;
    const SearchQuery = s.findByProps("useSettingSearchQuery") || null;
    const SettingSearchBar = s.findByName("SettingSearchBar") || null;

    // User stuff (for author chips)
    const { showUserProfile } = s.findByProps("showUserProfile") ?? {};
    const { fetchProfile } = s.findByProps("fetchProfile") ?? {};
    const UserStore = s.findByStoreName("UserStore") ?? {};

    // Misc
    const getScreens = s.findByName("getScreens");
    const UserSettingsOverviewWrapper = s.findByName("UserSettingsOverviewWrapper", !1);
    const StorageEmitterKey = Symbol.for("vendetta.storage.emitter");

    // ---------- Config ----------
    const THEMES_URL = "https://troyydev.github.io/Playfab-pal/theme/themes-full.json";
    const vstorage = le.storage;

    // ---------- Theming helpers ----------
    const themed = t.stylesheet.createThemedStyleSheet({
        screen: {
            flex: 1,
            backgroundColor: I.semanticColors.BACKGROUND_MOBILE_PRIMARY
        },
        listPad: { paddingHorizontal: 12, paddingBottom: 24 },
        chipWrap: { marginRight: 10, flexGrow: 0 },
        chip: {
            backgroundColor: I.semanticColors.REDESIGN_BUTTON_PRIMARY_BACKGROUND,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 2
        },
        card: {
            backgroundColor: I.semanticColors.BACKGROUND_SECONDARY,
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 12,
            borderColor: I.semanticColors.BACKGROUND_TERTIARY,
            borderWidth: 1
        },
        cardHeader: {
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: I.semanticColors.BACKGROUND_TERTIARY,
            flexDirection: "row",
            alignItems: "center"
        },
        cardIconCircle: {
            width: 28, height: 28, borderRadius: 14,
            alignItems: "center", justifyContent: "center",
            backgroundColor: I.semanticColors.BACKGROUND_SECONDARY_ALT,
            marginRight: 10
        },
        cardBody: { paddingHorizontal: 12, paddingVertical: 10 },
        cardActions: { flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 12, paddingBottom: 10 },
        badgeRow: { flexDirection: "row", alignItems: "center", marginRight: 6 },
        headerRightRow: { flexDirection: "row-reverse" },
        empty: { flex: 1, alignItems: "center", justifyContent: "center" }
    });

    function resolveColor(semantic, theme = ThemeStore.theme) {
        return ColorRuntime.resolveSemanticColor(theme, semantic);
    }

    // ---------- Tiny typographic helpers ----------
    function TText({ variant, color, numberOfLines, style, onPress, children }) {
        const base = variant ? TextSS[variant] : null;
        return t.React.createElement(Text, {
            style: [
                base || {},
                color ? { color: resolveColor(I.semanticColors[color]) } : {},
                style || {}
            ],
            numberOfLines,
            onPress
        }, children);
    }

    function Chip({ text, color = "TEXT_NORMAL", ml }) {
        return t.React.createElement(
            View, { style: [themed.chipWrap, ml ? { marginLeft: 16, marginRight: 0 } : null] },
            t.React.createElement(View, { style: themed.chip },
                t.React.createElement(TText, { variant: "eyebrow", color }, text)
            )
        );
    }

    function IconButton({ onPress, onLongPress, icon, kind = "card", destructive = !1 }) {
        const styles = t.stylesheet.createThemedStyleSheet({
            header: {
                width: 24, height: 24, marginRight: 10,
                tintColor: I.semanticColors.HEADER_PRIMARY
            },
            card: {
                width: 22, height: 22, marginLeft: 8,
                tintColor: I.semanticColors.INTERACTIVE_NORMAL
            },
            danger: { tintColor: I.semanticColors.TEXT_DANGER }
        });
        const style = kind === "header" ? styles.header : styles.card;

        return t.React.createElement(
            t.ReactNative.TouchableOpacity, { onPress, onLongPress },
            t.React.createElement(t.ReactNative.Image, {
                style: [style, destructive && styles.danger],
                source: icon
            })
        );
    }

    // ---------- Settings injection ----------
    function injectSettingRow(shouldInsert, renderRow, route) {
        const unpatchers = [];

        const unpatchOverview = w.after("default", UserSettingsOverviewWrapper, function(_a, res) {
            unpatchOverview();

            const overview = A.findInReactTree(res.props.children, h => h.type && h.type.name === "UserSettingsOverview");

            unpatchers.push(
                w.after("render", overview.type.prototype, function(_args, rendered) {
                    let { props: { children } } = rendered;
                    const stopAfter = [t.i18n.Messages.BILLING_SETTINGS, t.i18n.Messages.PREMIUM_SETTINGS];
                    const list = A.findInReactTree(children, d => d?.children?.[1]?.type === ge)?.children ?? [];

                    const insertIndex = list.findIndex(d => stopAfter.includes(d?.props?.label));
                    if (shouldInsert()) list.splice(insertIndex === -1 ? 4 : insertIndex, 0, renderRow({}));
                })
            );
        }, !0);
        unpatchers.push(unpatchOverview);

        if (getScreens && route) {
            const routeKey = `VENDETTA_THEME_${t.lodash.snakeCase(route.key).toUpperCase()}`;
            const Page = route.page.render;

            const ScreenWrapper = t.React.memo(function({ navigation }) {
                const off = navigation.addListener("focus", function() {
                    off();
                    navigation.setOptions(A.without(route.page, "noErrorBoundary", "render"));
                });
                return t.React.createElement(
                    t.ReactNative.View, { style: themed.screen },
                    route.page.noErrorBoundary
                        ? t.React.createElement(Page, null)
                        : t.React.createElement(N.ErrorBoundary, null, t.React.createElement(Page, null))
                );
            });

            const ROUTE_CONFIG = {
                [routeKey]: {
                    type: "route",
                    title: () => route.title,
                    icon: route.icon,
                    parent: null,
                    screen: {
                        route: `VendettaTheme${t.lodash.chain(route.key).camelCase().upperFirst().value()}`,
                        getComponent: () => ScreenWrapper
                    }
                }
            };

            const stitchVendettaBucket = (arr, searchable) => {
                const list = [...arr];
                const sections = searchable ? list?.[0]?.sections : list;
                if (!Array.isArray(sections)) return sections;
                const bucket = sections.find(x => x?.title === "Vendetta" || x?.label === "Vendetta");
                if (bucket && !bucket.settings.includes(routeKey)) bucket.settings.push(routeKey);
                return list;
            };

            const patchSearchablePath = (() => {
                const SearchableList = s.findByProps("SearchableSettingsList");
                const SingleConfig = s.findByProps("SETTING_RENDERER_CONFIG");
                const listItemsMod = s.findByProps("getSettingListItems");
                if (!SearchableList || !SingleConfig || !listItemsMod) return !1;

                unpatchers.push(w.before("type", SearchableList.SearchableSettingsList, P => stitchVendettaBucket(P, !0)));
                unpatchers.push(w.after("getSettingListSearchResultItems", listItemsMod, (_a, results) => {
                    for (const r of results) if (r.setting === routeKey) r.breadcrumbs = ["Vendetta"];
                }));

                const prev = SingleConfig.SETTING_RENDERER_CONFIG;
                SingleConfig.SETTING_RENDERER_CONFIG = { ...prev, ...ROUTE_CONFIG };
                unpatchers.push(() => { SingleConfig.SETTING_RENDERER_CONFIG = prev; });

                return !0;
            })();

            if (!patchSearchablePath) {
                const overview = s.findByProps("useOverviewSettings");
                const titles = s.findByProps("getSettingTitleConfig");
                const registry = s.findByProps("SETTING_RELATIONSHIPS", "SETTING_RENDERER_CONFIGS");
                const FN_SEARCH = "getSettingSearchListItems";
                const FN_LIST = "getSettingListItems";
                const searchMod = s.findByProps(FN_SEARCH) || s.findByProps(FN_LIST);
                const searchFnName = s.findByProps(FN_SEARCH) ? FN_SEARCH : FN_LIST;
                if (overview && titles && registry && searchMod) {
                    unpatchers.push(w.after("useOverviewSettings", overview, (_a, ret) => stitchVendettaBucket(ret)));
                    unpatchers.push(w.after("getSettingTitleConfig", titles, (_a, ret) => ({ ...ret, [routeKey]: route.title })));
                    unpatchers.push(w.after(searchFnName, searchMod, (args, ret) => {
                        const [requested] = args;
                        return [
                            ...(requested.includes(routeKey) ? [{
                                type: "setting_search_result",
                                ancestorRendererData: ROUTE_CONFIG[routeKey],
                                setting: routeKey,
                                title: () => route.title,
                                breadcrumbs: ["Vendetta"],
                                icon: ROUTE_CONFIG[routeKey].icon
                            }] : []),
                            ...ret
                        ];
                    }));

                    const oldRel = registry.SETTING_RELATIONSHIPS;
                    const oldCfg = registry.SETTING_RENDERER_CONFIGS;
                    registry.SETTING_RELATIONSHIPS = { ...oldRel, [routeKey]: null };
                    registry.SETTING_RENDERER_CONFIGS = { ...oldCfg, ...ROUTE_CONFIG };
                    unpatchers.push(() => {
                        registry.SETTING_RELATIONSHIPS = oldRel;
                        registry.SETTING_RENDERER_CONFIGS = oldCfg;
                    });
                }
            }
        }

        return () => unpatchers.forEach(u => u());
    }

    // ---------- Catalog polling + change detection ----------
    // L: link -> hash
    let L = {};

    function migrateStorage() {
        // Move old array cache to map on first run
        if (!vstorage.themeCacheMap && Array.isArray(vstorage.themeCache)) {
            vstorage.themeCacheMap = Object.fromEntries(vstorage.themeCache.map(link => [link, null]));
        }
        if (!vstorage.themeCacheMap) vstorage.themeCacheMap = {};
    }

    function getPrevMap() {
        migrateStorage();
        return vstorage.themeCacheMap || {};
    }

    function detectChanges() {
        const prev = getPrevMap();
        if (!Object.keys(L).length) return [];
        return Object.entries(L)
            .map(([link, hash]) => {
                if (!(link in prev)) return [link, "new"];
                if (prev[link] && prev[link] !== hash) return [link, "update"];
                return undefined;
            })
            .filter(Boolean);
    }

    function persistSeen() {
        vstorage.themeCacheMap = { ...L };
    }

    async function fetchCatalog() {
        const res = await A.safeFetch(THEMES_URL, { cache: "no-store" });
        const json = await res.json();
        // Expect: { name, description, authors[], source?, link, vendetta:{icon}, hash }
        L = Object.fromEntries(json.map(n => [n.link, n.hash]));
        return json;
    }

    function startPolling() {
        const id = setInterval(fetchCatalog, 6e5);
        fetchCatalog().catch(() => {});
        return () => clearInterval(id);
    }

    // ---------- Link helpers ----------
    function toGithubBlob(url) {
        try {
            const u = new URL(url);
            if (u.hostname === "raw.githubusercontent.com") {
                const parts = u.pathname.split("/").filter(Boolean); // user/repo/branch/path...
                if (parts.length >= 4) {
                    const [user, repo, branch, ...path] = parts;
                    return `https://github.com/${user}/${repo}/blob/${branch}/${path.join("/")}`;
                }
            }
            return url;
        } catch { return url; }
    }

    // ---------- Search wrapper ----------
    function openActionSheet(Component, props) {
        try {
            openSheet(new Promise(r => r({ default: Component })), "ActionSheet", props);
        } catch (err) {
            D.logger.error(err?.stack);
            y.showToast("Error opening sheet", f.getAssetIDByName("Small"));
        }
    }

    const SearchBox = Object.assign(function SearchBox({ searchContext, controls }) {
        // Prefer native SettingSearchBar and controls; otherwise noop
        return t.React.createElement(
            t.ReactNative.ScrollView, { scrollEnabled: !1 },
            (SearchControls?.default && SettingSearchBar)
                ? t.React.createElement(SearchControls.default, { searchContext, controls },
                    t.React.createElement(SettingSearchBar, null))
                : (SettingSearchBar ? t.React.createElement(SettingSearchBar, null) : t.React.createElement(View, null))
        );
    }, {
        useAdvancedSearch(ctx) {
            const query = SearchQuery?.useSettingSearchQuery ? SearchQuery.useSettingSearchQuery() : "";
            const controls = SearchControls?.useSearchControls
                ? SearchControls.useSearchControls(ctx, !1, function() {})
                : { isActive: !1, setIsActive() {}, onChangeText() {}, onSubmit() {} };

            t.React.useEffect(() => () => {
                if (SearchQuery) {
                    SearchQuery.setSettingSearchQuery("");
                    SearchQuery.setIsSettingSearchActive(!1);
                }
            }, []);

            return [query ?? "", controls];
        }
    });

    // ---------- Authors ----------
    function AuthorChip({ id, fallback }) {
        const [name, setName] = t.React.useState(null);
        t.React.useEffect(() => {
            if (!id || !fetchProfile || !UserStore) return;
            const have = UserStore.getUser?.(id);
            if (have) setName(have.username);
            else fetchProfile(id).then(u => setName(u?.user?.username)).catch(() => {});
        }, [id]);

        return t.React.createElement(
            TText,
            {
                variant: "text-md/bold",
                color: "TEXT_LINK",
                onPress: () => {
                    if (!showUserProfile) return;
                    const have = UserStore.getUser?.(id);
                    if (have) showUserProfile({ userId: id });
                    else fetchProfile?.(id).then(() => showUserProfile({ userId: id })).catch(() => {});
                }
            },
            fallback ?? (name ? `@${name}` : "...")
        );
    }

    // ---------- Theme installed state ----------
    function useThemeInstalled(link) {
        const [installed, setInstalled] = t.React.useState(!!fe.themes[link]);
        const emitter = fe.themes[StorageEmitterKey];
        const refresh = () => setInstalled(!!fe.themes[link]);

        t.React.useEffect(() => {
            setInstalled(!!fe.themes[link]);
            emitter?.on?.("SET", refresh);
            emitter?.on?.("DEL", refresh);
            return () => {
                emitter?.off?.("SET", refresh);
                emitter?.off?.("DEL", refresh);
            };
        }, [link]);

        return installed;
    }

    // ---------- Theme Card ----------
    function ThemeCard({ item, marks }) {
        const themeUrl = item.link;
        const installed = useThemeInstalled(themeUrl);
        const [busy, setBusy] = t.React.useState(!1);

        const change = marks.find(m => m[0] === themeUrl)?.[1]; // "new" | "update"
        const badgeEl = change
            ? t.React.createElement(Chip, { text: change === "new" ? "New" : "Upd" })
            : null;

        // Source: prefer item.source, else derive from raw link
        const sourceLink = item.source || toGithubBlob(themeUrl);

        const actions = busy ? [] : (installed
            ? [
                {
                    icon: f.getAssetIDByName("ic_sync_24px"),
                    onPress: function() {
                        setBusy(!0);
                        fe.installTheme(themeUrl, !0)
                            .then(() => y.showToast(`Updated ${item.name}`, f.getAssetIDByName("ic_sync_24px")))
                            .catch(() => y.showToast(`Failed to update ${item.name}`, f.getAssetIDByName("Small")))
                            .finally(() => setBusy(!1));
                    }
                },
                {
                    icon: f.getAssetIDByName("ic_message_delete"),
                    destructive: !0,
                    onPress: function() {
                        setBusy(!0);
                        try {
                            fe.removeTheme(themeUrl);
                            y.showToast(`Removed ${item.name}`, f.getAssetIDByName("ic_message_delete"));
                        } catch {
                            y.showToast(`Failed to remove ${item.name}`, f.getAssetIDByName("Small"));
                        } finally {
                            setBusy(!1);
                        }
                    },
                    onLongPress: function() {
                        t.clipboard.setString(themeUrl);
                        y.showToast("Copied theme URL", f.getAssetIDByName("toast_copy_link"));
                    }
                }
            ]
            : [
                {
                    icon: f.getAssetIDByName("ic_download_24px"),
                    onPress: function() {
                        setBusy(!0);
                        fe.installTheme(themeUrl, !0)
                            .then(() => y.showToast(`Installed ${item.name}`, f.getAssetIDByName("toast_image_saved")))
                            .catch(err => y.showToast(err?.message ?? `Failed to install ${item.name}`, f.getAssetIDByName("Small")))
                            .finally(() => setBusy(!1));
                    },
                    onLongPress: function() {
                        t.clipboard.setString(themeUrl);
                        y.showToast("Copied theme URL", f.getAssetIDByName("toast_copy_link"));
                    }
                }
            ]);

        const extra = [
            {
                icon: f.getAssetIDByName("img_account_sync_github_white"),
                onPress: () => t.url.openURL(sourceLink),
                onLongPress: function() {
                    t.clipboard.setString(sourceLink);
                    y.showToast("Copied source link", f.getAssetIDByName("toast_copy_link"));
                }
            }
        ];

        return t.React.createElement(
            t.ReactNative.View, { style: themed.card },

            // Header
            t.React.createElement(
                View, { style: themed.cardHeader },
                t.React.createElement(View, { style: themed.cardIconCircle },
                    t.React.createElement(t.ReactNative.Image, {
                        source: f.getAssetIDByName(item.vendetta?.icon ?? "ic_theme_24px"),
                        style: { width: 20, height: 20, tintColor: resolveColor(I.semanticColors.INTERACTIVE_NORMAL) }
                    })
                ),
                t.React.createElement(View, { style: { flex: 1 } },
                    t.React.createElement(TText, { variant: "text-md/semibold", color: "HEADER_PRIMARY", numberOfLines: 1 }, item.name),
                    item.authors?.length
                        ? t.React.createElement(TText, { variant: "text-sm/semibold", color: "TEXT_MUTED", numberOfLines: 1 },
                            "by ",
                            ...item.authors.map((a, idx, arr) => t.React.createElement(t.React.Fragment, null,
                                t.React.createElement(AuthorChip, { id: a.id, fallback: a.name }),
                                idx !== arr.length - 1 ? ", " : ""
                            ))
                          )
                        : null
                ),
                badgeEl
            ),

            // Body
            t.React.createElement(
                View, { style: themed.cardBody },
                t.React.createElement(TText, { variant: "text-sm/normal", color: "TEXT_NORMAL", numberOfLines: 3 }, item.description || "No description.")
            ),

            // Actions
            t.React.createElement(
                View, { style: themed.cardActions },
                ...extra.map((ac, i) => t.React.createElement(IconButton, { key: `x${i}`, ...ac, kind: "card" })),
                ...actions.map((ac, i) => t.React.createElement(IconButton, { key: i, ...ac, kind: "card" })),
                busy && t.React.createElement(t.ReactNative.ActivityIndicator, { size: "small", style: { height: 22, width: 22 } })
            )
        );
    }

    // ---------- Filters / Sort ----------
    const Sort = {
        FreshFirst: "Fresh first (New/Upd)",
        InstalledFirst: "Installed first",
        NameAZ: "Name (A–Z)",
        NameZA: "Name (Z–A)"
    };

    function SortSheet({ label, value, choices, update }) {
        const [selected, setSelected] = t.React.useState(value);
        update(selected);
        return t.React.createElement(
            ActionSheetMod, null,
            t.React.createElement(ActionSheetContentContainer, null,
                t.React.createElement(ActionSheetTitleHeader, {
                    title: label,
                    trailing: t.React.createElement(ActionSheetCloseButton, { onPress: () => hideSheet() })
                }),
                choices.map(c =>
                    t.React.createElement(FormRadioRow, {
                        key: c, label: c,
                        onPress: () => setSelected(c),
                        selected: selected === c
                    })
                )
            )
        );
    }

    // ---------- Main Screen ----------
    let headerRefresh, headerFilter;

    function ThemeBrowser() {
        const nav = t.NavigationNative.useNavigation();

        if (!fe.themes[StorageEmitterKey]) {
            de.showConfirmationAlert({
                title: "Can't use",
                content: "Reinstall Vendetta for Theme Browser to function properly.",
                confirmText: "Dismiss",
                confirmColor: "brand",
                onConfirm() {},
                isDismissable: !0
            });
            nav.goBack();
            return null;
        }

        const searchCtx = { type: "THEME_BROWSER_SEARCH" };
        const [query, searchControls] = SearchBox.useAdvancedSearch(searchCtx);

        // Data
        const [catalog, setCatalog] = t.React.useState(null);
        const [refreshing, setRefreshing] = t.React.useState(!1);

        // Sort
        const [sortBy, setSortBy] = t.React.useState(Sort.FreshFirst);
        const sortSetterRef = t.React.useRef(setSortBy); sortSetterRef.current = setSortBy;

        // Change marks
        const marksRef = t.React.useRef(detectChanges()).current;

        // Fetch (initial + when header refresh taps sets null)
        t.React.useEffect(() => {
            if (catalog) return;
            (async () => {
                try {
                    const json = await fetchCatalog();
                    setCatalog(json);
                } catch {
                    y.showToast("Failed to fetch themes", f.getAssetIDByName("Small"));
                }
            })();
        }, [catalog]);

        // Persist seen on mount so new/install badges don't reappear next time
        t.React.useEffect(persistSeen, []);

        // Header buttons
        headerRefresh = () => setCatalog(null);
        headerFilter = () => {
            if (!catalog) return;
            openActionSheet(SortSheet, {
                label: "Sort",
                value: sortBy,
                choices: Object.values(Sort),
                update: (val) => sortSetterRef.current(val)
            });
        };

        nav.addListener("focus", function() {
            nav.setOptions({
                title: "Theme Browser",
                headerRight() {
                    return t.React.createElement(View, { style: themed.headerRightRow },
                        t.React.createElement(IconButton, {
                            onPress: headerRefresh, icon: f.getAssetIDByName("ic_sync_24px"), kind: "header"
                        }),
                        t.React.createElement(IconButton, {
                            onPress: headerFilter, icon: f.getAssetIDByName("ic_filter"), kind: "header"
                        })
                    );
                }
            });
        });

        // Filtering + sorting
        const lowerQ = (query ?? "").toLowerCase();
        const filtered = t.React.useMemo(() => {
            if (!catalog) return [];
            let arr = catalog.filter(o =>
                o.name?.toLowerCase().includes(lowerQ) ||
                (o.authors ?? []).some(a => a.name?.toLowerCase().includes(lowerQ)) ||
                o.description?.toLowerCase().includes(lowerQ)
            );

            // Sorts
            if (sortBy === Sort.NameAZ || sortBy === Sort.NameZA) {
                arr = [...arr].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
                if (sortBy === Sort.NameZA) arr.reverse();
            } else if (sortBy === Sort.FreshFirst) {
                const isFresh = (it) => marksRef.some(m => m[0] === it.link);
                arr = [...arr].sort((a, b) => (isFresh(b) - isFresh(a)) || (a.name > b.name ? 1 : -1));
            } else if (sortBy === Sort.InstalledFirst) {
                arr = [...arr].sort((a, b) => ((!!fe.themes[b.link]) - (!!fe.themes[a.link])) || (a.name > b.name ? 1 : -1));
            }
            return arr;
        }, [catalog, lowerQ, sortBy]);

        // Pull to refresh
        function onRefresh() {
            setRefreshing(!0);
            fetchCatalog()
                .then(json => setCatalog(json))
                .catch(() => y.showToast("Refresh failed", f.getAssetIDByName("Small")))
                .finally(() => setRefreshing(!1));
        }

        // Counts for title chip if we wanted (we keep header clean; show chip in row instead)
        const counts = t.React.useMemo(() => {
            const list = marksRef;
            return {
                new: list.filter(m => m[1] === "new").length,
                upd: list.filter(m => m[1] === "update").length
            };
        }, [marksRef]);

        return catalog
            ? t.React.createElement(
                t.ReactNative.FlatList,
                {
                    ListHeaderComponent: t.React.createElement(View, { style: { marginBottom: 10 } },
                        t.React.createElement(SearchBox, { searchContext: searchCtx, controls: searchControls })
                    ),
                    style: {},
                    contentContainerStyle: themed.listPad,
                    data: filtered,
                    keyExtractor: (it, i) => it.link ?? String(i),
                    renderItem: ({ item }) => t.React.createElement(ThemeCard, { item, marks: marksRef }),
                    removeClippedSubviews: !0,
                    refreshControl: t.React.createElement(t.ReactNative.RefreshControl, {
                        refreshing, onRefresh,
                        tintColor: resolveColor(I.semanticColors.INTERACTIVE_NORMAL)
                    }),
                    ListEmptyComponent: t.React.createElement(View, { style: themed.empty },
                        t.React.createElement(TText, { variant: "text-md/semibold", color: "TEXT_MUTED" },
                            lowerQ ? "No themes match your search." : "No themes found.")
                    )
                }
            )
            : t.React.createElement(t.ReactNative.ActivityIndicator, { size: "large", style: { flex: 1 } });
    }

    // ---------- Settings row ----------
    function SettingsRow({ changes }) {
        const nav = t.NavigationNative.useNavigation();
        const chips = [];
        if (changes?.new) chips.push(t.React.createElement(Chip, { key: "n", text: `+${changes.new}`, ml: !0 }));
        if (changes?.upd) chips.push(t.React.createElement(Chip, { key: "u", text: `↑${changes.upd}`, ml: !changes?.new }));

        return t.React.createElement(
            N.ErrorBoundary, null,
            t.React.createElement(FormRow, {
                label: t.React.createElement(View, { style: { flexDirection: "row", alignItems: "center" } },
                    t.React.createElement(TText, { variant: "text-md/semibold", color: "HEADER_PRIMARY" }, "Theme Browser"),
                    ...chips
                ),
                leading: t.React.createElement(FormRow.Icon, { source: f.getAssetIDByName("ic_theme_24px") }),
                trailing: FormRow.Arrow,
                onPress: () => nav.push("VendettaCustomPage", { render: ThemeBrowser })
            })
        );
    }

    // ---------- Mount / Unmount ----------
    function mount() {
        // compute change counts once for settings chip
        const list = detectChanges();
        const counts = { new: list.filter(m => m[1] === "new").length, upd: list.filter(m => m[1] === "update").length };

        const cleanups = [];
        cleanups.push(
            injectSettingRow(
                () => !0,
                () => t.React.createElement(SettingsRow, { changes: counts }),
                {
                    key: D.plugin.manifest.name,
                    icon: f.getAssetIDByName("ic_theme_24px"),
                    get title() {
                        const n = counts.new, u = counts.upd;
                        const suffix = n || u ? ` (${n ? `+${n}` : ""}${u ? `${n ? " · " : ""}↑${u}` : ""})` : "";
                        return `Theme Browser${suffix}`;
                    },
                    page: { render: ThemeBrowser }
                }
            )
        );

        cleanups.push(startPolling());

        return () => cleanups.forEach(fn => fn());
    }

    let disposer;

    const Plugin = {
        onLoad() { disposer = mount(); },
        onUnload() { disposer?.(); }
    };

    // ---------- Exports ----------
    C.default = Plugin;
    C.themesURL = THEMES_URL;
    C.vstorage = vstorage;
    Object.defineProperty(C, "__esModule", { value: !0 });
    return C;

})(
    {},
    vendetta.plugin,
    vendetta,
    vendetta.ui.assets,
    vendetta.metro,
    vendetta.metro.common,
    vendetta.patcher,
    vendetta.ui,
    vendetta.ui.components,
    vendetta.utils,
    vendetta.ui.alerts,
    vendetta.ui.toasts,
    vendetta.plugins,
    vendetta.themes
);
