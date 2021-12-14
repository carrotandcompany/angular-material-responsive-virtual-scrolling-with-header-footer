// based on https://github.com/angular/components/blob/11.1.x/src/cdk/scrolling/fixed-size-virtual-scroll.ts
// extended by Carrot & Company https://www.cnc.io

import { coerceNumberProperty, NumberInput } from '@angular/cdk/coercion';
import {
  CdkVirtualScrollViewport,
  VirtualScrollStrategy,
  VIRTUAL_SCROLL_STRATEGY,
} from '@angular/cdk/scrolling';
import { Directive, forwardRef, Input, OnChanges } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export class MyVirtualScrollStrategy implements VirtualScrollStrategy {
  private _scrolledIndexChange = new Subject<number>();

  scrolledIndexChange: Observable<number> = this._scrolledIndexChange.pipe(
    distinctUntilChanged()
  );

  private _viewport: CdkVirtualScrollViewport | null = null;
  private _rowSize: number;
  private _minBufferPx: number;
  private _maxBufferPx: number;

  private _cols: number;
  private _offsetHeight = 0;
  private _footerHeight = 0;

  /**
   * @param itemSize The size of the items in the virtually scrolling list.
   * @param minBufferPx The minimum amount of buffer (in pixels) before needing to render more
   * @param maxBufferPx The amount of buffer (in pixels) to render when rendering more.
   */
  constructor(
    itemSize: number,
    offsetHeight: number,
    footerHeight: number,
    cols: number,
    minBufferPx: number,
    maxBufferPx: number
  ) {
    this._rowSize = itemSize;
    this._offsetHeight = offsetHeight;
    this._footerHeight = footerHeight;
    this._cols = cols;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
  }

  /**
   * Attaches this scroll strategy to a viewport.
   * @param viewport The viewport to attach this strategy to.
   */
  attach(viewport: CdkVirtualScrollViewport) {
    this._viewport = viewport;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /** Detaches this scroll strategy from the currently attached viewport. */
  detach() {
    this._scrolledIndexChange.complete();
    this._viewport = null;
  }

  /**
   * Update the item size and buffer size.
   * @param itemSize The size of the items in the virtually scrolling list.
   * @param minBufferPx The minimum amount of buffer (in pixels) before needing to render more
   * @param maxBufferPx The amount of buffer (in pixels) to render when rendering more.
   */
  updateItemAndBufferSize(
    itemSize: number,
    offsetHeight: number,
    footerHeight: number,
    cols: number,
    minBufferPx: number,
    maxBufferPx: number
  ) {
    if (maxBufferPx < minBufferPx) {
      throw Error(
        'CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx'
      );
    }
    this._rowSize = itemSize;
    this._offsetHeight = offsetHeight;
    this._footerHeight = footerHeight;
    this._cols = cols;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  onContentScrolled() {
    this._updateRenderedRange();
  }

  onDataLengthChanged() {
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  onContentRendered() {
    /* no-op */
  }

  onRenderedOffsetChanged() {
    /* no-op */
  }

  /**
   * Scroll to the offset for the given index.
   * @param index The index of the element to scroll to.
   * @param behavior The ScrollBehavior to use when scrolling.
   */
  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    if (this._viewport) {
      // normalize so that scroll position is calculated for first item in row.
      // first calculate the index of the first item in that row
      let normalizedIndex = this._cols * Math.floor(index / this._cols);

      // calculate the px where this first row item is
      // because we have multiple items in a row we need to divide the item size by the num of columns
      let scrollPosition = normalizedIndex * (this._rowSize / this._cols);
      this._viewport.scrollToOffset(scrollPosition, behavior);
    }
  }

  /** Update the viewport's total content size. */
  private _updateTotalContentSize() {
    if (!this._viewport) {
      return;
    }

    let contentSize =
      // again we need to divide the item size by the num of columns to get a proper height based on the item number
      this._viewport.getDataLength() * (this._rowSize / this._cols) +
      // here we added the header offset in pixel so that the scrollbar is the right length
      this._offsetHeight +
      this._footerHeight;
    this._viewport.setTotalContentSize(contentSize);
  }

  /** Update the viewport's rendered range. */
  private _updateRenderedRange() {
    if (!this._viewport) {
      return;
    }
    const renderedRange = this._viewport.getRenderedRange();
    const newRange = { start: renderedRange.start, end: renderedRange.end };
    const viewportSize = this._viewport.getViewportSize();
    const dataLength = this._viewport.getDataLength();
    //  we substracted the header length so that the header moves out of the screen
    let scrollOffset =
      this._viewport.measureScrollOffset() - this._offsetHeight;

    // Prevent NaN as result when dividing by zero and divide by num of columns for the same reason as elsewhere.
    let firstVisibleIndex =
      this._rowSize > 0 ? scrollOffset / (this._rowSize / this._cols) : 0;

    // normalze the firstVisibleIndex to num of cols (firstVisibleIndex should always be first in row)
    firstVisibleIndex = this._cols * Math.floor(firstVisibleIndex / this._cols);

    // If user scrolls to the bottom of the list and data changes to a smaller list
    if (newRange.end > dataLength) {
      // We have to recalculate the first visible index based on new data length and viewport size.
      const maxVisibleItems = Math.ceil(
        viewportSize / (this._rowSize / this._cols)
      );
      const newVisibleIndex = Math.max(
        0,
        Math.min(firstVisibleIndex, dataLength - maxVisibleItems)
      );

      // If first visible index changed we must update scroll offset to handle start/end buffers
      // Current range must also be adjusted to cover the new position (bottom of new list).
      if (firstVisibleIndex != newVisibleIndex) {
        firstVisibleIndex = newVisibleIndex;
        scrollOffset = newVisibleIndex * (this._rowSize / this._cols);
        newRange.start = Math.floor(firstVisibleIndex);
      }

      newRange.end = Math.max(
        0,
        Math.min(dataLength, newRange.start + maxVisibleItems)
      );
    }

    const startBuffer =
      scrollOffset - newRange.start * (this._rowSize / this._cols);
    if (startBuffer < this._minBufferPx && newRange.start != 0) {
      // When the start buffer is empty

      // calc by how many items we should increase the start buffer
      const expandStart = Math.ceil(
        (this._maxBufferPx - startBuffer) / (this._rowSize / this._cols)
      );
      // set the new start index
      newRange.start = Math.max(0, newRange.start - expandStart);
      // set the end index
      newRange.end = Math.min(
        dataLength,
        Math.ceil(
          firstVisibleIndex +
            (viewportSize + this._minBufferPx) / (this._rowSize / this._cols)
        )
      );
    } else {
      // When the end buffer is empty
      const endBuffer =
        newRange.end * (this._rowSize / this._cols) -
        (scrollOffset + viewportSize);
      if (endBuffer < this._minBufferPx && newRange.end != dataLength) {
        const expandEnd = Math.ceil(
          (this._maxBufferPx - endBuffer) / (this._rowSize / this._cols)
        );
        if (expandEnd > 0) {
          newRange.end = Math.min(dataLength, newRange.end + expandEnd);
          newRange.start = Math.max(
            0,
            Math.floor(
              firstVisibleIndex -
                this._minBufferPx / (this._rowSize / this._cols)
            )
          );
        }
      }
    }
    // make sure that the new range does only change on a row level, otherwise
    // items can move across columns when single items are removed from dom instead of
    // whole rows. That's becasue css grid uses the first dom element as first item in the first row.
    newRange.start = this._cols * Math.floor(newRange.start / this._cols);
    newRange.end = this._cols * Math.ceil(newRange.end / this._cols);
    this._viewport.setRenderedRange(newRange);
    this._viewport.setRenderedContentOffset(
      (this._rowSize / this._cols) * newRange.start
    );
    this._scrolledIndexChange.next(Math.floor(firstVisibleIndex));
  }
}

/**
 * Provider factory for `FixedSizeVirtualScrollStrategy` that simply extracts the already created
 * `FixedSizeVirtualScrollStrategy` from the given directive.
 * @param fixedSizeDir The instance of `CdkFixedSizeVirtualScroll` to extract the
 *     `FixedSizeVirtualScrollStrategy` from.
 */
export function _MyVirtualScrollViewportStrategyFactory(
  myVirtualScrollViewportDirective: MyVirtualScrollViewport
) {
  return myVirtualScrollViewportDirective._scrollStrategy;
}

/** A virtual scroll strategy that supports an header element via the offsetHeight. */
@Directive({
  selector: 'cdk-virtual-scroll-viewport[offsetHeight]',
  exportAs: 'virtualScrollingOffset',
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: _MyVirtualScrollViewportStrategyFactory,
      deps: [forwardRef(() => MyVirtualScrollViewport)],
    },
  ],
})
export class MyVirtualScrollViewport implements OnChanges {
  /** The size of the items in the list (in pixels). */
  @Input()
  get rowSize(): number {
    return this._rowSize;
  }
  set rowSize(value: number) {
    this._rowSize = coerceNumberProperty(value);
  }
  _rowSize = 20;

  /** the number of cols eg. from CSS grid which are currently visible */
  @Input()
  get cols(): number {
    return this._cols;
  }
  set cols(value: number) {
    this._cols = coerceNumberProperty(value);
  }
  _cols = 1;

  /**
   * The minimum amount of buffer rendered beyond the viewport (in pixels).
   * If the amount of buffer dips below this number, more items will be rendered. Defaults to 100px.
   */
  @Input()
  get minBufferPx(): number {
    return this._minBufferPx;
  }
  set minBufferPx(value: number) {
    this._minBufferPx = coerceNumberProperty(value);
  }
  _minBufferPx = 100;

  /**
   * The number of pixels worth of buffer to render for when rendering new items. Defaults to 200px.
   */
  @Input()
  get maxBufferPx(): number {
    return this._maxBufferPx;
  }
  set maxBufferPx(value: number) {
    this._maxBufferPx = coerceNumberProperty(value);
  }
  _maxBufferPx = 200;

  /**
   * The number of pixels of the height of an prepended element in the template
   */
  @Input()
  get offsetHeight(): number {
    return this._offsetHeight;
  }
  set offsetHeight(value: number) {
    this._offsetHeight = coerceNumberProperty(value);
  }
  _offsetHeight = 0;

  /**
   * The number of pixels of the height of an appended element in the template
   */
  @Input()
  get footerHeight(): number {
    return this._footerHeight;
  }
  set footerHeight(value: number) {
    this._footerHeight = coerceNumberProperty(value);
  }
  _footerHeight = 0;

  /** The scroll strategy used by this directive. */
  _scrollStrategy = new MyVirtualScrollStrategy(
    this.rowSize,
    this.offsetHeight,
    this.footerHeight,
    this.cols,
    this.minBufferPx,
    this.maxBufferPx
  );

  ngOnChanges() {
    this._scrollStrategy.updateItemAndBufferSize(
      this.rowSize,
      this.offsetHeight,
      this.footerHeight,
      this.cols,
      this.minBufferPx,
      this.maxBufferPx
    );
  }

  // Smooth scrolls to a given index
  scrollToIndex(index: number) {
    this._scrollStrategy.scrollToIndex(index, 'smooth');
  }

  static ngAcceptInputType_rowSize: NumberInput;
  static ngAcceptInputType_offsetHeight: NumberInput;
  static ngAcceptInputType_footerHeight: NumberInput;
  static ngAcceptInputType_minBufferPx: NumberInput;
  static ngAcceptInputType_maxBufferPx: NumberInput;
}
