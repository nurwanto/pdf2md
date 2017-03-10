import ToTextItemBlockTransformation from './ToTextItemBlockTransformation.jsx';
import TextItem from '../TextItem.jsx';
import ParseResult from '../ParseResult.jsx';
import { ADDED_ANNOTATION, REMOVED_ANNOTATION } from '../Annotation.jsx';

import { isNumber } from '../../functions.jsx'

export default class DetectFootnoteOld extends ToTextItemBlockTransformation {

    constructor() {
        super("Detect Footnote ");
    }

    transform(parseResult:ParseResult) {

        var nextFooterNumber = 1;
        var potentialFootnoteItem;
        var foundFootnotes = 0;

        const newContent = parseResult.content.map(page => {
            const newTextItems = [];
            for (var i = 0; i < page.textItems.length; i++) {
                const item = page.textItems[i];
                if (potentialFootnoteItem) {
                    if (potentialFootnoteItem.y - item.y < item.height) {
                        potentialFootnoteItem.annotation = REMOVED_ANNOTATION;
                        item.annotation = REMOVED_ANNOTATION;
                        newTextItems.push(potentialFootnoteItem);
                        newTextItems.push(item);
                        newTextItems.push(new TextItem({
                            x: potentialFootnoteItem.x,
                            y: item.y,
                            width: potentialFootnoteItem.width + item.width,
                            height: item.height,
                            text: '[' + potentialFootnoteItem.text + '] ' + item.text,
                            annotation: ADDED_ANNOTATION
                        }));
                        //TODO repsect multiline!!
                        nextFooterNumber++;
                        foundFootnotes++;
                    }
                    potentialFootnoteItem = null;
                } else if (isNumber(item.text) && parseInt(item.text) == nextFooterNumber && i > 0 && i < page.textItems.length - 1 && page.textItems[i - 1].y !== page.textItems[i + 1].y) {
                    potentialFootnoteItem = item;
                } else {
                    newTextItems.push(item);
                }
            }
            return {
                ...page,
                textItems: newTextItems
            };
        });

        return new ParseResult({
            ...parseResult,
            content: newContent,
            messages: ['Detected ' + foundFootnotes + ' footnotes']
        });
    }

    completeTransform(parseResult:ParseResult) {
        parseResult.content.forEach(page => {
            page.textItems = page.textItems.filter(textItem => !textItem.annotation || textItem.annotation !== REMOVED_ANNOTATION);
            page.textItems.forEach(textItem => textItem.annotation = null)
        });
        return parseResult;
    }

}