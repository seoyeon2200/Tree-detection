

/* ----- 커스텀 셀렉트 드롭다운 ([data-select]) ----- */
(function () {
    var selects = document.querySelectorAll("[data-select]");

    selects.forEach(function (select) {
        var trigger = select.querySelector(".c-select__trigger");
        var valueEl = select.querySelector(".c-select__value");
        var options = select.querySelectorAll(".c-select__option");

        /* 트리거 클릭: 다른 셀렉트 닫고 현재 셀렉트 토글 */
        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            var isOpen = select.classList.contains("is-open");

            selects.forEach(function (other) {
                other.classList.remove("is-open");
                other.querySelector(".c-select__trigger").setAttribute("aria-expanded", "false");
            });

            if (!isOpen) {
                select.classList.add("is-open");
                trigger.setAttribute("aria-expanded", "true");
            }
        });

        /* 옵션 선택: 표시값 갱신 후 닫기 */
        options.forEach(function (option) {
            option.addEventListener("click", function () {
                options.forEach(function (item) {
                    item.classList.remove("is-active");
                    item.setAttribute("aria-selected", "false");
                });
                option.classList.add("is-active");
                option.setAttribute("aria-selected", "true");
                valueEl.textContent = option.textContent;
                valueEl.classList.remove("is-placeholder");
                select.classList.remove("is-open");
                trigger.setAttribute("aria-expanded", "false");
            });
        });
    });

    /* 바깥 클릭 시 모든 셀렉트 닫기 */
    document.addEventListener("click", function () {
        selects.forEach(function (select) {
            select.classList.remove("is-open");
            select.querySelector(".c-select__trigger").setAttribute("aria-expanded", "false");
        });
    });
})();


/* ----- 커스텀 파일 첨부 ([data-file]) ----- */
(function () {
    var files = document.querySelectorAll("[data-file]");

    files.forEach(function (file) {
        var input = file.querySelector(".c-file__input");
        var nameEl = file.querySelector(".c-file__name");
        var clearBtn = file.querySelector(".c-file__clear");
        var placeholder = nameEl.dataset.placeholder || "파일첨부 (.las, .laz)";

        if (nameEl.classList.contains("is-placeholder")) {
            nameEl.dataset.placeholder = nameEl.textContent;
        } else {
            nameEl.dataset.placeholder = placeholder;
        }

        /* 파일 선택 시 파일명 표시 */
        input.addEventListener("change", function () {
            if (input.files && input.files[0]) {
                nameEl.textContent = input.files[0].name;
                nameEl.classList.remove("is-placeholder");
                file.classList.add("has-file");
            }
        });

        /* 삭제 버튼: 선택 초기화 */
        clearBtn.addEventListener("click", function () {
            input.value = "";
            nameEl.textContent = nameEl.dataset.placeholder || placeholder;
            nameEl.classList.add("is-placeholder");
            file.classList.remove("has-file");
        });
    });
})();


/* ----- 페이지네이션 ([data-paging]) ----- */
(function () {
    function buildPages(total, current) {
        var pages = [];
        var i;

        if (total <= 7) {
            for (i = 1; i <= total; i++) pages.push(i);
            return pages;
        }

        pages.push(1);

        var start = Math.max(2, current - 1);
        var end = Math.min(total - 1, current + 1);

        if (current <= 3) {
            start = 2;
            end = 3;
        }

        if (current >= total - 2) {
            start = total - 2;
            end = total - 1;
        }

        if (start > 2) pages.push("dots");

        for (i = start; i <= end; i++) pages.push(i);

        if (end < total - 1) pages.push("dots");

        pages.push(total);
        return pages;
    }

    function renderPaging(el) {
        var total = Number(el.getAttribute("data-total")) || 1;
        var current = Number(el.getAttribute("data-current")) || 1;
        var pages = buildPages(total, current);
        var html = "";

        html +=
            '<button class="c-paging__btn c-paging__btn--prev" type="button" aria-label="이전"' +
            (current <= 1 ? " disabled" : "") +
            "></button>";

        pages.forEach(function (page) {
            if (page === "dots") {
                html += '<span class="c-paging__dots" aria-hidden="true">…</span>';
                return;
            }

            html +=
                '<button class="c-paging__btn' +
                (page === current ? " is-active" : "") +
                '" type="button"' +
                (page === current ? ' aria-current="page"' : "") +
                ">" +
                page +
                "</button>";
        });

        html +=
            '<button class="c-paging__btn c-paging__btn--next" type="button" aria-label="다음"' +
            (current >= total ? " disabled" : "") +
            "></button>";

        el.innerHTML = html;

        el.querySelectorAll(".c-paging__btn:not(:disabled)").forEach(function (btn) {
            btn.addEventListener("click", function () {
                if (btn.classList.contains("c-paging__btn--prev")) {
                    current -= 1;
                } else if (btn.classList.contains("c-paging__btn--next")) {
                    current += 1;
                } else {
                    current = Number(btn.textContent);
                }
                el.setAttribute("data-current", String(current));
                renderPaging(el);
            });
        });
    }

    document.querySelectorAll("[data-paging]").forEach(renderPaging);
})();


/* ----- 수목 리스트 선택 (.l-treelist) ----- */
(function () {
    var list = document.querySelector(".l-treelist__list");
    if (!list) return;

    list.addEventListener("click", function (e) {
        var item = e.target.closest(".l-treelist__item");
        if (!item || !list.contains(item)) return;

        list.querySelectorAll(".l-treelist__item.is-active").forEach(function (el) {
            el.classList.remove("is-active");
        });
        item.classList.add("is-active");
    });
})();


/* ----- LiDAR 썸네일 전환 ----- */
(function () {
    var lidarBody = document.querySelector(".l-submain__media-body--lidar");
    if (!lidarBody) return;

    var mainImg = lidarBody.querySelector(".l-submain__lidar-main img");
    var mainDate = lidarBody.querySelector(".l-submain__lidar-date");
    var thumbs = lidarBody.querySelectorAll(".l-submain__lidar-thumb");

    thumbs.forEach(function (thumb) {
        thumb.addEventListener("click", function () {
            thumbs.forEach(function (el) {
                el.classList.remove("is-active");
            });
            thumb.classList.add("is-active");

            if (mainImg && thumb.dataset.lidarSrc) {
                mainImg.src = thumb.dataset.lidarSrc;
            }
            if (mainDate && thumb.dataset.lidarDate) {
                mainDate.textContent = thumb.dataset.lidarDate;
            }
        });
    });
})();


/* ----- 상세 탭 전환 (data-tab / data-tab-panel) ----- */
(function () {
    var tabList = document.querySelector(".l-submain__tabs-bar");
    if (!tabList) return;

    var tabs = tabList.querySelectorAll(".l-submain__tab");
    var panels = document.querySelectorAll("[data-tab-panel]");

    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            var key = tab.getAttribute("data-tab");
            if (!key) return;

            tabs.forEach(function (item) {
                var on = item === tab;
                item.classList.toggle("is-active", on);
                item.setAttribute("aria-selected", on ? "true" : "false");
            });

            panels.forEach(function (panel) {
                var on = panel.getAttribute("data-tab-panel") === key;
                panel.classList.toggle("is-active", on);
                panel.hidden = !on;
            });
        });
    });
})();


/* ----- 목록/상세 <-> 신규 등록 보기 전환 ([data-view]) ----- */
(function () {
    var views = document.querySelectorAll("[data-view]");
    if (!views.length) return;

    var treeFields = document.querySelector("[data-tree-fields]");
    var treeManualBtn = document.querySelector("[data-tree-manual]");

    /* 수목정보 입력란 활성/비활성 (직접입력·팝업 선택 시 활성) */
    function setTreeFieldsEnabled(on) {
        if (!treeFields) return;

        treeFields.querySelectorAll("input").forEach(function (input) {
            input.disabled = !on;
        });

        if (treeManualBtn) {
            treeManualBtn.classList.toggle("is-active", on);
        }

        if (on) {
            var first = treeFields.querySelector("input");
            if (first) first.focus();
        }
    }

    function showView(name) {
        views.forEach(function (view) {
            var on = view.getAttribute("data-view") === name;
            view.hidden = !on;
        });

        /* 등록 화면 진입 시 수목정보 입력란 다시 비활성화 */
        if (name === "create") {
            setTreeFieldsEnabled(false);
        }
    }

    document.querySelectorAll("[data-view-open]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var name = btn.getAttribute("data-view-open");
            if (name) showView(name);
        });
    });

    /* 직접입력 버튼 */
    if (treeManualBtn) {
        treeManualBtn.addEventListener("click", function () {
            setTreeFieldsEnabled(true);
        });
    }

    /* 팝업 선택 → 수목정보 필드 채우기 */
    document.querySelectorAll("[data-tree-pick]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var map = {
                createTreeNo: btn.getAttribute("data-tree-no") || "",
                createTreeName: btn.getAttribute("data-tree-name") || "",
                createTreeHeight: btn.getAttribute("data-tree-height") || "",
                createCrownHeight: btn.getAttribute("data-tree-crown-height") || "",
                createClearLength: btn.getAttribute("data-tree-clear") || "",
                createDbh: btn.getAttribute("data-tree-dbh") || "",
                createRootDia: btn.getAttribute("data-tree-root") || "",
                createCrownWidth: btn.getAttribute("data-tree-crown-width") || ""
            };

            Object.keys(map).forEach(function (id) {
                var input = document.getElementById(id);
                if (input) input.value = map[id];
            });

            setTreeFieldsEnabled(true);

            var popup = document.getElementById("treeSearchPopup");
            if (popup) {
                popup.classList.remove("is-open");
                popup.setAttribute("aria-hidden", "true");
                document.body.style.overflow = "";
            }
        });
    });
})();


/* ----- 정보 카드 수정 모드 (.l-submain__info-card) ----- */
(function () {
    var editingCard = null;

    function getDisplayValue(el) {
        return el.textContent.trim();
    }

    /* 식재 위치 값은 포인트 스타일 유지 */
    function isPointValue(row) {
        var label = row.querySelector(".l-submain__info-label");
        return label && label.textContent.trim() === "식재 위치";
    }

    function enterEditMode(card) {
        if (editingCard && editingCard !== card) {
            exitEditMode(editingCard, false);
        }

        editingCard = card;
        card.classList.add("is-editing");

        var editBtn = card.querySelector(".l-submain__info-edit");
        var actionBtns = card.querySelector(".l-submain__info-actions-edit");
        if (editBtn) editBtn.hidden = true;
        if (actionBtns) actionBtns.hidden = false;

        var firstInput = null;

        card.querySelectorAll(".l-submain__info-row").forEach(function (row) {
            var valueEl = row.querySelector(".l-submain__info-value");
            if (!valueEl || valueEl.querySelector(".c-input")) return;

            var value = getDisplayValue(valueEl);
            valueEl.dataset.originalValue = value;
            valueEl.dataset.isPoint = isPointValue(row) ? "true" : "false";
            valueEl.classList.remove("l-submain__info-value--point");
            valueEl.textContent = "";

            var input = document.createElement("input");
            input.type = "text";
            input.className = "c-input c-input--27";
            input.value = value;
            valueEl.appendChild(input);

            if (!firstInput) firstInput = input;
        });

        if (firstInput) {
            firstInput.focus();
            firstInput.select();
        }
    }

    function exitEditMode(card, save) {
        if (!card) return;

        card.classList.remove("is-editing");

        var editBtn = card.querySelector(".l-submain__info-edit");
        var actionBtns = card.querySelector(".l-submain__info-actions-edit");
        if (editBtn) editBtn.hidden = false;
        if (actionBtns) actionBtns.hidden = true;

        card.querySelectorAll(".l-submain__info-value").forEach(function (valueEl) {
            var input = valueEl.querySelector(".c-input");
            if (!input) return;

            var value = save ? input.value.trim() : valueEl.dataset.originalValue || "";
            valueEl.textContent = value;

            if (valueEl.dataset.isPoint === "true") {
                valueEl.classList.add("l-submain__info-value--point");
            }

            delete valueEl.dataset.originalValue;
            delete valueEl.dataset.isPoint;
        });

        if (editingCard === card) {
            editingCard = null;
        }
    }

    document.querySelectorAll(".l-submain__info-card").forEach(function (card) {
        var editBtn = card.querySelector(".l-submain__info-edit");
        var saveBtn = card.querySelector("[data-info-save]");
        var cancelBtn = card.querySelector("[data-info-cancel]");

        if (!editBtn) return;

        editBtn.addEventListener("click", function () {
            enterEditMode(card);
        });

        if (saveBtn) {
            saveBtn.addEventListener("click", function () {
                exitEditMode(card, true);
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener("click", function () {
                exitEditMode(card, false);
            });
        }
    });
})();


/* ----- 팝업 열기 / 닫기 ([data-popup-open], [data-popup-close]) ----- */
(function () {
    function openPopup(popup) {
        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closePopup(popup) {
        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    document.querySelectorAll("[data-popup-open]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var popup = document.getElementById(btn.getAttribute("data-popup-open"));
            if (popup) openPopup(popup);
        });
    });

    document.querySelectorAll(".c-popup").forEach(function (popup) {
        popup.querySelectorAll("[data-popup-close]").forEach(function (el) {
            el.addEventListener("click", function () {
                closePopup(popup);
            });
        });
    });

    /* Esc 키로 열린 팝업 닫기 */
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        document.querySelectorAll(".c-popup.is-open").forEach(closePopup);
    });
})();


/* ----- 수목관리 객체 탐지 empty / result 전환 (퍼블) -----
 * 파일 미선택 시 실행 버튼 비활성, 실행 시 결과 화면 표시
 */
(function () {
    var runBtn = document.querySelector("[data-detect-run]");
    if (!runBtn) return;

    var emptyStage = document.querySelector('[data-detect="empty"]');
    var resultStage = document.querySelector('[data-detect="result"]');
    if (!emptyStage || !resultStage) return;

    var fileInput = document.getElementById("detectLidarFile");
    var fileWrap = fileInput && fileInput.closest("[data-file]");
    var clearBtn = fileWrap && fileWrap.querySelector(".c-file__clear");

    function syncRunBtn() {
        var hasFile = !!(fileInput && fileInput.files && fileInput.files[0]);
        runBtn.disabled = !hasFile;
    }

    if (fileInput) {
        fileInput.addEventListener("change", syncRunBtn);
    }
    if (clearBtn) {
        clearBtn.addEventListener("click", syncRunBtn);
    }
    syncRunBtn();

    runBtn.addEventListener("click", function () {
        if (runBtn.disabled) return;
        emptyStage.hidden = true;
        resultStage.hidden = false;
    });
})();


/* ----- 객체 탐지 결과 요약 — 유형 비율 도넛 (Chart.js) ----- */
(function () {
    var canvas = document.getElementById("chartDetectRatio");
    if (!canvas || typeof Chart === "undefined") return;

    new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["수목", "전신주", "가로등", "기타 시설물"],
            datasets: [{
                data: [74.6, 6.3, 11.1, 8.0],
                backgroundColor: ["#10B981", "#F59E0B", "#3B82F6", "#8B5CF6"],
                borderWidth: 0,
                hoverOffset: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            return ctx.label + ": " + ctx.parsed + "%";
                        }
                    }
                }
            }
        }
    });
})();

/* ----- 객체 탐지 결과 리스트 — 유형 탭 필터 -----
 * 기본: 전체 / data-detect-filter-btn 값으로 data-detect-type 행 표시
 */
(function () {
    var filter = document.querySelector("[data-detect-filter]");
    var list = document.querySelector("[data-detect-list]");
    if (!filter || !list) return;

    var buttons = filter.querySelectorAll("[data-detect-filter-btn]");
    var rows = list.querySelectorAll("[data-detect-type]");

    function applyFilter(type) {
        rows.forEach(function (row) {
            var show = type === "all" || row.getAttribute("data-detect-type") === type;
            row.hidden = !show;
        });
    }

    buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var type = btn.getAttribute("data-detect-filter-btn");
            if (!type) return;

            buttons.forEach(function (item) {
                var on = item === btn;
                item.classList.toggle("is-active", on);
                item.setAttribute("aria-selected", on ? "true" : "false");
            });

            applyFilter(type);
        });
    });

    /* 행 클릭 시 선택 (퍼블) */
    rows.forEach(function (row) {
        row.addEventListener("click", function () {
            rows.forEach(function (el) {
                el.classList.remove("is-active");
            });
            row.classList.add("is-active");
        });
    });
})();


/* ----- 년·월 선택기 ([data-monthpicker]) -----
 * 예측시기: 현재 년·월 이전은 선택 불가
 */
(function () {
    var pickers = document.querySelectorAll("[data-monthpicker]");
    if (!pickers.length) return;

    function padMonth(month) {
        return month < 10 ? "0" + month : String(month);
    }

    function closePicker(picker) {
        var trigger = picker.querySelector(".c-monthpicker__trigger");
        var panel = picker.querySelector(".c-monthpicker__panel");
        picker.classList.remove("is-open");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
        if (panel) panel.hidden = true;
    }

    function openPicker(picker) {
        pickers.forEach(closePicker);
        var trigger = picker.querySelector(".c-monthpicker__trigger");
        var panel = picker.querySelector(".c-monthpicker__panel");
        picker.classList.add("is-open");
        if (trigger) trigger.setAttribute("aria-expanded", "true");
        if (panel) panel.hidden = false;
    }

    pickers.forEach(function (picker) {
        var trigger = picker.querySelector(".c-monthpicker__trigger");
        var panel = picker.querySelector(".c-monthpicker__panel");
        var valueEl = picker.querySelector(".c-monthpicker__value");
        var yearEl = picker.querySelector("[data-monthpicker-year]");
        var hidden = picker.querySelector('input[type="hidden"]');
        var prevBtn = picker.querySelector(".c-monthpicker__nav--prev");
        var nextBtn = picker.querySelector(".c-monthpicker__nav--next");
        var monthBtns = picker.querySelectorAll(".c-monthpicker__month");
        var now = new Date();
        var minYear = now.getFullYear();
        var minMonth = now.getMonth() + 1;
        var viewYear = minYear;
        var selectedYear = null;
        var selectedMonth = null;

        function isPastMonth(year, month) {
            return year < minYear || (year === minYear && month < minMonth);
        }

        function renderPanel() {
            if (yearEl) yearEl.textContent = String(viewYear);

            if (prevBtn) {
                var canPrev = viewYear > minYear;
                prevBtn.disabled = !canPrev;
                prevBtn.classList.toggle("is-disabled", !canPrev);
            }

            monthBtns.forEach(function (btn) {
                var month = Number(btn.getAttribute("data-month"));
                var past = isPastMonth(viewYear, month);
                var on = selectedYear === viewYear && selectedMonth === month;

                btn.disabled = past;
                btn.classList.toggle("is-disabled", past);
                btn.classList.toggle("is-active", on && !past);
            });
        }

        if (valueEl && valueEl.classList.contains("is-placeholder") && !valueEl.dataset.placeholder) {
            valueEl.dataset.placeholder = valueEl.textContent;
        }

        renderPanel();

        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            if (picker.classList.contains("is-open")) {
                closePicker(picker);
            } else {
                if (viewYear < minYear) viewYear = minYear;
                openPicker(picker);
                renderPanel();
            }
        });

        panel.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        if (prevBtn) {
            prevBtn.addEventListener("click", function () {
                if (viewYear <= minYear) return;
                viewYear -= 1;
                renderPanel();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", function () {
                viewYear += 1;
                renderPanel();
            });
        }

        monthBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                if (btn.disabled) return;

                var month = Number(btn.getAttribute("data-month"));
                if (isPastMonth(viewYear, month)) return;

                selectedYear = viewYear;
                selectedMonth = month;
                var label = selectedYear + "/" + padMonth(selectedMonth);

                if (valueEl) {
                    valueEl.textContent = label;
                    valueEl.classList.remove("is-placeholder");
                }
                if (hidden) hidden.value = label;

                renderPanel();
                closePicker(picker);
                picker.dispatchEvent(new CustomEvent("monthpicker:change", { bubbles: true }));
            });
        });

        picker._monthpickerReset = function () {
            var today = new Date();
            minYear = today.getFullYear();
            minMonth = today.getMonth() + 1;
            selectedYear = null;
            selectedMonth = null;
            viewYear = minYear;
            if (valueEl) {
                valueEl.textContent = valueEl.dataset.placeholder || "시기를 선택하세요";
                valueEl.classList.add("is-placeholder");
            }
            if (hidden) hidden.value = "";
            renderPanel();
            closePicker(picker);
            picker.dispatchEvent(new CustomEvent("monthpicker:change", { bubbles: true }));
        };
    });

    document.addEventListener("click", function () {
        pickers.forEach(closePicker);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        pickers.forEach(closePicker);
    });
})();


/* ----- AI분석 검색 empty / result 전환 (퍼블) -----
 * 검색 조건이 하나라도 있을 때만 검색 가능
 * 검색 → result, 초기화 → 필터 리셋 + empty
 */
(function () {
    var searchBtn = document.querySelector("[data-predict-search]");
    var resetBtn = document.querySelector("[data-predict-reset]");
    if (!searchBtn && !resetBtn) return;

    var emptyStage = document.querySelector('[data-predict="empty"]');
    var resultStage = document.querySelector('[data-predict="result"]');
    if (!emptyStage || !resultStage) return;

    var toolbar = document.querySelector(".l-predict__toolbar");
    var keyword = document.getElementById("predictKeyword");
    var period = document.getElementById("predictPeriod");

    /* 초기 placeholder 보관 (초기화용) */
    if (toolbar) {
        toolbar.querySelectorAll(".c-select__value.is-placeholder").forEach(function (valueEl) {
            if (!valueEl.dataset.placeholder) {
                valueEl.dataset.placeholder = valueEl.textContent;
            }
        });
    }

    function hasAnyFilter() {
        if (period && period.value) return true;
        if (keyword && keyword.value.trim()) return true;

        if (toolbar) {
            var values = toolbar.querySelectorAll("[data-select] .c-select__value");
            for (var i = 0; i < values.length; i++) {
                if (!values[i].classList.contains("is-placeholder")) return true;
            }
        }
        return false;
    }

    function syncSearchBtn() {
        if (!searchBtn) return;
        searchBtn.disabled = !hasAnyFilter();
    }

    function showEmpty() {
        emptyStage.hidden = false;
        resultStage.hidden = true;
    }

    function showResult() {
        emptyStage.hidden = true;
        resultStage.hidden = false;
    }

    function resetFilters() {
        if (!toolbar) return;

        toolbar.querySelectorAll("[data-select]").forEach(function (select) {
            var valueEl = select.querySelector(".c-select__value");
            var options = select.querySelectorAll(".c-select__option");
            var trigger = select.querySelector(".c-select__trigger");
            var placeholder = valueEl && valueEl.dataset.placeholder;

            options.forEach(function (item) {
                item.classList.remove("is-active");
                item.setAttribute("aria-selected", "false");
            });

            if (valueEl) {
                if (!placeholder && valueEl.classList.contains("is-placeholder")) {
                    valueEl.dataset.placeholder = valueEl.textContent;
                    placeholder = valueEl.dataset.placeholder;
                }
                valueEl.textContent = placeholder || "선택하세요";
                valueEl.classList.add("is-placeholder");
            }

            select.classList.remove("is-open");
            if (trigger) trigger.setAttribute("aria-expanded", "false");
        });

        if (keyword) keyword.value = "";

        toolbar.querySelectorAll("[data-monthpicker]").forEach(function (picker) {
            if (typeof picker._monthpickerReset === "function") {
                picker._monthpickerReset();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", function () {
            if (searchBtn.disabled || !hasAnyFilter()) return;
            showResult();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            resetFilters();
            showEmpty();
            syncSearchBtn();
        });
    }

    if (keyword) {
        keyword.addEventListener("input", syncSearchBtn);
    }

    if (toolbar) {
        toolbar.addEventListener("monthpicker:change", syncSearchBtn);

        toolbar.addEventListener("click", function (e) {
            if (!e.target.closest(".c-select__option")) return;
            window.setTimeout(syncSearchBtn, 0);
        });
    }

    syncSearchBtn();
})();
