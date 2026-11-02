/* main.js — HOME / 지도 영역 */

(function () {
    "use strict";

    function getFilter() {
        return document.querySelector(".c-mapfilter");
    }

    function updateBadge(filter) {
        if (!filter) return;

        var switchesOn = filter.querySelectorAll("[data-mapfilter-switch]:checked").length;
        var chipsOn = filter.querySelectorAll("[data-mapfilter-chip].is-active").length;
        /* 스위치 수 + (수목 종류 선택 여부 1) */
        var count = switchesOn + (chipsOn > 0 ? 1 : 0);

        var badge = filter.querySelector(".c-mapfilter__badge");
        if (badge) badge.textContent = String(count);
    }

    function resetFilter(filter) {
        filter.querySelectorAll("[data-mapfilter-switch]").forEach(function (input) {
            input.checked = true;
        });

        filter.querySelectorAll("[data-mapfilter-chip]").forEach(function (chip) {
            var tree = chip.getAttribute("data-tree");
            var defaultOn = tree === "cherry" || tree === "fringe" || tree === "zelkova" || tree === "ginkgo";
            chip.classList.toggle("is-active", defaultOn);
        });

        updateBadge(filter);
        syncMapviz(filter);
    }

    /* 퍼블 목업: 필터 ↔ 지도 시각화 오버레이 */
    function isLayerOn(filter, layer) {
        var input = filter.querySelector('[data-mapfilter-layer="' + layer + '"]');
        return !input || input.checked;
    }

    function syncMapviz(filter) {
        var mapviz = document.querySelector("[data-mapviz]");
        if (!mapviz || !filter) return;

        var pruneOn = isLayerOn(filter, "prune");
        var interfereOn = isLayerOn(filter, "interfere");
        var upOn = isLayerOn(filter, "up");
        var downOn = isLayerOn(filter, "down");
        var labelOn = isLayerOn(filter, "label");

        mapviz.classList.toggle("is-hide-label", !labelOn);

        mapviz.querySelectorAll('[data-mapviz-layer="prune"]').forEach(function (el) {
            el.hidden = !pruneOn;
        });
        mapviz.querySelectorAll('[data-mapviz-layer="interfere"]').forEach(function (el) {
            el.hidden = !interfereOn;
        });

        var activeTrees = {};
        filter.querySelectorAll("[data-mapfilter-chip].is-active").forEach(function (chip) {
            var tree = chip.getAttribute("data-tree");
            if (tree) activeTrees[tree] = true;
        });

        mapviz.querySelectorAll(".c-mapviz__marker").forEach(function (marker) {
            var tree = marker.getAttribute("data-tree");
            var dir = marker.getAttribute("data-mapviz-dir");
            var dirOk = (dir === "up" && upOn) || (dir === "down" && downOn) || !dir;
            var treeOk = !!(tree && activeTrees[tree]);
            marker.hidden = !(dirOk && treeOk);
        });
    }

    /* ----- Chart.js ----- */
    var speciesChart = null;
    var reportSpeciesChart = null;
    var reportRiskChart = null;

    // 예측 데이터 퍼블리싱 고정값
    var REPORT_RISK_PERIOD_DATA = {
        "1": {
            total: 490,
            chart: [75, 19, 396],
            legend: { clear: 75, warning: 19, critical: 396 },
            summary: { changed: 11, newDanger: 9, confidence: "91.7" }
        },
        "2": {
            total: 490,
            chart: [58, 32, 400],
            legend: { clear: 58, warning: 32, critical: 400 },
            summary: { changed: 18, newDanger: 14, confidence: "88.5" }
        },
        "3": {
            total: 490,
            chart: [42, 38, 410],
            legend: { clear: 42, warning: 38, critical: 410 },
            summary: { changed: 26, newDanger: 22, confidence: "84.2" }
        }
    };

    var REPORT_RISK_CHART_COLORS = ["#52C460", "#F5B42D", "#DC1B27"];

    function initSpeciesChart() {
        var canvas = document.getElementById("chartSpeciesTop5");
        if (!canvas || typeof Chart === "undefined") return;

        if (speciesChart) {
            speciesChart.destroy();
            speciesChart = null;
        }

        var labels = ["은행나무", "벚나무", "플라타너스", "느티나무", "이팝나무"];
        var values = [8200, 5000, 3100, 1500, 800];
        var colors = [
            "#27B983",
            "#42D39B",
            "#75E7B9",
            "#AAF3D1",
            "#D2FAE6"
        ];

        speciesChart = new Chart(canvas, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0,
                    borderRadius: 999,
                    borderSkipped: false,
                    barThickness: 15,
                    categoryPercentage: 0.7,
                    barPercentage: 0.85
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return ctx.parsed.x.toLocaleString("ko-KR") + " 그루";
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        min: 0,
                        max: 10000,
                        grid: {
                            color: "#E2E8F0",
                            drawBorder: false,
                            tickLength: 0
                        },
                        border: { display: false },
                        ticks: {
                            stepSize: 2000,
                            color: "#9FADC2",
                            font: {
                                family: "Pretendard, sans-serif",
                                size: 11
                            },
                            callback: function (value) {
                                if (value === 0) return "0";
                                return value / 1000 + "k";
                            }
                        }
                    },
                    y: {
                        grid: { display: false, drawBorder: false },
                        border: { display: false },
                        ticks: {
                            color: "#475569",
                            font: {
                                family: "Pretendard, sans-serif",
                                size: 12,
                                weight: "500"
                            },
                            padding: 8
                        }
                    }
                },
                layout: {
                    padding: { top: 4, right: 8, bottom: 0, left: 0 }
                }
            }
        });
    }

    function createDonutChart(canvas, data, colors, labels) {
        return new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: labels || [],
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                animation: false,
                animations: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                var name = ctx.label ? ctx.label + ": " : "";
                                return name + ctx.parsed.toLocaleString("ko-KR");
                            }
                        }
                    }
                }
            }
        });
    }

    // 차트 1회 생성 (기본: 1년후)
    function initReportCharts() {
        if (typeof Chart === "undefined") return;

        var speciesCanvas = document.getElementById("chartReportSpecies");
        var riskCanvas = document.getElementById("chartReportRisk");

        if (reportSpeciesChart) {
            reportSpeciesChart.destroy();
            reportSpeciesChart = null;
        }
        if (reportRiskChart) {
            reportRiskChart.destroy();
            reportRiskChart = null;
        }

        if (speciesCanvas) {
            reportSpeciesChart = createDonutChart(
                speciesCanvas,
                [100, 70, 40, 25, 15, 4],
                ["#F6BCD6", "#68CAF6", "#75E49C", "#F9CA63", "#FF0776", "#FFF9B3"],
                ["왕벚나무", "이팝나무", "느티나무", "은행나무", "버즘나무", "목백합나무"]
            );
        }

        if (riskCanvas) {
            reportRiskChart = createDonutChart(
                riskCanvas,
                REPORT_RISK_PERIOD_DATA["1"].chart,
                REPORT_RISK_CHART_COLORS
            );
        }
    }

    // 탭 클릭 시 데이터 업데이트
    function setReportRiskPeriod(period) {
        var data = REPORT_RISK_PERIOD_DATA[period];
        var card = document.querySelector("[data-report-risk]");
        if (!data || !card) return;

        card.querySelectorAll("[data-report-period-btn]").forEach(function (btn) {
            var on = btn.getAttribute("data-report-period-btn") === period;
            btn.classList.toggle("is-active", on);
            btn.setAttribute("aria-selected", on ? "true" : "false");
        });

        var totalEl = card.querySelector("[data-report-risk-total]");
        if (totalEl) totalEl.textContent = String(data.total);

        card.querySelectorAll("[data-report-risk-legend-count]").forEach(function (el) {
            var key = el.getAttribute("data-report-risk-legend-count");
            if (key && data.legend[key] != null) {
                el.textContent = String(data.legend[key]);
            }
        });

        var changedEl = card.querySelector("[data-report-risk-summary-changed]");
        var newDangerEl = card.querySelector("[data-report-risk-summary-new-danger]");
        var confidenceEl = card.querySelector("[data-report-risk-summary-confidence]");
        if (changedEl) changedEl.textContent = String(data.summary.changed);
        if (newDangerEl) newDangerEl.textContent = String(data.summary.newDanger);
        if (confidenceEl) {
            confidenceEl.innerHTML = data.summary.confidence + "<strong>%</strong>";
        }

        if (reportRiskChart) {
            reportRiskChart.data.datasets[0].data = data.chart.slice();
            reportRiskChart.update("none");
        }
    }

    // 탭 클릭 이벤트
    function initReportRiskPeriodTabs() {
        var tabList = document.querySelector("[data-report-period]");
        if (!tabList) return;

        tabList.querySelectorAll("[data-report-period-btn]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var period = btn.getAttribute("data-report-period-btn");
                if (!period || btn.classList.contains("is-active")) return;
                setReportRiskPeriod(period);
            });
        });
    }

    function resizeCharts() {
        if (speciesChart) speciesChart.resize();
        if (reportSpeciesChart) reportSpeciesChart.resize();
        if (reportRiskChart) reportRiskChart.resize();
    }

    function setMapfilterDimOpen(open) {
        var dim = document.querySelector(".c-mapfilter-dim");
        if (!dim) return;

        if (open) dim.removeAttribute("hidden");
        else dim.setAttribute("hidden", "");
    }

    function setMapfilterOpen(filter, open) {
        if (!filter) return;

        filter.classList.toggle("is-open", open);
        var toggle = filter.querySelector("[data-mapfilter-toggle]");
        if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
        setMapfilterDimOpen(open);
    }

    document.addEventListener("click", function (e) {
        if (e.target.closest("[data-mapfilter-close]")) {
            setMapfilterOpen(getFilter(), false);
            return;
        }

        var toggle = e.target.closest("[data-mapfilter-toggle]");
        if (toggle) {
            var filter = toggle.closest(".c-mapfilter");
            if (!filter) return;

            setMapfilterOpen(filter, !filter.classList.contains("is-open"));
            return;
        }

        var reset = e.target.closest("[data-mapfilter-reset]");
        if (reset) {
            var filterReset = reset.closest(".c-mapfilter");
            if (filterReset) resetFilter(filterReset);
            return;
        }

        var chip = e.target.closest("[data-mapfilter-chip]");
        if (chip) {
            var filterChip = chip.closest(".c-mapfilter");
            chip.classList.toggle("is-active");
            updateBadge(filterChip);
            syncMapviz(filterChip);
        }
    });

    document.addEventListener("change", function (e) {
        if (!e.target.matches("[data-mapfilter-switch]")) return;
        var filterChange = e.target.closest(".c-mapfilter");
        updateBadge(filterChange);
        syncMapviz(filterChange);
    });

    /* ----- 수목정보 패널 사진 슬라이드 ----- */
    var treepanelPhotoSwiper = null;

    function padSlideNum(n) {
        return String(n).padStart(2, "0");
    }

    function updateTreepanelPhotoCount(swiper) {
        if (!swiper || !swiper.el) return;

        var countEl = swiper.el.querySelector(".l-treepanel__photo-count");
        if (!countEl) return;

        var current = (swiper.realIndex || 0) + 1;
        var total = swiper.slides ? swiper.slides.length : 0;
        countEl.innerHTML =
            '<span class="l-treepanel__photo-count-current">' +
            padSlideNum(current) +
            "</span> / " +
            padSlideNum(total);
    }

    function initTreepanelPhotoSwiper() {
        var el = document.querySelector(".l-treepanel__photo.swiper");
        if (!el || typeof Swiper === "undefined") return;

        if (treepanelPhotoSwiper) {
            treepanelPhotoSwiper.destroy(true, true);
            treepanelPhotoSwiper = null;
        }

        treepanelPhotoSwiper = new Swiper(el, {
            slidesPerView: 1,
            spaceBetween: 0,
            speed: 300,
            loop: false,
            observer: true,
            observeParents: true,
            navigation: {
                nextEl: el.querySelector(".l-treepanel__photo-nav-next"),
                prevEl: el.querySelector(".l-treepanel__photo-nav-prev")
            },
            on: {
                init: function (swiper) {
                    updateTreepanelPhotoCount(swiper);
                },
                slideChange: function (swiper) {
                    updateTreepanelPhotoCount(swiper);
                }
            }
        });
    }

    updateBadge(getFilter());
    syncMapviz(getFilter());
    initSpeciesChart();
    initReportCharts();
    initReportRiskPeriodTabs();
    initTreepanelPhotoSwiper();

    /* Escape → 지도 필터 바텀 시트 닫기 */
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        var filter = getFilter();
        if (filter && filter.classList.contains("is-open")) {
            setMapfilterOpen(filter, false);
        }
    });

    /* 퍼블: 마커 클릭 → active + 수목정보 패널 (모바일: 2단부터) */
    function setTreepanelOpen(open) {
        if (window.LTreePanel && typeof window.LTreePanel.setSheet === "function") {
            window.LTreePanel.setSheet(open ? "level2" : "closed");
            if (open && treepanelPhotoSwiper) {
                window.setTimeout(function () {
                    treepanelPhotoSwiper.update();
                }, 280);
            }
            return;
        }

        var app = document.querySelector(".l-app");
        var panel = document.getElementById("lTreepanel");
        if (!app || !panel) return;

        app.classList.toggle("is-treepanel-open", open);
        app.classList.toggle("is-treepanel-sheet-2", open);
        app.classList.remove("is-treepanel-sheet-1", "is-treepanel-sheet-3", "is-treepanel-expanded");
        panel.setAttribute("aria-hidden", open ? "false" : "true");

        if (open && treepanelPhotoSwiper) {
            window.setTimeout(function () {
                treepanelPhotoSwiper.update();
            }, 280);
        }
    }

    document.addEventListener("click", function (e) {
        var marker = e.target.closest(".c-mapviz__marker");
        if (!marker) return;

        var mapviz = marker.closest("[data-mapviz]") || marker.closest(".c-mapviz");
        var scope = mapviz || document;
        scope.querySelectorAll(".c-mapviz__marker.is-active").forEach(function (el) {
            if (el !== marker) el.classList.remove("is-active");
        });
        marker.classList.toggle("is-active");

        setTreepanelOpen(marker.classList.contains("is-active"));
    });

    /* 우측 패널 열릴 때 차트 리사이즈 */
    document.addEventListener("click", function (e) {
        if (!e.target.closest("[data-sidemenu]")) return;
        window.setTimeout(resizeCharts, 280);
    });
})();
