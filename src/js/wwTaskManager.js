/**
 * @fileoverview Implements wysiwyg task manager
 * @author Sungho Kim(sungho-kim@nhnent.com) FE Development Team/NHN Ent.
 */

import domUtils from './domUtils';

const TASK_CLASS_NAME = 'task-list-item';
const TASK_ATTR_NAME = 'data-te-task';
const TASK_CHECKED_CLASS_NAME = 'checked';

/**
 * WwTaskManager
 * @exports WwTaskManager
 * @class WwTaskManager
 * @constructor
 * @param {WysiwygEditor} wwe WysiwygEditor instance
 */
class WwTaskManager {
    constructor(wwe) {
        this.wwe = wwe;
        this.eventManager = wwe.eventManager;

        /**
         * Name property
         * @api
         * @memberOf WwTaskManager
         * @type {string}
         */
        this.name = 'task';

        this._init();
    }

    /**
     * _init
     * Init
     * @memberOf WwTaskManager
     * @private
     */
    _init() {
        this._initKeyHandler();
        this._initEvent();

        this.wwe.getEditor().addEventListener('mousedown', ev => {
            const isOnTaskBox = ev.offsetX < 18 && ev.offsetY < 18;

            if (ev.target.hasAttribute(TASK_ATTR_NAME) && isOnTaskBox) {
                $(ev.target).toggleClass(TASK_CHECKED_CLASS_NAME);
            }
        });
    }

    /**
     * _initEvent
     * Initialize event
     * @memberOf WwTaskManager
     * @private
     */
    _initEvent() {
        this.eventManager.listen('wysiwygSetValueAfter', () => {
            this._removeTaskListClass();
        });
    }

    /**
     * _initKeyHandler
     * Initialize key event handler
     * @memberOf WwTaskManager
     * @private
     */
    _initKeyHandler() {
        this.wwe.addKeyEventHandler('ENTER', (ev, range) => {
            if (this.isInTaskList(range)) {
                this.wwe.defer(() => {
                    const newRange = this.wwe.getRange();
                    const $li = $(newRange.startContainer).closest('li');
                    $li.removeClass(TASK_CHECKED_CLASS_NAME);
                });
            }
        });
    }

    /**
     * isInTaskList
     * Check whether passed range is in task list or not
     * @param {Range} range range
     * @returns {boolean} result
     * @memberOf WwTaskManager
     * @api
     */
    isInTaskList(range) {
        let li;

        if (!range) {
            range = this.wwe.getEditor().getSelection().cloneRange();
        }

        if (range.startContainer.nodeType === Node.ELEMENT_NODE
            && range.startContainer.tagName === 'LI'
        ) {
            li = range.startContainer;
        } else {
            li = $(range.startContainer).parents('li')[0];
        }

        return $(li).hasClass(TASK_CLASS_NAME);
    }

    /**
     * unformatTask
     * Unforamt task
     * @param {Node} node target
     * @memberOf WwTaskManager
     * @api
     */
    unformatTask(node) {
        const $li = $(node).closest('li');

        $li.removeClass(TASK_CLASS_NAME);
        $li.removeClass(TASK_CHECKED_CLASS_NAME);

        $li.removeAttr(TASK_ATTR_NAME);

        if (!$li.attr('class')) {
            $li.removeAttr('class');
        }
    }

    /**
     * formatTask
     * Format task
     * @param {Node} node target
     * @memberOf WwTaskManager
     * @api
     */
    formatTask(node) {
        const $selected = $(node);
        const $li = $selected.closest('li');

        $li.addClass(TASK_CLASS_NAME);
        $li.attr(TASK_ATTR_NAME, '');
    }

    /**
     * _formatTaskIfNeed
     * Format task if current range has task class name
     * @memberOf WwTaskManager
     * @private
     */
    _formatTaskIfNeed() {
        const range = this.wwe.getEditor().getSelection().cloneRange();

        if (this.isInTaskList(range)) {
            this.formatTask(range.startContainer);
        }
    }

    /**
     * _removeTaskListClass
     * Remove tasklist class
     * @memberOf WwTaskManager
     * @private
     */
    _removeTaskListClass() {
        // because task-list class is block merge normal list and task list
        this.wwe.get$Body().find('.task-list').each((index, node) => {
            $(node).removeClass('task-list');
        });
    }

    /**
     * Return lines in selection
     * @param {Node} start Start element
     * @param {Node} end End element
     * @param {HTMLElement} body Editor body element
     * @returns {Array.<HTMLElement>}
     * @private
     */
    getLinesOfSelection(start, end) {
        const divOrLi = 'DIV,LI';
        const lines = [];
        let isEndPassed = false;
        let needNext = true;
        let nextLine;

        if (domUtils.isTextNode(start)) {
            start = $(start).parents('div').first()[0];
        }

        if (domUtils.isTextNode(end)) {
            end = $(end).parents('div').first()[0];
        }


        for (let line = start; needNext; line = nextLine) {
            if ($(line).is(divOrLi)) {
                lines.push(line);

                if (line === end || line.parentNode === end) {
                    isEndPassed = true;
                }

                const isStartInList = $(start).is('li') || ($(start).parent('li').length !== 0);
                nextLine = this._getNextLine(line, isStartInList, isEndPassed);
            } else {
                break;
            }

            needNext = nextLine && !isEndPassed;
        }

        return lines;
    }

    /**
     * Get next line element
     * @param {HTMLElement} line Current line element
     * @param {boolean} isStartInList Boolean value of start in list
     * @param {boolean} isEndPassed Boolean value of end element passed
     * @returns {HTMLElement|undefined}
     * @private
     */
    _getNextLine(line, isStartInList, isEndPassed) {
        let nextLine;
        if (isStartInList && line.parentNode.tagName === 'LI') {
            const $nextLI = $(line).parent().next();

            nextLine = $nextLI.children('div').first()[0];

            const hasNextLiHaveDivChild = $nextLI[0] && !nextLine;
            const isLastLiInList = !$nextLI[0] && !nextLine;
            if (hasNextLiHaveDivChild) {
                nextLine = $nextLI[0];
            } else if (isLastLiInList && !isEndPassed) {
                nextLine = $(line).parents('ol,ul').first().next()[0];
            }
        } else {
            nextLine = line.nextElementSibling;
        }

        return nextLine;
    }
}

module.exports = WwTaskManager;
