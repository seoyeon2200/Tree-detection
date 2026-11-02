/* common.js — 공통 UI */

(function () {
    "use strict";

    var MOBILE_MQ = "(max-width: 1000px)";

    function isMobileNav() {
        return window.matchMedia(MOBILE_MQ).matches;
    }

    function getApp() {
        return document.querySelector(".l-app");
    }

    function setMobileNavOpen(open) {
        var app = getApp();
        if (!app) return;

        app.classList.toggle("is-mobile-nav-open", open);

        var dim = document.querySelector(".l-sidebar-dim");
        if (dim) {
            if (open) dim.removeAttribute("hidden");
            else dim.setAttribute("hidden", "");
        }

        document.querySelectorAll("[data-mobile-nav-toggle]").forEach(function (el) {
            el.setAttribute("aria-expanded", open ? "true" : "false");
            el.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
        });
    }

    /* ----- 우측 사이드 패널 ----- */
    var PANEL_META = {
        manage: { title: "수목관리 현황", icon: "manage" },
        alert: { title: "위험예측 현황", icon: "alert" },
        report: { title: "분석 레포트", icon: "report" }
    };

    var currentPanel = null;

    function setSidemenuActive(key) {
        document.querySelectorAll("[data-sidemenu]").forEach(function (el) {
            var on = key && el.getAttribute("data-sidemenu") === key;
            el.classList.toggle("is-active", on);
            el.setAttribute("aria-pressed", on ? "true" : "false");
        });
    }

    function updatePanelHeader(key) {
        var meta = PANEL_META[key];
        if (!meta) return;

        var titleEl = document.querySelector("[data-panel-title]");
        var iconEl = document.querySelector("[data-panel-icon]");

        if (titleEl) titleEl.textContent = meta.title;
        if (iconEl) {
            iconEl.className = "l-panel__icon l-panel__icon--" + meta.icon;
        }
    }

    function updatePanelContent(key) {
        document.querySelectorAll("[data-panel-view]").forEach(function (el) {
            el.classList.toggle("is-active", el.getAttribute("data-panel-view") === key);
        });

        var footer = document.querySelector("[data-panel-footer]");
        if (footer) {
            var showFooter = key === "report";
            footer.hidden = !showFooter;
        }

        var panel = document.getElementById("lPanel");
        if (panel) {
            panel.setAttribute("data-panel", key || "");
        }
    }

    function setPanelDimOpen(open) {
        var dim = document.querySelector(".l-panel-dim");
        if (!dim) return;

        if (open) dim.removeAttribute("hidden");
        else dim.setAttribute("hidden", "");
    }

    function openPanel(key) {
        var app = getApp();
        var panel = document.getElementById("lPanel");
        if (!app || !panel || !PANEL_META[key]) return;

        currentPanel = key;
        updatePanelHeader(key);
        updatePanelContent(key);
        setSidemenuActive(key);

        panel.setAttribute("aria-hidden", "false");
        app.classList.add("is-panel-open");
        setPanelDimOpen(true);
    }

    function closePanel() {
        var app = getApp();
        var panel = document.getElementById("lPanel");
        if (!app || !panel) return;

        currentPanel = null;
        setSidemenuActive(null);
        updatePanelContent(null);

        app.classList.remove("is-panel-open");
        panel.setAttribute("aria-hidden", "true");
        setPanelDimOpen(false);
    }

    function togglePanel(key) {
        if (currentPanel === key && getApp() && getApp().classList.contains("is-panel-open")) {
            closePanel();
            return;
        }
        openPanel(key);
    }

    /* ----- 수목정보 패널 (데스크톱: 좌측 슬라이드 / 모바일: 1·2·3단 시트) ----- */
    var SHEET_MQ = "(max-width: 1000px)";
    /* closed | level1(22vh) | level2(peek) | level3(expanded) */
    var treepanelSheetState = "closed";

    function isTreepanelSheetMode() {
        return window.matchMedia(SHEET_MQ).matches;
    }

    function setTreepanelDimOpen(open) {
        var dim = document.querySelector(".l-treepanel-dim");
        if (!dim) return;

        if (open) dim.removeAttribute("hidden");
        else dim.setAttribute("hidden", "");
    }

    function clearMapvizMarkerActive() {
        document.querySelectorAll(".c-mapviz__marker.is-active").forEach(function (el) {
            el.classList.remove("is-active");
        });
    }

    function normalizeSheetState(state) {
        /* 이전 API 호환 */
        if (state === "peek") return "level2";
        if (state === "expanded" || state === "collapsed") {
            return state === "collapsed" ? "level1" : "level3";
        }
        return state;
    }

    function getTreepanelHeights() {
        var level1 = window.innerHeight * 0.22;
        var level2 = window.innerHeight * 0.52;
        var sidemenu = 70;
        try {
            var raw = getComputedStyle(document.documentElement).getPropertyValue("--sidemenu-height").trim();
            if (raw.indexOf("rem") !== -1) {
                var rem = parseFloat(raw);
                var root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 10;
                sidemenu = rem * root;
            } else if (raw.indexOf("px") !== -1) {
                sidemenu = parseFloat(raw);
            }
        } catch (err) { /* ignore */ }

        var level3 = Math.max(level2 + 40, window.innerHeight - sidemenu - 60);
        return {
            level1: level1,
            level2: level2,
            level3: level3,
            closed: 0,
            /* 호환 별칭 */
            peek: level2,
            expanded: level3
        };
    }

    function setTreepanelSheet(state) {
        var app = getApp();
        var panel = document.getElementById("lTreepanel");
        if (!app || !panel) return;

        state = normalizeSheetState(state);
        if (
            state !== "closed" &&
            state !== "level1" &&
            state !== "level2" &&
            state !== "level3"
        ) {
            return;
        }

        /* 데스크톱에서는 열림/닫힘만 */
        if (!isTreepanelSheetMode()) {
            if (state === "level1" || state === "level3") state = "level2";
        }

        treepanelSheetState = state;

        var open = state !== "closed";
        app.classList.toggle("is-treepanel-open", open);
        app.classList.toggle("is-treepanel-sheet-1", state === "level1");
        app.classList.toggle("is-treepanel-sheet-2", state === "level2");
        app.classList.toggle("is-treepanel-sheet-3", state === "level3");
        /* 기존 클래스 호환 */
        app.classList.toggle("is-treepanel-expanded", state === "level3");

        panel.setAttribute("aria-hidden", open ? "false" : "true");

        var inner = panel.querySelector(".l-treepanel__inner");
        if (inner) inner.style.height = "";

        /* 3단일 때만 딤 */
        setTreepanelDimOpen(isTreepanelSheetMode() && state === "level3");

        if (state === "closed") clearMapvizMarkerActive();
    }

    function setTreepanelOpen(open) {
        setTreepanelSheet(open ? "level2" : "closed");
    }

    function snapSheetByHeight(currentH) {
        var heights = getTreepanelHeights();
        var mid12 = (heights.level1 + heights.level2) / 2;
        var mid23 = (heights.level2 + heights.level3) / 2;

        if (currentH < heights.level1 * 0.55) setTreepanelSheet("closed");
        else if (currentH < mid12) setTreepanelSheet("level1");
        else if (currentH < mid23) setTreepanelSheet("level2");
        else setTreepanelSheet("level3");
    }

    function stepSheetUp() {
        if (treepanelSheetState === "level1") setTreepanelSheet("level2");
        else if (treepanelSheetState === "level2") setTreepanelSheet("level3");
        else setTreepanelSheet("level3");
    }

    function stepSheetDown() {
        if (treepanelSheetState === "level3") setTreepanelSheet("level2");
        else if (treepanelSheetState === "level2") setTreepanelSheet("level1");
        else if (treepanelSheetState === "level1") setTreepanelSheet("closed");
        else setTreepanelSheet("closed");
    }

    /* 모바일 시트 드래그 (1·2·3단 스냅) */
    function initTreepanelDrag() {
        var panel = document.getElementById("lTreepanel");
        if (!panel) return;

        var dragEl = panel.querySelector("[data-treepanel-drag]");
        var inner = panel.querySelector(".l-treepanel__inner");
        if (!dragEl || !inner) return;

        var startY = 0;
        var startH = 0;
        var startT = 0;
        var dragging = false;

        function getY(e) {
            if (e.touches && e.touches.length) return e.touches[0].clientY;
            if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientY;
            return e.clientY;
        }

        function onStart(e) {
            if (!isTreepanelSheetMode()) return;
            if (treepanelSheetState === "closed") return;

            dragging = true;
            panel.classList.add("is-dragging");
            startY = getY(e);
            startT = Date.now();
            startH = inner.getBoundingClientRect().height;

            if (e.type === "mousedown") e.preventDefault();
        }

        function onMove(e) {
            if (!dragging) return;

            var y = getY(e);
            var delta = startY - y;
            var heights = getTreepanelHeights();
            var nextH = Math.min(heights.level3, Math.max(0, startH + delta));

            inner.style.height = nextH + "px";

            if (e.cancelable) e.preventDefault();
        }

        function onEnd(e) {
            if (!dragging) return;
            dragging = false;
            panel.classList.remove("is-dragging");

            var y = getY(e);
            var dy = startY - y;
            var elapsed = Math.max(16, Date.now() - startT);
            var velocity = dy / elapsed;
            var currentH = inner.getBoundingClientRect().height;

            if (dy > 60 || (dy > 20 && velocity > 0.35)) {
                stepSheetUp();
            } else if (dy < -60 || (dy < -20 && velocity < -0.35)) {
                stepSheetDown();
            } else {
                snapSheetByHeight(currentH);
            }
        }

        dragEl.addEventListener("touchstart", onStart, { passive: true });
        dragEl.addEventListener("touchmove", onMove, { passive: false });
        dragEl.addEventListener("touchend", onEnd);
        dragEl.addEventListener("touchcancel", onEnd);

        dragEl.addEventListener("mousedown", onStart);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onEnd);
    }

    /* 지도 조작 시 1단으로 접기 */
    function initTreepanelMapCollapse() {
        function collapseToLevel1(e) {
            if (!isTreepanelSheetMode()) return;
            if (treepanelSheetState !== "level2" && treepanelSheetState !== "level3") return;
            /* 마커 클릭은 열기 동작이므로 제외 */
            if (e.target.closest && e.target.closest(".c-mapviz__marker")) return;
            if (e.target.closest && e.target.closest(".l-treepanel")) return;

            setTreepanelSheet("level1");
        }

        var map = document.querySelector(".l-main__map") || document.querySelector("#kakaoMap");
        var mapviz = document.querySelector("[data-mapviz]") || document.querySelector(".c-mapviz");

        [map, mapviz].forEach(function (el) {
            if (!el) return;
            el.addEventListener("pointerdown", collapseToLevel1);
            el.addEventListener("wheel", collapseToLevel1, { passive: true });
            el.addEventListener("touchstart", collapseToLevel1, { passive: true });
        });
    }

    window.LTreePanel = {
        setSheet: setTreepanelSheet,
        getSheet: function () {
            return treepanelSheetState;
        }
    };

    initTreepanelDrag();
    initTreepanelMapCollapse();

    function clearSidebarActive() {
        document.querySelectorAll(".l-sidebar__link.is-active").forEach(function (el) {
            el.classList.remove("is-active");
        });
    }

    /* 같은 레벨 형제 메뉴 닫기 (아코디언) */
    function closeSiblingItems(item) {
        var parent = item.parentElement;
        if (!parent) return;

        Array.prototype.forEach.call(parent.children, function (sibling) {
            if (sibling === item) return;
            if (!sibling.classList || !sibling.classList.contains("l-sidebar__item")) return;

            sibling.classList.remove("is-open");
            sibling.querySelectorAll(".l-sidebar__item.is-open").forEach(function (nested) {
                nested.classList.remove("is-open");
            });
        });
    }

    function openAccordionItem(item) {
        closeSiblingItems(item);
        item.classList.add("is-open");
    }

    /* 클릭한 메뉴 + 상위 1·2뎁스까지 is-active / is-open */
    function setSidebarActive(link) {
        clearSidebarActive();
        link.classList.add("is-active");

        var el = link.closest("li");
        while (el) {
            var parentUl = el.parentElement;
            if (!parentUl || !parentUl.classList.contains("l-sidebar__sub")) break;

            var parentItem = parentUl.closest(".l-sidebar__item");
            if (!parentItem) break;

            var parentLink = null;
            Array.prototype.some.call(parentItem.children, function (child) {
                if (child.classList && child.classList.contains("l-sidebar__link")) {
                    parentLink = child;
                    return true;
                }
                return false;
            });

            if (parentLink) {
                parentLink.classList.add("is-active");
                openAccordionItem(parentItem);
            }

            el = parentItem;
        }
    }

    document.addEventListener("click", function (e) {
        /* 수목정보 패널 열기/닫기 */
        if (e.target.closest("[data-treepanel-open]")) {
            setTreepanelOpen(true);
            return;
        }
        if (e.target.closest("[data-treepanel-close]")) {
            setTreepanelOpen(false);
            return;
        }

        /* 수목정보 패널 카드 아코디언 */
        var cardToggle = e.target.closest("[data-treepanel-card-toggle]");
        if (cardToggle) {
            var card = cardToggle.closest(".l-treepanel__card");
            if (!card) return;

            var open = card.classList.toggle("is-open");
            cardToggle.setAttribute("aria-expanded", open ? "true" : "false");
            return;
        }

        /* 우측 사이드메뉴 → 패널 */
        var sidemenuBtn = e.target.closest("[data-sidemenu]");
        if (sidemenuBtn) {
            togglePanel(sidemenuBtn.getAttribute("data-sidemenu"));
            return;
        }

        if (e.target.closest("[data-panel-close]")) {
            closePanel();
            return;
        }

        /* 모바일 햄버거 토글 */
        var mobileToggle = e.target.closest("[data-mobile-nav-toggle]");
        if (mobileToggle) {
            var app = getApp();
            if (!app) return;
            setMobileNavOpen(!app.classList.contains("is-mobile-nav-open"));
            return;
        }

        /* 모바일 딤 / 닫기 */
        if (e.target.closest("[data-mobile-nav-close]")) {
            setMobileNavOpen(false);
            return;
        }

        /* 사이드바 접기/펼치기 (데스크톱) */
        var sidebarToggle = e.target.closest("[data-sidebar-toggle]");
        if (sidebarToggle) {
            if (isMobileNav()) {
                /* 모바일에서는 패널 닫기로 사용 */
                setMobileNavOpen(false);
                return;
            }

            var appSidebar = getApp();
            if (!appSidebar) return;

            var collapsed = appSidebar.classList.toggle("is-sidebar-collapsed");

            document.querySelectorAll("[data-sidebar-toggle]").forEach(function (el) {
                el.setAttribute("aria-expanded", collapsed ? "false" : "true");
                el.setAttribute("aria-label", collapsed ? "메뉴 펼치기" : "메뉴 접기");
            });
            return;
        }

        /* 메뉴 링크 active */
        var menuLink = e.target.closest(".l-sidebar__nav .l-sidebar__link");
        if (menuLink) {
            setSidebarActive(menuLink);

            if (menuLink.tagName === "A") {
                var href = menuLink.getAttribute("href");
                if (!href || href === "#" || href.charAt(0) === "#") {
                    e.preventDefault();
                } else {
                    /* 같은 페이지면 새로고침 방지 → 접힘 상태 유지 */
                    try {
                        var url = new URL(href, window.location.href);
                        if (url.pathname === window.location.pathname) {
                            e.preventDefault();
                        }
                    } catch (err) {
                        e.preventDefault();
                    }
                }

                /* 모바일: 실제 이동 링크(또는 동일 페이지) 선택 시 패널 닫기 */
                if (isMobileNav() && !menuLink.classList.contains("l-sidebar__link--toggle")) {
                    setMobileNavOpen(false);
                }
            }
        }

        /* 메뉴 아코디언 (1·2뎁스) — 같은 레벨은 하나만 열림 */
        var menuToggle = e.target.closest("[data-menu-toggle]");
        if (!menuToggle) return;

        /* 데스크톱 접힘 상태에서는 아코디언 비활성 */
        if (!isMobileNav() && document.querySelector(".l-app.is-sidebar-collapsed")) return;

        var item = menuToggle.closest(".l-sidebar__item");
        if (!item) return;

        var willOpen = !item.classList.contains("is-open");
        closeSiblingItems(item);

        if (willOpen) {
            item.classList.add("is-open");
        } else {
            item.classList.remove("is-open");
            item.querySelectorAll(".l-sidebar__item.is-open").forEach(function (nested) {
                nested.classList.remove("is-open");
            });
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        if (getApp() && getApp().classList.contains("is-panel-open")) {
            closePanel();
            return;
        }
        if (getApp() && getApp().classList.contains("is-treepanel-open")) {
            if (treepanelSheetState === "level3") setTreepanelSheet("level2");
            else if (treepanelSheetState === "level2") setTreepanelSheet("level1");
            else setTreepanelSheet("closed");
            return;
        }
        setMobileNavOpen(false);
    });

    window.addEventListener("resize", function () {
        if (!isMobileNav()) setMobileNavOpen(false);
        /* 데스크톱으로 넓어지면 단순 열림(2단)으로 정리 */
        if (!isTreepanelSheetMode() && treepanelSheetState !== "closed") {
            setTreepanelSheet("level2");
        }
    });
})();
