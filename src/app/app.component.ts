// Example written by Carrot & Company
// inspired by discussion
// https://github.com/angular/components/issues/10114#issuecomment-806009064

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  VERSION,
  ViewChild,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  items: any[] = [];
  destroy$ = new Subject<void>();
  tabletScreen = false;
  mobileScreen = false;
  offsetHeight: number = 0;
  footerHeight: number = 0;
  cols = 0;

  breakpoints = ['(max-width: 900px)', '(max-width: 500px)'];

  singleItemSize = 120; // needs to be the same as in the SCSS
  rowGap = 10; // needs to be the same as in the SCSS
  rowSize = this.singleItemSize + this.rowGap;

  @ViewChild('virtualScrolling') virtualScrolling: any;
  @ViewChild('scrollViewport') scrollViewport: any;
  @ViewChild('wrapper') wrapper: any;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private changeDetectorRef: ChangeDetectorRef,
  ) {

    this.setNumItems(100);
    this.rowSize = this.singleItemSize + this.rowGap;
    breakpointObserver
      .observe(this.breakpoints)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.tabletScreen = breakpointObserver.isMatched(this.breakpoints[0]);
        this.mobileScreen = breakpointObserver.isMatched(this.breakpoints[1]);

        // by default we have desktop screen with 3 cols. See app.component.scss which needs to fit
        this.cols = 3;
        // 2 columns in tablet mode
        if (this.tabletScreen) {
          this.cols = 2;
        }
        // 1 on mobile phone mode.
        if (this.mobileScreen) {
          this.cols = 1;
        }
      });
  }

  setOffsetHeight(height: number) {
    this.offsetHeight = height;
  }

  setFooterHeight(height: number) {
    this.footerHeight = height;
  }

  setNumItems(numItems: number) {
    this.items = Array.from({length: numItems}).map((_, i) => `Item #${i}`);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
