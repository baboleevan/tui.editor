tui.util.defineNamespace("fedoc.content", {});
fedoc.content["wwTableSelectionManager.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview Implements wysiwyg table selection manager\n * @author Sungho Kim(sungho-kim@nhnent.com) FE Development Lab/NHN Ent.\n * @author Junghwan Park(junghwan.park@nhnent.com) FE Development Lab/NHN Ent.\n */\n\n\nimport domUtils from './domUtils';\nconst TABLE_CELL_SELECTED_CLASS_NAME = 'te-cell-selected';\n\n/**\n * WwTableSelectionManager\n * @exports WwTableSelectionManager\n * @constructor\n * @class WwTableSelectionManager\n * @param {WysiwygEditor} wwe WysiwygEditor instance\n */\nclass WwTableSelectionManager {\n    constructor(wwe) {\n        this.wwe = wwe;\n        this.eventManager = wwe.eventManager;\n\n        /**\n         * Name property\n         * @api\n         * @memberOf WwTableSelectionManager\n         * @type {string}\n         */\n        this.name = 'tableSelection';\n\n        this._init();\n    }\n\n    /**\n     * _init\n     * Initialize\n     * @memberOf WwTableSelectionManager\n     * @private\n     */\n    _init() {\n        this._initEvent();\n\n        // For disable firefox's table tool UI and table resize handler\n        if (tui.util.browser.firefox) {\n            document.execCommand('enableObjectResizing', false, 'false');\n            document.execCommand('enableInlineTableEditing', false, 'false');\n        }\n    }\n\n    /**\n     * _initEvent\n     * Initialize event\n     * @memberOf WwTableSelectionManager\n     * @private\n     */\n    _initEvent() {\n        let selectionStart, selectionEnd;\n\n        /**\n         * Start table selection timer\n         * @type {object}\n         * @private\n         */\n        this._tableSelectionTimer = null;\n        /**\n         * Remove selection timer for Firefox table selection\n         * @type {object}\n         * @private\n         */\n        this._removeSelectionTimer = null;\n        /**\n         * Boolean value for whether selection started\n         * @type {boolean}\n         * @private\n         */\n        this._isSelectionStarted = false;\n\n        this.eventManager.listen('mousedown', ev => {\n            const MOUSE_RIGHT_BUTTON = 2;\n            selectionStart = $(ev.data.target).closest('td,th')[0];\n            const isSelectedCell = $(selectionStart).hasClass(TABLE_CELL_SELECTED_CLASS_NAME);\n            selectionEnd = null;\n\n            if (!isSelectedCell\n                || (isSelectedCell &amp;&amp; ev.data.button !== MOUSE_RIGHT_BUTTON)\n            ) {\n                this.removeClassAttrbuteFromAllCellsIfNeed();\n\n                this._setTableSelectionTimerIfNeed(selectionStart);\n            }\n        });\n\n        this.eventManager.listen('mouseover', ev => {\n            selectionEnd = $(ev.data.target).closest('td,th')[0];\n\n            const range = this.wwe.getEditor().getSelection();\n            const isEndsInTable = $(selectionEnd).parents('table')[0];\n            const isSameCell = selectionStart === selectionEnd;\n            const isTextSelect = this._isTextSelect(range, isSameCell);\n\n            if (this._isSelectionStarted &amp;&amp; isEndsInTable &amp;&amp; (!isTextSelect || isSameCell &amp;&amp; !isTextSelect)) {\n                // For disable firefox's native table cell selection\n                if (tui.util.browser.firefox &amp;&amp; !this._removeSelectionTimer) {\n                    this._removeSelectionTimer = setInterval(() => {\n                        window.getSelection().removeAllRanges();\n                    }, 10);\n                }\n                this._highlightTableCellsBy(selectionStart, selectionEnd);\n            }\n        });\n        this.eventManager.listen('mouseup', ev => {\n            selectionEnd = $(ev.data.target).closest('td,th')[0];\n\n            let range = this.wwe.getEditor().getSelection();\n            const isSameCell = selectionStart === selectionEnd;\n            const isTextSelect = this._isTextSelect(range, isSameCell);\n\n            this._clearTableSelectionTimerIfNeed();\n\n            if (this._isSelectionStarted) {\n                if (isTextSelect) {\n                    this.removeClassAttrbuteFromAllCellsIfNeed();\n                } else {\n                    this.wwe.getManager('table').resetLastCellNode();\n\n                    range = this.wwe.getEditor().getSelection();\n                    range.collapse(true);\n                    this.wwe.getEditor().setSelection(range);\n                }\n            }\n\n            this._isSelectionStarted = false;\n        });\n    }\n\n    /**\n     * Return whether single cell text selection or not\n     * @param {Range} range Range object\n     * @param {boolean} isSameCell Boolean value for same cell selection\n     * @returns {boolean}\n     * @private\n     */\n    _isTextSelect(range, isSameCell) {\n        return /TD|TH|TEXT/i.test(range.commonAncestorContainer.nodeName) &amp;&amp; isSameCell;\n    }\n\n    /**\n     * Set setTimeout and setInterval timer execution if table selecting situation\n     * @param {HTMLElement} selectionStart Start element\n     * @private\n     */\n    _setTableSelectionTimerIfNeed(selectionStart) {\n        const isTableSelecting = $(selectionStart).parents('table').length;\n\n        if (isTableSelecting) {\n            this._tableSelectionTimer = setTimeout(() => {\n                this._isSelectionStarted = true;\n            }, 100);\n        }\n    }\n\n    /**\n     * Clear setTimeout and setInterval timer execution\n     * @private\n     */\n    _clearTableSelectionTimerIfNeed() {\n        clearTimeout(this._tableSelectionTimer);\n        // For disable firefox's native table selection\n        if (tui.util.browser.firefox &amp;&amp; this._removeSelectionTimer) {\n            clearTimeout(this._removeSelectionTimer);\n            this._removeSelectionTimer = null;\n        }\n    }\n\n    /**\n     * Re arrange selection when table does not include both start and end selection element\n     * @param {HTMLElement} selectionStart Start element of selection\n     * @param {HTMLElement} selectionEnd End element of selection\n     * @returns {{startContainer: HTMLElement, endContainer: HTMLElement}}\n     * @private\n     */\n    _reArrangeSelectionIfneed(selectionStart, selectionEnd) {\n        const isRangeStartInTable = $(selectionStart).parents('table').length;\n        const isRangeEndInTable = $(selectionEnd).parents('table').length;\n        const isStartRangeOut = isRangeEndInTable &amp;&amp; !isRangeStartInTable;\n        const isEndRangeOut = !isRangeEndInTable &amp;&amp; isRangeStartInTable;\n\n        if (isStartRangeOut) {\n            selectionStart = $(selectionEnd).parents('table').find('th').first()[0];\n        } else if (isEndRangeOut) {\n            selectionEnd = $(selectionStart).parents('table').find('td').last()[0];\n        }\n\n        return {\n            startContainer: selectionStart,\n            endContainer: selectionEnd\n        };\n    }\n\n    /**\n     * Apply select direction to editor\n     * @param {{startContainer: HTMLElement, endContainer: HTMLElement}} selectionInformation\n     *     Selection start and end element\n     * @param {Range} range Range object\n     * @returns {Range}\n     * @private\n     */\n    _applySelectionDirection(selectionInformation, range) {\n        const nodeOffsetOfParent = domUtils.getNodeOffsetOfParent;\n        const selectionStart = selectionInformation.startContainer;\n        const selectionEnd = selectionInformation.endContainer;\n        const rowDirection = nodeOffsetOfParent($(selectionStart).closest('tr')[0])\n            - nodeOffsetOfParent($(selectionEnd).closest('tr')[0]);\n        const cellDirection = nodeOffsetOfParent(selectionStart) - nodeOffsetOfParent(selectionEnd);\n        const isSameRow = (rowDirection === 0);\n        const isRowIncreases = (rowDirection &lt; 0);\n        const isColumnIncreases = (cellDirection > 0);\n\n        if (isSameRow) {\n            if (isColumnIncreases) {\n                range.setStart(selectionEnd, 0);\n                range.setEnd(selectionStart, 1);\n            } else {\n                range.setStart(selectionStart, 0);\n                range.setEnd(selectionEnd, 1);\n            }\n        } else if (isRowIncreases) {\n            range.setStart(selectionStart, 0);\n            range.setEnd(selectionEnd, 1);\n        } else {\n            range.setStart(selectionEnd, 0);\n            range.setEnd(selectionStart, 1);\n        }\n\n        return range;\n    }\n\n    /**\n     * Get table cell element\n     * @param {Node | HTMLElement} node textNode or table cell element\n     * @returns {HTMLElement}\n     * @private\n     */\n    _getTableCell(node) {\n        return node.nodeType === 3 ? $(node).parent('td,th')[0] : node;\n    }\n\n    /**\n     * Get selection coordinate by current selection\n     * @param {HTMLElement} selectionStart start element\n     * @param {HTMLElement} selectionEnd end element\n     * @returns {{from: {row: number, cell: number}, to: {row: number, cell: number}}}\n     * @memberOf WwTableSelectionManager\n     * @api\n     */\n    getSelectionRangeFromTable(selectionStart, selectionEnd) {\n        const nodeOffsetOfParent = domUtils.getNodeOffsetOfParent;\n        const startRowOffset = nodeOffsetOfParent(selectionStart.parentNode);\n        const endRowOffset = nodeOffsetOfParent(selectionEnd.parentNode);\n        const startCellOffset = nodeOffsetOfParent(selectionStart);\n        const endCellOffset = nodeOffsetOfParent(selectionEnd);\n        const startCellContainer = domUtils.getParentUntil(selectionStart, 'TABLE');\n        const endCellContainer = domUtils.getParentUntil(selectionEnd, 'TABLE');\n        const isReversedTheadAndTbodySelect = (domUtils.getNodeName(startCellContainer) === 'TBODY'\n        &amp;&amp; domUtils.getNodeName(endCellContainer) === 'THEAD');\n        const isTheadAndTbodySelect = startCellContainer !== endCellContainer;\n        const isBothInTbody = !!$(selectionStart).parents('tbody').length &amp;&amp; !!$(selectionEnd).parents('tbody').length;\n        const start = {\n            row: startRowOffset,\n            cell: startCellOffset\n        };\n        const end = {\n            row: endRowOffset,\n            cell: endCellOffset\n        };\n        let from, to;\n\n        if (isReversedTheadAndTbodySelect) {\n            start.row += 1;\n        } else if (isTheadAndTbodySelect) {\n            end.row += 1;\n        } else if (isBothInTbody) {\n            start.row += 1;\n            end.row += 1;\n        }\n\n        if (startRowOffset > endRowOffset\n            || (startRowOffset === endRowOffset &amp;&amp; startCellOffset > endCellOffset)\n        ) {\n            from = end;\n            to = start;\n        } else {\n            from = start;\n            to = end;\n        }\n\n        return {\n            from,\n            to\n        };\n    }\n\n    /**\n     * Highlight selected table cells\n     * @param {HTMLElement} selectionStart start element\n     * @param {HTMLElement} selectionEnd end element\n     * @private\n     */\n    _highlightTableCellsBy(selectionStart, selectionEnd) {\n        const trs = $(selectionStart).parents('table').find('tr');\n        const selection = this.getSelectionRangeFromTable(selectionStart, selectionEnd);\n        const rowFrom = selection.from.row;\n        const cellFrom = selection.from.cell;\n        const rowTo = selection.to.row;\n        const cellTo = selection.to.cell;\n\n        trs.each((rowIndex, row) => {\n            $(row).find('td,th').each((cellIndex, cell) => {\n                const $cell = $(cell);\n                const isFromRow = (rowIndex === rowFrom);\n                const isToRow = (rowIndex === rowTo);\n\n                if ((isFromRow &amp;&amp; cellIndex &lt; cellFrom)\n                    || (isToRow &amp;&amp; cellIndex > cellTo)\n                    || rowIndex &lt; rowFrom\n                    || rowIndex > rowTo\n                ) {\n                    $cell.removeClass(TABLE_CELL_SELECTED_CLASS_NAME);\n                } else {\n                    $cell.addClass(TABLE_CELL_SELECTED_CLASS_NAME);\n                }\n            });\n        });\n    }\n\n    /**\n     * Remove '.te-cell-selected' class from all of table Cell\n     * @memberOf WwTableSelectionManager\n     * @api\n     */\n    removeClassAttrbuteFromAllCellsIfNeed() {\n        this.wwe.get$Body().find(`td.${TABLE_CELL_SELECTED_CLASS_NAME},th.${TABLE_CELL_SELECTED_CLASS_NAME}`)\n            .each((i, node) => {\n                const $node = $(node);\n\n                $node.removeClass(TABLE_CELL_SELECTED_CLASS_NAME);\n\n                if (!$node.attr('class').length) {\n                    $node.removeAttr('class');\n                }\n            });\n    }\n\n    getSelectedCells() {\n        return this.wwe.get$Body().find(`.${TABLE_CELL_SELECTED_CLASS_NAME}`);\n    }\n\n    /**\n     * Create selection by selected cells and collapse that selection to end\n     * @private\n     */\n    createRangeBySelectedCells() {\n        const sq = this.wwe.getEditor();\n        const range = sq.getSelection().cloneRange();\n        const selectedCells = this.getSelectedCells();\n        const tableManager = this.wwe.getManager('table');\n\n        if (selectedCells.length &amp;&amp; tableManager.isInTable(range)) {\n            range.setStart(selectedCells.first()[0], 0);\n            range.setEnd(selectedCells.last()[0], 1);\n            sq.setSelection(range);\n        }\n    }\n}\nmodule.exports = WwTableSelectionManager;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"