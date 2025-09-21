(function(C,le,D,f,s,t,w,I,N,A,de,y,S,fe){"use strict";
const{FormSection:ge}=N.Forms,he=s.findByName("getScreens"),Re=s.findByName("UserSettingsOverviewWrapper",!1),pe=t.stylesheet.createThemedStyleSheet({container:{flex:1,backgroundColor:I.semanticColors.BACKGROUND_MOBILE_PRIMARY}});
function ye(e,n,r){
  const i=[],c=w.after("default",Re,function(a,g){
    c();
    const u=A.findInReactTree(g.props.children,function(h){return h.type&&h.type.name==="UserSettingsOverview"});
    i.push(w.after("render",u.type.prototype,function(h,p){
      let{props:{children:R}}=p;
      const l=[t.i18n.Messages.BILLING_SETTINGS,t.i18n.Messages.PREMIUM_SETTINGS];
      R=A.findInReactTree(R,function(d){return d.children[1].type===ge}).children;
      const o=R.findIndex(function(d){return l.includes(d?.props.label)});
      e()&&R.splice(o===-1?4:o,0,n({}))
    }))
  },!0);
  if(i.push(c),he&&r){
    const a=`VENDETTA_THEME_${t.lodash.snakeCase(r.key).toUpperCase()}`,g=r.page.render,
    u=t.React.memo(function(l){let{navigation:o}=l;const d=o.addListener("focus",function(){d(),o.setOptions(A.without(r.page,"noErrorBoundary","render"))});
      return t.React.createElement(t.ReactNative.View,{style:pe.container},r.page.noErrorBoundary?t.React.createElement(g,null):t.React.createElement(N.ErrorBoundary,null,t.React.createElement(g,null)))
    }),
    h={[a]:{type:"route",title:function(){return r.title},icon:r.icon,parent:null,screen:{route:`VendettaTheme${t.lodash.chain(r.key).camelCase().upperFirst().value()}`,getComponent:function(){return u}}}},
    p=function(l,o){const d=[...l],E=o?d?.[0]?.sections:d;if(!Array.isArray(E))return E;const P="Vendetta",T=E.find(function(B){return B?.title===P||B?.label===P});return T&&!T?.settings?.includes(a)&&T.settings.push(a),d},
    R=function(){
      const l=s.findByProps("useOverviewSettings"),o=s.findByProps("getSettingTitleConfig"),d=s.findByProps("SETTING_RELATIONSHIPS","SETTING_RENDERER_CONFIGS"),E="getSettingSearchListItems",P="getSettingListItems",T=s.findByProps(E),B=T?E:P,ue=T??s.findByProps(P);
      if(!ue||!l)return!1;
      i.push(w.after("useOverviewSettings",l,function(z,_){return p(_)})),
      i.push(w.after("getSettingTitleConfig",o,function(z,_){return{..._,[a]:r.title}})),
      i.push(w.after(B,ue,function(z,_){let[We]=z;return[...We.includes(a)?[{type:"setting_search_result",ancestorRendererData:h[a],setting:a,title:function(){return r.title},breadcrumbs:["Vendetta"],icon:h[a].icon}]:[],..._]}));
      const j=d.SETTING_RELATIONSHIPS,Ke=d.SETTING_RENDERER_CONFIGS;
      d.SETTING_RELATIONSHIPS={...j,[a]:null},d.SETTING_RENDERER_CONFIGS={...Ke,...h},i.push(function(){d.SETTING_RELATIONSHIPS=j,d.SETTING_RENDERER_CONFIGS=j});
      return!0
    };
    (function(){
      const l=s.findByProps("SearchableSettingsList"),o=s.findByProps("SETTING_RENDERER_CONFIG"),d=s.findByProps("getSettingListItems");
      if(!d||!l||!o)return!1;
      i.push(w.before("type",l.SearchableSettingsList,function(P){return p(P,!0)})),
      i.push(w.after("getSettingListSearchResultItems",d,function(P,T){for(const B of T)B.setting===a&&(B.breadcrumbs=["Vendetta"])}));
      const E=o.SETTING_RENDERER_CONFIG;return o.SETTING_RENDERER_CONFIG={...E,...h},i.push(function(){o.SETTING_RENDERER_CONFIG=E}),!0
    })()||R()
  }
  return function(){return i.forEach(function(a){return a()})}
}
const Se=s.findByStoreName("ThemeStore");s.findByProps("triggerHaptic");
const Y=s.findByProps("colors","unsafe_rawColors"),Ee=Y?.internal??Y?.meta,Ne=s.findByProps("TextStyleSheet").TextStyleSheet,{View:Xe,Text:Z,Pressable:Qe}=N.General;
s.findByProps("TableRow");
const Ie=s.findByProps("ActionSheet")?.ActionSheet??s.find(function(e){return e.render?.name==="ActionSheet"}),ve=s.findByProps("openLazy","hideActionSheet"),{openLazy:Pe,hideActionSheet:Te}=ve,{ActionSheetTitleHeader:we,ActionSheetCloseButton:Be,ActionSheetContentContainer:Ce}=s.findByProps("ActionSheetTitleHeader","ActionSheetCloseButton","ActionSheetContentContainer");
s.findByProps("ActionSheetRow")?.ActionSheetRow,s.findByName("Navigator")??s.findByProps("Navigator")?.Navigator,s.findByProps("getRenderCloseButton")?.getRenderCloseButton??s.findByProps("getHeaderCloseButton")?.getHeaderCloseButton,s.findByProps("popModal","pushModal");
const K=s.findByProps("useSearchControls"),G=s.findByProps("useSettingSearchQuery"),Ae=s.findByName("SettingSearchBar");s.findByProps("SvgXml"),s.findByProps("useInMainTabsExperiment","isInMainTabsExperiment"),s.find(function(e){return e?.WebView&&!e.default}).WebView,s.findByProps("Button","SegmentedControl");
function be(e){let n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:Se.theme;return Ee.resolveSemanticColor(n,e)}
function _e(e,n){try{Pe(new Promise(function(r){return r({default:e})}),"ActionSheet",n)}catch(r){D.logger.error(r.stack),y.showToast("Got error when opening ActionSheet! Please check debug logs",f.getAssetIDByName("Smal"))}}
const W=function(e){const n=G.useSettingSearchQuery(),r=K.useSearchControls(e,!1,function(){});return t.React.useEffect(function(){return function(){G.setSettingSearchQuery(""),G.setIsSettingSearchActive(!1)}},[]),[n,r]},
De=Object.assign(function(e){let{searchContext:n,controls:r}=e;return t.React.createElement(t.ReactNative.ScrollView,{scrollEnabled:!1},t.React.createElement(K.default,{searchContext:n,controls:r},t.React.createElement(Ae,null)))},{useAdvancedSearch:W});
window.nativeModuleProxy.DCDFileManager??window.nativeModuleProxy.RTNFileManager,window.nativeModuleProxy.BundleUpdaterManager,window.nativeModuleProxy.MMKVManager,window.nativeModuleProxy.DCDSoundManager;
var X;(function(e){function n(i){let{children:c,onPress:a}=i;return t.React.createElement(b,{variant:"text-md/bold",onPress:a},c)}e.Bold=n;function r(i){let{children:c,onPress:a}=i;return t.React.createElement(Z,{style:{textDecorationLine:"underline"},onPress:a},c)}e.Underline=r})(X||(X={}));
function b(e){let{variant:n,lineClamp:r,color:i,align:c,style:a,onPress:g,getChildren:u,children:h,liveUpdate:p}=e;const[R,l]=t.React.useReducer(function(o){return~o},0);
return t.React.useEffect(function(){if(!p)return;const o=new Date().setMilliseconds(1e3);let d;const E=setTimeout(function(){l(),d=setInterval(l,1e3)},o-Date.now());return function(){clearTimeout(E),clearInterval(d)}},[]),
t.React.createElement(Z,{style:[n?Ne[n]:{},i?{color:be(I.semanticColors[i])}:{},c?{textAlign:c}:{},a??{}],numberOfLines:r,onPress:g},u?.()??h)}
function O(e){let{onPress:n,onLongPress:r,icon:i,style:c,destructive:a,color:g}=e;const u=t.stylesheet.createThemedStyleSheet({headerStyleIcon:{width:24,height:24,marginRight:10,tintColor:I.semanticColors.HEADER_PRIMARY},cardStyleIcon:{width:22,height:22,marginLeft:5,tintColor:I.semanticColors.INTERACTIVE_NORMAL},destructiveIcon:{tintColor:I.semanticColors.TEXT_DANGER}});return t.React.createElement(t.ReactNative.TouchableOpacity,{onPress:n,onLongPress:r},t.React.createElement(t.ReactNative.Image,{style:[typeof c=="string"?c==="header"?u.headerStyleIcon:u.cardStyleIcon:c,a&&u.destructiveIcon,g&&{tintColor:g}].filter(function(h){return!!h}),source:i}))}
let L={};
function $(){return!Object.keys(L)[0]||!x.pluginCache?.[0]?[]:Object.entries(L).map(function(e){let[n,r]=e;return x.pluginCache?.includes(n)?D.plugins.plugins[n]&&D.plugins.plugins[n].manifest.hash!==r?[n,"update"]:void 0:[n,"new"]}).filter(function(e){return!!e})}
function Le(){x.pluginCache=Object.keys(L)}
async function Q(){
  const e=await(await A.safeFetch(H,{cache:"no-store"})).json();
  // themes list: [{ name, description, authors[], link, vendetta{icon}, hash }]
  L=Object.fromEntries(e.map(function(n){ return [ n.link , n.hash ] }))
}
function me(){const e=setInterval(Q,6e5);return Q(),function(){return clearInterval(e)}}
function xe(e){return e.endsWith("/")?e:e+"/"}
const m={origin:/^([^/]+)\/(.*)/,multiplePluginGitio:/^(.*?)(?=\.)\.github\.io\/(.*?)(?=\/)\/(.*)/,singlePluginGitio:/^(.*?)(?=\.)\.github\.io\/(.*)/,githubReleases:/^github\.com\/(.*?)(?=\/)\/(.*?)(?=\/)\/releases/},
q={"vendetta.nexpid.xyz":function(e){return`https://github.com/nexpid/VendettaPlugins/tree/master/plugins/${e.join("/")}`},"vendetta.sdh.gay":function(e){return`https://github.com/sdhhhhh/vd-repo/tree/master/plugins/${e.join("/")}`},"plugins.obamabot.me":function(e){return`https://github.com/WolfPlugs/${e[0]}/tree/master/${e.slice(1).join("/")}`},"mugman.catvibers.me":function(e){return`https://github.com/mugman174/${e[0]}/tree/master/plugins/${e.slice(1).join("/")}`}};
function Ge(e){
  const n=e.match(m.multiplePluginGitio);if(n?.[0])return`https://github.com/${n[1]}/${n[2]}/tree/master/plugins/${n[3]}`;
  const r=e.match(m.singlePluginGitio)??e.match(m.githubReleases);if(r?.[0])return`https://github.com/${r[1]}/${r[2]}`;
  const[i,c,a]=e.match(m.origin);if(q[c])return q[c](a.split("/"))
}
async function Oe(e){const n=e.enabled;for(let r=0;r<2;r++)n&&S.stopPlugin(e.id,!1),await S.fetchPlugin(e.id),n&&await S.startPlugin(e.id)}
const M=Symbol.for("vendetta.storage.emitter"),$e=!!S.plugins[M]&&!!fe.themes[M],{View:J}=N.General,ee=t.stylesheet.createThemedStyleSheet({main:{marginRight:16,flexGrow:0},content:{backgroundColor:I.semanticColors.REDESIGN_BUTTON_PRIMARY_BACKGROUND,borderRadius:16,marginLeft:8,paddingHorizontal:8}});
function te(e){let{text:n,marginLeft:r}=e;return React.createElement(J,{style:[ee.main,r?{marginLeft:16,marginRight:0}:{}]},React.createElement(J,{style:ee.content},React.createElement(b,{variant:"eyebrow",color:"TEXT_NORMAL"},n)))}
const{showUserProfile:ne}=s.findByProps("showUserProfile"),{fetchProfile:re}=s.findByProps("fetchProfile"),F=s.findByStoreName("UserStore");
function Me(e){let{userId:n,color:r,loadUsername:i,children:c}=e;const[a,g]=t.React.useState(null);return t.React.useEffect(function(){return!a&&i&&(F.getUser(n)?g(F.getUser(n).username):re(n).then(function(u){return g(u.user.username)}))},[i]),t.React.createElement(b,{variant:"text-md/bold",color:r??"TEXT_NORMAL",onPress:function(){return F.getUser(n)?ne({userId:n}):re(n).then(function(){return ne({userId:n})})}},i?`@${a??"..."}`:c)}
function Fe(e){const[n,r]=t.React.useState(!!S.plugins[e]),i=S.plugins[M],c=function(){return r(!!S.plugins[e])};return t.React.useEffect(function(){return r(!!S.plugins[e]),i.on("SET",c),i.on("DEL",c),function(){i.off("SET",c),i.off("DEL",c)}}),n}
const{FormRow:U}=N.Forms,k=t.stylesheet.createThemedStyleSheet({card:{backgroundColor:I.semanticColors.BACKGROUND_SECONDARY,borderRadius:5},header:{padding:0,backgroundColor:I.semanticColors.BACKGROUND_TERTIARY,borderTopLeftRadius:5,borderTopRightRadius:5},actions:{flexDirection:"row-reverse",alignItems:"center"}});
function Ue(e){return t.React.createElement(t.ReactNative.View,{style:[k.card,{marginBottom:10}]},t.React.createElement(U,{style:k.header,label:e.headerLabel,leading:e.headerIcon&&t.React.createElement(U.Icon,{source:e.headerIcon})}),t.React.createElement(U,{label:e.descriptionLabel,trailing:t.React.createElement(t.ReactNative.View,{style:k.actions},e.actions?.map(function(n){let{icon:r,onPress:i,onLongPress:c,destructive:a}=n;return t.React.createElement(O,{icon:r,onPress:i,onLongPress:c,style:"card",destructive:a??!1})}),e.loading&&t.React.createElement(t.ReactNative.ActivityIndicator,{size:"small",style:{height:22,width:22}}))}))}
const{View:ke}=N.General;
function Ve(e){
  let{item:n,changes:r}=e;
  // INSTALL URL = theme link (already proxied if you want)
  const i=n.link,
  [c,a]=t.React.useState(!1),
  g=Fe(i),
  u=r.find(function(R){return R[0]===i}),
  // Try to infer repo page from link host (strip protocol for Ge())
  h=Ge(n.link.replace(/^https?:\/\//,"")),
  p=[];
  h&&p.push({icon:f.getAssetIDByName("img_account_sync_github_white"),onPress:function(){return t.url.openURL(h)},onLongPress:function(){t.clipboard.setString(h),y.showToast("Copied GitHub link",f.getAssetIDByName("toast_copy_link"))}});
  return t.React.createElement(Ue,{headerLabel:t.React.createElement(ke,{style:{flexDirection:"row"}},u&&t.React.createElement(te,{text:u[1]==="new"?"New":"Upd"}),t.React.createElement(b,{variant:"text-md/semibold",color:"HEADER_PRIMARY"},n.name,n.authors[0]&&" by ",...n.authors.map(function(R,l,o){return t.React.createElement(t.React.Fragment,null,t.React.createElement(Me,{userId:R.id,color:"TEXT_LINK"},R.name),l!==o.length-1&&", ")}))),headerIcon:f.getAssetIDByName(n.vendetta?.icon??"ic_theme_24px"),descriptionLabel:n.description,actions:c?[]:g?[S.plugins[i]?.manifest.hash!==n.hash&&{icon:f.getAssetIDByName("ic_sync_24px"),onPress:function(){a(!0),Oe({id:i,enabled:!0}).then(function(){return y.showToast(`Successfully updated ${n.name}`,f.getAssetIDByName("ic_sync_24px"))}).catch(function(){return y.showToast(`Failed to update ${n.name}!`,f.getAssetIDByName("Small"))}).finally(function(){return a(!1)})}},{icon:f.getAssetIDByName("ic_message_delete"),destructive:!0,onPress:async function(){a(!0);try{S.removePlugin(i),y.showToast(`Successfully deleted ${n.name}`,f.getAssetIDByName("ic_message_delete"))}catch{y.showToast(`Failed to delete ${n.name}!`,f.getAssetIDByName("Small"))}a(!1)},onLongPress:function(){t.clipboard.setString(n.link),y.showToast("Copied theme link",f.getAssetIDByName("toast_copy_link"))}},...p].filter(function(R){return!!R}):[{icon:f.getAssetIDByName("ic_download_24px"),onPress:async function(){a(!0),S.installPlugin(i,!0).then(function(){y.showToast(`Successfully installed ${n.name}`,f.getAssetIDByName("toast_image_saved"))}).catch(function(R){return y.showToast(R?.message??`Failed to install ${n.name}!`,f.getAssetIDByName("Small"))}).finally(function(){return a(!1)})},onLongPress:function(){t.clipboard.setString(n.link),y.showToast("Copied theme link",f.getAssetIDByName("toast_copy_link"))}},...p],loading:c})
}
const{FormRadioRow:He}=N.Forms;
function je(e){let{label:n,value:r,choices:i,update:c}=e;const[a,g]=t.React.useState(r);return c(a),t.React.createElement(Ie,null,t.React.createElement(Ce,null,t.React.createElement(we,{title:n,trailing:t.React.createElement(Be,{onPress:function(){return Te()}})}),i.map(function(u){return t.React.createElement(He,{label:u,onPress:function(){return g(u)},selected:a===u})})))}
const{View:ie}=N.General;
var v;(function(e){e.DateNewest="Creation date (new to old)",e.DateOldest="Creation date (old to new)",e.NameAZ="Name (A-Z)",e.NameZA="Name (Z-A)"})(v||(v={}));
let ae,se;
function ce(){
  const e=t.NavigationNative.useNavigation();
  if(!$e)return de.showConfirmationAlert({title:"Can't use",content:"You must reinstall Vendetta first in order for Theme Browser to function properly",confirmText:"Dismiss",confirmColor:"brand",onConfirm:function(){},isDismissable:!0}),e.goBack(),null;
  const n={type:"THEME_BROWSER_SEARCH"},[r,i]=W(n),c=t.React.useRef($()).current,[a,g]=t.React.useState(v.DateNewest),[u,h]=t.React.useState(null),p=t.React.useRef(g);p.current=g;
  const R=t.React.useMemo(function(){if(!u)return;let l=u.filter(function(o){return o.name?.toLowerCase().includes(r)||o.authors?.some(function(d){return d.name?.toLowerCase().includes(r)})||o.description?.toLowerCase().includes(r)}).slice();return[v.NameAZ,v.NameZA].includes(a)&&(l=l.sort(function(o,d){return o.name<d.name?-1:o.name>d.name?1:0})),[v.NameZA,v.DateNewest].includes(a)&&l.reverse(),l},[a,u,r]);
  return t.React.useEffect(Le,[]),t.React.useEffect(function(){u||A.safeFetch(H,{cache:"no-store"}).then(function(l){return l.json().then(function(o){return h(o)}).catch(function(){return y.showToast("Failed to parse themes",f.getAssetIDByName("Small"))})}).catch(function(){return y.showToast("Failed to fetch themes",f.getAssetIDByName("Small"))})},[u]),
  ae=function(){return u&&h(null)},
  se=function(){return u&&_e(je,{label:"Filter",value:a,choices:Object.values(v),update:function(l){return p.current(l)}})},
  e.addListener("focus",function(){e.setOptions({title:"Theme Browser",headerRight:function(){return t.React.createElement(ie,{style:{flexDirection:"row-reverse"}},t.React.createElement(O,{onPress:function(){return ae?.()},icon:f.getAssetIDByName("ic_sync_24px"),style:"header"}),t.React.createElement(O,{onPress:function(){return se?.()},icon:f.getAssetIDByName("ic_filter"),style:"header"}))}})}),
  u?t.React.createElement(t.ReactNative.FlatList,{ListHeaderComponent:t.React.createElement(ie,{style:{marginBottom:10}},t.React.createElement(De,{searchContext:n,controls:i})),style:{paddingHorizontal:10},contentContainerStyle:{paddingBottom:20},data:R,renderItem:function(l){let{item:o}=l;return t.React.createElement(Ve,{item:o,changes:c})},removeClippedSubviews:!0}):t.React.createElement(t.ReactNative.ActivityIndicator,{size:"large",style:{flex:1}})
}
const{FormRow:V}=N.Forms;
function ze(e){let{changes:n}=e;const r=t.NavigationNative.useNavigation();return React.createElement(N.ErrorBoundary,null,React.createElement(V,{label:React.createElement(b,{variant:"text-md/semibold",color:"HEADER_PRIMARY"},"Theme Browser",n?React.createElement(te,{text:n.toString(),marginLeft:!0}):React.createElement(React.Fragment,null)),leading:React.createElement(V.Icon,{source:f.getAssetIDByName("ic_theme_24px")}),trailing:V.Arrow,onPress:function(){return r.push("VendettaCustomPage",{render:ce})}}))}
function Ye(){
  const e=[];
  return e.push(ye(function(){return!0},function(){return React.createElement(ze,{changes:$().filter(function(n){return n[1]==="new"}).length})},{key:D.plugin.manifest.name,icon:f.getAssetIDByName("ic_theme_24px"),get title(){const n=$().filter(function(r){return r[1]==="new"}).length;return`Theme Browser${n?` (+${n})`:""}`},page:{render:ce}})),e.push(me()),function(){return e.forEach(function(n){return n()})}
}
const H="https://troyydev.github.io/Playfab-pal/theme/themes-full.json",x=le.storage;let oe;
var Ze={onLoad:function(){return oe=Ye()},onUnload:function(){return oe?.()}};
return C.default=Ze,C.pluginsURL=H,C.vstorage=x,Object.defineProperty(C,"__esModule",{value:!0}),C
})({},vendetta.plugin,vendetta,vendetta.ui.assets,vendetta.metro,vendetta.metro.common,vendetta.patcher,vendetta.ui,vendetta.ui.components,vendetta.utils,vendetta.ui.alerts,vendetta.ui.toasts,vendetta.plugins,vendetta.themes);
