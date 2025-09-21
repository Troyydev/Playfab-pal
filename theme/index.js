(function(C, le, D, f, s, t, w, I, N, A, de, y, S, fe) {
    "use strict";

    // Pull FormSection from vendetta.ui.components
    const { FormSection: ge } = N.Forms;

    // Hooks into User Settings view
    const he = s.findByName("getScreens");
    const Re = s.findByName("UserSettingsOverviewWrapper", !1);

    // Themed stylesheet
    const pe = t.stylesheet.createThemedStyleSheet({
        container: {
            flex: 1,
            backgroundColor: I.semanticColors.BACKGROUND_MOBILE_PRIMARY
        }
    });

    /**
     * Injects a row + route into User Settings
     */
    function ye(shouldInsert, renderRow, route) {
        const unpatchers = [];

        // Attach to UserSettingsOverview so we can insert our row
        const unpatchOverview = w.after("default", Re, function(_args, res) {
            unpatchOverview();
            const overview = A.findInReactTree(res.props.children, h => h.type && h.type.name === "UserSettingsOverview");
            unpatchers.push(
                w.after("render", overview.type.prototype, function(_args2, renderRes) {
                    let { props: { children } } = renderRes;
                    const stopAfter = [t.i18n.Messages.BILLING_SETTINGS, t.i18n.Messages.PREMIUM_SETTINGS];
                    // Find the FormSection list we can mutate
                    children = A.findInReactTree(children, d => d.children[1].type === ge).children;

                    // Figure where to insert (before Billing/Premium if present, else index 4 like stock)
                    const insertIndex = children.findIndex(d => stopAfter.includes(d?.props.label));
                    if (shouldInsert()) {
                        children.splice(insertIndex === -1 ? 4 : insertIndex, 0, renderRow({}));
                    }
                })
            );
        }, !0);

        if (unpatchers.push(unpatchOverview), he && route) {
            // Create a unique settings key + route for Theme Browser
            const routeKey = `VENDETTA_THEME_${t.lodash.snakeCase(route.key).toUpperCase()}`;
            const PageComponent = route.page.render;

            const ScreenWrapper = t.React.memo(function({ navigation }) {
                const unsub = navigation.addListener("focus", function() {
                    unsub();
                    navigation.setOptions(A.without(route.page, "noErrorBoundary", "render"));
                });

                return t.React.createElement(
                    t.ReactNative.View,
                    { style: pe.container },
                    route.page.noErrorBoundary
                        ? t.React.createElement(PageComponent, null)
                        : t.React.createElement(N.ErrorBoundary, null, t.React.createElement(PageComponent, null))
                );
            });

            const ROUTE_CONFIGS = {
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

            // Helpers to thread our custom route into multiple settings surfaces
            const patchSectionList = function(list, isSearchable) {
                const copy = [...list];
                const sections = isSearchable ? copy?.[0]?.sections : copy;
                if (!Array.isArray(sections)) return sections;

                const bucket = "Vendetta";
                const vendettaSection = sections.find(B => B?.title === bucket || B?.label === bucket);
                if (vendettaSection && !vendettaSection?.settings?.includes(routeKey)) {
                    vendettaSection.settings.push(routeKey);
                }
                return copy;
            };

            const patchSearchAndConfigs = function() {
                const overview = s.findByProps("useOverviewSettings");
                const titles = s.findByProps("getSettingTitleConfig");
                const registry = s.findByProps("SETTING_RELATIONSHIPS", "SETTING_RENDERER_CONFIGS");
                const FN_SEARCH = "getSettingSearchListItems";
                const FN_LIST = "getSettingListItems";
                const searchMod = s.findByProps(FN_SEARCH) || s.findByProps(FN_LIST);
                const searchFnName = s.findByProps(FN_SEARCH) ? FN_SEARCH : FN_LIST;

                if (!searchMod || !overview) return !1;

                // Overview list bucket
                unpatchers.push(
                    w.after("useOverviewSettings", overview, function(args, ret) {
                        return patchSectionList(ret);
                    })
                );

                // Title config
                unpatchers.push(
                    w.after("getSettingTitleConfig", titles, function(_a, ret) {
                        return { ...ret, [routeKey]: route.title };
                    })
                );

                // Search result mapping
                unpatchers.push(
                    w.after(searchFnName, searchMod, function(args, ret) {
                        let [requested] = args;
                        return [
                            ...requested.includes(routeKey)
                                ? [{
                                      type: "setting_search_result",
                                      ancestorRendererData: ROUTE_CONFIGS[routeKey],
                                      setting: routeKey,
                                      title: () => route.title,
                                      breadcrumbs: ["Vendetta"],
                                      icon: ROUTE_CONFIGS[routeKey].icon
                                  }]
                                : [],
                            ...ret
                        ];
                    })
                );

                // Plug our route configs into the registry
                const oldRel = registry.SETTING_RELATIONSHIPS;
                const oldCfg = registry.SETTING_RENDERER_CONFIGS;

                registry.SETTING_RELATIONSHIPS = { ...oldRel, [routeKey]: null };
                registry.SETTING_RENDERER_CONFIGS = { ...oldCfg, ...ROUTE_CONFIGS };

                unpatchers.push(function() {
                    registry.SETTING_RELATIONSHIPS = oldRel;
                    registry.SETTING_RENDERER_CONFIGS = oldCfg;
                });

                return !0;
            };

            (function() {
                // Patch SearchableSettingsList path too
                const Searchable = s.findByProps("SearchableSettingsList");
                const SingleConfig = s.findByProps("SETTING_RENDERER_CONFIG");
                const listItems = s.findByProps("getSettingListItems");
                if (!listItems || !Searchable || !SingleConfig) return !1;

                unpatchers.push(
                    w.before("type", Searchable.SearchableSettingsList, P => patchSectionList(P, !0))
                );

                unpatchers.push(
                    w.after("getSettingListSearchResultItems", listItems, function(_args, results) {
                        for (const r of results) {
                            if (r.setting === routeKey) r.breadcrumbs = ["Vendetta"];
                        }
                    })
                );

                const old = SingleConfig.SETTING_RENDERER_CONFIG;
                SingleConfig.SETTING_RENDERER_CONFIG = { ...old, ...ROUTE_CONFIGS };
                unpatchers.push(() => { SingleConfig.SETTING_RENDERER_CONFIG = old; });

                return !0;
            })() || patchSearchAndConfigs();
        }

        return function() {
            return unpatchers.forEach(fn => fn());
        };
    }

    // ThemeStore for semantics
    const Se = s.findByStoreName("ThemeStore");
    s.findByProps("triggerHaptic");

    // Colors, typography
    const Y = s.findByProps("colors", "unsafe_rawColors");
    const Ee = Y?.internal ?? Y?.meta;
    const Ne = s.findByProps("TextStyleSheet").TextStyleSheet;
    const { View: Xe, Text: Z, Pressable: Qe } = N.General;

    // ActionSheet bits
    const Ie = s.findByProps("ActionSheet")?.ActionSheet ?? s.find(e => e.render?.name === "ActionSheet");
    const ve = s.findByProps("openLazy", "hideActionSheet");
    const { openLazy: Pe, hideActionSheet: Te } = ve;
    const { ActionSheetTitleHeader: we, ActionSheetCloseButton: Be, ActionSheetContentContainer: Ce } =
        s.findByProps("ActionSheetTitleHeader", "ActionSheetCloseButton", "ActionSheetContentContainer");

    // Search controls
    const K = s.findByProps("useSearchControls");
    const G = s.findByProps("useSettingSearchQuery");
    const Ae = s.findByName("SettingSearchBar");

    // WebView present (not used here directly)
    s.find(e => e?.WebView && !e.default).WebView;

    // Button/SegmentedControl exists
    s.findByProps("Button", "SegmentedControl");

    function be(semantic, theme = Se.theme) {
        return Ee.resolveSemanticColor(theme, semantic);
    }

    function _e(component, props) {
        try {
            Pe(new Promise(r => r({ default: component })), "ActionSheet", props);
        } catch (err) {
            D.logger.error(err.stack);
            y.showToast("Got error when opening ActionSheet! Please check debug logs", f.getAssetIDByName("Smal"));
        }
    }

    // Hook to wire advanced search control
    const W = function(ctx) {
        const q = G.useSettingSearchQuery();
        const controls = K.useSearchControls(ctx, !1, function() {});
        t.React.useEffect(function() {
            return function() {
                G.setSettingSearchQuery("");
                G.setIsSettingSearchActive(!1);
            };
        }, []);
        return [q, controls];
    };

    const De = Object.assign(function({ searchContext, controls }) {
        return t.React.createElement(
            t.ReactNative.ScrollView,
            { scrollEnabled: !1 },
            t.React.createElement(K.default, { searchContext, controls }, t.React.createElement(Ae, null))
        );
    }, { useAdvancedSearch: W });

    // Typography helpers
    var X;
    (function(e) {
        function Bold({ children, onPress }) {
            return t.React.createElement(b, { variant: "text-md/bold", onPress }, children);
        }
        e.Bold = Bold;

        function Underline({ children, onPress }) {
            return t.React.createElement(Z, { style: { textDecorationLine: "underline" }, onPress }, children);
        }
        e.Underline = Underline;
    })(X || (X = {}));

    function b(props) {
        let { variant, lineClamp, color, align, style, onPress, getChildren, children, liveUpdate } = props;
        const [_, rerender] = t.React.useReducer(o => ~o, 0);
        t.React.useEffect(function() {
            if (!liveUpdate) return;
            const nextSec = new Date().setMilliseconds(1000);
            let intervalId;
            const timeoutId = setTimeout(function() {
                rerender();
                intervalId = setInterval(rerender, 1000);
            }, nextSec - Date.now());
            return function() {
                clearTimeout(timeoutId);
                clearInterval(intervalId);
            };
        }, []);
        return t.React.createElement(
            Z,
            {
                style: [
                    variant ? Ne[variant] : {},
                    color ? { color: be(I.semanticColors[color]) } : {},
                    align ? { textAlign: align } : {},
                    style ?? {}
                ],
                numberOfLines: lineClamp,
                onPress
            },
            getChildren?.() ?? children
        );
    }

    // Simple icon button
    function O({ onPress, onLongPress, icon, style, destructive, color }) {
        const styles = t.stylesheet.createThemedStyleSheet({
            headerStyleIcon: {
                width: 24,
                height: 24,
                marginRight: 10,
                tintColor: I.semanticColors.HEADER_PRIMARY
            },
            cardStyleIcon: {
                width: 22,
                height: 22,
                marginLeft: 5,
                tintColor: I.semanticColors.INTERACTIVE_NORMAL
            },
            destructiveIcon: {
                tintColor: I.semanticColors.TEXT_DANGER
            }
        });

        return t.React.createElement(
            t.ReactNative.TouchableOpacity,
            { onPress, onLongPress },
            t.React.createElement(t.ReactNative.Image, {
                style: [
                    typeof style == "string" ? (style === "header" ? styles.headerStyleIcon : styles.cardStyleIcon) : style,
                    destructive && styles.destructiveIcon,
                    color && { tintColor: color }
                ].filter(Boolean),
                source: icon
            })
        );
    }

    // Cache of remote themes => hash
    let L = {};

    // Determine "new" entries since last check (no update check here)
    function detectNew() {
        return !Object.keys(L)[0] || !x.themeCache?.[0]
            ? []
            : Object.entries(L)
                  .map(([url, _hash]) => (x.themeCache?.includes(url) ? undefined : [url, "new"]))
                  .filter(Boolean);
    }

    function persistSeen() {
        x.themeCache = Object.keys(L);
    }

    async function fetchCatalog() {
        const json = await (await A.safeFetch(H, { cache: "no-store" })).json();
        // themes-full.json items: { name, description, authors[], link, vendetta:{icon}, hash }
        L = Object.fromEntries(json.map(n => [n.link, n.hash]));
    }

    function pollCatalog() {
        const id = setInterval(fetchCatalog, 6e5);
        fetchCatalog();
        return () => clearInterval(id);
    }

    // --------- Link Helpers ----------

    // If it's a raw.githubusercontent link, return nice github.com blob link
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
        } catch {
            return url;
        }
    }

    // --------- Theme actions ----------

    async function reinstallTheme(themeLink) {
        // "Update" action implemented as re-install of the theme
        await fe.installTheme(themeLink, !0);
    }

    // Storage emitter presence check (plugins & themes storages); used to guard functionality
    const M = Symbol.for("vendetta.storage.emitter");
    const $e = !!fe.themes[M];

    const { View: J } = N.General;
    const ee = t.stylesheet.createThemedStyleSheet({
        main: { marginRight: 16, flexGrow: 0 },
        content: {
            backgroundColor: I.semanticColors.REDESIGN_BUTTON_PRIMARY_BACKGROUND,
            borderRadius: 16,
            marginLeft: 8,
            paddingHorizontal: 8
        }
    });

    function te({ text, marginLeft }) {
        return React.createElement(
            J,
            { style: [ee.main, marginLeft ? { marginLeft: 16, marginRight: 0 } : {}] },
            React.createElement(
                J,
                { style: ee.content },
                React.createElement(b, { variant: "eyebrow", color: "TEXT_NORMAL" }, text)
            )
        );
    }

    // User fetcher (for author chips)
    const { showUserProfile: ne } = s.findByProps("showUserProfile");
    const { fetchProfile: re } = s.findByProps("fetchProfile");
    const F = s.findByStoreName("UserStore");

    function Me({ userId, color, loadUsername, children }) {
        const [name, setName] = t.React.useState(null);
        t.React.useEffect(function() {
            if (name || !loadUsername) return;
            if (F.getUser(userId)) {
                setName(F.getUser(userId).username);
            } else {
                re(userId).then(u => setName(u.user.username));
            }
        }, [loadUsername]);
        return t.React.createElement(
            b,
            {
                variant: "text-md/bold",
                color: color ?? "TEXT_NORMAL",
                onPress: function() {
                    return F.getUser(userId)
                        ? ne({ userId })
                        : re(userId).then(() => ne({ userId }));
                }
            },
            loadUsername ? `@${name ?? "..."}` : children
        );
    }

    // Observe installed state of a theme by link
    function useThemeInstalled(link) {
        const [installed, setInstalled] = t.React.useState(!!fe.themes[link]);
        const emitter = fe.themes[M];
        const refresh = () => setInstalled(!!fe.themes[link]);

        t.React.useEffect(function() {
            setInstalled(!!fe.themes[link]);
            emitter.on("SET", refresh);
            emitter.on("DEL", refresh);
            return () => {
                emitter.off("SET", refresh);
                emitter.off("DEL", refresh);
            };
        });
        return installed;
    }

    // Generic card
    const { FormRow: U } = N.Forms;
    const k = t.stylesheet.createThemedStyleSheet({
        card: { backgroundColor: I.semanticColors.BACKGROUND_SECONDARY, borderRadius: 5 },
        header: {
            padding: 0,
            backgroundColor: I.semanticColors.BACKGROUND_TERTIARY,
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5
        },
        actions: { flexDirection: "row-reverse", alignItems: "center" }
    });

    function Ue(props) {
        return t.React.createElement(
            t.ReactNative.View,
            { style: [k.card, { marginBottom: 10 }] },
            t.React.createElement(U, {
                style: k.header,
                label: props.headerLabel,
                leading: props.headerIcon && t.React.createElement(U.Icon, { source: props.headerIcon })
            }),
            t.React.createElement(U, {
                label: props.descriptionLabel,
                trailing: t.React.createElement(
                    t.ReactNative.View,
                    { style: k.actions },
                    props.actions?.map(({ icon, onPress, onLongPress, destructive }) =>
                        t.React.createElement(O, {
                            icon,
                            onPress,
                            onLongPress,
                            style: "card",
                            destructive: destructive ?? !1
                        })
                    ),
                    props.loading &&
                        t.React.createElement(t.ReactNative.ActivityIndicator, {
                            size: "small",
                            style: { height: 22, width: 22 }
                        })
                )
            })
        );
    }

    const { View: ke } = N.General;

    // Individual Theme row
    function Ve({ item, changes }) {
        // item: { name, description, authors[], link, vendetta.icon, hash }
        const themeUrl = item.link;
        const [busy, setBusy] = t.React.useState(!1);
        const isInstalled = useThemeInstalled(themeUrl);

        // "New" badge on fresh entries (since last fetch)
        const mark = changes.find(R => R[0] === themeUrl);
        const githubLink = toGithubBlob(themeUrl);

        const actionIcons = [];

        if (githubLink) {
            actionIcons.push({
                icon: f.getAssetIDByName("img_account_sync_github_white"),
                onPress: () => t.url.openURL(githubLink),
                onLongPress: function() {
                    t.clipboard.setString(githubLink);
                    y.showToast("Copied GitHub link", f.getAssetIDByName("toast_copy_link"));
                }
            });
        }

        const actions = busy
            ? []
            : isInstalled
            ? [
                  {
                      icon: f.getAssetIDByName("ic_sync_24px"),
                      onPress: function() {
                          setBusy(!0);
                          reinstallTheme(themeUrl)
                              .then(() => y.showToast(`Successfully updated ${item.name}`, f.getAssetIDByName("ic_sync_24px")))
                              .catch(() => y.showToast(`Failed to update ${item.name}!`, f.getAssetIDByName("Small")))
                              .finally(() => setBusy(!1));
                      }
                  },
                  {
                      icon: f.getAssetIDByName("ic_message_delete"),
                      destructive: !0,
                      onPress: async function() {
                          setBusy(!0);
                          try {
                              fe.removeTheme(themeUrl);
                              y.showToast(`Successfully deleted ${item.name}`, f.getAssetIDByName("ic_message_delete"));
                          } catch {
                              y.showToast(`Failed to delete ${item.name}!`, f.getAssetIDByName("Small"));
                          }
                          setBusy(!1);
                      },
                      onLongPress: function() {
                          t.clipboard.setString(themeUrl);
                          y.showToast("Copied theme URL", f.getAssetIDByName("toast_copy_link"));
                      }
                  },
                  ...actionIcons
              ]
            : [
                  {
                      icon: f.getAssetIDByName("ic_download_24px"),
                      onPress: async function() {
                          setBusy(!0);
                          fe.installTheme(themeUrl, !0)
                              .then(() => y.showToast(`Successfully installed ${item.name}`, f.getAssetIDByName("toast_image_saved")))
                              .catch(err =>
                                  y.showToast(err?.message ?? `Failed to install ${item.name}!`, f.getAssetIDByName("Small"))
                              )
                              .finally(() => setBusy(!1));
                      },
                      onLongPress: function() {
                          t.clipboard.setString(themeUrl);
                          y.showToast("Copied theme URL", f.getAssetIDByName("toast_copy_link"));
                      }
                  },
                  ...actionIcons
              ];

        return t.React.createElement(Ue, {
            headerLabel: t.React.createElement(
                ke,
                { style: { flexDirection: "row" } },
                mark && t.React.createElement(te, { text: "New" }),
                t.React.createElement(b, { variant: "text-md/semibold", color: "HEADER_PRIMARY" }, item.name, item.authors?.[0] && " by ",
                    ...(item.authors ?? []).map((R, idx, arr) =>
                        t.React.createElement(t.React.Fragment, null,
                            t.React.createElement(Me, { userId: R.id, color: "TEXT_LINK" }, R.name),
                            idx !== arr.length - 1 && ", "
                        )
                    )
                )
            ),
            headerIcon: f.getAssetIDByName(item.vendetta?.icon ?? "ic_theme_24px"),
            descriptionLabel: item.description,
            actions,
            loading: busy
        });
    }

    // Radio sheet
    const { FormRadioRow: He } = N.Forms;
    function je({ label, value, choices, update }) {
        const [selected, setSelected] = t.React.useState(value);
        update(selected);
        return t.React.createElement(
            Ie,
            null,
            t.React.createElement(
                Ce,
                null,
                t.React.createElement(we, { title: label, trailing: t.React.createElement(Be, { onPress: () => Te() }) }),
                choices.map(choice =>
                    t.React.createElement(He, {
                        label: choice,
                        onPress: () => setSelected(choice),
                        selected: selected === choice
                    })
                )
            )
        );
    }

    const { View: ie } = N.General;

    // Sort options
    var v;
    (function(e) {
        e.DateNewest = "Creation date (new to old)";
        e.DateOldest = "Creation date (old to new)";
        e.NameAZ = "Name (A-Z)";
        e.NameZA = "Name (Z-A)";
    })(v || (v = {}));

    let ae, se; // header actions (refresh/filter)

    function ce() {
        const nav = t.NavigationNative.useNavigation();

        if (!$e) {
            de.showConfirmationAlert({
                title: "Can't use",
                content: "You must reinstall Vendetta first in order for Theme Browser to function properly",
                confirmText: "Dismiss",
                confirmColor: "brand",
                onConfirm: function() {},
                isDismissable: !0
            });
            nav.goBack();
            return null;
        }

        const searchContext = { type: "THEME_BROWSER_SEARCH" };
        const [query, controls] = W(searchContext);

        const changesRef = t.React.useRef(detectNew()).current;

        const [sortBy, setSortBy] = t.React.useState(v.DateNewest);
        const [catalog, setCatalog] = t.React.useState(null);
        const setSortRef = t.React.useRef(setSortBy);
        setSortRef.current = setSortBy;

        const filtered = t.React.useMemo(function() {
            if (!catalog) return;
            const q = (query ?? "").toLowerCase();

            let arr = catalog.filter(o =>
                o.name?.toLowerCase().includes(q) ||
                (o.authors ?? []).some(a => a.name?.toLowerCase().includes(q)) ||
                o.description?.toLowerCase().includes(q)
            ).slice();

            if ([v.NameAZ, v.NameZA].includes(sortBy)) {
                arr.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
            }
            if ([v.NameZA, v.DateNewest].includes(sortBy)) arr.reverse();
            return arr;
        }, [sortBy, catalog, query]);

        // Persist seen list once per screen mount
        t.React.useEffect(persistSeen, []);

        // Fetch once (or on pull-to-refresh via header)
        t.React.useEffect(function() {
            if (catalog) return;
            A.safeFetch(H, { cache: "no-store" })
                .then(res =>
                    res.json().then(json => setCatalog(json)).catch(() =>
                        y.showToast("Failed to parse themes", f.getAssetIDByName("Small"))
                    )
                )
                .catch(() => y.showToast("Failed to fetch themes", f.getAssetIDByName("Small")));
        }, [catalog]);

        ae = function() {
            if (catalog) setCatalog(null);
        };

        se = function() {
            if (!catalog) return;
            _e(je, {
                label: "Filter",
                value: sortBy,
                choices: Object.values(v),
                update: function(val) {
                    setSortRef.current(val);
                }
            });
        };

        nav.addListener("focus", function() {
            nav.setOptions({
                title: "Theme Browser",
                headerRight: function() {
                    return t.React.createElement(
                        ie,
                        { style: { flexDirection: "row-reverse" } },
                        t.React.createElement(O, {
                            onPress: () => ae?.(),
                            icon: f.getAssetIDByName("ic_sync_24px"),
                            style: "header"
                        }),
                        t.React.createElement(O, {
                            onPress: () => se?.(),
                            icon: f.getAssetIDByName("ic_filter"),
                            style: "header"
                        })
                    );
                }
            });
        });

        return catalog
            ? t.React.createElement(t.ReactNative.FlatList, {
                  ListHeaderComponent: t.React.createElement(
                      ie,
                      { style: { marginBottom: 10 } },
                      t.React.createElement(De, { searchContext, controls })
                  ),
                  style: { paddingHorizontal: 10 },
                  contentContainerStyle: { paddingBottom: 20 },
                  data: filtered,
                  renderItem: function({ item }) {
                      return t.React.createElement(Ve, {
                          item,
                          changes: changesRef
                      });
                  },
                  removeClippedSubviews: !0
              })
            : t.React.createElement(t.ReactNative.ActivityIndicator, { size: "large", style: { flex: 1 } });
    }

    const { FormRow: V } = N.Forms;

    function ze({ changes }) {
        const nav = t.NavigationNative.useNavigation();
        return React.createElement(
            N.ErrorBoundary,
            null,
            React.createElement(V, {
                label: React.createElement(
                    b,
                    { variant: "text-md/semibold", color: "HEADER_PRIMARY" },
                    "Theme Browser",
                    changes
                        ? React.createElement(te, { text: changes.toString(), marginLeft: !0 })
                        : React.createElement(React.Fragment, null)
                ),
                leading: React.createElement(V.Icon, { source: f.getAssetIDByName("ic_theme_24px") }),
                trailing: V.Arrow,
                onPress: function() {
                    return nav.push("VendettaCustomPage", { render: ce });
                }
            })
        );
    }

    function Ye() {
        const cleanups = [];

        // Insert Theme Browser row into settings
        cleanups.push(
            ye(
                () => !0,
                () => React.createElement(ze, {
                    changes: detectNew().filter(n => n[1] === "new").length
                }),
                {
                    key: D.plugin.manifest.name,
                    icon: f.getAssetIDByName("ic_theme_24px"),
                    get title() {
                        const n = detectNew().filter(r => r[1] === "new").length;
                        return `Theme Browser${n ? ` (+${n})` : ""}`;
                    },
                    page: { render: ce }
                }
            )
        );

        // Start catalog polling
        cleanups.push(pollCatalog());

        return function() {
            return cleanups.forEach(n => n());
        };
    }

    // --------------- Constants & Exports ---------------

    // Your custom themes catalog:
    const H = "https://troyydev.github.io/Playfab-pal/theme/themes-full.json";

    // Persistance storage
    const x = le.storage;

    let onUnloadFn;

    var Plugin = {
        onLoad: function() {
            onUnloadFn = Ye();
        },
        onUnload: function() {
            onUnloadFn?.();
        }
    };

    C.default = Plugin;
    C.themesURL = H;
    C.vstorage = x;
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
